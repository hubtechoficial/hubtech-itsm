"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function adicionarComentario(chamadoId: string, formData: FormData) {
  const corpo = String(formData.get("corpo") ?? "");
  if (!corpo.trim()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("chamado_mensagens").insert({
    chamado_id: chamadoId,
    autor_usuario_id: user.id,
    autor_email: user.email,
    corpo,
    canal: "portal",
  });

  if (error) {
    throw new Error(`Não foi possível adicionar o comentário: ${error.message}`);
  }

  revalidatePath(`/chamados/${chamadoId}`);
}
