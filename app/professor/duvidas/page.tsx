import Link from 'next/link';
import { exigirPerfil } from '@/lib/sessao';
import { Av } from '@/components/ui';
import { Acao } from '@/components/Form';
import { apagarSalva, responderDuvida } from '@/lib/acoes/equipe';
import { Resposta } from './Resposta';

export const dynamic = 'force-dynamic';

export default async function Duvidas({ searchParams }: { searchParams: Promise<{ aba?: string; id?: string }> }) {
  const sp = await searchParams; const aba = sp.aba === 'resp' ? 'respondida' : 'pendente';
  const { perfil, db } = await exigirPerfil();
  const [{ data: lista }, { data: salvas }] = await Promise.all([
    db.from('duvidas').select('*,profiles!duvidas_aluno_id_fkey(nome)').eq('status', aba).order('created_at', { ascending: aba === 'pendente' }),
    db.from('respostas_salvas').select('id,texto').eq('professor_id', perfil.id),
  ]);
  const sel = (lista ?? []).find((d: any) => d.id === sp.id) ?? lista?.[0];
  return (
    <>
      <div><h1 className="h1">Dúvidas</h1><p className="sub">Responda os alunos. Respostas que você repete podem ser salvas.</p></div>
      <div className="tabs" role="tablist"><Link className={aba === 'pendente' ? 'on' : ''} href="?">Pendentes</Link><Link className={aba === 'respondida' ? 'on' : ''} href="?aba=resp">Respondidas</Link></div>
      <div className="cols">
        <div className="card"><div className="list">{lista?.length ? lista.map((d: any) => (
          <Link key={d.id} href={`?aba=${aba === 'respondida' ? 'resp' : 'pend'}&id=${d.id}`} className="li" style={sel?.id === d.id ? { background: 'var(--accent-soft)' } : undefined}>
            <Av nome={d.profiles?.nome ?? '?'} sm /><div className="tx"><b>{d.profiles?.nome}</b><small>{d.contexto ?? 'Sem vínculo'}</small><small className="trunc">{d.mensagem}</small></div></Link>)) : <div className="empty">{aba === 'pendente' ? 'Nenhuma dúvida pendente. 🎉' : 'Nenhuma resposta ainda.'}</div>}</div></div>
        {sel && (
          <div className="card" key={sel.id}>
            <div className="row sb"><b>{(sel as any).profiles?.nome}</b><span className="sub" style={{ fontSize: 13 }}>{new Date(sel.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span></div>
            <p className="sub" style={{ fontSize: 13, margin: '4px 0 10px' }}>{sel.contexto ?? 'Sem vínculo'}</p>
            <p style={{ whiteSpace: 'pre-wrap' }}>{sel.mensagem}</p>
            {sel.status === 'respondida' ? <p className="note" style={{ marginTop: 14, whiteSpace: 'pre-wrap' }}><b>Sua resposta:</b> {sel.resposta}</p>
              : <Resposta id={sel.id} action={responderDuvida} salvas={salvas ?? []} />}
            {sel.status === 'pendente' && salvas?.length ? <div style={{ marginTop: 10 }}>{salvas.map(s => <span key={s.id} style={{ display: 'none' }} />)}</div> : null}
          </div>
        )}
      </div>
      {salvas?.length ? <div className="card"><h2 className="h2" style={{ marginBottom: 6 }}>Respostas salvas</h2><div className="list">{salvas.map(s => <div key={s.id} className="li"><div className="tx">{s.texto}</div><Acao className="btn sm ghost" action={apagarSalva.bind(null, s.id) as any}>Remover</Acao></div>)}</div></div> : null}
    </>
  );
}
