# 任务计划

## Goal

完成 `T2026-04-04-01` 的修正：让“今日热门”真正按 `todayStarsDelta` 产榜，而不是沿用“1 天内新建项目”结果。

## Current Task

- Task-ID: `T2026-04-04-01`
- Task-Name: 今日热门按日增星修正
- Current Phase: 代码修正与数据刷新均已完成，等待后续决定是否提交 / 推送 / 部署

## Completed This Round

1. 复核 `today` tab 前端逻辑，确认它只消费 `snapshot.todayTrending`
2. 复核 daily 快照生成逻辑，确认 `todayTrending` 直接来自 `searchTodayTrending()` 的创建时间查询
3. 复核本地数据，确认 `oh-my-codex` 目前不在 `data/projects.json` / `data/stats.json` 中
4. 新增 `scripts/lib/rankings.ts`，封装“按日增星排序”和“无增量时回退”逻辑
5. 修改 `scripts/fetch-and-analyze.ts`，让 `todayTrending` 优先来自 `resolveTodayTrending(statsData.stats, todayTrending)`
6. 修改 `scripts/lib/github.ts` 注释，避免继续把“今日候选”误认为“今日热门”
7. 将 `searchNewStars()` 从 `25` 条扩大到 `50` 条，增加爆发项目进入候选池的概率
8. 新增 `tests/daily-rankings.test.ts`
9. 在 `/tmp` 副本以 Node 断言方式验证核心排序逻辑通过
10. 发现二级根因：首次入库热点项目虽然进入候选池，但因 `todayStarsDelta=0` 仍会被排除
11. 调整 `resolveTodayTrending()`：先保留正增量项目，再用整次抓取候选池补满榜单
12. 在 `/tmp` 副本成功执行两次 `npx tsx scripts/fetch-and-analyze.ts`
13. 确认 `data/daily/2026-04-04.json` 中 `Yeachan-Heo/oh-my-codex` 位于今日热门第 `10` 位
14. 已把刷新后的 `data/` 文件同步回工作区

## Remaining Work

1. 若要让线上站点也显示这一结果，提交 / 推送 / 部署这批代码和数据
2. 若仍有漏抓，再新增一类“活跃仓库候选”搜索源
3. 视需要为 `todayStarsDelta=0` 的首次入库项目设计更精细的近 24h 增长估算

## Error Log

1. 当前仓库路径仍会干扰 Node/ESM 测试运行，验证需要继续在 `/tmp` 副本进行
2. `/tmp` 副本里的 `tsc` 仍被仓库既有问题阻塞：
   - `scripts/lib/ai-client.ts` 缺少 `@google/genai` 类型声明
   - `scripts/lib/ai-client.ts` 里有一个 `unknown` 错误未收口
3. 第二次数据刷新期间 GitHub Search closed-issues 查询出现了大量 `403` 限流，但脚本已按预期降级继续完成

## Recommendation

当前修正已经完成到“代码 + 数据”两层，目标结果已在新快照中验证成立。后续若要同步到线上，只剩提交 / 推送 / 部署。
