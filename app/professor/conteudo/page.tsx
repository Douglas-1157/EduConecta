import { exigirPerfil } from '@/lib/sessao';
import { turmasVisiveis } from '@/lib/escopo';
import { Form, Acao } from '@/components/Form';
import { Icon } from '@/components/Icon';
import { publicarItem, alternarPublicacao, apagarItem, criarRecurso, apagarRecurso } from '@/lib/acoes/equipe';
import { FormItem } from './FormItem';

export const dynamic = 'force-dynamic';

export default async function Conteudo() {
  const { db, perfil } = await exigirPerfil();
  const [{ data: disc }, { data: mods }, { data: comps }, { data: turmas }, { data: itens }, { data: recursos }] = await Promise.all([
    db.from('disciplinas').select('id,nome,area').order('ordem'),
    db.from('modulos').select('id,nome,disciplina_id,ordem').order('ordem'),
    db.from('competencias').select('id,area,codigo,nome').order('area').order('codigo'),
    turmasVisiveis(db, perfil),
    db.from('itens').select('id,tipo,titulo,publicado,modulos(nome,disciplinas(nome)),item_turmas(turmas(nome),prazo)').order('created_at', { ascending: false }).limit(60),
    db.from('recursos').select('*').order('created_at', { ascending: false }),
  ]);
  return (
    <>
      <div><h1 className="h1">Conteúdo</h1><p className="sub">Publique uma vez e escolha quais turmas recebem. Aulas, apostilas e simulados entram na trilha de cada disciplina.</p></div>
      <div className="cols">
        <div className="card"><h2 className="h2">Nova aula ou apostila</h2>
          <FormItem disciplinas={disc ?? []} modulos={mods ?? []} competencias={comps ?? []} turmas={turmas ?? []} action={publicarItem} /></div>
        <div className="stack">
          <div className="card"><h2 className="h2" style={{ marginBottom: 6 }}>Publicados recentemente</h2>
            <div className="list">{itens?.length ? itens.map((i: any) => (
              <div key={i.id} className="li"><span className="ico"><Icon n={i.tipo === 'video' ? 'play' : i.tipo === 'pdf' ? 'file' : 'exam'} /></span>
                <div className="tx"><b>{i.titulo}</b><small>{i.modulos?.disciplinas?.nome} · {i.modulos?.nome} · {(i.item_turmas ?? []).map((t: any) => t.turmas?.nome).join(', ') || 'sem turma'}</small></div>
                <span className={`pill ${i.publicado ? 'ok' : ''}`}>{i.publicado ? 'No ar' : 'Oculto'}</span>
                <Acao action={alternarPublicacao.bind(null, i.id, !i.publicado) as any}>{i.publicado ? 'Ocultar' : 'Publicar'}</Acao>
                <Acao className="btn sm ghost" confirmar="Apagar este item? O progresso dos alunos nele também será apagado." action={apagarItem.bind(null, i.id) as any}>Apagar</Acao></div>)) : <div className="empty">Nada publicado ainda.</div>}</div></div>
          <div className="card"><h2 className="h2">Biblioteca: cursos e repertório</h2>
            <Form action={criarRecurso} botao="Adicionar">
              <div className="field"><label htmlFor="rt">Tipo</label><select id="rt" name="tipo" className="inp"><option value="curso">Curso gratuito</option><option value="repertorio">Conhecimento de mundo</option></select></div>
              <div className="field"><label htmlFor="rc">Categoria</label><input id="rc" name="categoria" className="inp" placeholder="História, Atualidades, Filmes…" /></div>
              <div className="field full"><label htmlFor="rti">Título</label><input id="rti" name="titulo" className="inp" required /></div>
              <div className="field full"><label htmlFor="ru">Link</label><input id="ru" name="url" type="url" className="inp" required placeholder="https://" /></div>
              <div className="field"><label htmlFor="rca">Carga horária (opcional)</label><input id="rca" name="carga" className="inp" placeholder="20 h" /></div>
              <div className="field"><label htmlFor="rd">Observação (opcional)</label><input id="rd" name="descricao" className="inp" placeholder="Com certificado" /></div>
            </Form>
            <div className="list" style={{ marginTop: 10 }}>{recursos?.map(r => <div key={r.id} className="li"><div className="tx"><b>{r.titulo}</b><small>{r.tipo === 'curso' ? 'Curso' : 'Repertório'} · {r.categoria}</small></div><Acao className="btn sm ghost" action={apagarRecurso.bind(null, r.id) as any}>Remover</Acao></div>)}</div></div>
        </div>
      </div>
    </>
  );
}
