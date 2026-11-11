'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { iniciarSimulado } from '@/lib/acoes/aluno';

export function IniciarBotoes({ simuladoId, andamento, feito }: { simuladoId: string; andamento: string | null; feito: string | null }) {
  const [pend, start] = useTransition(); const [erro, setErro] = useState(''); const r = useRouter();
  const ir = (treino: boolean) => start(async () => {
    const x = await iniciarSimulado(simuladoId, treino);
    if (!x.ok) setErro(x.erro ?? 'Erro'); else r.push(`/aluno/prova/${x.tentativa}`);
  });
  return (
    <>
      <div className="row">
        {feito ? <><Link className="btn pri lg" href={`/aluno/resultado/${feito}`}>Ver correção</Link><button className="btn lg" disabled={pend} onClick={() => ir(true)}>Treinar de novo</button></>
          : <button className="btn pri lg" disabled={pend} onClick={() => ir(false)}>{andamento ? 'Continuar de onde parou' : 'Começar simulado'}</button>}
      </div>
      {erro && <p className="erro" role="alert">{erro}</p>}
    </>
  );
}
