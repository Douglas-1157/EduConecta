-- ATENÇÃO: APAGA as tabelas criadas antes (escolas, usuarios, matriculas, trilhas_*, conteudos_aulas, banco_questoes...).
-- Rode SOMENTE se o banco ainda não tem dados que você queira guardar. Depois rode 0001 a 0004 e seed_base.sql.
-- Contas de login (Authentication > Users) NÃO são apagadas.

-- 1) gatilhos antigos em auth.users (ex.: o que criava linhas em "usuarios") conflitam com o novo cadastro
do $$ declare t record; begin
  for t in select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal loop
    execute format('drop trigger if exists %I on auth.users', t.tgname);
  end loop;
end $$;

-- 2) tabelas antigas
drop table if exists
  notificacoes, duvidas, tempo_estudo_pomodoro, respostas_simulado, tentativas_simulado, simulado_questoes, simulados,
  questoes_alternativas, banco_questoes, progresso_aulas, conteudos_aulas, progresso_trilhas, trilhas_etapas, trilhas_modulos,
  disciplinas, matriculas, usuarios, turmas, escolas
cascade;

-- 3) tipos antigos
drop type if exists perfil_enum, status_matricula_enum, status_progresso_enum, status_publicacao_enum, status_tentativa_enum, status_duvida_enum cascade;
-- (tipos sem nome conhecido, usados em trilhas_etapas.tipo e conteudos_aulas.tipo, ficam órfãos e não atrapalham)
