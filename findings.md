# Findings（Relay Kit）

## 当前任务

- Task-ID: `T2026-03-23-01`
- Task-Name: 多模型可选 AI 接入改造

## Requirements（当前需求）

- 查看当前项目代码，评估如何把单一 Gemini API 改成多个大模型可任选。
- 先给出一份贴合现有仓库结构的实施计划，再决定是否进入实现。

## Confirmed Facts（已确认事实）

1. 当前大模型调用只发生在脚本侧，不发生在前端运行时。
2. 主调用入口现位于 `scripts/lib/ai-client.ts`，底层已使用 `openai` SDK 加 provider registry，具备多 provider 切换能力。
3. `scripts/fetch-and-analyze.ts` 与 `scripts/re-analyze.ts` 都依赖 `analyzeProject()` 和 `geminiSleep()`。
4. `.github/workflows/daily-update.yml` 与 `.github/workflows/re-analyze.yml` 当前只注入 `GEMINI_API_KEY`。
5. `app/lib/config.ts` 目前只有单一 `AI_MODEL` 与 `AI_BASE_URL`，尚无 provider registry。
6. `package.json` 已依赖 `openai`，未接入 `@anthropic-ai/sdk` 等其他 SDK。

## Key Decisions（关键决策）

| Decision | Rationale |
|---|---|
| 默认目标定义为“脚本 / workflow 层面可选 provider + model” | 这与现有离线脚本产出静态 JSON 的架构一致，也不违反“禁止客户端发起网络请求”的约束 |
| 推荐优先支持 OpenAI 兼容接口的多 provider | 现有代码已经使用 `openai` SDK，能最快覆盖 Gemini / DeepSeek / OpenAI / OpenRouter |
| 先做配置抽象与调用层重构，再决定是否统一迁移日志字段 | 先保证功能可切换，避免一次性引入日志和历史数据的结构迁移风险 |

## Risks（风险）

1. 当前 PowerShell 环境中 `git` / `node` / `npm` 不在 PATH，后续实现前需要先修复路径或改用绝对路径。
2. 如果用户想要的是“前端页面里手动切换模型”，那是另一层产品设计，不等同于当前脚本接入改造。

## Open Questions（待确认）

1. “可任选”是否只需要本地 / GitHub Actions 配置切换，还是还要做前端可视化切换入口。

## Legacy Archive

- 历史基线：项目为 Next.js + TypeScript + Tailwind，数据来源为构建时静态 JSON，非前端实时 API。
