-- Segurança em nível de linha (RLS): cada perfil só enxerga o que precisa ---------

do $$ declare t text; begin
  for t in select unnest(array['turmas','profiles','disciplinas','competencias','modulos','questoes','simulados',
    'simulado_questoes','simulado_turmas','itens','item_turmas','progresso','sessoes_estudo','tentativas','respostas',
    'redacao_temas','redacao_tema_turmas','redacoes','duvidas','respostas_salvas','recursos'])
  loop execute format('alter table %I enable row level security', t); end loop;
end $$;

-- Perfis
create policy perfis_ver on profiles for select to authenticated using (id = auth.uid() or eh_equipe());
create policy perfis_editar_proprio on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy perfis_gestao on profiles for update to authenticated using (eh_gestao()) with check (eh_gestao());
create policy perfis_gestao_apagar on profiles for delete to authenticated using (eh_gestao());

-- Turmas: qualquer pessoa logada vê (cadastro precisa listar); só a gestão altera
create policy turmas_ver on turmas for select using (true);   -- também para o formulário de cadastro (anon)
create policy turmas_gestao on turmas for all to authenticated using (eh_gestao()) with check (eh_gestao());

-- Estrutura do conteúdo: leitura para ativos, escrita para a equipe
do $$ declare t text; begin
  for t in select unnest(array['disciplinas','competencias','modulos'])
  loop
    execute format('create policy %I on %I for select to authenticated using (papel_atual() is not null)', t||'_ver', t);
    execute format('create policy %I on %I for all to authenticated using (eh_equipe()) with check (eh_equipe())', t||'_equipe', t);
  end loop;
end $$;

-- Itens e publicação por turma
create policy itens_aluno on itens for select to authenticated
  using (publicado and exists (select 1 from item_turmas it where it.item_id = itens.id and it.turma_id = turma_atual()));
create policy itens_equipe on itens for all to authenticated using (eh_equipe()) with check (eh_equipe());
create policy item_turmas_aluno on item_turmas for select to authenticated using (turma_id = turma_atual());
create policy item_turmas_equipe on item_turmas for all to authenticated using (eh_equipe()) with check (eh_equipe());

-- Banco de questões e simulados: o aluno NÃO lê questões direto (gabarito protegido)
create policy questoes_equipe on questoes for all to authenticated using (eh_equipe()) with check (eh_equipe());
create policy simulados_aluno on simulados for select to authenticated
  using (exists (select 1 from simulado_turmas st where st.simulado_id = simulados.id and st.turma_id = turma_atual()));
create policy simulados_equipe on simulados for all to authenticated using (eh_equipe()) with check (eh_equipe());
create policy simulado_questoes_equipe on simulado_questoes for all to authenticated using (eh_equipe()) with check (eh_equipe());
create policy simulado_turmas_aluno on simulado_turmas for select to authenticated using (turma_id = turma_atual());
create policy simulado_turmas_equipe on simulado_turmas for all to authenticated using (eh_equipe()) with check (eh_equipe());

-- Progresso, estudo, tentativas: o aluno lê o seu; a equipe lê tudo. Escritas passam pelas funções.
create policy progresso_ver on progresso for select to authenticated using (aluno_id = auth.uid() or eh_equipe());
create policy sessoes_ver on sessoes_estudo for select to authenticated using (aluno_id = auth.uid() or eh_equipe());
create policy sessoes_criar on sessoes_estudo for insert to authenticated
  with check (aluno_id = auth.uid() and papel_atual() = 'aluno' and origem = 'foco');
create policy tentativas_ver on tentativas for select to authenticated using (aluno_id = auth.uid() or eh_equipe());
create policy respostas_ver on respostas for select to authenticated
  using (eh_equipe() or exists (select 1 from tentativas t where t.id = respostas.tentativa_id and t.aluno_id = auth.uid() and t.finalizada_em is not null));

-- Biblioteca
create policy recursos_ver on recursos for select to authenticated using (papel_atual() is not null);
create policy recursos_equipe on recursos for all to authenticated using (eh_equipe()) with check (eh_equipe());

-- Redação
create policy temas_aluno on redacao_temas for select to authenticated
  using (exists (select 1 from redacao_tema_turmas x where x.tema_id = redacao_temas.id and x.turma_id = turma_atual()));
create policy temas_equipe on redacao_temas for all to authenticated using (eh_equipe()) with check (eh_equipe());
create policy tema_turmas_aluno on redacao_tema_turmas for select to authenticated using (turma_id = turma_atual());
create policy tema_turmas_equipe on redacao_tema_turmas for all to authenticated using (eh_equipe()) with check (eh_equipe());
create policy redacoes_ver on redacoes for select to authenticated using (aluno_id = auth.uid() or eh_equipe());
create policy redacoes_aluno_criar on redacoes for insert to authenticated
  with check (aluno_id = auth.uid() and papel_atual() = 'aluno' and status in ('rascunho','enviada')
    and exists (select 1 from redacao_tema_turmas x where x.tema_id = redacoes.tema_id and x.turma_id = turma_atual()));
create policy redacoes_aluno_editar on redacoes for update to authenticated
  using (aluno_id = auth.uid() and status <> 'corrigida') with check (aluno_id = auth.uid());
create policy redacoes_equipe on redacoes for update to authenticated using (eh_equipe()) with check (eh_equipe());

-- Dúvidas
create policy duvidas_ver on duvidas for select to authenticated using (aluno_id = auth.uid() or eh_equipe());
create policy duvidas_criar on duvidas for insert to authenticated
  with check (aluno_id = auth.uid() and papel_atual() = 'aluno' and status = 'pendente' and resposta is null);
create policy duvidas_responder on duvidas for update to authenticated using (eh_equipe()) with check (eh_equipe());
create policy salvas_dono on respostas_salvas for all to authenticated
  using (professor_id = auth.uid() and eh_equipe()) with check (professor_id = auth.uid() and eh_equipe());

-- Permissões de execução das funções: só usuários logados
revoke all on function iniciar_tentativa(uuid,boolean), questoes_da_tentativa(uuid), responder_questao(uuid,uuid,smallint),
  finalizar_tentativa(uuid), gabarito_da_tentativa(uuid), registrar_progresso(uuid,smallint), item_liberado(uuid,uuid), contar_questoes(uuid) from public, anon;
grant execute on function iniciar_tentativa(uuid,boolean), questoes_da_tentativa(uuid), responder_questao(uuid,uuid,smallint),
  finalizar_tentativa(uuid), gabarito_da_tentativa(uuid), registrar_progresso(uuid,smallint), contar_questoes(uuid) to authenticated;
