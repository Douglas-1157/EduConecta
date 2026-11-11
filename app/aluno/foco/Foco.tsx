'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { registrarFoco } from '@/lib/acoes/aluno';

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function Foco() {
  const [dur, setDur] = useState(25); const [left, setLeft] = useState(25 * 60); const [run, setRun] = useState(false); const [msg, setMsg] = useState('');
  const fim = useRef<number | null>(null); const r = useRouter();
  const gastoMin = (dur * 60 - left) / 60;

  useEffect(() => {
    if (!run) return;
    const t = setInterval(() => { const l = Math.max(0, Math.round(((fim.current ?? 0) - Date.now()) / 1000)); setLeft(l); if (l === 0) { setRun(false); concluir(dur); } }, 500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, dur]);

  async function concluir(min: number) {
    const m = Math.floor(min); if (m < 1) { setMsg('Estude pelo menos 1 minuto para registrar.'); return; }
    const x = await registrarFoco(m);
    setMsg(x.ok ? `${m} min somados à sua meta da semana.` : x.erro ?? 'Não foi possível registrar.');
    setLeft(dur * 60); r.refresh();
  }
  const trocar = (m: number) => { setDur(m); setLeft(m * 60); setRun(false); };
  const alternar = () => { if (!run) fim.current = Date.now() + left * 1000; setRun(!run); };

  return (
    <div className="card">
      <div className="row sb"><span className="pill wip">Bloco de foco</span>
        <div className="tabs">{[15, 25, 50].map(m => <button key={m} className={dur === m ? 'on' : ''} onClick={() => trocar(m)} disabled={run}>{m} min</button>)}</div></div>
      <div className="ptime" style={{ marginTop: 16 }}>{mmss(left)}</div>
      <div className="row" style={{ justifyContent: 'center' }}>
        <button className="btn pri lg" onClick={alternar}>{run ? 'Pausar' : left < dur * 60 ? 'Continuar' : 'Iniciar'}</button>
        <button className="btn" onClick={() => { setRun(false); setLeft(dur * 60); }}>Reiniciar</button>
        <button className="btn" onClick={() => { setRun(false); concluir(gastoMin); }}>Concluir agora</button>
      </div>
      {msg && <p className="note" style={{ marginTop: 14 }} role="status">{msg}</p>}
    </div>
  );
}
