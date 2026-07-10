"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function criarGrupo(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const projetoId = String(formData.get("projeto_id") ?? "");

  if (!nome || !projetoId) {
    throw new Error("Nome e Projeto são obrigatórios.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("grupos").insert({ nome, projeto_id: projetoId });

  if (error) {
    throw new Error(`Não foi possível criar o Grupo: ${error.message}`);
  }

  revalidatePath("/admin/grupos");
}
