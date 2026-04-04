// scripts/lib/github.ts — GitHub API 数据抓取封装

import { Octokit } from '@octokit/rest';
import { getApiKey, truncate, sleep } from './utils';
import { README_MAX_CHARS } from '../../app/lib/config';
import type { ProjectStats } from '../../app/lib/types';

let _octokit: Octokit | null = null;

/**
 * 获取或创建 Octokit 实例
 */
export function getOctokit(): Octokit {
    if (!_octokit) {
        const token = getApiKey('GITHUB_TOKEN', 'Github Token.txt');
        _octokit = new Octokit({ auth: token });
    }
    return _octokit;
}

// ── 搜索函数 ────────────────────────────────────

interface SearchResult {
    fullName: string;
    owner: string;
    repo: string;
    description: string;
    language: string;
    topics: string[];
    license: string;
    stars: number;
    forks: number;
    openIssues: number;
    createdAt: string;
    pushedAt: string;
    url: string;
    isArchived: boolean;
}

function mapSearchItem(item: Record<string, unknown>): SearchResult {
    const repo = item as {
        full_name: string;
        owner: { login: string };
        name: string;
        description: string | null;
        language: string | null;
        topics?: string[];
        license: { spdx_id: string } | null;
        stargazers_count: number;
        forks_count: number;
        open_issues_count: number;
        created_at: string;
        pushed_at: string;
        html_url: string;
        archived: boolean;
    };
    return {
        fullName: repo.full_name,
        owner: repo.owner.login,
        repo: repo.name,
        description: repo.description ?? '',
        language: repo.language ?? 'Unknown',
        topics: repo.topics ?? [],
        license: repo.license?.spdx_id ?? 'Unknown',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
        createdAt: repo.created_at,
        pushedAt: repo.pushed_at,
        url: repo.html_url,
        isArchived: repo.archived,
    };
}

async function searchRepos(query: string, perPage = 30): Promise<SearchResult[]> {
    const octokit = getOctokit();
    const { data } = await octokit.rest.search.repos({
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: perPage,
    });
    return data.items.map((item) => mapSearchItem(item as unknown as Record<string, unknown>));
}

function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
}

/**
 * 今日候选：昨天之后创建，按 stars 排序，30 条
 * 用于补充新项目发现，不直接决定前端“今日热门”榜单。
 */
export async function searchTodayTrending(): Promise<SearchResult[]> {
    return searchRepos(`created:>${daysAgo(1)} stars:>10`, 30);
}

/**
 * 本周热门：7 天内创建，按 stars 排序，30 条
 */
export async function searchWeekTrending(): Promise<SearchResult[]> {
    return searchRepos(`created:>${daysAgo(7)} stars:>20`, 30);
}

/**
 * 本周新星候选：3 个月内创建，stars > 100，50 条
 */
export async function searchNewStars(): Promise<SearchResult[]> {
    return searchRepos(`created:>${daysAgo(90)} stars:>100`, 50);
}

/**
 * 经典项目：stars > 10000，50 条
 */
export async function searchClassicProjects(): Promise<SearchResult[]> {
    return searchRepos('stars:>10000', 50);
}

// ── 单项目详情 ──────────────────────────────────

/**
 * 获取单个项目的详细 stats
 */
export async function fetchRepoStats(fullName: string): Promise<Partial<ProjectStats>> {
    const octokit = getOctokit();
    const [owner, repo] = fullName.split('/');

    const { data } = await octokit.rest.repos.get({ owner, repo });

    // 尝试获取 closed issues 数量（可能失败）
    let closedIssues = 0;
    try {
        const { data: closedData } = await octokit.rest.search.issuesAndPullRequests({
            q: `repo:${fullName} type:issue state:closed`,
            per_page: 1,
        });
        closedIssues = closedData.total_count;
        await sleep(500); // 避免 rate limit
    } catch {
        // 忽略错误，closedIssues 保持 0
    }

    return {
        fullName,
        stars: data.stargazers_count,
        forks: data.forks_count,
        openIssues: data.open_issues_count,
        closedIssues,
        watchers: data.subscribers_count ?? 0,
        sponsors: 0, // GitHub API 不直接提供 sponsors 数量
        pushedAt: data.pushed_at ?? '',
        updatedAt: data.updated_at ?? '',
        isArchived: data.archived,
    };
}

/**
 * 获取 README 内容（截取前 README_MAX_CHARS 字符）
 */
export async function fetchReadme(fullName: string): Promise<string> {
    const octokit = getOctokit();
    const [owner, repo] = fullName.split('/');

    try {
        const { data } = await octokit.rest.repos.getReadme({
            owner,
            repo,
            mediaType: { format: 'raw' },
        });
        const raw = typeof data === 'string' ? data : String(data);
        return truncate(raw, README_MAX_CHARS);
    } catch {
        return '';
    }
}

export type { SearchResult };
