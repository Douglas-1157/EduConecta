-- Depois de criar a sua conta pelo site (tela "Criar conta"), rode isto no SQL Editor
-- trocando o e-mail, para virar a primeira pessoa da gestão da escola.
update profiles set papel = 'gestao', status = 'ativo'
where id = (select id from auth.users where email = 'SEU-EMAIL-AQUI');

-- Se você já tinha contas criadas em Authentication > Users antes de rodar o esquema novo,
-- crie o perfil delas (todas entram como aluno pendente; depois promova quem precisar):
insert into profiles (id, nome)
select u.id, coalesce(nullif(u.raw_user_meta_data->>'nome',''), split_part(u.email,'@',1))
from auth.users u where not exists (select 1 from profiles p where p.id = u.id);
