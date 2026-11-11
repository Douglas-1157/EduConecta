-- Endurecimento de segurança (revisão OWASP) -----------------------------------

-- 1) Apostilas: aluno só lê o arquivo de um item que ele mesmo consegue ver (já filtrado por turma/publicação
--    pela política de "itens"). Antes, qualquer logado podia listar e baixar todo o bucket.
drop policy if exists conteudo_ler on storage.objects;
create policy conteudo_ler on storage.objects for select to authenticated
  using (bucket_id = 'conteudo' and (eh_equipe() or exists (select 1 from itens i where i.arquivo_path = storage.objects.name)));

-- 2) Gabarito: professor só abre tentativa de aluno das suas turmas
create or replace function gabarito_da_tentativa(p_tentativa uuid)
returns table (questao_id uuid, ordem int, enunciado text, alternativas jsonb, correta smallint, comentario text, marcada smallint, competencia text)
language sql stable security definer set search_path = public as $$
  select q.id, sq.ordem, q.enunciado, q.alternativas, q.correta, q.comentario, r.marcada, c.nome
  from tentativas t
  join simulado_questoes sq on sq.simulado_id = t.simulado_id
  join questoes q on q.id = sq.questao_id
  left join competencias c on c.id = q.competencia_id
  left join respostas r on r.tentativa_id = t.id and r.questao_id = q.id
  where t.id = p_tentativa and t.finalizada_em is not null
    and (t.aluno_id = auth.uid() or (eh_equipe() and pode_ver_aluno(t.aluno_id)))
  order by sq.ordem
$$;

-- 3) Limites de tamanho de texto (evita abuso/lotação do banco)
alter table redacoes add constraint redacoes_texto_max check (length(texto) <= 20000) not valid;
alter table profiles add constraint profiles_nome_max check (length(nome) <= 120) not valid;
