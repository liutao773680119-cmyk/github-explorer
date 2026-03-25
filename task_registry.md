# Task Registry（会话任务索引）

用于在多端、多会话切换时保持任务隔离，避免上下文串写。

## 使用规则（强制）

1. 每次开场先选择或创建一个 `Task-ID`，再执行开发。
2. 同一会话只处理一个 `Task-ID`，其余任务标记为 `IGNORE`。
3. 收尾时必须更新当前任务行的 `Status`、`Last Update`、`Next First Command`。
4. `progress.md` 和 `修改记录_会话备忘.md` 必须与这里的 `Task-ID` 一致。

## 任务列表

| Task-ID | Task-Name | Status | Current Phase | Active Session | Last Update | Next First Command | Notes |
|---|---|---|---|---|---|---|---|
| T2026-02-28 16:21-01 | GitHub 热门解读 - 准备阶段 | done | 准备完成 | antigravity | 2026-03-01 08:57 | `N/A` | PRD / CLAUDE.md 已完善，Git 已关联远程 |
| T2026-03-01-02 | GitHub 热门解读 - V1 全栈实现 | done | Phase 0-3 完成 | antigravity | 2026-03-01 14:12 | `在 Vercel 导入仓库 github-explorer 并部署` | 脚手架、数据脚本、工作流、前端与基础验证已完成 |
| T2026-03-23-01 | 多模型可选 AI 接入改造 | in_progress | 已完成 provider 接入、命名清理与验证，待整理提交边界 | codex | 2026-03-25 13:25 | `git diff -- app/lib/config.ts scripts/lib/ai.ts scripts/lib/ai-client.ts .github/workflows/daily-update.yml .github/workflows/re-analyze.yml tests/ai-config.test.ts` | 默认按“脚本 / workflow 层 provider + model 可选”推进，不做前端运行时切换 |

## 状态枚举

- `todo`：尚未开始
- `in_progress`：正在执行
- `blocked`：受阻塞
- `done`：已完成
