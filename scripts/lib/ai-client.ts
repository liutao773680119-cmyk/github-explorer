// scripts/lib/ai-client.ts — AI 解读调用 + 校验（OpenAI-compatible providers）

import OpenAI from 'openai';
import { sleep } from './utils';
import { loadAiRuntimeConfig } from './ai';
import type { ProjectAnalysis, ProjectCategory } from '../../app/lib/types';

let _client: OpenAI | null = null;
let _runtimeConfig: ReturnType<typeof loadAiRuntimeConfig> | null = null;

function getRuntimeConfig(): ReturnType<typeof loadAiRuntimeConfig> {
    if (!_runtimeConfig) {
        _runtimeConfig = loadAiRuntimeConfig();
    }
    return _runtimeConfig;
}

function getClient(): OpenAI {
    if (!_client) {
        const runtimeConfig = getRuntimeConfig();
        _client = new OpenAI({
            apiKey: runtimeConfig.apiKey,
            baseURL: runtimeConfig.provider.baseURL,
        });
    }
    return _client;
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
 * 调用 DeepSeek 生成项目解读
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
    const client = getClient();
    const runtimeConfig = getRuntimeConfig();
    const prompt = buildAnalyzePrompt(params);

    const MAX_RETRIES = 2;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const completion = await client.chat.completions.create({
                model: runtimeConfig.model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
            });

            const text = completion.choices[0]?.message?.content ?? '';

            console.log(`[AI] ${params.fullName}: 返回 ${text.length} 字符`);

            // 提取 JSON
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn(`[AI] ${params.fullName}: 返回内容无 JSON, 全文: ${text.slice(0, 500)}`);
                return null;
            }

            // 第一层校验：格式
            const analysis = validateFormat(jsonMatch[0], params.fullName);
            if (!analysis) {
                console.warn(`[AI] ${params.fullName}: 格式校验失败, JSON片段: ${jsonMatch[0].slice(0, 300)}`);
                return null;
            }

            // 第二层校验：内容修正
            const sanitized = sanitizeAndMark(analysis);
            return sanitized;
        } catch (err) {
            const errMsg = String(err);
            // 429 限流：等待后重试
            if (errMsg.includes('429') && attempt < MAX_RETRIES) {
                const waitSec = 10 * (attempt + 1);
                console.warn(`[AI] ${params.fullName}: 429 限流，等待 ${waitSec}s 后重试 (${attempt + 1}/${MAX_RETRIES})...`);
                await sleep(waitSec * 1000);
                continue;
            }
            console.error(`[AI] ${params.fullName}: API 调用失败 (attempt ${attempt})`, err);
            return null;
        }
    }
    return null;
}

/**
 * 调用 DeepSeek 生成今日亮点
 */
export async function selectHighlights(
    projectsSummary: Array<{ fullName: string; positioning: string; stars: number; todayDelta: number }>
): Promise<Array<{ fullName: string; reason: string }>> {
    const client = getClient();
    const runtimeConfig = getRuntimeConfig();

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
        const completion = await client.chat.completions.create({
            model: runtimeConfig.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
        });

        const text = completion.choices[0]?.message?.content ?? '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return [];

        const parsed = JSON.parse(jsonMatch[0]) as Array<{ fullName: string; reason: string }>;
        return parsed.slice(0, 3);
    } catch {
        console.warn('[AI] 今日亮点生成失败');
        return [];
    }
}

/**
 * AI 调用间隔
 */
export async function geminiSleep(): Promise<void> {
    await sleep(getRuntimeConfig().provider.sleepMs);
}

// ── 校验函数（照搬 CLAUDE.md） ──────────────────

/**
 * 第一层：格式校验
 */
export function validateFormat(raw: string, projectName?: string): ProjectAnalysis | null {
    const tag = projectName ? `[Validate ${projectName}]` : '[Validate]';
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch (err) {
        console.warn(`${tag} JSON 解析失败: ${err}`);
        return null;
    }

    const required = [
        'positioning', 'useCases', 'audience', 'quickStart',
        'pricing', 'vibeCodingScore', 'vibeCodingReason',
        'isVibeCoding', 'communityActivity', 'category',
    ];
    for (const key of required) {
        if (!(key in (parsed as object))) {
            console.warn(`${tag} 缺少必填字段: ${key}`);
            return null;
        }
    }

    const p = parsed as Record<string, unknown>;
    if (typeof p.vibeCodingScore !== 'number') {
        console.warn(`${tag} vibeCodingScore 不是 number: ${typeof p.vibeCodingScore} = ${p.vibeCodingScore}`);
        return null;
    }
    if (typeof p.isVibeCoding !== 'boolean') {
        console.warn(`${tag} isVibeCoding 不是 boolean: ${typeof p.isVibeCoding} = ${p.isVibeCoding}`);
        return null;
    }
    if (!Array.isArray(p.useCases)) {
        console.warn(`${tag} useCases 不是数组`);
        return null;
    }
    if (!Array.isArray(p.competitors)) {
        console.warn(`${tag} competitors 不是数组: ${typeof p.competitors}`);
        // 容错：如果缺少 competitors，补空数组
        (parsed as Record<string, unknown>).competitors = [];
    }

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
