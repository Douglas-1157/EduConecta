# EduConecta · Esquenta pro ENEM

Plataforma de estudos para o ENEM de **uma escola**: trilhas, apostilas, simulados, banco de questões, redação corrigida pelo professor, dúvidas e acompanhamento. Perfis: **aluno**, **professor** e **gestão da escola**.

**Stack:** Next.js 15 (App Router, TypeScript) · Supabase (Postgres, Auth, Storage, RLS) · deploy na Vercel.

## 1. Criar o projeto no Supabase

1. Crie um projeto em <https://supabase.com> (plano gratuito serve para uma escola).
2. Em **SQL Editor**, rode os arquivos **nesta ordem** (copiar e colar). Se já criou tabelas antes (escolas, usuarios...), rode primeiro `supabase/00_limpar_esquema_antigo.sql`, que apaga o esquema antigo:
   1. `supabase/migrations/0001_schema.sql`
   2. `supabase/migrations/0002_funcoes_e_gatilhos.sql`
   3. `supabase/migrations/0003_seguranca_rls.sql`
   4. `supabase/migrations/0004_storage.sql`
   5. `supabase/seed_base.sql` (disciplinas e competências do ENEM)
   6. *(opcional, só para testar)* `supabase/seed_exemplo.sql` (turmas 3º A/3º B e a trilha de História do protótipo). **Não rode em produção real**: crie as turmas e o conteúdo pelo sistema.
3. Em **Authentication → Providers → Email**: decida se exige confirmação de e-mail. Para escola, costuma ser mais simples **desligar** "Confirm email" (a gestão já aprova cada cadastro).
4. Em **Project Settings → API**, copie a URL, a chave `anon` e a chave `service_role`.

## 2. Rodar no computador

```bash
cp .env.example .env.local     # preencha as 3 variáveis
npm install
npm run dev                    # http://localhost:3000
```

A chave `service_role` **nunca** vai para o navegador nem para o GitHub: ela só é usada no servidor, para a gestão criar contas de professores.

## 3. Primeiro acesso (gestão)

1. No site, clique em **Criar conta** e cadastre-se normalmente.
2. No SQL Editor, rode `supabase/primeiro_admin.sql` com o seu e-mail. Você passa a ser a gestão.
3. Entre → **Turmas e equipe** → crie as turmas. Depois **Cadastros** → cadastre os professores (e-mail + senha provisória).
4. Alunos usam **Criar conta** e escolhem a turma; a gestão aprova em **Cadastros**.

## 4. Publicar (Vercel)

1. Suba o projeto para o GitHub e importe na Vercel.
2. Em **Settings → Environment Variables**, cadastre `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`.
3. No Supabase, em **Authentication → URL Configuration**, coloque o endereço da Vercel em *Site URL*.

## Como o sistema funciona

| Perfil | Pode |
|---|---|
| **Aluno** | Seguir trilhas (trava progressiva), assistir/ler, fazer simulados, escrever redações, tirar dúvidas, usar o cronômetro de foco e a meta semanal |
| **Professor** | Publicar conteúdo para várias turmas, montar banco de questões e simulados, corrigir redações (5 competências de 0 a 200), responder dúvidas, ver quem está em risco |
| **Gestão** | Tudo do professor, mais: aprovar cadastros, criar turmas, ligar/desligar a trava, cadastrar professores |

**Nota do simulado (0 a 1000):** média ponderada do aproveitamento por competência (peso de cada competência em `competencias.peso`), calculada **no banco** (`finalizar_tentativa`). É uma métrica da plataforma, sem TRI.

**Segurança:** todas as regras ficam no banco (RLS em `0003_seguranca_rls.sql`). O aluno nunca lê a tabela de questões: o gabarito só chega depois da entrega, pelas funções `questoes_da_tentativa` e `gabarito_da_tentativa`. Aluno não consegue mudar o próprio papel, status ou turma, nem corrigir a própria redação.

## Estrutura

```
app/            páginas (aluno/, professor/, gestao/, entrar/, landing em /)
components/     Shell (menu), Form (Server Actions), landing/, ícones
lib/            sessão, trilha (estado das etapas), risco, ações do servidor (acoes/)
supabase/       migrations (schema, funções, RLS, storage), seeds
```

## Ideias para as próximas versões

- Verificação em duas etapas (MFA do Supabase) para a gestão.
- Importar alunos e turmas por planilha; importar questões em lote.
- Notificações (e-mail) para dúvida respondida e redação corrigida.
- Relatório da turma em PDF.
- Mais competências por área (matrizes de referência do ENEM).

## Limitações conhecidas

- O login é por e-mail e senha (matrícula é só um dado do cadastro).
- Funções de um professor "só da própria turma" ainda não existem: todo professor vê todas as turmas.
- O progresso de vídeo é marcado manualmente ("Marcar como assistida").

## Segurança
Rode também `0005_professor_turmas.sql` e `0006_endurecimento.sql` (Supabase → SQL Editor).
No painel do Supabase: Authentication → Providers → Email: senha mínima 8+, e ative proteção de senha vazada (Leaked password protection) se disponível; em Authentication → URL Configuration, deixe só o domínio da Vercel.

## E-mails (Resend)
Variáveis na Vercel: `RESEND_API_KEY` e, com domínio verificado no Resend, `EMAIL_FROM` (ex.: `EduConecta <avisos@seudominio.com.br>`).
Sem a chave o sistema funciona normalmente, só não envia e-mails. Avisos: cadastro recebido (aluno), novo aluno (gestão) e acesso liberado (aluno).

## Recuperação de senha
Telas: `/recuperar` (pede o e-mail) e `/redefinir` (nova senha). No Supabase, em Authentication → URL Configuration, o Site URL e a Redirect URL `https://SEU-SITE/**` precisam estar cadastrados.
Atenção: o envio de e-mail padrão do Supabase só entrega para membros da equipe do projeto. Para os alunos receberem, configure um SMTP próprio (Authentication → Emails → SMTP Settings; o Resend oferece SMTP).

## Primeiro acesso e escopo do professor
- Contas criadas pela gestão (professores e importação por planilha) entram com senha provisória e são levadas a `/trocar-senha` antes de usar o sistema.
- Rode `0008_escopo_professor.sql`. Antes, vincule cada professor às suas turmas (Gestão → Cadastros). Professor sem turma vinculada não vê alunos nem turmas.
- Limite de PDF: 10 MB (comprimir em ilovepdf.com ou smallpdf.com). A tela da gestão mostra o espaço usado (plano gratuito: 1 GB).
