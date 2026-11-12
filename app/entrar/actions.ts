'use server';
import { supabaseServer } from '@/lib/supabase/server';
import { enviarEmail, esc } from '@/lib/emails';
import { emailsPorPapel } from '@/lib/destinatarios';

type Dados = { nome: string; matricula: string; turma: string; email: string; senha: string };

export async function cadastrarAluno(d: Dados): Promise<{ ok: true } | { erro: string }> {
  const nome = d.nome.trim(), matricula = d.matricula.trim(), email = d.email.trim();
  if (nome.length < 3 || !matricula || !email || d.senha.length < 8 || !d.turma) {
    return { erro: 'Confira os dados informados.' };
  }

  const db = await supabaseServer();
  const { error } = await db.auth.signUp({
    email,
    password: d.senha,
    options: { data: { nome, matricula, turma_id: d.turma } },
  });
  if (error) {
    return { erro: error.message.includes('registered') ? 'Este e-mail já tem cadastro.' : 'Não foi possível criar a conta. Confira os dados.' };
  }

  // e-mail para o aluno
  await enviarEmail({
    to: email,
    subject: 'Cadastro recebido - EduConecta',
    html: `<p>Olá, ${esc(nome)}!</p><p>Recebemos seu cadastro. Assim que a gestão autorizar seu acesso, você será avisado por e-mail.</p>`,
  });

  // e-mail para a gestão
  const lista = await emailsPorPapel('gestao');
  if (lista.length) {
    await enviarEmail({
      to: lista,
      subject: 'Novo aluno aguardando autorização',
      html: `<p><b>${esc(nome)}</b> (${esc(email)}, matrícula ${esc(matricula)}) se cadastrou e aguarda sua autorização.</p>`,
    });
  }
  return { ok: true };
}