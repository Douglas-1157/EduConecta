import Link from 'next/link';
import { exigirPerfil } from '@/lib/sessao';
import { Icon } from '@/components/Icon';
import { fmtMin } from '@/components/ui';
import { Foco } from './Foco';

export const dynamic = 'force-dynamic';
export default async function FocoPage() {
  const { perfil, db } = await exigirPerfil('aluno');
  const { data } = await db.from('sessoes_estudo').select('minutos,feito_em,origem').eq('aluno_id', perfil.id).order('feito_em', { ascending: false }).limit(8);
  const tot = (data ?? []).reduce((s, x) => s + x.minutos, 0);
  return (
    <>
      <div className="row"><Link href="/aluno" className="btn sm"><Icon n="left" s={14} /> Voltar</Link></div>
      <div><h1 className="h1">Cronômetro de foco</h1><p className="sub">Cada bloco concluído soma na sua meta da semana.</p></div>
      <div className="cols">
        <Foco />
        <div className="card"><h2 className="h2">Últimas sessões</h2><div style={{ margin: '10px 0', fontSize: 24, fontWeight: 600 }}>{fmtMin(tot)}</div>
          <div className="list">{(data ?? []).length ? data!.map((l, i) => <div key={i} className="li" style={{ padding: '10px 0' }}><div className="tx">{new Date(l.feito_em).toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}<small>{l.origem === 'foco' ? 'Bloco de foco' : 'Conteúdo concluído'}</small></div><span className="num">{l.minutos} min</span></div>) : <div className="empty">Nenhuma sessão ainda.</div>}</div></div>
      </div>
    </>
  );
}
