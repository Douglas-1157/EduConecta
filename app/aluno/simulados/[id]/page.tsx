import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirPerfil } from '@/lib/sessao';
import { Icon } from '@/components/Icon';
import { Pill } from '@/components/ui';
import { IniciarBotoes } from './IniciarBotoes';

export const dynamic = 'force-dynamic';

export default async function InfoSimulado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { perfil, db } = await exigirPerfil('aluno');
  const { data: s } = await db.from('simulados').select('id,titulo,minutos,disciplinas(nome)').eq('id', id).maybeSingle();
  if (!s) notFound();
  const [{ count }, { data: tents }] = await Promise.all([
    db.rpc('contar_questoes', { p_simulado: id }) as any,
    db.from('tentativas').select('id,treino,finalizada_em').eq('aluno_id', perfil.id).eq('simulado_id', id).order('iniciada_em', { ascending: false }),
  ]);
  const oficial = (tents ?? []).find((t: any) => !t.treino);
  const andamento = oficial && !oficial.finalizada_em ? oficial.id : null;
  const feito = oficial?.finalizada_em ? oficial.id : null;
  return (
    <>
      <div className="row"><Link href="/aluno/simulados" className="btn sm"><Icon n="left" s={14} /> Voltar</Link></div>
      <div className="card" style={{ maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div><Pill tone="wip">{(s as any).disciplinas?.nome ?? 'Geral'}</Pill><h1 className="h1" style={{ marginTop: 10 }}>{s.titulo}</h1></div>
        <div className="facts"><div className="fact"><small>Questões</small><b>{(count as any) ?? '–'}</b></div><div className="fact"><small>Tempo</small><b>{s.minutos} min</b></div><div className="fact"><small>Nota</small><b>0 a 1000</b></div></div>
        <div><h2 className="h2" style={{ marginBottom: 8 }}>Como funciona</h2><div className="list">
          {['Suas respostas são salvas sozinhas.', 'Você pode voltar e trocar respostas até entregar.', 'Marque com a bandeira as questões que quer rever.', 'O gabarito comentado aparece depois da entrega.', 'Se a internet cair, continue respondendo. Enviamos tudo quando voltar.'].map(t => (
            <div key={t} className="li" style={{ padding: '8px 0' }}><span style={{ color: 'var(--ok)' }}><Icon n="check" s={16} /></span><div className="tx">{t}</div></div>))}</div></div>
        <IniciarBotoes simuladoId={id} andamento={andamento} feito={feito} />
      </div>
    </>
  );
}
