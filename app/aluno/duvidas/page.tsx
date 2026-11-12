import { exigirPerfil } from '@/lib/sessao';
import { NovaDuvida } from './NovaDuvida';

export const dynamic = 'force-dynamic';
export default async function Duvidas({ searchParams }: { searchParams: Promise<{ ctx?: string }> }) {
  const sp = await searchParams;
  const { perfil, db } = await exigirPerfil('aluno');
  const { data } = await db.from('duvidas').select('*').eq('aluno_id', perfil.id).order('created_at', { ascending: false });
  await db.rpc('marcar_duvidas_vistas');
  return (
    <>
      <div><h1 className="h1">Dúvidas</h1><p className="sub">Pergunte ao professor. Você também pode perguntar de dentro de uma aula ou de uma questão.</p></div>
      <div className="cols">
        <NovaDuvida contexto={sp.ctx ?? ''} />
        <div className="card"><h2 className="h2">Suas perguntas</h2>
          {data?.length ? data.map(d => (
            <div key={d.id} style={{ padding: '14px 0', borderTop: '1px solid var(--line)', marginTop: 12 }}>
              <div className="row sb"><span className="sub" style={{ fontSize: 13 }}>{d.contexto ?? 'Sem vínculo'}</span>{d.status === 'respondida' ? <span className="pill ok">Respondida</span> : <span className="pill warn">Aguardando</span>}</div>
              <p style={{ margin: '6px 0', whiteSpace: 'pre-wrap' }}>{d.mensagem}</p>
              {d.resposta && <p className="note" style={{ whiteSpace: 'pre-wrap' }}><b>Professor:</b> {d.resposta}</p>}
            </div>)) : <div className="empty" style={{ marginTop: 12 }}>Você ainda não fez perguntas.</div>}
        </div>
      </div>
    </>
  );
}
