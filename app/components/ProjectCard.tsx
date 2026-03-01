'use client';

import type { ProjectWithStats } from '../lib/types';

interface ProjectCardProps {
    project: ProjectWithStats;
    isSelected: boolean;
    onSelect: (fullName: string) => void;
    onToggleFavorite: (fullName: string) => void;
    onToggleRead: (fullName: string) => void;
}

function formatNumber(n: number): string {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
}

export default function ProjectCard({
    project, isSelected, onSelect, onToggleFavorite, onToggleRead,
}: ProjectCardProps) {
    const { stats, analysis, isNew, isRead: read, isFavorite } = project;

    return (
        <div
            className={`card ${isSelected ? 'card-active' : ''} ${read ? 'project-read' : ''} animate-fade-in`}
            style={{ padding: '14px 16px', cursor: 'pointer', position: 'relative' }}
            onClick={() => onSelect(project.fullName)}
        >
            {/* Badge 行 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                {isNew && !read && <span className="badge badge-new">NEW</span>}
                {analysis.isVibeCoding && <span className="badge badge-vibe">🤖 Vibe</span>}
                {stats.isDead && <span className="badge badge-dead">💀 不活跃</span>}
                {analysis.needsReview && <span className="badge badge-review">⚠️ 待复审</span>}
            </div>

            {/* 标题行 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="project-link"
                    style={{ fontWeight: 600, fontSize: 15 }}
                >
                    {project.fullName} ↗
                </a>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-accent)', padding: '1px 6px', borderRadius: 4 }}>
                    {project.language}
                </span>
            </div>

            {/* AI 定位 */}
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '6px 0', lineHeight: 1.5 }}>
                {analysis.positioning}
            </p>

            {/* Stats 行 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>⭐ {formatNumber(stats.stars)}</span>
                {stats.todayStarsDelta > 0 && (
                    <span style={{ color: 'var(--accent-green)' }}>+{stats.todayStarsDelta}</span>
                )}
                <span>🍴 {formatNumber(stats.forks)}</span>
                <span>{analysis.category}</span>

                {/* 操作按钮 */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                    <button
                        className="project-fav"
                        onClick={() => onToggleFavorite(project.fullName)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, opacity: isFavorite ? 1 : 0.4 }}
                        title={isFavorite ? '取消收藏' : '收藏'}
                    >
                        {isFavorite ? '❤️' : '🤍'}
                    </button>
                    <button
                        onClick={() => onToggleRead(project.fullName)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)' }}
                    >
                        {read ? '撤销已读' : '✓ 标记已读'}
                    </button>
                </div>
            </div>
        </div>
    );
}
