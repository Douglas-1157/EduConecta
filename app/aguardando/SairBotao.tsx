'use client';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
export function SairBotao() {
  const r = useRouter();
  return <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={async () => { await supabaseBrowser().auth.signOut(); r.replace('/entrar'); r.refresh(); }}>Sair</button>;
}
