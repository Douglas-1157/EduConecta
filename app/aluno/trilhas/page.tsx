import Link from 'next/link';
import { exigirPerfil } from '@/lib/sessao';
import { carregarTrilhas, iconeTipo, razaoBloqueio, type ItemTrilha, type Disciplina } from '@/lib/trilha';
import { Icon } from '@/components/Icon';
import { Pb, fmtPrazo } from '@/components/ui';
import { hrefItem, tituloItem } from '@/components/Linha';

export const dynamic = 'force-dynamic';

function Etapa({ it, d }: { it: ItemTrilha; d: Disciplina }) {
  const st = it.estado;
  const meta = [`${it.minutos} min`, st === 'now' && it.prazo ? fmtPrazo(it.prazo) : '', it.pct && !it.concluido ? `${it.pct}% assistida` : ''].filter(Boolean).join(' · ');
  return (
    <div className={`step ${st}`}>
      <div className="node">{st === 'ok' ? <span className="dot ok"><Icon n="check" s={13} /></span> : st === 'now' ? <span className="dot now" /> : st === 'lock' ? <span className="dot"><Icon n="lock" s={11} /></span> : <span className="dot" />}</div>
      <div className="sbody">
        <span className="ico"><Icon n={iconeTipo[it.tipo]} s={16} /></span>
        <div className="tx"><b>{tituloItem(it)}</b><small>{meta}</small></div>
        <div className="sa">
          {st === 'ok' && <><span className="pill ok">Concluída</span><Link className="btn sm ghost" href={hrefItem(it)}>Rever</Link></>}
          {st === 'lock' && <span className="why"><Icon n="lock" s={13} /><span>{razaoBloqueio(d)}</span></span>}
          {(st === 'now' || st === 'free') && <Link className="btn sm pri" href={hrefItem(it)}>{it.tipo === 'sim' ? 'Fazer simulado' : it.pct ? 'Continuar' : 'Começar'}</Link>}
        </div>
      </div>
    </div>
  );
}

export default async function Trilhas({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const { perfil, db } = await exigirPerfil('aluno');
  const { disciplinas, trava } = await carregarTrilhas(db, perfil);
  const sp = await searchParams;
  const d = disciplinas.find(x => x.id === sp.d) ?? disciplinas[0];
  if (!d) return <><div><h1 className="h1">Trilhas de aprendizagem</h1></div><div className="empty">Ainda não há conteúdo publicado para a sua turma.</div></>;
  const done = d.itens.filter(x => x.concluido).length, pc = Math.round((done / d.itens.length) * 100);
  const now = d.itens.find(x => x.estado === 'now');
  const mods = [...new Set(d.itens.map(x => x.modulo))];
  return (
    <>
      <div><h1 className="h1">Trilhas de aprendizagem</h1><p className="sub">Siga a ordem das etapas. Cada uma libera a próxima.</p></div>
      <div className="tabs" role="tablist">
        {disciplinas.map(x => { const n = x.itens.filter(i => i.concluido).length; return (
          <Link key={x.id} role="tab" aria-selected={x.id === d.id} className={x.id === d.id ? 'on' : ''} href={`/aluno/trilhas?d=${x.id}`}>{x.nome}<span className="cnt">{n}/{x.itens.length}</span></Link>
        ); })}
      </div>
      <div className="cols">
        <div>
          {mods.map(m => {
            const its = d.itens.filter(x => x.modulo === m), n = its.filter(x => x.concluido).length;
            return (
              <details key={m} className="mod" open={n < its.length}>
                <summary className="mh"><span>{m}</span><span className="sub">{n} de {its.length}</span><span className="chev"><Icon n="down" s={16} /></span></summary>
                <div className="steps">{its.map(it => <Etapa key={it.id} it={it} d={d} />)}</div>
              </details>
            );
          })}
        </div>
        <div className="stack">
          <div className="card"><div className="row sb"><h2 className="h2">{d.nome}</h2><span className="num sub">{done} de {d.itens.length} etapas</span></div>
            <div style={{ margin: '12px 0 0' }}><Pb p={pc} cls={pc === 100 ? 'ok' : ''} /></div><p className="sub" style={{ marginTop: 10 }}>{pc}% concluído</p></div>
          {now ? (
            <div className="card"><div className="sub" style={{ fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 600 }}>Próxima etapa</div>
              <div style={{ fontWeight: 600, margin: '8px 0 4px' }}>{tituloItem(now)}</div>
              <div className="sub" style={{ marginBottom: 14 }}>{now.minutos} min{now.prazo ? ` · ${fmtPrazo(now.prazo)}` : ''}</div>
              <Link className="btn pri block" href={hrefItem(now)}>{now.pct ? 'Continuar' : 'Começar'}</Link></div>
          ) : <div className="card"><b>Trilha concluída!</b><p className="sub" style={{ marginTop: 6 }}>Você terminou todas as etapas de {d.nome}.</p></div>}
          <div className="note">{trava ? 'A trava progressiva está ligada pelo seu professor. Ele pode liberar todas as etapas.' : 'O professor liberou todas as etapas. Você pode estudar em qualquer ordem.'}</div>
        </div>
      </div>
    </>
  );
}
