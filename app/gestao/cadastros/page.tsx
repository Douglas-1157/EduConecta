import { exigirPerfil } from '@/lib/sessao';
import { Av } from '@/components/ui';
import { Acao, Form } from '@/components/Form';
import { criarProfessor, decidirCadastro, definirTurmasProfessor, importarAlunos } from '@/lib/acoes/equipe';

export const dynamic = 'force-dynamic';

export default async function Cadastros() {
  const { db } = await exigirPerfil('gestao');
  const [{ data: pend }, { data: recusados }, { data: profs }, { data: turmas }, { data: vinc }, { data: discs }] = await Promise.all([
    db.from('profiles').select('id,nome,matricula,created_at,turmas!profiles_turma_id_fkey(nome)').eq('status', 'pendente').order('created_at'),
    db.from('profiles').select('id,nome,turmas!profiles_turma_id_fkey(nome)').eq('status', 'recusado').order('created_at', { ascending: false }).limit(10),
    db.from('profiles').select('id,nome,disciplina_id').eq('papel', 'professor').eq('status', 'ativo').order('nome'),
    db.from('turmas').select('id,nome').order('nome'),
    db.from('professor_turmas').select('professor_id,turma_id'),
    db.from('disciplinas').select('id,nome').order('ordem'),
  ]);
  return (
    <>
      <div><h1 className="h1">Cadastros</h1><p className="sub">Aprove os alunos que pediram acesso e cadastre os professores.</p></div>
      <div className="cols">
        <div className="stack">
          <div className="card"><h2 className="h2" style={{ marginBottom: 6 }}>Aguardando confirmação</h2>
            <div className="list">{pend?.length ? pend.map((p: any) => (
              <div key={p.id} className="li"><Av nome={p.nome} sm /><div className="tx"><b>{p.nome}</b><small>{p.turmas?.nome ?? 'Sem turma'}{p.matricula ? ` · matrícula ${p.matricula}` : ''}</small></div>
                <Acao className="btn sm pri" action={decidirCadastro.bind(null, p.id, true) as any}>Aprovar</Acao>
                <Acao action={decidirCadastro.bind(null, p.id, false) as any}>Recusar</Acao></div>)) : <div className="empty">Nenhum cadastro pendente.</div>}</div></div>
          {recusados?.length ? <div className="card"><h2 className="h2" style={{ marginBottom: 6 }}>Recusados recentemente</h2><div className="list">{recusados.map((p: any) => <div key={p.id} className="li"><div className="tx"><b>{p.nome}</b><small>{p.turmas?.nome ?? 'Sem turma'}</small></div><Acao action={decidirCadastro.bind(null, p.id, true) as any}>Aprovar</Acao></div>)}</div></div> : null}
        </div>
        <div className="stack">
        <div className="card"><h2 className="h2">Cadastrar professor</h2><p className="sub" style={{ margin: '6px 0 12px', fontSize: 14 }}>Defina uma senha provisória e repasse à pessoa. Ela pode trocar depois.</p>
          <Form action={criarProfessor} botao="Criar conta">
            <div className="field full"><label htmlFor="pn">Nome completo</label><input id="pn" name="nome" className="inp" required /></div>
            <div className="field full"><label htmlFor="pe">E-mail</label><input id="pe" name="email" type="email" className="inp" required /></div>
            <div className="field full"><label htmlFor="pd">Disciplina que leciona</label><select id="pd" name="disciplina_id" className="inp" defaultValue=""><option value="">Não informar</option>{discs?.map((d: any) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select></div>
            <div className="field full"><label htmlFor="ps">Senha provisória (8+ caracteres)</label><input id="ps" name="senha" type="text" minLength={8} className="inp" required autoComplete="off" /></div>
            <label className="full sub" style={{ fontSize: 14 }}><input type="checkbox" name="gestao" style={{ marginRight: 8 }} />Também é da gestão da escola</label>
          </Form></div>
        <div className="card"><h2 className="h2">Importar alunos por planilha</h2><p className="sub" style={{ margin: '6px 0 12px', fontSize: 14 }}>No Excel ou Google Planilhas, deixe as colunas <b>nome, email, matricula, turma</b> (matrícula e turma são opcionais; a turma precisa já existir) e salve como CSV. Todos entram já aprovados, com a senha provisória abaixo.</p>
          <Form action={importarAlunos} botao="Importar">
            <div className="field full"><label htmlFor="ia">Arquivo CSV</label><input id="ia" name="arquivo" type="file" accept=".csv,text/csv" className="inp" required /></div>
            <div className="field full"><label htmlFor="is">Senha provisória (8+ caracteres)</label><input id="is" name="senha" type="text" minLength={8} className="inp" required autoComplete="off" /></div>
          </Form></div>
        <div className="card"><h2 className="h2">Disciplina e turmas de cada professor</h2><p className="sub" style={{ margin: '6px 0 12px', fontSize: 14 }}>A disciplina aparece no perfil e já vem escolhida nos formulários. O professor só vê alunos, dúvidas e redações das turmas marcadas. Sem nenhuma marcada, ele não vê nenhuma turma.</p>
          {profs?.length ? profs.map((p: any) => (
            <Form key={p.id} action={definirTurmasProfessor} botao="Salvar">
              <input type="hidden" name="professor_id" value={p.id} />
              <div className="field full"><b style={{ fontSize: 14 }}>{p.nome}</b><select name="disciplina_id" aria-label={`Disciplina de ${p.nome}`} className="inp" defaultValue={p.disciplina_id ?? ''} style={{ margin: '8px 0' }}><option value="">Disciplina não informada</option>{discs?.map((d: any) => <option key={d.id} value={d.id}>{d.nome}</option>)}</select><div className="chips">{turmas?.map((t: any) => <label key={t.id} className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" name="turmas" value={t.id} defaultChecked={vinc?.some((v: any) => v.professor_id === p.id && v.turma_id === t.id)} style={{ marginRight: 6 }} />{t.nome}</label>)}</div></div>
            </Form>)) : <div className="empty">Nenhum professor cadastrado.</div>}</div>
        </div>
      </div>
    </>
  );
}
