export type Papel = 'aluno' | 'professor' | 'gestao';
export type Perfil = { id: string; nome: string; papel: Papel; status: 'pendente' | 'ativo' | 'recusado'; turma_id: string | null; matricula: string | null; meta_semanal_min: number };
export const NOME_PAPEL: Record<Papel, string> = { aluno: 'Aluno', professor: 'Professor', gestao: 'Gestão' };
export const INICIO: Record<Papel, string> = { aluno: '/aluno', professor: '/professor', gestao: '/gestao' };
export const iniciais = (n: string) => n.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
