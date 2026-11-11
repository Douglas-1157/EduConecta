export type Risco = 'bad' | 'warn' | 'ok';
// Regras simples e explicáveis para o professor: dias sem estudar e tempo na semana.
export function riscoDe(ultimo: string | null, minSemana: number, meta: number): { nivel: Risco; rotulo: string; motivo: string } {
  const dias = ultimo ? Math.floor((Date.now() - new Date(ultimo).getTime()) / 86400000) : null;
  if (dias === null) return { nivel: 'bad', rotulo: 'Em risco', motivo: 'Ainda não estudou' };
  if (dias >= 7) return { nivel: 'bad', rotulo: 'Em risco', motivo: `Sem estudar há ${dias} dias` };
  if (dias >= 3) return { nivel: 'warn', rotulo: 'Atenção', motivo: `Sem estudar há ${dias} dias` };
  if (minSemana < meta * 0.2 && new Date().getDay() >= 4) return { nivel: 'warn', rotulo: 'Atenção', motivo: 'Pouco estudo nesta semana' };
  return { nivel: 'ok', rotulo: 'No ritmo', motivo: dias === 0 ? 'Estudou hoje' : `Estudou há ${dias} dia${dias > 1 ? 's' : ''}` };
}
