# CLAUDE.md — GitHub 热门解读

> 每次新 session 开始前请先读这个文件，再读 PRD.md，然后开始工作。

---

## 项目定位

每天通过 GitHub Actions 自动抓取热门项目 + 调用 Gemini API 生成中文解读，结果累积存为 JSON 知识库推回仓库，Vercel 部署静态网页直接读取展示。用户打开网页秒显示，无需等待任何 API 调用。

**目标用户**：自用，专注 vibe coding 的开发者。
**重点领域**：Claude Code、ChatGPT/OpenAI 工具链、开源 AI Agent、Prompt 工程、CLI 工具。

---

## 技术栈（严格遵守，不要替换）

- **框架**：Next.js 14，App Router，静态生成（SSG）
- **样式**：Tailwind CSS，不写 inline style，不引入其他 CSS 框架
- **视觉风格**：极简暗色，信息密度高，干净利落
  - 暗色背景：深蓝 `#0f172a`，文字 `#94a3b8`，高亮白 `#f1f5f9`
  - Vibe Coding 标签：紫→蓝渐变（`#8b5cf6` → `#3b82f6`）
  - 今日亮点：金色 `#f59e0b`
  - 支持暗/浅色切换（Header 右上角按钮，默认暗色）
  - 过渡效果：极简无动画，Tab/筛选切换时列表直接替换
- **数据**：构建时从 `data/` 目录读取 JSON，不在客户端发起任何请求
- **定时脚本**：`scripts/fetch-and-analyze.ts`，由 GitHub Actions 触发，用 `tsx` 直接运行
- **GitHub API**：`@octokit/rest`，Bearer Token 认证
- **AI**：`@google/generative-ai`，非流式调用，模型固定 `gemini-2.5-flash`
- **语言**：TypeScript，所有文件 `.ts` / `.tsx`，禁止使用 `any`
- **代码质量**：ESLint + Prettier，统一风格
- **GitHub 仓库**：公有仓库（Public）

---

## 文件结构

```
├── app/
│   ├── page.tsx                  # 主页面
│   ├── history/
│   │   └── page.tsx              # 浏览历史页 /history
│   ├── components/
│   │   ├── Highlights.tsx        # 今日亮点（置顶2~3个）
│   │   ├── SearchBar.tsx         # 搜索 + 分类筛选 + 排序
│   │   ├── TabSwitcher.tsx       # 5个Tab
│   │   ├── ProjectList.tsx       # 左侧列表 + 分页
│   │   ├── ProjectCard.tsx       # 单个项目行
│   │   ├── AnalysisPanel.tsx     # 右侧固定解读栏（移动端全屏）
│   │   └── VersionChecker.tsx    # 部署版本检测提示条
│   └── lib/
│       ├── types.ts              # 所有类型定义
│       ├── config.ts             # 仓库配置、workflow URL
│       └── storage.ts            # localStorage 统一读写封装（含版本迁移）
├── data/
│   ├── projects.json             # 项目基本信息 + AI解读（只增不改）
│   ├── stats.json                # 每日更新的数值指标
│   ├── logs/
│   │   └── YYYY-MM-DD.json      # 每日运行日志摘要
│   ├── daily/
│   │   └── YYYY-MM-DD.json      # 每日快照（V2连续上榜用）
│   ├── cache/
│   │   └── readme-cache.json    # README缓存
│   └── mock/                    # Mock数据，无需API Key开发前端
├── scripts/
│   ├── fetch-and-analyze.ts     # 每日定时任务主脚本
│   ├── re-analyze.ts            # 单项目重新解读脚本
│   ├── migrate.ts               # 数据结构迁移脚本（手动运行）
│   └── gen-version.js           # 构建时生成 public/version.json
├── app/lib/
│   └── config.ts                # GITHUB_REPO_OWNER、RE_ANALYZE_WORKFLOW_URL 等配置
└── .github/
    └── workflows/
        ├── daily-update.yml     # 每日定时任务
        └── re-analyze.yml       # 手动触发单项目重新解读
```

---

## 完整类型定义（types.ts 必须照此实现）

```typescript
// lib/types.ts

export interface Competitor {
  name: string;
  method: string;
  models: string;
  pricing: string;
}

export interface QuickStart {
  prerequisites: string | null;  // 前置条件，如 Node.js>=18
  steps: string[];               // 2~3步操作命令
  note: string | null;           // 平台差异或注意事项
}

export interface ProjectAnalysis {
  positioning: string;           // 一句话定位，30字以内
  useCases: string[];            // 3个"你做X→它帮你做Y"场景
  audience: string;              // 适合人群，一句话
  quickStart: QuickStart;        // 结构化快速上手
  competitors: Competitor[];     // 2~3个竞品对比
  pricing: string;               // 免费/部分免费/付费
  vibeCodingScore: number;       // 1~5
  vibeCodingReason: string;      // 评分理由
  isVibeCoding: boolean;
  communityActivity: string;     // 社区活跃度一句话
  category: ProjectCategory;
  needsReview?: boolean;         // true = 内容校验有修正，待人工复审
}

export type ProjectCategory =
  | 'LLM框架' | 'AI Agent' | 'AI编程助手' | 'CLI工具'
  | '前端框架' | '后端框架' | '数据库' | 'DevOps'
  | '测试工具' | '安全' | '文档工具' | '移动开发'
  | 'Prompt工程' | '其他';

export interface Project {
  // 基本信息（来自GitHub API，写入projects.json，不会变）
  owner: string;
  repo: string;
  fullName: string;              // "owner/repo"
  description: string;
  language: string;
  topics: string[];
  license: string;
  createdAt: string;            // ISO8601
  url: string;                  // "https://github.com/owner/repo"
  // AI解读（写入projects.json，只增不改）
  analysis: ProjectAnalysis;
  analyzedAt: string;           // 首次解读时间 ISO8601
}

export interface ProjectStats {
  fullName: string;
  stars: number;
  forks: number;
  openIssues: number;
  closedIssues: number;           // 已关闭 Issue 数
  watchers: number;
  sponsors: number;                 // 赞助者数（GitHub Sponsors）
  pushedAt: string;               // 最近提交时间 ISO8601
  updatedAt: string;              // 仓库更新时间 ISO8601
  todayStarsDelta: number;        // 今日增量（当日stars - 昨日stars，首次为0）
  fetchedAt: string;              // 本次抓取时间 ISO8601
  isArchived: boolean;            // GitHub 官方归档状态
  isDead: boolean;                // 脚本判定已死（1年无commit + issue开闭比>5:1）
  deadDetectedAt?: string;        // 首次判定为已死的时间 ISO8601
}

export interface DailySnapshot {
  date: string;                 // "YYYY-MM-DD"
  todayTrending: string[];      // fullName列表（今日Star增量）
  weekTrending: string[];       // fullName列表（本周Star增量）
  newStars: string[];           // 本周新星
  vibeCoding: string[];         // Vibe Coding精选
  classic: string[];            // 经典项目
  highlights: Highlight[];      // 今日亮点
}

export interface Highlight {
  fullName: string;
  reason: string;               // 推荐理由，30字以内
}

export interface ProjectsJson {
  updatedAt: string;
  projects: Project[];
}

export interface StatsJson {
  updatedAt: string;
  stats: Record<string, ProjectStats>; // key = fullName
}

// 前端合并后使用的完整项目对象
export interface ProjectWithStats extends Project {
  stats: ProjectStats;
  isFavorite?: boolean;         // 来自localStorage，运行时注入
}

export type TabId = 'today' | 'week' | 'newStars' | 'vibeCoding' | 'classic' | 'favorites';

export type SortKey = 'stars' | 'todayStarsDelta' | 'createdAt' | 'pushedAt' | 'vibeCodingScore';

export type RunErrorStage = 'github_fetch' | 'readme_fetch' | 'gemini_call' | 'json_parse' | 'file_write' | 'git_push';

export interface RunError {
  time: string;
  level: 'warn' | 'error' | 'fatal';
  project?: string;
  stage: RunErrorStage;
  message: string;
  retries: number;
  skipped: boolean;
}

export interface RunLog {
  version: string;
  date: string;
  startedAt: string;
  finishedAt: string;
  durationSeconds: number;
  success: boolean;
  stats: {
    fetched: number;
    newProjects: number;
    skipped: number;
    geminiCalls: number;
    statsUpdated: number;
  };
  errors: RunError[];
}
```

---

## 数据文件格式

### projects.json

```json
{
  "updatedAt": "2026-02-28T01:00:00Z",
  "projects": [
    {
      "owner": "anthropics",
      "repo": "claude-code",
      "fullName": "anthropics/claude-code",
      "description": "...",
      "language": "TypeScript",
      "topics": ["ai", "cli"],
      "license": "MIT",
      "createdAt": "2025-01-01T00:00:00Z",
      "url": "https://github.com/anthropics/claude-code",
      "analysis": { ... },
      "analyzedAt": "2026-02-28T01:00:00Z"
    }
  ]
}
```

### stats.json

```json
{
  "updatedAt": "2026-02-28T01:00:00Z",
  "stats": {
    "anthropics/claude-code": {
      "fullName": "anthropics/claude-code",
      "stars": 12000,
      "forks": 450,
      "openIssues": 32,
      "closedIssues": 128,
      "watchers": 12000,
      "sponsors": 5,
      "pushedAt": "2026-02-27T18:00:00Z",
      "updatedAt": "2026-02-27T18:00:00Z",
      "todayStarsDelta": 320,
      "fetchedAt": "2026-02-28T01:00:00Z",
      "isArchived": false,
      "isDead": false
    }
  }
}
```

---

## GitHub Search API 查询策略

### 今日 Trending（近似方案）

```
q: created:>YYYY-MM-DD（昨天日期）
sort: stars
order: desc
per_page: 30
```

### 本周 Trending（近似方案）

```
q: created:>YYYY-MM-DD（7天前日期）
sort: stars
order: desc
per_page: 30
```

> 说明：GitHub Search API 无"增量"字段，用"最近创建且Star最多"近似替代。
> V2 连续上榜功能将用 daily 快照中昨今两天 stars 做差值，得到真实增量。

### 本周新星

```
q: created:>YYYY-MM-DD（3个月前）stars:>100
sort: stars
order: desc
per_page: 25
```

### 经典项目（首次抓取50个，后续只更新stats）

```
q: stars:>10000
sort: stars
order: desc
per_page: 50
```

---

## 5个Tab结构

| Tab ID | 标题 | 数据来源 | 每页条数 |
|--------|------|---------|---------|
| today | 📈 今日热门 | GitHub Search（今日创建，stars desc） | 20 |
| week | 📅 本周热门 | GitHub Search（7天内创建，stars desc） | 20 |
| newStars | 🌟 本周新星 | GitHub Search（3月内创建，stars>100） | 20 |
| vibeCoding | 🤖 Vibe Coding | projects.json 中 isVibeCoding=true | 20 |
| classic | 🏆 经典项目 | projects.json 中 stars>10000，stars desc | 20 |
| favorites | ❤️ 我的收藏 | localStorage | 20 |

---

## 解读面板交互

- **桌面端**：固定右侧栏，宽度约40%，列表占60%
- **移动端**：点击项目后全屏覆盖，顶部有关闭按钮
- 面板内容直接从 `projects.json` + `stats.json` 读取，无需 API 调用
- 未选中项目时右侧显示空态提示「点击左侧项目查看 AI 解读」

---

## 收藏功能

- localStorage key：`github_explorer_favorites`
- 存储格式：`string[]`，内容为 fullName 数组
- 收藏上限：200个（超出时提示用户）

---

## 数据迁移策略（projects.json 结构变更）

### 迁移方式

使用独立迁移脚本 `scripts/migrate.ts`，**手动运行**，不在每日定时脚本中执行。

### 迁移脚本约定

```typescript
// scripts/migrate.ts
// 用法：npx tsx scripts/migrate.ts --from=1 --to=2

const migrations: Record<string, () => void> = {
  '1->2': migrateV1ToV2,
  '2->3': migrateV2ToV3,
};

function main() {
  const from = process.argv.find(a => a.startsWith('--from='))?.split('=')[1];
  const to   = process.argv.find(a => a.startsWith('--to='))?.split('=')[1];
  const key  = `${from}->${to}`;

  if (!migrations[key]) {
    console.error(`未找到迁移路径 ${key}`);
    process.exit(1);
  }

  // 1. 备份原文件
  fs.copyFileSync('data/projects.json', `data/projects.v${from}.bak.json`);
  console.log(`已备份为 data/projects.v${from}.bak.json`);

  // 2. 执行迁移
  migrations[key]();

  // 3. 验证新格式
  const result = JSON.parse(fs.readFileSync('data/projects.json', 'utf-8'));
  if (result.version !== to) throw new Error('迁移后版本号不匹配');

  console.log(`✅ 迁移完成 v${from} → v${to}`);
}
```

### 版本升级操作步骤（将来迭代时遵守）

1. 在 `scripts/migrate.ts` 新增 `migrateVxToVy()` 函数，实现字段转换逻辑
2. 在 `migrations` 对象中注册新路径
3. 本地运行 `npx tsx scripts/migrate.ts --from=x --to=y` 验证
4. 确认 `data/projects.json` 格式正确后提交
5. 同步更新 `CLAUDE.md` 中的类型定义和 `version` 常量
6. 保留 `.bak.json` 备份文件至少一个版本，确认线上稳定后再删除

### 前端兼容约定

- 前端读取 `projects.json` 时检查 `version` 字段
- 若 `version` 与前端期望版本不一致，展示全局警告条：
  「⚠️ 数据版本不匹配，请运行迁移脚本后重新部署」
- 不崩溃，尽量降级展示已有数据

```typescript
// app/page.tsx 构建时检查
const EXPECTED_DATA_VERSION = '1';
if (projectsData.version !== EXPECTED_DATA_VERSION) {
  console.warn(`[Data] 版本不匹配：期望 ${EXPECTED_DATA_VERSION}，实际 ${projectsData.version}`);
}
```

### stats.json 和 daily 快照的迁移

- `stats.json` 每日全量覆盖，结构变更时脚本直接按新格式写入，无需迁移
- `daily/` 快照为历史存档，结构变更后新快照按新格式，旧快照保持原样（前端读取旧快照时做字段缺失兼容）

---

## 首次运行策略（断点续跑）

**判断是否首次运行：**

```typescript
const isFirstRun = projectsData.projects.length === 0;
```

**断点续跑核心逻辑：**

- 脚本每成功分析一个项目，**立即写入** `projects.json`，不等全部完成再写
- 写入前先读取当前文件内容，append 新项目后写回（不覆盖已有数据）
- 重新运行时，已在 `projects.json` 中的项目自动跳过，从断点继续

**首次运行执行顺序：**

1. 抓取经典项目列表（stars>10000，stars desc，前50个）
2. 与 `projects.json` 比对，过滤掉已分析的
3. 对剩余项目逐个：抓README → 调Gemini → **立即 append 写入** → sleep 2秒
4. 全部完成后统一更新 `stats.json` 和生成 daily 快照

**首次运行前网页空态：**

- `projects.json` 存在但 `projects[]` 为空时
- 所有 Tab 显示：「数据准备中，首次运行约需 5 分钟，请稍后刷新」
- 不显示错误，不崩溃

**写入函数约定（必须照此实现）：**

```typescript
/**
 * 将单个项目 append 写入 projects.json（断点续跑安全）
 * 每次分析完一个项目立即调用，不批量写入
 */
async function appendProject(project: Project): Promise<void> {
  const filePath = 'data/projects.json';
  const current: ProjectsJson = readJsonSafe(filePath)
    ?? { version: '1', updatedAt: '', projects: [] };
  // 去重：fullName 已存在则跳过
  if (current.projects.some(p => p.fullName === project.fullName)) return;
  current.projects.push(project);
  current.updatedAt = new Date().toISOString();
  writeJsonSafe(filePath, current); // 先写 .bak 再覆盖
}
```

---

## 已读/未读状态

### 数据存储

- localStorage key：`github_explorer_read`
- 格式：`string[]`，内容为已读项目的 fullName 数组
- 永久保留，不过期，不上限

### 触发方式

- 每个项目行右侧加「✓ 标记已读」按钮
- 已标记则显示「已读」文字，点击可撤销
- 不自动标记（点击解读面板不算已读）

### 视觉表现

- 未读项目：正常亮度显示
- 已读项目：整行 `opacity: 0.45`，文字颜色降级为 `text-gray-500`
- 已读项目的收藏和链接仍可点击，不受影响
- 列表顶部加筛选：`全部 / 未读 / 已读`，默认「全部」

### 新项目高亮

- 当天新进入知识库的项目显示蓝色「NEW」角标
- 判断逻辑：`project.analyzedAt` 日期 = 今天
- 标记已读后「NEW」角标自动消失

### 撤销已读

- 已读状态下按钮变为「撤销已读」，点击恢复未读
- 从 localStorage 数组中移除对应 fullName

### 类型定义补充

```typescript
// 在 ProjectWithStats 中新增
isRead?: boolean;   // 来自 localStorage github_explorer_read
isNew?: boolean;    // analyzedAt 日期 = 今天
```

---

## 解读质量校验

每次 Gemini 返回内容后，必须经过两层校验才能写入。

### 第一层：格式校验（不通过 → 直接跳过，记录日志）

```typescript
function validateFormat(raw: string): ProjectAnalysis | null {
  // 1. 能否 JSON.parse
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { return null; }

  // 2. 必填字段存在性检查
  const required = ['positioning', 'useCases', 'audience', 'quickStart',
                    'pricing', 'vibeCodingScore', 'vibeCodingReason',
                    'isVibeCoding', 'communityActivity', 'category'];
  for (const key of required) {
    if (!(key in (parsed as object))) return null;
  }

  // 3. 关键字段类型检查
  const p = parsed as Record<string, unknown>;
  if (typeof p.vibeCodingScore !== 'number') return null;
  if (typeof p.isVibeCoding !== 'boolean') return null;
  if (!Array.isArray(p.useCases)) return null;
  if (!Array.isArray(p.competitors)) return null;

  return parsed as ProjectAnalysis;
}
```

格式校验失败时：跳过该项目，写入日志 `stage: 'json_parse', level: 'warn'`。

### 第二层：内容校验（不通过 → 自动修正 + 标记 needsReview）

```typescript
function sanitizeAndMark(analysis: ProjectAnalysis): ProjectAnalysis & { needsReview: boolean } {
  const issues: string[] = [];

  // positioning 超长截断
  if (analysis.positioning.length > 50) {
    analysis.positioning = analysis.positioning.slice(0, 50);
    issues.push('positioning_truncated');
  }

  // vibeCodingScore 超范围修正为 3
  if (analysis.vibeCodingScore < 1 || analysis.vibeCodingScore > 5) {
    analysis.vibeCodingScore = 3;
    issues.push('score_out_of_range');
  }

  // category 非法改为"其他"
  const validCategories: ProjectCategory[] = [
    'LLM框架','AI Agent','AI编程助手','CLI工具','前端框架',
    '后端框架','数据库','DevOps','测试工具','安全',
    '文档工具','移动开发','Prompt工程','其他'
  ];
  if (!validCategories.includes(analysis.category)) {
    analysis.category = '其他';
    issues.push('invalid_category');
  }

  // useCases 超出截断
  if (analysis.useCases.length > 5) {
    analysis.useCases = analysis.useCases.slice(0, 5);
    issues.push('use_cases_truncated');
  }

  // competitors 超出截断
  if (analysis.competitors.length > 5) {
    analysis.competitors = analysis.competitors.slice(0, 5);
    issues.push('competitors_truncated');
  }

  return {
    ...analysis,
    needsReview: issues.length > 0,
  };
}
```

### needsReview 字段

- 加入 `ProjectAnalysis` 类型定义：`needsReview?: boolean`
- 前端解读面板：若 `needsReview === true`，在卡片右上角显示 `⚠️ 待复审` 角标
- 不影响正常展示，仅作标记

### 完整校验流程

```
Gemini 返回原始字符串
  ↓
validateFormat()  →  失败 → 跳过 + 记日志
  ↓ 成功
sanitizeAndMark()  →  自动修正 + 标记 needsReview
  ↓
appendProject()  →  写入 projects.json
```

---

1. 读取 `projects.json`，建立 fullName Set
2. 当日抓取的所有项目与 Set 比对
3. **新项目**：抓 README + Issues → 调 Gemini → 立即 append 写入 projects.json
4. **已有项目**：只更新 stats.json，跳过 Gemini 调用
5. **例外**：stars 变化 > 50% 的已有项目，重新生成解读（更新 analyzedAt）
6. 首次运行时 projects.json 为空，走「首次运行策略」批量分析经典项目50个

---

## Gemini Prompt（固定模板，不可修改）

```text
你是一个技术项目解读助手。根据以下信息，用中文生成项目解读。要求：场景驱动，一针见血，不说废话。

项目名：{fullName}
描述：{description}
Star 数：{stars}
语言：{language}
Topics：{topics}
License：{license}
Issue 统计：开启 {openIssues} / 已关闭 {closedIssues} / 最近 Issue 更新于 {lastIssueAt}
README（节选）：{readme}

请严格按以下 JSON 格式输出，不要输出任何其他内容：
{
  "positioning": "一句话定位，30字以内",
  "useCases": [
    "你做X → 它帮你做Y（具体场景1）",
    "你做X → 它帮你做Y（具体场景2）",
    "你做X → 它帮你做Y（具体场景3）"
  ],
  "audience": "适合什么人用，一句话说明目标用户和典型场景",
  "quickStart": {
    "prerequisites": "前置条件或null",
    "steps": ["步骤1", "步骤2"],
    "note": "平台差异或null"
  },
  "competitors": [
    { "name": "竞品1", "method": "使用方式", "models": "支持模型", "pricing": "免费？" },
    { "name": "竞品2", "method": "使用方式", "models": "支持模型", "pricing": "免费？" }
  ],
  "pricing": "免费/部分免费/付费，简要说明",
  "vibeCodingScore": 3,
  "vibeCodingReason": "评分理由",
  "isVibeCoding": true,
  "communityActivity": "社区活跃度一句话评价，基于 Issue 开闭比和响应速度",
  "category": "分类标签（从以下列表选一个：LLM框架/AI Agent/AI编程助手/CLI工具/前端框架/后端框架/数据库/DevOps/测试工具/安全/文档工具/移动开发/Prompt工程/其他）"
}
```

---

## API Key 读取策略

```typescript
// 优先级：环境变量 → txt 文件 → 友好提示退出
function getApiKey(envVar: string, filePath: string): string {
  if (process.env[envVar]) return process.env[envVar]!;
  if (fs.existsSync(filePath)) return fs.readFileSync(filePath, 'utf-8').trim();
  console.error(`❌ 找不到 ${envVar}，请配置环境变量或创建 ${filePath}`);
  process.exit(1);
}

const GITHUB_TOKEN = getApiKey('GITHUB_TOKEN', 'Github Token.txt');
const GEMINI_API_KEY = getApiKey('GEMINI_API_KEY', 'Googole Ai Studo Api.txt');
```

---

## Keep-alive 机制

每月30号自动发一个空 commit，防止 GitHub Actions 因 60 天无活动被暂停。在 `daily-update.yml` 中实现。

---

## README 缓存

路径：`data/cache/readme-cache.json`

### 数据结构

```typescript
interface ReadmeCache {
  version: '1';
  entries: Record<string, ReadmeCacheEntry>; // key = fullName
}

interface ReadmeCacheEntry {
  fullName: string;
  content: string;        // README 前 3000 字
  fetchedAt: string;      // ISO8601
  etag?: string;          // GitHub API 返回的 ETag，用于条件请求
}
```

### 缓存策略

- **有效期**：7天。`fetchedAt` 超过7天的条目视为过期，重新抓取
- **大小上限**：单条 entry 最大 10KB（已截取3000字，正常不会超）
- **总条目上限**：500条。超出时删除最早 `fetchedAt` 的条目
- **写入时机**：成功抓取 README 后立即写入缓存，不等整体脚本完成
- **读取优先级**：先读缓存，缓存未命中或已过期才调 GitHub API

### 实现约定

```typescript
/**
 * 读取 README，优先从缓存获取
 * 缓存未命中或过期时调用 GitHub API 并更新缓存
 */
async function fetchReadme(fullName: string): Promise<string> {
  const cache = loadReadmeCache();
  const entry = cache.entries[fullName];
  const isExpired = !entry ||
    Date.now() - new Date(entry.fetchedAt).getTime() > 7 * 24 * 60 * 60 * 1000;

  if (!isExpired) return entry.content;

  // 缓存未命中或过期，重新抓取
  const content = await fetchReadmeFromGitHub(fullName); // 截取前3000字
  cache.entries[fullName] = {
    fullName,
    content,
    fetchedAt: new Date().toISOString(),
  };
  enforCacheLimits(cache);        // 超出500条时清理最旧的
  writeJsonSafe('data/cache/readme-cache.json', cache);
  return content;
}
```

---

## 全局搜索

### 交互方式

- 搜索框默认跨所有 Tab 搜索（不区分当前在哪个 Tab）
- 有搜索词时，结果展示在一个独立的「搜索结果」视图，覆盖当前 Tab 列表
- 清空搜索词后恢复原 Tab 视图

### 搜索范围

搜索同时匹配以下字段（前端内存过滤，无需 API）：

- `fullName`（项目名）
- `description`（原始描述）
- `analysis.positioning`（AI 定位）
- `analysis.useCases`（使用场景，数组 join 后匹配）
- `analysis.category`（分类）

### 搜索结果排序

默认按 `stars` 降序，可切换排序方式（与列表排序一致）

### 类型定义补充

```typescript
// 搜索结果视图复用 ProjectWithStats[]，不需要新类型
// 搜索状态：
interface SearchState {
  query: string;
  isActive: boolean;   // query 非空时为 true
  results: ProjectWithStats[];
}
```

---

## 浏览历史

### 记录规则

- 用户点击「✓ 标记已读」时，同步写入浏览历史
- 浏览历史 = 已读项目列表 + 阅读时间戳
- localStorage key：`github_explorer_history`

### 数据结构

```typescript
interface HistoryEntry {
  fullName: string;
  readAt: string;   // ISO8601，标记已读的时间
}

// localStorage 存储格式
// key: github_explorer_history
// value: JSON.stringify(HistoryEntry[])，按 readAt 降序
```

### 历史记录页

- 路由：`/history`（Next.js App Router 新页面）
- 展示：项目列表，按 `readAt` 时间倒序
- 每行显示：项目名↗、阅读时间、Star数、语言、一句话定位
- 点击行展开解读面板（与主页交互一致）
- 支持搜索和分类筛选（复用 SearchBar 组件）
- 右上角「清空历史」按钮，点击后二次确认再清除

### 上限与清理

- 最多保留 500 条历史记录
- 超出时自动删除最早的记录
- 用户可手动「清空历史」

### 导航入口

- Header 右上角加「📋 历史」链接，跳转 `/history`

---

## localStorage 版本管理

### 版本号存储方式

使用统一的 meta key 管理所有 localStorage 数据的版本：

```typescript
// key: github_explorer_meta
interface LocalStorageMeta {
  version: string;       // 当前数据版本，如 "1"
  migratedAt: string;    // 最近一次迁移时间 ISO8601
}
```

所有 localStorage key 一览：

```
github_explorer_meta        # 版本管理 meta
github_explorer_favorites   # string[]，收藏的 fullName 数组
github_explorer_read        # string[]，已读的 fullName 数组
github_explorer_history     # HistoryEntry[]，浏览历史
```

### 初始化与迁移流程

应用启动时（`app/lib/storage.ts` 的 `initStorage()` 函数）：

```typescript
const CURRENT_VERSION = '1';

export function initStorage(): void {
  const meta = readMeta();

  // 首次使用，无 meta
  if (!meta) {
    writeMeta({ version: CURRENT_VERSION, migratedAt: new Date().toISOString() });
    return;
  }

  // 版本一致，无需迁移
  if (meta.version === CURRENT_VERSION) return;

  // 版本不一致，尝试迁移
  const success = migrate(meta.version, CURRENT_VERSION);
  if (success) {
    writeMeta({ version: CURRENT_VERSION, migratedAt: new Date().toISOString() });
  } else {
    // 迁移失败，清空所有数据，从头开始
    clearAllStorage();
    writeMeta({ version: CURRENT_VERSION, migratedAt: new Date().toISOString() });
    console.warn('[Storage] 迁移失败，已清空本地数据');
  }
}
```

### 迁移函数约定

```typescript
/**
 * 版本迁移入口，按版本号链式执行
 * 每次结构变更在此新增对应的 migrateV1ToV2() 函数
 */
function migrate(from: string, to: string): boolean {
  try {
    if (from === '1' && to === '2') return migrateV1ToV2();
    if (from === '2' && to === '3') return migrateV2ToV3();
    // 跨版本迁移：链式执行
    if (from === '1' && to === '3') {
      return migrateV1ToV2() && migrateV2ToV3();
    }
    return false; // 未知版本组合，迁移失败
  } catch {
    return false;
  }
}

// 示例：V1 → V2 迁移（将来结构变更时照此实现）
function migrateV1ToV2(): boolean {
  // 读取旧数据 → 转换格式 → 写入新格式
  // 若任何步骤报错，catch 返回 false
  return true;
}
```

### 读写函数约定（storage.ts 统一封装，禁止在组件里直接操作 localStorage）

```typescript
// 所有读取加 try-catch，解析失败返回默认值
export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem('github_explorer_favorites');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function getHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem('github_explorer_history');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

// 写入统一加 try-catch，失败时 console.warn 不 throw
export function setFavorites(data: string[]): void {
  try {
    localStorage.setItem('github_explorer_favorites', JSON.stringify(data));
  } catch (e) { console.warn('[Storage] 写入收藏失败', e); }
}
```

### 版本升级时的操作步骤（将来迭代时遵守）

1. 在 `storage.ts` 新增 `migrateVxToVy()` 函数
2. 在 `migrate()` 中注册新的迁移路径
3. 将 `CURRENT_VERSION` 常量 +1
4. 在 `migrate()` 中补充跨版本链式路径
5. 不要删除旧的迁移函数（历史用户可能从任意旧版本升级）

---

## 项目去重逻辑

### 跨 Tab 去重

同一项目可能同时出现在多个 Tab（如"今日热门"和"Vibe Coding精选"）。

**脚本层面**：`projects.json` 以 `fullName` 为唯一键，天然去重，不存重复条目。

**前端层面**：

- 每个 Tab 独立展示，**不做跨 Tab 去重**——同一项目出现在多个 Tab 是正常现象
- 同一 Tab 内：若 GitHub API 返回重复项，前端用 `fullName` 去重后再渲染

### 收藏的数据来源

- 用户点击 ❤️ 时，存入 localStorage 的是 `fullName` 字符串数组
- "我的收藏" Tab 渲染时从 `projects.json` + `stats.json` 按 fullName 查找完整数据
- 若收藏项目已从知识库删除，跳过不渲染，不报错

### 前端合并数据约定

```typescript
function mergeProjectData(
  projects: Project[],
  statsMap: Record<string, ProjectStats>
): ProjectWithStats[] {
  return projects.map(p => ({
    ...p,
    stats: statsMap[p.fullName] ?? defaultStats(p.fullName),
  }));
}

function defaultStats(fullName: string): ProjectStats {
  return {
    fullName, stars: 0, forks: 0, openIssues: 0, closedIssues: 0,
    watchers: 0, sponsors: 0, pushedAt: '', updatedAt: '',
    todayStarsDelta: 0, fetchedAt: '', isArchived: false, isDead: false,
  };
}
```

---

```typescript
// 读取昨日 daily 快照中对应项目的 stars
// 用今日 API 返回的 stars 减去昨日值
// 若无昨日数据（新项目），设为 0
const yesterday = loadDailySnapshot(yesterdayDate);
const prevStars = yesterday?.stats?.[fullName]?.stars ?? currentStars;
const todayStarsDelta = currentStars - prevStars;
```

---

## 定时脚本规则

- 读取环境变量：`GITHUB_TOKEN`、`GEMINI_API_KEY`
- 若缺失则从根目录文件读取：`Github Token.txt`、`Googole Ai Studo Api.txt`
- 执行顺序：抓列表 → 比对知识库 → 新项目调Gemini → 更新stats → 生成daily快照 → 选亮点 → 写JSON
- README 截取前 3000 字
- 每次 Gemini 调用间隔 sleep **2秒**（gemini-2.5-flash 免费版 RPM=500，2秒完全安全）
- 今日亮点的 Gemini 调用单独计入，不影响项目解读的调用间隔
- **重试**：失败后 2s→4s→8s 重试3次，仍失败跳过
- **写入安全**：先备份 `.bak`，写完验证 JSON 格式再覆盖
- 单个项目失败不中断整体流程

---

## Gemini Prompt（固定，不可修改）

```
你是一个技术项目解读助手。根据以下信息，用中文生成项目解读。要求：场景驱动，一针见血，不说废话。

项目名：{fullName}
描述：{description}
Star 数：{stars}
语言：{language}
Topics：{topics}
License：{license}
Issue 统计：开启 {openIssues} / 已关闭 {closedIssues} / 最近更新 {lastIssueAt}
README（节选）：{readme}

请严格按以下 JSON 格式输出，不要输出任何其他内容：
{
  "positioning": "一句话定位，30字以内",
  "useCases": [
    "你做X → 它帮你做Y（场景1）",
    "你做X → 它帮你做Y（场景2）",
    "你做X → 它帮你做Y（场景3）"
  ],
  "audience": "适合什么人，一句话",
  "quickStart": {
    "prerequisites": "前置条件，如 Node.js>=18、Python>=3.10，没有则填 null",
    "steps": [
      "第一步命令或操作",
      "第二步命令或操作",
      "第三步命令或操作（可选）"
    ],
    "note": "平台差异或注意事项，如仅支持 macOS/Linux，没有则填 null"
  },
  "competitors": [
    { "name": "竞品1", "method": "使用方式", "models": "支持模型", "pricing": "是否免费" },
    { "name": "竞品2", "method": "使用方式", "models": "支持模型", "pricing": "是否免费" }
  ],
  "pricing": "免费/部分免费/付费，简要说明",
  "vibeCodingScore": 3,
  "vibeCodingReason": "评分理由",
  "isVibeCoding": true,
  "communityActivity": "社区活跃度一句话，基于Issue开闭比",
  "category": "LLM框架|AI Agent|AI编程助手|CLI工具|前端框架|后端框架|数据库|DevOps|测试工具|安全|文档工具|移动开发|Prompt工程|其他"
}
```

## 今日亮点 Prompt（固定，不可修改）

```
从以下今日新增项目中，挑选2~3个最值得关注的，优先选vibe coding相关工具。

项目列表：{projectsSummary}

输出格式：
{
  "highlights": [
    { "fullName": "owner/repo", "reason": "推荐理由，30字以内" }
  ]
}
```

---

## 日志系统

### 运行摘要日志（每次脚本运行后写入）

路径：`data/logs/YYYY-MM-DD.json`

```typescript
interface RunLog {
  date: string;           // "YYYY-MM-DD"
  startedAt: string;      // ISO8601
  finishedAt: string;     // ISO8601
  durationSeconds: number;
  success: boolean;       // 无 fatal 错误则为 true
  stats: {
    fetched: number;      // 本次抓取总项目数
    newProjects: number;  // 新项目数（调用了 Gemini）
    skipped: number;      // 跳过数（已有解读）
    geminiCalls: number;  // 实际调用 Gemini 次数
    statsUpdated: number; // 更新 stats 的项目数
  };
  errors: RunError[];     // 所有错误记录
}

interface RunError {
  time: string;           // ISO8601
  level: 'warn' | 'error' | 'fatal';
  project?: string;       // fullName，若与特定项目相关
  stage: 'github_fetch' | 'readme_fetch' | 'gemini_call' | 'json_parse' | 'file_write' | 'git_push';
  message: string;        // 原始错误信息
  retries: number;        // 重试次数
  skipped: boolean;       // 是否跳过该项目继续
}
```

### 需要记录的错误场景

| 场景 | level | 是否中断 |
|------|-------|---------|
| GitHub API 限流（403/429） | error | 否，跳过该项目 |
| GitHub Token 过期/无效 | fatal | 是，整体退出 |
| Gemini API 限流（429） | error | 否，重试3次后跳过 |
| Gemini API Key 无效 | fatal | 是，整体退出 |
| Gemini 返回 JSON 解析失败 | warn | 否，跳过该项目 |
| README 抓取失败 | warn | 否，用空字符串继续 |
| JSON 文件写入失败 | fatal | 是，整体退出 |
| git push 失败 | fatal | 是，整体退出 |

### 前端状态角标

- 读取最新的 `data/logs/YYYY-MM-DD.json`
- `errors` 为空 → 右下角绿色 ⚫ + 「上次更新成功」
- `errors` 有 warn/error → 黄色 ⚫ + 「上次更新有部分失败」
- `success: false`（有 fatal）→ 红色 ⚫ + 「上次更新失败」
- 悬停角标时显示 tooltip：更新时间 + 错误条数

---

## 自动创建 GitHub Issue

### 触发条件

脚本运行结束时，若 `RunLog.errors` 中存在 `level: 'fatal'` 或 `errors.length > 5`（超过5个项目失败），自动调用 GitHub API 创建 Issue。

### Issue 格式

```
标题：🚨 [YYYY-MM-DD] 定时任务运行异常

内容：
## 运行摘要
- 时间：{startedAt} ~ {finishedAt}
- 成功：{success}
- 新项目：{newProjects}，跳过：{skipped}，错误：{errors.length}

## 错误详情
| 时间 | 阶段 | 项目 | 错误信息 | 重试次数 |
|------|------|------|---------|---------|
| ... | ... | ... | ... | ... |

## 处理建议
- fatal: github_fetch → 检查 GITHUB_TOKEN 是否过期
- fatal: gemini_call → 检查 GEMINI_API_KEY 是否有效
- fatal: git_push → 检查 Actions permissions: contents: write

/label bug, automated
```

### 实现方式

使用 `@octokit/rest` 的 `octokit.issues.create()`，在脚本末尾调用，不影响主流程。

---

## 数据版本号

所有 JSON 文件加 `"version"` 字段，前端读取时做兼容判断：

```typescript
// projects.json / stats.json / logs/*.json
{
  "version": "1",
  "updatedAt": "...",
  ...
}

// 前端读取时
if (data.version !== "1") {
  console.warn("数据版本不匹配，可能需要重新运行脚本");
}
```

版本升级规则：

- 新增字段（向后兼容）→ 不升级版本，前端对缺失字段显示"暂无"
- 删除或重命名字段（破坏性变更）→ 版本号 +1，同时更新前端兼容代码

---

### 解读面板：快速上手区块渲染约定

```
🚀 快速上手

前置条件：Node.js >= 18                    ← prerequisites 不为 null 时显示
─────────────────────────────────
$ npm install -g @anthropic-ai/claude-code  ← 每步单独一行，代码块样式
$ claude                                     ← 右侧加「复制」按钮
─────────────────────────────────
⚠️ 仅支持 macOS / Linux                    ← note 不为 null 时显示
```

- 每个 step 右侧显示「📋」复制按钮，点击复制该行命令到剪贴板
- 复制后按钮变为「✓ 已复制」，1.5秒后恢复

---

### 「已死」判定条件（两个条件同时满足）

1. `pushedAt` 距今超过 **365 天**（超过1年无 commit）
2. `openIssues / closedIssues > 5`（Issue 开闭比超过 5:1）

> closedIssues 需通过 GitHub API 单独获取（`GET /repos/{owner}/{repo}` 返回 `open_issues_count`，closed 需调 Issues API 统计）。为节省 API 调用，**只对已在知识库超过30天的项目做健康度检查**，新项目跳过。

### 健康度字段

在 `ProjectStats` 中新增：

```typescript
interface ProjectStats {
  // ...已有字段...
  closedIssues: number;          // 新增，已关闭 Issue 数
  isArchived: boolean;           // 新增，GitHub 官方 archived 状态
  isDead: boolean;               // 新增，脚本判定已死
  deadDetectedAt?: string;       // 新增，首次判定为已死的时间 ISO8601
}
```

### 脚本处理逻辑

每日脚本运行时，对知识库中超过30天的项目执行健康度检查：

```typescript
function isDead(stats: ProjectStats): boolean {
  const daysSinceCommit =
    (Date.now() - new Date(stats.pushedAt).getTime()) / (1000 * 60 * 60 * 24);
  const issueRatio = stats.closedIssues > 0
    ? stats.openIssues / stats.closedIssues
    : stats.openIssues > 10 ? 999 : 0; // 无 closed issue 且 open>10 视为比例极高
  return daysSinceCommit > 365 && issueRatio > 5;
}
```

- 判定为已死：`stats.isDead = true`，`stats.deadDetectedAt = now`
- 已死项目**不从 `projects.json` 删除**，保留解读数据供历史记录使用
- 写入 `stats.json` 的 `isDead: true` 即可

### 前端过滤逻辑

- 所有 Tab 列表渲染时过滤掉 `isDead: true` 的项目
- 历史记录页（`/history`）**不过滤**，已死项目仍可在历史中查看
- 收藏 Tab：已死项目仍显示，但加灰色「⚰️ 已停止维护」角标提示

### GitHub 官方 archived 项目

- `isArchived: true` 的项目（GitHub 官方标记归档）直接视为已死，无需满足两个条件
- 同样过滤出列表，保留历史记录

---

## 人工干预机制

### 功能：一键触发重新解读

**入口位置：**

- 解读面板右上角加「🔄 重新解读」按钮
- `needsReview: true` 的项目，按钮高亮显示（黄色边框）

**触发链路：**

```
用户点击「🔄 重新解读」
  ↓
新标签页跳转到：
https://github.com/{owner}/{repo_name}/actions/workflows/re-analyze.yml
  ↓
用户在 GitHub Actions 页面点「Run workflow」
并在输入框填入项目 fullName（如 vercel/next.js）
  ↓
re-analyze.yml 运行（只处理这一个项目）
  ↓
删除 projects.json 中该项目旧解读 → 调 Gemini → 写入 → push
  ↓
Vercel 自动重新部署，约 2~3 分钟后生效
```

**前端交互：**

- 点击按钮后，按钮变为「⏳ 已提交，2~3 分钟后刷新页面」
- 按钮禁用，防止重复点击
- 状态存 sessionStorage（刷新后恢复正常）

**re-analyze.yml 配置要点：**

```yaml
name: Re-analyze Project
on:
  workflow_dispatch:
    inputs:
      fullName:
        description: '项目 fullName，如 vercel/next.js'
        required: true
        type: string
permissions:
  contents: write
```

**脚本逻辑（scripts/re-analyze.ts）：**

```typescript
// 1. 读取 projects.json
// 2. 找到 fullName 对应的项目，删除其 analysis 字段
// 3. 重新抓取 README
// 4. 调用 Gemini 生成新解读
// 5. 经过质量校验（validateFormat + sanitizeAndMark）
// 6. 写回 projects.json（appendProject 的更新版，支持覆盖已有项目）
// 7. 更新 analyzedAt 为当前时间，needsReview 重置为 false
```

**所有可配置常量统一写入 `lib/config.ts`，禁止在其他文件硬编码：**

```typescript
// app/lib/config.ts

// ── GitHub 仓库配置 ──────────────────────────────
// vibe coding 时替换为实际值
export const GITHUB_REPO_OWNER = 'your-username';
export const GITHUB_REPO_NAME  = 'github-explorer';
export const RE_ANALYZE_WORKFLOW_URL =
  `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/actions/workflows/re-analyze.yml`;

// ── AI 模型配置 ──────────────────────────────────
// 模型废弃时只需修改此处，无需全局搜索替换
// 当前模型：gemini-2.5-flash（免费，Google AI Studio）
// 升级参考：https://ai.google.dev/gemini-api/docs/models
export const GEMINI_MODEL = 'gemini-2.5-flash';

// ── 数据版本 ─────────────────────────────────────
// 与 projects.json 的 version 字段保持一致
// 结构变更时同步 +1，并运行 scripts/migrate.ts
export const EXPECTED_DATA_VERSION = '1';

// ── localStorage 版本 ────────────────────────────
// 与 storage.ts 的 CURRENT_VERSION 保持一致
export const LS_VERSION = '1';

// ── 业务常量 ─────────────────────────────────────
export const FAVORITES_LIMIT = 200;    // 收藏上限
export const HISTORY_LIMIT   = 500;    // 历史记录上限
export const README_MAX_CHARS = 3000;  // README 截取长度
export const GEMINI_SLEEP_MS  = 2000;  // Gemini 调用间隔
export const HEALTH_CHECK_DAYS = 30;   // 健康度检查的项目最小入库天数
export const DEAD_COMMIT_DAYS  = 365;  // 判定已死：无 commit 天数
export const DEAD_ISSUE_RATIO  = 5;    // 判定已死：issue 开闭比阈值
```

> **模型升级步骤：**
>
> 1. 在 [Google AI Studio 模型列表](https://ai.google.dev/gemini-api/docs/models) 确认新模型名
> 2. 修改 `config.ts` 中的 `GEMINI_MODEL`
> 3. 本地运行 `npx tsx scripts/fetch-and-analyze.ts` 验证新模型输出格式正常
> 4. 提交即生效

---

## 移动端适配

### 项目列表字段分级显示

**桌面端**（`md` 断点以上，全部字段）：

```
项目名↗  ⭐12.3k  +320今日  🍴450  🐛32  TypeScript  MIT  3天前提交  [Vibe🤖]
一句话简介
```

**移动端**（`md` 断点以下，精简字段）：

```
项目名↗  ⭐12.3k  TypeScript  [Vibe🤖]
一句话简介
```

隐藏字段：今日增量、Fork数、Issue数、License、最近提交时间

### 解读面板

- 桌面端：固定右侧栏，宽度约 40%
- 移动端：全屏覆盖，顶部固定关闭按钮（`✕`），内容可滚动

### Header

- 桌面端：标题 + 更新时间 + 「📋 历史」链接 + 状态角标，水平排列
- 移动端：标题 + 状态角标，「📋 历史」收进汉堡菜单或底部导航

### Tab 切换

- 桌面端：横向 Tab 栏，显示完整文字
- 移动端：横向滚动 Tab 栏，文字缩短（「📈 今日」「📅 本周」「🌟 新星」「🤖 Vibe」「🏆 经典」「❤️ 收藏」）

### 搜索框

- 桌面端：常驻显示在 Tab 栏右侧
- 移动端：点击放大镜图标展开，收起时只显示图标

### Tailwind 断点约定

- 移动端优先（mobile-first）
- 分界点统一用 `md:`（768px）
- 不使用 `sm:` 和 `lg:` 避免断点混乱

---

## 空状态与异常状态 UI

### 各场景定义（前端必须覆盖，不能崩溃）

| 场景 | 显示内容 |
|------|---------|
| 首次部署，`projects[]` 为空 | 所有 Tab 显示：「数据准备中，首次运行约需 5 分钟，请稍后刷新」 |
| 某 Tab 无数据（如 Vibe Coding 精选暂无项目） | 「暂无数据，今日尚未发现相关项目」|
| 搜索结果为空 | 「未找到相关项目，试试其他关键词」|
| 解读面板未选中项目 | 右侧显示：「← 点击左侧项目查看 AI 解读」|
| 解读字段缺失（`competitors` 为空数组） | 对应区块显示「暂无竞品信息」，不渲染表格 |
| `needsReview: true` | 卡片右上角显示黄色 `⚠️ 待复审` 角标，不影响其他内容展示 |
| stats 数据缺失（`todayStarsDelta` 为0） | 不显示增量标签，不显示"±0" |
| 日志文件不存在或解析失败 | 状态角标显示灰色 ⚫「暂无运行记录」|

### Skeleton 加载状态

- 仅在**客户端 hydration 阶段**显示 skeleton（收藏 Tab 需要读 localStorage，有短暂延迟）
- 其他 Tab 数据来自静态 JSON，构建时已渲染，无需 skeleton

---

```yaml
# .github/workflows/daily-update.yml 完整配置要点
name: Daily Update

on:
  schedule:
    - cron: '0 1 * * *'   # UTC 01:00 = 北京时间 09:00
  workflow_dispatch:       # 支持手动触发，方便调试

permissions:
  contents: write
  issues: write

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4        # 固定主版本号，不用 @main 或 @master
      - uses: actions/setup-node@v4
        with:
          node-version: '20'             # 固定 Node.js 大版本，不用 latest
          cache: 'npm'
      - run: npm ci                      # 用 ci 不用 install，速度更快且可复现
      - run: npx tsx scripts/fetch-and-analyze.ts
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      - name: Commit and push data
        run: |
          git config user.name 'github-actions[bot]'
          git config user.email 'github-actions[bot]@users.noreply.github.com'
          git add data/
          git diff --staged --quiet || git commit -m "chore: daily update $(date -u +%Y-%m-%d)"
          git push
```

**版本维护规则：**

- `actions/checkout` 和 `actions/setup-node` 使用主版本号（`@v4`），不固定到 patch，GitHub 官方保证主版本向后兼容
- Node.js 使用大版本号（`'20'`），每年 10 月随 LTS 版本升级一次
- 每半年检查一次 Action 版本是否有新的主版本发布（如 `@v5`）
- 不使用 `@latest` 或 `@main`，版本不可预期

---

## 静态页面数据读取

```typescript
// app/page.tsx
import projectsData from '@/data/projects.json';
import statsData from '@/data/stats.json';
// tsconfig.json 需开启 resolveJsonModule: true
// 不使用 fetch，不使用 getServerSideProps
```

---

## 环境变量

```bash
# .env.local（不提交git）
GITHUB_TOKEN=ghp_xxxxxxxxxx
GEMINI_API_KEY=AIza_xxxxxxxxxx
```

脚本自动回退读取根目录：`Github Token.txt`、`Googole Ai Studo Api.txt`

---

## 禁止事项

- 禁止在客户端发起任何网络请求
- 禁止手动编辑 `data/` 下的 JSON 文件
- 禁止引入 `@anthropic-ai/sdk`
- 禁止使用 `any` 类型
- 禁止引入 `axios`，用原生 `fetch`
- 禁止自动安装未在此文件提到的 npm 包，先问我
- 禁止在组件里直接操作 localStorage，统一通过 `lib/storage.ts` 封装函数
- 禁止硬编码模型名、仓库名、业务数值常量，统一在 `lib/config.ts` 定义后引用

---

## V2 预留（暂不实现）

- 连续上榜热力图（daily 快照已在攒数据）
- 真实 Star 增量排序（基于 daily 快照差值）
- 跨设备收藏同步

---

## 本地开发

```bash
npm install
npx tsx scripts/fetch-and-analyze.ts  # 手动跑一次
npm run dev
```

---

## 部署版本检测

### 机制

每次 Vercel 部署时，Next.js 会生成唯一的 `buildId`（存在 `/_next/static/buildManifest.json` 或 `next.config.js` 可读取）。页面定期轮询一个轻量版本文件，发现与当前不一致时提示用户刷新。

### 实现方案

**Step 1：构建时生成版本文件**

在 `next.config.js` 中写入构建时间戳作为版本标识：

```javascript
// next.config.js
const buildTime = Date.now().toString();
module.exports = {
  env: {
    BUILD_TIME: buildTime,
  },
};
```

**Step 2：同时将版本写入静态文件**

在 `public/version.json` 中每次构建时写入：

```json
{ "buildTime": "1740700000000" }
```

通过 `package.json` 的 build 脚本自动生成：

```json
{
  "scripts": {
    "build": "node scripts/gen-version.js && next build"
  }
}
```

```typescript
// scripts/gen-version.js
const fs = require('fs');
fs.writeFileSync('public/version.json', JSON.stringify({
  buildTime: Date.now().toString()
}));
```

**Step 3：前端轮询检测**

```typescript
// app/components/VersionChecker.tsx
'use client';

import { useEffect, useState } from 'react';

export function VersionChecker() {
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const currentBuildTime = process.env.BUILD_TIME;

  useEffect(() => {
    const CHECK_INTERVAL = 10 * 60 * 1000; // 每10分钟检查一次

    async function check() {
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`); // 禁用缓存
        const data = await res.json();
        if (data.buildTime !== currentBuildTime) {
          setHasNewVersion(true);
        }
      } catch { /* 网络失败静默忽略 */ }
    }

    const timer = setInterval(check, CHECK_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  if (!hasNewVersion) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white
                    text-sm text-center py-2 flex items-center justify-center gap-3">
      <span>🔄 页面有新版本</span>
      <button
        onClick={() => window.location.reload()}
        className="underline font-medium hover:no-underline"
      >
        点击刷新
      </button>
      <button
        onClick={() => setHasNewVersion(false)}
        className="opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}
```

**Step 4：挂载到根布局**

```typescript
// app/layout.tsx
import { VersionChecker } from './components/VersionChecker';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <VersionChecker />
        {children}
      </body>
    </html>
  );
}
```

### 行为约定

- 提示条固定在页面顶部，蓝色背景，不遮挡操作
- 右侧有 ✕ 关闭按钮，关闭后本次会话不再提示
- 点击「点击刷新」执行 `window.location.reload()`
- 轮询间隔 10 分钟，不影响性能
- 网络请求失败时静默忽略，不报错

---

## 版本迭代记录（CHANGELOG）

不需要正式的语义化版本，在 CLAUDE.md 文件顶部维护一个简单的迭代记录即可：

```
## 迭代记录
- 2026-02-28 V1.0 初始版本上线
- 2026-03-15 V1.1 新增连续上榜热力图
- 2026-04-01 V2.0 数据结构升级（运行 migrate.ts v1->v2）
```

**规则：**

- 每次有功能变更或数据结构变更时，在此追加一行
- 数据结构变更必须注明「运行 migrate.ts vX->vY」
- localStorage 结构变更必须注明「LS_VERSION +1」
- 不需要写具体 commit hash，保持简洁可读

---

## 每次 Session 工作方式

1. 读 CLAUDE.md + PRD.md
2. 确认当前模块，完成后告诉我再继续
3. **推荐顺序**：`types.ts` → mock数据 → 前端页面 → 脚本 → GitHub Actions
4. 每个函数写 JSDoc 注释
5. 不要一次性生成所有文件，按模块来
6. 中途需求变化：直接在 Cursor 里说，同步更新 CLAUDE.md 和代码
