<!-- RELAY:START -->
# Copilot Instructions（Project-wide）

## Single Source of Truth
- Follow `AGENTS.md` as the primary project rule source.
- If any instruction conflicts with older local rule files, `AGENTS.md` wins.

## Startup Context Order
Read in this order before making changes:
1. `AGENTS.md`
2. `task_registry.md`
3. `progress.md`
4. `task_plan.md`
5. `findings.md`
6. `修改记录_会话备忘.md`

## Required Behavior
1. All responses and task lists must be in `中文`.
2. Display stock codes as 6-digit strings.
4. Do not claim completion before running verification commands.
5. For complex tasks, keep `task_plan.md`, `findings.md`, `progress.md` updated.

## Project Baseline
- Main builder: `bert_model/stock_network_v31_windows.py`
- Query app: `bert_model/stock_query_app.py`
- Model folder: `text2vec_model/`
- Output file: `master_network_v31.json`
<!-- RELAY:END -->
