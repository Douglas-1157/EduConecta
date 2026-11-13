import type { Perfil } from './tipos';

// Turmas que a pessoa pode usar nas telas: o professor com turmas vinculadas só vê as dele;
// a gestão vê todas; professor sem vínculo não vê nenhuma.
export async function turmasVisiveis(db: any, perfil: Perfil): Promise<{ data: { id: string; nome: string; turno?: string | null; trava_progressiva?: boolean }[] | null }> {
  let q = db.from('turmas').select('id,nome,turno,trava_progressiva').order('nome');
  if (perfil.papel === 'professor') {
    const { data } = await db.from('professor_turmas').select('turma_id').eq('professor_id', perfil.id);
    q = q.in('id', (data ?? []).map((x: any) => x.turma_id));
  }
  return q;
}
