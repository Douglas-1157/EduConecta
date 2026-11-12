-- Aviso de "dúvida respondida" para o aluno ----------------------------------
alter table duvidas add column if not exists visto_em timestamptz;
-- respostas que já existem contam como vistas (só as novas geram aviso)
update duvidas set visto_em = now() where status = 'respondida' and visto_em is null;

create or replace function marcar_duvidas_vistas() returns void
language sql security definer set search_path = public as $$
  update duvidas set visto_em = now()
  where aluno_id = auth.uid() and status = 'respondida' and visto_em is null
$$;
revoke all on function marcar_duvidas_vistas() from public, anon;
grant execute on function marcar_duvidas_vistas() to authenticated;
