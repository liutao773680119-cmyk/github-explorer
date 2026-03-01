'use client';

import type { SortKey } from '../lib/types';

interface SearchBarProps {
    query: string;
    onQueryChange: (query: string) => void;
    sortKey: SortKey;
    onSortChange: (key: SortKey) => void;
    readFilter: 'all' | 'unread' | 'read';
    onReadFilterChange: (filter: 'all' | 'unread' | 'read') => void;
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'stars', label: '⭐ Stars' },
    { key: 'todayStarsDelta', label: '📈 今日增长' },
    { key: 'createdAt', label: '🆕 最新创建' },
    { key: 'pushedAt', label: '🔄 最近活跃' },
    { key: 'vibeCodingScore', label: '🤖 Vibe 评分' },
];

export default function SearchBar({
    query, onQueryChange, sortKey, onSortChange, readFilter, onReadFilterChange,
}: SearchBarProps) {
    return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '12px 0' }}>
            {/* 搜索输入 */}
            <div style={{ flex: 1, minWidth: 200 }}>
                <input
                    className="input"
                    type="text"
                    placeholder="🔍 搜索项目名、描述、定位..."
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                />
            </div>

            {/* 排序选择 */}
            <select
                className="btn"
                value={sortKey}
                onChange={(e) => onSortChange(e.target.value as SortKey)}
                style={{ cursor: 'pointer', appearance: 'auto' }}
            >
                {SORT_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
            </select>

            {/* 已读筛选 */}
            <div style={{ display: 'flex', gap: 4 }}>
                {(['all', 'unread', 'read'] as const).map((f) => (
                    <button
                        key={f}
                        className={`btn ${readFilter === f ? 'btn-primary' : ''}`}
                        onClick={() => onReadFilterChange(f)}
                        style={{ fontSize: 12, padding: '4px 10px' }}
                    >
                        {f === 'all' ? '全部' : f === 'unread' ? '未读' : '已读'}
                    </button>
                ))}
            </div>
        </div>
    );
}
