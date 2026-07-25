# Phase 0A — Frontend Quality Baseline

**Language:** English  
**Chinese counterpart:** [PHASE_0A_QUALITY_BASELINE_ZH.md](./PHASE_0A_QUALITY_BASELINE_ZH.md)  
**Branch:** `chore/phase-0a-frontend-quality-baseline`  
**Starting HEAD:** `edcdd6b25d22c93dd08a7259bbe5c76ecc763b97`  
**Nature:** Engineering gates only; **no** product-logic changes to Tasks / Chat / Focus / Review / Onboarding.

---

## Before state (reproduced)

| Command | Exit | Result |
|---------|------|--------|
| `npm test` | 0 | 18/18 passed |
| `npx tsc --noEmit` | 2 (historical) / known failure before fix | `PendingTask` fixtures missing `selected` |
| `npm run lint` / `next lint` | 1 | **Quality Gate Missing — ESLint is not configured** (interactive prompt) |
| `npm run build` | 0 | Compiled successfully |

`.env.local` is gitignored; names only: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.

Version basis: Next `14.2.35`, ESLint `8.57.1`, `eslint-config-next` `14.2.35`, TypeScript `5.9.3`.

---

## TypeScript root cause and fix

- **Cause:** `PendingTask` in `src/test/task-selection.test.ts` requires `selected: boolean` (same meaning as ChatPanel selection-for-sync). Two fixtures omitted it.
- **Fix:** Set `selected: true` on both tasks in the “transform selected tasks to backend format” case.
- **Not done:** Did not weaken production types, use `any`, skip tests, or change business contracts.

---

## ESLint Missing Gate → configuration

- Added `.eslintrc.json` with `extends: ["next/core-web-vitals"]` (official Next 14 + ESLint 8).
- Added `.eslintignore` limited to generated/vendor paths.
- `package.json`: `"lint": "eslint . --max-warnings=0 --ext .js,.jsx,.ts,.tsx"` (non-interactive).
- To satisfy `--max-warnings=0`:
  - `app/try/page.tsx`, `components/ChatPanel.tsx`: local static assets via `next/image` (presentation only).
  - `components/TaskModal.tsx`: hoist `FOCUS_TIPS`; one documented `eslint-disable-next-line` for omitting `autoBreakdownTask` (avoids re-firing network breakdown while open).

---

## What was implemented

- `typecheck` / `lint` / `check` scripts
- GitHub Actions `.github/workflows/ci.yml`: PR + push to `main`; Node 20; `npm ci`; `npm run check`; `permissions: contents: read`; no deploy/PAT/auto-merge
- CI uses documented non-production Clerk placeholder env values (not real secrets) so builds work without `.env.local`
- Updated README, AGENTS, DoD / Debug ZH+EN docs

---

## Final real command results (feature branch, local)

| Command | Exit |
|---------|------|
| `npm test` | 0 |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 |
| `npm run build` | 0 |
| `npm run check` | 0 |

Clean-environment verification is recorded in the task final report (worktree/clone without `.env.local`).

---

## CI scope

- Triggers: pull_request, push to `main`
- Single job: `npm ci` → `npm run check`
- This round **did not push**; do not claim Actions already ran green remotely.

---

## Remaining risks

- Clerk placeholders satisfy compile only; CI does not cover real sign-in.
- `TaskModal` still intentionally omits `autoBreakdownTask` from effect deps; `useCallback` can normalize later.
- Render API fallback, localStorage key, and Clerk production origins **unchanged** (Phase 0B+).
- ESLint uses Next core-web-vitals, not a full custom `eslint:recommended` expansion.

---

## No product behavior change this round

No changes to Tasks/Chat/Focus/Review/Onboarding request semantics, auth logic, localStorage keys, Render fallback, or Clerk production origins; Phase 0B / monorepo moves not started.
---
