import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const configSource = fs.readFileSync(path.resolve(process.cwd(), 'app/lib/config.ts'), 'utf8');
const dailyWorkflow = fs.readFileSync(path.resolve(process.cwd(), '.github/workflows/daily-update.yml'), 'utf8');
const reanalyzeWorkflow = fs.readFileSync(path.resolve(process.cwd(), '.github/workflows/re-analyze.yml'), 'utf8');

assert.equal(
  configSource.includes("export const DEFAULT_AI_PROVIDER: AIProviderId = 'deepseek';"),
  true,
  'app/lib/config.ts 默认 provider 应为 deepseek',
);

assert.equal(
  dailyWorkflow.includes('AI_PROVIDER: deepseek'),
  true,
  'daily-update.yml 默认 provider 应为 deepseek',
);

assert.equal(
  reanalyzeWorkflow.includes("default: 'deepseek'"),
  true,
  're-analyze.yml 的默认 provider 输入应为 deepseek',
);

assert.equal(
  reanalyzeWorkflow.includes("${{ github.event.inputs.provider || 'deepseek' }}"),
  true,
  're-analyze.yml 的运行时默认 provider 应为 deepseek',
);

console.log('default provider contract passed');
