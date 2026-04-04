import type { ProjectStats } from '../../app/lib/types';

function dedupePreserveOrder(fullNames: string[]): string[] {
    return [...new Set(fullNames)];
}

export function rankTodayTrending(
    statsByName: Record<string, ProjectStats>,
    limit = 30,
): string[] {
    return Object.values(statsByName)
        .filter((stats) => stats.todayStarsDelta > 0 && !stats.isArchived && !stats.isDead)
        .sort((a, b) => {
            if (b.todayStarsDelta !== a.todayStarsDelta) {
                return b.todayStarsDelta - a.todayStarsDelta;
            }
            if (b.stars !== a.stars) {
                return b.stars - a.stars;
            }
            const pushedAtDiff = new Date(b.pushedAt || 0).getTime() - new Date(a.pushedAt || 0).getTime();
            if (pushedAtDiff !== 0) {
                return pushedAtDiff;
            }
            return a.fullName.localeCompare(b.fullName);
        })
        .slice(0, limit)
        .map((stats) => stats.fullName);
}

export function resolveTodayTrending(
    statsByName: Record<string, ProjectStats>,
    fallbackFullNames: string[],
    limit = 30,
): string[] {
    const ranked = rankTodayTrending(statsByName, limit);
    if (ranked.length >= limit) {
        return ranked;
    }

    const combined = [...ranked];
    const seen = new Set(ranked);

    for (const fullName of dedupePreserveOrder(fallbackFullNames)) {
        if (seen.has(fullName)) {
            continue;
        }
        combined.push(fullName);
        seen.add(fullName);
        if (combined.length >= limit) {
            break;
        }
    }

    return combined;
}
