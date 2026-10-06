<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Torino HMS — notas do projeto

- Plano e decisões: `docs/PLANO.md`. Leia antes de mudanças estruturais.
- Stack: Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + Supabase.
- Região obrigatória: app `gru1` (Vercel) e banco `sa-east-1` (Supabase), co-localizados.
- Repositório: `axyonsoftwarehouse/torino-hms` (público) — remote `origin`; deploy automático
  na Vercel a cada push na branch `master`.
- Fuso horário `TZ=America/Sao_Paulo` (definido em `.env.local`/`.env.example` e nas
  variáveis da Vercel). Sem isso, slots e datas ficam deslocados em servidores UTC.
- Multi-tenant: **toda** tabela de domínio tem `tenant_id` + RLS. Nunca desabilite RLS.
- Superadmin tem dois modos: **Plataforma** (sem tenant no cookie `torino_active_tenant` →
  só Painel + Tenants) e **Tenant** (cookie setado via "Entrar" → menu clínico + banner de saída).
  O tenant ativo vem do cookie; não há auto-seleção.
- Server Components acessam o banco direto (`@/lib/supabase/server`); evite waterfalls via API routes.
- Next 16: o antigo `middleware.ts` agora é `src/proxy.ts` (`export function proxy`).

### Comandos

```bash
npm run dev      # desenvolvimento
npm run build    # build de produção
npm run lint     # ESLint (rodar antes de concluir mudanças)
npm run test     # Vitest (rodar antes de concluir mudanças)
```

