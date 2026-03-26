// app/lib/types.ts — 完整类型定义

export interface Competitor {
    name: string;
    method: string;
    models: string;
    pricing: string;
}

export type AIProviderId = 'gemini' | 'deepseek' | 'openai' | 'openrouter';

export interface AIProviderDefinition {
    id: AIProviderId;
    label: string;
    baseURL: string;
    defaultModel: string;
    apiKeyEnv: string;
    apiKeyFile: string;
    sleepMs: number;
}

export interface QuickStart {
    prerequisites: string | null;
    steps: string[];
    note: string | null;
}

export interface ProjectAnalysis {
    positioning: string;
    useCases: string[];
    audience: string;
    quickStart: QuickStart;
    competitors: Competitor[];
    pricing: string;
    vibeCodingScore: number;
    vibeCodingReason: string;
    isVibeCoding: boolean;
    communityActivity: string;
    category: ProjectCategory;
    needsReview?: boolean;
}

export type ProjectCategory =
    | 'LLM框架' | 'AI Agent' | 'AI编程助手' | 'CLI工具'
    | '前端框架' | '后端框架' | '数据库' | 'DevOps'
    | '测试工具' | '安全' | '文档工具' | '移动开发'
    | 'Prompt工程' | '其他';

export const ALL_CATEGORIES: ProjectCategory[] = [
    'LLM框架', 'AI Agent', 'AI编程助手', 'CLI工具',
    '前端框架', '后端框架', '数据库', 'DevOps',
    '测试工具', '安全', '文档工具', '移动开发',
    'Prompt工程', '其他',
];

export interface Project {
    owner: string;
    repo: string;
    fullName: string;
    description: string;
    language: string;
    topics: string[];
    license: string;
    createdAt: string;
    url: string;
    analysis: ProjectAnalysis;
    analyzedAt: string;
}

export interface ProjectStats {
    fullName: string;
    stars: number;
    forks: number;
    openIssues: number;
    closedIssues: number;
    watchers: number;
    sponsors: number;
    pushedAt: string;
    updatedAt: string;
    todayStarsDelta: number;
    fetchedAt: string;
    isArchived: boolean;
    isDead: boolean;
    deadDetectedAt?: string;
}

export interface DailySnapshot {
    date: string;
    todayTrending: string[];
    weekTrending: string[];
    newStars: string[];
    vibeCoding: string[];
    classic: string[];
    highlights: Highlight[];
}

export interface Highlight {
    fullName: string;
    reason: string;
}

export interface ProjectsJson {
    version: string;
    updatedAt: string;
    projects: Project[];
}

export interface StatsJson {
    version: string;
    updatedAt: string;
    stats: Record<string, ProjectStats>;
}

export interface ProjectWithStats extends Project {
    stats: ProjectStats;
    isFavorite?: boolean;
    isRead?: boolean;
    isNew?: boolean;
}

export type TabId = 'today' | 'week' | 'newStars' | 'vibeCoding' | 'classic' | 'favorites';

export type SortKey = 'stars' | 'todayStarsDelta' | 'createdAt' | 'pushedAt' | 'vibeCodingScore';

export type RunErrorStage = 'github_fetch' | 'readme_fetch' | 'ai_call' | 'json_parse' | 'file_write' | 'git_push';

export interface RunError {
    time: string;
    level: 'warn' | 'error' | 'fatal';
    project?: string;
    stage: RunErrorStage;
    message: string;
    retries: number;
    skipped: boolean;
}

export interface RunLog {
    version: string;
    date: string;
    startedAt: string;
    finishedAt: string;
    durationSeconds: number;
    success: boolean;
    stats: {
        fetched: number;
        newProjects: number;
        skipped: number;
        aiCalls: number;
        statsUpdated: number;
    };
    errors: RunError[];
}

// localStorage 相关类型
export interface LocalStorageMeta {
    version: string;
    migratedAt: string;
}

export interface HistoryEntry {
    fullName: string;
    readAt: string;
}

export interface SearchState {
    query: string;
    isActive: boolean;
    results: ProjectWithStats[];
}
