import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKET_ANEXOS = "anexos-chamados";
export const TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024; // 10MB

export const TIPOS_ANEXO_PERMITIDOS = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);

/** Envia um anexo recebido pelo portal (criação de chamado ou comentário) e registra a linha em chamado_anexos. */
export async function enviarAnexoPortal(
  supabase: SupabaseClient,
  params: {
    chamadoId: string;
    mensagemId: string;
    usuarioId: string;
    arquivo: File;
  },
): Promise<void> {
  const { chamadoId, mensagemId, usuarioId, arquivo } = params;

  if (arquivo.size === 0) return;
  if (arquivo.size > TAMANHO_MAXIMO_ANEXO) {
    throw new Error(`O arquivo "${arquivo.name}" excede o limite de 10MB por anexo.`);
  }
  if (!TIPOS_ANEXO_PERMITIDOS.has(arquivo.type)) {
    throw new Error(`Tipo de arquivo não suportado: "${arquivo.name}".`);
  }

  const caminho = `${chamadoId}/${crypto.randomUUID()}-${arquivo.name}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_ANEXOS)
    .upload(caminho, arquivo, { contentType: arquivo.type });
  if (uploadError) {
    throw new Error(`Não foi possível enviar o anexo "${arquivo.name}": ${uploadError.message}`);
  }

  const { error: insertError } = await supabase.from("chamado_anexos").insert({
    chamado_id: chamadoId,
    mensagem_id: mensagemId,
    nome_arquivo: arquivo.name,
    tipo_conteudo: arquivo.type,
    tamanho_bytes: arquivo.size,
    caminho_storage: caminho,
    origem: "portal",
    enviado_por_usuario_id: usuarioId,
  });
  if (insertError) {
    throw new Error(`Não foi possível registrar o anexo "${arquivo.name}": ${insertError.message}`);
  }
}
