# Task Registry（会话任务索引）

## 使用规则

1. 每次开场先锁定一个 `Task-ID`。
2. 同一会话只处理一个 `Task-ID`。
3. 收尾时更新 `Status`、`Last Update`、`Next First Command`。
4. `progress.md` 与 `修改记录_会话备忘.md` 必须与这里保持一致。

## 任务列表

| Task-ID | Task-Name | Status | Current Phase | Active Session | Last Update | Next First Command | Notes |
|---|---|---|---|---|---|---|---|
| T2026-04-04-01 | 今日热门按日增星修正 | done | 已完成逻辑修正并实际重跑数据；`oh-my-codex` 已进入 `2026-04-04` 今日热门第 10 位 | codex | 2026-04-04 06:25 | `git diff -- scripts/fetch-and-analyze.ts scripts/lib/github.ts scripts/lib/rankings.ts tests/daily-rankings.test.ts data/projects.json data/stats.json data/daily/2026-04-04.json data/logs/2026-04-04.json` | 根因分两层：旧 `today` 快照取的是“1 天内新建项目”；首次入库项目 `todayStarsDelta=0` 又会被排除。修复后改为“先按日增星排已跟踪项目，再用整次抓取候选池补满榜单”，并已重跑 `fetch-and-analyze` 落盘 |
| T2026-04-03-01 | GitHub 后台运行状态巡检 | done | 已完成 GitHub 仓库 / Actions / 运行告警巡检，并确认主线日更正常 | codex | 2026-04-03 07:20 | `gh run list --repo liutao773680119-cmyk/github-explorer --limit 10` | 结论：`Daily Update` 连续成功并持续写回 `main`；`Re-analyze Project` 曾因目标项目不在 `projects.json` 中失败，但随后补跑成功；当前主要风险为 GitHub Actions Node.js 20 弃用告警 |
| T2026-04-01-01 | Gemini API 替换可行性评估 | in_progress | 最小 PR 分支 `t2026-04-02-pr` 已追加代码复审修复提交 `12bbf52` 并推送远端；当前可直接开 PR | codex | 2026-04-02 06:43 | `open https://github.com/liutao773680119-cmyk/github-explorer/pull/new/t2026-04-02-pr` | 复审修复已覆盖：标准 `npm test` 纳入 3 个契约测试、`RunLog` 兼容历史 `gemini_call/geminiCalls`、README 默认策略口径修正；验证通过 `npm test`、`npm run lint`、`./node_modules/.bin/tsc -p tsconfig.json --noEmit` |
| T2026-03-23-01 | 多模型可选 AI 接入改造 | blocked | DeepSeek fallback 修复已提交；当前阻塞为 GitHub HTTPS 认证，待恢复后推送远程并验证 GitHub Actions 生效 | codex | 2026-03-27 06:20 | `git push origin main` | 待推送提交：`e6cad4e`、`b0a8570`、`cec6e73`；`git push` 当前报错 `could not read Username for 'https://github.com': Device not configured` |
| T20260326-01 | 项目文件状态同步 | done | 会话上下文同步、Git 路径定位与交接文件更新完成 | codex | 2026-03-26 00:14 | `cd C:\Users\Administrator\Desktop\GitHub热门项目解析; $env:Path = 'E:\AI软件\Git\cmd;' + (Resolve-Path '.\.tools\node-v20.19.5-win-x64').Path + ';' + $env:Path; git status --short; npm run dev` | 已确认 Git、Node、npm 的可用路径 |
| T20260325-01 | 项目接手与单项目运行引导 | done | DeepSeek 重跑、AI/provider 命名治理、历史日志迁移、文档清理完成 | codex | 2026-03-25 22:42 | `cd C:\Users\Administrator\Desktop\GitHub热门项目解析; $env:Path = (Resolve-Path '.\.tools\node-v20.19.5-win-x64').Path + ';' + $env:Path; npm run dev` | 页面数据已生成；运行路径、历史日志和主要交接文档已同步 |
| T2026-03-01-02 | GitHub 热门解读 - V1 全栈实现 | done | 基线完成 | antigravity | 2026-03-01 14:12 | `在 Vercel 导入仓库 github-explorer 并部署` | 已完成脚手架、数据脚本、工作流、前端与基础验证 |
| T2026-02-28 16:21-01 | GitHub 热门解读 - 准备阶段 | done | 准备完成 | antigravity | 2026-03-01 08:57 | `N/A` | 已完成项目规则、PRD 和 Git 初始化 |
