"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function criarArtigo(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim();
  const conteudo = String(formData.get("conteudo") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (!titulo || !conteudo) {
    throw new Error("Título e conteúdo são obrigatórios.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("artigos_conhecimento").insert({ titulo, conteudo, tags });

  if (error) {
    throw new Error(`Não foi possível criar o artigo: ${error.message}`);
  }

  revalidatePath("/admin/artigos");
}
