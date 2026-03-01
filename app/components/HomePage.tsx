'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import TabSwitcher from './TabSwitcher';
import SearchBar from './SearchBar';
import ProjectCard from './ProjectCard';
import AnalysisPanel from './AnalysisPanel';
import { mergeData, filterByTab, sortProjects, searchProjects, isDataStale } from '../lib/data';
import { initStorage, getFavorites, addFavorite, removeFavorite, getReadList, markAsRead, markAsUnread, isFavorite, isRead } from '../lib/storage';
import { STALE_HOURS, EXPECTED_DATA_VERSION } from '../lib/config';
import type { ProjectsJson, StatsJson, DailySnapshot, TabId, SortKey, ProjectWithStats } from '../lib/types';

interface HomePageProps {
    projectsJson: ProjectsJson;
    statsJson: StatsJson;
    snapshot: DailySnapshot | null;
}

export default function HomePage({ projectsJson, statsJson, snapshot }: HomePageProps) {
    const [activeTab, setActiveTab] = useState<TabId>('today');
    const [sortKey, setSortKey] = useState<SortKey>('stars');
    const [searchQuery, setSearchQuery] = useState('');
    const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<string[]>([]);
    const [readList, setReadList] = useState<string[]>([]);

    // 初始化 localStorage
    useEffect(() => {
        initStorage();
        setFavorites(getFavorites());
        setReadList(getReadList());
    }, []);

    // 合并数据
    const allProjects = useMemo(
        () => mergeData(projectsJson, statsJson, favorites, readList),
        [projectsJson, statsJson, favorites, readList]
    );

    // 版本检查
    const versionMismatch = projectsJson.version !== EXPECTED_DATA_VERSION;
    const dataStale = isDataStale(projectsJson.updatedAt, STALE_HOURS);
    const isEmpty = projectsJson.projects.length === 0;

    // 筛选 + 搜索 + 排序
    const displayProjects = useMemo(() => {
        let list: ProjectWithStats[];

        if (searchQuery.trim()) {
            list = searchProjects(allProjects, searchQuery);
        } else {
            list = filterByTab(allProjects, activeTab, snapshot);
        }

        // 已读筛选
        if (readFilter === 'unread') list = list.filter((p) => !p.isRead);
        if (readFilter === 'read') list = list.filter((p) => p.isRead);

        return sortProjects(list, sortKey);
    }, [allProjects, activeTab, snapshot, searchQuery, sortKey, readFilter]);

    // 当前选中的项目
    const selected = useMemo(
        () => (selectedProject ? allProjects.find((p) => p.fullName === selectedProject) ?? null : null),
        [allProjects, selectedProject]
    );

    // Tab 数量
    const counts = useMemo(() => {
        const c: Partial<Record<TabId, number>> = {};
        c.favorites = allProjects.filter((p) => p.isFavorite).length;
        c.vibeCoding = allProjects.filter((p) => p.analysis.isVibeCoding).length;
        c.classic = allProjects.filter((p) => p.stats.stars > 10000).length;
        return c;
    }, [allProjects]);

    // 操作处理
    const handleToggleFavorite = (fullName: string) => {
        if (isFavorite(fullName)) {
            removeFavorite(fullName);
        } else {
            addFavorite(fullName);
        }
        setFavorites(getFavorites());
    };

    const handleToggleRead = (fullName: string) => {
        if (isRead(fullName)) {
            markAsUnread(fullName);
        } else {
            markAsRead(fullName);
        }
        setReadList(getReadList());
    };

    return (
        <>
            <Header />
            <main className="container" style={{ paddingTop: 16, paddingBottom: 48 }}>
                {/* 警告条 */}
                {versionMismatch && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', marginBottom: 12, fontSize: 13, color: 'var(--accent-amber)' }}>
                        ⚠️ 数据版本不匹配，请运行迁移脚本后重新部署
                    </div>
                )}
                {dataStale && !isEmpty && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', padding: '8px 14px', marginBottom: 12, fontSize: 13, color: 'var(--accent-amber)' }}>
                        ⚠️ 数据更新于 {new Date(projectsJson.updatedAt).toLocaleString('zh-CN')}，可能已过期
                    </div>
                )}

                {isEmpty ? (
                    <div className="empty-state" style={{ minHeight: '60vh' }}>
                        <div className="empty-state-icon">📊</div>
                        <h2 style={{ fontSize: 20, marginBottom: 8 }}>数据准备中</h2>
                        <p>首次运行约需 5 分钟，请稍后刷新</p>
                    </div>
                ) : (
                    <>
                        {/* Tab 切换 */}
                        <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} counts={counts} />

                        {/* 搜索 + 排序 */}
                        <SearchBar
                            query={searchQuery}
                            onQueryChange={setSearchQuery}
                            sortKey={sortKey}
                            onSortChange={setSortKey}
                            readFilter={readFilter}
                            onReadFilterChange={setReadFilter}
                        />

                        {/* 主体布局 */}
                        <div className="split-layout">
                            {/* 左侧列表 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200 }}>
                                {searchQuery && (
                                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
                                        搜索「{searchQuery}」找到 {displayProjects.length} 个结果
                                    </div>
                                )}
                                {displayProjects.length === 0 ? (
                                    <div className="empty-state">
                                        <div className="empty-state-icon">🔍</div>
                                        <p>{searchQuery ? '没有找到匹配的项目' : '当前标签页暂无项目'}</p>
                                    </div>
                                ) : (
                                    displayProjects.map((p) => (
                                        <ProjectCard
                                            key={p.fullName}
                                            project={p}
                                            isSelected={selectedProject === p.fullName}
                                            onSelect={setSelectedProject}
                                            onToggleFavorite={handleToggleFavorite}
                                            onToggleRead={handleToggleRead}
                                        />
                                    ))
                                )}
                            </div>

                            {/* 右侧解读面板 */}
                            <AnalysisPanel project={selected} />
                        </div>
                    </>
                )}
            </main>
        </>
    );
}
