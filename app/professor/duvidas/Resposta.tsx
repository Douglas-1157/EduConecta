'use client';
import { useState } from 'react';
import { Form, type Estado } from '@/components/Form';

export function Resposta({ id, action, salvas }: { id: string; action: (p: Estado, f: FormData) => Promise<Estado>; salvas: { id: string; texto: string }[] }) {
  const [txt, setTxt] = useState('');
  return (
    <Form action={action} botao="Enviar resposta" className="form" >
      <input type="hidden" name="id" value={id} />
      <div className="field full"><label htmlFor="rs">Sua resposta</label><textarea id="rs" name="resposta" className="inp" required value={txt} onChange={e => setTxt(e.target.value)} /></div>
      {salvas.length > 0 && <div className="full" style={{ display: 'grid', gap: 8 }}><span className="sub" style={{ fontSize: 13 }}>Respostas salvas</span>{salvas.map(s => <button type="button" key={s.id} className="saved" onClick={() => setTxt(s.texto)}>{s.texto}</button>)}</div>}
      <label className="full sub" style={{ fontSize: 14 }}><input type="checkbox" name="salvar" style={{ marginRight: 8 }} />Salvar esta resposta para reutilizar</label>
    </Form>
  );
}
