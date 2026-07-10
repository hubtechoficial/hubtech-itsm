import { createAdminClient } from "@/lib/supabase/admin";
import { createResendClient } from "@/lib/resend/client";
import { inferPrioridade } from "@/lib/chamados/priority";
import { notificarChamadoCriado } from "@/lib/chamados/notify";
import { BUCKET_ANEXOS, TAMANHO_MAXIMO_ANEXO, TIPOS_ANEXO_PERMITIDOS } from "@/lib/chamados/anexos";

interface InboundAttachmentRef {
  id: string;
  filename: string | null;
  size: number;
  content_type: string;
}

interface InboundEmail {
  emailId: string;
  from: string;
  subject: string;
  messageId: string;
  inReplyTo: string | null;
  references: string[];
  text: string | null;
  html: string | null;
  attachments: InboundAttachmentRef[];
}

function extractEmailAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  const address = match ? match[1] : from;
  return address.trim().toLowerCase();
}

function extractDomain(email: string): string {
  return email.split("@")[1] ?? "";
}

/** headers vindos da Resend não têm capitalização garantida — busca case-insensitive. */
function getHeader(headers: Record<string, string> | null, name: string): string | null {
  if (!headers) return null;
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? headers[key] : null;
}

function parseReferences(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split(/\s+/).map((id) => id.trim()).filter(Boolean);
}

export function buildInboundEmail(
  emailId: string,
  receivedEmail: {
    from: string;
    subject: string;
    message_id: string;
    headers: Record<string, string> | null;
    text: string | null;
    html: string | null;
    attachments: InboundAttachmentRef[];
  },
): InboundEmail {
  return {
    emailId,
    from: receivedEmail.from,
    subject: receivedEmail.subject,
    messageId: receivedEmail.message_id,
    inReplyTo: getHeader(receivedEmail.headers, "In-Reply-To"),
    references: parseReferences(getHeader(receivedEmail.headers, "References")),
    text: receivedEmail.text,
    html: receivedEmail.html,
    attachments: receivedEmail.attachments ?? [],
  };
}

/** Baixa cada anexo do e-mail recebido (via URL assinada da Resend) e sobe pro Storage. */
async function processarAnexosEmail(
  supabase: ReturnType<typeof createAdminClient>,
  email: InboundEmail,
  chamadoId: string,
  mensagemId: string,
) {
  if (email.attachments.length === 0) return;

  const resend = createResendClient();

  for (const attachment of email.attachments) {
    if (attachment.size > TAMANHO_MAXIMO_ANEXO || !TIPOS_ANEXO_PERMITIDOS.has(attachment.content_type)) {
      continue;
    }

    const { data: attachmentData, error: attachmentError } = await resend.emails.receiving.attachments.get({
      emailId: email.emailId,
      id: attachment.id,
    });
    if (attachmentError || !attachmentData) continue;

    const response = await fetch(attachmentData.download_url);
    if (!response.ok) continue;
    const buffer = Buffer.from(await response.arrayBuffer());

    const nomeArquivo = attachment.filename || `anexo-${attachment.id}`;
    const caminho = `${chamadoId}/${crypto.randomUUID()}-${nomeArquivo}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_ANEXOS)
      .upload(caminho, buffer, { contentType: attachment.content_type });
    if (uploadError) continue;

    await supabase.from("chamado_anexos").insert({
      chamado_id: chamadoId,
      mensagem_id: mensagemId,
      nome_arquivo: nomeArquivo,
      tipo_conteudo: attachment.content_type,
      tamanho_bytes: attachment.size,
      caminho_storage: caminho,
      origem: "email",
    });
  }
}

const SUPPORT_EMAIL = process.env.SUPPORT_INBOUND_EMAIL || "suporte@chamados.hubtech.tec.br";

export async function processInboundEmail(email: InboundEmail) {
  const supabase = createAdminClient();
  const senderAddress = extractEmailAddress(email.from);
  const senderDomain = extractDomain(senderAddress);

  const { data: projeto } = await supabase
    .from("projetos")
    .select("id, nome, codigo, sla_resposta_minutos, sla_resolucao_minutos, dominios_email")
    .contains("dominios_email", [senderDomain])
    .maybeSingle();

  if (!projeto) {
    await rejectUnauthorizedDomain(email, senderAddress);
    return { status: "rejected" as const, reason: "domain_not_authorized" };
  }

  const threadCandidates = [email.inReplyTo, ...email.references].filter(
    (id): id is string => Boolean(id),
  );

  let chamadoId: string | null = null;

  if (threadCandidates.length > 0) {
    const { data: chamadoExistente } = await supabase
      .from("chamados")
      .select("id")
      .eq("projeto_id", projeto.id)
      .in("email_thread_id", threadCandidates)
      .maybeSingle();

    chamadoId = chamadoExistente?.id ?? null;
  }

  if (chamadoId) {
    const { data: mensagem, error: mensagemError } = await supabase
      .from("chamado_mensagens")
      .insert({
        chamado_id: chamadoId,
        autor_email: senderAddress,
        corpo: email.text ?? email.html ?? "",
        canal: "email",
      })
      .select("id")
      .single();
    if (mensagemError || !mensagem) {
      throw new Error(`Falha ao registrar mensagem: ${mensagemError?.message}`);
    }

    await processarAnexosEmail(supabase, email, chamadoId, mensagem.id);

    return { status: "threaded" as const, chamadoId };
  }

  const now = new Date();
  const slaResposta = projeto.sla_resposta_minutos
    ? new Date(now.getTime() + projeto.sla_resposta_minutos * 60_000).toISOString()
    : null;
  const slaResolucao = projeto.sla_resolucao_minutos
    ? new Date(now.getTime() + projeto.sla_resolucao_minutos * 60_000).toISOString()
    : null;

  const prioridade = inferPrioridade(email.subject, email.text ?? email.html);

  const { data: novoChamado, error } = await supabase
    .from("chamados")
    .insert({
      projeto_id: projeto.id,
      email_remetente: senderAddress,
      assunto: email.subject || "(sem assunto)",
      email_thread_id: email.messageId,
      prioridade,
      sla_prazo_resposta: slaResposta,
      sla_prazo_resolucao: slaResolucao,
    })
    .select("id, numero")
    .single();

  if (error || !novoChamado) {
    throw new Error(`Falha ao criar chamado: ${error?.message}`);
  }

  const { data: novaMensagem, error: mensagemError } = await supabase
    .from("chamado_mensagens")
    .insert({
      chamado_id: novoChamado.id,
      autor_email: senderAddress,
      corpo: email.text ?? email.html ?? "",
      canal: "email",
    })
    .select("id")
    .single();
  if (mensagemError || !novaMensagem) {
    throw new Error(`Falha ao registrar mensagem: ${mensagemError?.message}`);
  }

  await processarAnexosEmail(supabase, email, novoChamado.id, novaMensagem.id);

  await notificarChamadoCriado(
    {
      id: novoChamado.id,
      codigo: `${projeto.codigo}-${novoChamado.numero}`,
      assunto: email.subject || "(sem assunto)",
      prioridade,
      projetoNome: projeto.nome,
      slaPrazoResposta: slaResposta,
    },
    senderAddress,
  );

  return { status: "created" as const, chamadoId: novoChamado.id, projeto: projeto.nome };
}

async function rejectUnauthorizedDomain(email: InboundEmail, senderAddress: string) {
  const resend = createResendClient();

  await resend.emails.send({
    from: SUPPORT_EMAIL,
    to: senderAddress,
    subject: `Re: ${email.subject}`,
    headers: { "In-Reply-To": email.messageId, References: email.messageId },
    text:
      "Não foi possível abrir seu chamado: este e-mail precisa ser enviado do endereço institucional " +
      "cadastrado no seu contrato de suporte com a Hub Tech. Por favor, envie novamente a partir do seu " +
      "e-mail institucional ou entre em contato com o administrador do sistema.",
  });
}
