# NextCue

NextCue is a Next.js web application that helps users manage tasks, stay focused, and review their week through a supportive conversational interface.

## Stack

- **Framework:** Next.js 14 (App Router) + React
- **Auth:** Clerk
- **UI:** Tailwind CSS, Chart.js
- **Tests:** Vitest + React Testing Library
- **Quality:** TypeScript, ESLint (`next/core-web-vitals`), GitHub Actions CI

## Getting started

1. Install dependencies (prefer lockfile install):

   ```bash
   npm ci
   ```

2. Copy environment template and fill in local values (never commit secrets):

   ```bash
   cp .env.example .env.local
   ```

3. Run the full local quality gate (recommended before opening a PR):

   ```bash
   npm run check
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm ci` | Clean install from `package-lock.json` |
| `npm run check` | typecheck → lint → test → build (fails fast) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint with `--max-warnings=0` |
| `npm test` | Vitest |
| `npm run build` | Production build |
| `npm run dev` | Development server |
| `npm start` | Start production server |

## Repository

- **GitHub:** [NextCue](https://github.com/mint1186870278-lgtm/NextCue)
- **Package name:** `nextcue`
- Legacy ADHD-Coach / FocusPal remotes and deployments remain historical references only.

## Note

This repository uses a Clean Root history. Legacy system As-Is documentation lives under `docs/architecture/` and `docs/historical/`.
