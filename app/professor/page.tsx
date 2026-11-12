import Link from 'next/link';
import { exigirPerfil } from '@/lib/sessao';
import { turmasVisiveis } from '@/lib/escopo';
import { riscoDe } from '@/lib/risco';
import { Av, Pb, fmtMin, saudacao, primeiroNome } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function PainelTurmas({ searchParams }: { searchParams: Promise<{ turma?: string; f?: string }> }) {
  const sp = await searchParams;
  const { perfil, db } = await exigirPerfil();
  const [{ data: turmas }, { data: alunos }] = await Promise.all([
    turmasVisiveis(db, perfil),
    db.from('painel_alunos').select('*'),
  ]);
  const lista = (alunos ?? []).filter(a => !sp.turma || a.turma_id === sp.turma).map(a => ({ ...a, r: riscoDe(a.ultimo_estudo, a.min_semana, a.meta_semanal_min) }));
  const ordem: Record<string, number> = { bad: 0, warn: 1, ok: 2 };
  lista.sort((a, b) => ordem[a.r.nivel] - ordem[b.r.nivel] || a.nome.localeCompare(b.nome));
  const vis = lista.filter(a => !sp.f || a.r.nivel === sp.f);
  const med = lista.length ? Math.round(lista.reduce((s, a) => s + a.min_semana, 0) / lista.length) : 0;
  const cont = (n: string) => lista.filter(a => a.r.nivel === n).length;
  const q = (o: Record<string, string>) => '?' + new URLSearchParams({ ...(sp.turma ? { turma: sp.turma } : {}), ...o }).toString();
  return (
    <>
      <div><h1 className="h1">{saudacao()}, {primeiroNome(perfil.nome)}</h1><p className="sub">Veja quem precisa de você hoje.</p></div>
      <div className="tabs" role="tablist"><Link className={!sp.turma ? 'on' : ''} href="/professor">Todas as turmas</Link>{turmas?.map(t => <Link key={t.id} className={sp.turma === t.id ? 'on' : ''} href={`?turma=${t.id}`}>{t.nome}</Link>)}</div>
      <div className="facts"><div className="fact"><small>Alunos ativos</small><b>{lista.length}</b></div><div className="fact"><small>Estudo médio na semana</small><b>{fmtMin(med)}</b></div><div className="fact"><small>Em risco</small><b>{cont('bad')}</b></div><div className="fact"><small>Atenção</small><b>{cont('warn')}</b></div></div>
      <div className="tabs" role="tablist">{[['', 'Todos', lista.length], ['bad', 'Em risco', cont('bad')], ['warn', 'Atenção', cont('warn')], ['ok', 'No ritmo', cont('ok')]].map(([k, l, n]) => <Link key={k as string} className={(sp.f ?? '') === k ? 'on' : ''} href={k ? q({ f: k as string }) : q({})}>{l}<span className="cnt">{n}</span></Link>)}</div>
      <div className="card"><div className="list">{vis.length ? vis.map(a => (
        <Link key={a.id} href={`/professor/aluno/${a.id}`} className="li"><Av nome={a.nome} sm /><div className="tx"><b>{a.nome}</b><small>{a.r.motivo} · {fmtMin(a.min_semana)} na semana{a.media != null ? ` · média ${a.media}` : ''}</small></div>
          <div style={{ width: 90 }}><Pb p={(a.min_semana / a.meta_semanal_min) * 100} cls={a.r.nivel === 'ok' ? 'ok' : ''} /></div><span className={`pill ${a.r.nivel}`}>{a.r.rotulo}</span></Link>))
        : <div className="empty">Nenhum aluno por aqui.</div>}</div></div>
    </>
  );
}
