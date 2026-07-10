import { createClient } from "@/lib/supabase/server";
import { criarProjeto, atualizarProjeto } from "./actions";

export default async function AdminProjetosPage() {
  const supabase = await createClient();
  const { data: projetos } = await supabase
    .from("projetos")
    .select("id, nome, codigo, dominios_email, sla_resposta_minutos, sla_resolucao_minutos")
    .order("nome");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Projetos</h1>

      <div className="mb-8 flex flex-col gap-4">
        {projetos?.map((projeto) => (
          <form
            key={projeto.id}
            action={atualizarProjeto.bind(null, projeto.id)}
            className="rounded-lg border border-white/10 bg-surface/40 p-4"
          >
            <h3 className="mb-3 font-semibold">
              {projeto.nome} <span className="font-mono text-xs text-gray-medium">{projeto.codigo}</span>
            </h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex flex-1 min-w-[200px] flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
                  Domínios (vírgula)
                </label>
                <input
                  name="dominios_email"
                  defaultValue={projeto.dominios_email.join(", ")}
                  required
                  className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
                  SLA resposta (min)
                </label>
                <input
                  name="sla_resposta_minutos"
                  type="number"
                  min={1}
                  defaultValue={projeto.sla_resposta_minutos ?? ""}
                  placeholder="a definir"
                  className="w-32 rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
                  SLA resolução (min)
                </label>
                <input
                  name="sla_resolucao_minutos"
                  type="number"
                  min={1}
                  defaultValue={projeto.sla_resolucao_minutos ?? ""}
                  placeholder="a definir"
                  className="w-32 rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark"
                >
                  Salvar
                </button>
              </div>
            </div>
          </form>
        ))}
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
          <label htmlFor="codigo" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
            Código curto (ex: CUR, SEM — usado como CUR-1, CUR-2...)
          </label>
          <input
            id="codigo"
            name="codigo"
            required
            maxLength={6}
            placeholder="CUR"
            className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm uppercase outline-none focus:border-primary"
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
