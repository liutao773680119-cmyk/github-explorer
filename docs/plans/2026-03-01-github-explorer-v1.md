# GitHub 热门解读 V1 完整实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 从零搭建 GitHub 热门解读网站，包含每日自动抓取 + AI 解读 + 静态网页展示全链路。

**Architecture:** Next.js 14 SSG 静态生成，构建时从 `data/` 目录读取 JSON 渲染页面。`scripts/fetch-and-analyze.ts` 由 GitHub Actions 每日执行，调用 GitHub Search API 抓取热门项目，增量调用 Gemini 生成中文解读，结果存为 JSON 推回仓库，Vercel 检测 commit 自动部署。

**Tech Stack:** Next.js 14 (App Router, SSG) · Tailwind CSS · TypeScript · @octokit/rest · @google/generative-ai (gemini-2.5-flash) · GitHub Actions · Vercel

---

## Phase 0: 项目脚手架 + 基础配置

### Task 0.1: 初始化 Next.js 项目

**Files:**

- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `postcss.config.mjs`
- Create: `.gitignore`

**Step 1: 初始化 Next.js**

```bash
npx -y create-next-app@latest ./ --ts --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

> ⚠️ 注意：由于目录已有文件，可能需要处理冲突。如 `README.md` 已存在，选择不覆盖。

**Step 2: 创建 .gitignore**

```gitignore
# dependencies
node_modules/
.next/
out/

# env
.env*.local
Github Token.txt
Googole Ai Studo Api.txt

# debug
npm-debug.log*

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# build
dist/
```

**Step 3: 安装项目依赖**

```bash
npm install @octokit/rest @google/generative-ai
npm install -D tsx
```

**Step 4: 验证构建**

```bash
npm run build
npm run dev
```

Expected: 构建成功，localhost:3000 显示默认 Next.js 页面

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: init Next.js 14 project scaffold"
```

---

### Task 0.2: 类型定义

**Files:**

- Create: `app/lib/types.ts`

**Step 1: 编写完整类型定义**

从 CLAUDE.md §完整类型定义 照搬，包含：

- `Competitor`, `QuickStart`, `ProjectAnalysis`, `ProjectCategory`
- `Project`, `ProjectStats`, `DailySnapshot`, `Highlight`
- `ProjectsJson`, `StatsJson`, `ProjectWithStats`
- `TabId`, `SortKey`, `RunErrorStage`, `RunError`, `RunLog`

**Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

Expected: 无错误

**Step 3: Commit**

```bash
git add app/lib/types.ts
git commit -m "feat: add complete type definitions"
```

---

### Task 0.3: 配置常量

**Files:**

- Create: `app/lib/config.ts`

**Step 1: 编写统一配置文件**

从 CLAUDE.md §配置常量 照搬，包含：

- `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`, `RE_ANALYZE_WORKFLOW_URL`
- `GEMINI_MODEL = 'gemini-2.5-flash'`
- `EXPECTED_DATA_VERSION = '1'`
- `LS_VERSION = '1'`
- `FAVORITES_LIMIT = 200`, `HISTORY_LIMIT = 500`
- `README_MAX_CHARS = 3000`, `GEMINI_SLEEP_MS = 2000`
- `HEALTH_CHECK_DAYS = 30`, `DEAD_COMMIT_DAYS = 365`, `DEAD_ISSUE_RATIO = 5`

**Step 2: Commit**

```bash
git add app/lib/config.ts
git commit -m "feat: add centralized config constants"
```

---

### Task 0.4: Mock 数据

**Files:**

- Create: `data/projects.json`
- Create: `data/stats.json`
- Create: `data/mock/projects.mock.json`
- Create: `data/mock/stats.mock.json`

**Step 1: 创建空的 JSON 数据文件**

`data/projects.json`:

```json
{ "version": "1", "updatedAt": "", "projects": [] }
```

`data/stats.json`:

```json
{ "version": "1", "updatedAt": "", "stats": {} }
```

**Step 2: 创建含示例数据的 Mock 文件**

`data/mock/` 下放 3~5 个示例项目的完整数据（含 analysis），便于前端开发时不需要实际调用 API。使用 `aider-chat/aider`、`anthropics/claude-code`、`vercel/next.js` 等项目作为示例。

**Step 3: Commit**

```bash
git add data/
git commit -m "feat: add empty data files and mock data"
```

---

## Phase 1: 后端脚本（数据抓取 + AI 解读）

### Task 1.1: API Key 读取 + 工具函数

**Files:**

- Create: `scripts/lib/utils.ts`

**Step 1: 实现工具函数**

包括：

- `getApiKey(envVar, filePath)` — 环境变量 → txt 文件 → 退出
- `readJsonSafe(path)` — 安全读取 JSON
- `writeJsonSafe(path, data)` — 先写 .bak 再覆盖
- `sleep(ms)` — Promise 延时
- `truncate(text, maxChars)` — 截取文本

**Step 2: 验证**

```bash
npx tsx -e "import { getApiKey } from './scripts/lib/utils'; console.log('ok')"
```

**Step 3: Commit**

```bash
git add scripts/lib/utils.ts
git commit -m "feat: add script utility functions"
```

---

### Task 1.2: GitHub 数据抓取

**Files:**

- Create: `scripts/lib/github.ts`

**Step 1: 实现 GitHub API 封装**

包括：

- `createOctokit()` — 创建认证客户端
- `searchTodayTrending()` — 今日热门（created:>昨天，stars desc，30条）
- `searchWeekTrending()` — 本周热门（created:>7天前，stars desc，30条）
- `searchNewStars()` — 本周新星（created:>3月前，stars>100，25条）
- `searchClassicProjects()` — 经典项目（stars>10000，50条）
- `fetchRepoStats(fullName)` — 获取单个项目的 stats
- `fetchReadme(fullName)` — 获取 README 前 3000 字（含缓存逻辑）

**Step 2: 验证**（本地需有 Github Token.txt）

```bash
npx tsx -e "import { searchTodayTrending } from './scripts/lib/github'; searchTodayTrending().then(r => console.log(r.length, 'repos'))"
```

**Step 3: Commit**

```bash
git add scripts/lib/github.ts
git commit -m "feat: add GitHub API data fetching"
```

---

### Task 1.3: README 缓存

**Files:**

- Create: `scripts/lib/readme-cache.ts`

**Step 1: 实现缓存逻辑**

按照 CLAUDE.md §README 缓存 的约定：

- `loadReadmeCache()` / `saveReadmeCache()`
- 有效期 7 天，总上限 500 条
- `fetchReadmeWithCache(fullName)` — 先缓存 → 过期/未命中调 API

**Step 2: Commit**

```bash
git add scripts/lib/readme-cache.ts
git commit -m "feat: add README caching layer"
```

---

### Task 1.4: Gemini 解读生成

**Files:**

- Create: `scripts/lib/gemini.ts`

**Step 1: 实现 Gemini 调用**

包括：

- `analyzeProject(fullName, description, stars, ...)` — 按固定 Prompt 调用
- `selectHighlights(projectsSummary)` — 今日亮点 Prompt
- `validateFormat(raw)` — 第一层格式校验
- `sanitizeAndMark(analysis)` — 第二层内容校验 + needsReview 标记

Prompt 模板从 CLAUDE.md §Gemini Prompt 和 §今日亮点 Prompt 照搬。

**Step 2: Commit**

```bash
git add scripts/lib/gemini.ts
git commit -m "feat: add Gemini analysis generation"
```

---

### Task 1.5: 主脚本 fetch-and-analyze.ts

**Files:**

- Create: `scripts/fetch-and-analyze.ts`

**Step 1: 实现主流程**

按 CLAUDE.md §增量分析策略 和 §首次运行策略：

1. 读 projects.json，建立 fullName Set
2. 判断是否首次运行（projects 为空）
3. 首次：抓经典项目 50 个 → 逐个 Gemini → 逐个 appendProject
4. 非首次：抓各榜单 → 新项目调 Gemini → 旧项目只更新 stats
5. stars 变化 >50% 的已有项目重新解读
6. 健康度检查（入库超 30 天的项目）
7. 生成 daily 快照 + 选今日亮点
8. 写日志 → git push
9. 错误超阈值时创建 GitHub Issue

**Step 2: 本地测试（dry run）**

```bash
npx tsx scripts/fetch-and-analyze.ts
```

Expected: 输出抓取日志，data/ 下生成 JSON 文件

**Step 3: Commit**

```bash
git add scripts/fetch-and-analyze.ts
git commit -m "feat: add daily fetch-and-analyze main script"
```

---

### Task 1.6: 重新解读脚本

**Files:**

- Create: `scripts/re-analyze.ts`

**Step 1: 实现单项目重新解读**

按 CLAUDE.md §人工干预机制：

- 读 `workflow_dispatch` 传入的 `fullName`
- 删除旧 analysis → 重新抓 README → 调 Gemini → 校验 → 覆盖写回

**Step 2: Commit**

```bash
git add scripts/re-analyze.ts
git commit -m "feat: add single project re-analyze script"
```

---

### Task 1.7: 版本生成脚本

**Files:**

- Create: `scripts/gen-version.js`

**Step 1: 实现构建时版本写入**

```javascript
const fs = require('fs');
fs.writeFileSync('public/version.json', JSON.stringify({ buildTime: Date.now().toString() }));
```

**Step 2: 修改 package.json build 命令**

```json
"build": "node scripts/gen-version.js && next build"
```

**Step 3: Commit**

```bash
git add scripts/gen-version.js package.json
git commit -m "feat: add build-time version generation"
```

---

### Task 1.8: GitHub Actions Workflows

**Files:**

- Modify: `.github/workflows/daily-update.yml`
- Create: `.github/workflows/re-analyze.yml`

**Step 1: 编写 daily-update.yml**

按 CLAUDE.md §daily-update.yml 完整配置：

- cron: `0 1 * * *`（北京时间 09:00）
- workflow_dispatch 手动触发
- Node.js 20 + npm ci + tsx 运行
- git commit + push
- Keep-alive：每月 30 号空 commit

**Step 2: 编写 re-analyze.yml**

- workflow_dispatch，inputs: fullName
- 运行 `scripts/re-analyze.ts`

**Step 3: Commit**

```bash
git add .github/workflows/
git commit -m "feat: add GitHub Actions workflows"
```

---

## Phase 2: 前端页面（静态渲染 + 交互）

### Task 2.1: 暗色主题 + 全局样式

**Files:**

- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

**Step 1: 配置 Tailwind 暗色主题**

- 自定义色值：深蓝 `#0f172a`、文字 `#94a3b8`、高亮 `#f1f5f9`、金色 `#f59e0b`
- Vibe Coding 渐变：`#8b5cf6` → `#3b82f6`
- 断点：只用 `md:` (768px)，mobile-first
- 暗/浅色切换支持（`darkMode: 'class'`）

**Step 2: 全局 CSS reset + 基础样式**

**Step 3: 验证**

```bash
npm run dev
```

Expected: 页面显示暗色背景

**Step 4: Commit**

```bash
git add app/globals.css tailwind.config.ts
git commit -m "feat: add dark theme and global styles"
```

---

### Task 2.2: localStorage 封装

**Files:**

- Create: `app/lib/storage.ts`

**Step 1: 实现 storage 统一封装**

按 CLAUDE.md §localStorage 版本管理：

- `initStorage()` — 初始化 + 版本检查 + 迁移
- `getFavorites()` / `setFavorites()`
- `getReadItems()` / `setReadItems()`
- `getHistory()` / `addHistory()` / `clearHistory()`
- 所有读写加 try-catch

**Step 2: Commit**

```bash
git add app/lib/storage.ts
git commit -m "feat: add localStorage unified storage layer"
```

---

### Task 2.3: 数据合并工具

**Files:**

- Create: `app/lib/data.ts`

**Step 1: 实现数据合并**

- `mergeProjectData(projects, statsMap)` → `ProjectWithStats[]`
- `defaultStats(fullName)` — 缺失字段兜底
- 数据版本检查
- Tab 过滤逻辑（today/week/newStars/vibeCoding/classic/favorites）
- 搜索过滤 + 排序

**Step 2: Commit**

```bash
git add app/lib/data.ts
git commit -m "feat: add data merge and filtering utilities"
```

---

### Task 2.4: 主布局 + Header

**Files:**

- Modify: `app/layout.tsx`
- Create: `app/components/Header.tsx`
- Create: `app/components/ThemeToggle.tsx`

**Step 1: Layout**

- 导入 Google Fonts（Inter）
- `<html>` 加 dark class
- 全局 initStorage()

**Step 2: Header 组件**

- 标题「GitHub 热门解读」+ Slogan
- 更新时间显示
- 暗/浅色切换按钮
- 📋 历史链接
- 移动端适配

**Step 3: Commit**

```bash
git add app/layout.tsx app/components/
git commit -m "feat: add layout and header with theme toggle"
```

---

### Task 2.5: Tab 切换器

**Files:**

- Create: `app/components/TabSwitcher.tsx`

**Step 1: 实现 6 个 Tab**

- today / week / newStars / vibeCoding / classic / favorites
- 桌面端完整文字，移动端缩短 + 横向滚动
- 当前 Tab 高亮样式

**Step 2: Commit**

```bash
git add app/components/TabSwitcher.tsx
git commit -m "feat: add tab switcher component"
```

---

### Task 2.6: 今日亮点

**Files:**

- Create: `app/components/Highlights.tsx`

**Step 1: 实现置顶亮点卡片**

- 2~3 个推荐项目卡片
- 金色 `#f59e0b` 主题
- 推荐理由
- 移动端横向滑动

**Step 2: Commit**

```bash
git add app/components/Highlights.tsx
git commit -m "feat: add today's highlights component"
```

---

### Task 2.7: 搜索栏 + 筛选 + 排序

**Files:**

- Create: `app/components/SearchBar.tsx`

**Step 1: 实现搜索筛选**

- 关键词搜索（跨所有 Tab）
- 14 分类筛选下拉
- 排序切换（stars/增量/创建时间/最近提交/Vibe评分）
- 移动端：搜索框固定 + 🔽 漏斗图标弹出筛选

**Step 2: Commit**

```bash
git add app/components/SearchBar.tsx
git commit -m "feat: add search, filter and sort bar"
```

---

### Task 2.8: 项目列表 + 项目卡片

**Files:**

- Create: `app/components/ProjectList.tsx`
- Create: `app/components/ProjectCard.tsx`

**Step 1: ProjectCard — 单个项目行**

- 项目名↗（链接到 GitHub）
- Star 数 + 今日增量 + Fork + Issue + 赞助者 + 语言 + License + 最近提交
- Vibe 标签（紫→蓝渐变）
- ❤️ 收藏按钮 + ✓ 已读按钮
- NEW 角标（analyzedAt = 今天）
- 已读项目：opacity 0.45
- 移动端精简显示（4 项）

**Step 2: ProjectList — 列表容器**

- 每页 20 条 + "加载更多" 按钮
- 空状态提示
- 全部/未读/已读 筛选
- 已死项目过滤（isDead）
- 点击行 → 展开解读面板

**Step 3: Commit**

```bash
git add app/components/ProjectList.tsx app/components/ProjectCard.tsx
git commit -m "feat: add project list and card components"
```

---

### Task 2.9: AI 解读面板

**Files:**

- Create: `app/components/AnalysisPanel.tsx`

**Step 1: 实现解读面板**

- 桌面端：固定右侧栏 40%
- 移动端：手风琴式就地展开（点击再点收起）
- 8 个解读字段渲染：定位/场景/人群/上手/竞品对比/价格/Vibe/社区
- 快速上手区（每步可单独复制）
- 竞品对比表格
- 复制按钮（纯文本 / Markdown）
- 🔄 重新解读按钮
- ⚠️ 待复审角标（needsReview）
- 空态提示「← 点击左侧项目查看 AI 解读」

**Step 2: Commit**

```bash
git add app/components/AnalysisPanel.tsx
git commit -m "feat: add AI analysis panel component"
```

---

### Task 2.10: 主页面组装

**Files:**

- Modify: `app/page.tsx`

**Step 1: 组装所有组件**

- 构建时 import `projects.json` + `stats.json`（SSG）
- 数据版本检查
- 合并 projects + stats → ProjectWithStats[]
- 读取 daily 快照（今日亮点 + Tab 数据）
- 状态管理：当前 Tab、选中项目、搜索词、排序方式
- 布局：Header → 亮点 → 搜索 → Tab → 列表 + 解读面板

**Step 2: 验证**

```bash
npm run dev
```

Expected: 首先显示空态（或 mock 数据），所有组件正常渲染

**Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: assemble main page with all components"
```

---

### Task 2.11: 运行状态角标

**Files:**

- Create: `app/components/StatusBadge.tsx`

**Step 1: 实现角标**

- 右下角固定定位
- 绿/黄/红 三色，基于 logs/YYYY-MM-DD.json
- 悬停 tooltip：更新时间 + 错误条数

**Step 2: Commit**

```bash
git add app/components/StatusBadge.tsx
git commit -m "feat: add run status badge component"
```

---

### Task 2.12: 数据更新提示 + 版本检测

**Files:**

- Create: `app/components/DataFreshness.tsx`
- Create: `app/components/VersionChecker.tsx`

**Step 1: DataFreshness**

- 显示「数据更新于 XX月XX日 09:00」
- 超过 25 小时未更新显示黄色警告

**Step 2: VersionChecker**

按 CLAUDE.md §部署版本检测：

- 每 10 分钟轮询 `/version.json`
- 版本不一致时显示更新提示条

**Step 3: Commit**

```bash
git add app/components/DataFreshness.tsx app/components/VersionChecker.tsx
git commit -m "feat: add data freshness and version checker"
```

---

### Task 2.13: 浏览历史页

**Files:**

- Create: `app/history/page.tsx`

**Step 1: 实现 /history 页面**

- 按 readAt 倒序展示已读项目
- 每行：项目名↗、阅读时间、Star 数、语言、一句话定位
- 复用 SearchBar + AnalysisPanel
- 右上角「清空历史」按钮（二次确认）
- 不过滤 isDead 项目

**Step 2: Commit**

```bash
git add app/history/
git commit -m "feat: add browsing history page"
```

---

## Phase 3: 集成验证 + 部署

### Task 3.1: 脚本本地全流程测试

**Step 1: 运行抓取脚本**

```bash
npx tsx scripts/fetch-and-analyze.ts
```

**验证项：**

- data/projects.json 有项目写入
- data/stats.json 有 stats 写入
- data/logs/YYYY-MM-DD.json 有日志
- data/daily/YYYY-MM-DD.json 有快照
- 控制台无 fatal 错误

---

### Task 3.2: 前端构建 + 渲染测试

**Step 1: 构建前端**

```bash
npm run build
```

**验证项：**

- 构建成功，无 TypeScript 错误
- `public/version.json` 已生成

**Step 2: 本地预览**

```bash
npm run start
```

**验证项：**

- 首页加载 < 2 秒
- 各 Tab 切换正常
- 点击项目行显示解读面板
- 搜索/筛选/排序正常
- 收藏功能正常（刷新后保持）
- 移动端布局正确（浏览器模拟器）
- 暗/浅色切换正常

---

### Task 3.3: 首次 Push + Vercel 部署

**Step 1: 推送到 GitHub**

```bash
git add -A
git commit -m "feat: GitHub Explorer V1 complete"
git push origin main
```

**Step 2: 配置 Vercel**

- 在 Vercel 导入 `liutao773680119-cmyk/github-explorer`
- Framework Preset: Next.js
- Build Command: `node scripts/gen-version.js && next build`
- Output Directory: `.next`

**Step 3: 验证部署后的线上页面**

---

### Task 3.4: 手动触发 Actions 测试

**Step 1: 在 GitHub Actions 页面手动触发 daily-update**

**验证项：**

- Workflow 运行成功
- data/ 目录有新的 commit
- Vercel 自动重新部署

---

## 验证计划

### 自动验证

| 命令 | 验证内容 | 期望结果 |
|------|---------|---------|
| `npx tsc --noEmit` | TypeScript 类型检查 | 零错误 |
| `npm run build` | Next.js 生产构建 | 构建成功 |
| `npx tsx scripts/fetch-and-analyze.ts` | 脚本全流程 | data/ 下生成 JSON |
| `npm run lint` | ESLint 检查 | 零错误 |

### 手动验证（浏览器）

1. **首页加载**：打开 localhost:3000 → 页面在 2 秒内完整加载
2. **Tab 切换**：依次点击 6 个 Tab → 列表内容切换，无闪烁
3. **AI 解读**：点击任意项目行 → 右侧/就地展开解读面板，8 个字段完整
4. **搜索**：输入 "next" → 结果过滤，清空恢复
5. **收藏**：点击 ❤️ → 红色高亮，刷新后保持，收藏 Tab 可见
6. **已读**：点击 ✓ → 行变灰，可撤销
7. **移动端**：Chrome DevTools 切换到手机模式 → 布局正确，手风琴展开正常
8. **暗/浅色**：点击切换按钮 → 主题切换
9. **历史页**：`/history` → 显示已读项目列表

---

## 依赖关系

```
Phase 0 (脚手架) ──→ Phase 1 (后端脚本) ──→ Task 3.1 (脚本测试)
                 ──→ Phase 2 (前端页面) ──→ Task 3.2 (前端测试)
                                         ──→ Task 3.3 (部署)
                                         ──→ Task 3.4 (Actions 测试)
```

Phase 1 和 Phase 2 可以并行开发：

- Phase 1 产出 data/*.json
- Phase 2 先用 mock 数据开发，最后切换到真实数据

---

## 预计工时

| Phase | 任务数 | 预估 |
|-------|--------|------|
| Phase 0 | 4 | 30 分钟 |
| Phase 1 | 8 | 2~3 小时 |
| Phase 2 | 13 | 3~4 小时 |
| Phase 3 | 4 | 1 小时 |
| **总计** | **29** | **约 6~8 小时** |
