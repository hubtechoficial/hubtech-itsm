"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro(null);

    if (senha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }

    setCarregando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setCarregando(false);

    if (error) {
      setErro("Não foi possível redefinir a senha. O link pode ter expirado.");
      return;
    }

    router.push("/chamados");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-2xl font-bold">Redefinir senha</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="senha" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
              Nova senha
            </label>
            <input
              id="senha"
              type="password"
              required
              minLength={8}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirmacao" className="text-xs font-semibold uppercase tracking-[2.5px] text-gray-medium">
              Confirmar nova senha
            </label>
            <input
              id="confirmacao"
              type="password"
              required
              minLength={8}
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
              className="rounded-md border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>

          {erro && <p className="text-sm text-critical">{erro}</p>}

          <button
            type="submit"
            disabled={carregando}
            className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold hover:bg-primary-dark disabled:opacity-60"
          >
            {carregando ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </main>
  );
}
