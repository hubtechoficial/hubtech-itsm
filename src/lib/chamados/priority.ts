type Prioridade = "baixa" | "media" | "alta" | "critica";

const PALAVRAS_CRITICA = [
  "fora do ar",
  "sistema parado",
  "produção parada",
  "producao parada",
  "urgentíssimo",
  "urgentissimo",
  "não consigo trabalhar",
  "nao consigo trabalhar",
];

const PALAVRAS_ALTA = ["urgente", "urgência", "urgencia", "parado", "bloqueado", "não funciona", "nao funciona"];

/** Heurística simples por palavra-chave — critério inicial até existir triagem manual (Fase 04). */
export function inferPrioridade(assunto: string, corpo: string | null): Prioridade {
  const texto = `${assunto} ${corpo ?? ""}`.toLowerCase();

  if (PALAVRAS_CRITICA.some((palavra) => texto.includes(palavra))) {
    return "critica";
  }
  if (PALAVRAS_ALTA.some((palavra) => texto.includes(palavra))) {
    return "alta";
  }
  return "media";
}
