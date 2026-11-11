-- Arquivos (apostilas em PDF): bucket privado, enviado pela equipe, lido por quem está logado
insert into storage.buckets (id, name, public) values ('conteudo','conteudo', false) on conflict (id) do nothing;

create policy conteudo_ler on storage.objects for select to authenticated
  using (bucket_id = 'conteudo' and papel_atual() is not null);
create policy conteudo_enviar on storage.objects for insert to authenticated
  with check (bucket_id = 'conteudo' and eh_equipe());
create policy conteudo_alterar on storage.objects for update to authenticated
  using (bucket_id = 'conteudo' and eh_equipe());
create policy conteudo_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'conteudo' and eh_equipe());
