# TeamFlow — technical overview

A deep-dive into the architecture and the decisions worth explaining. For setup and a feature tour see
[`README.md`](README.md).

## Solution shape

```
teamflow/
├── backend/                         .NET 9 solution (Clean Architecture)
│   └── src/
│       ├── TeamFlow.Domain          entities, enums, domain logic (no dependencies)
│       ├── TeamFlow.Application      interfaces, DTOs, services, validators (depends on Domain)
│       ├── TeamFlow.Infrastructure  EF Core, multitenancy, auth primitives (depends on Application)
│       └── TeamFlow.Api             controllers, middleware, DI, JWT wiring
│   └── tests/TeamFlow.Tests         xUnit (tenant isolation, auth, board/card logic)
└── frontend/                        Angular 20 (standalone + signals)
    └── src/app/
        ├── core/                    models, api clients, auth, i18n, theme, demo, icons
        ├── shared/                  avatar, role badge, priority icon
        └── features/                auth, shell, boards, board, members, about, demo
```

The backend follows Clean Architecture: dependencies point inward (`Api → Infrastructure → Application
→ Domain`). The Application layer talks to persistence only through `IAppDbContext`, so handlers stay
free of EF wiring and are unit-testable against the in-memory provider.

## Multi-tenancy

The core differentiator. Every tenant-owned entity implements `ITenantOwned { Guid WorkspaceId }`.

- **Row-level isolation** — `TeamFlowDbContext` applies a global query filter to every `ITenantOwned`
  entity: `x => !TenantScoped || x.WorkspaceId == CurrentWorkspaceId`. The filter reads instance members
  backed by a scoped `ITenantContext`, so EF re-evaluates the current workspace per request without
  baking a value into the cached model.
- **Auto-stamping** — `SaveChangesAsync` stamps `WorkspaceId` onto newly added tenant-owned rows, so a
  handler can't accidentally create cross-tenant data.
- **Tenant resolution** — `TenantResolutionMiddleware` reads the `X-Workspace-Id` header on
  authenticated requests, confirms the user is a member of that workspace, and sets the workspace + role
  on the scoped context (a header naming a non-member workspace is `403`).
- **Shared users** — a `User` is global; membership and role live on `WorkspaceMember`. The seed has one
  user (Alex) who is **Owner** of one workspace and **Admin** of another — the switcher demonstrates the
  isolation and the per-workspace role.

SQL Server rejects multiple cascade paths, so the hierarchy (Workspace → Board → Column → Card →
Comment/CardLabel) cascades, while `WorkspaceId` and cross FKs (Card→Board, *→User) use `NoAction`.

## Authentication & authorization

- **Passwords** — hashed with ASP.NET Identity's `PasswordHasher<User>` behind an `IPasswordHasher`
  adapter.
- **Access tokens** — short-lived JWTs (HMAC-SHA256). `MapInboundClaims = false` keeps `sub` intact.
- **Refresh tokens** — opaque, random, stored only as a **SHA-256 hash**. Refreshing **rotates**: the
  old token is revoked and linked to its replacement, so a leaked-and-reused token is detectable and
  rejected.
- **Lockout** — after 5 failed logins the account is locked for 15 minutes (domain logic on `User`).
- **Invitations** — emailed as a raw token; only the hash is persisted, with an expiry and status. Accept
  is tenant-independent and verifies the signed-in user's email matches the invite.
- **RBAC** — `WorkspaceRole` is ordered `Viewer < Member < Admin < Owner`. The API enforces a minimum
  role per action via `[RequireWorkspaceRole(...)]`; finer rules (only an Owner can touch Owners/Admins;
  never strip the last Owner) live in the service layer. The SPA mirrors this with a capabilities matrix
  and read-only affordances — the server is the source of truth.

## API surface (selected)

```
POST /api/auth/{register,login,refresh,logout}   GET /api/auth/me
GET/POST /api/workspace/members  PATCH .../{id}/role  DELETE .../{id}
GET/POST /api/workspace/invitations  DELETE .../{id}   POST /api/invitations/accept
GET/POST /api/boards   GET/PUT/DELETE /api/boards/{id}
POST /api/boards/{id}/columns  PUT/DELETE /api/columns/{id}  PUT /api/boards/{id}/columns/order
POST /api/boards/{id}/labels   PUT/DELETE /api/labels/{id}
GET /api/cards/{id}  POST /api/cards  PUT /api/cards/{id}
PATCH /api/cards/{id}/move  PUT /api/cards/{id}/labels  DELETE /api/cards/{id}
POST /api/cards/{id}/comments  DELETE /api/comments/{id}   GET /api/activity
```

Errors are normalized by `ExceptionHandlingMiddleware` into `{ code, message, errors? }`; the SPA maps
`code` to a localized message.

## Frontend

- **State** — Angular **signals** throughout; `AuthService` holds the session (user, workspaces, active
  workspace) and persists tokens in `localStorage`. An HTTP interceptor attaches the bearer token and
  `X-Workspace-Id`, and transparently refreshes once on a `401`.
- **Kanban** — Angular CDK drag & drop. Card order uses **fractional positions** (drop position = midpoint
  of its neighbours), so a move is a single `PATCH` with no server-side reindexing. Updates are optimistic
  with rollback on error.
- **Styling** — Tailwind v4 with a CSS-first `@theme` (tokens from the design mockup) and class-based dark
  mode (`@custom-variant dark`). Component styles avoid `@apply` (which needs `@reference` under v4) by
  binding utility-class strings.
- **i18n** — a lightweight signal-based EN/ES service + an impure `t` pipe; shares the portfolio-wide
  `portfolio-lang` key.
- **Demo layer** — `DemoService` drives a coach-mark tour (spotlight via a large box-shadow on the
  target) and an "explore" panel that renders the can/can't matrix from the current role.

## Testing

- **Backend (34 xUnit tests)** — tenant isolation & auto-stamping, auth domain (lockout, refresh
  rotation), workspace/invitation rules (RBAC, last-owner guard, email match), and board/card logic
  (sequential references, auto-complete on Done, cross-board move guard, label/assignee validation).
- **E2E (Playwright)** — auth & RBAC (owner can create, viewer is read-only, bad credentials rejected),
  kanban (quick-add → comment → move via panel, list view), and the guided demo (tour advances, explore
  panel reflects role). Run with `npx playwright test` (API must be running).

## CI

`.github/workflows/ci.yml` builds and tests the backend and builds the frontend on every push / PR.

## Deferred

Cloud deployment (Azure App Service + SQL serverless + GitHub Pages) is intentionally batched for later,
together with the rest of the portfolio. Everything else runs end-to-end locally.
