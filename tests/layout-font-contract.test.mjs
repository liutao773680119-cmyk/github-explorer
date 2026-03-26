import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const layoutPath = path.resolve(process.cwd(), 'app/layout.tsx');
const layoutSource = fs.readFileSync(layoutPath, 'utf8');

assert.equal(
  layoutSource.includes('next/font/google'),
  false,
  'app/layout.tsx 不应再依赖 next/font/google',
);

assert.equal(
  layoutSource.includes('Inter('),
  false,
  'app/layout.tsx 不应再调用 Inter()',
);

console.log('layout font contract passed');
