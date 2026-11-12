import Link from 'next/link';
import { exigirPerfil } from '@/lib/sessao';
import { turmasVisiveis } from '@/lib/escopo';
import { Av } from '@/components/ui';
import { Form } from '@/components/Form';
import { criarTemaRedacao } from '@/lib/acoes/equipe';

export const dynamic = 'force-dynamic';

export default async function Redacoes({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const sp = await searchParams; const aba = sp.aba === 'corrigidas' ? 'corrigida' : 'enviada';
  const { db, perfil } = await exigirPerfil();
  const [{ data: reds }, { data: turmas }, { data: temas }] = await Promise.all([
    db.from('redacoes').select('id,nota,enviada_em,corrigida_em,profiles!redacoes_aluno_id_fkey(nome),redacao_temas(titulo)').eq('status', aba).order(aba === 'enviada' ? 'enviada_em' : 'corrigida_em', { ascending: aba === 'enviada' }),
    turmasVisiveis(db, perfil),
    db.from('redacao_temas').select('id,titulo,prazo,redacao_tema_turmas(turmas(nome))').order('created_at', { ascending: false }),
  ]);
  return (
    <>
      <div><h1 className="h1">Redações</h1><p className="sub">Corrija com as 5 competências do ENEM (0 a 200 cada) e deixe um comentário.</p></div>
      <div className="tabs" role="tablist"><Link className={aba === 'enviada' ? 'on' : ''} href="?">Para corrigir</Link><Link className={aba === 'corrigida' ? 'on' : ''} href="?aba=corrigidas">Corrigidas</Link></div>
      <div className="cols">
        <div className="card"><div className="list">{reds?.length ? reds.map((r: any) => (
          <Link key={r.id} href={`/professor/redacoes/${r.id}`} className="li"><Av nome={r.profiles?.nome ?? '?'} sm /><div className="tx"><b>{r.profiles?.nome}</b><small>{r.redacao_temas?.titulo} · {new Date(r.enviada_em ?? r.corrigida_em).toLocaleDateString('pt-BR')}</small></div>{aba === 'corrigida' ? <b className="mono">{r.nota}</b> : <span className="btn sm pri">Corrigir</span>}</Link>))
          : <div className="empty">{aba === 'enviada' ? 'Nenhuma redação aguardando correção.' : 'Nenhuma redação corrigida ainda.'}</div>}</div></div>
        <div className="stack">
          <div className="card"><h2 className="h2">Novo tema</h2>
            <Form action={criarTemaRedacao} botao="Publicar tema">
              <div className="field full"><label htmlFor="tt">Título</label><input id="tt" name="titulo" className="inp" required /></div>
              <div className="field full"><label htmlFor="te">Proposta e textos de apoio</label><textarea id="te" name="enunciado" className="inp" /></div>
              <div className="field"><label htmlFor="tp">Prazo (opcional)</label><input id="tp" name="prazo" type="date" className="inp" /></div>
              <div className="field"><span className="sub" style={{ fontSize: 13, fontWeight: 500 }}>Turmas</span><div className="chips">{turmas?.map(t => <label key={t.id} className="chip" style={{ cursor: 'pointer' }}><input type="checkbox" name="turmas" value={t.id} defaultChecked style={{ marginRight: 6 }} />{t.nome}</label>)}</div></div>
            </Form></div>
          <div className="card"><h2 className="h2" style={{ marginBottom: 6 }}>Temas publicados</h2><div className="list">{temas?.length ? temas.map((t: any) => <div key={t.id} className="li"><div className="tx"><b>{t.titulo}</b><small>{(t.redacao_tema_turmas ?? []).map((x: any) => x.turmas?.nome).join(', ')}{t.prazo ? ` · prazo ${new Date(t.prazo + 'T12:00').toLocaleDateString('pt-BR')}` : ''}</small></div></div>) : <div className="empty">Nenhum tema ainda.</div>}</div></div>
        </div>
      </div>
    </>
  );
}
