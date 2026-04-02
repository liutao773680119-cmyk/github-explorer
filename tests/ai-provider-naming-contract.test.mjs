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
  {
    file: 'app/lib/types.ts',
    forbidden: ['gemini_call', 'geminiCalls'],
  },
];

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

console.log('ai provider naming contract passed');
