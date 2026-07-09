import { createAdminClient } from "@/lib/supabase/admin";
import { createResendClient } from "@/lib/resend/client";

interface InboundEmail {
  from: string;
  subject: string;
  messageId: string;
  inReplyTo: string | null;
  references: string[];
  text: string | null;
  html: string | null;
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

export function buildInboundEmail(receivedEmail: {
  from: string;
  subject: string;
  message_id: string;
  headers: Record<string, string> | null;
  text: string | null;
  html: string | null;
}): InboundEmail {
  return {
    from: receivedEmail.from,
    subject: receivedEmail.subject,
    messageId: receivedEmail.message_id,
    inReplyTo: getHeader(receivedEmail.headers, "In-Reply-To"),
    references: parseReferences(getHeader(receivedEmail.headers, "References")),
    text: receivedEmail.text,
    html: receivedEmail.html,
  };
}

const SUPPORT_EMAIL = process.env.SUPPORT_INBOUND_EMAIL || "suporte@chamados.hubtech.tec.br";

export async function processInboundEmail(email: InboundEmail) {
  const supabase = createAdminClient();
  const senderAddress = extractEmailAddress(email.from);
  const senderDomain = extractDomain(senderAddress);

  const { data: projeto } = await supabase
    .from("projetos")
    .select("id, nome, sla_resposta_minutos, sla_resolucao_minutos, dominios_email")
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
    await supabase.from("chamado_mensagens").insert({
      chamado_id: chamadoId,
      autor_email: senderAddress,
      corpo: email.text ?? email.html ?? "",
      canal: "email",
    });

    return { status: "threaded" as const, chamadoId };
  }

  const now = new Date();
  const slaResposta = projeto.sla_resposta_minutos
    ? new Date(now.getTime() + projeto.sla_resposta_minutos * 60_000).toISOString()
    : null;
  const slaResolucao = projeto.sla_resolucao_minutos
    ? new Date(now.getTime() + projeto.sla_resolucao_minutos * 60_000).toISOString()
    : null;

  const { data: novoChamado, error } = await supabase
    .from("chamados")
    .insert({
      projeto_id: projeto.id,
      email_remetente: senderAddress,
      assunto: email.subject || "(sem assunto)",
      email_thread_id: email.messageId,
      sla_prazo_resposta: slaResposta,
      sla_prazo_resolucao: slaResolucao,
    })
    .select("id")
    .single();

  if (error || !novoChamado) {
    throw new Error(`Falha ao criar chamado: ${error?.message}`);
  }

  await supabase.from("chamado_mensagens").insert({
    chamado_id: novoChamado.id,
    autor_email: senderAddress,
    corpo: email.text ?? email.html ?? "",
    canal: "email",
  });

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
