'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { salvarRedacao } from '@/lib/acoes/aluno';

export function Editor({ temaId, inicial, enviada }: { temaId: string; inicial: string; enviada: boolean }) {
  const [txt, setTxt] = useState(inicial); const [pend, start] = useTransition(); const [msg, setMsg] = useState(''); const [erro, setErro] = useState(''); const r = useRouter();
  const palavras = txt.trim() ? txt.trim().split(/\s+/).length : 0;
  const agir = (enviar: boolean) => start(async () => {
    setErro(''); setMsg(''); const x = await salvarRedacao(temaId, txt, enviar);
    if (!x.ok) setErro(x.erro ?? 'Erro'); else { setMsg(enviar ? 'Redação enviada ao professor.' : 'Rascunho salvo.'); r.refresh(); }
  });
  return (
    <div className="card" style={{ display: 'grid', gap: 12 }}>
      {enviada && <p className="note">Esta redação já foi enviada e aguarda correção. Você ainda pode ajustar e reenviar antes de o professor corrigir.</p>}
      <label className="sr" htmlFor="red">Texto da redação</label>
      <textarea id="red" className="inp" style={{ minHeight: 380, lineHeight: 1.7 }} value={txt} onChange={e => setTxt(e.target.value)} placeholder="Escreva o seu texto dissertativo-argumentativo aqui…" />
      <div className="row sb"><span className="sub num">{palavras} palavras · no ENEM, a redação tem de 7 a 30 linhas</span>
        <div className="row"><button className="btn" disabled={pend} onClick={() => agir(false)}>Salvar rascunho</button><button className="btn pri" disabled={pend} onClick={() => agir(true)}>{enviada ? 'Reenviar' : 'Enviar para correção'}</button></div></div>
      {msg && <p className="okmsg" role="status">{msg}</p>}{erro && <p className="erro" role="alert">{erro}</p>}
    </div>
  );
}
