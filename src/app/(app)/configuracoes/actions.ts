"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const TIPOS_PERMITIDOS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function atualizarNome(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) throw new Error("Nome não pode ficar vazio.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const { error } = await supabase.from("usuarios").update({ nome }).eq("id", user.id);
  if (error) throw new Error(`Não foi possível atualizar o nome: ${error.message}`);

  revalidatePath("/configuracoes");
}

export async function atualizarFoto(formData: FormData) {
  const arquivo = formData.get("foto");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    throw new Error("Selecione uma imagem.");
  }

  const extensao = TIPOS_PERMITIDOS[arquivo.type];
  if (!extensao) {
    throw new Error("Formato não suportado. Use PNG, JPEG ou WEBP.");
  }
  if (arquivo.size > 2 * 1024 * 1024) {
    throw new Error("A imagem precisa ter no máximo 2MB.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const caminho = `${user.id}/avatar.${extensao}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(caminho, arquivo, { upsert: true, contentType: arquivo.type });

  if (uploadError) {
    throw new Error(`Não foi possível enviar a foto: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(caminho);
  const fotoUrl = `${urlData.publicUrl}?v=${Date.now()}`;

  const { error } = await supabase.from("usuarios").update({ foto_url: fotoUrl }).eq("id", user.id);
  if (error) throw new Error(`Não foi possível salvar a foto: ${error.message}`);

  revalidatePath("/configuracoes");
  revalidatePath("/chamados");
}

export async function trocarSenha(formData: FormData) {
  const senha = String(formData.get("senha") ?? "");
  const confirmacao = String(formData.get("confirmacao") ?? "");

  if (senha.length < 8) throw new Error("A senha precisa ter no mínimo 8 caracteres.");
  if (senha !== confirmacao) throw new Error("As senhas não coincidem.");

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) throw new Error(`Não foi possível trocar a senha: ${error.message}`);
}
