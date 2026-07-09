export type SlaStatus = "sem_sla" | "resolvido" | "dentro_prazo" | "atencao" | "estourado";

interface ChamadoSla {
  created_at: string;
  sla_prazo_resolucao: string | null;
  resolvido_em: string | null;
}

/** Limite (fração do prazo decorrida) a partir do qual o chamado entra em estado de "atenção". */
const LIMIAR_ATENCAO = 0.7;

export function getSlaStatus(chamado: ChamadoSla, agora: Date = new Date()): SlaStatus {
  if (chamado.resolvido_em) {
    return "resolvido";
  }
  if (!chamado.sla_prazo_resolucao) {
    return "sem_sla";
  }

  const inicio = new Date(chamado.created_at).getTime();
  const prazo = new Date(chamado.sla_prazo_resolucao).getTime();
  const agoraMs = agora.getTime();

  if (agoraMs >= prazo) {
    return "estourado";
  }

  const fracaoDecorrida = (agoraMs - inicio) / (prazo - inicio);
  if (fracaoDecorrida >= LIMIAR_ATENCAO) {
    return "atencao";
  }
  return "dentro_prazo";
}

export const SLA_STATUS_LABEL: Record<SlaStatus, string> = {
  sem_sla: "SLA a definir",
  resolvido: "Resolvido",
  dentro_prazo: "Dentro do prazo",
  atencao: "Atenção",
  estourado: "Estourado",
};

export const SLA_STATUS_COLOR_CLASS: Record<SlaStatus, string> = {
  sem_sla: "bg-neutral/15 text-neutral",
  resolvido: "bg-success/15 text-success",
  dentro_prazo: "bg-success/15 text-success",
  atencao: "bg-warning/15 text-warning",
  estourado: "bg-critical/15 text-critical",
};
