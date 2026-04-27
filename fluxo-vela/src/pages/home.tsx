import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import GateRegisterForm from "@/components/GateRegisterForm";
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
  Users,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Radio,
  ChevronRight,
  Send,
  Cpu,
  Eye,
  Sparkles,
  Brain,
  LineChart,
  Lightbulb,
  TrendingDown,
  Trophy,
  XCircle,
  Award,
  Target,
  CalendarDays,
  Lock,
  Star,
  Crown,
  Infinity as InfinityIcon,
  Bell,
  User,
  Mail,
  Building2,
  Banknote,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const WHATSAPP_MESSAGE =
  "Quero acessar os sinais ao vivo da ORAKULUS IA — fluxo de vela.";
export const FALLBACK_WHATSAPP = `https://wa.me/?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export function buildWhatsappLink(base?: string) {
  if (!base) return FALLBACK_WHATSAPP;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
}

/**
 * Translate the internal direction code (CALL/PUT) to the
 * Brazilian-Portuguese trading vocabulary expected by the user.
 *  CALL → COMPRA, PUT → VENDA.
 */
export function dirLabel(d: string): string {
  if (d === "CALL") return "COMPRA";
  if (d === "PUT") return "VENDA";
  return d || "--";
}

/** Add `n` minutes to an HH:MM string, wrapping at 24h. */
export function addMinutesHHMM(hhmm: string, n: number): string {
  if (!hhmm || !hhmm.includes(":")) return "--:--";
  const [h, m] = hhmm.split(":").map(Number);
  const total = ((h ?? 0) * 60 + (m ?? 0) + n + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// ───── Brasília time helpers ─────
export function brasiliaParts() {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const [hh, mm, ss] = fmt.format(now).split(":").map(Number);
  return { hh: hh ?? 0, mm: mm ?? 0, ss: ss ?? 0 };
}

export function brasiliaSecondsOfDay() {
  const { hh, mm, ss } = brasiliaParts();
  return hh * 3600 + mm * 60 + ss;
}

export function entryToSeconds(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return ((h ?? 0) * 60 + (m ?? 0)) * 60;
}

export function useBrasiliaClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  }).format(now);
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(now);
  // Long form used in the hero badge — e.g. "Quinta · 25 de Abril · 2026"
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    timeZone: "America/Sao_Paulo",
  }).format(now);
  const dayMonth = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(now);
  const year = new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(now);
  const longDate = `${weekday} · ${dayMonth} · ${year}`;
  return { time, date, longDate };
}

export function useCountdown(entryTime?: string) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!entryTime) return;
    const tick = () => {
      const nowSec = brasiliaSecondsOfDay();
      const entrySec = entryToSeconds(entryTime);
      let diff = entrySec - nowSec;
      if (diff < -43200) diff += 86400;
      if (diff > 43200) diff -= 86400;
      setSecondsLeft(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [entryTime]);

  if (secondsLeft === null) return { label: "--:--", state: "idle" as const };
  const abs = Math.abs(secondsLeft);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  const label = `${secondsLeft < 0 ? "-" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  let state: "soon" | "live" | "past" | "wait" = "wait";
  if (secondsLeft <= -60) state = "past";
  else if (secondsLeft <= 60 && secondsLeft >= -60) state = "live";
  else if (secondsLeft <= 180) state = "soon";
  return { label, state, secondsLeft };
}

/** Slowly fluctuates a number between min and max, changing every `ms` ms */
export function useFluctuation(min: number, max: number, ms = 5000) {
  const [val, setVal] = useState(() => min + Math.floor(Math.random() * (max - min + 1)));
  useEffect(() => {
    const id = setInterval(() => {
      setVal((prev) => {
        const next = min + Math.floor(Math.random() * (max - min + 1));
        return next === prev ? (next < max ? next + 1 : next - 1) : next;
      });
    }, ms);
    return () => clearInterval(id);
  }, [min, max, ms]);
  return val;
}

export function StatusPill({ status }: { status?: string }) {
  if (!status) return null;
  const map: Record<string, { label: string; cls: string }> = {
    aguardando: {
      label: "FLUXO SENDO VALIDADO EM TEMPO REAL",
      cls: "bg-secondary/10 text-secondary border-secondary/40",
    },
    liberada: {
      label: "ENTRADA LIBERADA",
      cls: "bg-primary/15 text-primary border-primary/50 fv-glow-green",
    },
    finalizada: {
      label: "OPERAÇÃO CONCLUÍDA",
      cls: "bg-muted/40 text-muted-foreground border-border",
    },
  };
  const cfg = map[status] ?? { label: status.toUpperCase(), cls: "" };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border uppercase font-bold tracking-[0.18em] text-[10px] sm:text-xs ${cfg.cls}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 fv-blink" />
      {cfg.label}
    </span>
  );
}

export function OrakulusLogo({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <defs>
        <linearGradient id="ok-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(151, 100%, 50%)" />
          <stop offset="50%" stopColor="hsl(184, 100%, 55%)" />
          <stop offset="100%" stopColor="hsl(268, 88%, 65%)" />
        </linearGradient>
      </defs>
      <path
        d="M20 3 L36 20 L20 37 L4 20 Z"
        fill="none"
        stroke="url(#ok-grad)"
        strokeWidth="1.6"
      />
      <circle cx="20" cy="20" r="6" fill="none" stroke="url(#ok-grad)" strokeWidth="1.6" />
      <circle cx="20" cy="20" r="2.2" fill="hsl(151, 100%, 50%)" />
      <line x1="20" y1="3" x2="20" y2="11" stroke="url(#ok-grad)" strokeWidth="1.2" />
      <line x1="20" y1="29" x2="20" y2="37" stroke="url(#ok-grad)" strokeWidth="1.2" />
      <line x1="3" y1="20" x2="11" y2="20" stroke="url(#ok-grad)" strokeWidth="1.2" />
      <line x1="29" y1="20" x2="37" y2="20" stroke="url(#ok-grad)" strokeWidth="1.2" />
    </svg>
  );
}

export function AIWave() {
  return (
    <div className="flex items-center gap-1 h-5">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="fv-wave-bar h-full"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </div>
  );
}

/**
 * Decorative IA panel:
 *   - Row of 14 candles (green/red) gently floating up/down at staggered delays
 *   - Horizontal baseline + drifting grid pattern for parallax
 *   - Wide cyan/violet "X-ray" sweep that crosses the candles in screen blend
 *   - Sharp green vertical scan beam (laser) for "varredura"
 *   - Big ORAKULUS IA watermark
 * Purely cosmetic — does NOT simulate price, so it never contradicts the
 * real broker outcome.
 */
export function SignalChart() {
  const W = 600;
  const H = 200;
  const baseY = 120;

  // Pre-defined candle layout: alternating up/down with varying body heights
  // and wick lengths. Same shapes every render so the panel feels like an
  // instrument, not random noise.
  const candles = useMemo(() => {
    const heights = [38, 62, 26, 70, 44, 56, 32, 74, 48, 60, 34, 66, 42, 58];
    const N = heights.length;
    const left = 28;
    const right = W - 28;
    const span = right - left;
    const slot = span / N;
    const cw = Math.min(20, slot * 0.55);
    return heights.map((h, i) => {
      const isUp = i % 2 === 0;
      const x = left + slot * (i + 0.5);
      // Up candles grow up from baseline, down candles grow down.
      const bodyTop = isUp ? baseY - h : baseY;
      const bodyHeight = h;
      const wickExtra = 14 + (i % 3) * 6;
      const wickTop = isUp ? bodyTop - wickExtra : baseY - 6;
      const wickBot = isUp ? baseY + 6 : bodyTop + bodyHeight + wickExtra;
      const delay = (i * 0.18) % 2.4;
      return { x, cw, bodyTop, bodyHeight, wickTop, wickBot, isUp, delay };
    });
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-primary/40 bg-black/70">
      {/* Top label strip */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest bg-gradient-to-b from-black/80 to-transparent">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Cpu className="w-3 h-3 text-primary" />
          <span className="text-primary font-black tracking-[0.25em] fv-neon-text">
            ORAKULUS IA
          </span>
          <span className="hidden sm:inline text-muted-foreground/70">// PROCESSAMENTO DE FLUXO EM TEMPO REAL</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary fv-blink" />
          <span className="px-1.5 py-0.5 rounded border border-primary/50 bg-primary/10 text-primary font-black tracking-widest">
            M1
          </span>
        </span>
      </div>

      {/* Drifting grid (under SVG) */}
      <div
        className="pointer-events-none absolute inset-0 fv-grid-drift"
        style={{
          backgroundImage:
            "linear-gradient(hsl(151 100% 50% / 0.07) 1px, transparent 1px), linear-gradient(90deg, hsl(151 100% 50% / 0.07) 1px, transparent 1px)",
          backgroundSize: "40px 30px",
        }}
      />

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="relative block w-full h-36 sm:h-44"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="fv-green-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(151 100% 65%)" />
            <stop offset="100%" stopColor="hsl(151 100% 38%)" />
          </linearGradient>
          <linearGradient id="fv-red-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(345 100% 70%)" />
            <stop offset="100%" stopColor="hsl(345 100% 45%)" />
          </linearGradient>
          <filter id="fv-candle-glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="fv-radar-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Buy zone band — subtle */}
        <rect x="20" y={baseY - 80} width={W - 40} height="36" fill="hsl(151 100% 50% / 0.025)" rx="2" />
        <text x="26" y={baseY - 68} fill="hsl(151 100% 55% / 0.28)" fontSize="7" fontFamily="monospace" fontWeight="600" letterSpacing="2">ZONA DE COMPRA</text>

        {/* Sell zone band — subtle */}
        <rect x="20" y={baseY + 18} width={W - 40} height="30" fill="hsl(345 100% 55% / 0.025)" rx="2" />
        <text x="26" y={baseY + 34} fill="hsl(345 100% 65% / 0.28)" fontSize="7" fontFamily="monospace" fontWeight="600" letterSpacing="2">ZONA DE VENDA</text>

        {/* Horizontal baseline — glowing */}
        <line
          x1="20"
          y1={baseY}
          x2={W - 20}
          y2={baseY}
          stroke="hsl(151 100% 50% / 0.22)"
          strokeWidth="3"
          filter="url(#fv-candle-glow)"
        />
        <line
          x1="20"
          y1={baseY}
          x2={W - 20}
          y2={baseY}
          stroke="hsl(151 100% 50% / 0.55)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Candles (each one floats with a staggered delay) */}
        {candles.map((c, i) => (
          <g
            key={i}
            className="fv-candle-float"
            style={{ animationDelay: `${c.delay}s` }}
            filter="url(#fv-candle-glow)"
          >
            <line
              x1={c.x}
              y1={c.wickTop}
              x2={c.x}
              y2={c.wickBot}
              stroke={c.isUp ? "hsl(151 100% 60%)" : "hsl(345 100% 65%)"}
              strokeWidth="1.6"
              opacity="0.9"
            />
            <rect
              x={c.x - c.cw / 2}
              y={c.bodyTop}
              width={c.cw}
              height={c.bodyHeight}
              rx="2.5"
              fill={c.isUp ? "url(#fv-green-body)" : "url(#fv-red-body)"}
              stroke={c.isUp ? "hsl(151 100% 80%)" : "hsl(345 100% 80%)"}
              strokeWidth="1.2"
            />
          </g>
        ))}

        {/* Radar circle on last candle */}
        {candles.length > 0 && (() => {
          const last = candles[candles.length - 1]!;
          const dotY = last.isUp ? last.bodyTop : last.bodyTop + last.bodyHeight;
          return (
            <g filter="url(#fv-radar-glow)">
              <circle cx={last.x} cy={dotY} r="7" fill="none" stroke="hsl(151 100% 60% / 0.7)" strokeWidth="1.5" className="fv-soft-pulse" />
              <circle cx={last.x} cy={dotY} r="3" fill="hsl(151 100% 70%)" opacity="0.9" />
              <line x1={last.x - 14} y1={dotY} x2={last.x + 14} y2={dotY} stroke="hsl(151 100% 55% / 0.5)" strokeWidth="0.8" />
              <line x1={last.x} y1={dotY - 14} x2={last.x} y2={dotY + 14} stroke="hsl(151 100% 55% / 0.5)" strokeWidth="0.8" />
            </g>
          );
        })()}

        {/* Big ORAKULUS IA watermark in the center-bottom */}
        <text
          x={W / 2}
          y={H - 14}
          textAnchor="middle"
          fill="hsl(184 100% 55% / 0.55)"
          fontSize="11"
          fontFamily="monospace"
          fontWeight="800"
          letterSpacing="8"
        >
          ORAKULUS IA
        </text>
      </svg>

      {/* X-ray sweep — wide cyan/violet band that crosses the candles */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full">
        <div
          className="fv-xray-sweep absolute top-0 bottom-0 w-[110px] sm:w-[140px]"
          style={{
            background:
              "linear-gradient(to right, transparent 0%, hsl(184 100% 55% / 0.18) 25%, hsl(268 88% 65% / 0.42) 50%, hsl(184 100% 55% / 0.18) 75%, transparent 100%)",
            boxShadow:
              "0 0 22px hsl(184 100% 55% / 0.35), inset 0 0 24px hsl(268 88% 65% / 0.25)",
          }}
        />
      </div>

      {/* Vertical green scanning beam (laser) */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full">
        <div
          className="fv-chart-scan absolute top-0 bottom-0 w-[3px]"
          style={{
            background:
              "linear-gradient(to bottom, transparent, hsl(151 100% 50%) 50%, transparent)",
            boxShadow:
              "0 0 12px hsl(151 100% 50% / 0.9), 0 0 28px hsl(151 100% 50% / 0.5)",
          }}
        />
      </div>

      {/* Bottom corner labels */}
      <div className="absolute bottom-1 left-2 text-[9px] font-mono text-muted-foreground/70 uppercase tracking-widest flex items-center gap-1">
        <Radio className="w-2.5 h-2.5 text-primary fv-blink" />
        VARREDURA · RAIO-X ATIVO
      </div>
      <div className="absolute bottom-1 right-2 text-[9px] font-mono text-primary/80 uppercase tracking-widest flex items-center gap-1">
        <span className="w-1 h-1 rounded-full bg-primary fv-blink inline-block" />
        AO VIVO
      </div>
    </div>
  );
}

/**
 * Futuristic radial gauge — animated stroke arc, glow, optional needle.
 * Used for both "Confiança da IA" and "Assertividade do dia".
 */
export function RadialGauge({
  value,
  label,
  caption,
  hueFrom = "151 100% 50%",
  hueTo = "184 100% 55%",
  icon: Icon = Brain,
  size = 180,
  showIcon = true,
  tickCount = 21,
}: {
  value: number;
  label: string;
  caption?: string;
  hueFrom?: string;
  hueTo?: string;
  icon?: React.ComponentType<{ className?: string }>;
  size?: number;
  showIcon?: boolean;
  tickCount?: number;
}) {
  const safe = Math.max(0, Math.min(100, value));
  const strokeWidth = 10;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // 3/4 arc (270 degrees) for a half-moon dial feel
  const arcSpan = 270;
  const arcStart = 135; // start angle (deg)
  const circumference = (arcSpan / 360) * (2 * Math.PI * r);
  const offset = circumference * (1 - safe / 100);

  // Tick marks placed along the arc
  const ticks = Array.from({ length: tickCount }).map((_, i) => {
    const t = i / Math.max(1, tickCount - 1);
    const ang = (arcStart + t * arcSpan) * (Math.PI / 180);
    const x1 = cx + Math.cos(ang) * (r - strokeWidth / 2 - 8);
    const y1 = cy + Math.sin(ang) * (r - strokeWidth / 2 - 8);
    const x2 = cx + Math.cos(ang) * (r - strokeWidth / 2 - 2);
    const y2 = cy + Math.sin(ang) * (r - strokeWidth / 2 - 2);
    const active = t <= safe / 100;
    return { x1, y1, x2, y2, active };
  });

  const gradId = useMemo(
    () => `gauge-grad-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="fv-gauge-spin-slow"
        style={{ overflow: "hidden" }}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`hsl(${hueFrom})`} />
            <stop offset="60%" stopColor={`hsl(${hueTo})`} />
            <stop offset="100%" stopColor="hsl(268 88% 65%)" />
          </linearGradient>
          <filter id={`${gradId}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background arc track */}
        <g
          transform={`rotate(${arcStart} ${cx} ${cy})`}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="hsl(0 0% 100% / 0.07)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${2 * Math.PI * r}`}
          />
          {/* Animated value arc */}
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${2 * Math.PI * r}`}
            strokeDashoffset={offset}
            filter={`url(#${gradId}-glow)`}
            style={{ transition: "stroke-dashoffset 0.9s ease-out" }}
          />
        </g>

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={t.active ? `hsl(${hueFrom})` : "hsl(0 0% 100% / 0.12)"}
            strokeWidth={t.active ? 2 : 1}
            strokeLinecap="round"
          />
        ))}
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {showIcon && <Icon className="w-4 h-4 mb-1 text-primary fv-blink" />}
        <AnimatePresence mode="wait">
          <motion.div
            key={safe}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.25 }}
            className={`font-black fv-ai-text font-mono tabular-nums leading-none ${showIcon ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl"}`}
          >
            {safe}
            <span className={showIcon ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}>%</span>
          </motion.div>
        </AnimatePresence>
        <div className={`font-mono uppercase tracking-[0.2em] text-muted-foreground text-center px-3 ${showIcon ? "mt-1 text-[9px] sm:text-[10px]" : "mt-1.5 text-[10px] sm:text-[11px]"}`}>
          {label}
        </div>
        {caption && showIcon && (
          <div className="mt-0.5 text-[8px] sm:text-[9px] font-mono uppercase tracking-widest text-muted-foreground/70">
            {caption}
          </div>
        )}
      </div>
    </div>
  );
}

/** Big WIN / LOSS celebration banner with particle burst */
export function ResultCelebration({ result }: { result: string }) {
  const lower = result.toLowerCase();
  const isWin = lower.includes("win");
  const isLoss = lower.includes("loss");
  const isG1 = lower.includes("g1") || lower.includes("gale");
  const isDireto = isWin && lower.includes("direto");
  if (!isWin && !isLoss) return null;

  const Icon = isWin ? (isG1 ? Award : Trophy) : XCircle;
  const headline = isWin
    ? isG1
      ? "VITÓRIA NO GALE 1"
      : isDireto
        ? "LEITURA VALIDADA PELO SISTEMA"
        : "OPERAÇÃO VENCEDORA"
    : "OPERAÇÃO PERDIDA";
  const subtitle = isWin
    ? isG1
      ? "Entrada recuperada no G1 · ORAKULUS IA"
      : "Sinal validado pela ORAKULUS IA"
    : "Próxima entrada já em análise";

  // Pre-computed particle directions for the burst
  const particles = Array.from({ length: 14 }).map((_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const dist = 80 + (i % 3) * 30;
    return {
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist,
      delay: i * 0.04,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 sm:p-8 text-center fv-result-pop ${
        isWin
          ? "border-primary/60 from-primary/15 via-primary/5 to-transparent fv-glow-green"
          : "border-destructive/60 from-destructive/15 via-destructive/5 to-transparent fv-glow-red"
      }`}
    >
      {/* Particle burst */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        {particles.map((p, i) => (
          <span
            key={i}
            className={`fv-burst absolute block w-2 h-2 rounded-full ${
              isWin ? "bg-primary" : "bg-destructive"
            }`}
            style={{
              ["--dx" as unknown as string]: `${p.dx}px`,
              ["--dy" as unknown as string]: `${p.dy}px`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <Icon
        className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 ${
          isWin
            ? "text-primary fv-result-glow-green"
            : "text-destructive fv-result-glow-red"
        }`}
      />
      <div
        className={`text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] mb-2 ${
          isWin ? "text-primary" : "text-destructive"
        }`}
      >
        {subtitle}
      </div>
      <h3
        className={`text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-2 ${
          isWin ? "text-primary fv-neon-text" : "text-destructive fv-neon-text-red"
        }`}
      >
        {headline}
      </h3>
      <div
        className={`inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-full border font-mono uppercase tracking-widest text-sm font-black ${
          isWin
            ? "bg-primary/10 text-primary border-primary/40"
            : "bg-destructive/10 text-destructive border-destructive/40"
        }`}
      >
        <Activity className="w-4 h-4" /> {result}
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { time, date, longDate } = useBrasiliaClock();

  const { data: operation, isLoading: loadingOp } = useGetOperation({
    query: { refetchInterval: 4000, queryKey: getGetOperationQueryKey() },
  });

  const { data: stats } = useGetOperationStats({
    query: { refetchInterval: 5000, queryKey: ["/api/operation/stats"] },
  });

  const { data: history } = useGetOperationHistory({
    query: { refetchInterval: 8000, queryKey: ["/api/operation/history"] },
  });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Session-based auth
  const { user, logout, refreshUser } = useAuth();
  const [, navigate] = useLocation();
  const isCadastrado = user !== null;
  const userPlan = user?.plano ?? "FREE";
  const userValidacao = user?.status_validacao ?? null;
  const userExpiracao = user?.data_expiracao ?? null;

  // Progressive signal gate
  const LIMIT_ANON = 5;
  const [signalsConsumed, setSignalsConsumed] = useState<number>(() => {
    try { return parseInt(localStorage.getItem("orakulus_sinais") ?? "0", 10) || 0; } catch { return 0; }
  });
  const [gatePhase, setGatePhase] = useState<"login" | "pending" | "premium" | null>(null);
  const lastCountedRef = useRef<string>("");

  // Sync sinais_consumidos from session user (on login)
  useEffect(() => {
    if (!user) return;
    const backendCount = user.sinais_consumidos ?? 0;
    setSignalsConsumed(prev => {
      const merged = Math.max(prev, backendCount);
      try { localStorage.setItem("orakulus_sinais", String(merged)); } catch {}
      return merged;
    });
  }, [user?.id]);

  const isValidado = userValidacao === "APROVADO";
  const isPremium = userPlan === "PREMIUM" && isValidado;

  const premiumDaysLeft: number | null = (() => {
    if (!isPremium || !userExpiracao) return null;
    const diff = new Date(userExpiracao).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })();

  // Per-user progressive signal limit
  const sinaisExtras = user?.sinais_extras_liberados ?? 0;
  const signalLimit = isPremium ? Infinity : (isValidado && isCadastrado) ? LIMIT_ANON + sinaisExtras : LIMIT_ANON;
  const signalsLeft = Math.max(0, signalLimit - signalsConsumed);
  const displayLimit = signalLimit === Infinity ? Infinity : signalLimit;

  // Gate trigger
  useEffect(() => {
    if (isPremium) { setGatePhase(null); return; }
    if (signalsConsumed >= signalLimit && signalLimit !== Infinity) {
      if (!isCadastrado) setGatePhase("login");
      else if (userValidacao === "PENDENTE") setGatePhase("pending");
      else setGatePhase("premium");
    } else {
      setGatePhase(null);
    }
  }, [signalsConsumed, signalLimit, isPremium, isCadastrado, userValidacao]);

  const whatsappLink = buildWhatsappLink(operation?.whatsappLink);
  const goWhats = () => window.open(whatsappLink, "_blank", "noopener");
  const onCardKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goWhats();
    }
  };

  const countdown = useCountdown(operation?.entryTime);
  const watchersSignal = useFluctuation(18, 37, 5500);
  const watchersHero = useFluctuation(41, 68, 7000);
  const watchersUpgrade = useFluctuation(28, 54, 6200);

  const flowMap: Record<string, { label: string; bars: number; color: string }> = {
    Alta: { label: "Alta", bars: 5, color: "text-primary" },
    Media: { label: "Média", bars: 3, color: "text-secondary" },
    Baixa: { label: "Baixa", bars: 2, color: "text-muted-foreground" },
  };
  const flow = operation
    ? flowMap[operation.flowStrength] ?? { label: "—", bars: 0, color: "text-muted-foreground" }
    : { label: "—", bars: 0, color: "text-muted-foreground" };

  const signalId = useMemo(() => {
    if (!operation) return "------";
    const seed = `${operation.asset}${operation.entryTime}${operation.direction}`;
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return h.toString(16).slice(0, 6).toUpperCase().padStart(6, "0");
  }, [operation]);

  // Track each new unique signal and increment counter (must be AFTER signalId)
  useEffect(() => {
    if (!signalId || signalId === "------") return;
    if (isPremium) return;
    if (lastCountedRef.current === signalId) return;
    lastCountedRef.current = signalId;
    setSignalsConsumed(prev => {
      const next = prev + 1;
      try { localStorage.setItem("orakulus_sinais", String(next)); } catch {}
      if (isCadastrado && user?.email) {
        fetch("/api/users/sinais", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: user.email, sinais_consumidos: next }),
        }).catch(() => {});
      }
      return next;
    });
  }, [signalId, isPremium, isCadastrado]);

  // Ticker: combine current + recent history
  const tickerItems = useMemo(() => {
    const items: { asset: string; direction: string; result?: string }[] = [];
    if (operation?.asset)
      items.push({ asset: operation.asset, direction: operation.direction });
    (history ?? []).slice(0, 10).forEach((h) =>
      items.push({ asset: h.asset, direction: h.direction, result: h.result }),
    );
    if (items.length === 0) return [];
    return [...items, ...items];
  }, [operation, history]);

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col font-sans relative">

      {/* ── SIGNAL GATE MODAL ── */}
      <AnimatePresence>
        {gatePhase && (
          <motion.div
            key="gate-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ backdropFilter: "blur(12px)", background: "rgba(0,0,0,0.82)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl border border-border/60 bg-[#0a0a0a] shadow-[0_0_80px_rgba(0,0,0,0.9)]"
            >
              {gatePhase === "login" ? (
                /* ── Phase: not logged in — inline 3-step register form ── */
                <GateRegisterForm
                  onSuccess={async () => { await refreshUser(); }}
                  onLoginClick={() => navigate("/login")}
                />
              ) : gatePhase === "pending" ? (
                /* ── Phase: logged in but PENDENTE ── */
                <div className="p-7 text-center space-y-5">
                  <motion.div animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-full bg-yellow-900/30 border-2 border-yellow-500/60 flex items-center justify-center mx-auto shadow-[0_0_22px_hsl(45_100%_60%/0.25)]">
                    <span className="text-3xl">⏳</span>
                  </motion.div>
                  <div>
                    <h2 className="text-lg font-black text-yellow-400 mb-1.5">Seu acesso está sendo validado</h2>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      Estamos conferindo seu ID e primeiro depósito no painel da corretora.<br />
                      Assim que aprovado, seu acesso gratuito será liberado automaticamente.
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
                  <button onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-yellow-700/50 text-yellow-400 text-sm font-semibold hover:bg-yellow-900/20 transition-all active:scale-95">
                    ↻ Atualizar acesso
                  </button>
                </div>
              ) : (
                /* ── Phase: FREE extras exhausted — Premium CTA ── */
                <div className="p-6 text-center space-y-4">
                  <div className="text-3xl">🏁</div>
                  <h2 className="text-lg font-black text-white">Seu acesso gratuito chegou ao limite</h2>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Para continuar recebendo sinais ilimitados, ative a ORAKULUS IA PREMIUM.
                  </p>
                  <div className="bg-[#111] rounded-xl border border-border/40 p-4 text-left space-y-2">
                    {["✔ Sinais ilimitados", "✔ Leitura completa do fluxo", "✔ Entradas mais antecipadas", "✔ Acesso total ao sistema"].map(l => (
                      <div key={l} className="text-xs text-foreground/80 font-mono">{l}</div>
                    ))}
                  </div>
                  <a
                    href="https://pay.cakto.com.br/37p22ov_864096"
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[hsl(45_100%_60%)] via-[hsl(45_100%_70%)] to-[hsl(45_100%_60%)] text-black font-black uppercase tracking-[0.15em] text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-[0_0_28px_hsl(45_100%_60%/0.50)]"
                  >
                    🚀 ATIVAR PREMIUM AGORA
                  </a>
                  <p className="text-[10px] text-muted-foreground/40">Menos de R$3 por dia · Acesso imediato</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background layers */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 fv-grid-bg opacity-50" />
        <div className="absolute top-[-25%] left-[-10%] w-[55%] h-[55%] rounded-full bg-primary/10 blur-[140px]" />
        <div
          className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[160px]"
          style={{ background: "hsl(184 100% 55% / 0.10)" }}
        />
        <div
          className="absolute bottom-[-20%] left-[20%] w-[55%] h-[55%] rounded-full blur-[160px]"
          style={{ background: "hsl(268 88% 65% / 0.08)" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.55)_100%)]" />
      </div>

      {/* Top HUD bar */}
      <div className="relative z-20 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-[11px] sm:text-xs font-mono uppercase">
          <div className="flex items-center gap-2">
            <OrakulusLogo className="w-5 h-5" />
            <span className="font-black tracking-[0.22em] fv-ai-text">
              ORAKULUS IA
            </span>
            <span className="hidden sm:inline text-muted-foreground">
              // INTELIGÊNCIA DE FLUXO
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground">
            <span className="hidden md:inline">{date}</span>
            <span className="flex items-center gap-1.5 text-foreground tabular-nums">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {time}
              <span className="text-[9px] text-muted-foreground ml-1">BRT</span>
            </span>
            {isPremium ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-[hsl(45_100%_60%/0.7)] bg-gradient-to-r from-[hsl(45_100%_60%/0.18)] to-[hsl(268_88%_65%/0.18)] text-[hsl(45_100%_75%)] font-black tracking-[0.18em] text-[10px] uppercase">
                <Crown className="w-3 h-3" /> 👑 PREMIUM
              </span>
            ) : (
              <a href="https://pay.cakto.com.br/37p22ov_864096"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-[hsl(45_100%_60%/0.5)] bg-gradient-to-r from-[hsl(45_100%_60%/0.18)] to-[hsl(268_88%_65%/0.18)] text-[hsl(45_100%_75%)] font-black tracking-[0.18em] text-[10px] uppercase hover:scale-[1.03] active:scale-[0.97] transition-transform">
                <Sparkles className="w-3 h-3" /> Premium
              </a>
            )}
            {user ? (
              <button onClick={() => { void logout().then(() => navigate("/login")); }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-border/50 text-muted-foreground/60 hover:text-foreground hover:border-border/80 text-[10px] uppercase tracking-widest transition-colors">
                Sair
              </button>
            ) : (
              <button onClick={() => navigate("/login")}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-primary/50 bg-primary/10 text-primary font-semibold text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-colors">
                Entrar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live ticker */}
      {tickerItems.length > 0 && (
        <div className="relative z-10 border-b border-border/40 bg-black/40 overflow-hidden">
          <div className="fv-marquee py-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-widest">
            {tickerItems.map((t, i) => (
              <span key={i} className="px-5 flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                <span className="text-primary">●</span>
                <span className="text-foreground/90">{t.asset}</span>
                <span
                  className={
                    t.direction === "CALL" ? "text-primary" : "text-destructive"
                  }
                >
                  {dirLabel(t.direction)}
                </span>
                {t.result && (
                  <span
                    className={
                      t.result.toLowerCase().includes("win")
                        ? "text-primary"
                        : t.result.toLowerCase().includes("loss")
                          ? "text-destructive"
                          : "text-muted-foreground"
                    }
                  >
                    {t.result}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 space-y-12 sm:space-y-16 pb-32 sm:pb-16">

        {/* Hero */}
        <section className="text-center space-y-5 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-5">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/5 fv-ai-glow">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="font-mono uppercase tracking-[0.25em] text-[10px] sm:text-xs text-primary">
                  Leitura em tempo real
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-secondary/40 bg-secondary/5">
                <CalendarDays className="w-3.5 h-3.5 text-secondary" />
                <span className="font-mono uppercase tracking-[0.2em] text-[10px] sm:text-xs text-secondary">
                  {longDate}
                </span>
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.08]">
              Você não perde por falta de estratégia…
              <br />
              <span className="fv-ai-text">você perde por entrar atrasado no fluxo.</span>
            </h1>
            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              A <span className="text-primary font-bold">ORAKULUS IA</span>{" "}
              analisa cenário, força e intenção do preço em tempo real para identificar possíveis oportunidades antes da maioria agir.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm font-mono text-muted-foreground">
              <span className="flex items-center gap-2">
                <span>⏳</span>
                <span>Novas leituras sendo analisadas em tempo real</span>
              </span>
              <span className="hidden sm:inline text-muted-foreground/30">·</span>
              <span className="flex items-center gap-2">
                <span>👁</span>
                <span>+{watchersHero} pessoas acompanhando o mercado agora</span>
              </span>
            </div>
          </motion.div>
        </section>

        {/* FREE / PREMIUM STATUS BANNER */}
        <section>
          <div className={`relative overflow-hidden rounded-2xl border px-4 sm:px-6 py-4 ${isPremium ? "border-[hsl(45_100%_60%/0.5)] bg-gradient-to-r from-[hsl(45_100%_60%/0.08)] via-black/60 to-[hsl(268_88%_65%/0.08)]" : "border-secondary/40 bg-gradient-to-r from-secondary/5 via-black/60 to-secondary/5"}`}>
            <div className="absolute inset-0 pointer-events-none opacity-20 fv-grid-bg" />
            <div className="relative flex flex-col gap-3 w-full">
              {/* Row 1 — identity + counter */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {isPremium ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(45_100%_60%/0.7)] bg-[hsl(45_100%_60%/0.12)] text-[hsl(45_100%_75%)] font-mono font-black tracking-[0.2em] text-[10px] uppercase shrink-0">
                      <Crown className="w-3 h-3" /> 👑 PREMIUM ATIVO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-secondary/50 bg-secondary/10 text-secondary font-mono font-black tracking-[0.2em] text-[10px] uppercase shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary fv-blink" /> VERSÃO GRATUITA
                    </span>
                  )}
                  <span className="text-sm text-foreground/90 leading-snug">
                    {isPremium
                      ? <>Acesso completo ativo na <span className="text-[hsl(45_100%_75%)] font-bold">ORAKULUS IA</span></>
                      : isCadastrado && userValidacao === "PENDENTE"
                      ? <span className="text-yellow-400">⏳ Validando seu acesso — sinais gratuitos serão liberados em breve</span>
                      : isCadastrado && userValidacao === "RECUSADO"
                      ? <span className="text-red-400">❌ Cadastro não validado — crie sua conta pelo link oficial</span>
                      : <>Você está usando a versão gratuita da{" "}<span className="text-primary font-bold">ORAKULUS IA</span></>
                    }
                  </span>
                </div>
                {/* Signal counter — hidden for premium */}
                {!isPremium && (
                  <div className="bg-black/70 border border-secondary/40 rounded-xl px-4 py-2 flex items-center gap-3 shrink-0">
                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                        {isValidado && isCadastrado && sinaisExtras > 0 ? "Sinais extras restantes" : "Sinais restantes"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const totalDots = Math.min(signalsLeft, 5);
                          return (
                            <div
                              key={i}
                              className={`w-2.5 h-2.5 rounded-full border transition-all ${
                                i < totalDots
                                  ? "bg-secondary border-secondary shadow-[0_0_6px_hsl(184_100%_55%)]"
                                  : "bg-muted/20 border-muted/40"
                              }`}
                            />
                          );
                        })}
                        <span className="ml-1 font-black font-mono text-sm tabular-nums text-foreground">
                          {signalsLeft === Infinity ? "∞" : signalsLeft}/{displayLimit === Infinity ? "∞" : displayLimit}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Row 2 — strategic warning + unlock button */}
              <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
                <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                  {isPremium
                    ? "Você tem acesso a todos os sinais e leituras completas. Obrigado por ser Premium."
                    : "A versão gratuita mostra apenas parte da leitura completa. Algumas oportunidades avançadas ficam bloqueadas no Premium."
                  }
                </p>
                {!isPremium && (
                  <a
                    href="https://pay.cakto.com.br/37p22ov_864096"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[hsl(45_100%_60%/0.5)] bg-gradient-to-r from-[hsl(45_100%_60%/0.15)] to-[hsl(268_88%_65%/0.15)] text-[hsl(45_100%_75%)] font-black tracking-[0.12em] text-[11px] uppercase hover:scale-[1.03] active:scale-[0.97] transition-transform shrink-0"
                  >
                    <Lock className="w-3.5 h-3.5" /> Desbloquear leitura completa
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* EXPIRATION WARNING BANNER */}
        {isPremium && premiumDaysLeft !== null && premiumDaysLeft <= 3 && (
          <section>
            <div
              style={{
                borderRadius: "1rem",
                padding: "1rem 1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                border: `1px solid ${premiumDaysLeft <= 0 ? "rgba(220,38,38,0.5)" : "rgba(234,179,8,0.5)"}`,
                background: premiumDaysLeft <= 0
                  ? "linear-gradient(135deg, rgba(127,0,0,0.25) 0%, rgba(0,0,0,0.7) 100%)"
                  : "linear-gradient(135deg, rgba(120,90,0,0.25) 0%, rgba(0,0,0,0.7) 100%)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <p style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: premiumDaysLeft <= 0 ? "#fca5a5" : "#fde68a",
                    marginBottom: "0.25rem",
                  }}>
                    {premiumDaysLeft <= 0
                      ? "❌ Seu acesso Premium expirou"
                      : premiumDaysLeft === 1
                        ? "⚠️ Seu acesso expira amanhã"
                        : `⚠️ Seu acesso expira em ${premiumDaysLeft} dias`}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.55)", margin: 0 }}>
                    {premiumDaysLeft <= 0
                      ? "Renove agora para manter acesso aos sinais completos e leituras ilimitadas."
                      : "Renove antes que acabe para não perder nenhum sinal."}
                  </p>
                </div>
                <a
                  href="https://pay.cakto.com.br/37p22ov_864096"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.6rem 1.1rem",
                    borderRadius: "0.6rem",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    textDecoration: "none",
                    letterSpacing: "0.05em",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    background: premiumDaysLeft <= 0
                      ? "linear-gradient(135deg, #dc2626, #991b1b)"
                      : "linear-gradient(135deg, #ca8a04, #92400e)",
                    color: "#fff",
                    border: `1px solid ${premiumDaysLeft <= 0 ? "rgba(248,113,113,0.5)" : "rgba(253,224,71,0.4)"}`,
                  }}
                >
                  🔁 Renovar acesso
                </a>
              </div>
            </div>
          </section>
        )}

        {/* LIVE SIGNAL PANEL */}
        <section className="relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="fv-holo-border rounded-2xl">
              <Card className="border-0 bg-card/80 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-2xl">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

                {/* Panel header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-black/30">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 border border-primary/40">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary fv-pulse-ring" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                        Sinal #{signalId}
                      </div>
                      <h2 className="text-sm sm:text-base font-bold tracking-wider uppercase">
                        Operação ao Vivo
                      </h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5">
                      <span>👁</span>
                      <span>{watchersSignal} pessoas estão acompanhando essa leitura agora</span>
                    </span>
                    <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                      <AIWave /> processando fluxo
                    </div>
                    <StatusPill status={operation?.status} />
                  </div>
                </div>

                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                  {loadingOp ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32 w-full bg-muted/50" />
                      <Skeleton className="h-32 w-full bg-muted/50" />
                    </div>
                  ) : operation ? (
                    <>
                      {/* Countdown banner */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={goWhats}
                        onKeyDown={onCardKey}
                        className="bg-black/60 rounded-xl p-3 sm:p-4 border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-3 fv-clickable fv-tap"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-primary" />
                          <div className="leading-tight">
                            <div className="text-[10px] sm:text-xs font-mono uppercase text-muted-foreground tracking-widest">
                              {countdown.state === "past"
                                ? "Entrada concluída"
                                : countdown.state === "live"
                                  ? "Janela de entrada"
                                  : "Próxima entrada em"}
                            </div>
                            <div
                              className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                                countdown.state === "live"
                                  ? "text-primary fv-soft-pulse"
                                  : countdown.state === "soon"
                                    ? "text-secondary"
                                    : countdown.state === "past"
                                      ? "text-muted-foreground"
                                      : "text-white"
                              }`}
                            >
                              {countdown.label}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right leading-tight">
                            <div className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">
                              Entrada Brasília
                            </div>
                            <div className="text-lg sm:text-xl font-bold font-mono text-foreground tabular-nums">
                              {operation.entryTime || "--:--"}
                            </div>
                          </div>
                          <span className="text-[9px] font-mono text-primary uppercase tracking-[0.25em] hidden sm:inline">
                            BRT
                          </span>
                        </div>
                      </div>

                      {/* Asset + direction */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={goWhats}
                          onKeyDown={onCardKey}
                          className="lg:col-span-2 bg-black/50 rounded-xl p-4 sm:p-6 border border-border fv-clickable fv-tap space-y-4"
                        >
                          <div className="flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="text-muted-foreground font-mono uppercase tracking-widest">
                              Ativo Analisado
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded border border-primary/50 bg-primary/10 text-primary font-mono font-black tracking-widest text-[10px] sm:text-xs">
                                M1
                              </span>
                              <span className="text-primary font-mono uppercase tracking-widest flex items-center gap-1">
                                <Cpu className="w-3 h-3" /> ORAKULUS IA
                              </span>
                            </div>
                          </div>
                          <div className="flex items-end justify-between gap-3 flex-wrap">
                            <h3 className="text-3xl sm:text-5xl font-black text-white font-mono tracking-tight">
                              {operation.asset || "AGUARDANDO..."}
                            </h3>
                            {operation.direction === "CALL" ? (
                              <div className="flex items-center text-primary font-black text-xl sm:text-2xl bg-primary/10 px-3 sm:px-4 py-2 rounded-lg border border-primary/40 fv-glow-green">
                                <ArrowUpRight className="w-6 h-6 sm:w-8 sm:h-8 mr-2" />
                                COMPRA
                              </div>
                            ) : operation.direction === "PUT" ? (
                              <div className="flex items-center text-destructive font-black text-xl sm:text-2xl bg-destructive/10 px-3 sm:px-4 py-2 rounded-lg border border-destructive/40 fv-glow-red">
                                <ArrowDownRight className="w-6 h-6 sm:w-8 sm:h-8 mr-2" />
                                VENDA
                              </div>
                            ) : (
                              <div className="text-muted-foreground font-bold text-xl">--</div>
                            )}
                          </div>

                          {/* Decorative IA chart with scanning beam */}
                          <SignalChart />

                          {/* Operation timing strip */}
                          <div className="rounded-xl bg-gradient-to-r from-primary/10 via-transparent to-[hsl(184,100%,55%)]/10 border border-primary/30 p-3 sm:p-4">
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-primary" /> Entrada
                                </div>
                                <div className="text-2xl sm:text-3xl font-black font-mono text-primary tabular-nums leading-none">
                                  {operation.entryTime || "--:--"}
                                  <span className="text-xs text-muted-foreground ml-1">h</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-secondary" /> Final da operação
                                </div>
                                <div className="text-2xl sm:text-3xl font-black font-mono text-secondary tabular-nums leading-none">
                                  {operation.entryTime
                                    ? addMinutesHHMM(operation.entryTime, 1)
                                    : "--:--"}
                                  <span className="text-xs text-muted-foreground ml-1">h</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border/40 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-muted-foreground/90 flex items-center gap-1.5">
                              <AlertTriangle className="w-3 h-3 text-secondary" />
                              Caso necessário, utilize{" "}
                              <span className="text-secondary font-bold">G1</span>.
                            </div>
                          </div>
                        </div>

                        {/* Right column — futuristic radial dials */}
                        <div className="flex flex-col gap-3 sm:gap-4">
                          {/* Confidence dial */}
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={goWhats}
                            onKeyDown={onCardKey}
                            className="relative bg-black/50 rounded-xl p-4 border border-border fv-clickable fv-tap overflow-hidden"
                          >
                            <div className="absolute inset-0 pointer-events-none opacity-40 fv-grid-bg" />
                            <div className="relative flex items-center justify-between mb-3">
                              <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                                <Brain className="w-3 h-3 text-primary" /> Confiança da IA
                              </span>
                              <span className="px-1.5 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary font-mono font-black tracking-widest text-[9px]">
                                EST.
                              </span>
                            </div>
                            <div className="relative flex justify-center">
                              <RadialGauge
                                value={operation.estimatedProbability}
                                label="Sinal atual · M1"
                                caption="ORAKULUS · Análise"
                                hueFrom="184 100% 55%"
                                hueTo="151 100% 50%"
                                icon={Brain}
                                size={170}
                              />
                            </div>
                            <p className="relative text-[9px] text-muted-foreground/70 mt-2 leading-tight text-center">
                              *Estimativa técnica. Não é promessa de lucro.
                            </p>
                          </div>

                          {/* Daily assertiveness dial */}
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={goWhats}
                            onKeyDown={onCardKey}
                            className="relative bg-black/50 rounded-xl p-4 border border-primary/30 fv-clickable fv-tap overflow-hidden fv-glow-green"
                          >
                            <div className="absolute inset-0 pointer-events-none opacity-30 fv-grid-bg" />
                            <div className="relative flex items-center justify-between mb-3">
                              <span className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                                <Target className="w-3 h-3 text-primary" /> Assertividade do dia
                              </span>
                              <span className="px-1.5 py-0.5 rounded border border-primary/40 bg-primary/10 text-primary font-mono font-black tracking-widest text-[9px] flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-primary fv-blink" />
                                LIVE
                              </span>
                            </div>
                            <div className="relative flex justify-center">
                              <RadialGauge
                                value={stats?.winRateToday ?? 0}
                                label={
                                  (stats?.totalToday ?? 0) > 0
                                    ? `${stats?.winsToday ?? 0} WIN · ${stats?.lossesToday ?? 0} LOSS`
                                    : "Aguardando primeiro fechamento"
                                }
                                caption={
                                  (stats?.totalToday ?? 0) > 0
                                    ? `${stats?.totalToday ?? 0} OPERAÇÕES HOJE`
                                    : "ATUALIZA EM TEMPO REAL"
                                }
                                hueFrom="151 100% 50%"
                                hueTo="184 100% 55%"
                                icon={Target}
                                size={170}
                              />
                            </div>
                            <div className="relative grid grid-cols-3 gap-2 mt-3 text-center font-mono">
                              <div className="rounded-md border border-primary/30 bg-primary/5 py-1">
                                <div className="text-[8px] text-muted-foreground tracking-widest uppercase">
                                  WIN
                                </div>
                                <div className="text-sm font-black text-primary tabular-nums">
                                  {stats?.winsToday ?? 0}
                                </div>
                              </div>
                              <div className="rounded-md border border-destructive/30 bg-destructive/5 py-1">
                                <div className="text-[8px] text-muted-foreground tracking-widest uppercase">
                                  LOSS
                                </div>
                                <div className="text-sm font-black text-destructive tabular-nums">
                                  {stats?.lossesToday ?? 0}
                                </div>
                              </div>
                              <div className="rounded-md border border-secondary/30 bg-secondary/5 py-1">
                                <div className="text-[8px] text-muted-foreground tracking-widest uppercase">
                                  TOTAL
                                </div>
                                <div className="text-sm font-black text-secondary tabular-nums">
                                  {stats?.totalToday ?? 0}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Flow + Confirmations */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div className="bg-muted/15 rounded-xl p-4 border border-border">
                          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Força do Fluxo
                          </span>
                          <div className="flex items-center justify-between">
                            <span className={`font-bold text-lg sm:text-xl ${flow.color}`}>
                              {flow.label}
                            </span>
                            <div className="flex items-end gap-1 h-8">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                  key={i}
                                  className={`w-1.5 sm:w-2 rounded-sm transition-all ${
                                    i <= flow.bars
                                      ? "bg-gradient-to-t from-primary to-[hsl(184,100%,55%)]"
                                      : "bg-muted/30"
                                  }`}
                                  style={{ height: `${20 + i * 16}%` }}
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-muted/15 rounded-xl p-4 border border-border">
                          <span className="text-[10px] sm:text-xs text-muted-foreground uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3" /> Gatilhos Confirmados
                          </span>
                          {operation.confirmations && operation.confirmations.length > 0 ? (
                            <ul className="space-y-1.5">
                              {operation.confirmations.map((conf, idx) => (
                                <li key={idx} className="text-xs sm:text-sm flex items-start font-mono">
                                  <ChevronRight className="w-3.5 h-3.5 text-primary mr-1.5 shrink-0 mt-0.5" />
                                  <span className="text-foreground/90">{conf}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">
                              Aguardando gatilhos...
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Retração tip */}
                      <div className="bg-secondary/8 border border-secondary/40 rounded-xl p-4 flex items-start gap-3 fv-tip-pulse">
                        <div className="shrink-0 w-9 h-9 rounded-full bg-secondary/15 border border-secondary/40 flex items-center justify-center">
                          {operation.direction === "PUT" ? (
                            <TrendingDown className="w-4 h-4 text-secondary" />
                          ) : (
                            <Lightbulb className="w-4 h-4 text-secondary" />
                          )}
                        </div>
                        <div className="leading-tight">
                          <div className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-secondary font-bold mb-1">
                            Dica da ORAKULUS IA · Maior Assertividade
                          </div>
                          <p className="text-sm sm:text-base text-foreground/90 leading-snug">
                            Aguarde uma{" "}
                            <span className="text-secondary font-bold">retração</span>{" "}
                            do preço antes de abrir a operação de{" "}
                            <span className={`font-bold font-mono ${operation.direction === "CALL" ? "text-primary" : "text-destructive"}`}>
                              {dirLabel(operation.direction)}
                            </span>
                            . Entrar contra o pavio aumenta a chance de pegar o movimento limpo na M1.
                          </p>
                        </div>
                      </div>

                      {/* Big WIN/LOSS celebration when finished */}
                      <AnimatePresence>
                        {operation.status === "finalizada" && operation.result && (
                          <ResultCelebration result={operation.result} />
                        )}
                      </AnimatePresence>

                      {/* CTA */}
                      <a
                        href="https://pay.cakto.com.br/37p22ov_864096"
                        className="group w-full bg-primary text-primary-foreground hover:bg-primary/90 font-black uppercase tracking-[0.15em] text-base sm:text-lg py-4 sm:py-5 rounded-xl fv-glow-green transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 fv-tap"
                      >
                        <span>🔓</span>
                        Desbloquear Leitura Completa
                        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </a>
                    </>
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      Nenhuma operação ativa no momento.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </section>

        {/* Strategic insight strip — free tier awareness */}
        <section>
          <div className="rounded-xl border border-border/50 bg-black/50 backdrop-blur-sm divide-y divide-border/30">
            {[
              {
                icon: Eye,
                text: "Você está vendo apenas uma parte da leitura completa da ORAKULUS IA.",
                accent: "text-secondary",
              },
              {
                icon: Zap,
                text: "Fluxo forte identificado — leitura completa de direção e força restrita ao plano Premium.",
                accent: "text-[hsl(45_100%_75%)]",
              },
              {
                icon: Brain,
                text: "A ORAKULUS IA analisa cenário, força e intenção do preço em tempo real.",
                accent: "text-primary",
              },
            ].map(({ icon: Icon, text, accent }) => (
              <div key={text} className="flex items-start gap-3 px-4 py-3">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${accent}`} />
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Sala da ORAKULUS IA
            </h3>
            <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-widest hidden sm:inline">
              [ TOQUE PARA ENTRAR ]
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                icon: Users,
                value: stats?.peopleWatching ?? operation?.peopleWatching ?? 0,
                label: "Usuários ativos agora",
                color: "text-secondary",
                delay: 0.05,
              },
              {
                icon: ShieldCheck,
                value: stats?.studentsPresent ?? operation?.studentsPresent ?? 0,
                label: "Operações analisadas hoje",
                color: "text-primary",
                delay: 0.1,
              },
              {
                icon: MessageSquare,
                value: stats?.feedbacksReceived ?? operation?.feedbacksReceived ?? 0,
                label: "Leituras realizadas",
                color: "text-secondary",
                delay: 0.15,
              },
              {
                icon: TrendingUp,
                value: stats?.communityResults ?? operation?.communityResults ?? 0,
                label: "Sinais monitorados",
                color: "text-primary",
                delay: 0.2,
              },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: s.delay }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={goWhats}
                    onKeyDown={onCardKey}
                    className="bg-card/60 border border-border rounded-xl text-center py-5 px-3 fv-clickable fv-tap"
                  >
                    <Icon className={`w-6 h-6 sm:w-7 sm:h-7 mx-auto mb-2 ${s.color}`} />
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={s.value}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="text-2xl sm:text-3xl font-black text-white tabular-nums font-mono"
                      >
                        {s.value.toLocaleString("pt-BR")}
                      </motion.div>
                    </AnimatePresence>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground uppercase font-mono mt-1 tracking-widest">
                      {s.label}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section>
          <div
            role="button"
            tabIndex={0}
            onClick={goWhats}
            onKeyDown={onCardKey}
            className="fv-holo-border rounded-2xl"
          >
            <div className="bg-black/50 rounded-2xl p-6 sm:p-10 text-center max-w-4xl mx-auto fv-clickable fv-tap">
              <LineChart className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 fv-ai-text" />
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-3 uppercase tracking-wide">
                Como a <span className="fv-ai-text">ORAKULUS IA</span> opera 24/7
              </h3>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                A IA monitora o mercado em tempo real e identifica{" "}
                <span className="text-primary font-bold">força</span>,{" "}
                <span className="text-primary font-bold">repetição</span>,{" "}
                <span className="text-primary font-bold">rejeição</span>,{" "}
                <span className="text-primary font-bold">retração</span> e{" "}
                <span className="text-primary font-bold">intenção do preço</span>{" "}
                — entregando uma nova entrada estimada a cada poucos minutos, dia e noite, no fuso de Brasília.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 fv-ai-text font-mono text-xs sm:text-sm uppercase tracking-widest font-bold">
                Toque para entrar na sala <ChevronRight className="w-4 h-4 text-primary" />
              </div>
            </div>
          </div>
        </section>

        {/* History — FREE tier shows only the last 5 signals; PREMIUM shows all */}
        {history && history.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-sm sm:text-base font-bold text-white uppercase tracking-[0.2em] flex items-center gap-2 border-b border-border/60 pb-3 flex-wrap">
              <Activity className="w-4 h-4 text-primary" /> Sinais Anteriores
              {isPremium ? (
                <span className="ml-1 px-2 py-0.5 rounded border border-[hsl(45_100%_60%/0.5)] bg-[hsl(45_100%_60%/0.10)] text-[hsl(45_100%_75%)] text-[10px] font-mono tracking-widest">
                  👑 PREMIUM
                </span>
              ) : (
                <span className="ml-1 px-2 py-0.5 rounded border border-secondary/40 bg-secondary/10 text-secondary text-[10px] font-mono tracking-widest">
                  VERSÃO GRATUITA
                </span>
              )}
              <span className="ml-auto text-[10px] font-mono text-muted-foreground tracking-widest">
                {isPremium
                  ? `${history.length} SINAIS DISPONÍVEIS`
                  : `${Math.min(history.length, 5)} / 5 SINAIS LIBERADOS`
                }
              </span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {(isPremium ? history : history.slice(0, 5)).map((item) => {
                const isWin = item.result.toLowerCase().includes("win");
                const isLoss = item.result.toLowerCase().includes("loss");
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={goWhats}
                    onKeyDown={onCardKey}
                    className="bg-card/50 border border-border rounded-xl p-4 fv-clickable fv-tap"
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
                        {item.result || "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Premium cards — locked for FREE, unlocked for PREMIUM */}
            <div className="mt-4 space-y-3">
              <div className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest ${isPremium ? "text-primary" : "text-[hsl(45_100%_75%)]"}`}>
                {isPremium ? <Crown className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {isPremium ? "Operações Premium liberadas nesta sessão" : "Operações premium detectadas nesta sessão"}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {isPremium ? (
                  [
                    {
                      label: "🔓 Leitura completa liberada",
                      sub: "Você tem acesso total a este sinal — direção, horário e força do fluxo desbloqueados",
                      meta: "Força: ALTA · Direção: COMPRA · Hora: 14:35",
                    },
                    {
                      label: "✔ Acesso total ao fluxo",
                      sub: "Leitura completa disponível — direcione suas operações com máxima precisão",
                      meta: "Ativo: EUR/USD · Prob. estimada: 87%",
                    },
                    {
                      label: "✔ Entrada disponível",
                      sub: "Sinal operacional ativo — acesso exclusivo Premium liberado",
                      meta: "Sinal operacional: ATIVO",
                    },
                  ].map(({ label, sub, meta }) => (
                    <div
                      key={label}
                      className="relative overflow-hidden rounded-xl border-2 border-primary/60 bg-gradient-to-br from-primary/10 to-[hsl(268_88%_65%/0.12)] p-4 shadow-[0_0_18px_hsl(var(--primary)/0.25)]"
                    >
                      <div className="absolute inset-0 pointer-events-none opacity-25 fv-grid-bg" />
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 border border-primary/40 text-[9px] font-black font-mono uppercase tracking-widest text-primary">
                          <Crown className="w-2.5 h-2.5" /> PREMIUM ATIVO
                        </span>
                      </div>
                      <div className="relative mt-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-black text-sm text-primary leading-tight">
                            {label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-3 leading-snug">{sub}</p>
                        <div className="font-mono text-[10px] text-primary/70">
                          {meta}
                        </div>
                        <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                          <Crown className="w-3 h-3" /> Acesso ativo
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  [
                    {
                      label: "🔒 Disponível no plano Premium",
                      sub: "Essa entrada está disponível apenas no Premium — desbloqueie para não perder a próxima",
                      meta: "Força: ALTA · Direção: ████ · Hora: ██:██",
                    },
                    {
                      label: "🔒 Leitura completa bloqueada",
                      sub: "Direção, horário e força do fluxo disponíveis apenas no Premium",
                      meta: "Ativo: ████ · Prob. estimada: ██%",
                    },
                    {
                      label: "🔒 Desbloqueie para acessar todos os sinais",
                      sub: "Desbloqueie para acessar a leitura completa — possível oportunidade operacional restrita",
                      meta: "Sinal operacional: BLOQUEADO",
                    },
                  ].map(({ label, sub, meta }) => (
                    <a
                      key={label}
                      href="https://pay.cakto.com.br/37p22ov_864096"
                      className="group relative overflow-hidden rounded-xl border-2 border-[hsl(45_100%_60%/0.45)] bg-gradient-to-br from-[hsl(45_100%_60%/0.08)] to-[hsl(268_88%_65%/0.10)] p-4 text-left hover:border-[hsl(45_100%_60%/0.80)] hover:scale-[1.02] active:scale-[0.98] transition-all block"
                    >
                      <div className="absolute inset-0 pointer-events-none opacity-25 fv-grid-bg" />
                      <div className="absolute top-2 right-2">
                        <Lock className="w-4 h-4 text-[hsl(45_100%_75%/0.7)]" />
                      </div>
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-3.5 h-3.5 text-[hsl(45_100%_75%)] shrink-0" />
                          <span className="font-black text-sm text-[hsl(45_100%_85%)] leading-tight">
                            {label}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-3 leading-snug">{sub}</p>
                        <div className="font-mono text-[10px] text-muted-foreground/50 blur-[4px] select-none">
                          {meta}
                        </div>
                        <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[hsl(45_100%_75%)] group-hover:gap-2.5 transition-all">
                          <Lock className="w-3 h-3" /> Desbloquear acesso
                        </div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* Upgrade to Premium CTA — visible on the free tier */}
        <section>
          <div className="relative overflow-hidden rounded-2xl border-2 border-[hsl(45_100%_60%/0.45)] bg-gradient-to-br from-[hsl(45_100%_60%/0.10)] via-black/70 to-[hsl(268_88%_65%/0.18)] p-6 sm:p-10">
            <div className="absolute inset-0 pointer-events-none opacity-30 fv-grid-bg" />
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[hsl(45_100%_60%/0.18)] blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[hsl(268_88%_65%/0.18)] blur-3xl pointer-events-none" />
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[hsl(45_100%_60%/0.5)] bg-[hsl(45_100%_60%/0.10)] mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-[hsl(45_100%_75%)]" />
                  <span className="font-mono uppercase tracking-[0.25em] text-[10px] sm:text-xs text-[hsl(45_100%_75%)] font-black">
                    Você está na versão gratuita
                  </span>
                </span>

                {/* Headline */}
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight mb-3">
                  Você já viu o suficiente…
                  <br />
                  <span className="bg-gradient-to-r from-[hsl(45_100%_75%)] to-[hsl(268_88%_70%)] bg-clip-text text-transparent">
                    Mas ainda está operando atrasado.
                  </span>
                </h2>

                {/* Dor */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  Enquanto você usa a versão gratuita,<br />
                  as melhores oportunidades já aconteceram.
                </p>

                {/* Bloco de impacto — o que FREE não resolve */}
                <div className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 mb-5 space-y-1.5">
                  {["❌ Entrada atrasada", "❌ Falta de leitura completa", "❌ Decisão no achismo"].map((line) => (
                    <div key={line} className="text-sm text-foreground/80 font-mono">{line}</div>
                  ))}
                  <div className="pt-2 border-t border-destructive/20 text-xs text-destructive/80 font-bold uppercase tracking-widest">
                    É por isso que a maioria perde.
                  </div>
                </div>

                {/* Benefícios Premium */}
                <div className="rounded-xl border border-[hsl(45_100%_60%/0.30)] bg-[hsl(45_100%_60%/0.05)] px-4 py-3 mb-6">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[hsl(45_100%_75%)] mb-2.5">
                    No Premium você tem acesso ao que realmente move o mercado:
                  </div>
                  <ul className="space-y-1.5">
                    {[
                      "✔ Leitura completa do fluxo",
                      "✔ Entradas mais antecipadas",
                      "✔ Decisões com mais clareza",
                      "✔ Acesso total ao sistema",
                    ].map((item) => (
                      <li key={item} className="text-sm text-foreground/90 font-mono">{item}</li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <a
                  href="https://pay.cakto.com.br/37p22ov_864096"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-[hsl(45_100%_60%)] via-[hsl(45_100%_70%)] to-[hsl(45_100%_60%)] text-black font-black uppercase tracking-[0.12em] text-sm sm:text-base hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-[0_0_28px_hsl(45_100%_60%/0.5)] w-full sm:w-auto"
                >
                  🚀 ATIVAR ACESSO PREMIUM AGORA
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </a>

                {/* Gatilho final */}
                <p className="mt-3 text-xs text-muted-foreground/70 text-center sm:text-left">
                  Quanto mais você espera,{" "}
                  <span className="text-foreground/80 font-semibold">mais oportunidades você perde.</span>
                </p>

                {/* Micro detalhe dinâmico */}
                <p className="mt-1.5 text-[10px] font-mono text-muted-foreground/50 text-center sm:text-left">
                  + {watchersUpgrade} pessoas acessando agora
                </p>
              </div>

              {/* Pricing card */}
              <div className="relative flex justify-center">
                <div className="relative w-full max-w-xs">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[hsl(45_100%_60%/0.20)] to-[hsl(268_88%_65%/0.20)] blur-2xl" />
                  <div className="relative rounded-2xl border-2 border-[hsl(45_100%_60%/0.5)] bg-black/80 p-6 text-center">
                    {/* Acesso imediato badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[hsl(45_100%_60%/0.5)] bg-[hsl(45_100%_60%/0.12)] text-[hsl(45_100%_75%)] text-[10px] font-black font-mono uppercase tracking-widest mb-3">
                      🔥 Acesso imediato
                    </div>
                    <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-[hsl(45_100%_75%)] mb-2">
                      Assinatura mensal
                    </div>
                    <p className="text-xs text-muted-foreground/60 mb-2">
                      <span className="line-through">De R$197</span>
                      {" "}por R$97/mês
                    </p>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <span className="text-base text-muted-foreground">R$</span>
                      <span className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-[hsl(45_100%_75%)] to-[hsl(268_88%_70%)] bg-clip-text text-transparent tabular-nums leading-none">
                        97
                      </span>
                      <span className="text-sm text-muted-foreground self-end mb-1">/ mês</span>
                    </div>
                    <div className="text-xs text-[hsl(45_100%_75%)] font-bold mb-1">
                      Menos de R$3 por dia
                    </div>
                    <div className="text-xs text-muted-foreground mb-4">
                      Cancele quando quiser
                    </div>
                    <div className="border-t border-border/40 pt-4 space-y-1.5 text-left">
                      {[
                        "✓ Leitura completa do fluxo",
                        "✓ Entradas mais antecipadas",
                        "✓ Acesso total ao sistema",
                      ].map((line) => (
                        <div key={line} className="text-[11px] sm:text-xs font-mono text-foreground/85">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


      </main>

      {/* Mobile Sticky CTA */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-primary/40 px-3 py-3 fv-safe-bottom">
        <a
          href="https://pay.cakto.com.br/37p22ov_864096"
          className="group w-full bg-primary text-primary-foreground font-black uppercase tracking-[0.12em] text-sm py-3.5 rounded-xl fv-glow-green flex items-center justify-center gap-2 active:scale-[0.98] transition-transform fv-tap"
        >
          <span>🔓</span>
          Desbloquear Leitura Completa
        </a>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            key="upgrade-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowUpgradeModal(false)}
          >
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, y: 48 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 48 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="relative w-full sm:max-w-lg bg-card/95 border-2 border-[hsl(45_100%_60%/0.55)] rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[hsl(45_100%_60%)] to-transparent" />
              <div className="absolute inset-0 pointer-events-none opacity-10 fv-grid-bg" />
              <div className="relative p-6 sm:p-8">
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors p-1"
                  aria-label="Fechar"
                >
                  <XCircle className="w-5 h-5" />
                </button>

                <div className="text-center mb-6">
                  <Crown className="w-10 h-10 text-[hsl(45_100%_75%)] mx-auto mb-3" />
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
                    Desbloqueie a{" "}
                    <span className="bg-gradient-to-r from-[hsl(45_100%_75%)] to-[hsl(268_88%_70%)] bg-clip-text text-transparent">
                      ORAKULUS IA PREMIUM
                    </span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-sm text-muted-foreground line-through opacity-60">R$ 197/mês</span>
                    <span className="text-base font-black text-[hsl(45_100%_75%)]">R$ 97/mês</span>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">· Acesso completo · Sinais ilimitados</span>
                  </div>
                  <p className="text-[11px] font-mono text-[hsl(15_100%_60%)] mt-1 flex items-center gap-1">
                    <span>🔥</span>
                    <span>Últimos acessos disponíveis no momento</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  {[
                    { icon: InfinityIcon, label: "Sinais ilimitados", sub: "Todo dia, 24h" },
                    { icon: Brain, label: "Leitura completa", sub: "Direção + força + horário" },
                    { icon: Bell, label: "Alertas em tempo real", sub: "WhatsApp direto" },
                    { icon: Activity, label: "Histórico completo", sub: "Todas as operações" },
                    { icon: Target, label: "Painel avançado", sub: "Força do mercado ao vivo" },
                    { icon: Lock, label: "Operações premium", sub: "Entradas de alta prob." },
                  ].map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="flex items-start gap-2 p-3 rounded-xl bg-muted/10 border border-border/40">
                      <Icon className="w-4 h-4 text-[hsl(45_100%_75%)] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-white leading-tight">{label}</div>
                        <div className="text-[10px] text-muted-foreground">{sub}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <a
                  href="https://pay.cakto.com.br/37p22ov_864096"
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-[hsl(45_100%_60%)] via-[hsl(45_100%_70%)] to-[hsl(45_100%_60%)] text-black font-black uppercase tracking-[0.15em] text-sm hover:scale-[1.01] active:scale-[0.98] transition-transform shadow-[0_0_28px_hsl(45_100%_60%/0.45)]"
                >
                  <Crown className="w-4 h-4" />
                  Conhecer o plano Premium
                  <ChevronRight className="w-4 h-4" />
                </a>
                <p className="text-center text-[10px] text-muted-foreground mt-3">
                  Use a versão gratuita para testar a leitura e desbloqueie o Premium para acesso completo.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-black/70 py-6 sm:py-8 relative z-10">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <OrakulusLogo className="w-5 h-5" />
            <span className="font-black tracking-[0.22em] fv-ai-text text-sm">
              ORAKULUS IA
            </span>
          </div>
          <div className="flex items-center justify-center text-muted-foreground">
            <AlertTriangle className="w-4 h-4 text-secondary mr-2" />
            <span className="font-bold uppercase tracking-[0.2em] text-xs">
              Aviso de Risco
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-muted-foreground/70 max-w-3xl mx-auto leading-relaxed">
            Mercado de renda variável envolve riscos. Resultados passados não garantem resultados futuros. As informações apresentadas são educacionais e não representam promessa de lucro.
          </p>
          <p className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-widest">
            <Radio className="w-3 h-3 inline mr-1 fv-flicker" />
            Operando no horário de Brasília (BRT/UTC-3) · Sinais 24/7
          </p>
        </div>
      </footer>
    </div>
  );
}
