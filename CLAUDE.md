# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ZCAT BLOG CMS — a full-stack blog content management system. pnpm monorepo with three apps and two packages.

## Commands

```bash
# Root-level (run on all workspace packages)
pnpm run dev              # Start all dev servers
pnpm run build            # Build all packages
pnpm run typecheck        # Type-check all packages
pnpm run lint             # Lint all packages

# Per-package (replace <name> with: backend, frontend, blog, ui, doc)
pnpm --filter=<name> run dev
pnpm --filter=<name> run build
pnpm --filter=<name> run typecheck
pnpm --filter=<name> run lint

# Backend-specific
pnpm --filter=backend run test         # Unit tests (vitest)
pnpm --filter=backend run test:e2e     # E2E tests (jest)
pnpm --filter=backend run db:generate  # Regenerate Prisma client

# Docker (local dev)
pnpm run docker:dev:db       # Start PostgreSQL only
pnpm run docker:dev          # Start all services (db + backend + frontend + blog)
```

## Architecture

```
zcat-blog-cms/
├── apps/
│   ├── backend/          # NestJS REST API (port 9090)
│   ├── frontend/         # CMS admin panel — React Router 7 framework (port 3000)
│   └── blog/             # Public blog site — React Router 7 framework (port 1024)
├── packages/
│   ├── ui/               # @zcat/ui — shared React component library (Tailwind CSS)
│   └── doc/              # Component library documentation site
```

### Backend (`apps/backend`)

- **Framework**: NestJS with Zod validation (nestjs-zod), NOT class-validator
- **ORM**: Prisma 7 with PostgreSQL (`prisma/schema.prisma`), output to `generated/prisma/`
- **Path aliases** (defined in `tsconfig.json`):
  - `@backend/*` → `src/*`
  - `@backend/prisma` → `generated/prisma/client`
- **Source structure**: `src/features/{cms,public}/` — feature-based with controller + service + schema per domain
  - `src/features/cms/` — authenticated CMS APIs: article, article-tag, auth, photo, photo-album, statistics, system-setting, user-info
  - `src/features/public/` — public APIs: blog (visitor stats)
  - `src/common/` — shared services: PrismaService, OSS, exception filter
  - `src/model/` — ResultData wrapper, pagination schemas
  - `src/utils/` — hash, paginate, type helpers
- **Pattern**: Controller → Service → PrismaService. Controllers use Zod DTOs (via `createZodDto()`), wrap responses in `createResult()`, and log key operations. Swagger decorators on all endpoints.
- **Auth**: Passport JWT strategy, `CmsJwtAuthGuard` protects CMS routes
- **Tests**: Vitest for unit tests (`*.spec.ts` alongside source), Jest for e2e

### Frontend (`apps/frontend`) — CMS Admin

- React Router 7 framework mode (SSR-capable)
- Ant Design + Tailwind CSS v4 + `@zcat/ui`
- **BFF proxy**: `routes/api-bff.$.ts` proxies all `/api/bff/*` requests to the NestJS backend, stripping hop-by-hop headers
- Global error/unauth handling via `HttpClient` subscriptions in `root.tsx`
- State management: Jotai

### Blog (`apps/blog`) — Public Site

- React Router 7 framework mode (SSR-capable)
- Tailwind CSS v4 + `@zcat/ui`
- Routes: home, post-board with detail pages, about, gallery, ai-chat, toolbox (10+ utilities)
- State management: Zustand

### Shared UI (`packages/ui`)

- Built with tsup, consumed as `@zcat/ui` workspace dependency
- Tailwind CSS v4, exports components from `src/index.ts`

## Conventions

- **File naming**: kebab-case enforced by `eslint-plugin-check-file` (both folder and file names)
- **Import order**: enforced by `eslint-plugin-import` — builtin → external → internal → parent → sibling → index, alphabetical
- **Pre-commit**: lint-staged runs ESLint --fix on staged files per package
- **Node**: >=22.4.0, **pnpm**: >=10.5.1

## Environment & Database

- Local PostgreSQL via Docker: `docker compose -f docker-compose.dev.yaml up -d cms_pg`
- Backend env files (in priority order): `.env` → `.env.local` → `.env.{NODE_ENV}`
- Root `.env.deploy` / `.env.deploy.dev` for Docker deployments
- Prisma config in `prisma.config.ts` reads `DATABASE_URL` from environment

## Per-Project Agent Docs

Each sub-project has its own `AGENTS.md` with detailed conventions:
- `apps/backend/AGENTS.md` — NestJS/Prisma constraints, testing requirements
- `apps/frontend/AGENTS.md` — Admin UI patterns, form validation, Playwright E2E
- `apps/blog/AGENTS.md` — Blog SSR/UX requirements, Playwright E2E
- `packages/ui/AGENTS.md` — Component API design, accessibility
- `packages/doc/AGENTS.md` — Documentation quality standards
