# 任务计划（Relay Kit）

## Goal

在不改变“离线脚本生成静态 JSON”架构的前提下，将当前单一 Gemini 路径升级为多个大模型 provider / model 可配置选择。

## Current Task

- Task-ID: `T2026-03-23-01`
- Task-Name: 多模型可选 AI 接入改造
- Current Phase: 方案规划完成，待实现

## Active Phases

| Phase | 任务 | 状态 |
|---|---|---|
| 0 | 按 AGENTS 完成接手检查与上下文读取 | completed |
| 1 | 梳理当前 AI 调用链、配置项与 workflow 依赖 | completed |
| 2 | 输出实施计划并写入 `docs/plans/2026-03-23-multi-model-selection.md` | completed |
| 3 | provider registry / AI 调用层重构 | pending |
| 4 | workflow / 文档同步 | pending |
| 5 | 测试、lint、typecheck 验证 | pending |

## 当前工作清单（接力必看）

- [x] 读取 `AGENTS.md`
- [x] 读取 `task_registry.md`
- [x] 读取 `progress.md`
- [x] 读取 `task_plan.md`
- [x] 读取 `findings.md`
- [x] 读取 `修改记录_会话备忘.md`
- [x] 执行启动检查并记录结果
- [x] 定位 `scripts/lib/gemini.ts`、`app/lib/config.ts`、workflow 密钥注入点
- [x] 生成多模型可选改造计划文档
- [x] 先补 provider 解析测试
- [x] 抽象 provider registry 与运行时配置解析
- [x] 将 AI 调用层从 `gemini.ts` 演进为通用实现，并消除文件命名歧义
- [x] 更新 GitHub Actions 与文档
- [x] 执行测试、typecheck 与定向 lint 验证

## Decisions Made

| Decision | Rationale |
|---|---|
| 选择“脚本层 provider + model 可选”作为默认实现方向 | 符合现有项目架构，改造面最小 |
| 优先沿用 OpenAI 兼容接口 | 可以复用已有 `openai` SDK 和 `AI_BASE_URL` 思路 |
| 本轮先做计划，不直接写业务代码 | 用户明确要求“先给计划” |

## Errors Encountered

| Error | Attempt | Resolution |
|---|---|---|
| `git` 命令不可识别 | 按 AGENTS 执行 `git status --short` | 记录为环境阻塞，待修 PATH 或改绝对路径 |
| `node` / `npm` 命令不可识别 | 按 AGENTS 执行 `node -v` 和 `npm -v` | 记录为环境阻塞，待修 PATH 或改绝对路径 |
| repo 级 ESLint 首次运行超时 | 以外部 `node.exe` 运行 `eslint .` | 延长超时后确认存在既有 lint 问题，改为对本轮变更文件做定向 lint 验证 |
| repo 级 ESLint 存在既有错误 | 检查失败文件与 eslint 配置 | 已通过忽略 `.agent/`、`.cursor/`、`tsconfig.tsbuildinfo` 并将 `scripts/gen-version.js` 改为 ESM 解决 |

## Handoff Checklist（结束前必须完成）

- [x] 更新 `progress.md` 的 `Latest Handoff Snapshot`
- [x] 更新 `task_registry.md` 当前任务行
- [x] 将关键发现写入 `findings.md`
- [x] 生成实施计划文档
- [x] 写明“下一步第一条命令”
