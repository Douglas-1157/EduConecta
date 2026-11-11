import 'server-only';
import { Resend } from 'resend';

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const REMETENTE = process.env.EMAIL_FROM || 'EduConecta <onboarding@resend.dev>';

export async function enviarEmail(opts: { to: string | string[]; subject: string; html: string }) {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) { console.warn('RESEND_API_KEY não configurada: e-mail não enviado.'); return; }
  try {
    const { error } = await new Resend(chave).emails.send({ from: REMETENTE, ...opts });
    if (error) console.error('Erro ao enviar e-mail:', error);
  } catch (e) {
    console.error('Falha no envio de e-mail:', e);
  }
}
