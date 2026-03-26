# 多模型可选 AI 接入改造方案

## Task

- Task-ID: `T2026-03-23-01`
- Task-Name: 多模型可选 AI 接入改造

## Goal

让项目从“单一 Gemini 路径”演进为“多个 AI provider 和 model 可配置选择”，同时保持现有“脚本离线生成静态 JSON、前端只读本地数据”的架构不变。

## Scope

本次改造只覆盖脚本层、配置层和工作流层，不在浏览器运行时直接调用第三方模型接口。

包括：

- provider registry
- 运行时 provider / model 选择
- 统一 AI 调用适配层
- 统一日志命名
- GitHub Actions 对多 provider secret 的支持

不包括：

- 前端页面内实时切换模型
- 浏览器直连第三方模型 API
- 多模型并发投票或融合

## Implemented Design

### 1. 配置集中到 registry

在 [app/lib/config.ts](C:\Users\Administrator\Desktop\GitHub热门项目解析\app\lib\config.ts) 中统一维护 provider 定义，当前支持：

- `gemini`
- `deepseek`
- `openai`
- `openrouter`

每个 provider 都包含：

- `id`
- `label`
- `baseURL`
- `defaultModel`
- `apiKeyEnv`
- `apiKeyFile`
- `sleepMs`

默认 provider 仍为 `gemini`，以保持兼容。

### 2. 运行时配置解析

[scripts/lib/ai.ts](C:\Users\Administrator\Desktop\GitHub热门项目解析\scripts\lib\ai.ts) 负责按以下优先级解析运行时配置：

```bash
AI_PROVIDER=gemini|deepseek|openai|openrouter
AI_MODEL=<可选，覆盖默认模型>
```

API Key 读取顺序：

1. 对应环境变量
2. 对应本地文本文件

支持的环境变量：

```bash
GEMINI_API_KEY
DEEPSEEK_API_KEY
OPENAI_API_KEY
OPENROUTER_API_KEY
```

### 3. 统一 AI 调用适配层

[scripts/lib/ai-client.ts](C:\Users\Administrator\Desktop\GitHub热门项目解析\scripts\lib\ai-client.ts) 作为统一调用入口，通过 OpenAI-compatible 接口适配不同 provider。脚本调用方继续复用：

- `analyzeProject()`
- `selectHighlights()`
- `aiSleep()`

### 4. 业务脚本改为 provider 无关命名

以下脚本已改成通用命名，不再把运行路径误写成 Gemini 专属：

- [scripts/fetch-and-analyze.ts](C:\Users\Administrator\Desktop\GitHub热门项目解析\scripts\fetch-and-analyze.ts)
- [scripts/re-analyze.ts](C:\Users\Administrator\Desktop\GitHub热门项目解析\scripts\re-analyze.ts)

已完成：

- `geminiCalls` -> `aiCalls`
- `gemini_call` -> `ai_call`
- 日志文案改为 `AI/provider`

### 5. 工作流支持多 provider secret

工作流已经支持显式注入多 provider 所需 secret：

- [daily-update.yml](C:\Users\Administrator\Desktop\GitHub热门项目解析\.github\workflows\daily-update.yml)
- [re-analyze.yml](C:\Users\Administrator\Desktop\GitHub热门项目解析\.github\workflows\re-analyze.yml)

## Verification

已完成的关键验证：

- `node tests\ai-provider-naming-contract.test.mjs`
- `node tests\layout-font-contract.test.mjs`
- 宿主环境 `npm run build`

## Commits

当前主线已拆分为 4 个提交：

1. `b421908` `refactor: unify AI provider naming in scripts`
2. `f22bee8` `fix: remove remote font dependency for local builds`
3. `e445054` `chore: ignore local tools and secrets`
4. `f00eac1` `data: refresh project snapshot for 2026-03-25`

## Remaining Decisions

当前仍待判断是否保留到 Git 历史的文件：

- `data/cache/readme-cache.json`
- `public/version.json`
- `progress.md`
- `task_registry.md`
- `task_plan.md`
- `findings.md`
- `修改记录_会话备忘.md`

## Recommendation

建议后续处理顺序：

1. 不再继续提交交接文件，保留为本地会话状态
2. 把 `data/cache/readme-cache.json` 和 `public/version.json` 视为产物类改动谨慎处理
3. 若需要文档归档，只提交这份方案文档，不混入交接文件
