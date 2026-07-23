# Debug 工作流

**文档语言：** 中文  
**对应英文：** [DEBUG_WORKFLOW_EN.md](./DEBUG_WORKFLOW_EN.md)  
**强制规则摘要：** `.cursor/rules/20-debug-and-validation.mdc`

---

## Step 1：Define（定义）

写清：

- 预期行为
- 实际行为
- 复现条件
- 影响范围
- 首次出现时间（若可知）
- 是否仅特定环境

可用模板：`BUG_REPORT_TEMPLATE.md`

---

## Step 2：Reproduce（复现）

- 用最小步骤稳定复现
- 保存错误信息、HTTP 状态码、相关日志
- 不在生产环境制造测试数据
- 优先本地或测试数据库

诊断/审计阶段：**禁止**调用线上 POST/PUT/PATCH/DELETE。

---

## Step 3：Trace（追踪）

沿真实调用链：

```text
用户操作
→ UI 事件
→ 前端状态
→ API Client
→ HTTP 请求
→ Router
→ Service
→ Repository
→ Database / AI Provider
→ Response
→ 前端解析
→ UI 更新
```

---

## Step 4：Isolate（隔离）

判定问题属于：UI / 前端状态 / API Client / API 契约 / 认证 / 后端业务 / 数据库 / AI Provider / 部署或环境变量。

每次只改变一个关键变量。

---

## Step 5：Fix（修复）

- 选择最小且符合架构边界的修复
- 不增加第二套临时并行逻辑
- 不用 fallback 伪装成功
- 不在 UI 层修补数据库或契约问题

---

## Step 6：Regression Test（回归测试）

至少增加一个能防止同类问题再次出现的测试（单元、契约或 E2E，按层级选择）。

禁止为通过检查而删除或弱化测试；禁止用 `any` 掩盖类型问题。

---

## Step 7：Verify（验证）

同时验证：

- 原 Bug 已修复
- 相邻流程未损坏
- 类型检查通过
- 相关测试通过
- 错误状态仍能正确展示
- 刷新与重新登录后状态正确

输出**真实运行过的命令与结果**。

---

## Step 8：Document（记录）

记录：根因、修改、测试、剩余风险、是否需要后续重构。重大决策写 ADR。
---
