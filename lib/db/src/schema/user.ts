import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  senha_hash: text("senha_hash"),
  id_corretora: text("id_corretora").notNull().default(""),
  status_deposito: text("status_deposito").notNull(),
  plano: text("plano").notNull().default("FREE"),
  data_cadastro: timestamp("data_cadastro", { withTimezone: true })
    .notNull()
    .defaultNow(),
  data_expiracao: timestamp("data_expiracao", { withTimezone: true }),
  status_validacao: text("status_validacao").notNull().default("PENDENTE"),
  comprovante_deposito: text("comprovante_deposito"),
  observacao_admin: text("observacao_admin"),
  sinais_consumidos: integer("sinais_consumidos").notNull().default(0),
  sinais_extras_liberados: integer("sinais_extras_liberados").notNull().default(0),
});

export type UsersRow = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
