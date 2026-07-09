import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSlaStatus, SLA_STATUS_LABEL, SLA_STATUS_COLOR_CLASS } from "@/lib/chamados/sla";

const PRIORIDADE_COLOR_CLASS: Record<string, string> = {
  baixa: "bg-neutral/15 text-neutral",
  media: "bg-primary/15 text-primary",
  alta: "bg-warning/15 text-warning",
  critica: "bg-critical/15 text-critical",
};

export default async function ChamadosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: chamados } = await supabase
    .from("chamados")
    .select("id, assunto, status, prioridade, sla_prazo_resolucao, resolvido_em, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold">Meus chamados</h1>

        {!chamados || chamados.length === 0 ? (
          <p className="text-sm text-gray-medium">Nenhum chamado encontrado.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface text-xs uppercase tracking-[2.5px] text-gray-medium">
                <tr>
                  <th className="px-4 py-3">Assunto</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Prioridade</th>
                  <th className="px-4 py-3">SLA</th>
                  <th className="px-4 py-3">Aberto em</th>
                </tr>
              </thead>
              <tbody>
                {chamados.map((chamado) => {
                  const slaStatus = getSlaStatus(chamado);
                  return (
                    <tr key={chamado.id} className="border-t border-white/10 bg-surface/40">
                      <td className="px-4 py-3">{chamado.assunto}</td>
                      <td className="px-4 py-3 capitalize">{chamado.status}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wide ${PRIORIDADE_COLOR_CLASS[chamado.prioridade] ?? ""}`}
                        >
                          {chamado.prioridade}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-semibold uppercase tracking-wide ${SLA_STATUS_COLOR_CLASS[slaStatus]}`}
                        >
                          {SLA_STATUS_LABEL[slaStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-medium">
                        {new Date(chamado.created_at).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
