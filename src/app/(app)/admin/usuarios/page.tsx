import { createClient } from "@/lib/supabase/server";
import { criarUsuario, adicionarProjetoTecnico, removerProjetoTecnico } from "./actions";

export default async function AdminUsuariosPage() {
  const supabase = await createClient();
  const [{ data: usuarios }, { data: projetos }, { data: grupos }, { data: vinculosTecnico }] =
    await Promise.all([
      supabase
        .from("usuarios")
        .select("id, nome, email, perfil, projetos(nome), grupos(nome)")
        .order("nome"),
      supabase.from("projetos").select("id, nome").order("nome"),
      supabase.from("grupos").select("id, nome, projeto_id").order("nome"),
      supabase.from("tecnico_projetos").select("usuario_id, projeto_id, projetos(nome)"),
    ]);

  function projetosDoTecnico(usuarioId: string) {
    return (vinculosTecnico ?? [])
      .filter((v) => v.usuario_id === usuarioId)
      .map((v) => {
        const projeto = v.projetos as unknown as { nome: string } | { nome: string }[] | null;
        const nome = Array.isArray(projeto) ? (projeto[0]?.nome ?? "") : (projeto?.nome ?? "");
        return { projetoId: v.projeto_id, nome };
      });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Usuários</h1>

      <div className="mb-8 flex flex-col gap-3">
        {usuarios?.map((usuario) => (
          <div key={usuario.id} className="rounded-lg border border-white/10 bg-surface/40 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold">{usuario.nome}</span>{" "}
                <span className="text-sm text-gray-medium">{usuario.email}</span>
              </div>
              <span className="rounded-lg bg-primary/15 px-2 py-1 text-xs font-semibold uppercase text-primary">
                {usuario.perfil}
              </span>
            </div>

            {usuario.perfil === "tecnico" ? (
              <div className="mt-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
                  Projetos atendidos
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {projetosDoTecnico(usuario.id).map((p) => (
                    <form key={p.projetoId} action={removerProjetoTecnico.bind(null, usuario.id, p.projetoId)}>
                      <button
                        type="submit"
                        className="rounded-lg bg-surface px-2 py-1 text-xs text-gray-medium hover:text-critical"
                        title="Remover"
                      >
                        {p.nome} ✕
                      </button>
                    </form>
                  ))}
                  <form action={adicionarProjetoTecnico.bind(null, usuario.id)} className="flex gap-1">
                    <select
                      name="projeto_id"
                      required
                      className="rounded-md border border-white/10 bg-surface px-2 py-1 text-xs outline-none focus:border-primary"
                    >
                      <option value="">+ adicionar Projeto</option>
                      {projetos?.map((projeto) => (
                        <option key={projeto.id} value={projeto.id}>
                          {projeto.nome}
                        </option>
                      ))}
                    </select>
                    <button type="submit" className="rounded-md bg-primary px-2 py-1 text-xs font-semibold">
                      Adicionar
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-medium">
                {(usuario.projetos as unknown as { nome: string } | null)?.nome ?? "—"}
                {" · "}
                {(usuario.grupos as unknown as { nome: string } | null)?.nome ?? "sem grupo"}
              </p>
            )}
          </div>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold">Novo Usuário</h2>
      <form action={criarUsuario} className="flex max-w-md flex-col gap-4">
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
          <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="senha" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
            Senha inicial (mín. 8 caracteres)
          </label>
          <input
            id="senha"
            name="senha"
            type="text"
            minLength={8}
            required
            className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <p className="text-xs text-gray-medium">
            Repasse essa senha ao usuário — ele pode trocar depois em &quot;esqueci minha senha&quot;.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="perfil" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
            Perfil
          </label>
          <select
            id="perfil"
            name="perfil"
            required
            className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="basico">Básico</option>
            <option value="supervisor">Supervisor</option>
            <option value="tecnico">Técnico</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="projeto_id"
            className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium"
          >
            Projeto (obrigatório para Básico/Supervisor)
          </label>
          <select
            id="projeto_id"
            name="projeto_id"
            className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">—</option>
            {projetos?.map((projeto) => (
              <option key={projeto.id} value={projeto.id}>
                {projeto.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="grupo_id" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
            Grupo/Setor (opcional, define o time do Supervisor)
          </label>
          <select
            id="grupo_id"
            name="grupo_id"
            className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">—</option>
            {grupos?.map((grupo) => (
              <option key={grupo.id} value={grupo.id}>
                {grupo.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
            Projetos que o Técnico vai atender (obrigatório para perfil Técnico)
          </span>
          <div className="flex flex-col gap-1 rounded-md border border-white/10 bg-surface px-3 py-2">
            {projetos?.map((projeto) => (
              <label key={projeto.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="projetos_tecnico" value={projeto.id} />
                {projeto.nome}
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark"
        >
          Criar Usuário
        </button>
      </form>
    </div>
  );
}
