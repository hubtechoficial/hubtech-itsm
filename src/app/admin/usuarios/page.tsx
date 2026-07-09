import { createClient } from "@/lib/supabase/server";
import { criarUsuario } from "./actions";

export default async function AdminUsuariosPage() {
  const supabase = await createClient();
  const [{ data: usuarios }, { data: projetos }, { data: grupos }] = await Promise.all([
    supabase
      .from("usuarios")
      .select("id, nome, email, perfil, projetos(nome), grupos(nome)")
      .order("nome"),
    supabase.from("projetos").select("id, nome").order("nome"),
    supabase.from("grupos").select("id, nome, projeto_id").order("nome"),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Usuários</h1>

      <div className="mb-8 overflow-hidden rounded-lg border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-[2.5px] text-gray-medium">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Perfil</th>
              <th className="px-4 py-3">Projeto</th>
              <th className="px-4 py-3">Grupo</th>
            </tr>
          </thead>
          <tbody>
            {usuarios?.map((usuario) => (
              <tr key={usuario.id} className="border-t border-white/10 bg-surface/40">
                <td className="px-4 py-3">{usuario.nome}</td>
                <td className="px-4 py-3 text-gray-medium">{usuario.email}</td>
                <td className="px-4 py-3 capitalize">{usuario.perfil}</td>
                <td className="px-4 py-3 text-gray-medium">
                  {(usuario.projetos as unknown as { nome: string } | null)?.nome ?? "—"}
                </td>
                <td className="px-4 py-3 text-gray-medium">
                  {(usuario.grupos as unknown as { nome: string } | null)?.nome ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
