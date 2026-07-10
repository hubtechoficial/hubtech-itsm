import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual, getProjetosTecnico } from "@/lib/usuarios/current";
import { getSlaStatus, SLA_STATUS_LABEL, SLA_STATUS_COLOR_CLASS } from "@/lib/chamados/sla";

const PRIORIDADE_COLOR_CLASS: Record<string, string> = {
  baixa: "bg-neutral/15 text-neutral",
  media: "bg-primary/15 text-primary",
  alta: "bg-warning/15 text-warning",
  critica: "bg-critical/15 text-critical",
};

const TITULO_POR_PERFIL: Record<string, string> = {
  basico: "Meus chamados",
  supervisor: "Chamados do meu setor",
  tecnico: "Fila de atendimento",
  admin: "Todos os chamados",
};

type Filtro = "meus" | "nao-atribuidos" | "todos";

export default async function ChamadosPage({
  searchParams,
}: {
  searchParams: Promise<{ projeto?: string; filtro?: string }>;
}) {
  const { projeto: projetoParam, filtro: filtroParam } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const usuarioAtual = await getUsuarioAtual();
  const ehTecnico = usuarioAtual?.perfil === "tecnico";
  const ehAdminOuTecnico = usuarioAtual?.perfil === "admin" || ehTecnico;

  const projetosTecnico = ehTecnico ? await getProjetosTecnico() : [];
  const projetoSelecionado =
    projetoParam && projetosTecnico.some((p) => p.id === projetoParam)
      ? projetoParam
      : (projetosTecnico[0]?.id ?? null);

  const filtro: Filtro =
    filtroParam === "meus" || filtroParam === "nao-atribuidos" ? filtroParam : "todos";

  let query = supabase
    .from("chamados")
    .select(
      "id, numero, assunto, status, prioridade, sla_prazo_resolucao, resolvido_em, created_at, atribuido_a_usuario_id, atribuido:atribuido_a_usuario_id(nome), projetos(codigo)",
    );

  if (ehTecnico && projetoSelecionado) {
    query = query.eq("projeto_id", projetoSelecionado);
  }
  if (ehTecnico && filtro === "meus") {
    query = query.eq("atribuido_a_usuario_id", user.id);
  }
  if (ehTecnico && filtro === "nao-atribuidos") {
    query = query.is("atribuido_a_usuario_id", null);
  }

  query = ehAdminOuTecnico
    ? query.order("prioridade", { ascending: false }).order("created_at", { ascending: true })
    : query.order("created_at", { ascending: false });

  const { data: chamados } = await query;

  const titulo = TITULO_POR_PERFIL[usuarioAtual?.perfil ?? "basico"];

  function nomeDoResponsavel(chamado: { atribuido: unknown }): string {
    const atribuido = chamado.atribuido as { nome: string } | { nome: string }[] | null;
    if (!atribuido) return "— não atribuído —";
    return Array.isArray(atribuido) ? (atribuido[0]?.nome ?? "— não atribuído —") : atribuido.nome;
  }

  function codigoDoChamado(chamado: { numero: number; projetos: unknown }): string {
    const projeto = chamado.projetos as { codigo: string } | { codigo: string }[] | null;
    const codigo = Array.isArray(projeto) ? projeto[0]?.codigo : projeto?.codigo;
    return codigo ? `${codigo}-${chamado.numero}` : String(chamado.numero);
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{titulo}</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/chamados/novo"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-semibold hover:bg-primary-dark"
            >
              + Novo Chamado
            </Link>
            {usuarioAtual?.perfil === "admin" && (
              <Link href="/admin" className="text-sm text-primary hover:underline">
                Administração
              </Link>
            )}
          </div>
        </div>

        {ehTecnico && projetosTecnico.length > 1 && (
          <form className="mb-4 flex items-center gap-2" action="/chamados">
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
            <input type="hidden" name="filtro" value={filtro} />
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold hover:bg-primary-dark"
            >
              Trocar
            </button>
          </form>
        )}

        {ehTecnico && (
          <div className="mb-6 flex gap-2 text-sm">
            {(
              [
                { valor: "todos", rotulo: "Todos do Projeto" },
                { valor: "meus", rotulo: "Meus chamados" },
                { valor: "nao-atribuidos", rotulo: "Não atribuídos" },
              ] as const
            ).map((opcao) => (
              <Link
                key={opcao.valor}
                href={`/chamados?projeto=${projetoSelecionado ?? ""}&filtro=${opcao.valor}`}
                className={`rounded-lg px-3 py-1.5 ${
                  filtro === opcao.valor
                    ? "bg-primary text-white"
                    : "bg-surface text-gray-medium hover:text-white"
                }`}
              >
                {opcao.rotulo}
              </Link>
            ))}
          </div>
        )}

        {!chamados || chamados.length === 0 ? (
          <p className="text-sm text-gray-medium">Nenhum chamado encontrado.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface text-xs uppercase tracking-[2.5px] text-gray-medium">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Assunto</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Prioridade</th>
                    <th className="px-4 py-3">SLA</th>
                    {ehAdminOuTecnico && <th className="px-4 py-3">Responsável</th>}
                    <th className="px-4 py-3">Aberto em</th>
                  </tr>
                </thead>
                <tbody>
                  {chamados.map((chamado) => {
                    const slaStatus = getSlaStatus(chamado);
                    return (
                      <tr
                        key={chamado.id}
                        className="cursor-pointer border-t border-white/10 bg-surface/40 hover:bg-surface"
                      >
                        <td className="px-4 py-3">
                          <Link href={`/chamados/${chamado.id}`} className="block font-mono text-xs text-gray-medium">
                            {codigoDoChamado(chamado)}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/chamados/${chamado.id}`} className="block">
                            {chamado.assunto}
                          </Link>
                        </td>
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
                        {ehAdminOuTecnico && (
                          <td className="px-4 py-3 text-gray-medium">{nomeDoResponsavel(chamado)}</td>
                        )}
                        <td className="px-4 py-3 text-gray-medium">
                          {new Date(chamado.created_at).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
