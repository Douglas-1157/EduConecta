import { supabaseAdmin } from '@/lib/supabase/admin';

export async function emailDoUsuario(id: string): Promise<string | null> {
  const { data } = await supabaseAdmin().auth.admin.getUserById(id);
  return data.user?.email ?? null;
}

export async function emailsPorPapel(papel: string): Promise<string[]> {
  const { data } = await supabaseAdmin().from('profiles').select('id').eq('papel', papel);
  const emails = await Promise.all((data ?? []).map((p) => emailDoUsuario(p.id)));
  return emails.filter((e): e is string => !!e);
}