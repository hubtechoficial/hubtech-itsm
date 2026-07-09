"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function criarProjeto(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const dominios = String(formData.get("dominios_email") ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const slaResposta = formData.get("sla_resposta_minutos");
  const slaResolucao = formData.get("sla_resolucao_minutos");

  if (!nome || dominios.length === 0) {
    throw new Error("Nome e ao menos um domínio de e-mail são obrigatórios.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("projetos").insert({
    nome,
    dominios_email: dominios,
    sla_resposta_minutos: slaResposta ? Number(slaResposta) : null,
    sla_resolucao_minutos: slaResolucao ? Number(slaResolucao) : null,
  });

  if (error) {
    throw new Error(`Não foi possível criar o Projeto: ${error.message}`);
  }

  revalidatePath("/admin/projetos");
}

export async function atualizarProjeto(projetoId: string, formData: FormData) {
  const dominios = String(formData.get("dominios_email") ?? "")
    .split(",")
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  const slaResposta = formData.get("sla_resposta_minutos");
  const slaResolucao = formData.get("sla_resolucao_minutos");

  if (dominios.length === 0) {
    throw new Error("Ao menos um domínio de e-mail é obrigatório.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("projetos")
    .update({
      dominios_email: dominios,
      sla_resposta_minutos: slaResposta ? Number(slaResposta) : null,
      sla_resolucao_minutos: slaResolucao ? Number(slaResolucao) : null,
    })
    .eq("id", projetoId);

  if (error) {
    throw new Error(`Não foi possível atualizar o Projeto: ${error.message}`);
  }

  revalidatePath("/admin/projetos");
}
