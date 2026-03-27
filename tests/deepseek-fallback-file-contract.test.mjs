import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const configSource = fs.readFileSync(path.resolve(repoRoot, 'app/lib/config.ts'), 'utf8');
const expectedFile = 'deepseek token.txt';

assert.equal(
  fs.existsSync(path.resolve(repoRoot, expectedFile)),
  true,
  `仓库根目录应存在 DeepSeek 本地回退文件: ${expectedFile}`,
);

assert.equal(
  configSource.includes(`apiKeyFile: '${expectedFile}'`),
  true,
  `app/lib/config.ts 中 deepseek.apiKeyFile 应指向 ${expectedFile}`,
);

console.log('deepseek fallback file contract passed');
