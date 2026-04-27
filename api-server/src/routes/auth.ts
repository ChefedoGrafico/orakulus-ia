import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

type SessionUser = { userId: number; userEmail: string };

declare module "express-session" {
  interface SessionData {
    userId?: number;
    userEmail?: string;
  }
}

async function buildUserPayload(email: string) {
  const now = new Date();
  const [row] = await db
    .select({
      id: usersTable.id,
      nome: usersTable.nome,
      email: usersTable.email,
      plano: usersTable.plano,
      data_expiracao: usersTable.data_expiracao,
      status_validacao: usersTable.status_validacao,
      sinais_consumidos: usersTable.sinais_consumidos,
      sinais_extras_liberados: usersTable.sinais_extras_liberados,
    })
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!row) return null;

  let plano = row.plano as string;
  const sv = (row.status_validacao ?? "PENDENTE") as string;

  // Auto-expire premium
  if (plano === "PREMIUM" && row.data_expiracao !== null && row.data_expiracao < now) {
    await db.update(usersTable).set({ plano: "FREE", data_expiracao: null }).where(eq(usersTable.email, email));
    plano = "FREE";
  }
  if (plano === "PREMIUM" && sv !== "APROVADO") plano = "FREE";

  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    plano,
    data_expiracao: plano === "PREMIUM" ? row.data_expiracao : null,
    status_validacao: sv,
    sinais_consumidos: row.sinais_consumidos ?? 0,
    sinais_extras_liberados: row.sinais_extras_liberados ?? 0,
  };
}

router.get("/auth/me", async (req: Request, res: Response): Promise<void> => {
  const { userId, userEmail } = req.session as Partial<SessionUser>;
  if (!userId || !userEmail) {
    res.status(401).json({ error: "Não autenticado." });
    return;
  }
  try {
    const payload = await buildUserPayload(userEmail);
    if (!payload) {
      req.session.destroy(() => {});
      res.status(401).json({ error: "Usuário não encontrado." });
      return;
    }
    res.json(payload);
  } catch (err) {
    console.error("[GET /api/auth/me]", err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/auth/login", async (req: Request, res: Response): Promise<void> => {
  const { email, senha } = req.body as { email?: string; senha?: string };
  if (!email || !senha) {
    res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    return;
  }
  try {
    const [row] = await db
      .select({ id: usersTable.id, email: usersTable.email, senha_hash: usersTable.senha_hash })
      .from(usersTable)
      .where(eq(usersTable.email, email.trim().toLowerCase()))
      .limit(1);

    if (!row) {
      res.status(401).json({ error: "E-mail ou senha incorretos." });
      return;
    }

    if (!row.senha_hash) {
      res.status(401).json({ error: "Esta conta não possui senha cadastrada. Entre em contato com o suporte." });
      return;
    }

    const match = await bcrypt.compare(senha, row.senha_hash);
    if (!match) {
      res.status(401).json({ error: "E-mail ou senha incorretos." });
      return;
    }

    req.session.userId = row.id;
    req.session.userEmail = row.email;

    const payload = await buildUserPayload(row.email);
    res.json({ ok: true, user: payload });
  } catch (err) {
    console.error("[POST /api/auth/login]", err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.post("/auth/logout", (req: Request, res: Response): void => {
  req.session.destroy(() => {
    res.clearCookie("orakulus_sid");
    res.json({ ok: true });
  });
});

export default router;
