-- Fase 12 (V1.1): auditoria de segurança (Kerberos) — hardening defense-in-depth.
--
-- A migration 0010 revogou UPDATE de "authenticated" em usuarios e regrantou
-- só (nome, foto_url), justamente porque uma policy de RLS por linha sozinha
-- não impede auto-promoção a admin. Mas o mesmo grant amplo (todas as colunas,
-- incluindo "perfil") continuava de pé pro role "anon" — grant padrão do
-- Supabase na criação da tabela, nunca revogado.
--
-- Hoje isso não é explorável: o RLS de usuarios_update_own exige
-- id = auth.uid(), e pra uma sessão anônima auth.uid() é null, então nenhuma
-- linha nunca bate (verificado com teste real: 0 linhas afetadas). Mas "anon"
-- não tem NENHUM motivo legítimo pra atualizar qualquer linha de usuarios —
-- então não faz sentido deixar esse grant de pé só torcendo pro RLS nunca falhar.

revoke update on usuarios from anon;
