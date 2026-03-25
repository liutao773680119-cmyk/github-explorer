// app/lib/config.ts — 所有可配置常量统一管理

// ── GitHub 仓库配置 ──────────────────────────────
// vibe coding 时替换为实际值
export const GITHUB_REPO_OWNER = 'liutao773680119-cmyk';
export const GITHUB_REPO_NAME = 'github-explorer';
export const RE_ANALYZE_WORKFLOW_URL =
    `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/workflows/re-analyze.yml`;

import type { AIProviderDefinition, AIProviderId } from './types';

// ── AI 模型配置 ──────────────────────────────────
// 默认 provider 保持 Gemini，兼容现有脚本行为
export const DEFAULT_AI_PROVIDER: AIProviderId = 'gemini';

export const AI_PROVIDERS: Record<AIProviderId, AIProviderDefinition> = {
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
    openrouter: {
        id: 'openrouter',
        label: 'OpenRouter',
        baseURL: 'https://openrouter.ai/api/v1',
        defaultModel: 'openai/gpt-4.1-mini',
        apiKeyEnv: 'OPENROUTER_API_KEY',
        apiKeyFile: 'OpenRouter Api.txt',
        sleepMs: 2500,
    },
};

// 兼容当前旧代码路径，后续接入统一运行时配置后可删除
export const AI_MODEL = AI_PROVIDERS[DEFAULT_AI_PROVIDER].defaultModel;
export const AI_BASE_URL = AI_PROVIDERS[DEFAULT_AI_PROVIDER].baseURL;

// ── 数据版本 ─────────────────────────────────────
// 与 projects.json 的 version 字段保持一致
// 结构变更时同步 +1，并运行 scripts/migrate.ts
export const EXPECTED_DATA_VERSION = '1';

// ── localStorage 版本 ────────────────────────────
// 与 storage.ts 的 CURRENT_VERSION 保持一致
export const LS_VERSION = '1';

// ── 业务常量 ─────────────────────────────────────
export const FAVORITES_LIMIT = 200;    // 收藏上限
export const HISTORY_LIMIT = 500;      // 历史记录上限
export const README_MAX_CHARS = 3000;  // README 截取长度
export const AI_SLEEP_MS = AI_PROVIDERS[DEFAULT_AI_PROVIDER].sleepMs; // AI 调用间隔（避免 429）
export const HEALTH_CHECK_DAYS = 30;   // 健康度检查的项目最小入库天数
export const DEAD_COMMIT_DAYS = 365;   // 判定已死：无 commit 天数
export const DEAD_ISSUE_RATIO = 5;     // 判定已死：issue 开闭比阈值
export const PAGE_SIZE = 20;           // 每页显示条数
export const STALE_HOURS = 25;         // 数据过期警告阈值（小时）
export const VERSION_CHECK_INTERVAL = 10 * 60 * 1000; // 版本检测间隔（10分钟）
