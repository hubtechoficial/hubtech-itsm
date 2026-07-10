"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, getProjetosTecnico } from "@/lib/usuarios/current";
import { inferPrioridade } from "@/lib/chamados/priority";
import { notificarChamadoCriado } from "@/lib/chamados/notify";

export async function criarChamadoPortal(formData: FormData) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) throw new Error("Não autenticado.");

  const assunto = String(formData.get("assunto") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const tipoItem = String(formData.get("tipo_item") ?? "incidente");
  const projetoIdEnviado = String(formData.get("projeto_id") ?? "");

  if (!assunto || !descricao) {
    throw new Error("Assunto e descrição são obrigatórios.");
  }

  let projetoId: string;
  if (usuarioAtual.perfil === "basico" || usuarioAtual.perfil === "supervisor") {
    if (!usuarioAtual.projetoId) throw new Error("Usuário sem Projeto vinculado.");
    projetoId = usuarioAtual.projetoId;
  } else if (usuarioAtual.perfil === "tecnico") {
    const projetosTecnico = await getProjetosTecnico();
    if (!projetosTecnico.some((p) => p.id === projetoIdEnviado)) {
      throw new Error("Você não atende esse Projeto.");
    }
    projetoId = projetoIdEnviado;
  } else {
    if (!projetoIdEnviado) throw new Error("Selecione um Projeto.");
    projetoId = projetoIdEnviado;
  }

  const supabase = await createClient();

  const { data: projeto, error: projetoError } = await supabase
    .from("projetos")
    .select("id, nome, codigo, sla_resposta_minutos, sla_resolucao_minutos")
    .eq("id", projetoId)
    .single();

  if (projetoError || !projeto) {
    throw new Error("Projeto não encontrado ou sem permissão.");
  }

  const now = new Date();
  const slaResposta = projeto.sla_resposta_minutos
    ? new Date(now.getTime() + projeto.sla_resposta_minutos * 60_000).toISOString()
    : null;
  const slaResolucao = projeto.sla_resolucao_minutos
    ? new Date(now.getTime() + projeto.sla_resolucao_minutos * 60_000).toISOString()
    : null;

  const prioridade = inferPrioridade(assunto, descricao);
  const grupoId = usuarioAtual.perfil === "basico" || usuarioAtual.perfil === "supervisor"
    ? usuarioAtual.grupoId
    : null;

  const { data: novoChamado, error } = await supabase
    .from("chamados")
    .insert({
      projeto_id: projeto.id,
      grupo_id: grupoId,
      aberto_por_usuario_id: usuarioAtual.id,
      email_remetente: usuarioAtual.email,
      assunto,
      tipo_item: tipoItem,
      prioridade,
      sla_prazo_resposta: slaResposta,
      sla_prazo_resolucao: slaResolucao,
    })
    .select("id, numero")
    .single();

  if (error || !novoChamado) {
    throw new Error(`Não foi possível criar o chamado: ${error?.message}`);
  }

  await supabase.from("chamado_mensagens").insert({
    chamado_id: novoChamado.id,
    autor_usuario_id: usuarioAtual.id,
    autor_email: usuarioAtual.email,
    corpo: descricao,
    canal: "portal",
  });

  await notificarChamadoCriado(
    {
      id: novoChamado.id,
      codigo: `${projeto.codigo}-${novoChamado.numero}`,
      assunto,
      prioridade,
      projetoNome: projeto.nome,
      slaPrazoResposta: slaResposta,
    },
    usuarioAtual.email,
  );

  redirect(`/chamados/${novoChamado.id}`);
}
