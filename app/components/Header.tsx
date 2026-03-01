'use client';

import Link from 'next/link';

export default function Header() {
    return (
        <header
            style={{
                borderBottom: '1px solid var(--border-primary)',
                background: 'var(--bg-secondary)',
                position: 'sticky',
                top: 0,
                zIndex: 50,
            }}
        >
            <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🔥</span>
                    <span style={{ fontSize: 16, fontWeight: 700, background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        GitHub 热门解读
                    </span>
                </Link>
                <nav style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Link href="/history" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        📋 历史
                    </Link>
                    <a
                        href="https://github.com/liutao773680119-cmyk/github-explorer"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 13, color: 'var(--text-secondary)' }}
                    >
                        ⭐ GitHub
                    </a>
                </nav>
            </div>
        </header>
    );
}
