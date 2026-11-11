import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function enviarEmail(opts: { to: string | string[]; subject: string; html: string }) {
  try {
    const { error } = await resend.emails.send({
      from: "EduConecta <onboarding@resend.dev>",
      ...opts,
    });
    if (error) console.error("Erro ao enviar e-mail:", error);
  } catch (e) {
    console.error("Falha no envio de e-mail:", e);
  }
}