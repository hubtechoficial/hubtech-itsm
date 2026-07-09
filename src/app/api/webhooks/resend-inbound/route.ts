import { NextRequest, NextResponse } from "next/server";
import { createResendClient } from "@/lib/resend/client";
import { buildInboundEmail, processInboundEmail } from "@/lib/chamados/ingest";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const resend = createResendClient();

  let event;
  try {
    event = resend.webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET!,
    });
  } catch {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 400 });
  }

  if (event.type !== "email.received") {
    return NextResponse.json({ ignored: event.type });
  }

  const { data: receivedEmail, error } = await resend.emails.receiving.get(event.data.email_id);

  if (error || !receivedEmail) {
    return NextResponse.json({ error: "falha ao buscar conteúdo do e-mail" }, { status: 502 });
  }

  const inboundEmail = buildInboundEmail(receivedEmail);
  const resultado = await processInboundEmail(inboundEmail);

  return NextResponse.json(resultado);
}
