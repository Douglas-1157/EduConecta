import { cache } from 'react';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
import type { Papel, Perfil } from './tipos';

// Autenticação e perfil são buscados uma única vez por requisição (layout e página compartilham o resultado).
const carregar = cache(async () => {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { db, user: null, perfil: null };
  const { data: perfil } = await db.from('profiles').select('*').eq('id', user.id).single<Perfil>();
  return { db, user, perfil };
});

// Retorna o perfil do usuário logado ou redireciona. Use em toda página privada.
export async function exigirPerfil(papel?: Papel): Promise<{ perfil: Perfil; db: Awaited<ReturnType<typeof supabaseServer>> }> {
  const { db, user, perfil } = await carregar();
  if (!user) redirect('/entrar');
  if (user.app_metadata?.trocar_senha) redirect('/trocar-senha');
  if (!perfil) redirect('/entrar');
  if (perfil.status !== 'ativo') redirect('/aguardando');
  if (papel && perfil.papel !== papel) redirect(`/${perfil.papel}`);
  return { perfil, db };
}
