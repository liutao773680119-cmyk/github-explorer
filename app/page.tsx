import * as fs from 'fs';
import * as path from 'path';
import HomePage from './components/HomePage';
import type { ProjectsJson, StatsJson, DailySnapshot } from './lib/types';

// 构建时读取数据
function loadJson<T>(filePath: string): T | null {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) return null;
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8')) as T;
}

function findLatestSnapshot(): DailySnapshot | null {
  const dailyDir = path.resolve(process.cwd(), 'data/daily');
  if (!fs.existsSync(dailyDir)) return null;
  const files = fs.readdirSync(dailyDir).filter((f) => f.endsWith('.json')).sort().reverse();
  if (files.length === 0) return null;
  return JSON.parse(fs.readFileSync(path.join(dailyDir, files[0]), 'utf-8')) as DailySnapshot;
}

export default function Page() {
  const projectsJson = loadJson<ProjectsJson>('data/projects.json') ?? { version: '1', updatedAt: '', projects: [] };
  const statsJson = loadJson<StatsJson>('data/stats.json') ?? { version: '1', updatedAt: '', stats: {} };
  const snapshot = findLatestSnapshot();

  return (
    <HomePage
      projectsJson={projectsJson}
      statsJson={statsJson}
      snapshot={snapshot}
    />
  );
}
