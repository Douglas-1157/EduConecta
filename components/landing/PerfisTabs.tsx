'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { Av } from '@/components/ui';

const Qr = ({ ic, t, s, right }: { ic?: string; t: string; s: string; right?: React.ReactNode }) => (
  <div className="qr"><span className="ic2"><Icon n={ic ?? 'users'} s={16} /></span><span><b style={{ fontWeight: 600 }}>{t}</b><br /><small style={{ color: 'var(--mute)' }}>{s}</small></span>{right}</div>
);
const Pessoa = ({ n, s, p, tom }: { n: string; s: string; p: string; tom: string }) => (
  <div className="qr"><Av nome={n} sm /><span><b style={{ fontWeight: 600 }}>{n}</b><br /><small style={{ color: 'var(--mute)' }}>{s}</small></span><span className={`pill ${tom}`}>{p}</span></div>
);

const PF = {
  aluno: { n: 'Aluno', s: 'Estuda e faz simulados', h: 'Sabe o que estudar hoje, sem se perder.', b: 'Entrar como aluno',
    l: ['Fila de estudo do dia', 'Trilhas por disciplina, de todas as áreas do ENEM', 'Simulados com gabarito comentado', 'Redação corrigida pelo professor', 'Cronômetro de foco e meta semanal'],
    v: <><Qr ic="play" t="Era Vargas e Estado Novo" s="Aula · 28 min · 72%" /><Qr ic="exam" t="Simulado liberado" s="30 min · 6 questões" /><Qr ic="file" t="Cartografia e escalas" s="Apostila · atrasada" /></> },
  professor: { n: 'Professor', s: 'Publica e acompanha', h: 'Vê quem precisa de ajuda antes da próxima aula.', b: 'Entrar como professor',
    l: ['Veja quem precisa de atenção', 'Publique uma vez para várias turmas', 'Banco de questões e simulados', 'Correção de redação pelas 5 competências', 'Central de dúvidas com respostas salvas'],
    v: <><Pessoa n="Caio Menezes" s="Sem estudar há 7 dias" p="Em risco" tom="bad" /><Pessoa n="João Pedro Lima" s="Média caiu 12 pontos" p="Atenção" tom="warn" /><Pessoa n="Marina Alves" s="No ritmo" p="No ritmo" tom="ok" /></> },
  gestao: { n: 'Gestão da escola', s: 'Cuida dos cadastros', h: 'Tem a escola inteira sob controle, sem planilha solta.', b: 'Entrar na gestão',
    l: ['Visão geral da escola e das turmas', 'Aprovação de novos cadastros', 'Cadastro de professores e turmas', 'Acompanhamento da adesão por turma', 'Trava progressiva ligada por turma'],
    v: <><Pessoa n="Gustavo Reis" s="3º A · aguardando" p="Aprovar" tom="wip" /><Qr t="3º A · Manhã" s="Adesão 70%" /><Qr t="3º B · Tarde" s="Adesão 67%" /></> },
} as const;

export function PerfisTabs() {
  const [k, setK] = useState<keyof typeof PF>('aluno'); const p = PF[k];
  return (
    <div className="pfwrap">
      <div className="pftabs" role="tablist">{(Object.keys(PF) as (keyof typeof PF)[]).map(x => <button key={x} className={`pft${k === x ? ' on' : ''}`} role="tab" aria-selected={k === x} onClick={() => setK(x)}><div><span>{PF[x].n}</span><small>{PF[x].s}</small></div></button>)}</div>
      <div className="pfp" id="pfp">
        <div><h3>{p.h}</h3><ul className="cl" style={{ margin: '18px 0 22px' }}>{p.l.map(i => <li key={i}><Icon n="check" s={16} /><span>{i}</span></li>)}</ul>
          <Link className={`btn${k === 'aluno' ? ' pri' : ''}`} href="/entrar">{p.b}</Link></div>
        <div className="pfv">{p.v}</div>
      </div>
    </div>
  );
}
