'use client';

import type { TabId } from '../lib/types';

const TABS: { id: TabId; label: string; emoji: string }[] = [
    { id: 'today', label: '今日热门', emoji: '📈' },
    { id: 'week', label: '本周热门', emoji: '📅' },
    { id: 'newStars', label: '本周新星', emoji: '🌟' },
    { id: 'vibeCoding', label: 'Vibe Coding', emoji: '🤖' },
    { id: 'classic', label: '经典项目', emoji: '🏆' },
    { id: 'favorites', label: '我的收藏', emoji: '❤️' },
];

interface TabSwitcherProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    counts?: Partial<Record<TabId, number>>;
}

export default function TabSwitcher({ activeTab, onTabChange, counts }: TabSwitcherProps) {
    return (
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', borderBottom: '1px solid var(--border-primary)', padding: '0 0 0 0' }}>
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.emoji} {tab.label}
                    {counts?.[tab.id] !== undefined && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
                            ({counts[tab.id]})
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
}
