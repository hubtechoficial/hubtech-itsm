import { createClient } from "@/lib/supabase/server";
import { criarArtigo } from "./actions";

export default async function AdminArtigosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  const { data: todosArtigos } = await supabase
    .from("artigos_conhecimento")
    .select("id, titulo, conteudo, tags, created_at")
    .order("titulo");

  // Filtro em memória (não em SQL): volume da Base de Conhecimento é pequeno
  // e isso evita interpolar entrada do usuário na sintaxe de filtro do PostgREST.
  const termo = q?.trim().toLowerCase();
  const artigos = termo
    ? todosArtigos?.filter(
        (artigo) =>
          artigo.titulo.toLowerCase().includes(termo) ||
          artigo.conteudo.toLowerCase().includes(termo),
      )
    : todosArtigos;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Base de Conhecimento</h1>

      <form className="mb-6 flex gap-2" action="/admin/artigos">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por título ou conteúdo..."
          className="w-full max-w-md rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark"
        >
          Buscar
        </button>
      </form>

      <div className="mb-8 flex flex-col gap-3">
        {!artigos || artigos.length === 0 ? (
          <p className="text-sm text-gray-medium">Nenhum artigo encontrado.</p>
        ) : (
          artigos.map((artigo) => (
            <details key={artigo.id} className="rounded-lg border border-white/10 bg-surface/40 p-4">
              <summary className="cursor-pointer font-semibold">{artigo.titulo}</summary>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-medium">{artigo.conteudo}</p>
              {artigo.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {artigo.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded-lg bg-primary/15 px-2 py-1 text-xs font-semibold text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </details>
          ))
        )}
      </div>

      <h2 className="mb-4 text-lg font-semibold">Novo Artigo</h2>
      <form action={criarArtigo} className="flex max-w-lg flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="titulo" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
            Título
          </label>
          <input
            id="titulo"
            name="titulo"
            required
            className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="conteudo"
            className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium"
          >
            Conteúdo
          </label>
          <textarea
            id="conteudo"
            name="conteudo"
            required
            rows={6}
            className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="tags" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
            Tags (separadas por vírgula)
          </label>
          <input
            id="tags"
            name="tags"
            placeholder="e-mail, senha, acesso"
            className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <button
          type="submit"
          className="self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark"
        >
          Criar Artigo
        </button>
      </form>
    </div>
  );
}
