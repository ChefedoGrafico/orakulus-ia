import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [, navigate] = useLocation();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), senha }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Erro ao entrar.");
        setState("error");
        return;
      }
      await refreshUser();
      navigate("/");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setState("error");
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full bg-[hsl(155_100%_40%/0.08)] blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(268_88%_65%/0.07)] blur-[140px]" />
        <div className="absolute inset-0 fv-grid-bg opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(155_100%_40%)] to-[hsl(155_100%_25%)] flex items-center justify-center text-sm font-black">O</div>
            <span className="font-black tracking-[0.25em] text-white text-lg uppercase">ORAKULUS IA</span>
          </div>
          <p className="text-sm text-muted-foreground">Entre para acessar seu painel de sinais</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/50 bg-[#0a0a0a]/90 p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
          <form onSubmit={(e) => { void handleSubmit(e); }} className="space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full rounded-xl bg-muted/10 border border-border/60 text-foreground placeholder:text-muted-foreground/40 px-4 py-3 text-sm focus:outline-none focus:border-primary/70 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5">Senha</label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-muted/10 border border-border/60 text-foreground placeholder:text-muted-foreground/40 px-4 py-3 text-sm focus:outline-none focus:border-primary/70 transition-all"
              />
            </div>

            {state === "error" && (
              <p className="text-xs text-red-400 text-center bg-red-900/20 border border-red-800/40 rounded-lg py-2 px-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={state === "loading"}
              className="w-full bg-primary text-primary-foreground font-black uppercase tracking-[0.15em] text-sm py-3.5 rounded-xl fv-glow-green flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 disabled:scale-100 mt-2"
            >
              {state === "loading" ? "⏳ Verificando…" : "🚀 ENTRAR NA ORAKULUS IA"}
            </button>
          </form>

          <div className="mt-5 text-center space-y-2">
            <p className="text-xs text-muted-foreground/60">
              Ainda não tem acesso?{" "}
              <button
                onClick={() => navigate("/cadastro")}
                className="text-primary hover:underline font-semibold"
              >
                Criar acesso gratuito
              </button>
            </p>
            <button
              onClick={() => navigate("/")}
              className="text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors"
            >
              ← Voltar para o início
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
