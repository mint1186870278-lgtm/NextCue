# FocusPal Runtime Baseline Verification

**Status: As-Is Baseline frozen.** This document records the historical system state before Phase 0. Future fixes must not overwrite the historical findings here; subsequent changes must be recorded through Phase documents or a new version.

**Language:** English  
**Chinese counterpart:** [RUNTIME_BASELINE_ZH.md](./RUNTIME_BASELINE_ZH.md)  
**Static architecture twin:** [CURRENT_ARCHITECTURE_EN.md](./CURRENT_ARCHITECTURE_EN.md)  
**Verification date:** 2026-07-23  
**Code baseline:** commit `b84ebe6` (workspace also has uncommitted docs/governance; **no business code edited** this round)  
**Nature:** Local, non-destructive checks. Findings were **not fixed**.

---

## 1. Environment

| Item | Value |
|------|-------|
| OS | Windows (win32) |
| Node | v20.19.6 |
| npm | 10.8.2 |
| Next.js (build log) | 14.2.35 |
| `.env.local` key names (no values) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| `NEXT_PUBLIC_API_URL` | **Not** set in `.env.local` → runtime falls back to code default Render URL |
| Business code changed? | **No** |
| commit / push / remote change? | **No** during verification; local checkpoint commits may exist after freeze packaging |
| Production write APIs called? | **No** |

---

## 2. Commands and results

### 2.1 `git status`

- **Exit:** 0  
- **Summary:** Branch `main`; modified `tsconfig.tsbuildinfo`; many untracked docs/governance (including `docs/architecture/`). No business source edited this round.

### 2.2 Node / npm versions

- `node -v` → `v20.19.6`  
- `npm -v` → `10.8.2`

### 2.3 `npm test`

- **Exit:** 0  
- **Result:** Vitest 1 file / **18 tests passed** (`src/test/task-selection.test.ts`)  
- **Duration:** ~2.2s

### 2.4 `npx tsc --noEmit`

- **Exit:** 1  
- **Errors (2):** `src/test/task-selection.test.ts` lines 253–254: missing required property `selected` on `PendingTask` object literals  
- **Note:** Not fixed.

### 2.5 `npm run lint` / `npx next lint`

- **Exit:** 1  
- **Behavior:** Interactive prompt “How would you like to configure ESLint?” (Strict / Base / Cancel)  
- **This round:** **Did not** create ESLint config; **did not** modify files  
- **Conclusion:** **Lint is not configured**

### 2.6 `npm run build`

- **Exit:** 0  
- **Result:** Compiled successfully; 15/15 static pages; routes include `/`, `/try`, `/onboarding`, `/dashboard`, `/trial`, etc.  
- **Artifacts:** Updated `.next/`; may touch `tsconfig.tsbuildinfo`  
- **Note:** Local generated artifacts — **do not commit** as part of this task

### 2.7 `npm run dev`

- **Exit:** Process started successfully (Ready in ~4.2s)  
- **URL:** `http://localhost:3000`  
- **Environments:** `.env.local`  
- **After checks:** Dev server was **stopped** (no leftover intentional server for this task)

---

## 3. Route Smoke Test (HTTP layer)

HTTP GET only; **no** form submit, **no** task create, **no** AI messages, **no** production write APIs.

| Route | HTTP result | Notes |
|-------|-------------|-------|
| `/` | **307** → followed **200** `http://localhost:3000/try` | Matches `redirect("/try")` |
| `/try` | **200** | |
| `/onboarding` | **200** | |
| `/dashboard` | **200** | |
| `/trial` | **200** | Page client-navigates to dashboard (full client redirect not browser-verified) |

Dev log: routes compiled; no server 500 observed for these GETs.

---

## 4. Console errors / browser side

| Item | Result |
|------|--------|
| Real browser Console | **Not captured** (HTTP smoke only; no Playwright/manual browser session recorded) |
| Client Clerk / hydration / network errors | **Unverified** |
| Missing env impact | **High Environmental Risk:** `NEXT_PUBLIC_API_URL` is not explicitly configured locally, so task, chat, and review interactions fall back to the remote Render backend. This does not mean the app cannot start (build/dev/HTTP Smoke passed). It does not block To-Be Architecture design, but it blocks safe and controlled local integration testing. Clerk keys present in `.env.local` (names confirmed, values not printed). |

---

## 5. Not verified

- Real browser UI, Console, full Clerk login flow  
- Task CRUD / AI chat / breakdown (out of scope; production writes banned)  
- Whether `tsc` failure vs `next build` internal typecheck diverges in CI  
- Real lint results after ESLint is configured  
- Production Vercel/Render health  

---

## 6. Runnable degree (verdict)

| Capability | Status |
|------------|--------|
| Unit tests | Pass |
| Full `tsc --noEmit` | **Fail** (2 errors in test file) |
| ESLint | **Not configured** |
| Production build | **Pass** |
| Dev server + key route HTTP | **Pass** |
| End-to-end product flows | **Not verified** |

Overall: **Frontend shell can start and build locally**; typecheck and lint gates are **not ready**; business closed-loop and production backend/AI were **not verified** this round.

---

## 7. Issue classification (record only; do not fix)

| Class | Item | Notes |
|-------|------|-------|
| **Quality Gate Failure** | TypeScript `tsc --noEmit` failure | Test file missing `selected` (2 places). Blocks a green typecheck gate. |
| **Quality Gate Missing** | ESLint not configured | `next lint` prompts interactive setup; no config created. Blocks a green lint gate. |
| **High Environmental Risk** | `NEXT_PUBLIC_API_URL` not set explicitly | Task/chat/review fall back to remote Render. Does not block To-Be design; does not mean the app cannot start; blocks safe controlled local integration testing. |
| **Runtime Unknown** | Browser Console, Clerk login, business closed-loop | HTTP Smoke only this round; browser and write paths unverified. |
| Known As-Is Critical | JWT / double-write / ID write-back, etc. | See CURRENT_ARCHITECTURE; historical facts, not introduced this round. |

---

## 8. Files created / modified this round

**Modified:**

- `docs/architecture/CURRENT_ARCHITECTURE_ZH.md`
- `docs/architecture/CURRENT_ARCHITECTURE_EN.md`

**Created:**

- `docs/architecture/RUNTIME_BASELINE_ZH.md`
- `docs/architecture/RUNTIME_BASELINE_EN.md` (this file)

**Local artifacts (do not commit for this task):** `.next/`, `tsconfig.tsbuildinfo` (possibly updated by build)

**Business code:** unchanged.

---

## 9. Stop

Verification ends here. Do not fix issues; do not enter To-Be design or Phase 0; do not commit; do not push.
---
