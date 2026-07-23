# AGENTS.md — NextCue

This file is the mandatory entry point for any coding agent working in this repository.

## Repository identity

- **Canonical workspace:** this working tree (local folder may still be named `NextCue` or a legacy folder name).
- **origin:** NextCue GitHub main repo (`NextCue.git`).
- **legacy remote:** historical ADHD-Coach repo — reference only; do not treat it as the place to continue product development.
- **Display name:** NextCue. **Package name:** `nextcue`.
- **Legacy baseline (historical):** former FocusPal / ADHD-Coach application tree imported via Clean Root; As-Is architecture docs describe that legacy system. Migration strategy remains **in-place incremental** inside this workspace.
- **Do not** put machine-specific absolute paths in docs or rules.

## Read first

1. `.cursor/rules/00-project-governance.mdc`
2. `.cursor/rules/10-architecture-boundaries.mdc`
3. `.cursor/rules/20-debug-and-validation.mdc`
4. `.cursor/rules/30-api-data-contracts.mdc`
5. `.cursor/rules/40-security-privacy.mdc`
6. `.cursor/rules/50-git-documentation.mdc`
7. Relevant docs under `docs/architecture/` and `docs/development/`

## Confirmed technical direction

| Area | Decision |
|------|----------|
| Layout | Monorepo |
| Web | `apps/web` — Next.js |
| API | `apps/api` — FastAPI |
| DB | PostgreSQL |
| ORM | SQLAlchemy 2.x |
| Migrations | Alembic |
| Auth | Clerk; **backend must verify Clerk JWT**; `user_id` from token only |
| AI | Provider Adapter; concrete provider deferred |
| Analytics | Deferred |
| Legacy production data | Default: do not migrate |
| Deploy platform | Deferred |
| Frontend tests | Vitest + React Testing Library |
| Backend tests | pytest |
| E2E | Playwright |
| Python lint/format | Ruff |
| API contract | Backend OpenAPI → generate TypeScript client |
| CI | Web checks, API checks, contract checks, build checks |
| Local `check` command | Planned; not implemented in governance-only phase |

### Still open

- Python typechecker: mypy **or** Pyright (decide later)
- Concrete AI Provider
- Deploy / Postgres hosting vendor

## Migration phases (no code in governance-only work)

0. Engineering baseline → 1. Auth → 2. Tasks → 3. Focus → 4. Chat → 5. Review → 6. Onboarding → 7. UX research iteration

Details: `docs/architecture/PROJECT_STRUCTURE_ZH.md` / `PROJECT_STRUCTURE_EN.md`

## Mandatory workflows

- **Before coding:** governance pre-dev checklist (rule `00`).
- **Bugs:** Debug workflow (rule `20` + `docs/development/DEBUG_WORKFLOW_*`).
- **Done:** Definition of Done (`docs/development/DEFINITION_OF_DONE_*`).
- **Coupling:** evidence standards in `docs/architecture/COUPLING_AUDIT_*` (line count = trigger only).

## Hard bans (summary)

- No production write APIs during diagnosis.
- No fake-success Mock in product paths.
- No trusting client `user_id` for authorization.
- No AI direct insert of official tasks (Draft → confirm → single write).
- No dependency install/upgrade or git push unless the user explicitly asks for that task.
- No business feature implementation during a docs/governance-only task.

## Templates

- ADR: `docs/architecture/ADR_TEMPLATE.md`
- Change plan: `docs/development/CHANGE_PLAN_TEMPLATE.md`
- Bug report: `docs/development/BUG_REPORT_TEMPLATE.md`
---
