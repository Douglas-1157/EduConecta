'use client';
import { useState } from 'react';
import { Form, type Estado } from '@/components/Form';

type A = (p: Estado, f: FormData) => Promise<Estado>;
type D = { id: string; nome: string; area: string }; type C = { id: string; area: string; codigo: string; nome: string }; type T = { id: string; nome: string };
type Q = { id: string; enunciado: string; disciplina_id: string; n: number; comp: string | null };

export function Banco({ disciplinas, competencias, turmas, modulos, questoes, criarQuestao, criarSimulado }: {
  disciplinas: D[]; competencias: C[]; turmas: T[]; modulos: { id: string; nome: string; disciplina_id: string }[]; questoes: Q[]; criarQuestao: A; criarSimulado: A;
}) {
  const [aba, setAba] = useState<'banco' | 'nova' | 'simulado'>('banco'); const [fd, setFd] = useState('');
  const [d, setD] = useState(disciplinas[0]?.id ?? '');
  const area = disciplinas.find(x => x.id === d)?.area;
  const lista = questoes.filter(q => !fd || q.disciplina_id === fd);
  return (
    <>
      <div className="tabs" role="tablist">{([['banco', 'Banco'], ['nova', 'Nova questão'], ['simulado', 'Montar simulado']] as const).map(([k, l]) => <button key={k} role="tab" className={aba === k ? 'on' : ''} onClick={() => setAba(k)}>{l}</button>)}</div>
      {aba === 'banco' && (
        <div className="card">
          <div className="row" style={{ marginBottom: 10 }}><label className="sr" htmlFor="filtro">Disciplina</label><select id="filtro" className="inp" style={{ maxWidth: 260 }} value={fd} onChange={e => setFd(e.target.value)}><option value="">Todas as disciplinas</option>{disciplinas.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select><span className="sub">{lista.length} questões</span></div>
          <div className="list">{lista.length ? lista.map(q => <div key={q.id} className="li"><div className="tx"><b className="trunc" style={{ display: 'block' }}>{q.enunciado}</b><small>{disciplinas.find(x => x.id === q.disciplina_id)?.nome}{q.comp ? ` · comp. ${q.comp}` : ''} · {q.n} alternativas</small></div></div>) : <div className="empty">Nenhuma questão ainda.</div>}</div>
        </div>
      )}
      {aba === 'nova' && (
        <div className="card"><h2 className="h2">Nova questão</h2>
          <Form action={criarQuestao} botao="Salvar no banco">
            <div className="field"><label htmlFor="qd">Disciplina</label><select id="qd" name="disciplina_id" className="inp" value={d} onChange={e => setD(e.target.value)}>{disciplinas.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></div>
            <div className="field"><label htmlFor="qc">Competência</label><select id="qc" name="competencia_id" className="inp" defaultValue=""><option value="">Nenhuma</option>{competencias.filter(c => c.area === area).map(c => <option key={c.id} value={c.id}>{c.codigo} · {c.nome}</option>)}</select><input name="competencia_nova" className="inp" placeholder="ou escreva outra competência" maxLength={80} style={{ marginTop: 6 }} /></div>
            <div className="field full"><label htmlFor="qe">Enunciado</label><textarea id="qe" name="enunciado" className="inp" required /></div>
            {[0, 1, 2, 3, 4].map(i => <div key={i} className="field full"><label htmlFor={`a${i}`}>Alternativa {'ABCDE'[i]}{i > 1 ? ' (opcional)' : ''}</label><div className="row" style={{ flexWrap: 'nowrap' }}><input id={`a${i}`} name={`alt${i}`} className="inp" required={i < 2} /><label className="chip" style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}><input type="radio" name="correta" value={i} required style={{ marginRight: 6 }} />correta</label></div></div>)}
            <div className="field full"><label htmlFor="qj">Comentário do gabarito (aparece depois da entrega)</label><textarea id="qj" name="comentario" className="inp" /></div>
          </Form></div>
      )}
      {aba === 'simulado' && (
        <div className="card"><h2 className="h2">Montar simulado</h2>
          <Form action={criarSimulado} botao="Publicar simulado">
            <div className="field full"><label htmlFor="st">Título</label><input id="st" name="titulo" className="inp" required /></div>
            <div className="field"><label htmlFor="sd">Disciplina</label><select id="sd" name="disciplina_id" className="inp" value={d} onChange={e => setD(e.target.value)}><option value="">Geral (várias)</option>{disciplinas.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></div>
            <div className="field"><label htmlFor="sm">Tempo (min)</label><input id="sm" name="minutos" type="number" min={5} defaultValue={30} className="inp" /></div>
            <div className="field"><label htmlFor="smo">Encaixar na trilha (opcional)</label><select id="smo" name="modulo_id" className="inp" defaultValue=""><option value="">Fora da trilha</option>{modulos.filter(m => m.disciplina_id === d).map(m => <option key={m.id} value={m.id}>Fim de “{m.nome}”</option>)}</select></div>
            <div className="field"><label htmlFor="sp">Prazo (opcional)</label><input id="sp" name="prazo" type="date" className="inp" /></div>
            <div className="field full"><span className="sub" style={{ fontSize: 13, fontWeight: 500 }}>Turmas</span><div className="chips">{turmas.map(t => <label key={t.id} className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" name="turmas" value={t.id} defaultChecked style={{ marginRight: 6 }} />{t.nome}</label>)}</div></div>
            <div className="field full"><span className="sub" style={{ fontSize: 13, fontWeight: 500 }}>Questões ({questoes.filter(q => !d || q.disciplina_id === d).length} da disciplina escolhida)</span>
              <div className="list" style={{ maxHeight: 320, overflow: 'auto', border: '1px solid var(--line)', borderRadius: 10, padding: '0 12px' }}>
                {questoes.filter(q => !d || q.disciplina_id === d).map(q => <label key={q.id} className="li" style={{ cursor: 'pointer' }}><input type="checkbox" name="questoes" value={q.id} /><div className="tx"><b className="trunc" style={{ display: 'block' }}>{q.enunciado}</b><small>{q.comp ? `comp. ${q.comp}` : 'sem competência'}</small></div></label>)}
              </div></div>
          </Form></div>
      )}
    </>
  );
}
