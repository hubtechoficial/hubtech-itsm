import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    .select("id, assunto, status, prioridade, sla_prazo_resposta, created_at")
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
                  <th className="px-4 py-3">Aberto em</th>
                </tr>
              </thead>
              <tbody>
                {chamados.map((chamado) => (
                  <tr key={chamado.id} className="border-t border-white/10 bg-surface/40">
                    <td className="px-4 py-3">{chamado.assunto}</td>
                    <td className="px-4 py-3 capitalize">{chamado.status}</td>
                    <td className="px-4 py-3 capitalize">{chamado.prioridade}</td>
                    <td className="px-4 py-3 text-gray-medium">
                      {new Date(chamado.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
