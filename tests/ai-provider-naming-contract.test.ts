import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const checks = [
    {
        file: 'scripts/fetch-and-analyze.ts',
        forbidden: ['调用 Gemini', 'gemini_call', 'geminiCalls', 'geminiSleep'],
    },
    {
        file: 'scripts/re-analyze.ts',
        forbidden: ['调用 Gemini', 'Gemini 重新解读失败', 'geminiSleep'],
    },
    {
        file: 'scripts/lib/ai-client.ts',
        forbidden: ['geminiSleep'],
    },
] as const;

test('源码层 AI provider 命名不再依赖旧 gemini 命名', () => {
    for (const check of checks) {
        const source = fs.readFileSync(path.resolve(process.cwd(), check.file), 'utf8');
        for (const forbidden of check.forbidden) {
            assert.equal(
                source.includes(forbidden),
                false,
                `${check.file} 不应包含旧命名: ${forbidden}`,
            );
        }
    }
});
