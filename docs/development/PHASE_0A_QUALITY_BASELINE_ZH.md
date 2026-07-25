# Phase 0A — 前端质量基线

**文档语言：** 中文  
**对应英文：** [PHASE_0A_QUALITY_BASELINE_EN.md](./PHASE_0A_QUALITY_BASELINE_EN.md)  
**分支：** `chore/phase-0a-frontend-quality-baseline`  
**起始 HEAD：** `edcdd6b25d22c93dd08a7259bbe5c76ecc763b97`  
**性质：** 工程门禁建立；**未修改** Tasks / Chat / Focus / Review / Onboarding 产品逻辑。

---

## Before 状态（复现）

| 命令 | Exit | 结果 |
|------|------|------|
| `npm test` | 0 | 18/18 passed |
| `npx tsc --noEmit` | 2（历史）→ 修复前已知失败 | `PendingTask` fixture 缺 `selected` |
| `npm run lint` / `next lint` | 1 | **Quality Gate Missing — ESLint is not configured**（交互提示） |
| `npm run build` | 0 | 编译成功 |

`.env.local` 已被 ignore；本记录只列名称：`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`、`CLERK_SECRET_KEY`。

依赖版本依据：Next `14.2.35`、ESLint `8.57.1`、`eslint-config-next` `14.2.35`、TypeScript `5.9.3`。

---

## TypeScript 失败根因与修复

- **根因：** `src/test/task-selection.test.ts` 中 `PendingTask` 要求必填 `selected: boolean`（与 ChatPanel 任务选择语义一致：是否勾选同步），两处 fixture 缺少该字段。
- **修复：** 在「已选任务转换后端格式」用例中为两条任务补上 `selected: true`（符合 `selectedTasks` 语义）。
- **未做：** 未把字段改为 optional、未使用 `any`、未跳过测试、未改生产类型契约。

---

## ESLint Missing Gate → 配置

- 新增 `.eslintrc.json`：`extends: ["next/core-web-vitals"]`（Next 14 官方推荐，匹配 ESLint 8）。
- 新增 `.eslintignore`：仅 `node_modules` / `.next` / `coverage` / `out` / `build` / `*.tsbuildinfo`。
- `package.json`：`"lint": "eslint . --max-warnings=0 --ext .js,.jsx,.ts,.tsx"`（非交互）。
- 为通过 `--max-warnings=0`：
  - `app/try/page.tsx`、`components/ChatPanel.tsx`：本地静态图改用 `next/image`（展示层，无 API/认证改动）。
  - `components/TaskModal.tsx`：`FOCUS_TIPS` 提升为模块常量；对 `autoBreakdownTask` 依赖保留一行带说明的 `eslint-disable-next-line`（避免打开态重复触发网络拆解）。

---

## 实施内容

- `typecheck` / `lint` / `check` scripts
- GitHub Actions `.github/workflows/ci.yml`：`pull_request` + `push`→`main`；Node 20；`npm ci`；`npm run check`；`permissions: contents: read`；无 deploy/PAT/auto-merge
- CI 使用文档化非生产 placeholder Clerk 环境变量名值（非真实 secret）以便无 `.env.local` 编译
- 更新 README、AGENTS、DoD / Debug 中英文档

---

## 最终真实命令结果（功能分支本地）

| 命令 | Exit |
|------|------|
| `npm test` | 0 |
| `npm run typecheck` | 0 |
| `npm run lint` | 0 |
| `npm run build` | 0 |
| `npm run check` | 0 |

干净环境验证结果见同任务最终报告（无 `.env.local` 的 worktree / clone）。

---

## CI 范围

- 触发：PR、push 到 `main`
- 单 job：`npm ci` → `npm run check`
- 本轮**未 push**，因此不声称 Actions 已在线跑绿。

---

## Remaining Risks

- Clerk placeholder 仅满足编译；CI 不覆盖真实登录。
- `TaskModal` 仍有意省略 `autoBreakdownTask` 依赖；后续可用 `useCallback` 正规化。
- 默认 Render API fallback、localStorage key、Clerk production origins **未改**（Phase 0B+）。
- ESLint 未强制 `eslint:recommended` 全量规则；采用 Next 官方 core-web-vitals。

---

## 本轮未修改业务行为

未改 Tasks/Chat/Focus/Review/Onboarding 请求语义、认证逻辑、localStorage key、Render fallback、Clerk production origins；未进入 Phase 0B / Monorepo 目录搬迁。
---
