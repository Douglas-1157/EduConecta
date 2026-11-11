import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirPerfil } from '@/lib/sessao';
import { riscoDe } from '@/lib/risco';
import { Icon } from '@/components/Icon';
import { Av, Pb, fmtMin } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function Aluno({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await exigirPerfil();
  const { data: a } = await db.from('painel_alunos').select('*').eq('id', id).maybeSingle();
  if (!a) notFound();
  const [{ data: prog }, { data: itens }, { data: tent }, { data: reds }, { data: turma }] = await Promise.all([
    db.from('progresso').select('item_id,concluido_em').eq('aluno_id', id),
    db.from('itens').select('id,item_turmas!inner(turma_id),modulos(disciplinas(nome))').eq('publicado', true).eq('item_turmas.turma_id', a.turma_id ?? ''),
    db.from('tentativas').select('id,nota,treino,finalizada_em,simulados(titulo)').eq('aluno_id', id).not('finalizada_em', 'is', null).order('finalizada_em', { ascending: false }).limit(8),
    db.from('redacoes').select('id,nota,status,redacao_temas(titulo)').eq('aluno_id', id).order('atualizado_em', { ascending: false }).limit(5),
    a.turma_id ? db.from('turmas').select('nome').eq('id', a.turma_id).single() : Promise.resolve({ data: null }),
  ]);
  const feitos = new Set((prog ?? []).filter(p => p.concluido_em).map(p => p.item_id));
  const por = new Map<string, { t: number; f: number }>();
  (itens ?? []).forEach((i: any) => { const n = i.modulos?.disciplinas?.nome ?? '—'; const c = por.get(n) ?? { t: 0, f: 0 }; c.t++; if (feitos.has(i.id)) c.f++; por.set(n, c); });
  const r = riscoDe(a.ultimo_estudo, a.min_semana, a.meta_semanal_min);
  return (
    <>
      <div className="row"><Link href="/professor" className="btn sm"><Icon n="left" s={14} /> Voltar</Link></div>
      <div className="row sb"><div className="row"><Av nome={a.nome} /><div><h1 className="h1">{a.nome}</h1><p className="sub">{(turma as any)?.nome ?? 'Sem turma'} · {r.motivo}</p></div></div><span className={`pill ${r.nivel}`}>{r.rotulo}</span></div>
      <div className="facts"><div className="fact"><small>Estudo na semana</small><b>{fmtMin(a.min_semana)}</b></div><div className="fact"><small>Meta semanal</small><b>{fmtMin(a.meta_semanal_min)}</b></div><div className="fact"><small>Média nos simulados</small><b>{a.media ?? '–'}</b></div></div>
      <div className="cols">
        <div className="card"><h2 className="h2">Progresso por disciplina</h2>{por.size ? [...por.entries()].map(([n, c]) => <div key={n} style={{ marginTop: 14 }}><div className="row sb" style={{ marginBottom: 6 }}><span>{n}</span><span className="num sub">{c.f} de {c.t}</span></div><Pb p={(c.f / c.t) * 100} /></div>) : <div className="empty" style={{ marginTop: 10 }}>Sem conteúdo publicado para a turma.</div>}</div>
        <div className="stack">
          <div className="card"><h2 className="h2">Simulados</h2><div className="list" style={{ marginTop: 6 }}>{tent?.length ? tent.map((t: any) => <div key={t.id} className="li"><div className="tx"><b>{t.simulados?.titulo}{t.treino ? ' (treino)' : ''}</b><small>{new Date(t.finalizada_em).toLocaleDateString('pt-BR')}</small></div><b className="mono">{t.nota}</b></div>) : <div className="empty">Nenhum simulado feito.</div>}</div></div>
          <div className="card"><h2 className="h2">Redações</h2><div className="list" style={{ marginTop: 6 }}>{reds?.length ? reds.map((x: any) => <Link key={x.id} href={`/professor/redacoes/${x.id}`} className="li"><div className="tx"><b>{x.redacao_temas?.titulo}</b><small>{x.status}</small></div>{x.status === 'corrigida' && <b className="mono">{x.nota}</b>}</Link>) : <div className="empty">Nenhuma redação.</div>}</div></div>
        </div>
      </div>
    </>
  );
}
