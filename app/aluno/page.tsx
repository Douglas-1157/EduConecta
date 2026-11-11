import Link from 'next/link';
import { exigirPerfil } from '@/lib/sessao';
import { carregarTrilhas, fila, semanaAtual, iconeTipo } from '@/lib/trilha';
import { Icon } from '@/components/Icon';
import { Pb, Pill, fmtMin, fmtPrazo, saudacao, primeiroNome } from '@/components/ui';
import { LinhaItem, hrefItem, tituloItem } from '@/components/Linha';

export const dynamic = 'force-dynamic';

export default async function Hoje() {
  const { perfil, db } = await exigirPerfil('aluno');
  const [{ disciplinas }, { data: sess }, { data: tent }, { data: reds }] = await Promise.all([
    carregarTrilhas(db, perfil),
    db.from('sessoes_estudo').select('minutos,feito_em').eq('aluno_id', perfil.id).gte('feito_em', new Date(Date.now() - 8 * 86400000).toISOString()),
    db.from('tentativas').select('nota,simulados(disciplina_id)').eq('aluno_id', perfil.id).eq('treino', false).not('finalizada_em', 'is', null),
    db.from('redacoes').select('id,tema_id,status,nota,redacao_temas(titulo)').eq('aluno_id', perfil.id).eq('status', 'corrigida').order('corrigida_em', { ascending: false }).limit(1),
  ]);
  const q = fila(disciplinas);
  const cur = q.find(x => x.pct && !x.concluido) ?? q[0];
  const sem = semanaAtual(sess ?? []);
  const meta = perfil.meta_semanal_min, pc = Math.min(100, Math.round((sem.total / meta) * 100));
  const grupos: [string, typeof q][] = [
    ['Para hoje', q.filter(x => !x.prazo || ['hoje', 'atrasada'].includes(fmtPrazo(x.prazo)))],
    ['Próximos dias', q.filter(x => x.prazo && !['hoje', 'atrasada'].includes(fmtPrazo(x.prazo)))],
  ];
  const dn = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const porDisc = new Map<string, number[]>();
  for (const t of (tent ?? []) as any[]) { const k = t.simulados?.disciplina_id; if (k) porDisc.set(k, [...(porDisc.get(k) ?? []), t.nota]); }
  const desempenho = disciplinas.filter(d => porDisc.has(d.id)).map(d => { const n = porDisc.get(d.id)!; return [d.nome, Math.round(n.reduce((a, b) => a + b, 0) / n.length / 10)] as const; });
  const nivel = (p: number) => (p >= 75 ? ['Forte', 'ok'] : p >= 60 ? ['Médio', 'wip'] : ['Revisar', 'warn']);

  return (
    <>
      <div><h1 className="h1">{saudacao()}, {primeiroNome(perfil.nome)}</h1><p className="sub">Aqui está o que vale a pena fazer agora.</p></div>
      {!perfil.turma_id && <div className="note">Sua conta ainda não está em uma turma. Peça à gestão da escola para te incluir em uma.</div>}
      <div className="cols">
        <div className="stack">
          {cur ? (
            <div className="hero">
              <div className="ey">{cur.pct ? 'Continue de onde parou' : 'Seu próximo passo'}</div>
              <div className="t">{tituloItem(cur)}</div>
              <div className="m">{cur.disciplina} · {cur.modulo} · {cur.minutos} min</div>
              {cur.pct > 0 && <div className="pbw"><Pb p={cur.pct} cls="light" /><span>{cur.pct}% assistida</span></div>}
              <div className="row"><Link href={hrefItem(cur)} className="btn white lg"><Icon n={iconeTipo[cur.tipo]} s={16} /> {cur.tipo === 'sim' ? 'Fazer simulado' : cur.pct ? 'Continuar aula' : 'Começar'}</Link></div>
            </div>
          ) : (
            <div className="hero">
              <div className="ey">Tudo em dia</div><div className="t">Você não tem nada pendente.</div>
              <div className="m">Que tal revisar uma aula ou treinar com um simulado?</div>
              <div className="row"><Link href="/aluno/biblioteca" className="btn white lg">Abrir a biblioteca</Link></div>
            </div>
          )}
          <div className="card">
            <h2 className="h2">Sua fila de estudo</h2>
            {q.length === 0 && <div className="empty">Nada na fila por enquanto.</div>}
            {grupos.filter(g => g[1].length).map(g => (
              <div key={g[0]}><div className="gl">{g[0]}</div><div className="list">{g[1].map(x => <LinhaItem key={x.id} it={x} disc={disciplinas.find(d => d.id === x.disciplina_id)!} />)}</div></div>
            ))}
          </div>
          {reds?.[0] && (
            <div className="card"><div className="row sb"><h2 className="h2">Redação corrigida</h2><b className="mono">{reds[0].nota}</b></div>
              <p className="sub" style={{ margin: '6px 0 12px' }}>{(reds[0] as any).redacao_temas?.titulo}</p>
              <Link href={`/aluno/redacao/${(reds[0] as any).tema_id}`} className="btn block">Ver correção</Link></div>
          )}
        </div>
        <div className="stack">
          <div className="card">
            <div className="row sb"><h2 className="h2">Sua semana</h2><Pill tone={pc >= 100 ? 'ok' : 'wip'}>Meta {fmtMin(meta)}</Pill></div>
            <div style={{ margin: '14px 0 8px' }} className="row sb"><b style={{ fontSize: 22, fontWeight: 600 }}>{fmtMin(sem.total)}</b><span className="sub">{pc >= 100 ? 'Meta batida!' : `faltam ${fmtMin(Math.max(0, meta - sem.total))}`}</span></div>
            <Pb p={pc} cls={pc >= 100 ? 'ok' : ''} />
            <div className="week">
              {sem.dias.map((m, i) => { const n = Math.min(4, Math.ceil(m / 15)); return (
                <div key={i} className={`wd${i === sem.hoje ? ' today' : ''}`}><div className="st" title={`${m} min`}>{[3, 2, 1, 0].map(k => <i key={k} className={k < n ? 'on' : ''} />)}</div><small>{dn[i]}</small></div>
              ); })}
            </div>
            <p className="sub" style={{ marginTop: 14, fontSize: 13 }}>Cada ponto vale 15 min. Perder um dia não zera nada, a meta é da semana. Sem ranking: você só compete com a sua meta.</p>
          </div>
          {desempenho.length > 0 && (
            <div className="card"><div className="row sb"><h2 className="h2">Como você está</h2><span className="sub" style={{ fontSize: 13 }}>nos simulados</span></div>
              <div style={{ marginTop: 8 }}>{desempenho.map(([n, p]) => { const l = nivel(p); return <div key={n} className="perf"><span>{n}</span><Pb p={p} cls={l[1] === 'ok' ? 'ok' : ''} /><span className={`pill ${l[1]}`}>{l[0]}</span></div>; })}</div></div>
          )}
          <div className="card"><h2 className="h2">Bloco de foco</h2><p className="sub" style={{ margin: '6px 0 14px' }}>Estude sem distração e some tempo na sua meta.</p>
            <Link href="/aluno/foco" className="btn block"><Icon n="timer" s={16} /> Iniciar cronômetro</Link></div>
        </div>
      </div>
    </>
  );
}
