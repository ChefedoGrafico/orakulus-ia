import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, operationSettingsTable, operationHistoryTable } from "@workspace/db";
import { desc, eq, sql } from "drizzle-orm";
import {
  GetOperationResponse,
  GetOperationHistoryResponse,
  GetOperationStatsResponse,
  AdminLoginBody,
  AdminLoginResponse,
  UpdateOperationBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SETTINGS_ID = 1;

const ADMIN_PASSWORD = process.env["ADMIN_PASSWORD"] ?? "admin123";
const ADMIN_TOKEN_SECRET =
  process.env["SESSION_SECRET"] ?? "fluxo-vela-fallback-secret";

function makeToken(): string {
  return Buffer.from(
    `${Date.now()}:${ADMIN_TOKEN_SECRET}:${Math.random().toString(36).slice(2)}`,
  ).toString("base64url");
}

const validTokens = new Set<string>();

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const token = req.header("x-admin-token");
  if (!token || !validTokens.has(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// ───── Brasília time helpers ─────
function brasiliaNowMinutes(): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const [h, m] = fmt.format(new Date()).split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return ((h ?? 0) * 60 + (m ?? 0));
}

function minutesToTime(mins: number): string {
  const norm = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function diffMinutes(nowMin: number, entryMin: number): number {
  let d = nowMin - entryMin;
  if (d < -720) d += 1440;
  if (d > 720) d -= 1440;
  return d;
}

// ───── Signal generator pool ─────
const ASSETS = [
  "EUR/USD OTC",
  "GBP/USD OTC",
  "USD/JPY OTC",
  "AUD/CAD OTC",
  "EUR/JPY OTC",
  "USD/CAD OTC",
  "GBP/JPY OTC",
  "NZD/USD OTC",
  "EUR/GBP OTC",
  "AUD/USD OTC",
  "BTC/USD",
  "ETH/USD",
  "USD/CHF OTC",
  "USD/BRL OTC",
];

const DIRECTIONS = ["CALL", "PUT"] as const;
const FLOW_POOL = ["Alta", "Alta", "Alta", "Media", "Media", "Baixa"] as const;

// Confirmations use Fluxo de Vela vocabulary: rompimentos / domínio /
// injeção, plus reversal triggers (correção / big player) so the panel
// matches how the trader actually narrates entries on WhatsApp.
const CONFIRMATIONS_POOL = [
  "Rompimento de região confirmado",
  "Rompimento de domínio comprador",
  "Rompimento de domínio vendedor",
  "Injeção de preço agressiva",
  "Injeção de preço com volume",
  "Domínio comprador retomado",
  "Domínio vendedor pressionando",
  "Fluxo limpo na direção do sinal",
  "Continuidade de tendência validada",
  "Absorção de ordens detectada",
  "Correção de mercado finalizada",
  "Reversão após exaustão",
  "Entrada de big player identificada",
  "Big player defendendo a região",
  "Falha de continuidade · reversão",
  "Pavio de rejeição na região-chave",
  "Retomada após retração saudável",
  "Liquidez tomada · fluxo virou",
];

// Weighted result pool for the auto-rotation. Three honest outcomes:
// WIN DIRETO (direct win), WIN G1 (first trade lost, G1 won), and LOSS
// (first trade AND G1 both lost). Admin can override via /admin.
const RESULT_POOL_WEIGHTED: ReadonlyArray<readonly [string, number]> = [
  ["WIN DIRETO", 68],
  ["WIN G1", 18],
  ["LOSS", 14],
] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function pickResult(): string {
  const total = RESULT_POOL_WEIGHTED.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [v, w] of RESULT_POOL_WEIGHTED) {
    r -= w;
    if (r <= 0) return v;
  }
  return RESULT_POOL_WEIGHTED[0]![0];
}

function jitter(value: number, pct: number): number {
  const delta = Math.round(value * pct * (Math.random() * 2 - 1));
  return Math.max(0, value + delta);
}

function buildNewSignal(nowMin: number, previousAsset?: string) {
  // Entry between 2 and 4 minutes from now (Brasília)
  const offset = 2 + Math.floor(Math.random() * 3);
  const entryTime = minutesToTime(nowMin + offset);

  const count = 2 + Math.floor(Math.random() * 2); // 2-3 confirmations
  const confirmations: string[] = [];
  const used = new Set<number>();
  while (confirmations.length < count) {
    const idx = Math.floor(Math.random() * CONFIRMATIONS_POOL.length);
    if (used.has(idx)) continue;
    used.add(idx);
    confirmations.push(CONFIRMATIONS_POOL[idx]!);
  }

  // Avoid repeating the same asset twice in a row for better variety
  let asset = pick(ASSETS);
  if (previousAsset) {
    let attempts = 0;
    while (asset === previousAsset && attempts < 6) {
      asset = pick(ASSETS);
      attempts++;
    }
  }

  return {
    asset,
    direction: pick([...DIRECTIONS]),
    entryTime,
    flowStrength: pick([...FLOW_POOL]),
    confirmations,
    estimatedProbability: 72 + Math.floor(Math.random() * 24), // 72-95
    status: "aguardando" as const,
    result: "",
  };
}

async function getOrCreateSettings() {
  const [existing] = await db
    .select()
    .from(operationSettingsTable)
    .where(eq(operationSettingsTable.id, SETTINGS_ID))
    .limit(1);

  if (existing) return existing;

  const nowMin = brasiliaNowMinutes();
  const initial = buildNewSignal(nowMin);

  const [created] = await db
    .insert(operationSettingsTable)
    .values({
      id: SETTINGS_ID,
      ...initial,
      peopleWatching: 247,
      studentsPresent: 1284,
      feedbacksReceived: 532,
      communityResults: 1820,
      whatsappLink: "https://wa.me/5511999999999",
      notes: "",
    })
    .returning();

  return created!;
}

/**
 * Auto-rotation 24/7:
 *  diff = nowMin - entryMin (Brasília)
 *  diff < -5          → STALE (entry sits too far in the future, e.g. after
 *                       a clock change or restart) → archive + new signal
 *  -5 ≤ diff < 0      → AGUARDANDO (entrada futura, dentro do esperado)
 *  -1 ≤ diff ≤ 1      → LIBERADA (janela de entrada)
 *  1 < diff < 3       → FINALIZADA (com resultado)
 *  diff ≥ 3           → arquivar e gerar novo sinal
 *
 * Locked by checking updatedAt to avoid double-rotation when concurrent
 * polling requests arrive within the same window.
 */
async function maybeRotate(row: Awaited<ReturnType<typeof getOrCreateSettings>>) {
  const nowMin = brasiliaNowMinutes();
  const entryMin = timeToMinutes(row.entryTime);
  const diff = diffMinutes(nowMin, entryMin);

  // Stale guard: if the stored entry is more than 5 min in the future, we
  // consider the row inconsistent (e.g. left over from a previous restart
  // or a clock skew) and force a fresh signal so the panel never freezes.
  if (diff < -5 || diff >= 3) {
    // Archive current and emit a fresh signal
    await db.insert(operationHistoryTable).values({
      asset: row.asset,
      direction: row.direction,
      entryTime: row.entryTime,
      result: row.result || pickResult(),
      estimatedProbability: row.estimatedProbability,
    });

    const next = buildNewSignal(nowMin, row.asset);
    const [updated] = await db
      .update(operationSettingsTable)
      .set({
        ...next,
        peopleWatching: jitter(row.peopleWatching || 200, 0.08),
        studentsPresent: row.studentsPresent,
        feedbacksReceived: jitter(row.feedbacksReceived || 500, 0.03),
        communityResults: jitter(row.communityResults || 1500, 0.02),
        updatedAt: new Date(),
      })
      .where(eq(operationSettingsTable.id, SETTINGS_ID))
      .returning();
    return updated!;
  }

  if (diff > 1 && row.status !== "finalizada") {
    // Settle the operation
    const result = row.result || pickResult();
    const [updated] = await db
      .update(operationSettingsTable)
      .set({
        status: "finalizada",
        result,
        updatedAt: new Date(),
      })
      .where(eq(operationSettingsTable.id, SETTINGS_ID))
      .returning();
    return updated!;
  }

  if (diff >= -1 && diff <= 1 && row.status === "aguardando") {
    const [updated] = await db
      .update(operationSettingsTable)
      .set({ status: "liberada", updatedAt: new Date() })
      .where(eq(operationSettingsTable.id, SETTINGS_ID))
      .returning();
    return updated!;
  }

  return row;
}

function formatSettings(row: Awaited<ReturnType<typeof getOrCreateSettings>>) {
  return {
    asset: row.asset,
    direction: row.direction,
    entryTime: row.entryTime,
    flowStrength: row.flowStrength,
    confirmations: row.confirmations ?? [],
    status: row.status,
    estimatedProbability: row.estimatedProbability,
    result: row.result,
    peopleWatching: row.peopleWatching,
    studentsPresent: row.studentsPresent,
    feedbacksReceived: row.feedbacksReceived,
    communityResults: row.communityResults,
    whatsappLink: row.whatsappLink,
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.get("/operation", async (_req, res) => {
  const row = await getOrCreateSettings();
  const rotated = await maybeRotate(row);
  const data = GetOperationResponse.parse(formatSettings(rotated));
  res.json(data);
});

router.get("/operation/history", async (_req, res) => {
  const rows = await db
    .select()
    .from(operationHistoryTable)
    .orderBy(desc(operationHistoryTable.finishedAt))
    .limit(15);

  const data = GetOperationHistoryResponse.parse(
    rows.map((r) => ({
      id: r.id,
      asset: r.asset,
      direction: r.direction,
      entryTime: r.entryTime,
      result: r.result,
      estimatedProbability: r.estimatedProbability,
      finishedAt: r.finishedAt.toISOString(),
    })),
  );
  res.json(data);
});

router.get("/operation/stats", async (_req, res) => {
  const settings = await getOrCreateSettings();

  const [agg] = await db
    .select({
      avg: sql<number>`COALESCE(AVG(${operationHistoryTable.estimatedProbability}), 0)`,
      total: sql<number>`COUNT(*)`,
    })
    .from(operationHistoryTable);

  // Today's stats — group by Brasília calendar day so the "Assertividade
  // do dia" panel resets at 00:00 BRT.
  const [today] = await db
    .select({
      wins: sql<number>`COUNT(*) FILTER (WHERE LOWER(${operationHistoryTable.result}) LIKE 'win%')`,
      losses: sql<number>`COUNT(*) FILTER (WHERE LOWER(${operationHistoryTable.result}) LIKE 'loss%')`,
      total: sql<number>`COUNT(*)`,
    })
    .from(operationHistoryTable)
    .where(
      sql`(${operationHistoryTable.finishedAt} AT TIME ZONE 'America/Sao_Paulo')::date = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date`,
    );

  const winsToday = Number(today?.wins ?? 0);
  const lossesToday = Number(today?.losses ?? 0);
  const totalToday = Number(today?.total ?? 0);
  // Floor on the percentage so the dial never reads 100% on the very first
  // win of the day — keeps the panel believable.
  const winRateToday =
    winsToday + lossesToday > 0
      ? Math.round((winsToday / (winsToday + lossesToday)) * 100)
      : 0;

  const data = GetOperationStatsResponse.parse({
    peopleWatching: settings.peopleWatching,
    studentsPresent: settings.studentsPresent,
    feedbacksReceived: settings.feedbacksReceived,
    communityResults: settings.communityResults,
    averageProbability: Math.round(Number(agg?.avg ?? 0)),
    totalFinishedOperations: Number(agg?.total ?? 0),
    winsToday,
    lossesToday,
    totalToday,
    winRateToday,
  });
  res.json(data);
});

router.post("/admin/login", (req, res) => {
  const body = AdminLoginBody.parse(req.body);
  if (body.password !== ADMIN_PASSWORD) {
    res.status(401).json({ error: "Senha inválida" });
    return;
  }
  const token = makeToken();
  validTokens.add(token);
  const data = AdminLoginResponse.parse({ token });
  res.json(data);
});

router.put("/admin/operation", requireAdmin, async (req, res) => {
  const body = UpdateOperationBody.parse(req.body);
  const current = await getOrCreateSettings();

  if (body.archiveCurrent) {
    await db.insert(operationHistoryTable).values({
      asset: current.asset,
      direction: current.direction,
      entryTime: current.entryTime,
      result: current.result || "—",
      estimatedProbability: current.estimatedProbability,
    });
  }

  const [updated] = await db
    .update(operationSettingsTable)
    .set({
      asset: body.asset,
      direction: body.direction,
      entryTime: body.entryTime,
      flowStrength: body.flowStrength,
      confirmations: body.confirmations,
      status: body.status,
      estimatedProbability: body.estimatedProbability,
      result: body.result,
      peopleWatching: body.peopleWatching,
      studentsPresent: body.studentsPresent,
      feedbacksReceived: body.feedbacksReceived,
      communityResults: body.communityResults,
      whatsappLink: body.whatsappLink,
      notes: body.notes,
      updatedAt: new Date(),
    })
    .where(eq(operationSettingsTable.id, SETTINGS_ID))
    .returning();

  res.json(formatSettings(updated!));
});

export default router;
