"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    setCarregando(false);

    if (error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }

    router.push("/painel");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold">Hub Tech ITSM</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="senha" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {erro && <p className="text-sm text-critical">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark disabled:opacity-60"
          >
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <Link href="/esqueci-senha" className="text-center text-sm text-gray-medium hover:text-white">
            Esqueci minha senha
          </Link>
        </form>
      </div>
    </main>
  );
}
