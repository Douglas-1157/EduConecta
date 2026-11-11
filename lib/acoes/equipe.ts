'use server';
import { revalidatePath } from 'next/cache';
import { supabaseServer } from '../supabase/server';
import { supabaseAdmin } from '../supabase/admin';
import type { Estado } from '@/components/Form';

const ok = (msg = 'Salvo.'): Estado => ({ ok: true, msg });
const no = (msg: string): Estado => ({ ok: false, msg });
const txt = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();
const num = (fd: FormData, k: string, d = 0) => { const n = Number(fd.get(k)); return Number.isFinite(n) && n > 0 ? n : d; };

async function equipe() {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data: p } = await db.from('profiles').select('id,papel,status').eq('id', user.id).single();
  if (!p || p.status !== 'ativo' || p.papel === 'aluno') return null;
  return { db, id: p.id as string, papel: p.papel as 'professor' | 'gestao' };
}
async function gestao() { const e = await equipe(); return e && e.papel === 'gestao' ? e : null; }

// ---------- Conteúdo ----------
export async function publicarItem(_: Estado, fd: FormData): Promise<Estado> {
  const e = await equipe(); if (!e) return no('Sem permissão.');
  const { db } = e;
  const disciplina = txt(fd, 'disciplina_id'), tipo = txt(fd, 'tipo'), titulo = txt(fd, 'titulo');
  const turmas = fd.getAll('turmas').map(String);
  if (!disciplina || !titulo || !['video', 'pdf'].includes(tipo)) return no('Preencha disciplina, tipo e título.');
  if (!turmas.length) return no('Escolha ao menos uma turma.');
  let moduloId = txt(fd, 'modulo_id');
  const novoModulo = txt(fd, 'modulo_novo');
  if (novoModulo) {
    const { count } = await db.from('modulos').select('id', { count: 'exact', head: true }).eq('disciplina_id', disciplina);
    const { data: m, error } = await db.from('modulos').insert({ disciplina_id: disciplina, nome: novoModulo, ordem: (count ?? 0) + 1 }).select('id').single();
    if (error) return no(error.message); moduloId = m.id;
  }
  if (!moduloId) return no('Escolha um módulo ou crie um novo.');
  let url: string | null = txt(fd, 'url') || null, arquivo: string | null = null;
  if (tipo === 'video' && !url) return no('Cole o link do vídeo (YouTube).');
  if (url && !/^https?:\/\//.test(url)) return no('O link precisa começar com http:// ou https://');
  const file = fd.get('arquivo');
  if (tipo === 'pdf' && file instanceof File && file.size > 0) {
    if (file.type !== 'application/pdf') return no('Envie o arquivo em PDF.');
    if (file.size > 20 * 1024 * 1024) return no('O PDF passa de 20 MB.');
    if (new TextDecoder().decode(new Uint8Array(await file.slice(0, 5).arrayBuffer())) !== '%PDF-') return no('Esse arquivo não é um PDF válido.');
    arquivo = `apostilas/${crypto.randomUUID()}.pdf`;
    const up = await db.storage.from('conteudo').upload(arquivo, file, { contentType: 'application/pdf' });
    if (up.error) return no('Falha ao enviar o PDF: ' + up.error.message);
  } else if (tipo === 'pdf' && !url) return no('Anexe o PDF da apostila ou cole um link.');
  const { count: n } = await db.from('itens').select('id', { count: 'exact', head: true }).eq('modulo_id', moduloId);
  const { data: item, error } = await db.from('itens').insert({
    modulo_id: moduloId, tipo, titulo, minutos: num(fd, 'minutos', 20), competencia_id: txt(fd, 'competencia_id') || null,
    url, arquivo_path: arquivo, ordem: (n ?? 0) + 1, criado_por: e.id,
  }).select('id').single();
  if (error) return no(error.message);
  const prazo = txt(fd, 'prazo') || null;
  const { error: e2 } = await db.from('item_turmas').insert(turmas.map(t => ({ item_id: item.id, turma_id: t, prazo })));
  if (e2) return no(e2.message);
  revalidatePath('/professor/conteudo');
  return ok('Publicado para as turmas escolhidas.');
}
export async function alternarPublicacao(itemId: string, publicado: boolean) {
  const e = await equipe(); if (!e) return;
  await e.db.from('itens').update({ publicado }).eq('id', itemId);
  revalidatePath('/professor/conteudo');
}
export async function apagarItem(itemId: string) {
  const e = await equipe(); if (!e) return;
  await e.db.from('itens').delete().eq('id', itemId);
  revalidatePath('/professor/conteudo');
}
export async function criarRecurso(_: Estado, fd: FormData): Promise<Estado> {
  const e = await equipe(); if (!e) return no('Sem permissão.');
  const url = txt(fd, 'url'); if (!/^https?:\/\//.test(url)) return no('O link precisa começar com http:// ou https://');
  const { error } = await e.db.from('recursos').insert({ tipo: txt(fd, 'tipo'), categoria: txt(fd, 'categoria') || 'Geral', titulo: txt(fd, 'titulo'), descricao: txt(fd, 'descricao') || null, carga: txt(fd, 'carga') || null, url, criado_por: e.id });
  if (error) return no(error.message);
  revalidatePath('/professor/conteudo'); return ok('Adicionado à biblioteca.');
}
export async function apagarRecurso(id: string) { const e = await equipe(); if (!e) return; await e.db.from('recursos').delete().eq('id', id); revalidatePath('/professor/conteudo'); }

// ---------- Questões e simulados ----------
export async function criarQuestao(_: Estado, fd: FormData): Promise<Estado> {
  const e = await equipe(); if (!e) return no('Sem permissão.');
  const alts = [0, 1, 2, 3, 4].map(i => txt(fd, `alt${i}`)).filter(Boolean);
  const correta = Number(fd.get('correta'));
  if (alts.length < 2) return no('Informe ao menos duas alternativas.');
  if (!(correta >= 0 && correta < alts.length)) return no('Marque a alternativa correta.');
  const { error } = await e.db.from('questoes').insert({
    disciplina_id: txt(fd, 'disciplina_id'), competencia_id: txt(fd, 'competencia_id') || null, enunciado: txt(fd, 'enunciado'),
    alternativas: alts, correta, comentario: txt(fd, 'comentario') || null, criado_por: e.id,
  });
  if (error) return no(error.message);
  revalidatePath('/professor/banco'); return ok('Questão adicionada ao banco.');
}
export async function apagarQuestao(id: string) { const e = await equipe(); if (!e) return; await e.db.from('questoes').delete().eq('id', id); revalidatePath('/professor/banco'); }

export async function criarSimulado(_: Estado, fd: FormData): Promise<Estado> {
  const e = await equipe(); if (!e) return no('Sem permissão.');
  const { db } = e;
  const qs = fd.getAll('questoes').map(String), turmas = fd.getAll('turmas').map(String), titulo = txt(fd, 'titulo');
  if (!titulo) return no('Dê um título ao simulado.');
  if (!qs.length) return no('Selecione ao menos uma questão.');
  if (!turmas.length) return no('Escolha ao menos uma turma.');
  const { data: s, error } = await db.from('simulados').insert({ titulo, minutos: num(fd, 'minutos', 30), disciplina_id: txt(fd, 'disciplina_id') || null, criado_por: e.id }).select('id').single();
  if (error) return no(error.message);
  const prazo = txt(fd, 'prazo') || null;
  const r1 = await db.from('simulado_questoes').insert(qs.map((q, i) => ({ simulado_id: s.id, questao_id: q, ordem: i + 1 })));
  const r2 = await db.from('simulado_turmas').insert(turmas.map(t => ({ simulado_id: s.id, turma_id: t, prazo })));
  if (r1.error || r2.error) return no((r1.error ?? r2.error)!.message);
  // opcional: encaixa o simulado ao fim de um módulo da trilha (assim ele respeita a trava progressiva)
  const modulo = txt(fd, 'modulo_id');
  if (modulo) {
    const { count } = await db.from('itens').select('id', { count: 'exact', head: true }).eq('modulo_id', modulo);
    const { data: it, error: e3 } = await db.from('itens').insert({ modulo_id: modulo, tipo: 'sim', titulo, minutos: num(fd, 'minutos', 30), simulado_id: s.id, ordem: (count ?? 0) + 1, criado_por: e.id }).select('id').single();
    if (e3) return no(e3.message);
    await db.from('item_turmas').insert(turmas.map(t => ({ item_id: it.id, turma_id: t, prazo })));
  }
  revalidatePath('/professor/banco'); revalidatePath('/professor/conteudo');
  return ok('Simulado publicado para as turmas.');
}

// ---------- Dúvidas ----------
export async function responderDuvida(_: Estado, fd: FormData): Promise<Estado> {
  const e = await equipe(); if (!e) return no('Sem permissão.');
  const resposta = txt(fd, 'resposta'); if (resposta.length < 2) return no('Escreva a resposta.');
  const { error } = await e.db.from('duvidas').update({ resposta, status: 'respondida', respondida_por: e.id, respondida_em: new Date().toISOString() }).eq('id', txt(fd, 'id'));
  if (error) return no(error.message);
  if (fd.get('salvar')) await e.db.from('respostas_salvas').insert({ professor_id: e.id, texto: resposta.slice(0, 1000) });
  revalidatePath('/professor/duvidas'); return ok('Resposta enviada.');
}
export async function apagarSalva(id: string) { const e = await equipe(); if (!e) return; await e.db.from('respostas_salvas').delete().eq('id', id); revalidatePath('/professor/duvidas'); }

// ---------- Redação ----------
export async function criarTemaRedacao(_: Estado, fd: FormData): Promise<Estado> {
  const e = await equipe(); if (!e) return no('Sem permissão.');
  const turmas = fd.getAll('turmas').map(String); if (!turmas.length) return no('Escolha ao menos uma turma.');
  const { data: t, error } = await e.db.from('redacao_temas').insert({ titulo: txt(fd, 'titulo'), enunciado: txt(fd, 'enunciado') || null, prazo: txt(fd, 'prazo') || null, criado_por: e.id }).select('id').single();
  if (error) return no(error.message);
  const r = await e.db.from('redacao_tema_turmas').insert(turmas.map(x => ({ tema_id: t.id, turma_id: x })));
  if (r.error) return no(r.error.message);
  revalidatePath('/professor/redacoes'); return ok('Tema publicado.');
}
export async function corrigirRedacao(_: Estado, fd: FormData): Promise<Estado> {
  const e = await equipe(); if (!e) return no('Sem permissão.');
  const c = [1, 2, 3, 4, 5].map(i => Number(fd.get(`c${i}`)));
  if (c.some(v => !Number.isInteger(v) || v < 0 || v > 200 || v % 40 !== 0)) return no('Escolha uma nota de 0 a 200 para cada competência.');
  const { error } = await e.db.from('redacoes').update({ c1: c[0], c2: c[1], c3: c[2], c4: c[3], c5: c[4], comentario: txt(fd, 'comentario') || null, status: 'corrigida', corretor_id: e.id }).eq('id', txt(fd, 'id'));
  if (error) return no(error.message);
  revalidatePath('/professor/redacoes', 'layout'); return ok('Correção enviada ao aluno.');
}

// ---------- Gestão ----------
export async function decidirCadastro(id: string, aprovar: boolean) {
  const e = await gestao(); if (!e) return;
  await e.db.from('profiles').update({ status: aprovar ? 'ativo' : 'recusado' }).eq('id', id);
  revalidatePath('/gestao', 'layout');
}
export async function criarTurma(_: Estado, fd: FormData): Promise<Estado> {
  const e = await gestao(); if (!e) return no('Apenas a gestão cria turmas.');
  const { error } = await e.db.from('turmas').insert({ nome: txt(fd, 'nome'), turno: txt(fd, 'turno') || null });
  if (error) return no(error.message.includes('unique') ? 'Já existe uma turma com esse nome.' : error.message);
  revalidatePath('/gestao', 'layout'); return ok('Turma criada.');
}
export async function alternarTrava(turmaId: string, ligada: boolean) {
  const e = await gestao(); if (!e) return;
  await e.db.from('turmas').update({ trava_progressiva: ligada }).eq('id', turmaId);
  revalidatePath('/gestao', 'layout'); revalidatePath('/aluno', 'layout');
}
export async function moverAluno(_: Estado, fd: FormData): Promise<Estado> {
  const e = await gestao(); if (!e) return no('Sem permissão.');
  const { error } = await e.db.from('profiles').update({ turma_id: txt(fd, 'turma_id') || null }).eq('id', txt(fd, 'id'));
  if (error) return no(error.message);
  revalidatePath('/gestao', 'layout'); return ok('Turma atualizada.');
}
// Cria a conta de um professor (a gestão define uma senha provisória e repassa).
export async function criarProfessor(_: Estado, fd: FormData): Promise<Estado> {
  const e = await gestao(); if (!e) return no('Apenas a gestão cadastra professores.');
  const email = txt(fd, 'email'), nome = txt(fd, 'nome'), senha = String(fd.get('senha') ?? '');
  if (!nome || !email || senha.length < 8) return no('Informe nome, e-mail e uma senha provisória de 8+ caracteres.');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return no('Falta configurar SUPABASE_SERVICE_ROLE_KEY no servidor.');
  const admin = supabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome } });
  if (error || !data.user) return no(error?.message ?? 'Não foi possível criar a conta.');
  const { error: e2 } = await admin.from('profiles').update({ papel: fd.get('gestao') ? 'gestao' : 'professor', status: 'ativo' }).eq('id', data.user.id);
  if (e2) return no(e2.message);
  revalidatePath('/gestao', 'layout'); return ok('Conta criada. Passe o e-mail e a senha provisória à pessoa.');
}

// Define as turmas em que um professor leciona (substitui a lista anterior).
export async function definirTurmasProfessor(_: Estado, fd: FormData): Promise<Estado> {
  const e = await gestao(); if (!e) return no('Apenas a gestão define isso.');
  const prof = txt(fd, 'professor_id'); if (!prof) return no('Escolha o professor.');
  const turmas = fd.getAll('turmas').map(String).filter(Boolean);
  const { error: e1 } = await e.db.from('professor_turmas').delete().eq('professor_id', prof);
  if (e1) return no(e1.message);
  if (turmas.length) { const { error } = await e.db.from('professor_turmas').insert(turmas.map(t => ({ professor_id: prof, turma_id: t }))); if (error) return no(error.message); }
  revalidatePath('/gestao', 'layout'); revalidatePath('/professor', 'layout');
  return ok(turmas.length ? 'Turmas do professor atualizadas.' : 'Sem turmas marcadas: o professor volta a ver todas.');
}

// Importa alunos de uma planilha salva como CSV (colunas: nome, email, matricula, turma).
export async function importarAlunos(_: Estado, fd: FormData): Promise<Estado> {
  const e = await gestao(); if (!e) return no('Apenas a gestão importa alunos.');
  const arq = fd.get('arquivo'); const senha = String(fd.get('senha') ?? '');
  if (!(arq instanceof File) || !arq.size) return no('Escolha o arquivo CSV.');
  if (senha.length < 8) return no('Defina uma senha provisória de 8+ caracteres.');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return no('Falta configurar SUPABASE_SERVICE_ROLE_KEY no servidor.');
  const texto = (await arq.text()).replace(/^﻿/, '');
  const linhas = texto.split(/\r?\n/).filter(l => l.trim());
  if (linhas.length < 2) return no('O arquivo precisa do cabeçalho e de pelo menos um aluno.');
  const sep = linhas[0].split(';').length > linhas[0].split(',').length ? ';' : ',';
  const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  const cab = linhas[0].split(sep).map(norm);
  const col = (n: string) => cab.indexOf(n);
  const [iN, iE, iM, iT] = [col('nome'), col('email'), col('matricula'), col('turma')];
  if (iN < 0 || iE < 0) return no('O cabeçalho precisa ter as colunas "nome" e "email" (e, se quiser, "matricula" e "turma").');
  if (linhas.length - 1 > 300) return no('Máximo de 300 alunos por arquivo. Divida em partes.');
  const { data: turmas } = await e.db.from('turmas').select('id,nome');
  const porNome = new Map((turmas ?? []).map(t => [norm(t.nome), t.id]));
  const admin = supabaseAdmin(); let criados = 0; const erros: string[] = [];
  for (let i = 1; i < linhas.length; i++) {
    const c = linhas[i].split(sep).map(x => x.trim().replace(/^"|"$/g, ''));
    const nome = c[iN], email = c[iE]?.toLowerCase();
    if (!nome || !email || !/^\S+@\S+\.\S+$/.test(email)) { erros.push(`linha ${i + 1}: nome/e-mail inválido`); continue; }
    const turma = iT >= 0 && c[iT] ? porNome.get(norm(c[iT])) : undefined;
    if (iT >= 0 && c[iT] && !turma) { erros.push(`linha ${i + 1}: turma "${c[iT]}" não existe`); continue; }
    const { data, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome, matricula: iM >= 0 ? c[iM] : '', turma_id: turma ?? '' } });
    if (error || !data.user) { erros.push(`linha ${i + 1}: ${/already|registered/i.test(error?.message ?? '') ? 'e-mail já cadastrado' : error?.message}`); continue; }
    await admin.from('profiles').update({ status: 'ativo' }).eq('id', data.user.id);
    criados++;
  }
  revalidatePath('/gestao', 'layout');
  const resumo = `${criados} aluno(s) criado(s).`;
  return erros.length ? { ok: criados > 0, msg: `${resumo} Problemas: ${erros.slice(0, 8).join('; ')}${erros.length > 8 ? `… (+${erros.length - 8})` : ''}` } : ok(resumo);
}
