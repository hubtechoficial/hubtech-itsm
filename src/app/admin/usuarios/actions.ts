"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUsuarioAtual } from "@/lib/usuarios/current";

type Perfil = "basico" | "supervisor" | "tecnico" | "admin";

export async function criarUsuario(formData: FormData) {
  const usuarioAtual = await getUsuarioAtual();
  if (usuarioAtual?.perfil !== "admin") {
    throw new Error("Apenas Administradores podem criar usuários.");
  }

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const perfil = String(formData.get("perfil") ?? "basico") as Perfil;
  const projetoIdRaw = String(formData.get("projeto_id") ?? "");
  const grupoIdRaw = String(formData.get("grupo_id") ?? "");
  const projetosTecnicoIds = formData.getAll("projetos_tecnico").map(String).filter(Boolean);

  if (!nome || !email || senha.length < 8) {
    throw new Error("Nome, e-mail e senha (mínimo 8 caracteres) são obrigatórios.");
  }

  const semProjetoFixo = perfil === "admin" || perfil === "tecnico";
  const projetoId = semProjetoFixo ? null : projetoIdRaw || null;
  const grupoId = grupoIdRaw || null;

  if (!semProjetoFixo && !projetoId) {
    throw new Error("Usuários com perfil Básico ou Supervisor precisam de um Projeto.");
  }
  if (perfil === "tecnico" && projetosTecnicoIds.length === 0) {
    throw new Error("Selecione ao menos um Projeto para o Técnico atender.");
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

  if (perfil === "tecnico" && projetosTecnicoIds.length > 0) {
    const { error: vinculoError } = await supabaseAdmin.from("tecnico_projetos").insert(
      projetosTecnicoIds.map((projeto_id) => ({ usuario_id: authUser.user.id, projeto_id })),
    );
    if (vinculoError) {
      throw new Error(`Usuário criado, mas falhou ao vincular Projetos: ${vinculoError.message}`);
    }
  }

  revalidatePath("/admin/usuarios");
}

export async function adicionarProjetoTecnico(usuarioId: string, formData: FormData) {
  const usuarioAtual = await getUsuarioAtual();
  if (usuarioAtual?.perfil !== "admin") {
    throw new Error("Apenas Administradores podem gerenciar vínculos de Técnico.");
  }

  const projetoId = String(formData.get("projeto_id") ?? "");
  if (!projetoId) return;

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("tecnico_projetos")
    .insert({ usuario_id: usuarioId, projeto_id: projetoId });

  if (error && error.code !== "23505") {
    throw new Error(`Não foi possível vincular o Projeto: ${error.message}`);
  }

  revalidatePath("/admin/usuarios");
}

export async function removerProjetoTecnico(usuarioId: string, projetoId: string) {
  const usuarioAtual = await getUsuarioAtual();
  if (usuarioAtual?.perfil !== "admin") {
    throw new Error("Apenas Administradores podem gerenciar vínculos de Técnico.");
  }

  const supabaseAdmin = createAdminClient();
  const { error } = await supabaseAdmin
    .from("tecnico_projetos")
    .delete()
    .eq("usuario_id", usuarioId)
    .eq("projeto_id", projetoId);

  if (error) {
    throw new Error(`Não foi possível remover o vínculo: ${error.message}`);
  }

  revalidatePath("/admin/usuarios");
}
