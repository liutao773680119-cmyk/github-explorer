# Findings

## 当前任务

- Task-ID: `T2026-04-04-01`
- Task-Name: 今日热门按日增星修正

## 本轮新增结论（2026-04-04）

1. `今日热门` 缺少 `oh-my-codex` 的直接原因不是前端排序，而是 daily 快照的 `todayTrending` 生成逻辑本身就错了。
2. 前端 `today` tab 只读取 `snapshot.todayTrending`：
   - [`app/lib/data.ts:60`](/Users/lt/Desktop/codex\ share/项目文件/GitHub热门项目解析/app/lib/data.ts#L60)
   - [`app/lib/data.ts:62`](/Users/lt/Desktop/codex\ share/项目文件/GitHub热门项目解析/app/lib/data.ts#L62)
3. 旧版抓取脚本把 `todayTrending` 直接等同于“1 天内新创建仓库”的搜索结果：
   - [`scripts/lib/github.ts:93`](/Users/lt/Desktop/codex\ share/项目文件/GitHub热门项目解析/scripts/lib/github.ts#L93)
   - [`scripts/lib/github.ts:95`](/Users/lt/Desktop/codex\ share/项目文件/GitHub热门项目解析/scripts/lib/github.ts#L95)
   - [`scripts/lib/github.ts:96`](/Users/lt/Desktop/codex\ share/项目文件/GitHub热门项目解析/scripts/lib/github.ts#L96)
4. `oh-my-codex` 的仓库创建时间是 `2026-02-02T14:21:18Z`，天然不满足“1 天内新建”的旧筛选条件。
5. 本地数据里 `oh-my-codex` 当前也不在 `data/projects.json` / `data/stats.json` 中，这说明它甚至没有进入现有跟踪语料。
6. 已新增 [`rankings.ts`](/Users/lt/Desktop/codex\ share/项目文件/GitHub热门项目解析/scripts/lib/rankings.ts)，让 daily 快照中的 `todayTrending` 改为：
   - 优先按 `todayStarsDelta` 从已跟踪项目里排序
   - 只有当当天没有正增量时，才回退到旧的候选列表
7. 已将 [`searchNewStars()`](/Users/lt/Desktop/codex\ share/项目文件/GitHub热门项目解析/scripts/lib/github.ts) 候选数量从 `25` 提升到 `50`，提高爆发项目被纳入跟踪的概率。
8. 二级根因是：首次入库项目没有历史 `prevStats`，因此 `todayStarsDelta` 会被算成 `0`。
9. 为解决这个问题，`resolveTodayTrending()` 已调整为：
   - 先按真实 `todayStarsDelta` 排已跟踪项目
   - 再用整次抓取候选池补满榜单，覆盖首次入库热点项目
10. 已在 `/tmp` 副本实际重跑 `fetch-and-analyze`，新生成的 `data/daily/2026-04-04.json` 中：
   - `Yeachan-Heo/oh-my-codex` 已进入今日热门
   - 当前排名为第 `10` 位

## 本轮新增结论（2026-04-03）

1. GitHub 仓库 `liutao773680119-cmyk/github-explorer` 当前可正常访问，且公开可见。
2. 仓库侧三个 workflow 当前均为 `active`：
   - `CI`
   - `Daily Update`
   - `Re-analyze Project`
3. `Daily Update` 最近 5 次运行全部成功，最新一次为：
   - Run ID: `23933432016`
   - 时间: `2026-04-03T04:12:33Z`
   - 结果: `success`
4. `main` 最近 4 条提交均为自动日更写回：
   - `data: daily update 2026-04-03`
   - `data: daily update 2026-04-02`
   - `data: daily update 2026-04-01`
   - `data: daily update 2026-03-31`
5. `Re-analyze Project` 最近状态为“先失败，后成功补跑”：
   - 失败 Run ID: `23883804316`
   - 成功 Run ID: `23883979092`
6. 失败运行的真实原因不是平台故障，而是业务输入不合法：
   - 日志明确报错：`[FATAL] 项目 openai/codex 不在 projects.json 中`
7. 当前最主要的线上风险不是功能中断，而是 GitHub Actions 平台告警：
   - `actions/checkout@v4`
   - `actions/setup-node@v4`
   - `google-github-actions/auth@v2`
   都收到了 `Node.js 20` 弃用提示，GitHub 提示 `2026-06-02` 起默认切 Node 24，`2026-09-16` 移除 Node 20
8. 本地 workflow 配置与线上观察一致：
   - `.github/workflows/daily-update.yml` 默认 `AI_PROVIDER: deepseek`
   - `.github/workflows/re-analyze.yml` 默认 `provider: vertex-gemini`

## Confirmed Facts

1. `vertex-gemini` 代码接入、workflow 支持和本地验证都已完成。
2. 用户已在 GitHub 仓库补齐：
   - Secret: `GCP_VERTEX_SERVICE_ACCOUNT_JSON`
   - Secret: `VERTEX_GEMINI_PROJECT`
   - Variable: `VERTEX_GEMINI_LOCATION`
3. GitHub `Actions -> Re-analyze Project` 在 `vertex-gemini-provider` 分支上已包含新版输入表单；若看到旧版，通常是因为页面仍在看 `main` 或旧 run。
4. 当前工作树共有 `68` 个修改文件，但 `git diff --ignore-cr-at-eol --shortstat` 显示真实语义改动只有 `16` 个。
5. 本任务的核心语义改动集中在：
   - `.github/workflows/daily-update.yml`
   - `.github/workflows/re-analyze.yml`
   - `README.md`
   - `app/lib/config.ts`
   - `app/lib/types.ts`
   - `package.json`
   - `package-lock.json`
   - `scripts/lib/ai.ts`
   - `scripts/lib/ai-client.ts`
   - `tests/ai-config.test.ts`
6. 大量 `.agent`、`.cursor`、`app/components`、`scripts` 等其他文件当前主要表现为 CRLF/LF 噪音，不应混入本次 `vertex-gemini` 功能提交。
7. `tsconfig.tsbuildinfo` 是生成文件，不应作为功能改动提交。
8. `vertex-gemini` 相关功能文件已独立提交为 `8bdb9e3 feat: add vertex gemini provider`。
9. 已在干净副本 `/tmp/github-explorer-verify.pRKE5l/repo` 完成验证：
   - `node node_modules/typescript/bin/tsc -p tsconfig.json --noEmit`
   - `node tests/default-provider-contract.test.mjs`
   - `node tests/ai-provider-naming-contract.test.mjs`
   - `node --import tsx --test tests/ai-config.test.ts`
10. 已通过 GitHub device flow 获取带 `workflow` scope 的一次性 token，并成功把当前本地 `HEAD` 推送到远端分支 `vertex-gemini-provider`。
11. 远端分支推送成功后，GitHub 返回 PR 入口：
    - `https://github.com/liutao773680119-cmyk/github-explorer/pull/new/vertex-gemini-provider`
12. 当前默认值是分层状态：
    - `main` / 应用代码默认仍以 `deepseek` 为主
    - `vertex-gemini-provider` 分支上的 `Re-analyze Project` workflow 已包含 `provider` / `model` 输入和 Vertex 认证步骤
13. `git push origin main` 现在失败的根因不再是认证，而是远端 `main` 比本地更前：
    - 远端 `origin/main` 当前为 `d72c4d4`
    - 本地与远端存在多条历史提交分叉，直接 push `main` 会被 fast-forward 检查拒绝
14. 已使用 `git ls-remote --heads origin vertex-gemini-provider` 确认远端分支存在；当前分支头为 `bff54c7c56ff69381a388adc5583ef553bc486e0`
15. 临时 GitHub token 文件与 askpass helper 已在 `/tmp` 删除，当前仓库中未遗留认证凭据
16. 首次线上试跑结果说明：
    - `Authenticate to Google Cloud` 通过
    - `npm ci` 通过
    - `Re-analyze project` 失败
    - 失败原因为 `openai/codex` 不在 `data/projects.json` 中
17. `scripts/re-analyze.ts` 当前逻辑不是“分析任意 GitHub 仓库”，而是“重跑 `projects.json` 中已有项目”；若项目不存在会直接报：
    - `[FATAL] 项目 <owner/repo> 不在 projects.json 中`
18. 第二次线上试跑已成功，说明 `vertex-gemini` 在 GitHub Actions 上的关键链路已经闭环：
    - workflow_dispatch 输入可用
    - Google Cloud 认证可用
    - `Re-analyze project` 可成功执行
    - 后续步骤未导致 job 失败
19. 成功 run 产生的新远端提交为：
    - `c91b61d data: re-analyze vercel/next.js`
20. 该提交只修改了 3 个数据文件：
    - `data/cache/readme-cache.json`
    - `data/projects.json`
    - `data/stats.json`
21. `vercel/next.js` 的具体写回结果包括：
    - `projects.json`：重新生成 `analysis`，`analyzedAt` 从 `2026-03-25T13:33:30.414Z` 更新到 `2026-04-02T04:34:10.736Z`
    - `stats.json`：`stars` `138473 -> 138568`，`forks` `30704 -> 30748`，`openIssues` `3575 -> 3643`，`closedIssues` `22322 -> 22357`，`watchers` `1504 -> 1505`，`todayStarsDelta` `422 -> 95`
    - `readme-cache.json`：`vercel/next.js` 的 `fetchedAt` 从 `2026-03-01` 更新到 `2026-04-02`
22. 当前需要补看的已不是“能不能跑通”，而是这批已成功写回的数据改动如何并回 `main`
23. 当前默认值相关代码现状：
    - `app/lib/config.ts` 中 `DEFAULT_AI_PROVIDER = 'deepseek'`
    - `.github/workflows/daily-update.yml` 的 `AI_PROVIDER` 固定为 `deepseek`
    - `vertex-gemini-provider` 分支上的 `.github/workflows/re-analyze.yml` 默认输入已切为 `vertex-gemini`
24. 基于当前验收结果，最稳的切换策略不是“一刀切”，而是分层处理：
    - 手动重跑入口 `re-analyze.yml`：可以考虑在并回 `main` 后把默认值改成 `vertex-gemini`
    - 定时任务 `daily-update.yml`：暂时不改，继续 `deepseek`
    - 应用代码默认值 `DEFAULT_AI_PROVIDER`：暂时不改，继续 `deepseek`
25. 该策略现已落地到远端测试分支 `.github/workflows/re-analyze.yml`：
    - `provider.default: 'vertex-gemini'`
    - `AI_PROVIDER: ${{ github.event.inputs.provider || 'vertex-gemini' }}`
26. 已用 `ruby` 的 `YAML.load_file` 验证本地 workflow 语法通过
27. 已在隔离 worktree 中将该最小改动独立提交为：
    - `bff54c7 chore: default re-analyze to vertex gemini`
28. 已恢复本机 `gh` 登录态并确认 scope 包含：
    - `gist`
    - `read:org`
    - `repo`
    - `workflow`
29. 已执行 `gh auth setup-git`，后续 GitHub HTTPS push 已可直接复用当前 `gh` 登录态
30. 已成功将 `bff54c7` 推送到远端 `vertex-gemini-provider`
31. 已用 `git ls-remote --heads origin vertex-gemini-provider` 确认远端分支头更新为：
    - `bff54c7c56ff69381a388adc5583ef553bc486e0`
32. 当前远端测试分支的关键提交顺序为：
    - `bff54c7 chore: default re-analyze to vertex gemini`
    - `c91b61d data: re-analyze vercel/next.js`
    - `8bdb9e3 feat: add vertex gemini provider`
33. `vertex-gemini-provider` 相对 `origin/main` 不是“最小 PR”：
    - 领先 `19` 个提交
    - 落后 `37` 个提交
    - `git diff --stat origin/main...origin/vertex-gemini-provider` 涉及 `49` 个文件
34. 已基于 `origin/main` 创建隔离 worktree：
    - `.worktrees/t2026-04-02-pr`
35. 已在该 worktree 上按依赖链重建出更干净的最小 PR 分支，当前提交序列为：
    - `9f49d13 feat: switch to Gemini 2.5 Flash-Lite via OpenAI SDK`
    - `7ffb58a feat: add configurable AI providers for analysis pipeline`
    - `0bd9bcd refactor: unify AI provider naming in scripts`
    - `30e61fa chore: default automated analysis to deepseek`
    - `235b66d fix: correct deepseek fallback token file`
    - `d624320 feat: add vertex gemini provider`
    - `a82d2b6 chore: default re-analyze to vertex gemini`
    - `4b6d6dc test: align provider contracts with final defaults`
36. 该最小 PR 分支当前相对 `origin/main` 为：
    - `8` 个提交
    - `16` 个文件
37. 已将最小 PR 分支推送到远端：
    - 远端分支：`t2026-04-02-pr`
    - 分支头：`4b6d6dc`
    - PR 入口：`https://github.com/liutao773680119-cmyk/github-explorer/pull/new/t2026-04-02-pr`
38. 为适配当前最终策略，已将以下测试契约调整为“真正想保护的行为”：
    - `tests/default-provider-contract.test.mjs`
    - `tests/ai-provider-naming-contract.test.mjs`
    - `tests/deepseek-fallback-file-contract.test.mjs`
39. 已在 `/tmp/github-explorer-pr-check` 副本完成提交后最终验证：
    - `node tests/default-provider-contract.test.mjs`
    - `node tests/ai-provider-naming-contract.test.mjs`
    - `node tests/deepseek-fallback-file-contract.test.mjs`
    - `node --import ./node_modules/tsx/dist/loader.mjs --test tests/ai-config.test.ts`
    - `node ./node_modules/typescript/bin/tsc -p tsconfig.json --noEmit`
40. 代码复审已发现并修复 3 个明确问题：
    - 新增契约测试此前未被 `npm test` 覆盖
    - `RunLog` 类型与仓库内历史 `data/logs/*.json` schema 漂移
    - README 本地示例默认值与最终 provider 分层策略不一致
41. 已将 3 个契约测试从 `.mjs` 重写为标准 `*.test.ts`，当前 `npm test` 已实际覆盖：
    - `tests/default-provider-contract.test.ts`
    - `tests/ai-provider-naming-contract.test.ts`
    - `tests/deepseek-fallback-file-contract.test.ts`
42. 已新增 `tests/run-log-legacy-compat.test.ts`，显式约束 `RunLog` 必须兼容历史日志中的：
    - `stage: gemini_call`
    - `stats.geminiCalls`
43. 已在 `app/lib/types.ts` 中补齐向后兼容，并在 `scripts/fetch-and-analyze.ts` 中处理 `aiCalls` 可选后的自增写法
44. 已修正 README 示例，使其与最终默认策略一致：
    - 本地默认示例回到 `deepseek`
    - 文档明确“日更默认 deepseek，手动 re-analyze 默认 vertex-gemini”
45. 已清理 `scripts/lib/ai.ts` 的未使用导入 warning
46. 已将上述复审修复提交并推送到远端最小 PR 分支：
    - 提交：`12bbf52 fix: cover provider contracts and legacy run logs`
47. 本轮新鲜验证结果为：
    - `npm test`
    - `npm run lint`
    - `./node_modules/.bin/tsc -p tsconfig.json --noEmit`

## Recommendation

- 后续不应再从 `vertex-gemini-provider` 开 PR；应直接使用 `t2026-04-02-pr`
- PR 描述应强调当前策略：
  - `re-analyze.yml`：默认 `vertex-gemini`
  - `daily-update.yml`：继续 `deepseek`
  - `app/lib/config.ts`：继续 `deepseek`
- PR 描述可顺手补一句：本轮已把 provider 契约测试纳入标准 `npm test`，并为历史日志字段保留类型兼容
- `vertex-gemini-provider` 只保留为历史验收分支，不再作为合并基线

## Risks

1. 当前 `main` 工作树较脏，若直接全量暂存，会把大量无关换行噪音与交接文件一起带入后续提交。
2. 原始仓库路径中的反斜杠仍会干扰 Node/TS 验证，后续若需再次验收，仍应在 `/tmp` 无反斜杠副本完成。
3. 虽然线上试跑已成功，但在未核对更多稳定性与账单前，不建议直接把 `daily-update` 或应用代码默认值切到 `vertex-gemini`。
4. 当前 GitHub CLI 的登录态已恢复，但后续若换机器或 keyring 失效，仍应先确认 `workflow` scope 是否存在，再修改 `.github/workflows/*`。
