import Link from 'next/link';
import { exigirPerfil } from '@/lib/sessao';
import { carregarTrilhas } from '@/lib/trilha';
import { Icon } from '@/components/Icon';
import { Pb, fmtPrazo } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function Simulados() {
  const { perfil, db } = await exigirPerfil('aluno');
  const [{ disciplinas }, { data: sims }, { data: tent }] = await Promise.all([
    carregarTrilhas(db, perfil),
    db.from('simulados').select('id,titulo,minutos,disciplinas(nome),simulado_turmas(prazo)').order('created_at', { ascending: false }),
    db.from('tentativas').select('id,simulado_id,nota,treino,finalizada_em,simulados(titulo)').eq('aluno_id', perfil.id).order('iniciada_em', { ascending: false }),
  ]);
  const itens = disciplinas.flatMap(d => d.itens);
  const feitos = new Set((tent ?? []).filter((t: any) => !t.treino && t.finalizada_em).map((t: any) => t.simulado_id));
  const abertos = (sims ?? []).filter((s: any) => !feitos.has(s.id)) as any[];
  const liberado = (id: string) => { const it = itens.find(i => i.simulado_id === id); return !it || it.estado !== 'lock'; };
  const disp = abertos.filter(s => liberado(s.id)), espera = abertos.filter(s => !liberado(s.id));
  const hist = ((tent ?? []) as any[]).filter(t => t.finalizada_em);
  return (
    <>
      <div><h1 className="h1">Simulados</h1><p className="sub">Treine com questões comentadas e acompanhe sua evolução.</p></div>
      <div className="cols">
        <div className="stack">
          <div className="card"><h2 className="h2" style={{ marginBottom: 8 }}>Liberados para você</h2>
            {disp.length ? <div className="list">{disp.map(s => (
              <div key={s.id} className="li"><span className="ico"><Icon n="exam" /></span>
                <div className="tx"><b>{s.titulo}</b><small>{s.disciplinas?.nome ?? 'Geral'} · {s.minutos} min{s.simulado_turmas?.[0]?.prazo ? ` · ${fmtPrazo(s.simulado_turmas[0].prazo)}` : ''}</small></div>
                <Link className="btn pri" href={`/aluno/simulados/${s.id}`}>Fazer simulado</Link></div>))}</div>
              : <div className="empty">Nenhum simulado liberado agora. Avance na sua trilha para liberar o próximo.</div>}</div>
          {espera.length > 0 && <div className="card"><h2 className="h2" style={{ marginBottom: 4 }}>Em breve</h2><div className="list">{espera.map(s => (
            <div key={s.id} className="li"><span className="ico"><Icon n="lock" /></span><div className="tx"><b>{s.titulo}</b><small>Conclua as etapas anteriores da trilha para liberar.</small></div></div>))}</div></div>}
        </div>
        <div className="stack">
          <div className="card"><div className="row sb"><h2 className="h2">Suas notas</h2><span className="sub" style={{ fontSize: 13 }}>de 0 a 1000</span></div>
            <div style={{ marginTop: 6 }} className="list">{hist.length ? hist.map(t => (
              <Link key={t.id} href={`/aluno/resultado/${t.id}`} className="li"><div className="tx"><b>{t.simulados?.titulo}{t.treino ? ' (treino)' : ''}</b><small>{new Date(t.finalizada_em).toLocaleDateString('pt-BR')}</small></div><div style={{ width: 90 }}><Pb p={Math.round(t.nota / 10)} /></div><b className="mono">{t.nota}</b></Link>))
              : <div className="empty">Você ainda não fez nenhum simulado.</div>}</div></div>
          <div className="note">A nota é uma métrica da plataforma para você acompanhar a evolução. Não é a nota oficial do ENEM.</div>
        </div>
      </div>
    </>
  );
}
