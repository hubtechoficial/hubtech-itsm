import { redirect } from "next/navigation";
import { getUsuarioAtual } from "@/lib/usuarios/current";
import { atualizarNome, atualizarFoto, trocarSenha } from "./actions";

export default async function ConfiguracoesPage() {
  const usuarioAtual = await getUsuarioAtual();

  if (!usuarioAtual) {
    redirect("/login");
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-8 text-2xl font-bold">Configurações</h1>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[2.5px] text-gray-medium">
            Foto de perfil
          </h2>
          <div className="mb-4 flex items-center gap-4">
            {usuarioAtual.fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={usuarioAtual.fotoUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-xl font-semibold text-primary">
                {usuarioAtual.nome.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <form action={atualizarFoto} className="flex items-center gap-2">
            <input
              type="file"
              name="foto"
              accept="image/png,image/jpeg,image/webp"
              required
              className="text-sm text-gray-medium file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm file:text-white"
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-2 text-sm font-semibold hover:bg-primary-dark"
            >
              Enviar
            </button>
          </form>
          <p className="mt-1 text-xs text-gray-medium">PNG, JPEG ou WEBP — máximo 2MB.</p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[2.5px] text-gray-medium">
            Dados da conta
          </h2>
          <form action={atualizarNome} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="nome" className="text-xs text-gray-medium">
                Nome
              </label>
              <input
                id="nome"
                name="nome"
                defaultValue={usuarioAtual.nome}
                required
                className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-medium">E-mail</label>
              <p className="text-sm text-gray-medium">{usuarioAtual.email}</p>
            </div>
            <button
              type="submit"
              className="self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark"
            >
              Salvar nome
            </button>
          </form>
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[2.5px] text-gray-medium">
            Trocar senha
          </h2>
          <form action={trocarSenha} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="senha" className="text-xs text-gray-medium">
                Nova senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                minLength={8}
                required
                className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="confirmacao" className="text-xs text-gray-medium">
                Confirmar nova senha
              </label>
              <input
                id="confirmacao"
                name="confirmacao"
                type="password"
                minLength={8}
                required
                className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              className="self-start rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark"
            >
              Trocar senha
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
