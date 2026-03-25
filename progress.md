# Progress Log（Relay Kit）

## Latest Handoff Snapshot

- Timestamp: 2026-03-25 13:40
- Task-ID: T2026-03-23-01
- Task-Name: 多模型可选 AI 接入改造
- Active Goal: 完成多 provider 接入后的工程清理，拿到 repo 级 ESLint 通过证据
- Completed This Session:
  1. 新增 `tests/ai-config.test.ts`，按 TDD 先写 provider 解析失败测试
  2. 新增 `scripts/lib/ai.ts`，实现 `resolveAiRuntimeConfig()` 与 `loadAiRuntimeConfig()`
  3. 在 `app/lib/config.ts` 增加 `AI_PROVIDERS`、`DEFAULT_AI_PROVIDER`，首批支持 gemini / deepseek / openai / openrouter
  4. 在 `app/lib/types.ts` 增加 `AIProviderId` 与 `AIProviderDefinition`
  5. 将 AI 调用层内部改为按运行时 provider 决定 baseURL、model、apiKey 和 sleepMs，保持对外接口不变
  6. 将 `scripts/lib/gemini.ts` 重命名为 `scripts/lib/ai-client.ts`，更新调用方 import
  7. 更新 `.github/workflows/daily-update.yml` 与 `.github/workflows/re-analyze.yml`，支持多 provider secret，并给 re-analyze 增加 `provider` / `model` 输入
  8. 更新 `README.md` 与 `docs/operations.md`，补充多 provider 配置说明
  9. 移除 `scripts/fetch-and-analyze.ts` 中未使用的 `fs` 引用
  10. 运行验证：
     - `tsx --test tests\\*.test.ts` 通过（9/9）
     - `tsc --noEmit` 通过
     - 本轮改动文件定向 `eslint` 通过
  11. 更新 `eslint.config.mjs`，忽略 `.agent/`、`.cursor/` 和 `tsconfig.tsbuildinfo`
  12. 将 `scripts/gen-version.js` 改为 ESM import
  13. 运行 repo 级 `eslint .` 并确认通过
- Files Changed:
  - [NEW] `scripts/lib/ai.ts`
  - [NEW] `tests/ai-config.test.ts`
  - [MOD] `app/lib/config.ts`
  - [MOD] `app/lib/types.ts`
  - [MOD] `scripts/lib/ai-client.ts`
  - [MOD] `scripts/fetch-and-analyze.ts`
  - [MOD] `.github/workflows/daily-update.yml`
  - [MOD] `.github/workflows/re-analyze.yml`
  - [MOD] `README.md`
  - [MOD] `docs/operations.md`
  - [MOD] `eslint.config.mjs`
  - [MOD] `scripts/gen-version.js`
  - [MOD] `progress.md`
  - [MOD] `task_plan.md`
  - [MOD] `修改记录_会话备忘.md`
- Open TODO:
  1. 如需 UI 层可视化选择模型，需要单独设计前端交互
  2. 评估是否把历史日志字段 `geminiCalls` / `gemini_call` 迁移为通用命名
  3. 继续按提交边界拆分功能、文档、CI、治理文件
- Risks/Blockers:
  1. 当前 PowerShell 仍缺少 `node` / `npm` PATH，验证依赖外部 `node.exe` 绝对路径执行
  2. 工作区还包含与当前任务无关的文档、缓存和 CI 改动，提交时需要分组
- Next First Command: `git status --short`

## Session Notes（Current）

- 当前实现不是前端直连模型，而是离线脚本统一生成项目分析后写入 `data/projects.json`
- `scripts/lib/ai-client.ts` 负责统一接入 OpenAI-compatible provider，历史日志字段仍沿用 gemini 命名以避免数据迁移
- 2026-03-25 已完成 repo 级 ESLint 清理，当前 `eslint .` 可通过
- 工作流目前只支持 `GEMINI_API_KEY`，需要扩展为多 secret 并由脚本按 provider 选择
- 当前 `git status --short` 显示工作区不是干净状态，接下来的实现需要避免覆盖已有改动
- 2026-03-25 本轮已完成多 provider 运行时接入；实现保持脚本对外接口稳定，优先减少调用方改动

## Legacy Archive

- 2026-03-01：V1 全栈实现完成，已具备 GitHub 数据抓取、README 缓存、AI 解读、静态前端展示与基本验证能力
