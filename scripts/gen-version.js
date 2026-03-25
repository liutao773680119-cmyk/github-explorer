import fs from 'node:fs';

// 构建时生成版本标识文件，用于前端检测新版本
const versionData = { buildTime: Date.now().toString() };

// 确保 public 目录存在
if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

fs.writeFileSync('public/version.json', JSON.stringify(versionData));
console.log(`[gen-version] buildTime: ${versionData.buildTime}`);
