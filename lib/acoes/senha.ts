'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { supabaseServer } from '../supabase/server';
import { supabaseAdmin } from '../supabase/admin';
import type { Estado } from '@/components/Form';

// Pede o e-mail de recuperação. A resposta é sempre a mesma, exista o e-mail ou não.
export async function recuperarSenha(_: Estado, fd: FormData): Promise<Estado> {
  const email = String(fd.get('email') ?? '').trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, msg: 'Informe um e-mail válido.' };
  const h = await headers();
  const origem = process.env.NEXT_PUBLIC_SITE_URL || `${h.get('x-forwarded-proto') ?? 'https'}://${h.get('x-forwarded-host') ?? h.get('host')}`;
  const db = await supabaseServer();
  const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: `${origem}/auth/callback?next=/redefinir` });
  if (error && /rate|limit|seconds/i.test(error.message)) return { ok: false, msg: 'Muitos pedidos seguidos. Espere alguns minutos e tente de novo.' };
  return { ok: true, msg: 'Se esse e-mail tiver cadastro, enviamos um link para criar uma nova senha. Confira também o spam.' };
}

export async function redefinirSenha(_: Estado, fd: FormData): Promise<Estado> {
  const senha = String(fd.get('senha') ?? ''), conf = String(fd.get('conf') ?? '');
  if (senha.length < 8) return { ok: false, msg: 'A senha precisa ter 8 ou mais caracteres.' };
  if (senha !== conf) return { ok: false, msg: 'As duas senhas não são iguais.' };
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false, msg: 'O link expirou. Peça um novo em "Esqueci a senha".' };
  const { error } = await db.auth.updateUser({ password: senha });
  if (error) return { ok: false, msg: error.message.includes('different') ? 'Escolha uma senha diferente da atual.' : 'Não foi possível trocar a senha. Tente de novo.' };
  if (user.app_metadata?.trocar_senha) await supabaseAdmin().auth.admin.updateUserById(user.id, { app_metadata: { trocar_senha: false } });
  redirect('/painel');
}
