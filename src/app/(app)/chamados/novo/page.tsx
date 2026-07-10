import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, getProjetosTecnico } from "@/lib/usuarios/current";
import { criarChamadoPortal } from "./actions";

const TIPOS_ITEM = [
  { valor: "incidente", rotulo: "Incidente (algo parou de funcionar)" },
  { valor: "solicitacao", rotulo: "Solicitação de Serviço (um pedido)" },
  { valor: "duvida", rotulo: "Dúvida" },
];

export default async function NovoChamadoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const usuarioAtual = await getUsuarioAtual();
  const precisaEscolherProjeto = usuarioAtual?.perfil === "tecnico" || usuarioAtual?.perfil === "admin";

  let projetosParaEscolher: { id: string; nome: string }[] = [];
  let projetoFixoNome: string | null = null;

  if (usuarioAtual?.perfil === "tecnico") {
    projetosParaEscolher = await getProjetosTecnico();
  } else if (usuarioAtual?.perfil === "admin") {
    const { data } = await supabase.from("projetos").select("id, nome").order("nome");
    projetosParaEscolher = data ?? [];
  } else if (usuarioAtual?.projetoId) {
    const { data } = await supabase
      .from("projetos")
      .select("nome")
      .eq("id", usuarioAtual.projetoId)
      .maybeSingle();
    projetoFixoNome = data?.nome ?? null;
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link href="/chamados" className="text-sm text-gray-medium hover:text-white">
          ← Voltar
        </Link>

        <h1 className="mt-4 mb-6 text-2xl font-bold">Novo Chamado</h1>

        <form action={criarChamadoPortal} className="flex flex-col gap-4">
          {precisaEscolherProjeto ? (
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
                {projetosParaEscolher.map((projeto) => (
                  <option key={projeto.id} value={projeto.id}>
                    {projeto.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
                Projeto
              </span>
              <p className="text-sm text-white">{projetoFixoNome ?? "—"}</p>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label htmlFor="tipo_item" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
              Tipo
            </label>
            <select
              id="tipo_item"
              name="tipo_item"
              required
              className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {TIPOS_ITEM.map((tipo) => (
                <option key={tipo.valor} value={tipo.valor}>
                  {tipo.rotulo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="assunto" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
              Assunto
            </label>
            <input
              id="assunto"
              name="assunto"
              required
              className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="descricao"
              className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium"
            >
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              required
              rows={6}
              className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="anexos" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
              Anexos (opcional)
            </label>
            <input
              id="anexos"
              name="anexos"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,.doc,.docx,.xlsx,.zip"
              className="text-sm text-gray-medium file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm file:text-white"
            />
            <p className="text-xs text-gray-medium">Máximo 10MB por arquivo.</p>
          </div>

          <button
            type="submit"
            className="self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark"
          >
            Abrir Chamado
          </button>
        </form>
      </div>
    </main>
  );
}
