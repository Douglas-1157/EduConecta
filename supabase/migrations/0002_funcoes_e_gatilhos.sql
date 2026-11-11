-- Funções auxiliares, gatilhos e regras de negócio (nota, liberação) -----------

create or replace function papel_atual() returns papel
language sql stable security definer set search_path = public as $$
  select papel from profiles where id = auth.uid() and status = 'ativo'
$$;

create or replace function eh_equipe() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(papel_atual() in ('professor','gestao'), false)
$$;

create or replace function eh_gestao() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(papel_atual() = 'gestao', false)
$$;

create or replace function turma_atual() returns uuid
language sql stable security definer set search_path = public as $$
  select turma_id from profiles where id = auth.uid() and status = 'ativo'
$$;

-- Novo usuário => perfil pendente (sempre aluno; professores e gestão são promovidos pela gestão)
create or replace function criar_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
declare t uuid;
begin
  begin
    t := nullif(new.raw_user_meta_data->>'turma_id','')::uuid;
  exception when others then t := null;
  end;
  if t is not null and not exists (select 1 from turmas where id = t) then t := null; end if;
  insert into profiles (id, nome, matricula, turma_id)
  values (new.id,
          coalesce(nullif(trim(new.raw_user_meta_data->>'nome'),''), split_part(new.email,'@',1)),
          nullif(trim(new.raw_user_meta_data->>'matricula'),''),
          t);
  return new;
end $$;

create trigger ao_criar_usuario after insert on auth.users
for each row execute function criar_perfil();

-- Só a gestão altera papel, status e turma de alguém
create or replace function proteger_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;   -- service role / SQL Editor
  if not eh_gestao() then
    new.papel := old.papel; new.status := old.status; new.turma_id := old.turma_id;
    new.matricula := old.matricula;
  end if;
  return new;
end $$;
create trigger proteger_perfil before update on profiles
for each row execute function proteger_perfil();

-- Aluno não mexe nos campos de correção da redação
create or replace function proteger_redacao() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.atualizado_em := now();
  if auth.uid() is null or eh_equipe() then
    if new.status = 'corrigida' and old.status <> 'corrigida' then
      new.corrigida_em := now();
      new.corretor_id := coalesce(new.corretor_id, auth.uid());
    end if;
    return new;
  end if;
  if old.status = 'corrigida' then raise exception 'Redação já corrigida não pode ser alterada.'; end if;
  new.c1 := old.c1; new.c2 := old.c2; new.c3 := old.c3; new.c4 := old.c4; new.c5 := old.c5;
  new.comentario := old.comentario; new.corretor_id := old.corretor_id; new.corrigida_em := old.corrigida_em;
  new.aluno_id := old.aluno_id; new.tema_id := old.tema_id;
  if new.status = 'corrigida' then new.status := old.status; end if;
  if new.status = 'enviada' and old.status <> 'enviada' then new.enviada_em := now(); end if;
  return new;
end $$;
create trigger proteger_redacao before update on redacoes
for each row execute function proteger_redacao();

create or replace function marcar_envio_redacao() returns trigger
language plpgsql as $$
begin
  if new.status = 'enviada' and new.enviada_em is null then new.enviada_em := now(); end if;
  return new;
end $$;
create trigger marcar_envio_redacao before insert on redacoes
for each row execute function marcar_envio_redacao();

-- Trava progressiva ----------------------------------------------------------
-- Um item está liberado se a turma não usa trava ou se todos os itens anteriores
-- da mesma disciplina (na ordem de módulo e item) já foram concluídos pelo aluno.
create or replace function item_liberado(p_aluno uuid, p_item uuid) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare d uuid; mo int; io int; trava boolean;
begin
  select m.disciplina_id, m.ordem, i.ordem into d, mo, io
    from itens i join modulos m on m.id = i.modulo_id where i.id = p_item;
  if d is null then return false; end if;
  select coalesce(t.trava_progressiva, true) into trava
    from profiles p left join turmas t on t.id = p.turma_id where p.id = p_aluno;
  if not coalesce(trava, true) then return true; end if;
  return not exists (
    select 1 from itens i2 join modulos m2 on m2.id = i2.modulo_id
    join item_turmas it on it.item_id = i2.id
    join profiles p on p.id = p_aluno and p.turma_id = it.turma_id
    where m2.disciplina_id = d and i2.publicado
      and (m2.ordem, i2.ordem, i2.id::text) < (mo, io, p_item::text)
      and not exists (select 1 from progresso g where g.aluno_id = p_aluno and g.item_id = i2.id and g.concluido_em is not null)
  );
end $$;

-- Simulados: o gabarito nunca chega ao aluno antes da entrega ------------------
create or replace function iniciar_tentativa(p_simulado uuid, p_treino boolean default false) returns uuid
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); tid uuid; it uuid;
begin
  if papel_atual() is distinct from 'aluno' then raise exception 'Apenas alunos fazem simulados.'; end if;
  if not exists (select 1 from simulado_turmas st where st.simulado_id = p_simulado and st.turma_id = turma_atual()) then
    raise exception 'Simulado não disponível para a sua turma.';
  end if;
  select i.id into it from itens i where i.simulado_id = p_simulado and i.publicado limit 1;
  if it is not null and not item_liberado(uid, it) then
    raise exception 'Conclua as etapas anteriores da trilha para liberar este simulado.';
  end if;
  if not p_treino then
    select id into tid from tentativas where aluno_id = uid and simulado_id = p_simulado and not treino;
    if tid is not null then
      if exists (select 1 from tentativas where id = tid and finalizada_em is not null) then
        raise exception 'Você já fez este simulado. Use o modo treino para repetir.';
      end if;
      return tid;   -- retoma a tentativa em andamento
    end if;
  end if;
  insert into tentativas (aluno_id, simulado_id, treino) values (uid, p_simulado, p_treino) returning id into tid;
  return tid;
end $$;

create or replace function questoes_da_tentativa(p_tentativa uuid)
returns table (questao_id uuid, ordem int, enunciado text, alternativas jsonb, competencia text, marcada smallint)
language sql stable security definer set search_path = public as $$
  select q.id, sq.ordem, q.enunciado, q.alternativas, c.nome, r.marcada
  from tentativas t
  join simulado_questoes sq on sq.simulado_id = t.simulado_id
  join questoes q on q.id = sq.questao_id
  left join competencias c on c.id = q.competencia_id
  left join respostas r on r.tentativa_id = t.id and r.questao_id = q.id
  where t.id = p_tentativa and t.aluno_id = auth.uid() and t.finalizada_em is null
  order by sq.ordem
$$;

create or replace function responder_questao(p_tentativa uuid, p_questao uuid, p_marcada smallint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from tentativas t join simulado_questoes sq on sq.simulado_id = t.simulado_id and sq.questao_id = p_questao
    where t.id = p_tentativa and t.aluno_id = auth.uid() and t.finalizada_em is null) then
    raise exception 'Tentativa inválida ou já finalizada.';
  end if;
  insert into respostas (tentativa_id, questao_id, marcada) values (p_tentativa, p_questao, p_marcada)
  on conflict (tentativa_id, questao_id) do update set marcada = excluded.marcada;
end $$;

-- Nota de 0 a 1000: média ponderada do aproveitamento por competência
create or replace function finalizar_tentativa(p_tentativa uuid) returns int
language plpgsql security definer set search_path = public as $$
declare t tentativas; v_nota numeric; v_ac int; v_tot int; it uuid;
begin
  select * into t from tentativas where id = p_tentativa and aluno_id = auth.uid();
  if t.id is null then raise exception 'Tentativa não encontrada.'; end if;
  if t.finalizada_em is not null then return t.nota; end if;

  with q as (
    select sq.questao_id, coalesce(c.id, '00000000-0000-0000-0000-000000000000'::uuid) as cid,
           coalesce(c.peso, 1) as peso, (r.marcada is not distinct from qq.correta) as acertou
    from simulado_questoes sq join questoes qq on qq.id = sq.questao_id
    left join competencias c on c.id = qq.competencia_id
    left join respostas r on r.tentativa_id = t.id and r.questao_id = sq.questao_id
    where sq.simulado_id = t.simulado_id),
  g as (select cid, max(peso) as peso, count(*) as tot, count(*) filter (where acertou) as ac from q group by cid)
  select (select sum(peso * ac::numeric / tot) / nullif(sum(peso),0) from g) * 1000,
         (select coalesce(sum(ac),0) from g), (select coalesce(sum(tot),0) from g)
    into v_nota, v_ac, v_tot;

  update tentativas set finalizada_em = now(), nota = round(coalesce(v_nota,0)), acertos = v_ac, total = v_tot
   where id = t.id;

  if not t.treino then
    select i.id into it from itens i where i.simulado_id = t.simulado_id and i.publicado limit 1;
    if it is not null then
      insert into progresso (aluno_id, item_id, pct, concluido_em) values (t.aluno_id, it, 100, now())
      on conflict (aluno_id, item_id) do update set pct = 100, concluido_em = coalesce(progresso.concluido_em, now()), atualizado_em = now();
    end if;
  end if;
  return round(coalesce(v_nota,0))::int;
end $$;

create or replace function gabarito_da_tentativa(p_tentativa uuid)
returns table (questao_id uuid, ordem int, enunciado text, alternativas jsonb, correta smallint, comentario text, marcada smallint, competencia text)
language sql stable security definer set search_path = public as $$
  select q.id, sq.ordem, q.enunciado, q.alternativas, q.correta, q.comentario, r.marcada, c.nome
  from tentativas t
  join simulado_questoes sq on sq.simulado_id = t.simulado_id
  join questoes q on q.id = sq.questao_id
  left join competencias c on c.id = q.competencia_id
  left join respostas r on r.tentativa_id = t.id and r.questao_id = q.id
  where t.id = p_tentativa and t.finalizada_em is not null and (t.aluno_id = auth.uid() or eh_equipe())
  order by sq.ordem
$$;

-- Conclusão de aula/apostila ---------------------------------------------------
create or replace function registrar_progresso(p_item uuid, p_pct smallint) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); mins int; ja timestamptz;
begin
  if papel_atual() is distinct from 'aluno' then raise exception 'Apenas alunos registram progresso.'; end if;
  if not exists (select 1 from itens i join item_turmas it on it.item_id = i.id
                 where i.id = p_item and i.publicado and i.tipo <> 'sim' and it.turma_id = turma_atual()) then
    raise exception 'Item não disponível.';
  end if;
  if not item_liberado(uid, p_item) then raise exception 'Etapa ainda bloqueada.'; end if;
  select concluido_em into ja from progresso where aluno_id = uid and item_id = p_item;
  insert into progresso (aluno_id, item_id, pct, concluido_em)
  values (uid, p_item, least(100, greatest(0, p_pct)), case when p_pct >= 100 then now() end)
  on conflict (aluno_id, item_id) do update
    set pct = greatest(progresso.pct, excluded.pct),
        concluido_em = coalesce(progresso.concluido_em, excluded.concluido_em),
        atualizado_em = now();
  if p_pct >= 100 and ja is null then
    select minutos into mins from itens where id = p_item;
    insert into sessoes_estudo (aluno_id, minutos, origem) values (uid, greatest(1, least(600, coalesce(mins, 10))), 'conteudo');
  end if;
end $$;

-- Painel de acompanhamento (equipe) -------------------------------------------
create or replace view painel_alunos with (security_invoker = true) as
select p.id, p.nome, p.turma_id, p.meta_semanal_min,
  coalesce((select sum(s.minutos) from sessoes_estudo s where s.aluno_id = p.id and s.feito_em >= date_trunc('week', now())), 0)::int as min_semana,
  (select max(s.feito_em) from sessoes_estudo s where s.aluno_id = p.id) as ultimo_estudo,
  (select round(avg(t.nota)) from tentativas t where t.aluno_id = p.id and t.finalizada_em is not null and not t.treino)::int as media
from profiles p where p.papel = 'aluno' and p.status = 'ativo';

-- Quantidade de questões de um simulado (o aluno não lê a tabela de questões)
create or replace function contar_questoes(p_simulado uuid) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from simulado_questoes sq
  where sq.simulado_id = p_simulado
    and (eh_equipe() or exists (select 1 from simulado_turmas st where st.simulado_id = p_simulado and st.turma_id = turma_atual()))
$$;
