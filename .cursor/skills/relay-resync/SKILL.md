---
name: relay-resync
description: Use when context drifts, outputs conflict with the current phase, or an interrupted session must be realigned.
---

# Relay Re-sync

## 使用时机
- 模型疑似遗忘上下文
- 输出与当前阶段明显不一致
- 切换工具后出现执行偏移

## 执行步骤
1. 重新按顺序读取：
   - `AGENTS.md`
   - `progress.md`
   - `task_plan.md`
   - `findings.md`
2. 重新输出：
   - Active Goal
   - Current Phase
   - Next First Command
   - Open TODO Top3
3. 与用户确认“是否按 Next First Command 继续执行”。


