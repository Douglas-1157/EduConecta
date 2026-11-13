import Link from 'next/link';
import { exigirPerfil } from '@/lib/sessao';
import { riscoDe } from '@/lib/risco';
import { Pb, fmtMin, saudacao, primeiroNome } from '@/components/ui';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Espaço usado pelas apostilas (limite do plano gratuito do Supabase: 1 GB).
async function usoArmazenamento(): Promise<number | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    const { data, error } = await supabaseAdmin().storage.from('conteudo').list('apostilas', { limit: 1000 });
    if (error || !data) return null;
    return data.reduce((t, f: any) => t + (f.metadata?.size ?? 0), 0);
  } catch { return null; }
}

export const dynamic = 'force-dynamic';

export default async function Escola() {
  const { perfil, db } = await exigirPerfil('gestao');
  const [{ data: turmas }, { data: alunos }, { count: pend }, { count: prof }, usado] = await Promise.all([
    db.from('turmas').select('id,nome,turno').order('nome'),
    db.from('painel_alunos').select('*'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'pendente'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('papel', 'professor').eq('status', 'ativo'),
    usoArmazenamento(),
  ]);
  const com = (alunos ?? []).map(a => ({ ...a, r: riscoDe(a.ultimo_estudo, a.min_semana, a.meta_semanal_min) }));
  const med = com.length ? Math.round(com.reduce((s, a) => s + a.min_semana, 0) / com.length) : 0;
  return (
    <>
      <div><h1 className="h1">{saudacao()}, {primeiroNome(perfil.nome)}</h1><p className="sub">Visão geral da escola.</p></div>
      <div className="facts"><div className="fact"><small>Alunos ativos</small><b>{com.length}</b></div><div className="fact"><small>Professores</small><b>{prof ?? 0}</b></div><div className="fact"><small>Estudo médio na semana</small><b>{fmtMin(med)}</b></div><div className="fact"><small>Em risco</small><b>{com.filter(a => a.r.nivel === 'bad').length}</b></div></div>
      <div className="cols">
        <div className="card"><h2 className="h2">Adesão por turma</h2><p className="sub" style={{ fontSize: 13 }}>Alunos que bateram ao menos metade da meta semanal.</p>
          <div className="list" style={{ marginTop: 6 }}>{turmas?.length ? turmas.map(t => { const l = com.filter(a => a.turma_id === t.id); const p = l.length ? Math.round((l.filter(a => a.min_semana >= a.meta_semanal_min / 2).length / l.length) * 100) : 0; return <div key={t.id} className="li" style={{ padding: '12px 0' }}><div className="tx"><b>{t.nome}{t.turno ? ` · ${t.turno}` : ''}</b><small>{l.length} alunos</small><Pb p={p} /></div><b className="num">{p}%</b></div>; }) : <div className="empty">Crie a primeira turma em “Turmas e equipe”.</div>}</div></div>
        <div className="stack">
          {usado !== null && <div className="card"><h2 className="h2">Armazenamento das apostilas</h2><p style={{ fontSize: 28, fontWeight: 600, margin: '8px 0' }}>{(usado / 1048576).toFixed(0)} MB <span className="sub" style={{ fontSize: 14, fontWeight: 400 }}>de 1.024 MB</span></p><Pb p={Math.min(100, Math.round(usado / 10485.76))} /><p className="sub" style={{ fontSize: 13, marginTop: 8 }}>Limite do plano gratuito. Perto do limite, apague apostilas antigas ou passe para o plano Pro.</p></div>}
          <div className="card"><h2 className="h2">Cadastros pendentes</h2><p style={{ fontSize: 28, fontWeight: 600, margin: '8px 0' }}>{pend ?? 0}</p><Link className="btn block" href="/gestao/cadastros">Ver cadastros</Link></div>
          <div className="card"><h2 className="h2">Acompanhar turmas</h2><p className="sub" style={{ margin: '6px 0 12px' }}>Veja alunos em risco e o desempenho de cada um.</p><Link className="btn block" href="/professor">Abrir painel das turmas</Link></div>
        </div>
      </div>
    </>
  );
}
