import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, getProjetosTecnico } from "@/lib/usuarios/current";
import { getSlaStatus, SLA_STATUS_LABEL, type SlaStatus } from "@/lib/chamados/sla";

const TITULO_POR_PERFIL: Record<string, string> = {
  basico: "Meus chamados",
  supervisor: "Chamados do meu setor",
  tecnico: "Fila do Projeto selecionado",
  admin: "Visão geral de todos os Projetos",
};

const STATUS_LABEL: Record<string, string> = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

const STATUS_CARD_CLASS: Record<string, string> = {
  aberto: "border-primary/30 bg-primary/10 text-primary",
  em_andamento: "border-warning/30 bg-warning/10 text-warning",
  resolvido: "border-success/30 bg-success/10 text-success",
  fechado: "border-neutral/30 bg-neutral/10 text-neutral",
};

const SLA_CARD_CLASS: Record<SlaStatus, string> = {
  sem_sla: "border-neutral/30 bg-neutral/10 text-neutral",
  dentro_prazo: "border-success/30 bg-success/10 text-success",
  atencao: "border-warning/30 bg-warning/10 text-warning",
  estourado: "border-critical/30 bg-critical/10 text-critical",
  resolvido: "border-success/30 bg-success/10 text-success",
};

function Cartao({ rotulo, valor, className }: { rotulo: string; valor: number; className: string }) {
  return (
    <div className={`rounded-lg border px-5 py-4 ${className}`}>
      <p className="text-3xl font-bold">{valor}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[2.5px] opacity-80">{rotulo}</p>
    </div>
  );
}

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ projeto?: string }>;
}) {
  const { projeto: projetoParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const usuarioAtual = await getUsuarioAtual();
  const ehTecnico = usuarioAtual?.perfil === "tecnico";

  const projetosTecnico = ehTecnico ? await getProjetosTecnico() : [];
  const projetoSelecionado =
    projetoParam && projetosTecnico.some((p) => p.id === projetoParam)
      ? projetoParam
      : (projetosTecnico[0]?.id ?? null);

  let query = supabase.from("chamados").select("status, created_at, sla_prazo_resolucao, resolvido_em");

  if (ehTecnico && projetoSelecionado) {
    query = query.eq("projeto_id", projetoSelecionado);
  }

  const { data: chamados } = await query;
  const lista = chamados ?? [];

  const statusCounts: Record<string, number> = { aberto: 0, em_andamento: 0, resolvido: 0, fechado: 0 };
  const slaCounts: Record<SlaStatus, number> = {
    sem_sla: 0,
    dentro_prazo: 0,
    atencao: 0,
    estourado: 0,
    resolvido: 0,
  };

  for (const chamado of lista) {
    statusCounts[chamado.status] = (statusCounts[chamado.status] ?? 0) + 1;
    const slaStatus = getSlaStatus(chamado);
    slaCounts[slaStatus] += 1;
  }

  const titulo = TITULO_POR_PERFIL[usuarioAtual?.perfil ?? "basico"];

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Painel</h1>
          <p className="text-sm text-gray-medium">{titulo}</p>
        </div>

        {ehTecnico && projetosTecnico.length > 1 && (
          <form className="mb-6 flex items-center gap-2" action="/painel">
            <label className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
              Projeto
            </label>
            <select
              name="projeto"
              defaultValue={projetoSelecionado ?? ""}
              className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {projetosTecnico.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold hover:bg-primary-dark"
            >
              Trocar
            </button>
          </form>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[2.5px] text-gray-medium">
            Por status
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Object.entries(statusCounts).map(([status, valor]) => (
              <Cartao
                key={status}
                rotulo={STATUS_LABEL[status]}
                valor={valor}
                className={STATUS_CARD_CLASS[status]}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[2.5px] text-gray-medium">
            Por SLA
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(Object.keys(SLA_STATUS_LABEL) as SlaStatus[]).map((slaStatus) => (
              <Cartao
                key={slaStatus}
                rotulo={SLA_STATUS_LABEL[slaStatus]}
                valor={slaCounts[slaStatus]}
                className={SLA_CARD_CLASS[slaStatus]}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
