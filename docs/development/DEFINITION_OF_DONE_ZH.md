# Definition of Done（完成定义）

**文档语言：** 中文  
**对应英文：** [DEFINITION_OF_DONE_EN.md](./DEFINITION_OF_DONE_EN.md)

一项任务只有**同时**满足以下条件才能标记完成：

## 功能与范围

- [ ] 验收标准已满足
- [ ] 未偷偷扩大范围；无关改动不在 diff 中

## 架构

- [ ] 代码符合模块边界（Page/Feature/Client 或 Router/Service/Repository）
- [ ] 未引入新的跨层或反向依赖
- [ ] 网络请求仅经统一 API Client（前端）

## 质量门禁

- [ ] `npm run typecheck` 通过（`tsc --noEmit`）
- [ ] `npm run lint` 通过（ESLint `next/core-web-vitals`，`--max-warnings=0`；后端 Ruff / Python 类型检查待后续阶段纳入）
- [ ] `npm test` 通过（Vitest/RTL；涉及端到端时 Playwright；后端 pytest 待后续阶段）
- [ ] 提交前或 PR 前运行 `npm run check`（依次 typecheck → lint → test → build）并通过
- [ ] 新 Bug 有回归测试
- [ ] 未删除/弱化测试以「通过」检查
- [ ] 未使用 `any` 掩盖契约问题

## 契约与数据

- [ ] API 契约已更新（OpenAPI / 生成客户端）
- [ ] 数据库变更有 Alembic migration（如适用）
- [ ] 未改写已执行过的 migration
- [ ] 创建后回写并使用服务端 ID（如适用）
- [ ] 无重复写入同一资源的双路径

## 安全

- [ ] 认证与资源所有权已验证（JWT；非客户端 `user_id`）
- [ ] 未认证 / 无权限场景已覆盖
- [ ] 日志不含 Token、完整敏感聊天或不当 PII

## UX 诚实性

- [ ] 错误、加载、空状态已处理
- [ ] 未用 Mock 或 fallback 伪装成功（含 Review 假分/假图）

## 文档与 Git

- [ ] 受影响文档已同步（含中英正式文档事实一致）
- [ ] Git diff 无无关修改
- [ ] 已记录剩余风险

## 禁止声明

不得仅以「应该可以」「理论上没问题」宣称完成；必须附真实命令与结果。
---
