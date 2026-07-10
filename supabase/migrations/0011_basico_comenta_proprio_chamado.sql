-- Fase 11 (V1.1): corrige bug encontrado durante o teste de abertura de chamado
-- pelo portal (Fase 08).
--
-- A policy mensagens_insert nunca foi atualizada quando o perfil Básico passou a
-- poder abrir chamado pelo portal (migration 0008): o chamado era criado, mas a
-- mensagem inicial (a descrição do problema) era bloqueada pelo RLS e o erro não
-- era verificado no código — o usuário via a tela de sucesso e a descrição sumia.

drop policy mensagens_insert on chamado_mensagens;
create policy mensagens_insert on chamado_mensagens for insert
  with check (
    exists (
      select 1 from chamados c
      where c.id = chamado_mensagens.chamado_id
      and (
        meu_perfil() = 'admin'
        or (meu_perfil() = 'tecnico' and c.projeto_id in (select meus_projetos_tecnico()))
        or (meu_perfil() = 'supervisor' and c.projeto_id = meu_projeto_id() and c.grupo_id = meu_grupo_id())
        or (meu_perfil() = 'basico' and c.projeto_id = meu_projeto_id() and c.aberto_por_usuario_id = auth.uid())
      )
    )
  );
