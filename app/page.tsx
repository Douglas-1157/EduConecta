import { redirect } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { Landing } from '@/components/landing/Landing';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (user) redirect('/painel');
  return <Landing />;
}
