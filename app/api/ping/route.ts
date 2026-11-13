import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Endpoint leve para um monitor externo (ex.: UptimeRobot) visitar a cada 5 min:
// mantém a função da Vercel acordada e evita o Supabase pausar por inatividade.
export async function GET() {
  try { await supabaseAdmin().from('turmas').select('id').limit(1); } catch { /* sem chave: só acorda a função */ }
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
}
