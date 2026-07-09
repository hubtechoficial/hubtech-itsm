"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function criarUsuario(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const perfil = String(formData.get("perfil") ?? "basico") as "basico" | "supervisor" | "admin";
  const projetoIdRaw = String(formData.get("projeto_id") ?? "");
  const grupoIdRaw = String(formData.get("grupo_id") ?? "");

  if (!nome || !email || senha.length < 8) {
    throw new Error("Nome, e-mail e senha (mínimo 8 caracteres) são obrigatórios.");
  }

  const isAdmin = perfil === "admin";
  const projetoId = isAdmin ? null : projetoIdRaw || null;
  const grupoId = grupoIdRaw || null;

  if (!isAdmin && !projetoId) {
    throw new Error("Usuários com perfil Básico ou Supervisor precisam de um Projeto.");
  }

  const supabaseAdmin = createAdminClient();

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (authError || !authUser.user) {
    throw new Error(`Não foi possível criar a conta: ${authError?.message}`);
  }

  const { error: usuarioError } = await supabaseAdmin.from("usuarios").insert({
    id: authUser.user.id,
    nome,
    email,
    perfil,
    projeto_id: projetoId,
    grupo_id: grupoId,
  });

  if (usuarioError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(`Não foi possível registrar o usuário: ${usuarioError.message}`);
  }

  revalidatePath("/admin/usuarios");
}
