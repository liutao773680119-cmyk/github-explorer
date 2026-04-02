import test from 'node:test';
import assert from 'node:assert/strict';

import type { RunErrorStage, RunLog } from '../app/lib/types';

const legacyStage: RunErrorStage = 'gemini_call';

const legacyRunLog: RunLog = {
    version: '1',
    date: '2026-04-01',
    startedAt: '2026-04-01T04:33:54.405Z',
    finishedAt: '2026-04-01T04:40:01.209Z',
    durationSeconds: 367,
    success: true,
    stats: {
        fetched: 111,
        newProjects: 20,
        skipped: 91,
        geminiCalls: 24,
        statsUpdated: 111,
    },
    errors: [
        {
            time: '2026-04-01T04:39:15.936Z',
            level: 'warn',
            project: 'openedclaude/claude-reviews-claude',
            stage: legacyStage,
            message: 'Gemini 解读失败或校验不通过',
            retries: 0,
            skipped: true,
        },
    ],
};

test('RunLog 类型兼容仓库内历史日志字段', () => {
    assert.equal(legacyRunLog.errors[0]?.stage, 'gemini_call');
    assert.equal(legacyRunLog.stats.geminiCalls, 24);
});
