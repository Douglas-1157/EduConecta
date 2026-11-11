import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirPerfil } from '@/lib/sessao';
import { Icon } from '@/components/Icon';
import { Pb } from '@/components/ui';
import { COMPETENCIAS_REDACAO } from '@/lib/redacao';
import { Editor } from './Editor';

export const dynamic = 'force-dynamic';

export default async function Escrever({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { perfil, db } = await exigirPerfil('aluno');
  const { data: tema } = await db.from('redacao_temas').select('*').eq('id', id).maybeSingle();
  if (!tema) notFound();
  const { data: r } = await db.from('redacoes').select('*').eq('tema_id', id).eq('aluno_id', perfil.id).maybeSingle();
  return (
    <>
      <div className="row"><Link href="/aluno/redacao" className="btn sm"><Icon n="left" s={14} /> Voltar</Link></div>
      <div><h1 className="h1">{tema.titulo}</h1>{tema.enunciado && <p className="sub" style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{tema.enunciado}</p>}</div>
      {r?.status === 'corrigida' ? (
        <div className="cols">
          <div className="card"><h2 className="h2" style={{ marginBottom: 10 }}>Seu texto</h2><p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{r.texto}</p></div>
          <div className="stack">
            <div className="card"><div className="sub" style={{ fontSize: 13 }}>Sua nota (0 a 1000)</div><div className="score">{r.nota}</div>
              {COMPETENCIAS_REDACAO.map((c, k) => { const v = (r as any)[`c${k + 1}`] ?? 0; return <div key={k} style={{ marginTop: 14 }}><div className="row sb" style={{ marginBottom: 6 }}><span style={{ fontSize: 14 }}>{c}</span><span className="num">{v}/200</span></div><Pb p={v / 2} cls={v >= 160 ? 'ok' : ''} /></div>; })}</div>
            {r.comentario && <div className="card"><h2 className="h2">Comentário do professor</h2><p style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{r.comentario}</p></div>}
          </div>
        </div>
      ) : (
        <Editor temaId={id} inicial={r?.texto ?? ''} enviada={r?.status === 'enviada'} />
      )}
    </>
  );
}
