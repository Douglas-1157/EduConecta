import type { ReactNode } from 'react';

export function Pb({ p, cls = '' }: { p: number; cls?: string }) {
  const v = Math.max(0, Math.min(100, Math.round(p)));
  return <div className={`pb ${cls}`} role="img" aria-label={`${v}%`}><i style={{ width: `${v}%` }} /></div>;
}
export const Pill = ({ tone = '', children }: { tone?: string; children: ReactNode }) => <span className={`pill ${tone}`}>{children}</span>;
export const Av = ({ nome, sm }: { nome: string; sm?: boolean }) => (
  <span className={`av${sm ? ' sm' : ''}`}>{nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()}</span>
);
export const Vazio = ({ children }: { children: ReactNode }) => <div className="empty">{children}</div>;

export const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${String(m % 60).padStart(2, '0')}min` : ''}` : `${m}min`);

export function fmtPrazo(prazo: string | null) {
  if (!prazo) return '';
  const d = Math.round((new Date(prazo + 'T12:00:00').getTime() - new Date().setHours(12, 0, 0, 0)) / 86400000);
  if (d < 0) return 'atrasada';
  if (d === 0) return 'hoje';
  if (d === 1) return 'amanhã';
  return `até ${new Date(prazo + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}`;
}
export const saudacao = () => { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
export const primeiroNome = (n: string) => n.split(' ')[0];
