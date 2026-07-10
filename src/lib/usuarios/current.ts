import { createClient } from "@/lib/supabase/server";

export type Perfil = "basico" | "supervisor" | "tecnico" | "admin";

export interface UsuarioAtual {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  projetoId: string | null;
  grupoId: string | null;
  fotoUrl: string | null;
}

export async function getUsuarioAtual(): Promise<UsuarioAtual | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, projeto_id, grupo_id, foto_url")
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
    fotoUrl: data.foto_url,
  };
}

/** Projetos que o Técnico logado atende. Vazio pra quem não é Técnico. */
export async function getProjetosTecnico(): Promise<{ id: string; nome: string }[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("tecnico_projetos")
    .select("projetos(id, nome)")
    .eq("usuario_id", user.id);

  if (!data) return [];

  return data.flatMap((linha) => {
    const projeto = linha.projetos as unknown as { id: string; nome: string } | { id: string; nome: string }[] | null;
    if (!projeto) return [];
    return Array.isArray(projeto) ? projeto : [projeto];
  });
}
