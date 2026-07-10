"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { enviarAnexoPortal } from "@/lib/chamados/anexos";

export async function adicionarComentario(chamadoId: string, formData: FormData) {
  const corpo = String(formData.get("corpo") ?? "");
  if (!corpo.trim()) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");

  const { data: mensagem, error } = await supabase
    .from("chamado_mensagens")
    .insert({
      chamado_id: chamadoId,
      autor_usuario_id: user.id,
      autor_email: user.email,
      corpo,
      canal: "portal",
    })
    .select("id")
    .single();

  if (error || !mensagem) {
    throw new Error(`Não foi possível adicionar o comentário: ${error?.message}`);
  }

  const anexos = formData.getAll("anexos").filter((a): a is File => a instanceof File && a.size > 0);
  for (const arquivo of anexos) {
    await enviarAnexoPortal(supabase, {
      chamadoId,
      mensagemId: mensagem.id,
      usuarioId: user.id,
      arquivo,
    });
  }

  revalidatePath(`/chamados/${chamadoId}`);
}

export async function pegarChamado(chamadoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");

  const { data, error } = await supabase
    .from("chamados")
    .update({ atribuido_a_usuario_id: user.id })
    .eq("id", chamadoId)
    .is("atribuido_a_usuario_id", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Não foi possível pegar o chamado: ${error.message}`);
  }
  if (!data) {
    throw new Error("Chamado já foi atribuído a outra pessoa, ou você não tem permissão para atendê-lo.");
  }

  revalidatePath(`/chamados/${chamadoId}`);
  revalidatePath("/chamados");
}

export async function devolverAFila(chamadoId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");

  const { data, error } = await supabase
    .from("chamados")
    .update({ atribuido_a_usuario_id: null })
    .eq("id", chamadoId)
    .eq("atribuido_a_usuario_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Não foi possível devolver o chamado à fila: ${error.message}`);
  }
  if (!data) {
    throw new Error("Esse chamado não está atribuído a você.");
  }

  revalidatePath(`/chamados/${chamadoId}`);
  revalidatePath("/chamados");
}

export async function vincularArtigo(chamadoId: string, formData: FormData) {
  const artigoId = String(formData.get("artigo_id") ?? "");
  if (!artigoId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("chamado_artigos_consultados").insert({
    chamado_id: chamadoId,
    artigo_id: artigoId,
    usuario_id: user.id,
  });

  if (error && error.code !== "23505") {
    // 23505 = já vinculado (unique constraint) — ignora silenciosamente
    throw new Error(`Não foi possível vincular o artigo: ${error.message}`);
  }

  revalidatePath(`/chamados/${chamadoId}`);
}
