'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { enviarDuvida } from '@/lib/acoes/aluno';

export function NovaDuvida({ contexto }: { contexto: string }) {
  const [ctx, setCtx] = useState(contexto); const [msg, setMsg] = useState(''); const [pend, start] = useTransition(); const [ok, setOk] = useState(false); const [erro, setErro] = useState(''); const r = useRouter();
  const enviar = (e: React.FormEvent) => { e.preventDefault(); setErro(''); start(async () => { const x = await enviarDuvida(msg, ctx.trim() || null, null); if (!x.ok) setErro(x.erro ?? 'Erro'); else { setOk(true); setMsg(''); r.refresh(); } }); };
  return (
    <div className="card"><h2 className="h2">Nova dúvida</h2>
      <form className="form" onSubmit={enviar} style={{ marginTop: 14 }}>
        <div className="field full"><label htmlFor="dc">Sobre qual conteúdo? (opcional)</label><input id="dc" className="inp" value={ctx} onChange={e => setCtx(e.target.value)} maxLength={200} placeholder="Ex.: Aula · Era Vargas" /></div>
        <div className="field full"><label htmlFor="dm">Sua pergunta</label><textarea id="dm" className="inp" required minLength={3} maxLength={2000} value={msg} onChange={e => setMsg(e.target.value)} placeholder="Explique onde você travou" /></div>
        <div className="full"><button className="btn pri" type="submit" disabled={pend}>Enviar ao professor</button></div>
        {ok && <p className="okmsg full">Dúvida enviada.</p>}{erro && <p className="erro full">{erro}</p>}
      </form></div>
  );
}
