---
name: relay-start
description: Use when starting a new session or taking over from another model, and context must be reconstructed before execution.
---

# Relay Start

## 目标
让新会话或接力会话在 30 秒内恢复上下文并进入执行。

## 执行步骤
1. 按顺序读取：
   - `AGENTS.md`
   - `progress.md`
   - `task_plan.md`
   - `findings.md`
   - `修改记录_会话备忘.md`
2. 输出 `Session Context`：
   - Developer/Branch(or No-Git)
   - Active Goal
   - Current Phase
   - Next First Command
   - Open TODO Top3
3. 执行启动检查：
   - `Get-Location`
   - `Get-ChildItem -Force`
   - `if (Test-Path .git) { git status --short } else { 'NO_GIT_REPO' }`
   - `python -V`
4. 执行 `Next First Command` 并继续当前任务。


