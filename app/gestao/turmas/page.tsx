import { exigirPerfil } from '@/lib/sessao';
import { Av } from '@/components/ui';
import { Acao, Form } from '@/components/Form';
import { alternarTrava, criarTurma, moverAluno } from '@/lib/acoes/equipe';

export const dynamic = 'force-dynamic';

export default async function Turmas() {
  const { db } = await exigirPerfil('gestao');
  const [{ data: turmas }, { data: alunos }, { data: equipe }] = await Promise.all([
    db.from('turmas').select('id,nome,turno,trava_progressiva').order('nome'),
    db.from('profiles').select('id,nome,turma_id').eq('papel', 'aluno').eq('status', 'ativo').order('nome'),
    db.from('profiles').select('id,nome,papel').in('papel', ['professor', 'gestao']).eq('status', 'ativo').order('nome'),
  ]);
  return (
    <>
      <div><h1 className="h1">Turmas e equipe</h1><p className="sub">Organize as turmas da escola e escolha como cada uma estuda.</p></div>
      <div className="cols">
        <div className="stack">
          {turmas?.map(t => { const l = (alunos ?? []).filter(a => a.turma_id === t.id); return (
            <div key={t.id} className="card"><div className="row sb"><div><h2 className="h2">{t.nome}{t.turno ? ` · ${t.turno}` : ''}</h2><p className="sub" style={{ fontSize: 13 }}>{l.length} alunos</p></div>
              <Acao action={alternarTrava.bind(null, t.id, !t.trava_progressiva) as any}>{t.trava_progressiva ? 'Trava ligada: desligar' : 'Trava desligada: ligar'}</Acao></div>
              <p className="sub" style={{ fontSize: 13, marginTop: 6 }}>Com a trava ligada, o aluno libera uma etapa de cada vez.</p></div>); })}
          <div className="card"><h2 className="h2" style={{ marginBottom: 6 }}>Alunos</h2><div className="list">{alunos?.length ? alunos.map(a => (
            <div key={`${a.id}:${a.turma_id ?? ""}`} className="li"><Av nome={a.nome} sm /><div className="tx"><b>{a.nome}</b></div>
              <Form action={moverAluno} className="row" botao="Mover" pri={false}><input type="hidden" name="id" value={a.id} /><select name="turma_id" className="inp" defaultValue={a.turma_id ?? ''} style={{ width: 130 }} aria-label={`Turma de ${a.nome}`}><option value="">Sem turma</option>{turmas?.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}</select></Form></div>)) : <div className="empty">Nenhum aluno ativo.</div>}</div></div>
        </div>
        <div className="stack">
          <div className="card"><h2 className="h2">Nova turma</h2>
            <Form action={criarTurma} botao="Criar turma"><div className="field"><label htmlFor="tn">Nome</label><input id="tn" name="nome" className="inp" required placeholder="3º A" /></div><div className="field"><label htmlFor="tu">Turno</label><input id="tu" name="turno" className="inp" placeholder="Manhã" /></div></Form></div>
          <div className="card"><h2 className="h2" style={{ marginBottom: 6 }}>Equipe</h2><div className="list">{equipe?.map(p => <div key={p.id} className="li"><Av nome={p.nome} sm /><div className="tx"><b>{p.nome}</b><small>{p.papel === 'gestao' ? 'Gestão' : 'Professor'}</small></div></div>)}</div></div>
        </div>
      </div>
    </>
  );
}
