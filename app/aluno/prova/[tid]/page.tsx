import { notFound, redirect } from 'next/navigation';
import { exigirPerfil } from '@/lib/sessao';
import { Prova } from './Prova';

export const dynamic = 'force-dynamic';

export default async function ProvaPage({ params }: { params: Promise<{ tid: string }> }) {
  const { tid } = await params;
  const { perfil, db } = await exigirPerfil('aluno');
  const { data: t } = await db.from('tentativas').select('id,iniciada_em,finalizada_em,treino,simulados(titulo,minutos)').eq('id', tid).eq('aluno_id', perfil.id).maybeSingle();
  if (!t) notFound();
  if (t.finalizada_em) redirect(`/aluno/resultado/${tid}`);
  const { data: qs } = await db.rpc('questoes_da_tentativa', { p_tentativa: tid });
  const s: any = t.simulados;
  const total = s.minutos * 60, gasto = Math.floor((Date.now() - new Date(t.iniciada_em).getTime()) / 1000);
  return <Prova tentativa={tid} titulo={`${t.treino ? 'Treino · ' : ''}${s.titulo}`} restante={Math.max(0, total - gasto)}
    questoes={((qs ?? []) as any[]).map(q => ({ id: q.questao_id, enunciado: q.enunciado, alternativas: q.alternativas as string[], competencia: q.competencia, marcada: q.marcada }))} />;
}
