-- EduConecta · Esquenta pro ENEM — esquema do banco (uma escola)
-- Execute os arquivos 0001 a 0004 em ordem no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create type papel as enum ('aluno','professor','gestao');
create type status_cadastro as enum ('pendente','ativo','recusado');
create type tipo_item as enum ('video','pdf','sim');
create type area_enem as enum ('humanas','linguagens','matematica','natureza','redacao');
create type status_duvida as enum ('pendente','respondida');
create type status_redacao as enum ('rascunho','enviada','corrigida');

-- Pessoas e turmas -----------------------------------------------------------
create table turmas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  turno text,
  trava_progressiva boolean not null default true,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  papel papel not null default 'aluno',
  status status_cadastro not null default 'pendente',
  turma_id uuid references turmas(id) on delete set null,
  matricula text,
  meta_semanal_min int not null default 300 check (meta_semanal_min between 30 and 3000),
  created_at timestamptz not null default now()
);
create index on profiles (turma_id);
create index on profiles (status);

-- Conteúdo -------------------------------------------------------------------
create table disciplinas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  area area_enem not null,
  ordem int not null default 0
);

create table competencias (
  id uuid primary key default gen_random_uuid(),
  area area_enem not null,
  codigo text not null,
  nome text not null,
  peso numeric(4,2) not null default 1 check (peso > 0),
  unique (area, codigo)
);

create table modulos (
  id uuid primary key default gen_random_uuid(),
  disciplina_id uuid not null references disciplinas(id) on delete cascade,
  nome text not null,
  ordem int not null default 0
);
create index on modulos (disciplina_id, ordem);

create table questoes (
  id uuid primary key default gen_random_uuid(),
  disciplina_id uuid not null references disciplinas(id) on delete restrict,
  competencia_id uuid references competencias(id) on delete set null,
  enunciado text not null,
  alternativas jsonb not null check (jsonb_typeof(alternativas) = 'array' and jsonb_array_length(alternativas) between 2 and 6),
  correta smallint not null check (correta between 0 and 5),
  comentario text,
  criado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on questoes (disciplina_id);

create table simulados (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  disciplina_id uuid references disciplinas(id) on delete set null,
  minutos int not null default 30 check (minutos between 5 and 300),
  criado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table simulado_questoes (
  simulado_id uuid not null references simulados(id) on delete cascade,
  questao_id uuid not null references questoes(id) on delete restrict,
  ordem int not null default 0,
  primary key (simulado_id, questao_id)
);

create table simulado_turmas (
  simulado_id uuid not null references simulados(id) on delete cascade,
  turma_id uuid not null references turmas(id) on delete cascade,
  prazo date,
  primary key (simulado_id, turma_id)
);

create table itens (
  id uuid primary key default gen_random_uuid(),
  modulo_id uuid not null references modulos(id) on delete cascade,
  tipo tipo_item not null,
  titulo text not null,
  minutos int not null default 20 check (minutos > 0),
  competencia_id uuid references competencias(id) on delete set null,
  url text,                       -- link do vídeo (YouTube) ou do arquivo
  arquivo_path text,              -- caminho no Storage (apostilas em PDF)
  simulado_id uuid references simulados(id) on delete set null,
  ordem int not null default 0,
  publicado boolean not null default true,
  criado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (tipo <> 'sim' or simulado_id is not null or not publicado)
);
create index on itens (modulo_id, ordem);

create table item_turmas (
  item_id uuid not null references itens(id) on delete cascade,
  turma_id uuid not null references turmas(id) on delete cascade,
  prazo date,
  primary key (item_id, turma_id)
);

-- Progresso e simulados feitos ------------------------------------------------
create table progresso (
  aluno_id uuid not null references profiles(id) on delete cascade,
  item_id uuid not null references itens(id) on delete cascade,
  pct smallint not null default 0 check (pct between 0 and 100),
  concluido_em timestamptz,
  atualizado_em timestamptz not null default now(),
  primary key (aluno_id, item_id)
);

create table sessoes_estudo (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references profiles(id) on delete cascade,
  minutos int not null check (minutos between 1 and 600),
  origem text not null default 'foco',
  feito_em timestamptz not null default now()
);
create index on sessoes_estudo (aluno_id, feito_em desc);

create table tentativas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references profiles(id) on delete cascade,
  simulado_id uuid not null references simulados(id) on delete cascade,
  treino boolean not null default false,
  iniciada_em timestamptz not null default now(),
  finalizada_em timestamptz,
  nota int check (nota between 0 and 1000),
  acertos int,
  total int
);
create index on tentativas (aluno_id, simulado_id);
-- só uma tentativa oficial por aluno e simulado
create unique index tentativa_oficial_unica on tentativas (aluno_id, simulado_id) where not treino;

create table respostas (
  tentativa_id uuid not null references tentativas(id) on delete cascade,
  questao_id uuid not null references questoes(id) on delete restrict,
  marcada smallint check (marcada between 0 and 5),
  primary key (tentativa_id, questao_id)
);

-- Redação (corrigida pelo professor, 5 competências de 0 a 200) --------------
create table redacao_temas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  enunciado text,
  prazo date,
  criado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table redacao_tema_turmas (
  tema_id uuid not null references redacao_temas(id) on delete cascade,
  turma_id uuid not null references turmas(id) on delete cascade,
  primary key (tema_id, turma_id)
);

create table redacoes (
  id uuid primary key default gen_random_uuid(),
  tema_id uuid not null references redacao_temas(id) on delete cascade,
  aluno_id uuid not null references profiles(id) on delete cascade,
  texto text not null default '',
  status status_redacao not null default 'rascunho',
  enviada_em timestamptz,
  corrigida_em timestamptz,
  corretor_id uuid references profiles(id) on delete set null,
  c1 smallint check (c1 between 0 and 200 and c1 % 40 = 0),
  c2 smallint check (c2 between 0 and 200 and c2 % 40 = 0),
  c3 smallint check (c3 between 0 and 200 and c3 % 40 = 0),
  c4 smallint check (c4 between 0 and 200 and c4 % 40 = 0),
  c5 smallint check (c5 between 0 and 200 and c5 % 40 = 0),
  comentario text,
  nota int generated always as (coalesce(c1,0)+coalesce(c2,0)+coalesce(c3,0)+coalesce(c4,0)+coalesce(c5,0)) stored,
  atualizado_em timestamptz not null default now(),
  unique (tema_id, aluno_id)
);
create index on redacoes (status, enviada_em);

-- Dúvidas --------------------------------------------------------------------
create table duvidas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references profiles(id) on delete cascade,
  contexto text,                   -- ex.: "Aula · Era Vargas"
  item_id uuid references itens(id) on delete set null,
  mensagem text not null check (length(mensagem) between 3 and 2000),
  resposta text,
  respondida_por uuid references profiles(id) on delete set null,
  status status_duvida not null default 'pendente',
  created_at timestamptz not null default now(),
  respondida_em timestamptz
);
create index on duvidas (status, created_at);

create table respostas_salvas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references profiles(id) on delete cascade,
  texto text not null check (length(texto) between 3 and 1000)
);

-- Biblioteca: cursos gratuitos e repertório (links externos escolhidos pela equipe)
create table recursos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('curso','repertorio')),
  categoria text not null default 'Geral',     -- disciplina/área ou tipo de repertório (Atualidades, Filmes e livros...)
  titulo text not null,
  descricao text,
  carga text,
  url text not null check (url ~ '^https?://'),
  criado_por uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
