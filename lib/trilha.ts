import type { SupabaseClient } from '@supabase/supabase-js';
import type { Perfil } from './tipos';

export type Estado = 'ok' | 'now' | 'lock' | 'free';
export type ItemTrilha = {
  id: string; tipo: 'video' | 'pdf' | 'sim'; titulo: string; minutos: number; url: string | null; arquivo_path: string | null;
  simulado_id: string | null; ordem: number; modulo: string; modulo_ordem: number; disciplina: string; disciplina_id: string; area: string;
  competencia: string | null; prazo: string | null; pct: number; concluido: boolean; estado: Estado;
};
export type Disciplina = { id: string; nome: string; area: string; ordem: number; itens: ItemTrilha[] };

// Monta as trilhas do aluno: quais itens existem para a turma, o que já foi feito e o que está liberado.
export async function carregarTrilhas(db: SupabaseClient, perfil: Perfil): Promise<{ disciplinas: Disciplina[]; trava: boolean }> {
  const [{ data: itens }, { data: prog }, { data: turma }] = await Promise.all([
    db.from('itens').select('id,tipo,titulo,minutos,url,arquivo_path,simulado_id,ordem,modulos(nome,ordem,disciplinas(id,nome,area,ordem)),competencias(nome),item_turmas(prazo)').eq('publicado', true),
    db.from('progresso').select('item_id,pct,concluido_em').eq('aluno_id', perfil.id),
    perfil.turma_id ? db.from('turmas').select('trava_progressiva').eq('id', perfil.turma_id).single() : Promise.resolve({ data: null }),
  ]);
  const trava = turma?.trava_progressiva ?? true;
  const pmap = new Map((prog ?? []).map((p: any) => [p.item_id, p]));
  const porDisc = new Map<string, Disciplina>();
  for (const i of (itens ?? []) as any[]) {
    const m = i.modulos, d = m?.disciplinas; if (!d) continue;
    const p: any = pmap.get(i.id);
    const it: ItemTrilha = {
      id: i.id, tipo: i.tipo, titulo: i.titulo, minutos: i.minutos, url: i.url, arquivo_path: i.arquivo_path, simulado_id: i.simulado_id,
      ordem: i.ordem, modulo: m.nome, modulo_ordem: m.ordem, disciplina: d.nome, disciplina_id: d.id, area: d.area,
      competencia: i.competencias?.nome ?? null, prazo: i.item_turmas?.[0]?.prazo ?? null,
      pct: p?.pct ?? 0, concluido: !!p?.concluido_em, estado: 'free',
    };
    if (!porDisc.has(d.id)) porDisc.set(d.id, { id: d.id, nome: d.nome, area: d.area, ordem: d.ordem, itens: [] });
    porDisc.get(d.id)!.itens.push(it);
  }
  const disciplinas = [...porDisc.values()].sort((a, b) => a.ordem - b.ordem);
  for (const d of disciplinas) {
    d.itens.sort((a, b) => a.modulo_ordem - b.modulo_ordem || a.ordem - b.ordem || a.id.localeCompare(b.id));
    const atual = d.itens.find(x => !x.concluido);
    for (const it of d.itens) it.estado = it.concluido ? 'ok' : it === atual ? 'now' : trava ? 'lock' : 'free';
  }
  return { disciplinas, trava };
}

export const razaoBloqueio = (d: Disciplina) => {
  const f = d.itens.find(x => !x.concluido);
  return f ? `Conclua “${f.titulo.length > 34 ? f.titulo.slice(0, 32) + '…' : f.titulo}” para liberar.` : '';
};

// Fila do dia: a próxima etapa de cada disciplina, as mais urgentes primeiro.
export function fila(disciplinas: Disciplina[]) {
  return disciplinas.map(d => d.itens.find(x => x.estado === 'now')).filter((x): x is ItemTrilha => !!x)
    .sort((a, b) => (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999'));
}

export const rotuloTipo = { video: 'Aula', pdf: 'Apostila', sim: 'Simulado' } as const;
export const iconeTipo = { video: 'play', pdf: 'file', sim: 'exam' } as const;

export function semanaAtual(sessoes: { minutos: number; feito_em: string }[]) {
  const hoje = new Date(); const dow = (hoje.getDay() + 6) % 7; // segunda = 0
  const ini = new Date(hoje); ini.setHours(0, 0, 0, 0); ini.setDate(ini.getDate() - dow);
  const dias = [0, 0, 0, 0, 0, 0, 0];
  for (const s of sessoes) { const d = new Date(s.feito_em); const k = Math.floor((+new Date(d.setHours(0, 0, 0, 0)) - +ini) / 86400000); if (k >= 0 && k < 7) dias[k] += s.minutos; }
  return { dias, total: dias.reduce((a, b) => a + b, 0), hoje: dow, inicio: ini.toISOString() };
}
