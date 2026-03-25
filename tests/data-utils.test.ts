import test from 'node:test';
import assert from 'node:assert/strict';

import {
    mergeData,
    filterByTab,
    sortProjects,
    searchProjects,
    isDataStale,
} from '../app/lib/data';
import type {
    DailySnapshot,
    ProjectAnalysis,
    ProjectsJson,
    StatsJson,
} from '../app/lib/types';

function makeAnalysis(overrides: Partial<ProjectAnalysis> = {}): ProjectAnalysis {
    return {
        positioning: 'AI coding workflow helper',
        useCases: ['discover repos', 'review tooling'],
        audience: 'developers',
        quickStart: { prerequisites: null, steps: ['install'], note: null },
        competitors: [],
        pricing: 'free',
        vibeCodingScore: 70,
        vibeCodingReason: 'useful for fast iteration',
        isVibeCoding: true,
        communityActivity: 'active',
        category: 'AI编程助手',
        ...overrides,
    };
}

function makeProjectsJson(): ProjectsJson {
    return {
        version: '1',
        updatedAt: '2026-03-25T08:00:00.000Z',
        projects: [
            {
                owner: 'openai',
                repo: 'codex',
                fullName: 'openai/codex',
                description: 'Coding agent',
                language: 'TypeScript',
                topics: ['ai', 'agent'],
                license: 'MIT',
                createdAt: '2026-03-20T00:00:00.000Z',
                url: 'https://github.com/openai/codex',
                analysis: makeAnalysis(),
                analyzedAt: '2026-03-25T01:00:00.000Z',
            },
            {
                owner: 'vercel',
                repo: 'next.js',
                fullName: 'vercel/next.js',
                description: 'React framework',
                language: 'TypeScript',
                topics: ['react', 'framework'],
                license: 'MIT',
                createdAt: '2025-01-01T00:00:00.000Z',
                url: 'https://github.com/vercel/next.js',
                analysis: makeAnalysis({
                    positioning: 'Framework for web apps',
                    useCases: ['frontend apps'],
                    category: '前端框架',
                    vibeCodingScore: 40,
                    isVibeCoding: false,
                }),
                analyzedAt: '2026-03-10T01:00:00.000Z',
            },
        ],
    };
}

function makeStatsJson(): StatsJson {
    return {
        version: '1',
        updatedAt: '2026-03-25T08:00:00.000Z',
        stats: {
            'openai/codex': {
                fullName: 'openai/codex',
                stars: 1000,
                forks: 100,
                openIssues: 10,
                closedIssues: 40,
                watchers: 50,
                sponsors: 0,
                pushedAt: '2026-03-25T05:00:00.000Z',
                updatedAt: '2026-03-25T05:00:00.000Z',
                todayStarsDelta: 80,
                fetchedAt: '2026-03-25T08:00:00.000Z',
                isArchived: false,
                isDead: false,
            },
            'vercel/next.js': {
                fullName: 'vercel/next.js',
                stars: 200,
                forks: 20,
                openIssues: 5,
                closedIssues: 50,
                watchers: 30,
                sponsors: 0,
                pushedAt: '2026-03-24T05:00:00.000Z',
                updatedAt: '2026-03-24T05:00:00.000Z',
                todayStarsDelta: 10,
                fetchedAt: '2026-03-25T08:00:00.000Z',
                isArchived: false,
                isDead: false,
            },
        },
    };
}

function makeSnapshot(): DailySnapshot {
    return {
        date: '2026-03-25',
        todayTrending: ['openai/codex'],
        weekTrending: ['vercel/next.js'],
        newStars: ['openai/codex'],
        vibeCoding: ['openai/codex'],
        classic: ['openai/codex'],
        highlights: [],
    };
}

test('mergeData attaches stats and local flags', () => {
    const merged = mergeData(
        makeProjectsJson(),
        makeStatsJson(),
        ['openai/codex'],
        ['vercel/next.js'],
    );

    assert.equal(merged.length, 2);
    assert.equal(merged[0].stats.stars, 1000);
    assert.equal(merged[0].isFavorite, true);
    assert.equal(merged[1].isRead, true);
});

test('filterByTab returns snapshot-backed and derived views', () => {
    const allProjects = mergeData(makeProjectsJson(), makeStatsJson(), [], []);
    const snapshot = makeSnapshot();

    assert.deepEqual(
        filterByTab(allProjects, 'today', snapshot).map((project) => project.fullName),
        ['openai/codex'],
    );
    assert.deepEqual(
        filterByTab(allProjects, 'week', snapshot).map((project) => project.fullName),
        ['vercel/next.js'],
    );
    assert.deepEqual(
        filterByTab(allProjects, 'vibeCoding', snapshot).map((project) => project.fullName),
        ['openai/codex'],
    );
});

test('sortProjects orders by selected key', () => {
    const allProjects = mergeData(makeProjectsJson(), makeStatsJson(), [], []);

    assert.deepEqual(
        sortProjects(allProjects, 'stars').map((project) => project.fullName),
        ['openai/codex', 'vercel/next.js'],
    );
    assert.deepEqual(
        sortProjects(allProjects, 'vibeCodingScore').map((project) => project.fullName),
        ['openai/codex', 'vercel/next.js'],
    );
});

test('searchProjects matches across description and analysis fields', () => {
    const allProjects = mergeData(makeProjectsJson(), makeStatsJson(), [], []);

    assert.deepEqual(
        searchProjects(allProjects, 'framework').map((project) => project.fullName),
        ['vercel/next.js'],
    );
    assert.deepEqual(
        searchProjects(allProjects, 'review tooling').map((project) => project.fullName),
        ['openai/codex'],
    );
});

test('isDataStale respects empty and recent timestamps', () => {
    assert.equal(isDataStale('', 25), true);
    assert.equal(isDataStale(new Date().toISOString(), 25), false);
});
