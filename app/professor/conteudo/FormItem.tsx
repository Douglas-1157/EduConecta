'use client';
import { useState } from 'react';
import { Form, type Estado } from '@/components/Form';

type D = { id: string; nome: string; area: string }; type M = { id: string; nome: string; disciplina_id: string };
type C = { id: string; area: string; codigo: string; nome: string }; type T = { id: string; nome: string };

export function FormItem({ disciplinas, modulos, competencias, turmas, action }: { disciplinas: D[]; modulos: M[]; competencias: C[]; turmas: T[]; action: (p: Estado, f: FormData) => Promise<Estado> }) {
  const [d, setD] = useState(disciplinas[0]?.id ?? ''); const [tipo, setTipo] = useState('video');
  const disc = disciplinas.find(x => x.id === d); const mods = modulos.filter(m => m.disciplina_id === d);
  return (
    <Form action={action} botao="Publicar nas turmas">
      <div className="field"><label htmlFor="fd">Disciplina</label><select id="fd" name="disciplina_id" className="inp" value={d} onChange={e => setD(e.target.value)}>{disciplinas.map(x => <option key={x.id} value={x.id}>{x.nome}</option>)}</select></div>
      <div className="field"><label htmlFor="ft">Tipo</label><select id="ft" name="tipo" className="inp" value={tipo} onChange={e => setTipo(e.target.value)}><option value="video">Videoaula (YouTube)</option><option value="pdf">Apostila (PDF)</option></select></div>
      <div className="field"><label htmlFor="fm">Módulo</label><select id="fm" name="modulo_id" className="inp" defaultValue=""><option value="">{mods.length ? 'Escolha…' : 'Nenhum ainda'}</option>{mods.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}</select></div>
      <div className="field"><label htmlFor="fmn">…ou novo módulo</label><input id="fmn" name="modulo_novo" className="inp" placeholder="Ex.: Brasil República" /></div>
      <div className="field full"><label htmlFor="fti">Título</label><input id="fti" name="titulo" className="inp" required /></div>
      {tipo === 'video'
        ? <div className="field full"><label htmlFor="fu">Link do vídeo</label><input id="fu" name="url" type="url" className="inp" placeholder="https://www.youtube.com/watch?v=…" /></div>
        : <div className="field full"><label htmlFor="fa">Arquivo PDF</label><input id="fa" name="arquivo" type="file" accept="application/pdf" className="inp" /></div>}
      <div className="field"><label htmlFor="fmi">Duração (min)</label><input id="fmi" name="minutos" type="number" min={1} defaultValue={20} className="inp" /></div>
      <div className="field"><label htmlFor="fc">Competência</label><select id="fc" name="competencia_id" className="inp" defaultValue=""><option value="">Nenhuma</option>{competencias.filter(c => !disc || c.area === disc.area).map(c => <option key={c.id} value={c.id}>{c.codigo} · {c.nome}</option>)}</select><input name="competencia_nova" className="inp" placeholder="ou escreva outra competência" maxLength={80} style={{ marginTop: 6 }} /></div>
      <div className="field"><label htmlFor="fp">Prazo (opcional)</label><input id="fp" name="prazo" type="date" className="inp" /></div>
      <div className="field"><span className="sub" style={{ fontSize: 13, fontWeight: 500 }}>Turmas</span><div className="chips">{turmas.map(t => <label key={t.id} className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" name="turmas" value={t.id} defaultChecked style={{ marginRight: 6 }} />{t.nome}</label>)}</div></div>
    </Form>
  );
}
