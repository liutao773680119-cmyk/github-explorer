<!-- RELAY:START -->
# Findings（Relay Kit）

## Requirements（当前需求）
- 统一 Antigravity、Cursor、VS Code/Codex 的项目规则与技能调用习惯。
- 在模型额度切换时，确保能快速知道“上一步做了什么、下一步做什么”。

## Confirmed Facts（已确认事实）
1. 本项目规则源为 `AGENTS.md`。
2. 接力上下文文件为 `progress.md` / `task_plan.md` / `findings.md` / `修改记录_会话备忘.md`。
3. 提示词契约文件为 `模型接力开发_固定提示词与命令.txt`（英文别名 `relay_prompts.txt`）。

## Technical Baseline（项目技术基线）
- 数据目录：`涨停数据/`
- 模型目录：`text2vec_model/`
- 主构建脚本：`bert_model/stock_network_v31_windows.py`
- 查询服务：`bert_model/stock_query_app.py`
- 输出文件：`master_network_v31.json`

## Key Decisions（关键决策）
| Decision | Rationale |
|----------|-----------|
| 单一规则源 + 三端适配层 | 避免不同工具规则冲突 |
| 固定开场/收尾提示词 | 降低切换丢上下文风险 |

## Open Questions（待确认）
1. 是否需要额外自动化触发（pre-commit/任务命令）来执行 preflight。

## Legacy Archive
以下为历史原始 findings，保留用于追溯。
<!-- RELAY:END -->
