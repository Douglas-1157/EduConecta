'use server';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../supabase/server';

type R = { ok: boolean; erro?: string };
const msg = (e: { message: string } | null): R => (e ? { ok: false, erro: e.message } : { ok: true });

export async function concluirItem(itemId: string): Promise<R> {
  const db = await supabaseServer();
  const { error } = await db.rpc('registrar_progresso', { p_item: itemId, p_pct: 100 });
  revalidatePath('/aluno', 'layout');
  return msg(error);
}
export async function salvarProgressoVideo(itemId: string, pct: number): Promise<R> {
  const db = await supabaseServer();
  const { error } = await db.rpc('registrar_progresso', { p_item: itemId, p_pct: Math.min(99, Math.max(1, Math.round(pct))) });
  return msg(error);
}
export async function registrarFoco(minutos: number): Promise<R> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false, erro: 'Sessão expirada.' };
  const { error } = await db.from('sessoes_estudo').insert({ aluno_id: user.id, minutos: Math.max(1, Math.min(600, Math.round(minutos))), origem: 'foco' });
  revalidatePath('/aluno', 'layout');
  return msg(error);
}
export async function enviarDuvida(mensagem: string, contexto: string | null, itemId: string | null): Promise<R> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false, erro: 'Sessão expirada.' };
  const { error } = await db.from('duvidas').insert({ aluno_id: user.id, mensagem: mensagem.trim(), contexto, item_id: itemId });
  revalidatePath('/aluno/duvidas');
  return msg(error);
}
export async function salvarMeta(minutos: number): Promise<R> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false, erro: 'Sessão expirada.' };
  const { error } = await db.from('profiles').update({ meta_semanal_min: minutos }).eq('id', user.id);
  revalidatePath('/aluno');
  return msg(error);
}

export async function iniciarSimulado(simuladoId: string, treino: boolean): Promise<R & { tentativa?: string }> {
  const db = await supabaseServer();
  const { data, error } = await db.rpc('iniciar_tentativa', { p_simulado: simuladoId, p_treino: treino });
  if (error) return { ok: false, erro: error.message };
  return { ok: true, tentativa: data as string };
}
export async function responderQuestao(tentativa: string, questao: string, marcada: number): Promise<R> {
  const db = await supabaseServer();
  const { error } = await db.rpc('responder_questao', { p_tentativa: tentativa, p_questao: questao, p_marcada: marcada });
  return msg(error);
}
export async function finalizarSimulado(tentativa: string): Promise<R> {
  const db = await supabaseServer();
  const { error } = await db.rpc('finalizar_tentativa', { p_tentativa: tentativa });
  revalidatePath('/aluno', 'layout');
  return msg(error);
}

export async function salvarRedacao(temaId: string, texto: string, enviar: boolean): Promise<R> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return { ok: false, erro: 'Sessão expirada.' };
  if (enviar && texto.trim().split(/\s+/).length < 30) return { ok: false, erro: 'Escreva um pouco mais antes de enviar (mínimo de 30 palavras).' };
  const { data: ex } = await db.from('redacoes').select('id,status').eq('tema_id', temaId).eq('aluno_id', user.id).maybeSingle();
  const status = enviar ? 'enviada' : 'rascunho';
  const { error } = ex
    ? await db.from('redacoes').update({ texto, status }).eq('id', ex.id)
    : await db.from('redacoes').insert({ tema_id: temaId, aluno_id: user.id, texto, status });
  revalidatePath('/aluno/redacao', 'layout');
  return msg(error);
}
