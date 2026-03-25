// scripts/fetch-and-analyze.ts — 每日抓取 + 解读主脚本
// 由 GitHub Actions 每日执行：npx tsx scripts/fetch-and-analyze.ts

import {
    readJsonSafe, writeJsonSafe, dataPath, todayString, nowISO, daysBetween,
} from './lib/utils';
import {
    searchTodayTrending, searchWeekTrending, searchNewStars,
    searchClassicProjects, fetchRepoStats, type SearchResult,
} from './lib/github';
import { fetchReadmeWithCache } from './lib/readme-cache';
import { analyzeProject, selectHighlights, geminiSleep } from './lib/ai-client';
import { HEALTH_CHECK_DAYS, DEAD_COMMIT_DAYS, DEAD_ISSUE_RATIO } from '../app/lib/config';
import type {
    Project, ProjectStats, ProjectsJson, StatsJson,
    DailySnapshot, RunLog, RunError, Highlight,
} from '../app/lib/types';

// ── 辅助函数 ─────────────────────────────────────

function loadProjects(): ProjectsJson {
    return readJsonSafe<ProjectsJson>(dataPath('projects.json'))
        ?? { version: '1', updatedAt: '', projects: [] };
}

function loadStats(): StatsJson {
    return readJsonSafe<StatsJson>(dataPath('stats.json'))
        ?? { version: '1', updatedAt: '', stats: {} };
}

function appendProject(project: Project): void {
    const data = loadProjects();
    if (data.projects.some((p) => p.fullName === project.fullName)) return;
    data.projects.push(project);
    data.updatedAt = nowISO();
    writeJsonSafe(dataPath('projects.json'), data);
}

function saveStats(stats: StatsJson): void {
    stats.updatedAt = nowISO();
    writeJsonSafe(dataPath('stats.json'), stats);
}

// ── 健康度检测 ───────────────────────────────────

function checkDead(stats: ProjectStats): boolean {
    if (!stats.pushedAt) return false;
    const daysSincePush = daysBetween(stats.pushedAt, todayString());
    if (daysSincePush > DEAD_COMMIT_DAYS) return true;
    if (stats.closedIssues > 0 && stats.openIssues / stats.closedIssues > DEAD_ISSUE_RATIO) return true;
    return false;
}

// ── 主流程 ───────────────────────────────────────

async function main(): Promise<void> {
    const startTime = Date.now();
    const errors: RunError[] = [];
    const log: Partial<RunLog> = {
        version: '1',
        date: todayString(),
        startedAt: nowISO(),
        stats: { fetched: 0, newProjects: 0, skipped: 0, geminiCalls: 0, statsUpdated: 0 },
    };

    console.log(`[${todayString()}] 开始每日抓取与解读...`);

    const projectsData = loadProjects();
    const statsData = loadStats();
    const existingSet = new Set(projectsData.projects.map((p) => p.fullName));
    const isFirstRun = projectsData.projects.length === 0;

    // ── Step 1: 抓取项目列表 ────────────────────────

    let allResults: SearchResult[] = [];
    const todayTrending: string[] = [];
    const weekTrending: string[] = [];
    const newStars: string[] = [];

    try {
        if (isFirstRun) {
            console.log('[Step 1] 首次运行：抓取经典项目 50 个');
            allResults = await searchClassicProjects();
        } else {
            console.log('[Step 1] 增量运行：抓取 4 个榜单');
            const [today, week, newS, classicList] = await Promise.all([
                searchTodayTrending(),
                searchWeekTrending(),
                searchNewStars(),
                searchClassicProjects(),
            ]);
            // 记录每个来源的 fullName
            const todaySet = new Set(today.map((r) => r.fullName));
            const weekSet = new Set(week.map((r) => r.fullName));
            const newStarsSet = new Set(newS.map((r) => r.fullName));
            // 去重合并
            const seen = new Set<string>();
            for (const list of [today, week, newS, classicList]) {
                for (const r of list) {
                    if (!seen.has(r.fullName)) {
                        seen.add(r.fullName);
                        allResults.push(r);
                    }
                }
            }
            // 预填充榜单列表（来源追踪）
            for (const fn of todaySet) todayTrending.push(fn);
            for (const fn of weekSet) weekTrending.push(fn);
            for (const fn of newStarsSet) newStars.push(fn);
        }
        log.stats!.fetched = allResults.length;
        console.log(`[Step 1] 共抓取 ${allResults.length} 个项目`);
    } catch (err) {
        errors.push({
            time: nowISO(), level: 'fatal', stage: 'github_fetch',
            message: String(err), retries: 0, skipped: false,
        });
        console.error('[FATAL] GitHub 抓取失败', err);
    }

    // ── Step 2: 逐个处理 ───────────────────────────

    const vibeCoding: string[] = [];
    const classic: string[] = [];
    const newProjectsForHighlights: Array<{
        fullName: string; positioning: string; stars: number; todayDelta: number;
    }> = [];

    for (const result of allResults) {
        const { fullName } = result;
        const isNew = !existingSet.has(fullName);

        // 分类到经典榜单
        if (result.stars > 10000) classic.push(fullName);

        try {
            // 更新 stats
            const partialStats = await fetchRepoStats(fullName);
            const prevStats = statsData.stats[fullName];
            const todayDelta = prevStats
                ? Math.max(0, (partialStats.stars ?? 0) - prevStats.stars)
                : 0;

            const fullStats: ProjectStats = {
                fullName,
                stars: partialStats.stars ?? 0,
                forks: partialStats.forks ?? 0,
                openIssues: partialStats.openIssues ?? 0,
                closedIssues: partialStats.closedIssues ?? 0,
                watchers: partialStats.watchers ?? 0,
                sponsors: partialStats.sponsors ?? 0,
                pushedAt: partialStats.pushedAt ?? '',
                updatedAt: partialStats.updatedAt ?? '',
                todayStarsDelta: todayDelta,
                fetchedAt: nowISO(),
                isArchived: partialStats.isArchived ?? false,
                isDead: false,
            };

            statsData.stats[fullName] = fullStats;
            log.stats!.statsUpdated++;

            if (isNew) {
                // 新项目：抓 README → 调 Gemini → 写入
                console.log(`[New] ${fullName} — 调用 Gemini 解读...`);

                let readme = '';
                try {
                    readme = await fetchReadmeWithCache(fullName);
                } catch (err) {
                    errors.push({
                        time: nowISO(), level: 'warn', project: fullName, stage: 'readme_fetch',
                        message: String(err), retries: 0, skipped: false,
                    });
                }

                const analysis = await analyzeProject({
                    fullName,
                    description: result.description,
                    stars: result.stars,
                    language: result.language,
                    topics: result.topics,
                    license: result.license,
                    openIssues: result.openIssues,
                    closedIssues: fullStats.closedIssues,
                    readme,
                });

                log.stats!.geminiCalls++;

                if (analysis) {
                    const project: Project = {
                        owner: result.owner,
                        repo: result.repo,
                        fullName,
                        description: result.description,
                        language: result.language,
                        topics: result.topics,
                        license: result.license,
                        createdAt: result.createdAt,
                        url: result.url,
                        analysis,
                        analyzedAt: nowISO(),
                    };
                    appendProject(project);
                    existingSet.add(fullName);
                    log.stats!.newProjects++;

                    if (analysis.isVibeCoding) vibeCoding.push(fullName);

                    newProjectsForHighlights.push({
                        fullName,
                        positioning: analysis.positioning,
                        stars: result.stars,
                        todayDelta,
                    });
                } else {
                    errors.push({
                        time: nowISO(), level: 'warn', project: fullName, stage: 'gemini_call',
                        message: 'Gemini 解读失败或校验不通过', retries: 0, skipped: true,
                    });
                    log.stats!.skipped++;
                }

                await geminiSleep();
            } else {
                // 已有项目：只更新 stats
                log.stats!.skipped++;

                // 检查 stars 变化 > 50% 的项目是否需要重新解读
                if (prevStats && prevStats.stars > 0) {
                    const change = Math.abs(fullStats.stars - prevStats.stars) / prevStats.stars;
                    if (change > 0.5) {
                        console.log(`[Re-analyze] ${fullName}: stars 变化 ${(change * 100).toFixed(0)}%`);
                        // TODO: 重新解读逻辑（与新项目类似，但替换而非 append）
                    }
                }

                // 已有项目也加入 vibeCoding 列表
                const existing = projectsData.projects.find((p) => p.fullName === fullName);
                if (existing?.analysis.isVibeCoding) vibeCoding.push(fullName);
            }
        } catch (err) {
            errors.push({
                time: nowISO(), level: 'error', project: fullName, stage: 'github_fetch',
                message: String(err), retries: 0, skipped: true,
            });
        }
    }

    // ── Step 3: 健康度检查 ─────────────────────────

    console.log('[Step 3] 健康度检查...');
    const updatedProjects = loadProjects();
    for (const project of updatedProjects.projects) {
        const stats = statsData.stats[project.fullName];
        if (!stats) continue;

        const daysSinceAnalysis = daysBetween(project.analyzedAt, todayString());
        if (daysSinceAnalysis >= HEALTH_CHECK_DAYS) {
            const isDead = checkDead(stats);
            if (isDead && !stats.isDead) {
                stats.isDead = true;
                stats.deadDetectedAt = todayString();
                console.log(`[Dead] ${project.fullName}: 标记为不活跃`);
            }
        }
    }

    // ── Step 4: 今日亮点 ──────────────────────────

    let highlights: Highlight[] = [];
    if (newProjectsForHighlights.length > 0) {
        console.log('[Step 4] 生成今日亮点...');
        highlights = await selectHighlights(newProjectsForHighlights);
    }

    // ── Step 5: 保存日志和快照 ─────────────────────

    // 保存 stats
    saveStats(statsData);

    // 生成 daily 快照
    const snapshot: DailySnapshot = {
        date: todayString(),
        todayTrending: [...new Set(todayTrending)],
        weekTrending: [...new Set(weekTrending)],
        newStars: [...new Set(newStars)],
        vibeCoding: [...new Set(vibeCoding)],
        classic: [...new Set(classic)],
        highlights,
    };
    writeJsonSafe(dataPath('daily', `${todayString()}.json`), snapshot);

    // 写日志
    const finishTime = Date.now();
    const runLog: RunLog = {
        version: '1',
        date: todayString(),
        startedAt: log.startedAt!,
        finishedAt: nowISO(),
        durationSeconds: Math.round((finishTime - startTime) / 1000),
        success: errors.filter((e) => e.level === 'fatal').length === 0,
        stats: log.stats!,
        errors,
    };
    writeJsonSafe(dataPath('logs', `${todayString()}.json`), runLog);

    console.log(`[完成] 耗时 ${runLog.durationSeconds}s，新增 ${runLog.stats.newProjects} 个，跳过 ${runLog.stats.skipped} 个，错误 ${errors.length} 个`);

    // 错误超阈值提示
    if (errors.filter((e) => e.level === 'fatal').length > 0) {
        console.error('[ALERT] 存在 fatal 错误，请检查日志');
        process.exit(1);
    }
}

main().catch((err) => {
    console.error('[FATAL] 脚本异常退出', err);
    process.exit(1);
});
