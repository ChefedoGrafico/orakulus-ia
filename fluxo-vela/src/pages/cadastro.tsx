import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

type Step = 1 | 2 | 3;
type FormState = "idle" | "confirming" | "loading" | "sent" | "error";

export default function Cadastro() {
  const [, navigate] = useLocation();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [showJaTenho, setShowJaTenho] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [idCorretora, setIdCorretora] = useState("");
  const [comprovante, setComprovante] = useState("");

  function nextStep() {
    if (step === 1) {
      if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
        setError("Preencha todos os campos obrigatórios.");
        return;
      }
      if (senha !== confirmarSenha) {
        setError("As senhas não coincidem.");
        return;
      }
      if (senha.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres.");
        return;
      }
    }
    setError("");
    setStep((s) => (s < 3 ? ((s + 1) as Step) : s));
  }

  function handleConfirmClick(e: React.FormEvent) {
    e.preventDefault();
    setState("confirming");
  }

  async function handleConfirmedSubmit() {
    setState("loading");
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          senha,
          id_corretora: idCorretora.trim(),
          status_deposito: "pendente",
          comprovante_deposito: comprovante.trim() || undefined,
        }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Erro ao cadastrar.");
        setState("error");
        return;
      }
      await refreshUser();
      setState("sent");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setState("error");
    }
  }

  const steps = ["Acesso", "Corretora", "Confirmar"];

  if (state === "sent") {
    return (
      <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col items-center justify-center px-4 relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full bg-[hsl(155_100%_40%/0.08)] blur-[140px]" />
          <div className="absolute inset-0 fv-grid-bg opacity-30" />
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-sm text-center space-y-5 p-6 rounded-2xl border border-border/50 bg-[#0a0a0a]/90">
          <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 2.2, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-yellow-900/30 border-2 border-yellow-500/60 flex items-center justify-center mx-auto shadow-[0_0_22px_hsl(45_100%_60%/0.25)]">
            <span className="text-3xl">⏳</span>
          </motion.div>
          <div>
            <h2 className="text-lg font-black text-yellow-400 mb-2">Seu acesso está sendo validado</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Estamos validando sua conta na corretora.<br />
              Assim que confirmado, seu acesso será liberado automaticamente.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-900/20 border border-yellow-800/40">
            <span className="flex gap-0.5">
              {[0, 0.2, 0.4].map((d) => (
                <motion.span key={d} className="w-1.5 h-1.5 rounded-full bg-yellow-500"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ duration: 1, delay: d, repeat: Infinity }} />
              ))}
            </span>
            <span className="text-[11px] text-yellow-500/80 font-mono">Isso pode levar alguns instantes</span>
          </div>
          <p className="text-xs text-muted-foreground/50">Enquanto isso, novas leituras continuam sendo analisadas</p>
          <div className="flex flex-col gap-2">
            <button onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-yellow-700/50 text-yellow-400 text-sm font-semibold hover:bg-yellow-900/20 transition-all active:scale-95">
              ↻ Atualizar acesso
            </button>
            <button onClick={() => navigate("/")}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors py-1">
              ← Voltar para o início
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-white flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full bg-[hsl(155_100%_40%/0.08)] blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[hsl(268_88%_65%/0.07)] blur-[140px]" />
        <div className="absolute inset-0 fv-grid-bg opacity-30" />
      </div>

      {/* Confirmation modal */}
      <AnimatePresence>
        {state === "confirming" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="w-full max-w-xs rounded-2xl border border-border/60 bg-[#0d0d0d] shadow-[0_0_80px_rgba(0,0,0,0.9)] p-6 space-y-4"
            >
              <div className="text-center space-y-1">
                <span className="text-2xl">🔍</span>
                <h3 className="text-base font-black text-foreground">Seus dados estão corretos?</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Confira antes de enviar para validação.
                </p>
              </div>

              <div className="rounded-xl bg-muted/10 border border-border/40 p-3 space-y-2 font-mono text-xs">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Nome</span>
                  <span className="text-foreground font-semibold text-right truncate">{nome}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">E-mail</span>
                  <span className="text-foreground font-semibold text-right truncate">{email.toLowerCase()}</span>
                </div>
                {idCorretora && (
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground shrink-0">ID Corretora</span>
                    <span className="text-foreground font-semibold text-right truncate">{idCorretora}</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-muted-foreground/50 text-center leading-relaxed">
                Ao confirmar, seu cadastro será enviado para validação. Esta ação não pode ser desfeita.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setState("idle")}
                  className="flex-1 border border-border/50 text-muted-foreground text-sm font-semibold py-3 rounded-xl hover:bg-muted/10 transition-colors"
                >
                  ← Voltar
                </button>
                <button
                  type="button"
                  onClick={() => { void handleConfirmedSubmit(); }}
                  className="flex-1 bg-primary text-primary-foreground font-black uppercase tracking-[0.1em] text-sm py-3 rounded-xl fv-glow-green hover:scale-[1.01] active:scale-[0.99] transition-transform"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {state === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
            style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(8px)" }}
          >
            <div className="flex gap-1.5">
              {[0, 0.15, 0.3].map((d) => (
                <motion.span key={d} className="w-2.5 h-2.5 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
                  transition={{ duration: 0.8, delay: d, repeat: Infinity }} />
              ))}
            </div>
            <p className="text-sm text-muted-foreground font-mono">Criando seu acesso…</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(155_100%_40%)] to-[hsl(155_100%_25%)] flex items-center justify-center text-sm font-black">O</div>
            <span className="font-black tracking-[0.25em] text-white text-lg uppercase">ORAKULUS IA</span>
          </div>
          <p className="text-sm text-muted-foreground">Crie seu acesso gratuito</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((label, i) => {
            const n = (i + 1) as Step;
            const active = step === n;
            const done = step > n;
            return (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                  done ? "bg-primary border-primary text-black" :
                  active ? "border-primary text-primary bg-primary/10" :
                  "border-border/50 text-muted-foreground/40"
                }`}>
                  {done ? "✓" : n}
                </div>
                <span className={`text-[10px] font-mono uppercase tracking-wider ${active ? "text-foreground" : "text-muted-foreground/40"}`}>{label}</span>
                {i < steps.length - 1 && <div className={`w-6 h-px ${step > n ? "bg-primary" : "bg-border/30"}`} />}
              </div>
            );
          })}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/50 bg-[#0a0a0a]/90 p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)]">
          <form onSubmit={(e) => { void handleConfirmClick(e); }} className="space-y-4">

            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5">Nome completo *</label>
                  <input required value={nome} onChange={(e) => setNome(e.target.value)} type="text" placeholder="Seu nome completo"
                    className="w-full rounded-xl bg-muted/10 border border-border/60 text-foreground placeholder:text-muted-foreground/40 px-4 py-3 text-sm focus:outline-none focus:border-primary/70 transition-all" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5">E-mail *</label>
                  <input required value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="seu@email.com"
                    className="w-full rounded-xl bg-muted/10 border border-border/60 text-foreground placeholder:text-muted-foreground/40 px-4 py-3 text-sm focus:outline-none focus:border-primary/70 transition-all" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5">Senha *</label>
                  <input required value={senha} onChange={(e) => setSenha(e.target.value)} type="password" placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-xl bg-muted/10 border border-border/60 text-foreground placeholder:text-muted-foreground/40 px-4 py-3 text-sm focus:outline-none focus:border-primary/70 transition-all" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5">Confirmar senha *</label>
                  <input required value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} type="password" placeholder="Repita a senha"
                    className="w-full rounded-xl bg-muted/10 border border-border/60 text-foreground placeholder:text-muted-foreground/40 px-4 py-3 text-sm focus:outline-none focus:border-primary/70 transition-all" />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <div className="rounded-xl border border-yellow-600/40 bg-yellow-950/20 p-3 space-y-2">
                  <p className="text-[11px] text-yellow-300 font-semibold">⚠️ Crie sua conta pelo link oficial antes de preencher</p>
                  <a href="https://trade.avalonbroker.com/register?aff=783535&aff_model=revenue&afftrack=" target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-[0.12em] text-xs py-2.5 rounded-lg transition-colors">
                    🏦 CRIAR CONTA OFICIAL
                  </a>
                  <div>
                    <button type="button" onClick={() => setShowJaTenho(v => !v)}
                      className="w-full flex items-center justify-between text-left text-[10px] text-yellow-700/70 hover:text-yellow-500 transition-colors py-0.5">
                      <span>Já tem conta na corretora?</span>
                      <span style={{ transform: showJaTenho ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
                    </button>
                    {showJaTenho && (
                      <div className="mt-1.5 text-[10px] text-yellow-600/60 border-t border-yellow-800/30 pt-1.5 leading-relaxed">
                        <p>Você pode criar uma nova conta normalmente. A corretora permite até 2 contas por CPF com outro e-mail.</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5">ID da conta na corretora</label>
                  <input value={idCorretora} onChange={(e) => setIdCorretora(e.target.value)} type="text" placeholder="Seu ID de trader"
                    className="w-full rounded-xl bg-muted/10 border border-border/60 text-foreground placeholder:text-muted-foreground/40 px-4 py-3 text-sm focus:outline-none focus:border-primary/70 transition-all" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5">Link do comprovante <span className="text-muted-foreground/40">(opcional)</span></label>
                  <input value={comprovante} onChange={(e) => setComprovante(e.target.value)} type="text" placeholder="URL do comprovante de depósito"
                    className="w-full rounded-xl bg-muted/10 border border-border/60 text-foreground placeholder:text-muted-foreground/40 px-4 py-3 text-sm focus:outline-none focus:border-primary/70 transition-all" />
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">Confira seus dados antes de enviar:</p>
                <div className="rounded-xl bg-muted/10 border border-border/40 p-4 space-y-2 font-mono text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="text-foreground font-semibold truncate text-right">{nome}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">E-mail</span>
                    <span className="text-foreground font-semibold truncate text-right">{email.toLowerCase()}</span>
                  </div>
                  {idCorretora && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">ID Corretora</span>
                      <span className="text-foreground font-semibold truncate text-right">{idCorretora}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-2 rounded-lg border border-border/30 bg-muted/5 px-3 py-2.5">
                  <span className="text-base leading-none mt-0.5">💡</span>
                  <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
                    Um segundo pedido de confirmação será exibido antes de enviar. Você pode voltar e corrigir qualquer dado.
                  </p>
                </div>
              </motion.div>
            )}

            {error && (
              <p className="text-xs text-red-400 text-center bg-red-900/20 border border-red-800/40 rounded-lg py-2 px-3">{error}</p>
            )}

            <div className="flex gap-2 pt-1">
              {step > 1 && (
                <button type="button" onClick={() => { setError(""); setStep(s => (s - 1) as Step); }}
                  className="flex-1 border border-border/50 text-muted-foreground text-sm font-semibold py-3 rounded-xl hover:bg-muted/10 transition-colors">
                  ← Voltar
                </button>
              )}
              {step < 3 ? (
                <button type="button" onClick={nextStep}
                  className="flex-1 bg-primary text-primary-foreground font-black uppercase tracking-[0.1em] text-sm py-3 rounded-xl fv-glow-green hover:scale-[1.01] active:scale-[0.99] transition-transform">
                  Próximo →
                </button>
              ) : (
                <button type="submit"
                  className="flex-1 bg-primary text-primary-foreground font-black uppercase tracking-[0.1em] text-sm py-3 rounded-xl fv-glow-green flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-transform">
                  Revisar e enviar →
                </button>
              )}
            </div>
          </form>

          <div className="mt-4 text-center">
            <p className="text-xs text-muted-foreground/60">
              Já tem acesso?{" "}
              <button onClick={() => navigate("/login")} className="text-primary hover:underline font-semibold">
                Fazer login
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
