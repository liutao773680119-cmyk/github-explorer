// scripts/re-analyze.ts — 单项目重新解读脚本
// 由 GitHub Actions workflow_dispatch 触发：npx tsx scripts/re-analyze.ts <fullName>

import { readJsonSafe, writeJsonSafe, dataPath, nowISO } from './lib/utils';
import { fetchRepoStats } from './lib/github';
import { fetchReadmeWithCache } from './lib/readme-cache';
import { analyzeProject, aiSleep } from './lib/ai-client';
import type { ProjectsJson, StatsJson } from '../app/lib/types';

async function main(): Promise<void> {
    const fullName = process.argv[2];

    if (!fullName || !fullName.includes('/')) {
        console.error('用法: npx tsx scripts/re-analyze.ts <owner/repo>');
        process.exit(1);
    }

    console.log(`[Re-analyze] 开始重新解读: ${fullName}`);

    // 1. 读取当前数据
    const projectsData = readJsonSafe<ProjectsJson>(dataPath('projects.json'));
    if (!projectsData) {
        console.error('[FATAL] 无法读取 projects.json');
        process.exit(1);
    }

    const projectIndex = projectsData.projects.findIndex((p) => p.fullName === fullName);
    if (projectIndex === -1) {
        console.error(`[FATAL] 项目 ${fullName} 不在 projects.json 中`);
        process.exit(1);
    }

    const project = projectsData.projects[projectIndex];

    // 2. 重新抓取 stats + README
    console.log('[Step 1] 抓取最新 stats...');
    const partialStats = await fetchRepoStats(fullName);

    console.log('[Step 2] 抓取 README...');
    const readme = await fetchReadmeWithCache(fullName);

    // 3. 重新调用当前 AI provider
    console.log(`[Step 3] 调用 ${process.env.AI_PROVIDER?.trim() || 'default AI provider'} 重新解读...`);
    const analysis = await analyzeProject({
        fullName,
        description: project.description,
        stars: partialStats.stars ?? 0,
        language: project.language,
        topics: project.topics,
        license: project.license,
        openIssues: partialStats.openIssues ?? 0,
        closedIssues: partialStats.closedIssues ?? 0,
        readme,
    });

    if (!analysis) {
        console.error('[FATAL] AI 重新解读失败');
        process.exit(1);
    }

    // 4. 覆盖写回
    projectsData.projects[projectIndex] = {
        ...project,
        analysis,
        analyzedAt: nowISO(),
    };
    projectsData.updatedAt = nowISO();
    writeJsonSafe(dataPath('projects.json'), projectsData);

    // 5. 更新 stats
    const statsData = readJsonSafe<StatsJson>(dataPath('stats.json'))
        ?? { version: '1', updatedAt: '', stats: {} };
    const prevStats = statsData.stats[fullName];
    statsData.stats[fullName] = {
        fullName,
        stars: partialStats.stars ?? 0,
        forks: partialStats.forks ?? 0,
        openIssues: partialStats.openIssues ?? 0,
        closedIssues: partialStats.closedIssues ?? 0,
        watchers: partialStats.watchers ?? 0,
        sponsors: partialStats.sponsors ?? 0,
        pushedAt: partialStats.pushedAt ?? '',
        updatedAt: partialStats.updatedAt ?? '',
        todayStarsDelta: prevStats
            ? Math.max(0, (partialStats.stars ?? 0) - prevStats.stars)
            : 0,
        fetchedAt: nowISO(),
        isArchived: partialStats.isArchived ?? false,
        isDead: false,
    };
    statsData.updatedAt = nowISO();
    writeJsonSafe(dataPath('stats.json'), statsData);

    await aiSleep(); // 确保不超 rate limit

    console.log(`[完成] ${fullName} 已重新解读并写入`);
}

main().catch((err) => {
    console.error('[FATAL] 重新解读脚本异常', err);
    process.exit(1);
});
