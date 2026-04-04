import test from 'node:test';
import assert from 'node:assert/strict';

import { rankTodayTrending, resolveTodayTrending } from '../scripts/lib/rankings';
import type { ProjectStats } from '../app/lib/types';

function makeStats(overrides: Partial<ProjectStats> & Pick<ProjectStats, 'fullName'>): ProjectStats {
    const { fullName, ...rest } = overrides;
    return {
        fullName,
        stars: 0,
        forks: 0,
        openIssues: 0,
        closedIssues: 0,
        watchers: 0,
        sponsors: 0,
        pushedAt: '2026-04-04T00:00:00.000Z',
        updatedAt: '2026-04-04T00:00:00.000Z',
        todayStarsDelta: 0,
        fetchedAt: '2026-04-04T00:00:00.000Z',
        isArchived: false,
        isDead: false,
        ...rest,
    };
}

test('rankTodayTrending orders tracked projects by todayStarsDelta and filters invalid entries', () => {
    const statsByName: Record<string, ProjectStats> = {
        'openai/codex': makeStats({ fullName: 'openai/codex', stars: 1000, todayStarsDelta: 40 }),
        'vercel/next.js': makeStats({ fullName: 'vercel/next.js', stars: 2000, todayStarsDelta: 120 }),
        'badlogic/pi-telegram': makeStats({ fullName: 'badlogic/pi-telegram', stars: 300, todayStarsDelta: 0 }),
        'archived/repo': makeStats({ fullName: 'archived/repo', stars: 9999, todayStarsDelta: 999, isArchived: true }),
        'dead/repo': makeStats({ fullName: 'dead/repo', stars: 9999, todayStarsDelta: 888, isDead: true }),
    };

    assert.deepEqual(rankTodayTrending(statsByName, 10), [
        'vercel/next.js',
        'openai/codex',
    ]);
});

test('resolveTodayTrending falls back to legacy candidates when no project has positive daily growth', () => {
    const statsByName: Record<string, ProjectStats> = {
        'openai/codex': makeStats({ fullName: 'openai/codex', stars: 1000, todayStarsDelta: 0 }),
        'vercel/next.js': makeStats({ fullName: 'vercel/next.js', stars: 2000, todayStarsDelta: 0 }),
    };

    assert.deepEqual(
        resolveTodayTrending(statsByName, ['fallback/a', 'fallback/b', 'fallback/a'], 10),
        ['fallback/a', 'fallback/b'],
    );
});

test('resolveTodayTrending tops off ranked projects with fallback candidates when ranked list is shorter than limit', () => {
    const statsByName: Record<string, ProjectStats> = {
        'tracked/high-growth': makeStats({ fullName: 'tracked/high-growth', stars: 2000, todayStarsDelta: 80 }),
        'tracked/steady': makeStats({ fullName: 'tracked/steady', stars: 1500, todayStarsDelta: 10 }),
        'newly-discovered/hot': makeStats({ fullName: 'newly-discovered/hot', stars: 9999, todayStarsDelta: 0 }),
    };

    assert.deepEqual(
        resolveTodayTrending(
            statsByName,
            ['newly-discovered/hot', 'fallback/other', 'tracked/high-growth'],
            4,
        ),
        [
            'tracked/high-growth',
            'tracked/steady',
            'newly-discovered/hot',
            'fallback/other',
        ],
    );
});
