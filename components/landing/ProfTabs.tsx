'use client';
import { useState } from 'react';
import { Av } from '@/components/ui';

const Cols = ({ v, rows }: { v: number[]; rows: number }) => (
  <div className="dch" style={{ ['--n' as any]: v.length, ['--r' as any]: rows }}>
    {v.map((n, i) => <div key={i}>{Array.from({ length: rows }, (_, k) => rows - 1 - k).map(k => <i key={k} className={k < n ? 'on' : ''} />)}</div>)}
  </div>
);
const Bar = ({ p }: { p: number }) => <div className="dbar"><i style={{ width: `${p}%` }} /></div>;
const Linha = ({ n, t, p, tom }: { n: string; t: string; p: string; tom: string }) => (
  <div className="dk-row"><Av nome={n} sm /><div><b>{n}</b><small>{t}</small></div><span className={`dpill ${tom}`}>{p}</span></div>
);

// Exemplo ilustrativo: dados de demonstração, não vêm do banco.
export function ProfTabs() {
  const [t, setT] = useState<'eng' | 'perf' | 'duv'>('eng');
  return (
    <>
      <div className="dtabs" role="tablist">
        {([['eng', 'Engajamento'], ['perf', 'Desempenho'], ['duv', 'Dúvidas']] as const).map(([k, l]) => <button key={k} role="tab" className={t === k ? 'on' : ''} onClick={() => setT(k)}>{l}</button>)}
      </div>
      <div className="dcard" id="dtab">
        {t === 'eng' && <>
          <div><div className="dk-stats"><div><b>312</b><span>alunos ativos</span></div><div><b>6h 20min</b><span>estudo médio por semana</span></div><div><b>78%</b><span>adesão aos simulados</span></div></div>
            <div className="dk-t">Simulados feitos por dia, nos últimos 24 dias</div><Cols v={[2, 3, 4, 3, 5, 6, 4, 3, 5, 6, 7, 5, 4, 6, 7, 8, 6, 5, 7, 8, 7, 6, 8, 7]} rows={8} /></div>
          <div><div className="dk-t">Alunos que precisam de você</div>
            <Linha n="Caio Menezes" t="Sem estudar há 7 dias" p="Em risco" tom="bad" /><Linha n="Rafael Nunes" t="Sem estudar há 9 dias" p="Em risco" tom="bad" />
            <Linha n="João Pedro Lima" t="Média caiu 12 pontos" p="Atenção" tom="warn" /><Linha n="Luana Ferreira" t="Sem estudar há 3 dias" p="Atenção" tom="warn" /></div>
        </>}
        {t === 'perf' && <>
          <div><div className="dk-t">Questões mais erradas no último simulado</div>
            {[['Questão 2: O papel do DIP no Estado Novo', 58], ['Questão 5: Industrialização de base', 42], ['Questão 4: Estado e sindicatos', 31]].map(([n, p]) => <div key={n as string} className="dk-b"><div className="row sb"><span>{n}</span><b>{p}%</b></div><Bar p={p as number} /></div>)}
            <small style={{ color: 'rgba(255,255,255,.55)' }}>Percentual de alunos que erraram.</small></div>
          <div><div className="dk-t">Desempenho da turma por competência</div>
            {[['Historicidade e processos sociais', 71], ['Território, trabalho e sociedade', 64], ['Pensamento crítico e cidadania', 58]].map(([n, p]) => <div key={n as string} className="dk-b"><div className="row sb"><span>{n}</span><b>{p}%</b></div><Bar p={p as number} /></div>)}</div>
        </>}
        {t === 'duv' && <>
          <div><div className="dk-t">Caixa de entrada de dúvidas</div>
            <Linha n="João Pedro Lima" t="Não entendi por que a alternativa C está errada." p="Pendente" tom="warn" />
            <Linha n="Beatriz Souza" t="O contrato social de Rousseau é igual ao de Hobbes?" p="Pendente" tom="warn" />
            <Linha n="Marina Alves" t="Qual a diferença entre Estado Novo e Governo Provisório?" p="Respondida" tom="ok" /></div>
          <div><div className="dk-t">Responder</div><div className="dk-box">Veja a apostila desta aula, página 12. Se continuar com dúvida, me chame de novo.</div>
            <div className="dk-t" style={{ marginBottom: 8 }}>Respostas salvas</div>
            <div className="row" style={{ marginBottom: 16 }}><span className="dk-chip">Veja a apostila…</span><span className="dk-chip">Ótima pergunta!…</span><span className="dk-chip">Releia o comentário…</span></div>
            <span className="btn white sm" style={{ pointerEvents: 'none' }}>Enviar resposta</span></div>
        </>}
      </div>
    </>
  );
}
