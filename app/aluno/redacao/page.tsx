import Link from 'next/link';
import { exigirPerfil } from '@/lib/sessao';
import { Icon } from '@/components/Icon';
import { fmtPrazo } from '@/components/ui';

export const dynamic = 'force-dynamic';
const ROTULO: Record<string, [string, string]> = { rascunho: ['Rascunho', 'wip'], enviada: ['Aguardando correção', 'warn'], corrigida: ['Corrigida', 'ok'] };

export default async function Redacao() {
  const { perfil, db } = await exigirPerfil('aluno');
  const [{ data: temas }, { data: reds }] = await Promise.all([
    db.from('redacao_temas').select('id,titulo,prazo').order('created_at', { ascending: false }),
    db.from('redacoes').select('tema_id,status,nota').eq('aluno_id', perfil.id),
  ]);
  const por = new Map((reds ?? []).map(r => [r.tema_id, r]));
  const med = (reds ?? []).filter(r => r.status === 'corrigida');
  return (
    <>
      <div><h1 className="h1">Redação</h1><p className="sub">Escreva sobre os temas propostos. O professor corrige com as 5 competências do ENEM e deixa comentários.</p></div>
      <div className="cols">
        <div className="card"><h2 className="h2" style={{ marginBottom: 8 }}>Temas</h2>
          {temas?.length ? <div className="list">{temas.map(t => { const r = por.get(t.id); const [rot, tom] = r ? ROTULO[r.status] : ['Não iniciada', '']; return (
            <div key={t.id} className="li"><span className="ico"><Icon n="file" /></span>
              <div className="tx"><b>{t.titulo}</b><small>{t.prazo ? `Prazo: ${fmtPrazo(t.prazo)}` : 'Sem prazo'}</small></div>
              <span className={`pill ${tom}`}>{rot}{r?.status === 'corrigida' ? ` · ${r.nota}` : ''}</span>
              <Link className={`btn sm${!r ? ' pri' : ''}`} href={`/aluno/redacao/${t.id}`}>{!r ? 'Escrever' : r.status === 'rascunho' ? 'Continuar' : 'Abrir'}</Link></div>); })}</div>
            : <div className="empty">Nenhum tema liberado para a sua turma ainda.</div>}</div>
        <div className="stack">
          <div className="card"><h2 className="h2">Suas notas</h2>
            {med.length ? <div className="list" style={{ marginTop: 6 }}>{med.map(r => <div key={r.tema_id} className="li"><div className="tx">{temas?.find(t => t.id === r.tema_id)?.titulo}</div><b className="mono">{r.nota}</b></div>)}</div> : <div className="empty" style={{ marginTop: 8 }}>Suas redações corrigidas aparecem aqui.</div>}</div>
          <div className="note">Cada competência vale de 0 a 200 pontos, total de 0 a 1000.</div>
        </div>
      </div>
    </>
  );
}
