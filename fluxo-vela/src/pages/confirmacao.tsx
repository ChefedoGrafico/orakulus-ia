import { Link } from "wouter";
import { CheckCircle2, Crown, Rocket, MessageCircle, Sparkles, Shield } from "lucide-react";

const WHATSAPP_SUPPORT_LINK = "https://wa.me/5500000000000?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20para%20ativar%20meu%20acesso%20Premium%20na%20ORAKULUS%20IA.";

export default function Confirmacao() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-[hsl(268_88%_65%/0.08)] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary)/0.6) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)/0.6) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center gap-6">
        {/* Logo / brand badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 mb-2">
          <Crown className="w-4 h-4 text-primary" />
          <span className="font-mono uppercase tracking-[0.25em] text-xs text-primary font-black">
            ORAKULUS IA PREMIUM
          </span>
        </div>

        {/* Success icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-32 h-32 rounded-full bg-primary/15 blur-2xl" />
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-2 border-primary/60 bg-primary/10 shadow-[0_0_40px_hsl(var(--primary)/0.35)]">
            <CheckCircle2 className="w-12 h-12 text-primary" strokeWidth={1.5} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black leading-tight">
          ✅ Pagamento confirmado
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-primary font-bold leading-snug">
          Seu acesso à ORAKULUS IA PREMIUM está sendo liberado.
        </p>

        {/* Main text */}
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md">
          Seu pagamento foi aprovado com sucesso. Em instantes, seu acesso completo será liberado no sistema.
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

        {/* Instruction card */}
        <div className="w-full rounded-2xl border border-primary/25 bg-primary/5 p-5 text-left flex gap-4">
          <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Se você já possui cadastro, basta acessar normalmente. Caso ainda não veja o acesso liberado, aguarde alguns segundos ou entre em contato para ativação.
          </p>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-primary">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
          Ativação em processamento
        </div>

        {/* Buttons */}
        <div className="w-full flex flex-col sm:flex-row gap-3 mt-2">
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-black text-sm uppercase tracking-widest text-black hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_24px_hsl(var(--primary)/0.45)]"
          >
            <Rocket className="w-4 h-4" />
            ACESSAR ORAKULUS IA
          </Link>

          <a
            href={WHATSAPP_SUPPORT_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary/40 bg-primary/10 px-6 py-4 font-black text-sm uppercase tracking-widest text-primary hover:border-primary/70 hover:bg-primary/15 active:scale-[0.98] transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            Falar com suporte
          </a>
        </div>

        {/* Footer note */}
        <p className="text-[11px] text-muted-foreground/50 font-mono uppercase tracking-widest mt-2">
          <Sparkles className="w-3 h-3 inline mr-1 text-primary/50" />
          Obrigado por fazer parte da ORAKULUS IA
        </p>
      </div>
    </div>
  );
}
