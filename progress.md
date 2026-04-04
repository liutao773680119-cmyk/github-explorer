# Progress Log

## Latest Handoff Snapshot

- Timestamp: 2026-04-04 06:25
- Task-ID: T2026-04-04-01
- Task-Name: 今日热门按日增星修正
- Active Goal: 修正“今日热门”标签与实际数据逻辑不一致的问题，让榜单优先按 `todayStarsDelta` 生成
- Completed This Session:
   1. 已定位根因：
      - 前端 `today` tab 只读 `snapshot.todayTrending`
      - `snapshot.todayTrending` 实际来自“1 天内新建项目”搜索集合，而不是日增星排序
   2. 已确认 `oh-my-codex` 当前不在本地 `projects/stats` 数据中，因此旧逻辑下无论星增多少都不会显示
   3. 已新增 [`rankings.ts`](/Users/lt/Desktop/codex\ share/项目文件/GitHub热门项目解析/scripts/lib/rankings.ts)，实现：
      - `rankTodayTrending`
      - `resolveTodayTrending`
   4. 已修改 [`fetch-and-analyze.ts`](/Users/lt/Desktop/codex\ share/项目文件/GitHub热门项目解析/scripts/fetch-and-analyze.ts)，让 daily 快照的 `todayTrending` 优先按 `todayStarsDelta` 生成
   5. 已修改 [`github.ts`](/Users/lt/Desktop/codex\ share/项目文件/GitHub热门项目解析/scripts/lib/github.ts)，澄清“今日候选”只是发现新项目来源，并将 `searchNewStars()` 扩大到 `50` 条
   6. 已新增 [`daily-rankings.test.ts`](/Users/lt/Desktop/codex\ share/项目文件/GitHub热门项目解析/tests/daily-rankings.test.ts) 覆盖：
      - 日增星排序
      - 无增量时回退旧候选列表
   7. 已在 `/tmp/github-explorer-debug-20260404` 验证核心逻辑：
      - 自定义 Node 断言脚本输出 `rankings ok`
   8. 已进一步修正补榜逻辑：
      - 当有正增量项目时，不再直接截断返回
      - 改为继续用本次抓取的完整候选池补满 30 个位置，覆盖首次入库热点项目
   9. 已在 `/tmp/github-explorer-debug-20260404` 实际执行两次 `npx tsx scripts/fetch-and-analyze.ts`
   10. 已将生成结果同步回工作区，确认：
      - `data/daily/2026-04-04.json` 已生成
      - `Yeachan-Heo/oh-my-codex` 已进入今日热门第 `10` 位
- Files Changed:
   - `scripts/fetch-and-analyze.ts`
   - `scripts/lib/github.ts`
   - `scripts/lib/rankings.ts`
   - `tests/daily-rankings.test.ts`
   - `data/cache/readme-cache.json`
   - `data/projects.json`
   - `data/stats.json`
   - `data/daily/2026-04-04.json`
   - `data/logs/2026-04-04.json`
   - `task_registry.md`
   - `progress.md`
   - `task_plan.md`
   - `findings.md`
   - `修改记录_会话备忘.md`
- Open TODO:
   1. 如需让线上页面立即反映结果，还需要提交 / 推送 / 部署这批改动与数据
   2. 若要更快发现爆发项目，可继续扩大候选池或增加专门的“活跃项目”搜索源
- Risks/Blockers:
   1. 当前本地数据已更新，但线上页面是否立刻变化取决于是否部署到了当前访问的站点
   2. 仓库在当前环境下仍有既有验证问题：
      - 工作区路径带反斜杠，Node/ESM 运行易炸
      - `scripts/lib/ai-client.ts` 在 `/tmp` 副本下仍有既有 `tsc` 报错
- Next First Command: `git diff -- scripts/fetch-and-analyze.ts scripts/lib/github.ts scripts/lib/rankings.ts tests/daily-rankings.test.ts data/projects.json data/stats.json data/daily/2026-04-04.json data/logs/2026-04-04.json`

### Previous Snapshot
- Timestamp: 2026-04-03 07:20
- Task-ID: T2026-04-03-01
- Task-Name: GitHub 后台运行状态巡检
- Active Goal: 确认 GitHub 仓库、Actions 和最近运行是否正常，并识别当前线上风险
- Completed This Session:
   1. 已完成接手文件读取与启动检查，确认 `gh auth status` 正常，`node -v = v23.11.0`，`npm -v = 10.9.2`
   2. 已在线确认仓库可访问，且 `CI`、`Daily Update`、`Re-analyze Project` 三个 workflow 均为 `active`
   3. 已确认 `Daily Update` 最近 5 次全部成功，最新成功 run 为 `23933432016`
   4. 已确认 `main` 最近连续写回 `data: daily update 2026-04-03/04-02/04-01/03-31`
   5. 已定位失败手动重跑 `23883804316` 的原因：`[FATAL] 项目 openai/codex 不在 projects.json 中`
   6. 已识别当前主要风险为 GitHub Actions `Node.js 20` 弃用告警
- Files Changed:
   - `task_registry.md`
   - `progress.md`
   - `task_plan.md`
   - `findings.md`
   - `修改记录_会话备忘.md`
- Open TODO:
   1. 升级仍依赖 Node 20 的 GitHub Actions
   2. 为 `re-analyze` 增加更明确的输入校验或提示
   3. 如需让自动数据提交也经过 CI，单独设计触发与鉴权方案
- Risks/Blockers:
   1. 当前无主线运行故障，但存在 Node 20 弃用风险
   2. `Re-analyze Project` 对不在 `projects.json` 的项目会直接失败
   3. 主工作区仍是脏工作树
- Next First Command: `gh run list --repo liutao773680119-cmyk/github-explorer --limit 10`
- Timestamp: 2026-04-02 06:43
- Task-ID: T2026-04-01-01
- Task-Name: Gemini API 替换可行性评估
- Active Goal: 继续收口最小 PR 分支 `t2026-04-02-pr`，补齐代码复审修复并保持远端分支可直接开 PR
- Completed This Session:
  1. 已完成一轮代码复审，确认旧问题主要集中在：
     - 3 个契约测试未被 `npm test` 覆盖
     - `RunLog` 类型与仓库内历史日志 schema 漂移
     - README 本地示例与最终默认策略口径不一致
  2. 已将 3 个契约测试从 `.mjs` 改为标准 `*.test.ts`：
     - `tests/default-provider-contract.test.ts`
     - `tests/ai-provider-naming-contract.test.ts`
     - `tests/deepseek-fallback-file-contract.test.ts`
  3. 已新增 `tests/run-log-legacy-compat.test.ts`，把历史日志兼容性变成显式约束
  4. 已在 `app/lib/types.ts` 中补齐历史日志兼容：
     - `RunErrorStage` 兼容 `gemini_call`
     - `RunLogStats` 兼容 `geminiCalls`
  5. 已调整 `scripts/fetch-and-analyze.ts`，避免 `aiCalls` 可选后自增报错
  6. 已修正文档口径：
     - README 本地示例默认改回 `deepseek`
     - 明确“日更默认 deepseek，手动 re-analyze 默认 vertex-gemini”
  7. 已清理 `scripts/lib/ai.ts` 未使用导入 lint warning
  8. 已在 `.worktrees/t2026-04-02-pr` 生成并推送新提交：
     - `12bbf52 fix: cover provider contracts and legacy run logs`
  9. 已在 `/tmp/github-explorer-pr-check` 无反斜杠副本完成本轮新鲜验证：
     - `npm test`
     - `npm run lint`
     - `./node_modules/.bin/tsc -p tsconfig.json --noEmit`
- Files Changed:
  - `.worktrees/t2026-04-02-pr/README.md`
  - `.worktrees/t2026-04-02-pr/app/lib/types.ts`
  - `.worktrees/t2026-04-02-pr/scripts/fetch-and-analyze.ts`
  - `.worktrees/t2026-04-02-pr/scripts/lib/ai.ts`
  - `.worktrees/t2026-04-02-pr/tests/ai-provider-naming-contract.test.ts`
  - `.worktrees/t2026-04-02-pr/tests/deepseek-fallback-file-contract.test.ts`
  - `.worktrees/t2026-04-02-pr/tests/default-provider-contract.test.ts`
  - `.worktrees/t2026-04-02-pr/tests/run-log-legacy-compat.test.ts`
  - `progress.md`
  - `task_registry.md`
  - `task_plan.md`
  - `findings.md`
  - `修改记录_会话备忘.md`
- Open TODO:
  1. 从 `t2026-04-02-pr` 正式开 PR
  2. 在 PR 描述中说明本轮复审修复点：
     - 契约测试已进入标准 `npm test`
     - 历史日志 schema 已做类型兼容
     - README 口径已与默认策略对齐
  3. 视需要决定是否保留 `vertex-gemini-provider` 仅作历史验收分支
- Risks/Blockers:
  1. 主工作区仍然很脏，后续所有实现或 PR 操作都应继续在 `.worktrees/t2026-04-02-pr` 中进行
  2. `vertex-gemini-provider` 仍然存在，但它是过大的历史验证分支，不应再作为合并基线
  3. 原始仓库路径包含反斜杠，Node/TS 验证仍需使用 `/tmp` 无反斜杠副本或等效绕行
- Next First Command: `open https://github.com/liutao773680119-cmyk/github-explorer/pull/new/t2026-04-02-pr`

## Session Notes

- `vertex-gemini` 代码接入已完成，当前主要是 GitHub 仓库侧配置问题，不是代码问题。
- GitHub 仓库 Secret / Variable 已由用户补齐，当前主要问题已从“配置缺失”切换为“如何收敛到 PR / 并回 `main`”。
- `git diff --ignore-cr-at-eol --shortstat` 已确认真实语义改动仅 `16` 个文件，其余大多是换行噪音。
- `vertex-gemini` 功能改动已单独提交为 `8bdb9e3 feat: add vertex gemini provider`。
- GitHub 认证链路已恢复为可复用的 `gh` 登录态，且 `vertex-gemini-provider` 分支已推送到远端。
- `vertex-gemini-provider` 分支上的第二次线上 `Re-analyze Project` 已成功，证明 Vertex 文本分析链路在 GitHub Actions 中可用。
- 成功 run 实际写回的是 `vercel/next.js` 的 README 缓存、分析结果和 stats，不是空跑。
- “默认 provider 只动手动重跑入口”的策略现已进入远端 `vertex-gemini-provider` 分支，对应提交 `bff54c7`。
- 当前主要剩余问题不再是功能可用性，而是如何把这批改动并回 `main`。
- 首次线上试跑已证明 Vertex 鉴权链路是通的，当前失败与 Gemini/Vertex 无关，而是 `re-analyze` 脚本只支持重跑 `projects.json` 中已有项目。
- 关键 Git 事实：
  - 本地 `HEAD`：`8bdb9e3`
  - 远端 `origin/main`：`d72c4d4`
  - 远端测试分支：`vertex-gemini-provider -> bff54c7`
- 关键 GitHub 页面入口：
  - Actions：`https://github.com/liutao773680119-cmyk/github-explorer/actions/workflows/re-analyze.yml`
  - PR：`https://github.com/liutao773680119-cmyk/github-explorer/pull/new/vertex-gemini-provider`
- 已确定的默认切换策略：
  - 手动重跑默认值：可切到 `vertex-gemini`
  - 定时日更默认值：暂不切，继续 `deepseek`
  - 应用代码默认值：暂不切，继续 `deepseek`
- 当前默认自动任务仍是 `deepseek`：
  - `.github/workflows/daily-update.yml` 固定 `AI_PROVIDER: deepseek`
  - `app/lib/config.ts` 中 `DEFAULT_AI_PROVIDER = deepseek`
- `vertex-gemini` 走 ADC，不读取本地 txt API key 文件。
- 当前本机 `gh auth status` 已恢复为有效登录态，scope 包含 `repo` 与 `workflow`。
- 官方侧信息：Codex 确有 GitHub 连接/集成能力，但当前本地工作流未暴露 repo Secret 管理入口。
