<!-- RELAY:START -->
# AGENTS.md

## 目标

在 Antigravity、Cursor、VS Code/Codex 三端切换时，保持同一项目上下文、同一执行标准、同一交接格式，避免"上一轮做了什么"丢失。

## 作用范围

- 本文件作用于仓库根目录及全部子目录。
- 若子目录另有更细规则，子目录规则优先；否则以本文件为准。

## 会话启动顺序（强制）

每次新模型接手时，按顺序读取并确认：

1. `AGENTS.md`
2. `task_registry.md`
3. `progress.md`
4. `task_plan.md`
5. `findings.md`
6. `修改记录_会话备忘.md`

## 启动检查（强制）

接手后先执行并回报关键结果：

1. `Get-Location`
2. `Get-ChildItem -Force`
3. `if (Test-Path .git) { git status --short } else { 'NO_GIT_REPO' }`
4. `node -v && npm -v`

## 会话结束交接（强制）

结束前必须更新 `progress.md` 顶部"Latest Handoff Snapshot"，至少包含：

1. Task-ID / Task-Name
2. 本轮修改文件列表
3. 已完成事项
4. 未完成事项
5. 风险/阻塞
6. 下一步第一条命令（可直接复制执行）

## 多会话防混淆（Task-ID，强制）

1. 每个会话开场先声明并锁定一个 `Task-ID`（示例：`T20260227-01`）和 `Task-Name`。
2. 所有输出（Session Context、Latest Handoff Snapshot、Session Record）必须包含同一个 `Task-ID`。
3. 同一会话只处理一个 `Task-ID`；若出现其他任务上下文，标记为 `IGNORE`，不执行跨任务步骤。
4. 切换到另一个问题前，先在 `task_registry.md` 更新当前任务状态，再启动新 `Task-ID`。
5. 结束会话前，必须回写 `task_registry.md` 的当前任务行（状态、最后更新时间、Next First Command）。

## 项目事实（可按需调整）

1. 项目名称：GitHub 热门解读
2. 远程仓库：`liutao773680119-cmyk/github-explorer`（Public）
3. 技术栈：Next.js 14 + Tailwind CSS + TypeScript
4. 数据目录：`data/`（projects.json、stats.json、daily/、logs/、cache/、mock/）
5. 定时脚本：`scripts/fetch-and-analyze.ts`（GitHub Actions 每日执行）
6. 重新解读脚本：`scripts/re-analyze.ts`（手动触发）
7. 前端入口：`app/page.tsx`
8. 类型定义：`app/lib/types.ts`
9. 配置常量：`app/lib/config.ts`
10. PRD 文档：`PRD.md`
11. 技术规范：`CLAUDE.md`

## 硬约束

1. 所有回复、思考和任务清单使用 `中文`。
2. 未执行验证命令前，不得声称"已完成/已修复"。
3. 禁止在客户端发起任何网络请求（数据来自构建时静态 JSON）。
4. 禁止使用 `any` 类型，所有文件 `.ts` / `.tsx`。
5. 禁止硬编码模型名、仓库名、业务常量，统一在 `app/lib/config.ts` 定义。
6. 禁止在组件中直接操作 localStorage，统一通过 `app/lib/storage.ts` 封装。
7. 任何错误必须写入 `task_plan.md` 的错误日志或 `progress.md` 的错误记录。
8. 同一会话严禁混写多个 `Task-ID` 的 TODO、风险和结论。

## 三端对齐约定

1. Antigravity：全局规则可放 `C:\Users\Administrator\.gemini\GEMINI.md`；项目级以本 `AGENTS.md` 为主。
2. Cursor：项目规则放 `.cursor/rules/*.mdc`；`.cursorrules` 仅保留兼容入口。
3. VS Code/Copilot：仓库规则放 `.github/copilot-instructions.md`，内容从本文件派生。

## 交接快照模板

```markdown
## Latest Handoff Snapshot
- Timestamp: YYYY-MM-DD HH:mm
- Task-ID:
- Task-Name:
- Active Goal:
- Completed This Session:
- Files Changed:
- Open TODO:
- Risks/Blockers:
- Next First Command:
```
<!-- RELAY:END -->
