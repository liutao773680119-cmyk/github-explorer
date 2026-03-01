// app/lib/config.ts — 所有可配置常量统一管理

// ── GitHub 仓库配置 ──────────────────────────────
// vibe coding 时替换为实际值
export const GITHUB_REPO_OWNER = 'liutao773680119-cmyk';
export const GITHUB_REPO_NAME = 'github-explorer';
export const RE_ANALYZE_WORKFLOW_URL =
    `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/workflows/re-analyze.yml`;

// ── AI 模型配置 ──────────────────────────────────
// 模型废弃时只需修改此处，无需全局搜索替换
// 当前模型：gemini-2.5-flash（免费，Google AI Studio）
// 升级参考：https://ai.google.dev/gemini-api/docs/models
export const GEMINI_MODEL = 'gemini-2.0-flash';

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
export const GEMINI_SLEEP_MS = 4000;   // Gemini 调用间隔（避免 429）
export const HEALTH_CHECK_DAYS = 30;   // 健康度检查的项目最小入库天数
export const DEAD_COMMIT_DAYS = 365;   // 判定已死：无 commit 天数
export const DEAD_ISSUE_RATIO = 5;     // 判定已死：issue 开闭比阈值
export const PAGE_SIZE = 20;           // 每页显示条数
export const STALE_HOURS = 25;         // 数据过期警告阈值（小时）
export const VERSION_CHECK_INTERVAL = 10 * 60 * 1000; // 版本检测间隔（10分钟）
