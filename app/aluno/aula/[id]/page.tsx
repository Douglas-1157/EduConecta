import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { exigirPerfil } from '@/lib/sessao';
import { carregarTrilhas, iconeTipo } from '@/lib/trilha';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/ui';
import { hrefItem, tituloItem } from '@/components/Linha';
import { AulaAcoes } from './AulaAcoes';

export const dynamic = 'force-dynamic';

const youtube = (u: string | null) => { const m = u?.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/); return m ? m[1] : null; };

export default async function Aula({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { perfil, db } = await exigirPerfil('aluno');
  const { disciplinas } = await carregarTrilhas(db, perfil);
  const d = disciplinas.find(x => x.itens.some(i => i.id === id));
  const it = d?.itens.find(i => i.id === id);
  if (!d || !it) notFound();
  if (it.tipo === 'sim' && it.simulado_id) redirect(`/aluno/simulados/${it.simulado_id}`);
  const idx = d.itens.indexOf(it), prox = d.itens[idx + 1];
  const mod = d.itens.filter(x => x.modulo === it.modulo);
  const bloqueada = it.estado === 'lock';
  let pdf: string | null = null;
  if (it.tipo === 'pdf' && it.arquivo_path && !bloqueada) {
    const { data } = await db.storage.from('conteudo').createSignedUrl(it.arquivo_path, 3600);
    pdf = data?.signedUrl ?? null;
  }
  const yt = youtube(it.url);
  return (
    <>
      <div className="row"><Link href="/aluno/trilhas" className="btn sm"><Icon n="left" s={14} /> Voltar</Link></div>
      <div className="cols">
        <div className="stack">
          <div>
            <div className="row" style={{ marginBottom: 8 }}><Pill tone="wip">{it.disciplina}</Pill>{it.competencia && <Pill>{it.competencia}</Pill>}</div>
            <h1 className="h1">{tituloItem(it)}</h1>
          </div>
          {bloqueada ? (
            <div className="note"><Icon n="lock" s={14} /> Esta etapa ainda está bloqueada. Conclua as etapas anteriores desta trilha para liberar.</div>
          ) : it.tipo === 'video' ? (
            yt ? <div className="player" style={{ aspectRatio: '16/9', padding: 0, overflow: 'hidden' }}><iframe title={it.titulo} src={`https://www.youtube-nocookie.com/embed/${yt}`} allowFullScreen style={{ width: '100%', height: '100%', border: 0 }} /></div>
               : <div className="player"><span className="cap">O professor ainda não anexou o vídeo desta aula.</span></div>
          ) : (
            <div className="doc"><Icon n="file" s={36} /><div><b>{it.titulo}</b><div className="sub">PDF · cerca de {it.minutos} min de leitura</div></div>
              {pdf ? <a className="btn" href={pdf} target="_blank" rel="noreferrer">Abrir PDF</a> : <span className="pill">Arquivo não anexado</span>}</div>
          )}
          {!bloqueada && <AulaAcoes itemId={it.id} tipo={it.tipo as 'video' | 'pdf'} concluido={it.concluido} titulo={tituloItem(it)} proxima={prox && prox.estado !== 'lock' ? hrefItem(prox) : null} />}
        </div>
        <div className="card"><h2 className="h2">{it.modulo}</h2><p className="sub" style={{ marginBottom: 8 }}>Etapas deste módulo</p>
          <div className="list">{mod.map(x => (
            <Link key={x.id} href={x.estado === 'lock' ? '#' : hrefItem(x)} className="li" style={x.id === it.id ? { fontWeight: 600 } : undefined} aria-disabled={x.estado === 'lock'}>
              <span className="ico"><Icon n={x.concluido ? 'check' : x.estado === 'lock' ? 'lock' : iconeTipo[x.tipo]} s={16} /></span>
              <div className="tx"><b>{tituloItem(x)}</b><small>{x.minutos} min</small></div>
            </Link>))}</div></div>
      </div>
    </>
  );
}
