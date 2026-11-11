'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { responderQuestao, finalizarSimulado } from '@/lib/acoes/aluno';

type Q = { id: string; enunciado: string; alternativas: string[]; competencia: string | null; marcada: number | null };
const L = 'ABCDEF';
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export function Prova({ tentativa, titulo, restante, questoes }: { tentativa: string; titulo: string; restante: number; questoes: Q[] }) {
  const router = useRouter();
  const chave = `fila-${tentativa}`;
  const [i, setI] = useState(0);
  const [resp, setResp] = useState<(number | null)[]>(questoes.map(q => q.marcada));
  const [marc, setMarc] = useState<boolean[]>(questoes.map(() => false));
  const [left, setLeft] = useState(restante);
  const [off, setOff] = useState(false); const [fila, setFila] = useState(0); const [salvo, setSalvo] = useState('');
  const [conf, setConf] = useState(false); const [saindo, setSaindo] = useState(false); const [erro, setErro] = useState(''); const [env, setEnv] = useState(false);
  const entregue = useRef(false);

  const lerFila = (): Record<string, number> => { try { return JSON.parse(localStorage.getItem(chave) || '{}'); } catch { return {}; } };
  const gravarFila = (f: Record<string, number>) => { try { localStorage.setItem(chave, JSON.stringify(f)); } catch { /* sem armazenamento */ } setFila(Object.keys(f).length); };

  const enviarFila = useCallback(async () => {
    const f = lerFila(); let ok = true;
    for (const [q, m] of Object.entries(f)) {
      try { const r = await responderQuestao(tentativa, q, m); if (r.ok) delete f[q]; else ok = false; } catch { ok = false; break; }
    }
    gravarFila(f); setOff(!ok && Object.keys(f).length > 0);
    if (ok) setSalvo(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    return ok && Object.keys(f).length === 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tentativa]);

  useEffect(() => { setFila(Object.keys(lerFila()).length); enviarFila(); const on = () => enviarFila(); window.addEventListener('online', on); return () => window.removeEventListener('online', on); }, [enviarFila]);

  const entregar = useCallback(async () => {
    if (entregue.current) return; entregue.current = true; setEnv(true); setErro('');
    const ok = await enviarFila();
    if (!ok) { entregue.current = false; setEnv(false); setErro('Sem conexão. Suas respostas estão guardadas; tente entregar quando a internet voltar.'); return; }
    try { const r = await finalizarSimulado(tentativa); if (!r.ok) throw new Error(r.erro); try { localStorage.removeItem(chave); } catch { /* ok */ } router.replace(`/aluno/resultado/${tentativa}`); }
    catch (e: any) { entregue.current = false; setEnv(false); setErro(e?.message ?? 'Não foi possível entregar agora. Tente de novo.'); }
  }, [enviarFila, tentativa, router, chave]);

  useEffect(() => { const t = setInterval(() => setLeft(l => Math.max(0, l - 1)), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { if (left === 0) entregar(); }, [left, entregar]);

  async function marcar(k: number) {
    const novo = [...resp]; novo[i] = k; setResp(novo);
    try { const r = await responderQuestao(tentativa, questoes[i].id, k); if (!r.ok) throw new Error(r.erro); setOff(false); setSalvo(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })); }
    catch { const f = lerFila(); f[questoes[i].id] = k; gravarFila(f); setOff(true); }
  }

  const q = questoes[i]; const resp_n = resp.filter(r => r !== null).length;
  if (!q) return <div className="page"><div className="empty">Este simulado ainda não tem questões.</div></div>;
  return (
    <>
      <div className="top">
        <button className="btn sm" onClick={() => setSaindo(true)}><Icon n="left" s={14} /> Sair</button>
        <b className="trunc">{titulo}</b><span className="sp" />
        <span className={`pill mono${left < 300 ? ' warn' : ''}`}>{mmss(left)}</span>
      </div>
      <div className="page">
        <div className="cols">
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="row sb"><span className="sub num">Questão {i + 1} de {questoes.length}</span>{q.competencia && <span className="pill">{q.competencia}</span>}</div>
            <p style={{ fontSize: 17, textWrap: 'pretty', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{q.enunciado}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q.alternativas.map((o, k) => <button key={k} className={`alt${resp[i] === k ? ' sel' : ''}`} onClick={() => marcar(k)}><span className="lt">{L[k]}</span><span>{o}</span></button>)}
            </div>
            <div className="row sb">
              <button className="btn" disabled={i === 0} onClick={() => setI(i - 1)}><Icon n="left" s={14} /> Anterior</button>
              <button className={`btn${marc[i] ? ' pri' : ''}`} aria-pressed={marc[i]} onClick={() => setMarc(marc.map((m, k) => (k === i ? !m : m)))}><Icon n="flag" s={14} /> {marc[i] ? 'Marcada' : 'Marcar para rever'}</button>
              {i < questoes.length - 1 ? <button className="btn pri" onClick={() => setI(i + 1)}>Próxima <Icon n="right" s={14} /></button> : <button className="btn pri" onClick={() => setConf(true)}>Revisar e entregar</button>}
            </div>
          </div>
          <div className="stack">
            <div className="card">
              <h2 className="h2">Suas respostas</h2>
              <div className="qgrid" style={{ margin: '12px 0' }}>
                {questoes.map((_, k) => <button key={k} className={`qn${resp[k] !== null ? ' ans' : ''}${k === i ? ' cur' : ''}${marc[k] ? ' fl' : ''}`} onClick={() => setI(k)} aria-label={`Questão ${k + 1}${resp[k] !== null ? ', respondida' : ''}`}>{k + 1}</button>)}
              </div>
              <p className="sub num">{resp_n} de {questoes.length} respondidas</p>
              <p className={off ? 'note warn' : 'sub'} style={{ marginTop: 10, fontSize: 13 }}>{off ? `Sem conexão. ${fila} resposta(s) guardadas no aparelho. Enviamos quando voltar.` : salvo ? `Salvo às ${salvo}.` : 'Suas respostas são salvas sozinhas.'}</p>
            </div>
            {conf && (
              <div className="card"><h2 className="h2">Entregar o simulado?</h2>
                <p className="sub" style={{ margin: '8px 0 14px' }}>{questoes.length - resp_n ? `Faltam ${questoes.length - resp_n} questão(ões) sem resposta.` : 'Todas as questões foram respondidas.'}{marc.some(Boolean) ? ' Você marcou questões para rever.' : ''} O gabarito aparece depois da entrega.</p>
                <div className="row"><button className="btn pri" disabled={env} onClick={entregar}>{env ? 'Entregando…' : 'Entregar agora'}</button><button className="btn" onClick={() => setConf(false)}>Voltar à prova</button></div>
                {erro && <p className="erro" role="alert" style={{ marginTop: 10 }}>{erro}</p>}</div>
            )}
            {saindo && (
              <div className="card"><h2 className="h2">Sair da prova?</h2>
                <p className="sub" style={{ margin: '8px 0 14px' }}>Suas respostas ficam guardadas. Atenção: o tempo continua correndo enquanto a prova estiver aberta.</p>
                <div className="row"><button className="btn pri" onClick={() => router.push('/aluno/simulados')}>Sair e continuar depois</button><button className="btn" onClick={() => setSaindo(false)}>Ficar</button></div></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
