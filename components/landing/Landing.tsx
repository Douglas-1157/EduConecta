import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { Logo, Wordmark } from '@/components/Logo';
import { Pb } from '@/components/ui';
import { ThemeBtn } from './ThemeBtn';
import { ProfTabs } from './ProfTabs';
import { PerfisTabs } from './PerfisTabs';

const NAV = [['trilhas', 'Trilhas'], ['recursos', 'Recursos'], ['como', 'Como funciona'], ['professores', 'Professores'], ['perguntas', 'Perguntas']];
const SEMANA = [45, 60, 0, 50, 30, 30, 0];
const Semana = () => (
  <div className="week">{SEMANA.map((m, i) => { const n = Math.min(4, Math.ceil(m / 15)); return <div key={i} className="wd"><div className="st">{[3, 2, 1, 0].map(k => <i key={k} className={k < n ? 'on' : ''} />)}</div></div>; })}</div>
);
const AREAS = [
  { n: 'Linguagens', ic: 'book', d: [['Português', 'oon'], ['Literatura', 'on-'], ['Inglês', 'o--']] },
  { n: 'Matemática', ic: 'compass', d: [['Álgebra e funções', 'ooo'], ['Geometria', 'oon'], ['Estatística', 'on-']] },
  { n: 'Natureza', ic: 'globe', d: [['Biologia', 'oon'], ['Química', 'on-'], ['Física', 'o--']] },
  { n: 'Humanas', ic: 'users', d: [['História', 'oon-'], ['Geografia', 'oon-'], ['Filosofia e Sociologia', 'on--']] },
];
const FAQ = [
  ['Preciso instalar algum aplicativo?', 'Não. A plataforma abre no navegador do celular ou do computador, sem instalar nada.'],
  ['E se a internet cair no meio do simulado?', 'As respostas ficam guardadas no aparelho e são enviadas quando a conexão volta.'],
  ['A nota do simulado é a nota do ENEM?', 'Não. É uma referência de 0 a 1000 calculada por competência, para o aluno acompanhar a própria evolução.'],
  ['Quem corrige a redação?', 'O professor corrige pelas 5 competências do ENEM, de 0 a 200 cada, e deixa um comentário para o aluno.'],
  ['Perder um dia zera meu progresso?', 'Não. A meta é semanal, não diária. Não há sequência para quebrar nem ranking entre colegas.'],
  ['Quem vê o meu desempenho?', 'Você e os professores da sua turma. Os colegas não veem suas notas.'],
];
const ONDA = Array.from({ length: 108 }, (_, k) => ({ c: k % 36, r: Math.floor(k / 36) }));

export function Landing() {
  return (
    <div className="land" style={{ background: 'var(--panel)', minHeight: '100vh' }}>
      <header className="lnav"><div className="wrap">
        <Logo /><Wordmark />
        <nav aria-label="Seções">{NAV.map(([id, l]) => <a key={id} href={`#${id}`}>{l}</a>)}</nav>
        <span className="sp" /><ThemeBtn />
        <Link className="btn hide-m" href="/entrar">Entrar</Link><Link className="btn dk" href="/entrar?criar=1">Criar conta</Link>
      </div></header>

      <section className="wrap hero2"><div className="hgrid">
        <div>
          <span className="eyebrow"><i /> Esquenta pro ENEM</span>
          <h1>O ENEM inteiro, <em>um passo de cada vez.</em></h1>
          <p className="lead">Trilhas, apostilas, simulados e redação das quatro áreas do ENEM, com o professor acompanhando de perto. Feito para a nossa escola.</p>
          <div className="row" style={{ marginTop: 28 }}><Link className="btn dk lg" href="/entrar">Entrar na plataforma <Icon n="arrow" s={16} /></Link><a className="btn lg" href="#como">Ver como funciona</a></div>
          <div className="hmeta"><span><Icon n="check" s={16} /> Sem instalar nada</span><span><Icon n="check" s={16} /> Funciona no celular</span><span><Icon n="check" s={16} /> Sem ranking entre alunos</span></div>
        </div>
        <div className="hvis">
          <div className="phone"><div className="screen">
            <div className="mhero"><span className="mey">PRÓXIMO PASSO</span><b>Era Vargas e Estado Novo</b><small>Aula · 28 min · 72% assistida</small><span className="mbtn">Continuar</span></div>
            <div className="mcard"><div className="row sb"><b style={{ fontWeight: 600 }}>Meta da semana</b><span style={{ color: 'var(--mute)' }}>3h 35 de 5h</span></div><Pb p={72} /><Semana /></div>
            <div className="mcard"><b style={{ fontWeight: 600 }}>Fila de hoje</b>
              <div className="qr"><span className="ic2"><Icon n="file" s={15} /></span><span>Cartografia e escalas</span><span className="pill bad">Atrasada</span></div>
              <div className="qr"><span className="ic2"><Icon n="exam" s={15} /></span><span>Simulado · Era Vargas</span><span className="pill">30 min</span></div></div>
            <div className="mnav">{[['home', 'Hoje'], ['route', 'Trilhas'], ['exam', 'Simulados'], ['chat', 'Dúvidas']].map(([i, l]) => <span key={l} style={{ display: 'grid', justifyItems: 'center', gap: 2, fontSize: 10 }}><Icon n={i} s={18} />{l}</span>)}</div>
          </div></div>
          <div className="fchip a"><span className="fi" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}><Icon n="exam" s={16} /></span><div><b>Simulado liberado</b><small>Era Vargas e Estado Novo</small></div></div>
          <div className="fchip b"><span className="fi" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}><Icon n="check" s={16} /></span><div><b>Nota 825 / 1000</b><small>Competência A em destaque</small></div></div>
        </div>
      </div></section>

      <section className="wrap lsec" id="trilhas">
        <div className="sh"><span className="eyebrow"><i /> Trilhas</span><h2 style={{ marginTop: 12 }}>Todas as áreas do ENEM, cada uma com seu caminho</h2><p>Aulas, apostilas e simulados em ordem. Concluiu uma etapa, a próxima abre.</p></div>
        <div className="tcards">{AREAS.map(a => (
          <article key={a.n} className="tc"><div className="tch"><em><Icon n={a.ic} s={20} /></em><div><h3>{a.n}</h3><small>{a.d.length} disciplinas</small></div></div>
            {a.d.map(([nome, pts]) => <div key={nome} className="tm"><b>{nome}</b><div className="sds">{[...pts].map((c, i) => <span key={i} className={`sd${c === 'o' ? ' ok' : c === 'n' ? ' now' : ''}`} />)}</div></div>)}
          </article>))}</div>
        <div className="leg"><span><i className="sd ok" /> Concluído</span><span><i className="sd now" /> Em andamento</span><span><i className="sd" /> A seguir</span></div>
        <p style={{ color: 'var(--mute)', fontSize: 12, marginTop: 10 }}>Exemplo ilustrativo. Os conteúdos reais são publicados pelos professores.</p>
      </section>

      <section className="wrap lsec" id="recursos">
        <div className="sh"><span className="eyebrow"><i /> Recursos</span><h2 style={{ marginTop: 12 }}>Feito para estudar de verdade, não para ficar bonito</h2><p>Cada recurso existe para tirar uma dúvida do aluno ou um trabalho do professor.</p></div>
        <div className="bento">
          <article className="bt s4"><div><h3>Simulados comentados</h3><p>Questões por competência, nota de 0 a 1000 e gabarito com explicação depois da entrega. O aluno aprende com o erro.</p>
            <div className="facts3"><div><b>0–1000</b><span>nota por competência</span></div><div><b>5</b><span>áreas do ENEM</span></div></div></div>
            <div className="qm"><div className="row sb"><span style={{ color: 'var(--mute)' }}>Questão 2 de 6</span><span className="pill">Competência A</span></div><div>O DIP, criado no Estado Novo, tinha a função de:</div><div className="mopt">garantir a liberdade de imprensa</div><div className="mopt ok2">controlar a informação e divulgar o regime</div><div className="note2">Comentário: o DIP centralizava a propaganda e a censura.</div></div></article>
          <article className="bt s2 soft"><h3>Meta semanal</h3><p>A meta é da semana, não do dia. Perder um dia não zera nada.</p><div className="mk"><div className="row sb"><b style={{ fontWeight: 600, fontSize: 20 }}>3h 35min</b><span className="pill wip">Meta 5h</span></div><Pb p={72} /><div style={{ marginTop: 8 }}><Semana /></div></div></article>
          <article className="bt s2"><h3>Redação corrigida</h3><p>O professor corrige pelas 5 competências do ENEM e comenta o texto.</p><div className="mk">{[['Norma culta', 160], ['Compreensão do tema', 200], ['Argumentação', 120]].map(([n, v]) => <div key={n as string} style={{ marginBottom: 8 }}><div className="row sb" style={{ fontSize: 13, marginBottom: 4 }}><span>{n}</span><span className="num">{v}/200</span></div><Pb p={(v as number) / 2} /></div>)}</div></article>
          <article className="bt s2"><h3>Dúvidas com contexto</h3><p>Pergunta feita de dentro da aula ou da questão.</p><div className="mk stk2"><div className="bub">Por que a C está errada?</div><div className="bub me">Releia o comentário e me diga onde travou.</div></div></article>
          <article className="bt s2"><h3>Pensado para o celular</h3><p>Se a internet cair no simulado, as respostas ficam guardadas.</p><div className="mk"><div className="qr"><span className="ic2" style={{ color: 'var(--warn)' }}><Icon n="wifi" s={16} /></span><span><b style={{ fontWeight: 600 }}>Sem conexão</b></span><span className="pill warn">3 guardadas</span></div></div></article>
        </div>
      </section>

      <section className="band" id="como"><div className="wrap">
        <div className="sh"><span className="eyebrow"><i /> Como funciona</span><h2 style={{ marginTop: 12 }}>Do conteúdo ao acompanhamento, em três passos</h2></div>
        <div className="tl">{[['Publica', 'O professor sobe apostilas, videoaulas e questões e escolhe as turmas que vão receber.', 'Professor'], ['Estuda', 'O aluno segue a trilha, assiste, lê, faz simulados e escreve redações.', 'Aluno'], ['Acompanha', 'O professor vê quem precisa de ajuda, responde as dúvidas, corrige as redações e ajusta o ritmo da turma.', 'Professor']].map(([t, d, r], i) => (
          <div key={t} className="tstep"><span className="tn">{i + 1}</span><h3>{t}</h3><p>{d}</p><span className="pill" style={{ alignSelf: 'flex-start' }}>{r}</span></div>))}</div>
      </div></section>

      <section className="dsec" id="professores"><div className="wrap">
        <div className="sh"><span className="eyebrow" style={{ color: 'rgba(255,255,255,.7)' }}><i style={{ borderBottomColor: '#fff' }} /> Para professores</span><h2 style={{ marginTop: 12 }}>Saiba quem precisa de você antes da próxima aula</h2><p>Um painel que mostra engajamento, desempenho e dúvidas, sem trabalho manual.</p></div>
        <ProfTabs /><p style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 10 }}>Exemplo ilustrativo com dados de demonstração.</p>
      </div></section>

      <section className="wrap lsec" id="perfis">
        <div className="sh"><span className="eyebrow"><i /> Perfis</span><h2 style={{ marginTop: 12 }}>Cada pessoa da escola vê só o que precisa</h2><p>Aluno, professor e gestão da escola, cada um com a sua visão.</p></div>
        <PerfisTabs />
      </section>

      <section className="wrap lsec" id="perguntas"><div className="faqw">
        <div className="sh" style={{ margin: 0 }}><span className="eyebrow"><i /> Perguntas</span><h2 style={{ marginTop: 12 }}>Perguntas frequentes</h2><p>O que alunos e professores mais querem saber antes de começar.</p></div>
        <div className="faq">{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </div></section>

      <section className="cta2"><div className="wrap">
        <div className="cwave" aria-hidden="true">{ONDA.map((o, k) => <i key={k} style={{ ['--c' as any]: o.c, ['--r' as any]: o.r }} />)}</div>
        <h2>Pronto para começar o esquenta?</h2><p>Crie sua conta de aluno ou entre com o acesso que a escola te passou.</p>
        <div className="row" style={{ justifyContent: 'center' }}><Link className="btn dk lg" href="/entrar?criar=1">Criar conta de aluno</Link><Link className="btn lg" href="/entrar">Já tenho conta</Link></div>
      </div></section>

      <footer className="wrap lfoot"><span className="row" style={{ gap: 10 }}><Logo size={28} /><Wordmark /><span>© {new Date().getFullYear()} · Esquenta pro ENEM</span></span>
        <nav>{NAV.map(([id, l]) => <a key={id} href={`#${id}`} style={{ color: 'var(--mute)', padding: '6px 8px' }}>{l}</a>)}</nav></footer>
    </div>
  );
}
