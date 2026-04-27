# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- **fluxo-vela** (`/`) — Landing page para comunidade de operações ao vivo (mercado de opções binárias) com painel de operação ao vivo, prova social editável e área administrativa.
  - Página pública gratuita: `/` (limite de 5 sinais no histórico + CTA para upgrade)
  - Página premium: `/premium` (assinatura mensal R$97/mês, sinais ilimitados, histórico completo, branding ouro/violeta "ORAKULUS IA PREMIUM")
  - Área admin: `/admin` (senha definida no env `ADMIN_PASSWORD`, padrão `admin123` — altere no painel de Secrets)
  - Componentes/helpers compartilhados entre `home.tsx` e `premium.tsx` são exportados de `home.tsx` (RadialGauge, SignalChart, ResultCelebration, OrakulusLogo, useBrasiliaClock, useCountdown etc.)
  - Backend: rotas em `artifacts/api-server/src/routes/operation.ts`
  - Schema: `lib/db/src/schema/operation.ts` (tabelas `operation_settings`, `operation_history`)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
