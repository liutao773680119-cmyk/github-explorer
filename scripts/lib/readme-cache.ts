// scripts/lib/readme-cache.ts — README 缓存层

import { readJsonSafe, writeJsonSafe, dataPath, daysBetween, todayString } from './utils';
import { fetchReadme } from './github';

interface CacheEntry {
    content: string;
    fetchedAt: string;
}

interface ReadmeCache {
    entries: Record<string, CacheEntry>;
}

const CACHE_FILE = dataPath('cache', 'readme-cache.json');
const CACHE_MAX_AGE_DAYS = 7;
const CACHE_MAX_ENTRIES = 500;

let _cache: ReadmeCache | null = null;

/**
 * 加载缓存
 */
function loadCache(): ReadmeCache {
    if (!_cache) {
        _cache = readJsonSafe<ReadmeCache>(CACHE_FILE) ?? { entries: {} };
    }
    return _cache;
}

/**
 * 保存缓存
 */
function saveCache(): void {
    if (_cache) {
        writeJsonSafe(CACHE_FILE, _cache);
    }
}

/**
 * 缓存条目是否过期
 */
function isExpired(entry: CacheEntry): boolean {
    return daysBetween(entry.fetchedAt, todayString()) > CACHE_MAX_AGE_DAYS;
}

/**
 * 确保缓存不超过上限（淘汰最旧的条目）
 */
function evictIfNeeded(cache: ReadmeCache): void {
    const keys = Object.keys(cache.entries);
    if (keys.length <= CACHE_MAX_ENTRIES) return;

    // 按 fetchedAt 排序，淘汰最旧的
    const sorted = keys.sort(
        (a, b) => new Date(cache.entries[a].fetchedAt).getTime() - new Date(cache.entries[b].fetchedAt).getTime()
    );

    const toRemove = sorted.slice(0, keys.length - CACHE_MAX_ENTRIES);
    for (const key of toRemove) {
        delete cache.entries[key];
    }
}

/**
 * 带缓存的 README 获取
 * - 命中且未过期 → 返回缓存
 * - 未命中或过期 → 调 API → 写缓存
 */
export async function fetchReadmeWithCache(fullName: string): Promise<string> {
    const cache = loadCache();
    const entry = cache.entries[fullName];

    if (entry && !isExpired(entry)) {
        return entry.content;
    }

    // 调 API
    const content = await fetchReadme(fullName);

    cache.entries[fullName] = {
        content,
        fetchedAt: todayString(),
    };

    evictIfNeeded(cache);
    saveCache();

    return content;
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): { total: number; expired: number } {
    const cache = loadCache();
    const entries = Object.values(cache.entries);
    return {
        total: entries.length,
        expired: entries.filter(isExpired).length,
    };
}
