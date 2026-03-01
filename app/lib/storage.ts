// app/lib/storage.ts — localStorage 统一封装（禁止组件直接操作 localStorage）

import { LS_VERSION, FAVORITES_LIMIT, HISTORY_LIMIT } from './config';
import type { LocalStorageMeta, HistoryEntry } from './types';

// ── Keys ────────────────────────────────────────
const KEYS = {
    meta: 'github_explorer_meta',
    favorites: 'github_explorer_favorites',
    read: 'github_explorer_read',
    history: 'github_explorer_history',
} as const;

// ── 内部工具 ─────────────────────────────────────

function readRaw<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
}

function writeRaw(key: string, data: unknown): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(data));
}

// ── 初始化 + 迁移 ────────────────────────────────

function readMeta(): LocalStorageMeta | null {
    return readRaw<LocalStorageMeta>(KEYS.meta);
}

function writeMeta(meta: LocalStorageMeta): void {
    writeRaw(KEYS.meta, meta);
}

function clearAllStorage(): void {
    if (typeof window === 'undefined') return;
    for (const key of Object.values(KEYS)) {
        localStorage.removeItem(key);
    }
}

function migrate(from: string, to: string): boolean {
    try {
        // V1 是初始版本，暂无迁移逻辑
        // 将来新增 migrateV1ToV2() 等
        if (from === to) return true;
        return false; // 未知版本组合
    } catch {
        return false;
    }
}

/**
 * 应用启动时调用，确保 localStorage 版本正确
 */
export function initStorage(): void {
    const meta = readMeta();

    if (!meta) {
        writeMeta({ version: LS_VERSION, migratedAt: new Date().toISOString() });
        return;
    }

    if (meta.version === LS_VERSION) return;

    const success = migrate(meta.version, LS_VERSION);
    if (success) {
        writeMeta({ version: LS_VERSION, migratedAt: new Date().toISOString() });
    } else {
        clearAllStorage();
        writeMeta({ version: LS_VERSION, migratedAt: new Date().toISOString() });
        console.warn('[Storage] 迁移失败，已清空本地数据');
    }
}

// ── 收藏 ─────────────────────────────────────────

export function getFavorites(): string[] {
    return readRaw<string[]>(KEYS.favorites) ?? [];
}

export function addFavorite(fullName: string): boolean {
    const favs = getFavorites();
    if (favs.includes(fullName)) return true;
    if (favs.length >= FAVORITES_LIMIT) return false;
    favs.push(fullName);
    writeRaw(KEYS.favorites, favs);
    return true;
}

export function removeFavorite(fullName: string): void {
    const favs = getFavorites().filter((f) => f !== fullName);
    writeRaw(KEYS.favorites, favs);
}

export function isFavorite(fullName: string): boolean {
    return getFavorites().includes(fullName);
}

// ── 已读 ─────────────────────────────────────────

export function getReadList(): string[] {
    return readRaw<string[]>(KEYS.read) ?? [];
}

export function markAsRead(fullName: string): void {
    const reads = getReadList();
    if (!reads.includes(fullName)) {
        reads.push(fullName);
        writeRaw(KEYS.read, reads);
    }
    // 同步写入浏览历史
    addHistoryEntry(fullName);
}

export function markAsUnread(fullName: string): void {
    const reads = getReadList().filter((r) => r !== fullName);
    writeRaw(KEYS.read, reads);
}

export function isRead(fullName: string): boolean {
    return getReadList().includes(fullName);
}

// ── 浏览历史 ─────────────────────────────────────

export function getHistory(): HistoryEntry[] {
    return readRaw<HistoryEntry[]>(KEYS.history) ?? [];
}

function addHistoryEntry(fullName: string): void {
    const history = getHistory().filter((h) => h.fullName !== fullName);
    history.unshift({ fullName, readAt: new Date().toISOString() });
    if (history.length > HISTORY_LIMIT) {
        history.length = HISTORY_LIMIT;
    }
    writeRaw(KEYS.history, history);
}

export function clearHistory(): void {
    writeRaw(KEYS.history, []);
}
