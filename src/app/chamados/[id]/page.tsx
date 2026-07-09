import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/usuarios/current";
import { getSlaStatus, SLA_STATUS_LABEL, SLA_STATUS_COLOR_CLASS } from "@/lib/chamados/sla";
import { adicionarComentario, vincularArtigo } from "./actions";

export default async function ChamadoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: chamado }, { data: mensagens }, usuarioAtual] = await Promise.all([
    supabase
      .from("chamados")
      .select(
        "id, assunto, status, prioridade, sla_prazo_resolucao, resolvido_em, created_at, projetos(nome)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("chamado_mensagens")
      .select("id, autor_email, canal, corpo, created_at")
      .eq("chamado_id", id)
      .order("created_at", { ascending: true }),
    getUsuarioAtual(),
  ]);

  if (!chamado) {
    notFound();
  }

  const slaStatus = getSlaStatus(chamado);
  const podeComentar = usuarioAtual?.perfil === "admin" || usuarioAtual?.perfil === "supervisor";
  const ehAdmin = usuarioAtual?.perfil === "admin";

  type ArtigoRef = { titulo: string } | { titulo: string }[] | null;
  let artigosDisponiveis: { id: string; titulo: string }[] = [];
  let artigosVinculados: { id: string; artigos: ArtigoRef }[] = [];

  if (ehAdmin) {
    const [{ data: artigos }, { data: vinculados }] = await Promise.all([
      supabase.from("artigos_conhecimento").select("id, titulo").order("titulo"),
      supabase
        .from("chamado_artigos_consultados")
        .select("id, artigos:artigo_id(titulo)")
        .eq("chamado_id", id),
    ]);
    artigosDisponiveis = artigos ?? [];
    artigosVinculados = (vinculados ?? []) as unknown as typeof artigosVinculados;
  }

  function tituloDoArtigo(artigos: ArtigoRef): string {
    if (!artigos) return "";
    return Array.isArray(artigos) ? (artigos[0]?.titulo ?? "") : artigos.titulo;
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/chamados" className="text-sm text-gray-medium hover:text-white">
          ← Voltar
        </Link>

        <h1 className="mt-4 mb-2 text-2xl font-bold">{chamado.assunto}</h1>

        <div className="mb-8 flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg bg-surface px-2 py-1 capitalize text-gray-medium">
            {chamado.status}
          </span>
          <span className="rounded-lg bg-surface px-2 py-1 capitalize text-gray-medium">
            Prioridade: {chamado.prioridade}
          </span>
          <span className={`rounded-lg px-2 py-1 font-semibold uppercase ${SLA_STATUS_COLOR_CLASS[slaStatus]}`}>
            {SLA_STATUS_LABEL[slaStatus]}
          </span>
        </div>

        <div className="flex flex-col gap-4">
          {mensagens?.map((mensagem) => (
            <div key={mensagem.id} className="rounded-lg border border-white/10 bg-surface/40 p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-gray-medium">
                <span>{mensagem.autor_email}</span>
                <span>{new Date(mensagem.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{mensagem.corpo}</p>
            </div>
          ))}
        </div>

        {podeComentar && (
          <form action={adicionarComentario.bind(null, id)} className="mt-8 flex flex-col gap-3">
            <label htmlFor="corpo" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
              Adicionar comentário
            </label>
            <textarea
              id="corpo"
              name="corpo"
              required
              rows={4}
              className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark"
            >
              Enviar comentário
            </button>
          </form>
        )}

        {ehAdmin && (
          <div className="mt-10 border-t border-white/10 pt-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[2.5px] text-gray-medium">
              Artigos consultados
            </h2>

            {artigosVinculados.length > 0 && (
              <ul className="mb-4 flex flex-col gap-1 text-sm">
                {artigosVinculados.map((vinculo) => (
                  <li key={vinculo.id} className="text-gray-medium">
                    • {tituloDoArtigo(vinculo.artigos)}
                  </li>
                ))}
              </ul>
            )}

            <form action={vincularArtigo.bind(null, id)} className="flex gap-2">
              <select
                name="artigo_id"
                required
                className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Selecione um artigo...</option>
                {artigosDisponiveis.map((artigo) => (
                  <option key={artigo.id} value={artigo.id}>
                    {artigo.titulo}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark"
              >
                Vincular
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
