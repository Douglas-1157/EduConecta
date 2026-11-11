-- Professor enxerga só as turmas em que leciona -------------------------------
-- Regra: gestão vê tudo. Professor com turmas vinculadas vê só os alunos dessas turmas.
-- Professor SEM nenhum vínculo ainda continua vendo tudo (transição: vincule e passa a valer).

create table if not exists professor_turmas (
  professor_id uuid not null references profiles(id) on delete cascade,
  turma_id uuid not null references turmas(id) on delete cascade,
  primary key (professor_id, turma_id)
);
alter table professor_turmas enable row level security;
create policy pt_ver on professor_turmas for select to authenticated using (professor_id = auth.uid() or eh_gestao());
create policy pt_gestao on professor_turmas for all to authenticated using (eh_gestao()) with check (eh_gestao());

create or replace function pode_ver_aluno(p_aluno uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when p_aluno = auth.uid() then true
    when papel_atual() = 'gestao' then true
    when papel_atual() = 'professor' then
      not exists (select 1 from professor_turmas where professor_id = auth.uid())
      or exists (select 1 from profiles a join professor_turmas pt on pt.turma_id = a.turma_id
                 where a.id = p_aluno and pt.professor_id = auth.uid())
    else false end
$$;
grant execute on function pode_ver_aluno(uuid) to authenticated;

drop policy perfis_ver on profiles;
create policy perfis_ver on profiles for select to authenticated using (id = auth.uid() or (eh_equipe() and (papel <> 'aluno' or pode_ver_aluno(id))));
drop policy progresso_ver on progresso;
create policy progresso_ver on progresso for select to authenticated using (pode_ver_aluno(aluno_id));
drop policy sessoes_ver on sessoes_estudo;
create policy sessoes_ver on sessoes_estudo for select to authenticated using (pode_ver_aluno(aluno_id));
drop policy tentativas_ver on tentativas;
create policy tentativas_ver on tentativas for select to authenticated using (pode_ver_aluno(aluno_id));
drop policy respostas_ver on respostas;
create policy respostas_ver on respostas for select to authenticated
  using (exists (select 1 from tentativas t where t.id = respostas.tentativa_id
    and ((t.aluno_id = auth.uid() and t.finalizada_em is not null) or (t.aluno_id <> auth.uid() and pode_ver_aluno(t.aluno_id)))));
drop policy redacoes_ver on redacoes;
create policy redacoes_ver on redacoes for select to authenticated using (pode_ver_aluno(aluno_id));
drop policy redacoes_equipe on redacoes;
create policy redacoes_equipe on redacoes for update to authenticated using (eh_equipe() and pode_ver_aluno(aluno_id)) with check (eh_equipe() and pode_ver_aluno(aluno_id));
drop policy duvidas_ver on duvidas;
create policy duvidas_ver on duvidas for select to authenticated using (pode_ver_aluno(aluno_id));
drop policy duvidas_responder on duvidas;
create policy duvidas_responder on duvidas for update to authenticated using (eh_equipe() and pode_ver_aluno(aluno_id)) with check (eh_equipe() and pode_ver_aluno(aluno_id));
