import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { exigirPerfil } from '@/lib/sessao';
import { Pb } from '@/components/ui';
import { Icon } from '@/components/Icon';

export const dynamic = 'force-dynamic';
const L = 'ABCDEF';

export default async function Resultado({ params }: { params: Promise<{ tid: string }> }) {
  const { tid } = await params;
  const { perfil, db } = await exigirPerfil('aluno');
  const { data: t } = await db.from('tentativas').select('id,treino,nota,acertos,total,iniciada_em,finalizada_em,simulados(titulo)').eq('id', tid).eq('aluno_id', perfil.id).maybeSingle();
  if (!t) notFound();
  if (!t.finalizada_em) redirect(`/aluno/prova/${tid}`);
  const { data: g } = await db.rpc('gabarito_da_tentativa', { p_tentativa: tid });
  const qs = (g ?? []) as any[];
  const comp = new Map<string, { a: number; t: number }>();
  qs.forEach(q => { const k = q.competencia ?? 'Geral'; const c = comp.get(k) ?? { a: 0, t: 0 }; c.t++; if (q.marcada === q.correta) c.a++; comp.set(k, c); });
  const min = Math.max(1, Math.ceil((new Date(t.finalizada_em).getTime() - new Date(t.iniciada_em).getTime()) / 60000));
  const nota = t.nota ?? 0;
  const msg = nota >= 700 ? 'Muito bem! Você está acima da sua meta.' : nota >= 500 ? 'Bom caminho. Revise as questões erradas para subir a nota.' : 'Vamos reforçar o conteúdo. Revise as aulas e tente de novo.';
  return (
    <>
      <div className="row sb"><div><h1 className="h1">{t.treino ? 'Resultado do treino' : 'Resultado do simulado'}</h1><p className="sub">{msg}</p></div><Link className="btn" href="/aluno/simulados">Voltar aos simulados</Link></div>
      <div className="cols">
        <div className="stack">
          <div className="card"><div className="row" style={{ gap: 28, alignItems: 'flex-end' }}>
            <div><div className="sub" style={{ fontSize: 13 }}>{t.treino ? 'Treino sem nota oficial' : 'Sua nota (0 a 1000)'}</div><div className="score">{t.treino ? `${t.acertos}/${t.total}` : nota}</div></div>
            <div className="facts" style={{ flex: 1, minWidth: 200 }}><div className="fact"><small>Acertos</small><b>{t.acertos} de {t.total}</b></div><div className="fact"><small>Tempo gasto</small><b>{min} min</b></div></div></div></div>
          {qs.map((q, i) => (
            <div key={q.questao_id} className="card">
              <div className="row sb"><span className="sub num">Questão {i + 1}</span>{q.marcada === q.correta ? <span className="pill ok">Acertou</span> : q.marcada === null ? <span className="pill warn">Em branco</span> : <span className="pill bad">Errou</span>}</div>
              <p style={{ margin: '8px 0 12px', textWrap: 'pretty', whiteSpace: 'pre-wrap' }}>{q.enunciado}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(q.alternativas as string[]).map((o, k) => (
                  <div key={k} className={`alt${k === q.correta ? ' right' : q.marcada === k ? ' wrong' : ''}`}><span className="lt">{L[k]}</span><span>{o}{k === q.correta && <b> (correta)</b>}{q.marcada === k && k !== q.correta && <b> (sua resposta)</b>}</span></div>))}
              </div>
              {q.comentario && <p className="note" style={{ marginTop: 12 }}><b>Por quê:</b> {q.comentario}</p>}
              <Link className="btn sm" style={{ marginTop: 12 }} href={`/aluno/duvidas?ctx=${encodeURIComponent(`Simulado · ${(t as any).simulados?.titulo} · Questão ${i + 1}`)}`}><Icon n="chat" s={14} /> Perguntar ao professor</Link>
            </div>
          ))}
        </div>
        <div className="card" style={{ alignSelf: 'start' }}>
          <h2 className="h2">Por competência</h2>
          {[...comp.entries()].map(([k, c]) => { const p = Math.round((c.a / c.t) * 100); return <div key={k} style={{ marginTop: 16 }}><div className="row sb" style={{ marginBottom: 6 }}><span>{k}</span><span className="num">{c.a}/{c.t}</span></div><Pb p={p} cls={p >= 70 ? 'ok' : ''} /></div>; })}
          <p className="note" style={{ marginTop: 18 }}>Nota = média ponderada do aproveitamento por competência × 1000. Métrica própria da plataforma, sem TRI.</p>
        </div>
      </div>
    </>
  );
}
