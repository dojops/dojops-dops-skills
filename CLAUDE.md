# CLAUDE.md — DojOps Organization

This file provides guidance to Claude Code when working across the DojOps GitHub organization (`github.com/dojops`).

## Organization Overview

DojOps is an enterprise-grade AI DevOps automation engine. It generates, validates, and executes infrastructure & CI/CD configurations using LLM providers — with structured output enforcement, 12 built-in DevOps tools, a custom tool system, 16 built-in specialist agents + custom agents, sandboxed execution, approval workflows, hash-chained audit trails, a REST API with web dashboard, a tool marketplace (DojOps Hub), and a rich terminal UI.

## Repository Map

```
dojops-org/
├── dojops/           # Main monorepo — CLI, API, all @dojops/* packages (the product)
├── dojops.ai/        # Marketing website / landing page (Next.js 16, Tailwind v4, static export)
├── dojops-doc/       # Documentation site (Next.js 15, Nextra 4, MDX content, 18 pages, pagefind search)
├── dojops-hub/       # Tool marketplace hub (Next.js 15, PostgreSQL, Prisma, NextAuth)
└── homebrew-tap/     # Homebrew formula for macOS/Linux installation
```

All satellite repos include: `README.md`, `CONTRIBUTING.md`, `.github/workflows/ci.yml`, `.github/ISSUE_TEMPLATE/` (bug_report.md + feature_request.md).

---

## `dojops/` — Main Monorepo

The core product. pnpm workspaces + Turbo. TypeScript (ES2022, CommonJS). All packages under `@dojops/*` scope.

### Commands

```bash
cd dojops/
pnpm install            # Install dependencies
pnpm build              # Build all packages via Turbo
pnpm dev                # Dev mode (no caching)
pnpm test               # Vitest across all packages (1931 tests)
pnpm lint               # ESLint across all packages
pnpm format             # Prettier write
pnpm format:check       # Prettier check (CI)

# Per-package
pnpm --filter @dojops/core build
pnpm --filter @dojops/sdk build
pnpm --filter @dojops/core test

# Run CLI (after `npm link` for global `dojops`, or use `pnpm dojops --`)
dojops "Create a Terraform config for S3"
dojops --plan "Create CI for Node app"
dojops --execute "Create CI for Node app"
dojops --execute --yes "Create CI for Node app"
dojops --debug-ci "ERROR: tsc failed..."
dojops --diff "terraform plan output..."

# In-repo development (no global link needed)
pnpm dojops -- "Create a Terraform config for S3"
pnpm dojops -- --plan "Create CI for Node app"

# Run API server + dashboard
dojops serve                         # http://localhost:3000
dojops serve --port=8080
dojops serve credentials             # Generate API key for dashboard auth
pnpm dojops -- serve                 # in-repo alternative
```

### Packages (10)

| Package | Description |
|---|---|
| `@dojops/cli` | CLI entry point (`dojops "prompt"`, `dojops serve`), rich TUI via @clack/prompts |
| `@dojops/api` | REST API (Express) + web dashboard, 19 HTTP endpoints, factory functions |
| `@dojops/tool-registry` | Tool registry + custom tool system + custom agent discovery |
| `@dojops/runtime` | 12 built-in DevOps tools (GHA, Terraform, K8s, Helm, Ansible, Docker Compose, Dockerfile, Nginx, Makefile, GitLab CI, Prometheus, Systemd) |
| `@dojops/scanner` | 9 security scanners (npm-audit, pip-audit, trivy, gitleaks, checkov, hadolint, shellcheck, trivy-sbom, semgrep) |
| `@dojops/session` | Interactive AI chat session management |
| `@dojops/planner` | TaskGraph decomposition (LLM) + topological executor |
| `@dojops/executor` | SafeExecutor: sandbox + policy engine + approval workflows + audit log |
| `@dojops/core` | LLM abstraction: 6 providers (OpenAI, Anthropic, Ollama, DeepSeek, Gemini, GitHub Copilot) + 16 specialist agents + structured output (Zod) |
| `@dojops/sdk` | BaseTool<T> abstract class with Zod validation + file-reader utilities |

**Dependency flow:** `cli -> api -> tool-registry -> runtime -> core -> sdk`, plus `api -> planner -> executor`, `api -> scanner`, `api -> session -> core`

### Architecture

**Package dependency flow** (top -> bottom):

```
@dojops/cli            -> Entry point: `dojops "prompt"` and `dojops serve`, imports factories from @dojops/api
@dojops/api            -> REST API (Express) + web dashboard, factory functions, exposes all capabilities via HTTP
@dojops/tool-registry  -> Tool registry + custom tool system + custom agent discovery
@dojops/scanner        -> Security scanning engine: vulnerability, dependency, IaC, secret, SBOM scanning
@dojops/session        -> Interactive AI chat session management with multi-turn conversation support
@dojops/planner        -> TaskGraph decomposition (LLM) + topological executor
@dojops/executor       -> SafeExecutor: sandbox + policy engine + approval workflows + audit log
@dojops/tools          -> 12 built-in DevOps tools
@dojops/core           -> LLM abstraction: DevOpsAgent + providers + structured output (Zod)
@dojops/sdk            -> BaseTool<T> abstract class with Zod inputSchema validation + file-reader utilities
```

**API endpoints** (`@dojops/api`, available at both `/api/` and `/api/v1/`):

| Method | Path                    | Description                                          |
| ------ | ----------------------- | ---------------------------------------------------- |
| GET    | `/api/health`           | Auth indicator + provider status                     |
| POST   | `/api/generate`         | Agent-routed LLM generation                          |
| POST   | `/api/plan`             | Decompose goal + optional execution                  |
| POST   | `/api/debug-ci`         | CI log diagnosis                                     |
| POST   | `/api/diff`             | Infrastructure diff analysis                         |
| POST   | `/api/scan`             | Run security/dependency/IaC scans                    |
| POST   | `/api/chat`             | Send a chat message (with agent routing)             |
| POST   | `/api/chat/sessions`    | Create a new chat session                            |
| GET    | `/api/chat/sessions`    | List all chat sessions                               |
| GET    | `/api/chat/sessions/:id`| Get a specific chat session                          |
| DELETE | `/api/chat/sessions/:id`| Delete a chat session                                |
| GET    | `/api/agents`           | List specialist agents (built-in + custom)           |
| GET    | `/api/history`          | Execution history                                    |
| GET    | `/api/history/:id`      | Single history entry                                 |
| DELETE | `/api/history`          | Clear history                                        |
| GET    | `/api/metrics`          | Full dashboard metrics (overview + security + audit) |
| GET    | `/api/metrics/overview` | Plan/execution/scan aggregates                       |
| GET    | `/api/metrics/security` | Scan findings, severity trends                       |
| GET    | `/api/metrics/audit`    | Audit chain integrity + timeline                     |

**Key abstractions:**

- `LLMProvider` interface (`packages/core/src/llm/provider.ts`) — `generate(LLMRequest): Promise<LLMResponse>`, optional `listModels()`, supports `schema` field for structured JSON output, `temperature` passthrough to all 6 providers
- `DeterministicProvider` (`packages/core/src/llm/deterministic-provider.ts`) — forces `temperature: 0`; used by `--replay` mode
- `GitHubCopilotProvider` (`packages/core/src/llm/github-copilot.ts`) — OpenAI SDK with Copilot API, fresh JWT per call, `KNOWN_COPILOT_MODELS` fallback
- `getValidCopilotToken()` (`packages/core/src/llm/copilot-auth.ts`) — OAuth Device Flow, JWT auto-refresh, token persistence at `~/.dojops/copilot-token.json`, `GITHUB_COPILOT_TOKEN` env var bypass
- `parseAndValidate()` (`packages/core/src/llm/json-validator.ts`) — strips markdown fences, JSON.parse, Zod safeParse; used by all providers
- `AgentRouter` (`packages/core/src/agents/router.ts`) — keyword-based routing to specialist agents with confidence scoring
- `SpecialistAgent` (`packages/core/src/agents/specialist.ts`) — 16 built-in specialists + user-defined custom agents
- `CIDebugger` / `InfraDiffAnalyzer` — structured diagnosis/analysis agents
- `BaseTool<TInput>` (`packages/sdk/src/tool.ts`) — abstract class with Zod `inputSchema`, auto `validate()`, abstract `generate()`, optional `execute()`, optional `verify()`
- `ToolRegistry` (`packages/tool-registry/src/registry.ts`) — unified registry combining built-in + custom tools
- `CustomTool` (`packages/tool-registry/src/custom-tool.ts`) — converts declarative `tool.yaml` manifests into `DevOpsTool`-compatible objects
- `SafeExecutor` (`packages/executor/src/safe-executor.ts`) — generate -> verify -> approval -> execute with policy checks, timeout, audit logging
- `ExecutionPolicy` (`packages/executor/src/types.ts`) — write permissions, allowed/denied paths, env vars, timeout, file size limits, approval, `skipVerification`
- `createApp(deps)` (`packages/api/src/app.ts`) — Express app factory with dependency injection
- `MetricsAggregator` (`packages/api/src/metrics/aggregator.ts`) — reads `.dojops/` data on-demand, computes `OverviewMetrics`, `SecurityMetrics`, `AuditMetrics`

**Tool pattern** (all 12 built-in tools follow this):

```
schemas.ts     -> Zod input/output schemas (includes optional `existingContent` field)
detector.ts    -> (optional) filesystem detection
generator.ts   -> LLM call with structured schema -> serialization (YAML/HCL)
verifier.ts    -> (optional) external tool validation (terraform validate, hadolint, kubectl)
*-tool.ts      -> BaseTool subclass: generate(), verify(), execute()
```

**Test organization**: All test files live in `__tests__/` directories mirroring the source structure (e.g. `src/__tests__/llm/copilot-auth.test.ts` tests `src/llm/copilot-auth.ts`). Dynamic `import()` and `vi.mock()` paths must use correct relative paths from `__tests__/` to source.

### Current Status

**Implemented (Phase 1–8):**

- `@dojops/core` — DevOpsAgent + 6 LLM providers + structured output + temperature passthrough + `DeterministicProvider` + multi-agent system (AgentRouter, 16 SpecialistAgents) + CIDebugger + InfraDiffAnalyzer
- `@dojops/sdk` — `BaseTool<TInput>` with Zod inputSchema, `verify()`, `readExistingConfig()`/`backupFile()`
- `@dojops/planner` — TaskGraph decomposition, `PlannerExecutor` with topological sort + dependency resolution
- `@dojops/tools` — 12 tools with schemas, generators, detectors, verifiers. Update support via auto-detection + `.bak` backup
- `@dojops/tool-registry` — Built-in + custom tool discovery, `tool.yaml` manifests, JSON Schema to Zod, tool policy, audit enrichment, verification command whitelist, custom agent discovery from `.dojops/agents/`
- `@dojops/executor` — `SafeExecutor` with `ExecutionPolicy`, approval workflows, `SandboxedFs`, `AuditEntry` logging
- `@dojops/scanner` — 9 scanners, `--security`/`--deps`/`--iac`/`--sbom` modes, `--compare` for deltas
- `@dojops/session` — Multi-turn chat, session persistence, agent routing
- `@dojops/cli` — Full lifecycle: `init`, `plan`, `validate`, `apply`, `destroy`, `rollback`, `explain`, `debug ci`, `analyze diff`, `inspect`, `agents` (list/info/create/remove), `history` (list/show/verify), `status`/`doctor`, `config`, `auth`, `serve`, `chat`, `check`, `scan`, `tools` (list/validate/init/publish/install), `toolchain` (list/install/remove/clean). Replay mode, execution locking, hash-chained audit logs, rich TUI
- `@dojops/api` — 19 HTTP endpoints, Zod validation middleware, `HistoryStore`, API key auth, `MetricsAggregator`, web dashboard
- Specifications — `docs/TOOL_SPEC_v1.md` (frozen v1, **deprecated** — `.dops` format is the current standard)
- Release tracking — `CHANGELOG.md` ([Keep a Changelog](https://keepachangelog.com) format), `RELEASE.md` (v1.0.2 feature overview)

**Current version:** v1.0.3 (first official public release: v1.0.2)

**Phase 9 — Enterprise Readiness (v2.0.0):** RBAC, persistent storage, OpenTelemetry, enterprise integrations

### Key Files

- `dojops/docs/architecture.md` — System design
- `dojops/docs/tools.md` — Full tools documentation (built-in + custom + hub integration)
- `dojops/docs/cli-reference.md` — CLI command reference
- `dojops/docs/TOOL_SPEC_v1.md` — Legacy tool contract specification (deprecated, `.dops` is current)
- `dojops/.github/workflows/ci.yml` — CI pipeline (build, lint, test, security audit, Node 20/22 matrix)
- `dojops/.github/workflows/release.yml` — Release pipeline (changelog-driven release notes)
- `dojops/CHANGELOG.md` — Release history ([Keep a Changelog](https://keepachangelog.com) format)
- `dojops/RELEASE.md` — v1.0.2 feature overview for first public release

### Path Aliases

Defined in root `tsconfig.json`:

- `@dojops/core/*` -> `packages/core/src/*`
- `@dojops/sdk/*` -> `packages/sdk/src/*`
- `@dojops/planner/*` -> `packages/planner/src/*`
- `@dojops/tools/*` -> `packages/tools/src/*`
- `@dojops/executor/*` -> `packages/executor/src/*`
- `@dojops/scanner/*` -> `packages/scanner/src/*`
- `@dojops/session/*` -> `packages/session/src/*`
- `@dojops/api/*` -> `packages/api/src/*`
- `@dojops/tool-registry/*` -> `packages/tool-registry/src/*`

---

## `dojops-hub/` — Tool Marketplace

Next.js 15.2.1 (App Router) + PostgreSQL 16 + Prisma 6.4.1 + NextAuth 4.24.11 (GitHub OAuth) + Tailwind CSS v4.0.9 + Zod 3.24.2. Cyberpunk theme shared with dojops.ai.

### Commands

```bash
cd dojops-hub/
npm install
npm run dev               # Dev server on http://localhost:3000
npm run build             # prisma generate + next build
npm run lint              # Next.js lint
npx prisma migrate dev    # Run migrations in development
npx prisma migrate deploy # Apply migrations in production
npx prisma studio         # Visual database browser
npx prisma generate       # Regenerate Prisma client
docker-compose up --build # Full stack (app + postgres)
```

### Dependencies

**Runtime:** `next` ^15.2.1, `react` ^19.0.0, `@prisma/client` ^6.4.1, `next-auth` ^4.24.11, `@auth/prisma-adapter` ^2.7.4, `zod` ^3.24.2, `js-yaml` ^4.1.0
**Dev:** `prisma` ^6.4.1, `tailwindcss` ^4.0.9, `@tailwindcss/postcss` ^4.0.9, `typescript` ^5.7.3

### Database Models

`User`, `Account`, `Session`, `VerificationToken` (NextAuth), `ApiToken`, `Package`, `Version`, `Star`, `Comment`. PostgreSQL full-text search via `tsvector` + GIN index on `Package.searchVector` with trigger-based updates.

- **Package**: name (unique), slug (unique), description (500 chars), tags (string[]), status (ACTIVE/FLAGGED/REMOVED), starCount, downloadCount, searchVector (tsvector)
- **Version**: semver (unique per package), filePath, fileSize, sha256, riskLevel (LOW/MEDIUM/HIGH), permissions (JSON), inputFields (JSON), outputSpec (JSON), fileSpecs (JSON)
- **Star**: unique constraint on [userId, packageId], cascade delete
- **Comment**: body (text), cascade delete, indexed on packageId
- **User**: githubId (unique), username (unique), role (USER/ADMIN), bio (500 chars)
- **ApiToken**: name, tokenHash (unique, SHA-256), tokenPrefix (first 12 chars), expiresAt (nullable), lastUsedAt, cascade delete on User. Max 10 per user. Token format: `dojops_` + 40 hex chars

### Hub API Endpoints

| Method | Route | Auth | Rate Limit | Description |
|---|---|---|---|---|
| GET | `/api/packages` | No | — | List packages (pagination, sort: recent/stars/downloads, tag filter) |
| POST | `/api/packages` | Yes | 5/hr | Publish new package (multipart, max 1MB, SHA-256 verification) |
| GET | `/api/packages/:slug` | No | — | Package detail + latest version |
| GET | `/api/packages/:slug/:ver` | No | — | Specific version detail |
| POST | `/api/packages/:slug/star` | Yes | 30/min | Toggle star (atomic transaction with starCount) |
| GET | `/api/packages/:slug/comments` | No | — | List comments (newest first) |
| POST | `/api/packages/:slug/comments` | Yes | 10/min | Post comment (max 2000 chars) |
| GET | `/api/download/:slug/:ver` | No | — | Download .dops file (`X-Checksum-Sha256` header, increments downloadCount) |
| GET | `/api/search?q=` | No | 60/min | Full-text search (ts_rank ranking) |
| GET | `/api/users/:username` | No | — | Public user profile with package/star counts |
| PATCH | `/api/admin/packages/:id` | Admin | — | Moderate package (ACTIVE/FLAGGED/REMOVED) |
| GET | `/api/tokens` | Session | — | List current user's API tokens |
| POST | `/api/tokens` | Session | 5/hr | Create new API token (returns raw token once) |
| DELETE | `/api/tokens/:id` | Session | — | Revoke an API token |

### Publish/Install Integrity

- **Authentication**: All authenticated Hub endpoints accept both Bearer tokens (`Authorization: Bearer dojops_...`) and session cookies. Bearer token is checked first; session cookie is the fallback. Token CRUD endpoints (`/api/tokens`) are session-only for security.
- **Publish**: CLI sends `Authorization: Bearer <token>` header. Computes SHA-256 client-side, sends it as a multipart field. Hub verifies the hash matches the uploaded file, stores the client hash as the **publisher attestation**.
- **Install**: CLI downloads the `.dops` file, receives the publisher hash via `X-Checksum-Sha256` header, recomputes locally, and compares. Mismatch aborts with integrity error.

### Library Files (`src/lib/`)

| File | Purpose |
|---|---|
| `auth.ts` | NextAuth config: GitHub OAuth provider, PrismaAdapter, session callback (enriches with role, username, avatarUrl) |
| `prisma.ts` | Singleton Prisma client (global reuse in dev to prevent connection pool exhaustion) |
| `dops-parser.ts` | Parse .dops files: split YAML frontmatter (`---` delimiters) from markdown, validate against Zod, extract sections (Prompt, Examples, Constraints, Keywords) |
| `dops-schema.ts` | Zod schemas ported from `@dojops/runtime/spec.ts`: DopsFrontmatterSchema, MetaSchema, InputFieldSchema, OutputSchemaSchema, FileSpecSchema, PermissionsSchema, RiskSchema, ExecutionSchema, VerificationConfigSchema |
| `storage.ts` | File I/O: `saveDopsFile()`, `readDopsFile()`, `getDopsFilePath()` — stores at `uploads/<slug>/<version>.dops` |
| `search.ts` | PostgreSQL FTS: `searchPackages()` (tsvector + ts_rank), `listPackages()` (sort + tag filter), input sanitization |
| `rate-limit.ts` | In-memory Map with TTL, auto-cleanup every 60s. Limits: publish 5/hr, star 30/min, comment 10/min, search 60/min, tokenCreate 5/hr |
| `api-auth.ts` | `getAuthenticatedUser(req)`: Bearer token auth (SHA-256 hash lookup, expiry check) with session cookie fallback |
| `utils.ts` | `slugify()`, `sha256()`, `formatBytes()`, `formatDate()`, `timeAgo()` |

### Components (30+)

**Layout:** `Navbar.tsx` (sticky, glass-blur, mobile drawer, auth state), `Footer.tsx`, `Sidebar.tsx`
**UI:** `GlowCard.tsx`, `Button.tsx` (primary/secondary/ghost, sm/md/lg), `Badge.tsx`, `SearchBar.tsx` (debounced), `Pagination.tsx`, `SectionHeading.tsx`, `Spinner.tsx`, `EmptyState.tsx`
**Package:** `PackageCard.tsx`, `PackageDetail.tsx`, `PackageGrid.tsx`, `DopsPreview.tsx` (prompt/examples/constraints sections), `VersionHistory.tsx`, `RiskBadge.tsx`, `PermissionBadges.tsx`, `IntegrityHash.tsx` (expand/copy SHA-256), `InstallCommand.tsx`
**Community:** `StarButton.tsx` (optimistic UI), `CommentThread.tsx`, `CommentItem.tsx`, `AuthorBadge.tsx`
**Publish:** `PublishForm.tsx` (drag-drop, client-side YAML preview, changelog), `MetadataPreview.tsx`
**User:** `UserProfile.tsx`, `UserPackages.tsx`, `UserStars.tsx`
**Admin:** `PackageModeration.tsx` (status controls)
**Settings:** `TokenManager.tsx` (API token create/list/revoke with one-time display)
**Auth:** `SessionProvider.tsx` (NextAuth client wrapper)

### Docker Setup

**Dockerfile**: Multi-stage (node:20-slim) — deps → builder (prisma generate + next build) → runner (non-root `nextjs:1001`, standalone output, runs `prisma migrate deploy` on startup, `/app/uploads` volume)
**docker-compose.yml**: `db` (postgres:16-alpine, healthcheck: pg_isready, volume: pgdata) + `app` (port 3000, volume: uploads, depends on db healthy)

### CI/CD

`.github/workflows/ci.yml`: build (with PostgreSQL 16 service container, Prisma generate + migrate), lint, security (npm audit), Docker build, summary gate.

### Key Files

- `prisma/schema.prisma` — Database schema (8 models)
- `src/lib/auth.ts` — NextAuth config (GitHub OAuth + Prisma adapter)
- `src/lib/dops-parser.ts` — .dops file parser (ported from @dojops/runtime)
- `src/lib/dops-schema.ts` — Zod schemas (ported from @dojops/runtime/spec.ts)
- `src/lib/storage.ts` — File storage (uploads/<slug>/<version>.dops)
- `src/lib/search.ts` — PostgreSQL full-text search queries
- `src/lib/rate-limit.ts` — In-memory rate limiter
- `next.config.mjs` — Standalone output, GitHub avatar remote patterns
- `docker-compose.yml` — Full stack (app + postgres)
- `.github/workflows/ci.yml` — CI pipeline

---

## `dojops.ai/` — Marketing Website

Next.js 16.1.6 (App Router), React 19.2.3, Tailwind CSS v4, static export (`output: "export"`). Single-page cyberpunk dark theme with neon cyan accents. Zero runtime dependencies beyond React/Next.js.

### Commands

```bash
cd dojops.ai/
npm install
npm run dev     # Dev server on http://localhost:3000
npm run build   # Static export to /out/
npm run start   # Serve /out/ directory
npm run lint    # ESLint
```

### Dependencies

**Runtime:** `next` 16.1.6, `react` 19.2.3, `react-dom` 19.2.3
**Dev:** `tailwindcss` ^4, `@tailwindcss/postcss` ^4, `typescript` ^5, `eslint` ^9, `eslint-config-next` 16.1.6

### Design System (`src/app/globals.css`)

**Theme tokens (CSS variables):**
- `--bg-deep: #050508` — Deep black background
- `--neon-cyan: #00e5ff` — Primary accent (also `--neon-cyan-dim: #00b8d4`)
- `--dark-navy: #0d1117` — GitHub dark variant
- `--surface: #0a0f18` / `--surface-elevated: #111827` — Card/elevated backgrounds
- `--text-primary: #e8edf5` / `--text-secondary: #7b8ba3`
- `--glass-border: rgba(0, 200, 255, 0.06)` / `--glass-border-hover: rgba(0, 229, 255, 0.18)`
- `--glow-cyan` / `--glow-cyan-strong` — Box-shadow glow effects

**Fonts:** Sora (`--font-sora`, body/headings) + JetBrains Mono (`--font-jetbrains-mono`, code/terminal), loaded via `next/font/google`

**Animations:** `drift-1/2/3` (floating icons), `typeIn` (terminal text), `blink` (cursor), `fadeInUp` (scroll reveal), `shimmer`, `float`, `pulse-border`, `slideDown` (mobile menu)

**Utility classes:** `.glow-card`, `.floating-icon`, `.badge-shimmer`, `.text-gradient-cyan`, `.ambient-glow`, `.noise-overlay`, `.cursor-blink`, `.section-divider`, `.mobile-drawer-enter`

**Accessibility:** `@media (prefers-reduced-motion: reduce)` disables all animations

### Components (15)

| Component | Purpose |
|---|---|
| `Navbar.tsx` | Sticky glass-blur nav with mobile drawer, scroll-aware styling |
| `Hero.tsx` | 3D icon with radial glow, headline, CTA buttons, terminal demo embed |
| `TerminalDemo.tsx` | CSS-driven typewriter animation showing `dojops plan` output |
| `InstallSection.tsx` | Tabbed install (npm/curl/Docker) with copy button |
| `HighlightStats.tsx` | 6 metrics grid (12 tools, 16 agents, 9 scanners, 6 providers, 8 security layers, 19 endpoints) |
| `HowItWorks.tsx` | 3-step flow: Describe → Review → Apply |
| `Features.tsx` | 6 GlowCard feature descriptions in 3-column grid |
| `ToolsGrid.tsx` | 12 DevOps tools (6-col grid) + 6 LLM providers (flex) with icons |
| `Security.tsx` | 8 security layers in 4-column grid |
| `Footer.tsx` | Final CTA, copyright, links (GitHub, npm, Docs, Hub) |
| `FloatingIconsBg.tsx` | 26 DevOps icons with drift animations at 3-4% opacity |
| `ScrollReveal.tsx` | IntersectionObserver fade-in + slide-up wrapper |
| `SectionHeading.tsx` | Reusable section title + subtitle |
| `GlowCard.tsx` | Glassmorphic card with hover glow/shadow/transform |
| `CopyButton.tsx` | Copy-to-clipboard toggle (copy → checkmark, 2s flash) |

### Content Data (`src/lib/constants.ts`)

All page content is driven by typed constants: `LINKS` (github, npm, docs, hub URLs), `NAV_ITEMS`, `INSTALL_COMMANDS`, `FEATURES` (6 capabilities), `DEVOPS_TOOLS` (12), `LLM_PROVIDERS` (6), `HOW_IT_WORKS_STEPS` (3), `TERMINAL_LINES` (animated demo), `SECURITY_FEATURES` (8 layers), `HIGHLIGHT_STATS` (6 metrics)

### Docker

Multi-stage: deps (node:20-slim) → builder (next build → `/out/`) → runner (nginx:alpine on port 3000, 1-year cache on assets, try_files for SPA routing)

### Metadata

Base URL: `https://dojops.ai`. Full OpenGraph + Twitter Card. Favicon: `/icons/dojops-favicon.png`. Keywords: DevOps, AI, automation, infrastructure, CI/CD, Terraform, Kubernetes, GitHub Actions.

### CI/CD

`.github/workflows/ci.yml`: build (static export + artifact upload), lint (ESLint + Prettier), security (npm audit), Docker build, summary gate.

### Key Files

- `src/lib/constants.ts` — All content data (features, tools, providers, stats, terminal demo, links)
- `src/app/globals.css` — Full design system (CSS variables, glow effects, 10+ animations)
- `src/app/layout.tsx` — Root layout, fonts (Sora + JetBrains Mono), SEO metadata, favicon (`/icons/dojops-favicon.png`)
- `src/app/page.tsx` — Single-page home (8 sections)
- `next.config.ts` — Static export, unoptimized images
- `Dockerfile` — Multi-stage build with nginx serving
- `.github/workflows/ci.yml` — CI pipeline

---

## `dojops-doc/` — Documentation Site

Next.js 15.1.0 + Nextra 4.2.0 (nextra-theme-docs) + React 19.0.0 + TypeScript 5.7.0 + Pagefind (search). Standalone output for Docker. 18 MDX content files in 6 sections.

### Commands

```bash
cd dojops-doc/
npm install
npm run dev           # Dev server with hot reload
npm run build         # Production build (standalone)
# postbuild runs:    pagefind --site .next/server/app --output-path public/_pagefind
npm run start         # Start production server
npm run format        # Prettier write
npm run format:check  # Prettier check (CI)
```

### Dependencies

**Runtime:** `next` ^15.1.0, `nextra` ^4.2.0, `nextra-theme-docs` ^4.2.0, `react` ^19.0.0, `react-dom` ^19.0.0
**Dev:** `typescript` ^5.7.0, `@types/node` 25.3.3, `@types/react` ^19.0.0, `pagefind` ^1.4.0, `prettier` ^3.8.1, `husky` ^9.1.7, `lint-staged` ^16.3.1

### Next.js Config

```javascript
import nextra from 'nextra'
const withNextra = nextra({})
export default withNextra({ reactStrictMode: true, output: 'standalone' })
```

### Theme Configuration (`app/layout.tsx`)

- **Navbar**: DojOps logo (icon + text) + GitHub project link
- **Banner**: Promotional link to dojops.ai (dismissible, persisted via `storageKey`)
- **Footer**: "MIT {year} © DojOps"
- **Sidebar**: `defaultMenuCollapseLevel: 1`
- **Edit link**: "Edit this page on GitHub" → `https://github.com/dojops/dojops-doc/blob/main`
- **Metadata**: Title template `%s — DojOps Docs`, favicon ⚙️

### Content Structure (`content/`)

```
content/
├── _meta.js              # Main nav: Introduction, Getting Started, Usage, Architecture, Components, Community
├── index.mdx             # Homepage / Introduction
├── getting-started/
│   ├── _meta.js          # Installation, Quick Start, Configuration, Provider Management
│   ├── installation.mdx
│   ├── quickstart.mdx
│   ├── configuration.mdx
│   └── providers.mdx
├── usage/
│   ├── _meta.js          # CLI Reference, API Reference, Web Dashboard
│   ├── cli.mdx
│   ├── api.mdx
│   └── dashboard.mdx
├── architecture/
│   ├── _meta.js          # System Design, Security Model
│   ├── overview.mdx
│   └── security-model.mdx
├── components/
│   ├── _meta.js          # Specialist Agents, DevOps Tools, Tool Spec v1 (Deprecated), Security Scanning, Execution Engine, Task Planner
│   ├── agents.mdx
│   ├── tools.mdx
│   ├── tool-spec-v1.mdx
│   ├── security-scanning.mdx
│   ├── execution-engine.mdx
│   └── planner.mdx
└── community/
    ├── _meta.js          # Contributing, Troubleshooting
    ├── contributing.mdx
    └── troubleshooting.mdx
```

Total: 18 MDX files + 6 `_meta.js` navigation files

### Docker

Multi-stage (node:20-slim): deps → builder → runner (non-root `nextjs:1001`, standalone output, port 3000, `NODE_ENV=production`)

### Routing

Catch-all dynamic route `app/[[...mdxPath]]/page.tsx` with `generateStaticParams` for SSG. Custom `mdx-components.tsx` extends Nextra theme defaults.

### Search

Pagefind indexes the built site during `postbuild`. Output goes to `public/_pagefind/` (gitignored). The Nextra search bar loads `/pagefind/pagefind.js` at runtime.

### CI/CD

`.github/workflows/ci.yml`: build (with pagefind indexing), format check (Prettier), security (npm audit), Docker build, summary gate.

### Key Files

- `content/components/tools.mdx` — Built-in tools, custom tool system, hub integration
- `content/components/tool-spec-v1.mdx` — Legacy v1 tool specification (deprecated, `.dops` is current)
- `content/usage/cli.mdx` — CLI command reference
- `content/usage/api.mdx` — REST API reference (19 endpoints)
- `content/architecture/overview.mdx` — System design
- `content/architecture/security-model.mdx` — Security architecture
- `app/layout.tsx` — Nextra theme configuration (navbar, footer, sidebar, banner)
- `next.config.mjs` — Nextra plugin + standalone output
- `.github/workflows/ci.yml` — CI pipeline

---

## Installation Methods

DojOps ships via 3 channels:

```bash
npm i -g @dojops/cli                                                       # npm
curl -fsSL https://raw.githubusercontent.com/dojops/dojops/main/install.sh | sh  # Shell script
docker run --rm -it ghcr.io/dojops/dojops "prompt"                        # Docker (GHCR)
```

## Release Workflow

Triggered on `v*` tags pushed to `dojops/dojops`. Defined in `dojops/.github/workflows/release.yml`.

1. Build + test + lint
2. Validate all 10 `package.json` versions match the git tag
3. Publish to npm (`pnpm publish-packages`)
4. Extract release notes from `CHANGELOG.md` (awk-based section extraction for the tagged version)
5. Generate SHA256 checksums, create GitHub Release with changelog body + `SHA256SUMS.txt`
6. Build + push Docker image to `ghcr.io/dojops/dojops:{version}` + `:latest`

**Release process:** Before tagging, move items from `[Unreleased]` in `CHANGELOG.md` into a new `[X.Y.Z] - YYYY-MM-DD` section. The workflow extracts that section as the release body.

**Required secrets:** `NPM_TOKEN` (npm publishing), `GITHUB_TOKEN` (GHCR, automatic)

## Tech Stack

- **Runtime:** Node.js >= 20
- **Language:** TypeScript 5.4+ (ES2022, CommonJS)
- **Build:** pnpm 8 workspaces + Turborepo
- **Testing:** Vitest (1931 tests)
- **Linting:** ESLint + Prettier
- **API:** Express + cors
- **LLM Providers:** OpenAI, Anthropic, Ollama, DeepSeek, Google Gemini, GitHub Copilot
- **Schema validation:** Zod (input/output schemas on every tool and LLM call)
- **Docker:** Multi-stage build (node:20-slim), published to GHCR
- **CI:** GitHub Actions (Node 20/22 matrix)
- **Hub:** Next.js 15, PostgreSQL 16, Prisma, NextAuth.js, Tailwind CSS v4

## Environment Variables

### Main monorepo (`dojops/.env`)

- `DOJOPS_PROVIDER`: `openai` (default) | `anthropic` | `ollama` | `deepseek` | `gemini` | `github-copilot`
- `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `DEEPSEEK_API_KEY` / `GEMINI_API_KEY` as needed
- `GITHUB_COPILOT_TOKEN`: GitHub OAuth token — optional, skips interactive Device Flow for CI/CD
- `DOJOPS_MODEL`: LLM model override
- `DOJOPS_TEMPERATURE`: LLM temperature override (0-2)
- `DOJOPS_API_PORT`: API server port (default `3000`)
- `DOJOPS_API_KEY`: API key for server authentication
- `DOJOPS_SCAN_TIMEOUT_MS`: Scan route timeout (default `120000`ms)
- `OLLAMA_HOST`: Ollama server URL (default `http://localhost:11434`)
- `OLLAMA_TLS_REJECT_UNAUTHORIZED`: Set to `false` to skip TLS cert verification (default `true`)
- `DOJOPS_HUB_URL`: Hub API base URL (default `https://hub.dojops.ai`)
- `DOJOPS_HUB_TOKEN`: API token for publishing tools (`dojops_` prefix, generated at hub `/settings/tokens`)

### Hub (`dojops-hub/.env`)

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: NextAuth base URL (e.g. `http://localhost:3000`)
- `NEXTAUTH_SECRET`: Random secret for NextAuth session encryption
- `GITHUB_ID`: GitHub OAuth App client ID
- `GITHUB_SECRET`: GitHub OAuth App client secret

## Cross-Repo Conventions

- All repos belong to the `dojops` GitHub organization
- The main monorepo (`dojops/dojops`) is the source of truth for all logic
- Docker images are tagged with both version number and `latest`
- npm packages are published under the `@dojops` scope with public access
- Version numbers are kept in sync across all 10 packages — the release workflow enforces this
- The hub's `.dops` parser and Zod schemas are ported from `@dojops/runtime` (not imported as a dependency)
- `.dops` is the current tool format standard; legacy `tool.yaml` (TOOL_SPEC_v1) is deprecated
- All satellite repos (dojops.ai, dojops-doc, dojops-hub) have CI workflows, issue templates, READMEs, and CONTRIBUTING.md

## Design Principles

1. **No blind execution** — Every LLM output is validated against Zod schemas before use
2. **Structured JSON outputs** — Provider-native JSON modes (OpenAI response_format, Anthropic prefill, Ollama format, Gemini responseMimeType)
3. **Schema validation before tool execution** — Zod inputSchema on every tool
4. **Idempotent operations** — Sorted YAML keys, deterministic output, replay mode
5. **Defense in depth** — Sandboxed execution, policy engine, approval workflows, audit trails, write allowlist
6. **No telemetry** — No data leaves the user's machine except to their configured LLM provider
7. **Integrity verification** — SHA-256 publisher attestation on hub publish/install, hash-chained audit logs
