<!-- RELAY:START -->
# 任务计划（Relay Kit）

## Goal
在不改变核心业务逻辑前提下，保证跨模型接力时可快速恢复上下文，并持续推进当前业务任务。

## Current Phase
Phase 0: 初始化与规则统一（in_progress）

## Active Phases
| Phase | 任务 | 状态 |
|------|------|------|
| 0 | 规则统一与初始化验证 | in_progress |
| 1 | 当前业务任务执行 | pending |
| 2 | 回归验证与结果验收 | pending |

## 当前工作清单（接力必看）
- [ ] 确认会话启动顺序可用
- [ ] 确认交接快照写入可用
- [ ] 确认提示词契约可用

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| `AGENTS.md` 作为单一规则源 | 降低规则分叉与提示词漂移 |
| 文件化上下文管理 | 降低跨模型切换丢上下文风险 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none) | - | - |

## Handoff Checklist（结束前必须完成）
- [ ] 更新 `progress.md` 的 `Latest Handoff Snapshot`
- [ ] 更新本文件 `Current Phase` 和清单状态
- [ ] 将新发现写入 `findings.md`
- [ ] 写明“下一步第一条命令”

## Legacy Archive
以下为历史原始计划，保留用于追溯。
<!-- RELAY:END -->
