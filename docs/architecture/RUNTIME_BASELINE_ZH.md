# FocusPal 运行基线（Runtime Baseline Verification）

**状态：As-Is Baseline 已冻结。** 本文件只记录 Phase 0 之前的历史系统事实。后续修复不得覆盖这里的历史结论；系统发生变化后，应通过 Phase 文档或新的版本记录变化。

**文档语言：** 中文  
**对应英文：** [RUNTIME_BASELINE_EN.md](./RUNTIME_BASELINE_EN.md)  
**对应静态架构：** [CURRENT_ARCHITECTURE_ZH.md](./CURRENT_ARCHITECTURE_ZH.md)  
**验证日期：** 2026-07-23  
**代码基线：** commit `b84ebe6`（工作区另有未提交文档/治理文件，本轮未改业务代码）  
**性质：** 本地、非破坏性检查记录。发现的问题**未修复**。

---

## 1. 环境

| 项 | 值 |
|----|-----|
| OS | Windows（win32） |
| Node | v20.19.6 |
| npm | 10.8.2 |
| Next.js（build 日志） | 14.2.35 |
| `.env.local` 变量名（无值） | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`、`CLERK_SECRET_KEY` |
| `NEXT_PUBLIC_API_URL` | **未**在 `.env.local` 中配置 → 运行时回退代码默认 Render URL |
| 本轮是否改业务代码 | **否** |
| 本轮是否 commit/push/改 remote | **否**（本收尾轮次另有本地 checkpoint commit，见 git log） |
| 本轮是否调生产写接口 | **否** |

---

## 2. 实际命令与结果

### 2.1 `git status`

- **Exit：** 0  
- **摘要：** 分支 `main`；已修改 `tsconfig.tsbuildinfo`；大量未跟踪文档/治理（含 `docs/architecture/` 等）。无业务源码被本轮编辑。

### 2.2 Node / npm 版本

- `node -v` → `v20.19.6`  
- `npm -v` → `10.8.2`

### 2.3 `npm test`

- **Exit：** 0  
- **结果：** Vitest 1 file / **18 tests passed**（`src/test/task-selection.test.ts`）  
- **时长：** ~2.2s

### 2.4 `npx tsc --noEmit`

- **Exit：** 1  
- **错误（2）：** `src/test/task-selection.test.ts` 行 253–254：对象字面量缺少必填属性 `selected`（类型 `PendingTask`）  
- **说明：** 未修复。

### 2.5 `npm run lint` / `npx next lint`

- **Exit：** 1  
- **现象：** 交互式提示「How would you like to configure ESLint?」（Strict / Base / Cancel）  
- **本轮动作：** **未创建** ESLint 配置、未改文件  
- **结论：** **Lint 尚未配置**

### 2.6 `npm run build`

- **Exit：** 0  
- **结果：** Compiled successfully；生成静态页 15/15；路由表含 `/`、`/try`、`/onboarding`、`/dashboard`、`/trial` 等  
- **产物：** 更新 `.next/`；可能触及 `tsconfig.tsbuildinfo`  
- **说明：** 视为本地生成产物，**不提交**

### 2.7 `npm run dev`

- **Exit：** 进程启动成功（Ready in ~4.2s）  
- **地址：** `http://localhost:3000`  
- **Environments：** `.env.local`  
- **本轮结束后已停止开发服务器**（避免遗留后台进程）

---

## 3. Route Smoke Test（HTTP 层）

仅 HTTP GET；**未**提交表单、**未**创建任务、**未**发 AI 消息、**未**调生产写接口。

| 路由 | HTTP 结果 | 备注 |
|------|-----------|------|
| `/` | **307** → 跟随后 **200** `http://localhost:3000/try` | 与 `redirect("/try")` 一致 |
| `/try` | **200** | |
| `/onboarding` | **200** | |
| `/dashboard` | **200** | |
| `/trial` | **200** | 页面自身会再客户端跳转 dashboard（未在浏览器验证跳转完成态） |

Dev 日志：各路由编译成功；未见服务端 500。

---

## 4. Console Error / 浏览器侧

| 项 | 结果 |
|----|------|
| 真实浏览器 Console | **未采集**（本环境仅 HTTP Smoke，无 Playwright/手工浏览器会话记录） |
| 客户端 Clerk / hydration / 网络错误 | **未验证** |
| 环境变量缺失影响 | **High Environmental Risk**：本地未显式设置 `NEXT_PUBLIC_API_URL`，任务/聊天/复盘交互会回退连接远程 Render。不表示项目无法启动（build/dev/HTTP Smoke 已通过）；不阻断 To-Be 设计，但阻断安全、可控的本地集成测试。Clerk keys 存在于 `.env.local`（名称已确认，值未输出） |

---

## 5. 未验证内容

- 真实浏览器 UI、Console、Clerk 登录全流程  
- 任务 CRUD / AI 聊天 / breakdown（禁止生产写与本轮范围外）  
- `tsc` 失败是否影响 `next build` 内部类型检查路径差异以外的 CI  
- Lint 配置后的真实 lint 结果  
- 生产 Vercel/Render 健康状态  

---

## 6. 可运行程度（结论）

| 能力 | 状态 |
|------|------|
| 单元测试 | 通过 |
| TypeScript 全量 `tsc --noEmit` | **失败**（测试文件 2 错） |
| ESLint | **未配置** |
| Production build | **通过** |
| Dev server + 关键路由 HTTP | **通过** |
| 产品端到端业务 | **未验证** |

整体：**可本地启动与构建的前端壳可用**；静态类型门禁与 Lint 门禁**未就绪**；业务闭环与生产后端/AI **未在本轮验证**。

---

## 7. 问题分类（仅记录，不修复）

| 分类 | 项 | 说明 |
|------|-----|------|
| **Quality Gate Failure** | TypeScript `tsc --noEmit` 失败 | 测试文件缺 `selected`（2 处）。阻断「类型检查必须绿」的门禁。 |
| **Quality Gate Missing** | ESLint 未配置 | `next lint` 进入交互式初始化；未创建配置。阻断「lint 必须绿」。 |
| **High Environmental Risk** | `NEXT_PUBLIC_API_URL` 未显式设置 | 任务/聊天/复盘会回退连接远程 Render。不阻断 To-Be Architecture 设计，不表示无法启动；阻断安全、可控的本地集成测试。 |
| **Runtime Unknown** | 浏览器 Console、Clerk 登录与业务闭环 | 本轮仅 HTTP Smoke；未验证真实浏览器与写路径。 |
| 已知 As-Is Critical | JWT / 双写 / ID 回写等 | 见 CURRENT_ARCHITECTURE；属历史系统事实，非本轮引入。 |

---

## 8. 本轮生成 / 修改文件

**修改：**

- `docs/architecture/CURRENT_ARCHITECTURE_ZH.md`
- `docs/architecture/CURRENT_ARCHITECTURE_EN.md`

**新增：**

- `docs/architecture/RUNTIME_BASELINE_ZH.md`（本文件）
- `docs/architecture/RUNTIME_BASELINE_EN.md`

**本地生成产物（不提交）：** `.next/`、`tsconfig.tsbuildinfo`（可能被 build 更新）

**业务代码：** 未修改。

---

## 9. 停止声明

本验证结束。不修复问题；不进入 To-Be 设计或 Phase 0；不 commit；不 push。
---
