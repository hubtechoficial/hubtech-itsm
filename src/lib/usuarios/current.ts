import { createClient } from "@/lib/supabase/server";

export type Perfil = "basico" | "supervisor" | "admin";

export interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  projetoId: string | null;
  grupoId: string | null;
}

export async function getUsuarioAtual(): Promise<UsuarioAtual | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, projeto_id, grupo_id")
    .eq("id", user.id)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    nome: data.nome,
    email: data.email,
    perfil: data.perfil,
    projetoId: data.projeto_id,
    grupoId: data.grupo_id,
  };
}
