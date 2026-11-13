-- Disciplina de cada professor (informativa: aparece no cabeçalho e já vem
-- selecionada nos formulários). Rode no SQL Editor do Supabase.
alter table profiles add column if not exists disciplina_id uuid references disciplinas(id) on delete set null;
