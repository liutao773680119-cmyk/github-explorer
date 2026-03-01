// scripts/lib/gemini.ts — Gemini AI 解读调用 + 校验

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getApiKey, sleep } from './utils';
import { GEMINI_MODEL, GEMINI_SLEEP_MS } from '../../app/lib/config';
import type { ProjectAnalysis, ProjectCategory } from '../../app/lib/types';

let _genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
    if (!_genAI) {
        const key = getApiKey('GEMINI_API_KEY', 'Googole Ai Studo Api.txt');
        _genAI = new GoogleGenerativeAI(key);
    }
    return _genAI;
}

// ── Prompt 模板（来自 CLAUDE.md，不可修改） ────────

function buildAnalyzePrompt(params: {
    fullName: string;
    description: string;
    stars: number;
    language: string;
    topics: string[];
    license: string;
    openIssues: number;
    closedIssues: number;
    readme: string;
}): string {
    return `你是一个技术项目解读助手。根据以下信息，用中文生成项目解读。要求：场景驱动，一针见血，不说废话。

项目名：${params.fullName}
描述：${params.description}
Star 数：${params.stars}
语言：${params.language}
Topics：${params.topics.join(', ')}
License：${params.license}
Issue 统计：开启 ${params.openIssues} / 已关闭 ${params.closedIssues}
README（节选）：${params.readme}

请严格按以下 JSON 格式输出，不要输出任何其他内容：
{
  "positioning": "一句话定位，30字以内",
  "useCases": [
    "你做X → 它帮你做Y（具体场景1）",
    "你做X → 它帮你做Y（具体场景2）",
    "你做X → 它帮你做Y（具体场景3）"
  ],
  "audience": "适合什么人用，一句话说明目标用户和典型场景",
  "quickStart": {
    "prerequisites": "前置条件或null",
    "steps": ["步骤1", "步骤2"],
    "note": "平台差异或null"
  },
  "competitors": [
    { "name": "竞品1", "method": "使用方式", "models": "支持模型", "pricing": "免费？" },
    { "name": "竞品2", "method": "使用方式", "models": "支持模型", "pricing": "免费？" }
  ],
  "pricing": "免费/部分免费/付费，简要说明",
  "vibeCodingScore": 3,
  "vibeCodingReason": "评分理由",
  "isVibeCoding": true,
  "communityActivity": "社区活跃度一句话评价，基于 Issue 开闭比和响应速度",
  "category": "分类标签（从以下列表选一个：LLM框架/AI Agent/AI编程助手/CLI工具/前端框架/后端框架/数据库/DevOps/测试工具/安全/文档工具/移动开发/Prompt工程/其他）"
}`;
}

// ── 核心调用 ─────────────────────────────────────

/**
 * 调用 Gemini 生成项目解读
 */
export async function analyzeProject(params: {
    fullName: string;
    description: string;
    stars: number;
    language: string;
    topics: string[];
    license: string;
    openIssues: number;
    closedIssues: number;
    readme: string;
}): Promise<ProjectAnalysis | null> {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const prompt = buildAnalyzePrompt(params);

    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // 提取 JSON（Gemini 可能会包裹在 ```json ... ``` 中）
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.warn(`[Gemini] ${params.fullName}: 返回内容无 JSON`);
            return null;
        }

        // 第一层校验：格式
        const analysis = validateFormat(jsonMatch[0]);
        if (!analysis) {
            console.warn(`[Gemini] ${params.fullName}: 格式校验失败`);
            return null;
        }

        // 第二层校验：内容修正
        const sanitized = sanitizeAndMark(analysis);
        return sanitized;
    } catch (err) {
        console.error(`[Gemini] ${params.fullName}: API 调用失败`, err);
        return null;
    }
}

/**
 * 调用 Gemini 生成今日亮点
 */
export async function selectHighlights(
    projectsSummary: Array<{ fullName: string; positioning: string; stars: number; todayDelta: number }>
): Promise<Array<{ fullName: string; reason: string }>> {
    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const list = projectsSummary
        .map((p) => `- ${p.fullName}：${p.positioning}（⭐${p.stars}，今日+${p.todayDelta}）`)
        .join('\n');

    const prompt = `从以下今日新入库的项目中选出 2-3 个最值得关注的，给出推荐理由。

${list}

请以 JSON 数组格式输出，不要输出其他内容：
[
  { "fullName": "owner/repo", "reason": "推荐理由，一句话" }
]`;

    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return [];

        const parsed = JSON.parse(jsonMatch[0]) as Array<{ fullName: string; reason: string }>;
        return parsed.slice(0, 3);
    } catch {
        console.warn('[Gemini] 今日亮点生成失败');
        return [];
    }
}

/**
 * Gemini 调用间隔
 */
export async function geminiSleep(): Promise<void> {
    await sleep(GEMINI_SLEEP_MS);
}

// ── 校验函数（照搬 CLAUDE.md） ──────────────────

/**
 * 第一层：格式校验
 */
export function validateFormat(raw: string): ProjectAnalysis | null {
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return null;
    }

    const required = [
        'positioning', 'useCases', 'audience', 'quickStart',
        'pricing', 'vibeCodingScore', 'vibeCodingReason',
        'isVibeCoding', 'communityActivity', 'category',
    ];
    for (const key of required) {
        if (!(key in (parsed as object))) return null;
    }

    const p = parsed as Record<string, unknown>;
    if (typeof p.vibeCodingScore !== 'number') return null;
    if (typeof p.isVibeCoding !== 'boolean') return null;
    if (!Array.isArray(p.useCases)) return null;
    if (!Array.isArray(p.competitors)) return null;

    return parsed as ProjectAnalysis;
}

/**
 * 第二层：内容修正 + needsReview 标记
 */
export function sanitizeAndMark(analysis: ProjectAnalysis): ProjectAnalysis {
    const issues: string[] = [];

    // positioning 超长截断
    if (analysis.positioning.length > 50) {
        analysis.positioning = analysis.positioning.slice(0, 50);
        issues.push('positioning_truncated');
    }

    // vibeCodingScore 超范围修正
    if (analysis.vibeCodingScore < 1 || analysis.vibeCodingScore > 5) {
        analysis.vibeCodingScore = 3;
        issues.push('score_out_of_range');
    }

    // category 校验
    const validCategories: ProjectCategory[] = [
        'LLM框架', 'AI Agent', 'AI编程助手', 'CLI工具', '前端框架',
        '后端框架', '数据库', 'DevOps', '测试工具', '安全',
        '文档工具', '移动开发', 'Prompt工程', '其他',
    ];
    if (!validCategories.includes(analysis.category)) {
        analysis.category = '其他';
        issues.push('invalid_category');
    }

    // useCases 超5条截断
    if (analysis.useCases.length > 5) {
        analysis.useCases = analysis.useCases.slice(0, 5);
        issues.push('use_cases_truncated');
    }

    // competitors 超5条截断
    if (analysis.competitors.length > 5) {
        analysis.competitors = analysis.competitors.slice(0, 5);
        issues.push('competitors_truncated');
    }

    if (issues.length > 0) {
        analysis.needsReview = true;
        console.log(`[Sanitize] issues: ${issues.join(', ')}`);
    }

    return analysis;
}
