import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('deepseek fallback token 文件名保持稳定', () => {
    const repoRoot = process.cwd();
    const configSource = fs.readFileSync(path.resolve(repoRoot, 'app/lib/config.ts'), 'utf8');
    const expectedFile = 'deepseek token.txt';

    assert.equal(
        configSource.includes(`apiKeyFile: '${expectedFile}'`),
        true,
        `app/lib/config.ts 中 deepseek.apiKeyFile 应指向 ${expectedFile}`,
    );
});
