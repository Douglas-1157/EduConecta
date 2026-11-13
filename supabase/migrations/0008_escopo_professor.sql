-- Professor só enxerga e publica nas turmas vinculadas; sem vínculo = sem acesso a alunos/turmas.
-- ANTES de rodar: vincule cada professor às suas turmas (Gestão → Cadastros → "Turmas de cada professor").

create or replace function pode_ver_aluno(p_aluno uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when p_aluno = auth.uid() then true
    when papel_atual() = 'gestao' then true
    when papel_atual() = 'professor' then
      exists (select 1 from profiles a join professor_turmas pt on pt.turma_id = a.turma_id
              where a.id = p_aluno and pt.professor_id = auth.uid())
    else false end
$$;

create or replace function pode_turma(p_turma uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when papel_atual() = 'gestao' then true
    when papel_atual() = 'professor' then
      exists (select 1 from professor_turmas where professor_id = auth.uid() and turma_id = p_turma)
    else false end
$$;
grant execute on function pode_turma(uuid) to authenticated;

drop policy item_turmas_equipe on item_turmas;
create policy item_turmas_equipe on item_turmas for all to authenticated
  using (eh_equipe() and pode_turma(turma_id)) with check (eh_equipe() and pode_turma(turma_id));
drop policy simulado_turmas_equipe on simulado_turmas;
create policy simulado_turmas_equipe on simulado_turmas for all to authenticated
  using (eh_equipe() and pode_turma(turma_id)) with check (eh_equipe() and pode_turma(turma_id));
drop policy tema_turmas_equipe on redacao_tema_turmas;
create policy tema_turmas_equipe on redacao_tema_turmas for all to authenticated
  using (eh_equipe() and pode_turma(turma_id)) with check (eh_equipe() and pode_turma(turma_id));
