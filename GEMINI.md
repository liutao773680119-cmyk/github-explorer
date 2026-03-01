<!-- RELAY:START -->
# GEMINI.md（Workspace 兼容桥接）

## Rule Source
- 本项目规则主文件是 `AGENTS.md`。
- 进入会话后先读取：`AGENTS.md -> task_registry.md -> progress.md -> task_plan.md -> findings.md -> 修改记录_会话备忘.md`。

## Mandatory Constraints
1. 所有输出使用 `中文`。
2. 对外展示股票代码统一 6 位。
3. 数据目录使用 `涨停数据/`。
4. 未验证前不得声称完成。

## Handoff
会话结束前更新 `progress.md` 的 `Latest Handoff Snapshot`，并写入 `修改记录_会话备忘.md` 的 Session Record。
<!-- RELAY:END -->
