'use client';
import { useActionState, type ReactNode } from 'react';

export type Estado = { ok: boolean; msg: string };
export const vazio: Estado = { ok: false, msg: '' };

// Formulário ligado a uma Server Action, com mensagem de sucesso/erro embaixo.
export function Form({ action, children, className = 'form', botao = 'Salvar', pri = true }: {
  action: (prev: Estado, fd: FormData) => Promise<Estado>; children: ReactNode; className?: string; botao?: string; pri?: boolean;
}) {
  const [st, fn, pend] = useActionState(action, vazio);
  return (
    <form action={fn} className={className}>
      {children}
      <div className="full row">
        <button className={`btn${pri ? ' pri' : ''}`} type="submit" disabled={pend}>{pend ? 'Aguarde…' : botao}</button>
        {st.msg && <span className={st.ok ? 'okmsg' : 'erro'} role={st.ok ? 'status' : 'alert'}>{st.msg}</span>}
      </div>
    </form>
  );
}

// Botão que dispara uma Server Action simples (aprovar, recusar, apagar...)
export function Acao({ action, children, className = 'btn sm', confirmar }: { action: () => Promise<Estado | void>; children: ReactNode; className?: string; confirmar?: string }) {
  const [, fn, pend] = useActionState(async () => { if (confirmar && !window.confirm(confirmar)) return vazio; await action(); return vazio; }, vazio);
  return <form action={fn} style={{ display: 'inline' }}><button className={className} type="submit" disabled={pend}>{children}</button></form>;
}
