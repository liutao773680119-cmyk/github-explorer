<!-- RELAY:START -->
# Task Registry（会话任务索引）

用于同软件/同模型多会话切换时的任务隔离，避免上下文串写。

## 使用规则（强制）

1. 每次开场先在本文件选择或创建一个 `Task-ID`，再执行开发。
2. 一个会话只处理一个 `Task-ID`，其他任务标记 `IGNORE`。
3. 收尾时必须更新当前任务行的 `Status`、`Last Update`、`Next First Command`。
4. `progress.md` 和 `修改记录_会话备忘.md` 必须与这里的 `Task-ID` 一致。

## 任务列表

| Task-ID | Task-Name | Status | Current Phase | Active Session | Last Update | Next First Command | Notes |
|---|---|---|---|---|---|---|---|
| T2026-02-28 16:21-01 | GitHub 热门解读 — 准备阶段 | done | 准备完成 | antigravity | 2026-03-01 08:57 | N/A | PRD/CLAUDE.md 已完善，Git 已关联远程 |
| T2026-03-01-02 | GitHub 热门解读 — Phase 0 脚手架搭建 | done | Phase 0 完成 | antigravity | 2026-03-01 13:13 | `git config user.email "你的邮箱" && git config user.name "你的名字" && git add -A && git commit -m "feat: Phase 0"` | 代码已完成，仅差 git commit（需先配 user） |

## 状态枚举

- `todo`：尚未开始
- `in_progress`：正在执行
- `blocked`：受阻塞
- `done`：已完成
<!-- RELAY:END -->
