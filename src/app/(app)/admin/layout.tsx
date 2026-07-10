import { redirect } from "next/navigation";
import Link from "next/link";
import { getUsuarioAtual } from "@/lib/usuarios/current";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const usuarioAtual = await getUsuarioAtual();

  if (usuarioAtual?.perfil !== "admin") {
    redirect("/chamados");
  }

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <nav className="mb-8 flex gap-6 border-b border-white/10 pb-4 text-sm">
          <Link href="/admin/projetos" className="text-gray-medium hover:text-white">
            Projetos
          </Link>
          <Link href="/admin/grupos" className="text-gray-medium hover:text-white">
            Grupos
          </Link>
          <Link href="/admin/usuarios" className="text-gray-medium hover:text-white">
            Usuários
          </Link>
          <Link href="/admin/artigos" className="text-gray-medium hover:text-white">
            Base de Conhecimento
          </Link>
          <Link href="/chamados" className="ml-auto text-gray-medium hover:text-white">
            ← Voltar aos chamados
          </Link>
        </nav>
        {children}
      </div>
    </main>
  );
}
