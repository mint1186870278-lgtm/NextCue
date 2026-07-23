# FocusPal Project Structure

**Language:** English  
**Chinese counterpart:** [PROJECT_STRUCTURE_ZH.md](./PROJECT_STRUCTURE_ZH.md)  
**Status:** Architecture agreement (governance phase). Scaffolding `apps/web` and `apps/api` belongs to Phase 0; this document describes the **target** layout only.

---

## 1. Repository roles

| Object | Role |
|--------|------|
| **This workspace** (Canonical Workspace) | Official FocusPal development tree; `origin` → FocusPal main repo; baseline commit `b84ebe6`; **in-place incremental migration** |
| **legacy remote** (ADHD-Coach) | Historical code remote for reference; not where product work continues |
| Target monorepo layout (`apps/web`, `apps/api`) | **To-Be**; later Phase — not current As-Is |

---

## 2. Target tree

```text
FocusPal/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # FastAPI backend
├── docs/
│   ├── architecture/
│   ├── development/
│   ├── product/
│   └── research/
├── scripts/
├── .cursor/rules/
├── AGENTS.md
├── README.md
└── .env.example
```

### Simplification rules

- Do not create empty service/repository files “for completeness”; add layers when needed.
- Do not introduce Turborepo/Nx unless scale later justifies it.
- Keep `shared/` extremely thin; it must not become an unbounded utility dump.

---

## 3. Frontend target layout (`apps/web`)

```text
apps/web/src/
├── app/                     # Routes and page assembly
├── features/
│   ├── auth/
│   ├── onboarding/
│   ├── tasks/
│   ├── chat/
│   ├── focus/
│   └── review/
├── components/
│   └── ui/                  # Business-agnostic UI
├── lib/
│   ├── api/                 # Unified API Client (only network exit)
│   ├── auth/
│   ├── validation/
│   └── utils/
├── hooks/
└── types/
```

Dependency direction: `Page → Feature → Hook/UseCase → API Client → Backend`.

---

## 4. Backend target layout (`apps/api`)

```text
apps/api/app/
├── main.py
├── core/                    # Config, DB, logging, security, errors
├── modules/
│   ├── auth/
│   ├── users/
│   ├── tasks/
│   ├── chat/
│   ├── focus/
│   └── review/
└── shared/                  # Small shared code only after proven need
```

Per module, add as needed: `router.py`, `schemas.py`, `service.py`, `repository.py`, `models.py`, `tests/`.  
Dependency direction: `Router → Service → Repository → Database`.

---

## 5. Confirmed technical decisions

| Area | Decision |
|------|----------|
| Monorepo | Yes |
| Web | Next.js (`apps/web`) |
| API | FastAPI (`apps/api`) |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.x |
| Migrations | Alembic |
| Auth | Keep Clerk; backend verifies Clerk JWT; `user_id` from token only |
| AI | Provider Adapter; concrete provider deferred |
| Analytics | Deferred |
| Legacy production data | Default: do not migrate |
| Deploy platform | Deferred |
| Frontend tests | Vitest + React Testing Library |
| Backend tests | pytest |
| E2E | Playwright |
| Python lint/format | Ruff |
| API contract | Backend OpenAPI as input → generate TypeScript client |
| CI | Web, API, contract, and build checks |
| Local `check` | Planned; not implemented in governance phase |

### Still open

- Python typechecker: mypy or Pyright
- Concrete AI Provider
- Deploy and Postgres hosting vendor

---

## 6. Feature migration order

Keep observable behavior during technical migration; do not redesign UX wholesale at the same time.

| Phase | Name | Scope |
|-------|------|-------|
| 0 | Engineering baseline | Monorepo layout; env conventions; unified API Client; logging/errors; tests & CI; contract generation |
| 1 | Auth foundation | Clerk on web; JWT on API; `user_id` from token; ownership; unauth/forbidden tests |
| 2 | Tasks | CRUD; server ID write-back; restore after refresh; authz & contract tests |
| 3 | Focus | pending/active/paused/completed; Focus Session; actual duration; persistence |
| 4 | Chat | chat; Task Draft; schema validation; user edit + confirm; **single** write after confirm; provider failure |
| 5 | Review | real tasks + Focus Sessions only; no fake default scores/charts as success |
| 6 | Onboarding | persist real answers; document personalization use; no clinical diagnosis |
| 7 | UX research iteration | change core flows only after research |

Governance phase creates rules and docs only — it does not execute these phases’ code work.

---

## 7. Boundary summary

See `.cursor/rules/10-architecture-boundaries.mdc`.

Key points: unified API Client; server ID authority; AI produces Drafts only; JWT is the user authority; no cross-layer or reverse dependencies.
---
