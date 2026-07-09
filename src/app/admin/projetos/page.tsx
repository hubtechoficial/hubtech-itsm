import { createClient } from "@/lib/supabase/server";
import { criarProjeto } from "./actions";

export default async function AdminProjetosPage() {
  const supabase = await createClient();
  const { data: projetos } = await supabase
    .from("projetos")
    .select("id, nome, dominios_email, sla_resposta_minutos, sla_resolucao_minutos")
    .order("nome");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Projetos</h1>

      <div className="mb-8 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-[2.5px] text-gray-medium">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Domínios</th>
              <th className="px-4 py-3">SLA Resposta</th>
              <th className="px-4 py-3">SLA Resolução</th>
            </tr>
          </thead>
          <tbody>
            {projetos?.map((projeto) => (
              <tr key={projeto.id} className="border-t border-white/10 bg-surface/40">
                <td className="px-4 py-3">{projeto.nome}</td>
                <td className="px-4 py-3 text-gray-medium">{projeto.dominios_email.join(", ")}</td>
                <td className="px-4 py-3 text-gray-medium">
                  {projeto.sla_resposta_minutos ? `${projeto.sla_resposta_minutos} min` : "a definir"}
                </td>
                <td className="px-4 py-3 text-gray-medium">
                  {projeto.sla_resolucao_minutos ? `${projeto.sla_resolucao_minutos} min` : "a definir"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Novo Projeto</h2>
      <form action={criarProjeto} className="flex max-w-md flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="nome" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
            Nome
          </label>
          <input
            id="nome"
            name="nome"
            required
            className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="dominios_email"
            className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium"
          >
            Domínios de e-mail (separados por vírgula)
          </label>
          <input
            id="dominios_email"
            name="dominios_email"
            required
            placeholder="exemplo.org.br, outroexemplo.org.br"
            className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-1">
            <label
              htmlFor="sla_resposta_minutos"
              className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium"
            >
              SLA resposta (min)
            </label>
            <input
              id="sla_resposta_minutos"
              name="sla_resposta_minutos"
              type="number"
              min={1}
              className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <label
              htmlFor="sla_resolucao_minutos"
              className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium"
            >
              SLA resolução (min)
            </label>
            <input
              id="sla_resolucao_minutos"
              name="sla_resolucao_minutos"
              type="number"
              min={1}
              className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          className="self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark"
        >
          Criar Projeto
        </button>
      </form>
    </div>
  );
}
