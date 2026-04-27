import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGetOperation,
  useGetOperationStats,
  useGetOperationHistory,
  getGetOperationQueryKey,
} from "@workspace/api-client-react";
import {
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Zap,
  ChevronRight,
  Send,
  Cpu,
  Brain,
  Target,
  Crown,
  Infinity as InfinityIcon,
  Bell,
  Lock,
  ChevronLeft,
  Sparkles,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  dirLabel,
  addMinutesHHMM,
  useBrasiliaClock,
  useCountdown,
  StatusPill,
  OrakulusLogo,
  SignalChart,
  RadialGauge,
  ResultCelebration,
} from "./home";

const PREMIUM_PRICE = "R$ 97";

function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    let cur = 0;
    const steps = Math.max(1, Math.round(duration / 16));
    const inc = target / steps;
    const timer = setInterval(() => {
      cur = Math.min(cur + inc, target);
      setCount(Math.round(cur));
      if (cur >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export default function Premium() {
  const { time, longDate } = useBrasiliaClock();

  const { data: operation, isLoading: loadingOp } = useGetOperation({
    query: { refetchInterval: 4000, queryKey: getGetOperationQueryKey() },
  });
  const { data: stats } = useGetOperationStats({
    query: { refetchInterval: 5000, queryKey: ["/api/operation/stats"] },
  });
  const { data: history } = useGetOperationHistory({
    query: { refetchInterval: 8000, queryKey: ["/api/operation/history"] },
  });

  const countdown = useCountdown(operation?.entryTime);

  const signalId = useMemo(() => {
    if (!operation) return "------";
    const seed = `${operation.asset}${operation.entryTime}${operation.direction}`;
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return h.toString(16).slice(0, 6).toUpperCase().padStart(6, "0");
  }, [operation]);

  const flowMap: Record<string, { label: string; bars: number; color: string }> = {
    Alta: { label: "Alta", bars: 5, color: "text-[hsl(45_100%_75%)]" },
    Media: { label: "Média", bars: 3, color: "text-secondary" },
    Baixa: { label: "Baixa", bars: 2, color: "text-muted-foreground" },
  };
  const flow = operation
    ? flowMap[operation.flowStrength] ?? { label: "—", bars: 0, color: "text-muted-foreground" }
    : { label: "—", bars: 0, color: "text-muted-foreground" };

  const buyerPct = useMemo(() => {
    if (!operation) return 50;
    const dir = operation.direction;
    const fs = operation.flowStrength;
    if (dir === "CALL") {
      if (fs === "Alta") return 85;
      if (fs === "Media") return 73;
      return 62;
    }
    if (dir === "PUT") {
      if (fs === "Alta") return 15;
      if (fs === "Media") return 27;
      return 38;
    }
    return 50;
  }, [operation]);

  const countWins = useCountUp(stats?.winsToday ?? 0);
  const countLosses = useCountUp(stats?.lossesToday ?? 0);
  const countTotal = useCountUp(stats?.totalToday ?? 0);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans relative">
      {/* Background — premium violet/gold/neon tones */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 fv-grid-bg fv-grid-drift opacity-50" />
        <div
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px]"
          style={{ background: "hsl(268 88% 65% / 0.22)" }}
        />
        <div
          className="absolute top-[10%] right-[-15%] w-[55%] h-[55%] rounded-full blur-[160px]"
          style={{ background: "hsl(45 100% 60% / 0.18)" }}
        />
        <div
          className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full blur-[160px]"
          style={{ background: "hsl(184 100% 55% / 0.16)" }}
        />
        <div
          className="absolute top-[40%] left-[35%] w-[40%] h-[40%] rounded-full blur-[180px]"
          style={{ background: "hsl(151 100% 50% / 0.08)" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.70)_100%)]" />
      </div>

      {/* Top HUD bar — premium variant */}
      <div className="relative z-20 border-b border-[hsl(45_100%_60%/0.30)] bg-background/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-[11px] sm:text-xs font-mono uppercase">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Versão gratuita</span>
            <span className="sm:hidden">Grátis</span>
          </Link>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-[hsl(45_100%_75%)]" />
            <span className="font-black tracking-[0.22em] bg-gradient-to-r from-[hsl(45_100%_75%)] to-[hsl(268_88%_70%)] bg-clip-text text-transparent">
              ORAKULUS IA · PREMIUM
            </span>
          </div>
          <div className="flex items-center gap-2 text-foreground tabular-nums">
            <Clock className="w-3.5 h-3.5 text-[hsl(45_100%_75%)]" />
            {time}
            <span className="text-[9px] text-muted-foreground ml-1 hidden sm:inline">BRT</span>
          </div>
        </div>
      </div>

      <main className="flex-1 relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5 pb-8">
        {/* ── System Status Header ── */}
        <section>
          <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-border/20">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary fv-blink shrink-0" />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Sistema Premium Ativo</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-primary/40 bg-primary/[0.06]">
                <span className="w-1 h-1 rounded-full bg-primary fv-blink shrink-0" />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-primary font-bold">Ao vivo</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[hsl(184_100%_55%/0.35)] bg-[hsl(184_100%_55%/0.05)]">
                <span className="w-1 h-1 rounded-full bg-[hsl(184_100%_55%)] fv-blink shrink-0" />
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[hsl(184_100%_65%)]">Leitura em tempo real</span>
              </span>
            </div>
          </div>
        </section>

        {/* ── Main Dashboard ── */}
        {loadingOp || !operation ? (
          <div className="space-y-4">
            <Skeleton className="h-[420px]" />
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
              <Skeleton className="h-20" />
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Signal ID strip */}
            <div className="flex items-center gap-2 sm:gap-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground flex-wrap">
              <span className="text-primary/70">SINAL #{signalId}</span>
              <span className="text-border/40">·</span>
              <StatusPill status={operation.status} />
              <span className="text-border/40">·</span>
              <span>{longDate}</span>
            </div>

            {/* Main grid: chart (left) + gauges (right) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* ── Chart column ── */}
              <div
                className="lg:col-span-2 bg-card/60 rounded-xl border border-border/50 p-3 sm:p-5 fv-card-neon fv-glass space-y-3"
              >
                {/* Asset + direction */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5">ATIVO ANALISADO · M1</div>
                    <div className="text-3xl sm:text-5xl font-black font-mono text-white tracking-tight leading-none">
                      {operation.asset || "—"}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {operation.direction === "CALL" ? (
                      <div
                        className="flex items-center gap-1.5 text-primary font-black text-xs sm:text-sm px-3 py-2 rounded border border-primary/50"
                        style={{ background: "hsl(151 100% 50% / 0.10)", boxShadow: "0 0 12px hsl(151 100% 50% / 0.30), inset 0 0 8px hsl(151 100% 50% / 0.06)" }}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        FORÇA COMPRADORA
                      </div>
                    ) : operation.direction === "PUT" ? (
                      <div
                        className="flex items-center gap-1.5 text-destructive font-black text-xs sm:text-sm px-3 py-2 rounded border border-destructive/50"
                        style={{ background: "hsl(345 100% 65% / 0.10)", boxShadow: "0 0 10px hsl(345 100% 65% / 0.25), inset 0 0 6px hsl(345 100% 65% / 0.06)" }}
                      >
                        <ArrowDownRight className="w-4 h-4" />
                        PRESSÃO VENDEDORA
                      </div>
                    ) : (
                      <div className="text-muted-foreground font-bold">—</div>
                    )}
                    <span className="text-[9px] font-mono px-2 py-1 rounded border border-border/40 text-muted-foreground hidden sm:flex items-center gap-1">
                      <Cpu className="w-2.5 h-2.5" /> ORAKULUS IA
                    </span>
                  </div>
                </div>

                {/* Chart with scanner overlays */}
                <div className="relative overflow-hidden rounded-lg">
                  <SignalChart />
                  <div
                    className="absolute top-0 bottom-0 w-[3px] fv-chart-scan pointer-events-none"
                    style={{ background: "linear-gradient(180deg, transparent, hsl(151 100% 50% / 0.65), transparent)" }}
                  />
                  <div
                    className="fv-hscan-beam pointer-events-none rounded"
                    style={{ background: "linear-gradient(90deg, transparent, hsl(184 100% 55% / 0.10), transparent)" }}
                  />
                  <div
                    className="absolute inset-x-0 pointer-events-none fv-soft-pulse"
                    style={{ top: "50%", height: "1px", background: "linear-gradient(90deg, transparent, hsl(151 100% 50% / 0.28), transparent)" }}
                  />
                </div>

                {/* Timing row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> ENTRADA
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-[hsl(45_100%_75%)] tabular-nums leading-none">
                      {operation.entryTime || "--:--"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> FECHAMENTO
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-secondary tabular-nums leading-none">
                      {operation.entryTime ? addMinutesHHMM(operation.entryTime, 1) : "--:--"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {countdown.state === "past" ? "FINALIZADO" : "CONTADOR"}
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums leading-none fv-soft-pulse">
                      {countdown.label}
                    </div>
                  </div>
                </div>

                {/* G1 tip */}
                <div className="mt-1 pt-3 border-t border-border/30 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/80 flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-secondary shrink-0" />
                  Caso necessário, usar{" "}
                  <span className="text-secondary font-bold">G1</span>
                </div>

              </div>

              {/* ── Gauges column ── */}
              <div className="flex flex-col gap-3">
                {/* Confidence gauge */}
                <div className="relative bg-card/60 rounded-xl border border-border/50 p-5 overflow-hidden fv-glass">
                  <div className="absolute inset-0 pointer-events-none opacity-8 fv-grid-bg" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Brain className="w-3 h-3 text-[hsl(45_100%_75%)]" /> Confiança IA
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[hsl(45_100%_60%/0.35)] bg-[hsl(45_100%_60%/0.08)] text-[hsl(45_100%_70%)]">
                        EST.
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <RadialGauge
                        value={operation.estimatedProbability}
                        label="Confiança"
                        hueFrom="45 100% 60%"
                        hueTo="268 88% 65%"
                        icon={Brain}
                        size={148}
                        showIcon={false}
                        tickCount={9}
                      />
                    </div>
                  </div>
                </div>

                {/* Assertiveness gauge */}
                <div className="relative bg-card/60 rounded-xl border border-primary/25 p-5 overflow-hidden fv-glass">
                  <div className="absolute inset-0 pointer-events-none opacity-10 fv-grid-bg" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <Target className="w-3 h-3 text-primary" /> Assertividade
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-primary/35 bg-primary/8 text-primary flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-primary fv-blink" /> LIVE
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <RadialGauge
                        value={stats?.winRateToday ?? 0}
                        label="Assertividade"
                        hueFrom="151 100% 50%"
                        hueTo="184 100% 55%"
                        icon={Target}
                        size={148}
                        showIcon={false}
                        tickCount={9}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-5 text-center font-mono">
                      <div className="rounded-lg bg-primary/8 py-2.5">
                        <div className="text-[8px] text-muted-foreground/70 uppercase tracking-widest mb-1">WIN</div>
                        <div className="text-base font-black text-primary tabular-nums">{countWins}</div>
                      </div>
                      <div className="rounded-lg py-2.5" style={{ background: "hsl(345 100% 55% / 0.14)" }}>
                        <div className="text-[8px] text-muted-foreground/70 uppercase tracking-widest mb-1">LOSS</div>
                        <div className="text-base font-black tabular-nums" style={{ color: "hsl(345 100% 70%)" }}>{countLosses}</div>
                      </div>
                      <div className="rounded-lg bg-muted/10 py-2.5">
                        <div className="text-[8px] text-muted-foreground/70 uppercase tracking-widest mb-1">TOTAL</div>
                        <div className="text-base font-black text-muted-foreground tabular-nums">{countTotal}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Metrics row ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Intensidade do Fluxo */}
              <div className="bg-card/50 rounded-xl border border-border/40 p-4 fv-glass">
                <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-primary" /> INTENSIDADE DO FLUXO
                </div>
                <div className="flex items-center justify-between">
                  <span className={`font-black text-2xl font-mono ${flow.color}`}>{flow.label.toUpperCase()}</span>
                  <div className="flex items-end gap-1 h-10">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`w-2 rounded-sm ${i <= flow.bars ? "bg-gradient-to-t from-primary to-[hsl(184_100%_55%)]" : "bg-muted/20"}`}
                        style={{
                          height: `${20 + i * 16}%`,
                          animation: i <= flow.bars ? "fv-wave 1.2s ease-in-out infinite" : "none",
                          animationDelay: `${i * 0.12}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Pressão de Mercado */}
              <div className="bg-card/50 rounded-xl border border-border/40 p-4 fv-glass">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Activity className="w-3 h-3 text-primary" /> PRESSÃO DE MERCADO
                  </div>
                  <span
                    className={`text-[8px] font-black font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                      buyerPct >= 50
                        ? "text-primary border-primary/40 bg-primary/10"
                        : "text-destructive border-destructive/40 bg-destructive/10"
                    }`}
                  >
                    {buyerPct >= 50 ? "DOMÍNIO COMPRADOR" : "DOMÍNIO VENDEDOR"}
                  </span>
                </div>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest mb-1">
                      <span className="text-primary">COMPRADORES</span>
                      <span className="text-primary tabular-nums">{buyerPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{
                          width: `${buyerPct}%`,
                          boxShadow: "0 0 8px hsl(151 100% 50% / 0.7)",
                          animation: buyerPct >= 50 ? "fv-wave 2s ease-in-out infinite" : "none",
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] font-mono uppercase tracking-widest mb-1">
                      <span className="text-destructive">VENDEDORES</span>
                      <span className="text-destructive tabular-nums">{100 - buyerPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                      <div
                        className="h-full bg-destructive rounded-full transition-all duration-1000"
                        style={{
                          width: `${100 - buyerPct}%`,
                          boxShadow: buyerPct < 50 ? "0 0 8px hsl(345 100% 65% / 0.7)" : undefined,
                          animation: buyerPct < 50 ? "fv-wave 2s ease-in-out infinite" : "none",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gatilhos Ativos */}
              <div className="bg-card/50 rounded-xl border border-border/40 p-4 fv-glass">
                <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-primary/70" /> Gatilhos Ativos
                </div>
                {operation.confirmations && operation.confirmations.length > 0 ? (
                  <ul className="space-y-3">
                    {operation.confirmations.map((conf, idx) => (
                      <li key={idx} className="text-[11px] font-mono flex items-start gap-2 text-foreground/75 leading-relaxed">
                        <span className="text-primary/50 text-xs shrink-0 mt-0.5">›</span>
                        {conf}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-xs text-muted-foreground font-mono">Aguardando leitura...</span>
                )}
              </div>
            </div>

            {/* Result celebration */}
            <AnimatePresence>
              {operation.status === "finalizada" && operation.result && (
                <ResultCelebration result={operation.result} />
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Premium history — full list */}
        {history && history.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2 border-b border-[hsl(45_100%_60%/0.30)] pb-3 flex-wrap">
              <Activity className="w-4 h-4 text-[hsl(45_100%_75%)]" /> Sinais Anteriores
              <span className="ml-1 px-2 py-0.5 rounded border border-[hsl(45_100%_60%/0.4)] bg-[hsl(45_100%_60%/0.10)] text-[hsl(45_100%_75%)] text-[10px] font-mono tracking-widest">
                PREMIUM · COMPLETO
              </span>
              <span className="ml-auto text-[10px] font-mono text-muted-foreground tracking-widest">
                {history.length} REGISTROS
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {history.map((item) => {
                const lower = item.result.toLowerCase();
                const isWin = lower.includes("win");
                const isLoss = lower.includes("loss");
                const displayResult = item.result || "—";
                return (
                  <div
                    key={item.id}
                    className="bg-card/60 border border-border rounded-xl p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-bold font-mono text-sm text-white">{item.asset}</span>
                      <span
                        className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${
                          item.direction === "CALL"
                            ? "text-primary border-primary/40 bg-primary/10"
                            : "text-destructive border-destructive/40 bg-destructive/10"
                        }`}
                      >
                        {dirLabel(item.direction)}
                      </span>
                    </div>
                    <div className="flex justify-between items-end mt-auto">
                      <span className="text-[10px] sm:text-xs text-muted-foreground font-mono uppercase tracking-widest">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {item.entryTime}
                      </span>
                      <span
                        className={`font-black font-mono text-sm tracking-wider ${
                          isWin
                            ? "text-primary fv-neon-text"
                            : isLoss
                              ? "text-destructive fv-neon-text-red"
                              : "text-white"
                        }`}
                      >
                        {displayResult}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[hsl(45_100%_60%/0.20)] bg-black/70 py-6 sm:py-8 relative z-10">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <OrakulusLogo className="w-5 h-5" />
            <span className="font-black tracking-[0.22em] bg-gradient-to-r from-[hsl(45_100%_75%)] to-[hsl(268_88%_70%)] bg-clip-text text-transparent text-sm">
              ORAKULUS IA · PREMIUM
            </span>
          </div>
          <div className="flex items-center justify-center text-muted-foreground">
            <AlertTriangle className="w-4 h-4 text-secondary mr-2" />
            <span className="font-bold uppercase tracking-[0.2em] text-xs">Aviso de Risco</span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground/70 max-w-3xl mx-auto leading-relaxed">
            Mercado de renda variável envolve riscos. Resultados passados não garantem resultados futuros. As informações apresentadas são educacionais e não representam promessa de lucro.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-[10px] font-mono text-muted-foreground/70 hover:text-foreground uppercase tracking-widest"
          >
            <ChevronLeft className="w-3 h-3" />
            Voltar para versão gratuita
          </Link>
        </div>
      </footer>
    </div>
  );
}
