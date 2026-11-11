import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
import type { Papel, Perfil } from './tipos';

// Retorna o perfil do usuário logado ou redireciona. Use em toda página privada.
export async function exigirPerfil(papel?: Papel): Promise<{ perfil: Perfil; db: Awaited<ReturnType<typeof supabaseServer>> }> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect('/entrar');
  const { data: perfil } = await db.from('profiles').select('*').eq('id', user.id).single<Perfil>();
  if (!perfil) redirect('/entrar');
  if (perfil.status !== 'ativo') redirect('/aguardando');
  if (papel && perfil.papel !== papel) redirect(`/${perfil.papel}`);
  return { perfil, db };
}
