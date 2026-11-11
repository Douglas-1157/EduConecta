'use client';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { concluirItem, enviarDuvida } from '@/lib/acoes/aluno';
import { Icon } from '@/components/Icon';

export function AulaAcoes({ itemId, tipo, concluido, titulo, proxima }: { itemId: string; tipo: 'video' | 'pdf'; concluido: boolean; titulo: string; proxima: string | null }) {
  const [pend, start] = useTransition(); const [erro, setErro] = useState(''); const [duvida, setDuvida] = useState(false); const [txt, setTxt] = useState(''); const [env, setEnv] = useState(false);
  const router = useRouter();
  const concluir = () => start(async () => { const r = await concluirItem(itemId); if (!r.ok) setErro(r.erro ?? 'Erro'); else router.refresh(); });
  const perguntar = () => start(async () => { const r = await enviarDuvida(txt, titulo, itemId); if (!r.ok) setErro(r.erro ?? 'Erro'); else { setEnv(true); setDuvida(false); setTxt(''); } });
  return (
    <>
      <div className="row">
        {concluido ? <><span className="pill ok"><Icon n="check" s={12} /> Concluída</span>{proxima && <Link href={proxima} className="btn pri lg">Próxima etapa <Icon n="arrow" s={16} /></Link>}</>
          : <button className="btn pri lg" onClick={concluir} disabled={pend}><Icon n="check" s={16} /> {tipo === 'pdf' ? 'Marcar como lida' : 'Marcar como assistida'}</button>}
        <button className="btn" onClick={() => setDuvida(!duvida)}><Icon n="chat" s={16} /> Tenho uma dúvida</button>
      </div>
      {env && <p className="okmsg">Dúvida enviada ao professor. Você vê a resposta na aba Dúvidas.</p>}
      {duvida && (
        <div className="card" style={{ display: 'grid', gap: 10 }}>
          <label className="sub" htmlFor="dv">Sua pergunta sobre “{titulo}”</label>
          <textarea id="dv" className="inp" value={txt} onChange={e => setTxt(e.target.value)} maxLength={2000} />
          <div className="row"><button className="btn pri" disabled={pend || txt.trim().length < 3} onClick={perguntar}>Enviar</button><button className="btn" onClick={() => setDuvida(false)}>Cancelar</button></div>
        </div>
      )}
      {erro && <p className="erro" role="alert">{erro}</p>}
    </>
  );
}
