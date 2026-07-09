import { createClient } from "@/lib/supabase/server";
import { criarGrupo } from "./actions";

export default async function AdminGruposPage() {
  const supabase = await createClient();
  const [{ data: grupos }, { data: projetos }] = await Promise.all([
    supabase.from("grupos").select("id, nome, projetos(nome)").order("nome"),
    supabase.from("projetos").select("id, nome").order("nome"),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Grupos</h1>

      <div className="mb-8 overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-xs uppercase tracking-[2.5px] text-gray-medium">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Projeto</th>
              </tr>
            </thead>
            <tbody>
              {grupos?.map((grupo) => (
                <tr key={grupo.id} className="border-t border-white/10 bg-surface/40">
                  <td className="px-4 py-3">{grupo.nome}</td>
                  <td className="px-4 py-3 text-gray-medium">
                    {(grupo.projetos as unknown as { nome: string } | null)?.nome}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Novo Grupo</h2>
      <form action={criarGrupo} className="flex max-w-md flex-col gap-4">
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
            htmlFor="projeto_id"
            className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium"
          >
            Projeto
          </label>
          <select
            id="projeto_id"
            name="projeto_id"
            required
            className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">Selecione...</option>
            {projetos?.map((projeto) => (
              <option key={projeto.id} value={projeto.id}>
                {projeto.nome}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark"
        >
          Criar Grupo
        </button>
      </form>
    </div>
  );
}
