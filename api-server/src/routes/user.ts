import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

function add30Days(from: Date): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + 30);
  return d;
}

async function expireOverduePlans() {
  const now = new Date();
  await db
    .update(usersTable)
    .set({ plano: "FREE", data_expiracao: null })
    .where(
      and(
        eq(usersTable.plano, "PREMIUM"),
        isNotNull(usersTable.data_expiracao),
        lt(usersTable.data_expiracao, now),
      ),
    );
}

router.post("/users", async (req: Request, res: Response): Promise<void> => {
  const { nome, email, senha, id_corretora, status_deposito, comprovante_deposito } = req.body as {
    nome?: string;
    email?: string;
    senha?: string;
    id_corretora?: string;
    status_deposito?: string;
    comprovante_deposito?: string;
  };

  if (!nome || !email) {
    res.status(400).json({ error: "Campos obrigatórios: nome, email" });
    return;
  }

  try {
    // Check if email already exists
    const emailNorm = email.trim().toLowerCase();
    const [existing] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, emailNorm)).limit(1);
    if (existing) {
      res.status(409).json({ error: "Este e-mail já está cadastrado. Faça login para continuar." });
      return;
    }

    const senha_hash = senha ? await bcrypt.hash(senha, 12) : null;

    const [user] = await db
      .insert(usersTable)
      .values({
        nome: nome.trim(),
        email: emailNorm,
        senha_hash,
        id_corretora: (id_corretora ?? "").trim(),
        status_deposito: status_deposito ?? "pendente",
        plano: "FREE",
        status_validacao: "PENDENTE",
        comprovante_deposito: (comprovante_deposito ?? "").trim() || null,
      })
      .returning();

    // Auto-login after registration if password provided
    if (senha && user) {
      req.session.userId = user.id;
      req.session.userEmail = user.email;
    }

    res.status(201).json({ ok: true, id: user?.id });
  } catch (err) {
    console.error("[POST /api/users]", err);
    res.status(500).json({ error: "Erro ao salvar dados. Tente novamente." });
  }
});

router.get("/users", async (_req: Request, res: Response): Promise<void> => {
  try {
    await expireOverduePlans();

    const users = await db
      .select({
        id: usersTable.id,
        nome: usersTable.nome,
        email: usersTable.email,
        id_corretora: usersTable.id_corretora,
        status_deposito: usersTable.status_deposito,
        plano: usersTable.plano,
        data_cadastro: usersTable.data_cadastro,
        data_expiracao: usersTable.data_expiracao,
        status_validacao: usersTable.status_validacao,
        comprovante_deposito: usersTable.comprovante_deposito,
        observacao_admin: usersTable.observacao_admin,
        sinais_consumidos: usersTable.sinais_consumidos,
        sinais_extras_liberados: usersTable.sinais_extras_liberados,
      })
      .from(usersTable)
      .orderBy(usersTable.id);

    res.json(users);
  } catch (err) {
    console.error("[GET /api/users]", err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.get("/users/me", async (req: Request, res: Response): Promise<void> => {
  const email = (req.query.email as string | undefined)?.trim().toLowerCase();

  if (!email) {
    res.status(400).json({ error: "Parâmetro email obrigatório." });
    return;
  }

  try {
    const [user] = await db
      .select({
        plano: usersTable.plano,
        nome: usersTable.nome,
        data_expiracao: usersTable.data_expiracao,
        status_validacao: usersTable.status_validacao,
        sinais_consumidos: usersTable.sinais_consumidos,
      })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }

    let plano = user.plano;
    const sv = user.status_validacao ?? "PENDENTE";

    if (
      plano === "PREMIUM" &&
      user.data_expiracao !== null &&
      user.data_expiracao < new Date()
    ) {
      await db
        .update(usersTable)
        .set({ plano: "FREE", data_expiracao: null })
        .where(eq(usersTable.email, email));
      plano = "FREE";
    }

    // Block Premium if not APROVADO
    if (plano === "PREMIUM" && sv !== "APROVADO") {
      plano = "FREE";
    }

    const data_expiracao = plano === "PREMIUM" ? user.data_expiracao : null;
    res.json({ plano, nome: user.nome, data_expiracao, status_validacao: sv, sinais_consumidos: user.sinais_consumidos ?? 0 });
  } catch (err) {
    console.error("[GET /api/users/me]", err);
    res.status(500).json({ error: "Erro interno." });
  }
});

router.patch("/users/plan", async (req: Request, res: Response): Promise<void> => {
  const { email, plano } = req.body as { email?: string; plano?: string };

  if (!email || !plano) {
    res.status(400).json({ error: "Campos obrigatórios: email, plano" });
    return;
  }

  if (!["FREE", "PREMIUM"].includes(plano)) {
    res.status(400).json({ error: "Valor de plano inválido. Use FREE ou PREMIUM." });
    return;
  }

  try {
    // Check validation status before upgrading to Premium
    if (plano === "PREMIUM") {
      const [u] = await db
        .select({ status_validacao: usersTable.status_validacao })
        .from(usersTable)
        .where(eq(usersTable.email, email.trim().toLowerCase()))
        .limit(1);
      if (!u) {
        res.status(404).json({ error: "Usuário não encontrado." });
        return;
      }
      if (u.status_validacao !== "APROVADO") {
        res.status(403).json({ error: "Usuário não aprovado. Aprove o cadastro antes de ativar Premium." });
        return;
      }
    }

    const data_expiracao = plano === "PREMIUM" ? add30Days(new Date()) : null;

    console.log("[PATCH /api/users/plan] recebido:", { email, plano, data_expiracao });

    const [updated] = await db
      .update(usersTable)
      .set({ plano, data_expiracao })
      .where(eq(usersTable.email, email.trim().toLowerCase()))
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        plano: usersTable.plano,
        data_expiracao: usersTable.data_expiracao,
      });

    if (!updated) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }

    res.json({
      ok: true,
      email: updated.email,
      plano: updated.plano,
      data_expiracao: updated.data_expiracao,
    });
  } catch (err) {
    console.error("[PATCH /api/users/plan]", err);
    res.status(500).json({ error: "Erro interno." });
  }
});

/** PATCH /api/users/sinais — increment sinais_consumidos for a registered user */
router.patch("/users/sinais", async (req: Request, res: Response): Promise<void> => {
  const { email, sinais_consumidos } = req.body as { email?: string; sinais_consumidos?: number };

  if (!email || sinais_consumidos === undefined) {
    res.status(400).json({ error: "Campos obrigatórios: email, sinais_consumidos" });
    return;
  }

  try {
    const [updated] = await db
      .update(usersTable)
      .set({ sinais_consumidos })
      .where(eq(usersTable.email, email.trim().toLowerCase()))
      .returning({ sinais_consumidos: usersTable.sinais_consumidos });

    if (!updated) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }

    res.json({ ok: true, sinais_consumidos: updated.sinais_consumidos });
  } catch (err) {
    console.error("[PATCH /api/users/sinais]", err);
    res.status(500).json({ error: "Erro interno." });
  }
});

/** PATCH /api/users/validate — approve or reject a user registration */
router.patch("/users/validate", async (req: Request, res: Response): Promise<void> => {
  const { email, status_validacao, observacao_admin } = req.body as {
    email?: string;
    status_validacao?: string;
    observacao_admin?: string;
  };

  if (!email || !status_validacao) {
    res.status(400).json({ error: "Campos obrigatórios: email, status_validacao" });
    return;
  }

  if (!["APROVADO", "RECUSADO", "PENDENTE"].includes(status_validacao)) {
    res.status(400).json({ error: "status_validacao deve ser APROVADO, RECUSADO ou PENDENTE" });
    return;
  }

  try {
    const updateData: Record<string, string | number | null> = { status_validacao };
    if (observacao_admin !== undefined) updateData.observacao_admin = observacao_admin ?? null;
    if (status_validacao === "APROVADO") updateData.sinais_extras_liberados = 10;

    const [updated] = await db
      .update(usersTable)
      .set(updateData)
      .where(eq(usersTable.email, email.trim().toLowerCase()))
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        status_validacao: usersTable.status_validacao,
        sinais_extras_liberados: usersTable.sinais_extras_liberados,
      });

    if (!updated) {
      res.status(404).json({ error: "Usuário não encontrado." });
      return;
    }

    console.log("[PATCH /api/users/validate]", updated);
    res.json({ ok: true, email: updated.email, status_validacao: updated.status_validacao });
  } catch (err) {
    console.error("[PATCH /api/users/validate]", err);
    res.status(500).json({ error: "Erro interno." });
  }
});

export default router;
