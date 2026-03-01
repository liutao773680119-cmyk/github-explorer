// app/lib/data.ts — 数据合并 + 前端筛选/排序工具

import type {
    ProjectsJson, StatsJson, ProjectWithStats, ProjectStats,
    TabId, SortKey, DailySnapshot,
} from './types';

// ── 默认 Stats ──────────────────────────────────

function defaultStats(fullName: string): ProjectStats {
    return {
        fullName,
        stars: 0,
        forks: 0,
        openIssues: 0,
        closedIssues: 0,
        watchers: 0,
        sponsors: 0,
        pushedAt: '',
        updatedAt: '',
        todayStarsDelta: 0,
        fetchedAt: '',
        isArchived: false,
        isDead: false,
    };
}

// ── 合并 projects + stats → ProjectWithStats[] ──

export function mergeData(
    projectsJson: ProjectsJson,
    statsJson: StatsJson,
    favorites: string[],
    readList: string[],
): ProjectWithStats[] {
    const favSet = new Set(favorites);
    const readSet = new Set(readList);
    const today = new Date().toISOString().slice(0, 10);

    return projectsJson.projects.map((project) => {
        const stats = statsJson.stats[project.fullName] ?? defaultStats(project.fullName);
        return {
            ...project,
            stats,
            isFavorite: favSet.has(project.fullName),
            isRead: readSet.has(project.fullName),
            isNew: project.analyzedAt.slice(0, 10) === today,
        };
    });
}

// ── Tab 筛选 ─────────────────────────────────────

export function filterByTab(
    all: ProjectWithStats[],
    tab: TabId,
    snapshot: DailySnapshot | null,
): ProjectWithStats[] {
    switch (tab) {
        case 'today': {
            if (!snapshot) return [];
            const set = new Set(snapshot.todayTrending);
            return all.filter((p) => set.has(p.fullName));
        }
        case 'week': {
            if (!snapshot) return [];
            const set = new Set(snapshot.weekTrending);
            return all.filter((p) => set.has(p.fullName));
        }
        case 'newStars': {
            if (!snapshot) return [];
            const set = new Set(snapshot.newStars);
            return all.filter((p) => set.has(p.fullName));
        }
        case 'vibeCoding':
            return all.filter((p) => p.analysis.isVibeCoding);
        case 'classic':
            return all.filter((p) => p.stats.stars > 10000);
        case 'favorites':
            return all.filter((p) => p.isFavorite);
        default:
            return all;
    }
}

// ── 排序 ─────────────────────────────────────────

export function sortProjects(list: ProjectWithStats[], key: SortKey): ProjectWithStats[] {
    const sorted = [...list];
    sorted.sort((a, b) => {
        switch (key) {
            case 'stars':
                return b.stats.stars - a.stats.stars;
            case 'todayStarsDelta':
                return b.stats.todayStarsDelta - a.stats.todayStarsDelta;
            case 'createdAt':
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case 'pushedAt':
                return new Date(b.stats.pushedAt || 0).getTime() - new Date(a.stats.pushedAt || 0).getTime();
            case 'vibeCodingScore':
                return b.analysis.vibeCodingScore - a.analysis.vibeCodingScore;
            default:
                return 0;
        }
    });
    return sorted;
}

// ── 搜索 ─────────────────────────────────────────

export function searchProjects(all: ProjectWithStats[], query: string): ProjectWithStats[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return all.filter((p) => {
        return (
            p.fullName.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.analysis.positioning.toLowerCase().includes(q) ||
            p.analysis.useCases.join(' ').toLowerCase().includes(q) ||
            p.analysis.category.toLowerCase().includes(q)
        );
    });
}

// ── 数据新鲜度检查 ───────────────────────────────

export function isDataStale(updatedAt: string, staleHours: number): boolean {
    if (!updatedAt) return true;
    const diff = Date.now() - new Date(updatedAt).getTime();
    return diff > staleHours * 60 * 60 * 1000;
}
