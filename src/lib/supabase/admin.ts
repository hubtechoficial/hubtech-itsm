import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente com Service Role — ignora RLS. Uso restrito a rotas server-side
 * de confiança (ex: webhook de ingestão de e-mail, provisionamento de usuário
 * pelo Administrador). Nunca importar em código que roda no browser.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
