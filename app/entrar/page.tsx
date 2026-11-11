import { supabaseServer } from '@/lib/supabase/server';
import { EntrarForm } from './EntrarForm';

export const dynamic = 'force-dynamic';

export default async function Entrar({ searchParams }: { searchParams: Promise<{ criar?: string }> }) {
  const db = await supabaseServer();
  const { data: turmas } = await db.from('turmas').select('id,nome,turno').order('nome');
  const sp = await searchParams;
  return <EntrarForm turmas={turmas ?? []} inicial={sp.criar ? 'criar' : 'entrar'} />;
}
