-- Fase 09 (V1.1): usuário pode atualizar o próprio nome/foto pelo portal.
--
-- CUIDADO: uma policy de RLS comum (using id = auth.uid()) protegeria a LINHA,
-- mas não a COLUNA — sem a restrição de GRANT abaixo, o próprio usuário
-- conseguiria se promover a perfil='admin' num UPDATE direto. Por isso a
-- permissão de escrita é restrita a colunas específicas (nome, foto_url),
-- nunca a linha inteira.

create policy usuarios_update_own on usuarios for update
  using (id = auth.uid())
  with check (id = auth.uid());

revoke update on usuarios from authenticated;
grant update (nome, foto_url) on usuarios to authenticated;
