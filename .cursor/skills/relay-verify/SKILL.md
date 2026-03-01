---
name: relay-verify
description: Use when about to claim completion or a fix, and verification evidence must be recorded first.
---

# Relay Verify

## 目标
避免“未验证先宣称完成”。

## 执行步骤
1. 运行验证命令（按项目实际）并记录结果。
2. 将验证结果写入 `progress.md` 当前会话记录。
3. 仅在验证通过后才可声明“完成/修复”。
4. 更新 `Latest Handoff Snapshot` 的：
   - Completed This Session
   - Open TODO
   - Next First Command


