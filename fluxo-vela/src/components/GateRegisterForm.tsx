import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Step = 1 | 2 | 3;
type FormState = "idle" | "loading" | "error";
type Phase = "form" | "whatsapp";

const WA_NUMBER = "5511932353426";

function buildWaLink(idCorretora: string) {
  const msg = [
    "Acabei de criar minha conta pela ORAKULUS IA.",
    "",
    `ID da corretora: ${idCorretora}`,
    "Depósito: já realizado",
    "",
    "Aguardo validação para liberação dos sinais.",
  ].join("\n");
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

interface Props {
  onSuccess: () => Promise<void>;
  onLoginClick: () => void;
}

export default function GateRegisterForm({ onSuccess, onLoginClick }: Props) {
  const [phase, setPhase] = useState<Phase>("form");
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [showJaTenho, setShowJaTenho] = useState(false);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [idCorretora, setIdCorretora] = useState("");
  const [statusDeposito, setStatusDeposito] = useState<"pendente" | "realizado">("pendente");

  function nextStep() {
    if (step === 1) {
      if (!nome.trim() || !email.trim() || !senha || !confirmarSenha) {
        setError("Preencha todos os campos obrigatórios.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError("E-mail inválido.");
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

  async function handleConfirm() {
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
          status_deposito: statusDeposito,
        }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Erro ao cadastrar.");
        setState("error");
        return;
      }
      // Show WhatsApp screen only when deposit is done AND broker ID is filled
      if (statusDeposito === "realizado" && idCorretora.trim()) {
        setState("idle");
        setPhase("whatsapp");
      } else {
        await onSuccess();
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setState("error");
    }
  }

  // ── WhatsApp confirmation phase ──────────────────────────────────────────
  if (phase === "whatsapp") {
    const waLink = buildWaLink(idCorretora.trim());
    return (
      <motion.div
        key="wa-screen"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-7 text-center space-y-5"
      >
        {/* Icon */}
        <motion.div
          animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 rounded-full bg-[#128c7e]/20 border-2 border-[#25d366]/60 flex items-center justify-center mx-auto shadow-[0_0_22px_rgba(37,211,102,0.25)]"
        >
          <span className="text-3xl">💬</span>
        </motion.div>

        {/* Heading */}
        <div>
          <h2 className="text-lg font-black text-white mb-1.5">
            Cadastro enviado para validação
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Agora fale com o suporte para agilizar sua liberação.
          </p>
        </div>

        {/* ID summary */}
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted/10 border border-border/40 font-mono text-xs text-foreground/70">
          <span className="text-muted-foreground">ID corretora:</span>
          <span className="text-foreground font-semibold">{idCorretora.trim()}</span>
        </div>

        {/* Primary CTA */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { void onSuccess(); }}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black uppercase tracking-[0.1em] text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg,#128c7e,#25d366)", boxShadow: "0 0 28px rgba(37,211,102,0.35)" }}
        >
          💬 FALAR COM SUPORTE AGORA
        </a>

        {/* Secondary — skip */}
        <button
          type="button"
          onClick={() => { void onSuccess(); }}
          className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground underline transition-colors"
        >
          Já entrei em contato — continuar
        </button>
      </motion.div>
    );
  }

  // ── Registration form phase ──────────────────────────────────────────────
  const steps = ["Acesso", "Corretora", "Confirmar"];

  return (
    <div className="relative">
      {/* Loading overlay */}
      <AnimatePresence>
        {state === "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-[#0a0a0a]/95"
          >
            <div className="flex gap-1.5">
              {[0, 0.15, 0.3].map((d) => (
                <motion.span key={d} className="w-2.5 h-2.5 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -5, 0] }}
                  transition={{ duration: 0.8, delay: d, repeat: Infinity }} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground font-mono">Criando seu acesso…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-7 pt-7 pb-4 text-center">
        <div className="inline-flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[hsl(155_100%_40%)] to-[hsl(155_100%_25%)] flex items-center justify-center text-xs font-black text-black">O</div>
          <span className="font-black tracking-[0.22em] text-white text-sm uppercase">ORAKULUS IA</span>
        </div>
        <h2 className="text-base font-black text-white mt-1">Crie seu acesso gratuito</h2>
        {step === 1 && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-xs mx-auto">
            Crie seu cadastro gratuito na ORAKULUS IA para continuar acompanhando as leituras.
          </p>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 px-7 mb-4">
        {steps.map((label, i) => {
          const n = (i + 1) as Step;
          const active = step === n;
          const done = step > n;
          return (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black border transition-all ${
                done ? "bg-primary border-primary text-black" :
                active ? "border-primary text-primary bg-primary/10" :
                "border-border/40 text-muted-foreground/30"
              }`}>
                {done ? "✓" : n}
              </div>
              <span className={`text-[9px] font-mono uppercase tracking-wider ${active ? "text-foreground/80" : "text-muted-foreground/30"}`}>{label}</span>
              {i < steps.length - 1 && <div className={`w-5 h-px ${step > n ? "bg-primary" : "bg-border/25"}`} />}
            </div>
          );
        })}
      </div>

      {/* Form body */}
      <div className="px-7 pb-7 space-y-3">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-3">
              <div>
                <label className="block text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">Nome completo *</label>
                <input value={nome} onChange={(e) => setNome(e.target.value)} type="text" placeholder="Seu nome completo"
                  className="w-full rounded-xl bg-muted/10 border border-border/50 text-foreground placeholder:text-muted-foreground/40 px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary/70 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">E-mail *</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="seu@email.com"
                  className="w-full rounded-xl bg-muted/10 border border-border/50 text-foreground placeholder:text-muted-foreground/40 px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary/70 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">Senha *</label>
                <input value={senha} onChange={(e) => setSenha(e.target.value)} type="password" placeholder="Mínimo 6 caracteres"
                  className="w-full rounded-xl bg-muted/10 border border-border/50 text-foreground placeholder:text-muted-foreground/40 px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary/70 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">Confirmar senha *</label>
                <input value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} type="password" placeholder="Repita a senha"
                  className="w-full rounded-xl bg-muted/10 border border-border/50 text-foreground placeholder:text-muted-foreground/40 px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary/70 transition-all" />
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-3">
              {/* Broker CTA box */}
              <div className="rounded-xl border border-yellow-600/40 bg-yellow-950/20 p-3.5 space-y-2.5">
                <p className="text-xs text-yellow-200/90 font-semibold leading-relaxed">
                  Para continuar recebendo sinais, crie sua conta pela corretora oficial e informe seu ID.
                </p>
                <p className="text-[10px] text-yellow-500/80 leading-relaxed">
                  ⚠️ Contas criadas fora do link oficial não serão validadas.
                </p>
                <a href="https://trade.avalonbroker.com/register?aff=783535&aff_model=revenue&afftrack=" target="_blank" rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase tracking-[0.12em] text-xs py-2.5 rounded-lg transition-colors">
                  🏦 CRIAR CONTA OFICIAL
                </a>

                {/* Accordion: Já tenho conta */}
                <button type="button" onClick={() => setShowJaTenho(v => !v)}
                  className="w-full flex items-center justify-between text-[10px] text-yellow-600/70 hover:text-yellow-400 transition-colors py-0.5 border-t border-yellow-800/30 pt-2">
                  <span className="font-semibold">Já tenho conta na corretora</span>
                  <span style={{ display: "inline-block", transform: showJaTenho ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▾</span>
                </button>
                <AnimatePresence>
                  {showJaTenho && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-[10px] text-yellow-600/60 leading-relaxed overflow-hidden"
                    >
                      A corretora permite até 2 contas por CPF, desde que utilize outro e-mail e número no novo cadastro.<br />
                      Não é necessário excluir sua conta antiga.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* ID field */}
              <div>
                <label className="block text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">ID da conta na corretora</label>
                <input value={idCorretora} onChange={(e) => setIdCorretora(e.target.value)} type="text" placeholder="Seu ID de trader"
                  className="w-full rounded-xl bg-muted/10 border border-border/50 text-foreground placeholder:text-muted-foreground/40 px-3.5 py-2.5 text-sm focus:outline-none focus:border-primary/70 transition-all" />
              </div>

              {/* Deposit status toggle */}
              <div>
                <label className="block text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-1">Status do depósito</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pendente", "realizado"] as const).map((v) => (
                    <button key={v} type="button" onClick={() => setStatusDeposito(v)}
                      className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${statusDeposito === v
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/40 bg-muted/5 text-muted-foreground hover:border-border/60"}`}>
                      {v === "pendente" ? "Ainda não depositei" : "Depósito realizado"}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {statusDeposito === "pendente" && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                      className="text-[10px] text-yellow-600/70 mt-1.5 leading-relaxed">
                      Para liberar o acesso, é necessário realizar o primeiro depósito.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">Confirme seus dados para validação:</p>
              <div className="rounded-xl bg-muted/10 border border-border/40 p-3.5 space-y-2 font-mono text-xs">
                <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">Nome</span><span className="text-foreground font-semibold truncate text-right">{nome}</span></div>
                <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">E-mail</span><span className="text-foreground font-semibold truncate text-right">{email.toLowerCase()}</span></div>
                {idCorretora && <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">ID Corretora</span><span className="text-foreground font-semibold truncate text-right">{idCorretora}</span></div>}
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Depósito</span>
                  <span className={`font-semibold ${statusDeposito === "realizado" ? "text-primary" : "text-yellow-500"}`}>
                    {statusDeposito === "realizado" ? "Realizado ✓" : "Pendente"}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/50 text-center leading-relaxed">
                Ao enviar, seu cadastro será analisado pela equipe ORAKULUS IA.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

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
              PRÓXIMO →
            </button>
          ) : (
            <button type="button" onClick={() => { void handleConfirm(); }} disabled={state === "loading"}
              className="flex-1 bg-primary text-primary-foreground font-black uppercase tracking-[0.08em] text-sm py-3 rounded-xl fv-glow-green flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 disabled:scale-100">
              🚀 ENVIAR PARA VALIDAÇÃO
            </button>
          )}
        </div>

        <div className="text-center pt-0.5">
          <p className="text-[10px] text-muted-foreground/50">
            Já tem conta?{" "}
            <button type="button" onClick={onLoginClick} className="text-primary/80 hover:text-primary underline">
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
