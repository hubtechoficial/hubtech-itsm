import { createResendClient } from "@/lib/resend/client";

const SUPPORT_EMAIL = process.env.SUPPORT_INBOUND_EMAIL || "suporte@chamados.hubtech.tec.br";
const INTERNAL_TEAM_EMAIL = process.env.INTERNAL_NOTIFICATION_EMAIL;

interface ChamadoCriado {
  id: string;
  assunto: string;
  prioridade: string;
  projetoNome: string;
  slaPrazoResposta: string | null;
}

function formatarPrazo(iso: string | null): string {
  if (!iso) return "a definir";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export async function notificarChamadoCriado(chamado: ChamadoCriado, requesterEmail: string) {
  const resend = createResendClient();

  await resend.emails.send({
    from: SUPPORT_EMAIL,
    to: requesterEmail,
    subject: `Chamado recebido: ${chamado.assunto}`,
    text:
      `Recebemos seu chamado e nosso time já foi notificado.\n\n` +
      `Assunto: ${chamado.assunto}\n` +
      `Prioridade: ${chamado.prioridade}\n` +
      `Prazo de primeira resposta: ${formatarPrazo(chamado.slaPrazoResposta)}\n\n` +
      `Você receberá um e-mail a cada atualização deste chamado.`,
  });

  if (INTERNAL_TEAM_EMAIL) {
    await resend.emails.send({
      from: SUPPORT_EMAIL,
      to: INTERNAL_TEAM_EMAIL,
      subject: `[Novo chamado] ${chamado.projetoNome} — ${chamado.assunto}`,
      text:
        `Novo chamado aberto.\n\n` +
        `Projeto: ${chamado.projetoNome}\n` +
        `Assunto: ${chamado.assunto}\n` +
        `Prioridade: ${chamado.prioridade}\n` +
        `Solicitante: ${requesterEmail}\n` +
        `Prazo de primeira resposta: ${formatarPrazo(chamado.slaPrazoResposta)}\n` +
        `ID: ${chamado.id}`,
    });
  }
}
