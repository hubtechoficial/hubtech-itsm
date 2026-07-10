import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUsuarioAtual } from "@/lib/usuarios/current";
import { getSlaStatus, SLA_STATUS_LABEL, SLA_STATUS_COLOR_CLASS } from "@/lib/chamados/sla";
import { BUCKET_ANEXOS } from "@/lib/chamados/anexos";
import { adicionarComentario, vincularArtigo, pegarChamado, devolverAFila } from "./actions";

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function ChamadoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: chamado }, { data: mensagens }, { data: anexosBrutos }, usuarioAtual] = await Promise.all([
    supabase
      .from("chamados")
      .select(
        "id, numero, assunto, status, prioridade, tipo_item, sla_prazo_resolucao, resolvido_em, created_at, atribuido_a_usuario_id, projetos(nome, codigo), atribuido:atribuido_a_usuario_id(nome)",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("chamado_mensagens")
      .select("id, autor_email, canal, corpo, created_at")
      .eq("chamado_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("chamado_anexos")
      .select("id, mensagem_id, nome_arquivo, tamanho_bytes, caminho_storage")
      .eq("chamado_id", id),
    getUsuarioAtual(),
  ]);

  if (!chamado) {
    notFound();
  }

  const anexosPorMensagem = new Map<string, { id: string; nomeArquivo: string; tamanhoBytes: number; url: string | null }[]>();
  for (const anexo of anexosBrutos ?? []) {
    if (!anexo.mensagem_id) continue;
    const { data: assinado } = await supabase.storage
      .from(BUCKET_ANEXOS)
      .createSignedUrl(anexo.caminho_storage, 300);
    const lista = anexosPorMensagem.get(anexo.mensagem_id) ?? [];
    lista.push({
      id: anexo.id,
      nomeArquivo: anexo.nome_arquivo,
      tamanhoBytes: anexo.tamanho_bytes,
      url: assinado?.signedUrl ?? null,
    });
    anexosPorMensagem.set(anexo.mensagem_id, lista);
  }

  const slaStatus = getSlaStatus(chamado);
  const ehAdmin = usuarioAtual?.perfil === "admin";
  const ehTecnico = usuarioAtual?.perfil === "tecnico";
  const podeComentar = ehAdmin || ehTecnico || usuarioAtual?.perfil === "supervisor";
  const podeAtender = ehAdmin || ehTecnico;

  type PessoaRef = { nome: string } | { nome: string }[] | null;
  function nomeDe(pessoa: PessoaRef): string | null {
    if (!pessoa) return null;
    return Array.isArray(pessoa) ? (pessoa[0]?.nome ?? null) : pessoa.nome;
  }
  const nomeResponsavel = nomeDe(chamado.atribuido as PessoaRef);
  const chamadoENosso = chamado.atribuido_a_usuario_id === user.id;

  type ProjetoRef = { nome: string; codigo: string } | { nome: string; codigo: string }[] | null;
  const projetoInfo = chamado.projetos as ProjetoRef;
  const projeto = Array.isArray(projetoInfo) ? projetoInfo[0] : projetoInfo;
  const codigoChamado = projeto ? `${projeto.codigo}-${chamado.numero}` : String(chamado.numero);

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

        <p className="mt-4 font-mono text-xs text-gray-medium">{codigoChamado}</p>
        <h1 className="mb-2 text-2xl font-bold">{chamado.assunto}</h1>

        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-lg bg-surface px-2 py-1 capitalize text-gray-medium">
            {chamado.status}
          </span>
          <span className="rounded-lg bg-surface px-2 py-1 capitalize text-gray-medium">
            {chamado.tipo_item}
          </span>
          <span className="rounded-lg bg-surface px-2 py-1 capitalize text-gray-medium">
            Prioridade: {chamado.prioridade}
          </span>
          <span className={`rounded-lg px-2 py-1 font-semibold uppercase ${SLA_STATUS_COLOR_CLASS[slaStatus]}`}>
            {SLA_STATUS_LABEL[slaStatus]}
          </span>
        </div>

        {podeAtender && (
          <div className="mb-8 flex items-center gap-3 rounded-lg border border-white/10 bg-surface/40 p-4 text-sm">
            <span className="text-gray-medium">
              Responsável: <span className="text-white">{nomeResponsavel ?? "— não atribuído —"}</span>
            </span>
            {!chamado.atribuido_a_usuario_id && (
              <form action={pegarChamado.bind(null, id)}>
                <button
                  type="submit"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold hover:bg-primary-dark"
                >
                  Pegar chamado
                </button>
              </form>
            )}
            {chamadoENosso && (
              <form action={devolverAFila.bind(null, id)}>
                <button
                  type="submit"
                  className="rounded-md bg-surface px-3 py-1.5 text-xs font-semibold text-gray-medium hover:text-white"
                >
                  Devolver à fila
                </button>
              </form>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {mensagens?.map((mensagem) => (
            <div key={mensagem.id} className="rounded-lg border border-white/10 bg-surface/40 p-4">
              <div className="mb-2 flex items-center justify-between text-xs text-gray-medium">
                <span>{mensagem.autor_email}</span>
                <span>{new Date(mensagem.created_at).toLocaleString("pt-BR")}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{mensagem.corpo}</p>
              {(anexosPorMensagem.get(mensagem.id)?.length ?? 0) > 0 && (
                <ul className="mt-3 flex flex-col gap-1 border-t border-white/10 pt-3">
                  {anexosPorMensagem.get(mensagem.id)!.map((anexo) => (
                    <li key={anexo.id} className="text-xs">
                      {anexo.url ? (
                        <a
                          href={anexo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          📎 {anexo.nomeArquivo}
                        </a>
                      ) : (
                        <span className="text-gray-medium">📎 {anexo.nomeArquivo}</span>
                      )}
                      <span className="text-gray-medium"> ({formatarTamanho(anexo.tamanhoBytes)})</span>
                    </li>
                  ))}
                </ul>
              )}
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
            <input
              id="anexos-comentario"
              name="anexos"
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,image/gif,application/pdf,text/plain,.doc,.docx,.xlsx,.zip"
              className="text-sm text-gray-medium file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm file:text-white"
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
