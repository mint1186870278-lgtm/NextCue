# FocusPal 项目结构

**文档语言：** 中文  
**对应英文：** [PROJECT_STRUCTURE_EN.md](./PROJECT_STRUCTURE_EN.md)  
**状态：** 架构约定（治理阶段）；`apps/web` 与 `apps/api` 代码初始化属于后续 Phase 0，本文件只描述目标结构。

---

## 1. 仓库角色

| 对象 | 角色 |
|------|------|
| **本工作区**（Canonical Workspace） | FocusPal 正式开发位置；`origin` → FocusPal 主仓；基线 commit `b84ebe6`；采用 **In-place Incremental Migration** |
| **legacy remote**（ADHD-Coach） | 历史代码远程参考；不在此继续产品开发 |
| 目标 Monorepo 布局（`apps/web`、`apps/api`） | **To-Be**；属后续 Phase，非当前 As-Is |

---

## 2. 目标目录

```text
FocusPal/
├── apps/
│   ├── web/                 # Next.js 前端
│   └── api/                 # FastAPI 后端
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

### 简化原则

- 不为「结构完整」预建空的 service/repository 文件；需要时再加层。
- 暂不引入 Turborepo/Nx，除非日后规模证明值得。
- `shared/` 默认极瘦；禁止成为无边界工具垃圾桶。

---

## 3. 前端目标组织（`apps/web`）

```text
apps/web/src/
├── app/                     # 路由与页面装配
├── features/
│   ├── auth/
│   ├── onboarding/
│   ├── tasks/
│   ├── chat/
│   ├── focus/
│   └── review/
├── components/
│   └── ui/                  # 无业务含义的通用 UI
├── lib/
│   ├── api/                 # 统一 API Client（唯一网络出口）
│   ├── auth/
│   ├── validation/
│   └── utils/
├── hooks/
└── types/
```

依赖方向：`Page → Feature → Hook/UseCase → API Client → Backend`。

---

## 4. 后端目标组织（`apps/api`）

```text
apps/api/app/
├── main.py
├── core/                    # 配置、数据库、日志、安全、异常
├── modules/
│   ├── auth/
│   ├── users/
│   ├── tasks/
│   ├── chat/
│   ├── focus/
│   └── review/
└── shared/                  # 经证明后才共享的少量代码
```

模块内按需包含：`router.py`、`schemas.py`、`service.py`、`repository.py`、`models.py`、`tests/`。  
依赖方向：`Router → Service → Repository → Database`。

---

## 5. 已确认技术决策

| 领域 | 决策 |
|------|------|
| Monorepo | 是 |
| Web | Next.js（`apps/web`） |
| API | FastAPI（`apps/api`） |
| 数据库 | PostgreSQL |
| ORM | SQLAlchemy 2.x |
| Migration | Alembic |
| 认证 | 保留 Clerk；后端验证 Clerk JWT；`user_id` 仅来自 Token |
| AI | Provider Adapter；具体 Provider 暂缓 |
| Analytics | 暂缓 |
| 旧线上数据 | 默认不迁移 |
| 部署平台 | 暂缓 |
| 前端测试 | Vitest + React Testing Library |
| 后端测试 | pytest |
| E2E | Playwright |
| Python Lint/Format | Ruff |
| API 契约 | 后端 OpenAPI 为输入，生成前端 TypeScript Client |
| CI | 前端、后端、契约、构建检查 |
| 本地 `check` | 规划中；治理阶段不实现 |

### 仍待确认

- Python 类型检查：mypy 或 Pyright
- 具体 AI Provider
- 部署与 Postgres 托管厂商

---

## 6. Feature 迁移顺序

技术迁移期间保持可观察行为，不同时全面重设计。

| Phase | 名称 | 范围 |
|-------|------|------|
| 0 | 工程基线 | Monorepo 结构；环境变量；统一 API Client；日志与错误格式；测试与 CI；契约生成 |
| 1 | 认证基础 | Clerk 前端；后端 JWT；Token 取 `user_id`；所有权；未认证/无权限测试 |
| 2 | Tasks | CRUD；服务端 ID 回写；刷新恢复；权限与契约测试 |
| 3 | Focus | pending/active/paused/completed；Focus Session；实际用时；持久化 |
| 4 | Chat | 聊天；Task Draft；Schema 校验；用户修改确认；确认后单次写入；Provider 失败 |
| 5 | Review | 仅真实任务与 Focus Session；禁止默认假分/假图表伪装成功 |
| 6 | Onboarding | 真实答案落库；明确个性化用途；禁止临床诊断 |
| 7 | UX 研究迭代 | 研究完成后再改核心流程 |

治理阶段只建立规则与文档，不执行上述 Phase 的代码工作。

---

## 7. 架构边界摘要

详见 `.cursor/rules/10-architecture-boundaries.mdc`。

要点：统一 API Client；服务端 ID 权威；AI 仅产出 Draft；JWT 权威用户身份；禁止跨层与反向依赖。
---
