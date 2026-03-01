// scripts/lib/utils.ts — 脚本专用工具函数

import * as fs from 'fs';
import * as path from 'path';

/**
 * 获取 API Key：优先环境变量 → 回退到 txt 文件 → 退出
 */
export function getApiKey(envVar: string, fileFallback: string): string {
    const fromEnv = process.env[envVar];
    if (fromEnv?.trim()) return fromEnv.trim();

    const filePath = path.resolve(process.cwd(), fileFallback);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8').trim();
        if (content) return content;
    }

    console.error(`[FATAL] API Key not found: env=${envVar}, file=${fileFallback}`);
    process.exit(1);
}

/**
 * 安全读取 JSON 文件（不存在或解析失败返回 null）
 */
export function readJsonSafe<T>(filePath: string): T | null {
    try {
        if (!fs.existsSync(filePath)) return null;
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw) as T;
    } catch (err) {
        console.warn(`[WARN] Failed to read JSON: ${filePath}`, err);
        return null;
    }
}

/**
 * 安全写入 JSON 文件（先写 .bak 再覆盖，确保原子性）
 */
export function writeJsonSafe(filePath: string, data: unknown): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    const bakPath = filePath + '.bak';

    // 如果原文件存在，先备份
    if (fs.existsSync(filePath)) {
        fs.copyFileSync(filePath, bakPath);
    }

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        // 成功后删除备份
        if (fs.existsSync(bakPath)) {
            fs.unlinkSync(bakPath);
        }
    } catch (err) {
        // 写入失败，从备份恢复
        if (fs.existsSync(bakPath)) {
            fs.copyFileSync(bakPath, filePath);
            fs.unlinkSync(bakPath);
        }
        throw err;
    }
}

/**
 * Promise 延时
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 截取文本到指定字符数
 */
export function truncate(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars) + '…';
}

/**
 * 获取 ISO 格式的今天日期字符串（YYYY-MM-DD）
 */
export function todayString(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * 获取 ISO 格式的时间戳
 */
export function nowISO(): string {
    return new Date().toISOString();
}

/**
 * 计算两个日期之间的天数差
 */
export function daysBetween(dateA: string, dateB: string): number {
    const a = new Date(dateA).getTime();
    const b = new Date(dateB).getTime();
    return Math.abs(Math.round((b - a) / (1000 * 60 * 60 * 24)));
}

/**
 * 数据目录的路径解析
 */
export function dataPath(...segments: string[]): string {
    return path.resolve(process.cwd(), 'data', ...segments);
}
