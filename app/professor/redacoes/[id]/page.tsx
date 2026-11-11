import Link from 'next/link';
import { notFound } from 'next/navigation';
import { exigirPerfil } from '@/lib/sessao';
import { Icon } from '@/components/Icon';
import { Form } from '@/components/Form';
import { Pb } from '@/components/ui';
import { corrigirRedacao } from '@/lib/acoes/equipe';
import { COMPETENCIAS_REDACAO, NIVEIS } from '@/lib/redacao';

export const dynamic = 'force-dynamic';

export default async function Corrigir({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await exigirPerfil();
  const { data: r } = await db.from('redacoes').select('*,profiles!redacoes_aluno_id_fkey(nome),redacao_temas(titulo,enunciado)').eq('id', id).maybeSingle();
  if (!r) notFound();
  const corrigida = r.status === 'corrigida';
  return (
    <>
      <div className="row"><Link href="/professor/redacoes" className="btn sm"><Icon n="left" s={14} /> Voltar</Link></div>
      <div><h1 className="h1">{(r as any).redacao_temas?.titulo}</h1><p className="sub">{(r as any).profiles?.nome} · {r.status === 'rascunho' ? 'rascunho (ainda não enviada)' : r.status}</p></div>
      <div className="cols">
        <div className="card"><p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{r.texto || '(texto vazio)'}</p><p className="sub num" style={{ marginTop: 14, fontSize: 13 }}>{r.texto.trim() ? r.texto.trim().split(/\s+/).length : 0} palavras</p></div>
        <div className="card">
          {corrigida && <div style={{ marginBottom: 14 }}><div className="sub" style={{ fontSize: 13 }}>Nota atual</div><div className="score">{r.nota}</div></div>}
          <h2 className="h2">{corrigida ? 'Alterar correção' : 'Correção'}</h2>
          <Form action={corrigirRedacao} botao={corrigida ? 'Atualizar correção' : 'Enviar correção'}>
            <input type="hidden" name="id" value={r.id} />
            {COMPETENCIAS_REDACAO.map((c, k) => (
              <div key={k} className="field full"><label htmlFor={`c${k + 1}`}>Competência {k + 1}: {c}</label>
                <select id={`c${k + 1}`} name={`c${k + 1}`} className="inp" defaultValue={(r as any)[`c${k + 1}`] ?? ''} required><option value="" disabled>Nota</option>{NIVEIS.map(n => <option key={n} value={n}>{n}</option>)}</select></div>))}
            <div className="field full"><label htmlFor="cm">Comentário para o aluno</label><textarea id="cm" name="comentario" className="inp" defaultValue={r.comentario ?? ''} /></div>
          </Form>
          <div style={{ marginTop: 12 }}><Pb p={(r.nota ?? 0) / 10} /></div>
        </div>
      </div>
    </>
  );
}
