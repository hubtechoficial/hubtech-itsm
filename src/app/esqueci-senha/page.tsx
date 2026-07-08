"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function EsqueciSenhaPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);
    setCarregando(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });

    setCarregando(false);

    if (error) {
      setErro("Não foi possível enviar o e-mail de recuperação.");
      return;
    }

    setEnviado(true);
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-center text-2xl font-bold">Esqueci minha senha</h1>
        <p className="mb-8 text-center text-sm text-gray-medium">
          Informe seu e-mail institucional e enviaremos um link para redefinir a senha.
        </p>

        {enviado ? (
          <p className="text-center text-sm text-success">
            Se o e-mail existir em nossa base, um link de redefinição foi enviado.
          </p>
        ) : (
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

            {erro && <p className="text-sm text-critical">{erro}</p>}

            <button
              type="submit"
              disabled={carregando}
              className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark disabled:opacity-60"
            >
              {carregando ? "Enviando..." : "Enviar link de recuperação"}
            </button>
          </form>
        )}

        <Link href="/login" className="mt-6 block text-center text-sm text-gray-medium hover:text-white">
          Voltar para o login
        </Link>
      </div>
    </main>
  );
}
