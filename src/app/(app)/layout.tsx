import Link from "next/link";
import { getUsuarioAtual } from "@/lib/usuarios/current";
import { sair } from "./actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuarioAtual = await getUsuarioAtual();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/chamados" className="font-display text-lg font-bold">
            Hub Tech ITSM
          </Link>

          {usuarioAtual && (
            <details className="relative">
              <summary className="flex list-none items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-surface [&::-webkit-details-marker]:hidden">
                {usuarioAtual.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={usuarioAtual.fotoUrl}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                    {usuarioAtual.nome.charAt(0).toUpperCase()}
                  </span>
                )}
                {usuarioAtual.nome}
              </summary>
              <div className="absolute right-0 z-10 mt-2 w-44 rounded-md border border-white/10 bg-surface py-1 shadow-lg">
                <Link
                  href="/configuracoes"
                  className="block px-3 py-2 text-sm text-gray-medium hover:bg-white/5 hover:text-white"
                >
                  Configurações
                </Link>
                <form action={sair}>
                  <button
                    type="submit"
                    className="block w-full px-3 py-2 text-left text-sm text-gray-medium hover:bg-white/5 hover:text-white"
                  >
                    Sair
                  </button>
                </form>
              </div>
            </details>
          )}
        </div>
      </header>

      {children}
    </div>
  );
}
