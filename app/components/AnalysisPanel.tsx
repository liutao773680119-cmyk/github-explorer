'use client';

import type { ProjectWithStats } from '../lib/types';

interface AnalysisPanelProps {
    project: ProjectWithStats | null;
}

export default function AnalysisPanel({ project }: AnalysisPanelProps) {
    if (!project) {
        return (
            <div className="empty-state" style={{ position: 'sticky', top: 80 }}>
                <div className="empty-state-icon">📖</div>
                <p>点击左侧项目查看 AI 解读</p>
            </div>
        );
    }

    const { analysis, stats } = project;

    return (
        <div className="animate-slide-in" style={{ position: 'sticky', top: 80, maxHeight: 'calc(100vh - 100px)', overflowY: 'auto', paddingRight: 8 }}>
            {/* 标题 */}
            <div style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, marginBottom: 4 }}>
                    {project.fullName}
                    {analysis.needsReview && <span className="badge badge-review" style={{ marginLeft: 8 }}>⚠️ 待复审</span>}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{analysis.positioning}</p>
            </div>

            {/* 使用场景 */}
            <Section title="💡 使用场景">
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {analysis.useCases.map((uc, i) => (
                        <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '4px 0', borderBottom: '1px solid var(--border-primary)' }}>
                            {uc}
                        </li>
                    ))}
                </ul>
            </Section>

            {/* 目标用户 */}
            <Section title="👤 适合人群">
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{analysis.audience}</p>
            </Section>

            {/* 快速开始 */}
            <Section title="🚀 快速开始">
                {analysis.quickStart.prerequisites && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                        前置条件：{analysis.quickStart.prerequisites}
                    </p>
                )}
                <ol style={{ paddingLeft: 18 }}>
                    {analysis.quickStart.steps.map((step, i) => (
                        <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '2px 0' }}>
                            <code style={{ background: 'var(--bg-accent)', padding: '1px 6px', borderRadius: 4, fontSize: 12 }}>
                                {step}
                            </code>
                        </li>
                    ))}
                </ol>
                {analysis.quickStart.note && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>💡 {analysis.quickStart.note}</p>
                )}
            </Section>

            {/* 竞品对比 */}
            {analysis.competitors.length > 0 && (
                <Section title="⚔️ 竞品对比">
                    <div style={{ display: 'grid', gap: 8 }}>
                        {analysis.competitors.map((c, i) => (
                            <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', padding: 8, background: 'var(--bg-accent)', borderRadius: 'var(--radius-sm)' }}>
                                <strong>{c.name}</strong> · {c.method} · {c.models} · {c.pricing}
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* Vibe Coding 评分 */}
            <Section title="🤖 Vibe Coding 评分">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                            <span key={n} style={{ fontSize: 18, opacity: n <= analysis.vibeCodingScore ? 1 : 0.2 }}>
                                ⚡
                            </span>
                        ))}
                    </div>
                    <span style={{ fontSize: 20, fontWeight: 700 }}>{analysis.vibeCodingScore}/5</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{analysis.vibeCodingReason}</p>
            </Section>

            {/* 定价 + 社区 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Section title="💰 定价">
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{analysis.pricing}</p>
                </Section>
                <Section title="🏘️ 社区">
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{analysis.communityActivity}</p>
                </Section>
            </div>

            {/* 统计数据 */}
            <Section title="📊 数据">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    <Stat label="Stars" value={stats.stars.toLocaleString()} />
                    <Stat label="Forks" value={stats.forks.toLocaleString()} />
                    <Stat label="Open Issues" value={stats.openIssues.toLocaleString()} />
                    <Stat label="Closed Issues" value={stats.closedIssues.toLocaleString()} />
                    <Stat label="Watchers" value={stats.watchers.toLocaleString()} />
                    <Stat label="今日增长" value={`+${stats.todayStarsDelta}`} highlight />
                </div>
            </Section>
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
            {children}
        </div>
    );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div style={{ padding: 8, background: 'var(--bg-accent)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: highlight ? 'var(--accent-green)' : 'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
        </div>
    );
}
