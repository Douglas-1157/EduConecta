import Link from 'next/link';
import { Icon } from './Icon';
import { fmtPrazo } from './ui';
import { iconeTipo, rotuloTipo, type ItemTrilha, type Disciplina, razaoBloqueio } from '@/lib/trilha';

export const hrefItem = (it: ItemTrilha) => (it.tipo === 'sim' && it.simulado_id ? `/aluno/simulados/${it.simulado_id}` : `/aluno/aula/${it.id}`);
export const tituloItem = (it: ItemTrilha) => `${rotuloTipo[it.tipo]} · ${it.titulo}`;

// Linha de item da fila de estudo
export function LinhaItem({ it, disc, quieto }: { it: ItemTrilha; disc: Disciplina; quieto?: boolean }) {
  const atrasada = it.estado === 'now' && it.prazo && fmtPrazo(it.prazo) === 'atrasada';
  const meta: React.ReactNode[] = [it.disciplina, `${it.minutos} min`];
  if (it.concluido) meta.push(<span key="c" style={{ color: 'var(--ok)', fontWeight: 600 }}>Concluída</span>);
  else if (atrasada) meta.push(<span key="a" style={{ color: 'var(--bad)', fontWeight: 600 }}>Atrasada</span>);
  else if (it.estado === 'now' && it.prazo) meta.push(fmtPrazo(it.prazo));
  if (it.pct && !it.concluido) meta.push(`${it.pct}% assistida`);
  return (
    <div className={`li${atrasada ? ' late' : ''}`}>
      <span className="ico"><Icon n={iconeTipo[it.tipo]} /></span>
      <div className="tx">
        <b>{tituloItem(it)}</b>
        <small>{meta.map((m, i) => <span key={i}>{i ? ' · ' : ''}{m}</span>)}</small>
        {it.estado === 'lock' && <small className="why2"><Icon n="lock" s={12} /><span>{razaoBloqueio(disc)}</span></small>}
      </div>
      {it.estado !== 'lock' && (
        <Link href={hrefItem(it)} className={`btn sm${it.estado === 'now' && !quieto ? ' pri' : ''}`}>
          {it.concluido ? 'Rever' : it.tipo === 'sim' ? 'Fazer' : it.pct ? 'Continuar' : 'Abrir'}
        </Link>
      )}
    </div>
  );
}
