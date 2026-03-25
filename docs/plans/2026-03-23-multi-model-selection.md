# 多模型可选 AI 接入改造 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让项目从“单一 Gemini API”升级为“多个大模型 provider + model 可配置选择”，并保持现有离线脚本产出静态 JSON 的架构不变。

**Architecture:** 推荐把“选择模型”放在脚本与 workflow 层，而不是前端运行时。核心做法是把 `app/lib/config.ts` 中的单一 `AI_MODEL` / `AI_BASE_URL` 升级为 provider registry，由脚本侧根据 `AI_PROVIDER`、可选 `AI_MODEL` 和对应 API Key 解析实际调用配置；`scripts/lib/gemini.ts` 重构为通用 `scripts/lib/ai.ts`，统一承载 `analyzeProject()`、`selectHighlights()` 与 sleep / client 创建逻辑。

**Tech Stack:** Next.js 16、TypeScript、OpenAI SDK（用于 OpenAI-compatible providers）、GitHub Actions、静态 JSON 数据文件。

---

## 推荐方案与边界

### 推荐方案：脚本层可选 provider + model

- 默认 provider 仍保留 `gemini`，保证现有行为不变。
- 新增 provider registry，首批支持 `gemini`、`deepseek`、`openai`，可预留 `openrouter`。
- 选择方式优先使用环境变量：
  - `AI_PROVIDER=gemini|deepseek|openai|openrouter`
  - `AI_MODEL=<可选，覆盖默认模型>`
- API Key 仍按 provider 专属环境变量读取，例如：
  - `GEMINI_API_KEY`
  - `DEEPSEEK_API_KEY`
  - `OPENAI_API_KEY`
  - `OPENROUTER_API_KEY`

### 不在本次推荐范围

- 前端页面里让访客实时切换模型。
- 在浏览器里直接请求第三方大模型 API。
- 同时并发调用多个模型做投票融合。

这些方向都与当前“构建时离线生成静态 JSON”的项目结构不一致，应该单独立项。

## 关键文件与改造点

### 核心配置

**Files:**
- Modify: `app/lib/config.ts`
- Modify: `app/lib/types.ts`

要点：
- 新增 `AIProviderId`、`AIProviderDefinition`、`DEFAULT_AI_PROVIDER`。
- 在 `app/lib/config.ts` 统一定义 provider 列表、默认模型、base URL、默认 sleep 间隔、环境变量名。
- 避免把密钥硬编码到配置文件里；配置只保存“去哪里拿密钥”的信息。
- 若暂不做数据迁移，可保留 `geminiCalls` / `gemini_call` 作为历史日志字段，内部函数名改为通用 `ai*`。

### 脚本调用层

**Files:**
- Rename: `scripts/lib/gemini.ts` -> `scripts/lib/ai.ts`
- Modify: `scripts/lib/utils.ts`
- Modify: `scripts/fetch-and-analyze.ts`
- Modify: `scripts/re-analyze.ts`

要点：
- 将 `getClient()` 升级为 `getAiClient()`，根据 provider registry 构造 `OpenAI` client。
- 将 `geminiSleep()` 重命名为 `aiSleep()`，sleep 时长从当前 provider 配置读取。
- 将 `getApiKey()` 的用法改为基于 provider 定义动态解析环境变量与本地回退文件。
- `analyzeProject()` 与 `selectHighlights()` 保持对调用方的签名稳定，优先减少上层改动。

### 工作流与文档

**Files:**
- Modify: `.github/workflows/daily-update.yml`
- Modify: `.github/workflows/re-analyze.yml`
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Optional: `PRD.md`

要点：
- workflow 统一注入所有候选 provider 的 API Key，脚本运行时自行选择。
- 文档补充“如何切换 provider / model”“本地调试如何放置密钥文件”“Actions 需要配置哪些 secrets”。
- 如果 `CLAUDE.md` 中仍声明“固定 Gemini”，需要同步改为“默认 Gemini，可切换 provider”。

## 实施任务

### Task 1: 先补 provider 解析测试

**Files:**
- Create: `scripts/lib/ai-config.test.ts`
- Modify: `package.json`

**Step 1: 写失败测试**

目标行为：
- 未设置 `AI_PROVIDER` 时默认解析为 `gemini`
- 设置 `AI_PROVIDER=deepseek` 时返回 DeepSeek 配置
- 设置 `AI_MODEL` 时能覆盖 provider 默认模型
- 传入未知 provider 时抛出明确错误

示例测试骨架：

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAiRuntimeConfig } from './ai';

test('默认使用 gemini provider', () => {
  const config = resolveAiRuntimeConfig({});
  assert.equal(config.provider.id, 'gemini');
});
```

**Step 2: 运行测试确认失败**

Run:

```bash
npx tsx --test scripts/lib/ai-config.test.ts
```

Expected:
- 因 `resolveAiRuntimeConfig` 尚不存在而失败

**Step 3: 为测试脚本补 package.json 命令**

新增：

```json
"test:ai": "tsx --test scripts/lib/ai-config.test.ts"
```

**Step 4: 再跑一次，确认仍是预期失败**

Run:

```bash
npm run test:ai
```

Expected:
- 失败点来自功能未实现，而不是命令不存在

**Step 5: Commit**

```bash
git add package.json scripts/lib/ai-config.test.ts
git commit -m "test: add AI provider resolution coverage"
```

### Task 2: 抽象 provider registry 与运行时配置解析

**Files:**
- Modify: `app/lib/config.ts`
- Create: `scripts/lib/ai.ts`
- Modify: `scripts/lib/utils.ts`

**Step 1: 先让测试继续失败但更聚焦**

新增运行时解析接口：

```ts
export interface AiRuntimeConfig {
  provider: AIProviderDefinition;
  model: string;
  apiKey: string;
}
```

**Step 2: 最小实现 `resolveAiRuntimeConfig()`**

关键职责：
- 读取 `AI_PROVIDER`
- 找到对应 provider 定义
- 读取 provider 专属 API Key
- 处理 `AI_MODEL` 覆盖

建议的 provider 定义示意：

```ts
export const AI_PROVIDERS = {
  gemini: {
    id: 'gemini',
    label: 'Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    defaultModel: 'gemini-2.5-flash-lite',
    apiKeyEnv: 'GEMINI_API_KEY',
    apiKeyFile: 'Googole Ai Studo Api.txt',
    sleepMs: 4000,
  },
  deepseek: {
    id: 'deepseek',
    label: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    apiKeyFile: 'DeepSeek Api.txt',
    sleepMs: 2500,
  },
  openai: {
    id: 'openai',
    label: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4.1-mini',
    apiKeyEnv: 'OPENAI_API_KEY',
    apiKeyFile: 'OpenAI Api.txt',
    sleepMs: 2500,
  },
} as const;
```

**Step 3: 跑测试确认通过**

Run:

```bash
npm run test:ai
```

Expected:
- provider 解析测试全部通过

**Step 4: 重构 client 创建逻辑**

- `getClient()` 读取 `resolveAiRuntimeConfig()`
- `new OpenAI({ apiKey, baseURL })`
- `model` 不再从单一常量读取，而是来自运行时配置

**Step 5: Commit**

```bash
git add app/lib/config.ts scripts/lib/ai.ts scripts/lib/utils.ts package.json scripts/lib/ai-config.test.ts
git commit -m "feat: add configurable AI provider registry"
```

### Task 3: 替换业务脚本中的 gemini 专属调用

**Files:**
- Modify: `scripts/fetch-and-analyze.ts`
- Modify: `scripts/re-analyze.ts`

**Step 1: 先确认旧符号存在**

Run:

```bash
rg -n "geminiSleep|from './lib/gemini'" scripts
```

Expected:
- 能看到旧引用，证明替换目标存在

**Step 2: 实施最小改动**

- 改 import 路径与函数名
- 保持 `analyzeProject()` / `selectHighlights()` 参数不变
- 日志文案统一改为 `AI`

**Step 3: 再跑 grep 确认旧符号已移除**

Run:

```bash
rg -n "geminiSleep|from './lib/gemini'" scripts
```

Expected:
- 无结果

**Step 4: 进行一次类型检查**

Run:

```bash
npx tsc --noEmit
```

Expected:
- 无 TypeScript 错误

**Step 5: Commit**

```bash
git add scripts/fetch-and-analyze.ts scripts/re-analyze.ts scripts/lib/ai.ts
git commit -m "refactor: switch scripts to generic AI adapter"
```

### Task 4: 更新 GitHub Actions 与密钥策略

**Files:**
- Modify: `.github/workflows/daily-update.yml`
- Modify: `.github/workflows/re-analyze.yml`

**Step 1: 先写工作流约束清单**

需要满足：
- 默认 provider 不配置时仍能跑 Gemini
- 切换 provider 只需改 workflow env
- secrets 不做动态索引，直接显式注入多个候选 key

**Step 2: 改工作流 env**

推荐结构：

```yml
env:
  AI_PROVIDER: gemini
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
  DEEPSEEK_API_KEY: ${{ secrets.DEEPSEEK_API_KEY }}
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
```

**Step 3: 验证 YAML 结构无明显回归**

Run:

```bash
Get-Content .github/workflows/daily-update.yml
Get-Content .github/workflows/re-analyze.yml
```

Expected:
- `AI_PROVIDER` 和多 API Key 已显式注入

**Step 4: Commit**

```bash
git add .github/workflows/daily-update.yml .github/workflows/re-analyze.yml
git commit -m "chore: support multiple AI provider secrets in workflows"
```

### Task 5: 更新文档与验证

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`
- Optional: `PRD.md`

**Step 1: 文档补充**

至少说明：
- 默认 provider 是什么
- 如何本地切换 `AI_PROVIDER`
- 如何覆盖 `AI_MODEL`
- 每个 provider 对应哪个 secret / 本地 txt 文件

**Step 2: 运行验证命令**

Run:

```bash
npm run test:ai
npx tsc --noEmit
npm run lint
```

Expected:
- 测试通过
- TypeScript 无错误
- ESLint 通过

**Step 3: 若命令失败，记录到 `task_plan.md`**

- 不重复同一失败命令
- 优先修 PATH 或使用绝对路径执行 `node.exe` / `npm.cmd`

**Step 4: Commit**

```bash
git add README.md CLAUDE.md PRD.md task_plan.md
git commit -m "docs: document configurable AI providers"
```

## 验收标准

1. 客户端仍不直接调用第三方模型 API。
2. 本地或 GitHub Actions 里仅通过环境变量即可切换 provider。
3. 同一个 `analyzeProject()` / `selectHighlights()` 调用链可复用不同模型。
4. 默认未配置时行为与当前 Gemini 路径兼容。
5. 至少有 provider 解析测试覆盖默认值、覆盖值、异常值三类场景。

## 风险与注意事项

1. 现有终端缺少 `git` / `node` / `npm` PATH，实施前要先解决，否则无法完成测试验证。
2. 如果后续想支持 Anthropic 原生 Messages API，这一版 registry 需要再扩成“兼容接口 + 原生 SDK 双通道”。
3. 若决定把日志字段从 `geminiCalls` 统一改为 `aiCalls`，需要确认是否要补数据迁移脚本。

Plan complete and saved to `docs/plans/2026-03-23-multi-model-selection.md`. Two execution options:

1. Subagent-Driven (this session) - 我在当前会话里按任务拆分推进实现
2. Parallel Session (separate) - 你后面开新会话，按这份计划逐步执行
