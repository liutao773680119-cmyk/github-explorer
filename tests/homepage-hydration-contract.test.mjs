import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const homePagePath = path.resolve(process.cwd(), 'app/components/HomePage.tsx');
const homePageSource = fs.readFileSync(homePagePath, 'utf8');

assert.equal(
  homePageSource.includes("const [favorites, setFavorites] = useState<string[]>([]);"),
  true,
  'HomePage 应该以空 favorites 作为首屏初始状态，避免服务端和客户端首屏不一致',
);

assert.equal(
  homePageSource.includes("const [readList, setReadList] = useState<string[]>([]);"),
  true,
  'HomePage 应该以空 readList 作为首屏初始状态，避免服务端和客户端首屏不一致',
);

assert.equal(
  homePageSource.includes('useEffect(() => {'),
  true,
  'HomePage 应该在 hydration 后再同步本地存储状态',
);

assert.equal(
  homePageSource.includes("const [favorites, setFavorites] = useState<string[]>(() => {"),
  false,
  'HomePage 不应在 useState 初始化函数里直接读取 window/localStorage',
);

assert.equal(
  homePageSource.includes("const [readList, setReadList] = useState<string[]>(() => {"),
  false,
  'HomePage 不应在 useState 初始化函数里直接读取 window/localStorage',
);

console.log('homepage hydration contract passed');
