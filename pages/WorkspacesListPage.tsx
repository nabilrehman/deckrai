/**
 * WorkspacesListPage - Digital Sales Room Management Dashboard
 *
 * Industry-standard workspace list inspired by Dock.us and Trumpet:
 * - Multiple views (All, My Workspaces, Active, Recent)
 * - Card and Table view toggle
 * - Engagement analytics preview
 * - Quick actions (Edit, View, Share, Duplicate, Delete)
 * - Filtering and sorting
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserWorkspaces, deleteWorkspace } from '../services/workspaceService';
import { Workspace } from '../types';

type ViewType = 'all' | 'mine' | 'active' | 'recent';
type DisplayMode = 'grid' | 'table';
type SortField = 'name' | 'updatedAt' | 'createdAt' | 'viewCount';
type SortOrder = 'asc' | 'desc';

const WorkspacesListPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // View state
    const [currentView, setCurrentView] = useState<ViewType>('all');
    const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<SortField>('updatedAt');
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

    // Modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Load workspaces
    useEffect(() => {
        if (user) {
            loadWorkspaces();
        }
    }, [user]);

    const loadWorkspaces = async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const data = await getUserWorkspaces(user.uid);
            setWorkspaces(data);
        } catch (err) {
            console.error('Error loading workspaces:', err);
            setError('Failed to load workspaces');
        } finally {
            setLoading(false);
        }
    };

    // Filter and sort workspaces
    const filteredWorkspaces = useMemo(() => {
        let result = [...workspaces];

        // Apply view filter
        switch (currentView) {
            case 'mine':
                result = result.filter(w => w.ownerId === user?.uid);
                break;
            case 'active':
                // Sort by engagement/views, take top engaged
                result = result.filter(w => (w.analytics?.totalViews || 0) > 0);
                break;
            case 'recent':
                // Last 7 days
                const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                result = result.filter(w => w.updatedAt > weekAgo);
                break;
        }

        // Apply search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(w =>
                (w.title || w.name || '').toLowerCase().includes(q) ||
                w.companyName?.toLowerCase().includes(q)
            );
        }

        // Apply sort
        result.sort((a, b) => {
            let aVal: any, bVal: any;

            switch (sortField) {
                case 'name':
                    aVal = (a.title || a.name || '').toLowerCase();
                    bVal = (b.title || b.name || '').toLowerCase();
                    break;
                case 'viewCount':
                    aVal = a.analytics?.totalViews || 0;
                    bVal = b.analytics?.totalViews || 0;
                    break;
                case 'createdAt':
                    aVal = a.createdAt;
                    bVal = b.createdAt;
                    break;
                case 'updatedAt':
                default:
                    aVal = a.updatedAt;
                    bVal = b.updatedAt;
            }

            if (sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
            }
            return aVal < bVal ? 1 : -1;
        });

        return result;
    }, [workspaces, currentView, searchQuery, sortField, sortOrder, user]);

    // Handle delete
    const handleDelete = async () => {
        if (!workspaceToDelete) return;

        setDeleting(true);
        try {
            await deleteWorkspace(workspaceToDelete.id);
            setWorkspaces(prev => prev.filter(w => w.id !== workspaceToDelete.id));
            setDeleteModalOpen(false);
            setWorkspaceToDelete(null);
        } catch (err) {
            console.error('Error deleting workspace:', err);
        } finally {
            setDeleting(false);
        }
    };

    // Format date
    const formatDate = (timestamp: number): string => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    // Get engagement level
    const getEngagementLevel = (workspace: Workspace): { level: string; color: string } => {
        const views = workspace.analytics?.totalViews || 0;
        const uniqueViewers = workspace.analytics?.uniqueViewers || 0;

        if (views > 50 || uniqueViewers > 10) {
            return { level: 'Hot', color: 'text-orange-600 bg-orange-100' };
        }
        if (views > 20 || uniqueViewers > 5) {
            return { level: 'Warm', color: 'text-amber-600 bg-amber-100' };
        }
        if (views > 0) {
            return { level: 'Active', color: 'text-green-600 bg-green-100' };
        }
        return { level: 'New', color: 'text-gray-600 bg-gray-100' };
    };

    // Copy share link
    const copyShareLink = (workspace: Workspace) => {
        const url = `${window.location.origin}/room/${workspace.id}`;
        navigator.clipboard.writeText(url);
        // Could add toast notification here
    };

    // Views configuration
    const views = [
        { id: 'all' as ViewType, label: 'All Workspaces', icon: '📁' },
        { id: 'mine' as ViewType, label: 'My Workspaces', icon: '👤' },
        { id: 'active' as ViewType, label: 'Active', icon: '🔥' },
        { id: 'recent' as ViewType, label: 'Recent', icon: '🕐' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading workspaces...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/app')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </button>
                            <h1 className="text-xl font-bold text-gray-900">Digital Sales Rooms</h1>
                        </div>

                        <button
                            onClick={() => navigate('/workspace/new/edit')}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            New Room
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="text-2xl font-bold text-gray-900">{workspaces.length}</div>
                        <div className="text-sm text-gray-500">Total Rooms</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="text-2xl font-bold text-green-600">
                            {workspaces.filter(w => (w.analytics?.totalViews || 0) > 0).length}
                        </div>
                        <div className="text-sm text-gray-500">Active Rooms</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="text-2xl font-bold text-blue-600">
                            {workspaces.reduce((sum, w) => sum + (w.analytics?.totalViews || 0), 0)}
                        </div>
                        <div className="text-sm text-gray-500">Total Views</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <div className="text-2xl font-bold text-purple-600">
                            {workspaces.reduce((sum, w) => sum + (w.analytics?.uniqueViewers || 0), 0)}
                        </div>
                        <div className="text-sm text-gray-500">Unique Visitors</div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* View Tabs */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                            {views.map((view) => (
                                <button
                                    key={view.id}
                                    onClick={() => setCurrentView(view.id)}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                                        currentView === view.id
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    <span className="mr-1">{view.icon}</span>
                                    {view.label}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="flex-1 relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search rooms..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Sort */}
                        <select
                            value={`${sortField}-${sortOrder}`}
                            onChange={(e) => {
                                const [field, order] = e.target.value.split('-');
                                setSortField(field as SortField);
                                setSortOrder(order as SortOrder);
                            }}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="updatedAt-desc">Last Modified</option>
                            <option value="createdAt-desc">Newest First</option>
                            <option value="createdAt-asc">Oldest First</option>
                            <option value="name-asc">Name A-Z</option>
                            <option value="name-desc">Name Z-A</option>
                            <option value="viewCount-desc">Most Views</option>
                        </select>

                        {/* View Toggle */}
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setDisplayMode('grid')}
                                className={`p-2 rounded-md transition-colors ${
                                    displayMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                }`}
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setDisplayMode('table')}
                                className={`p-2 rounded-md transition-colors ${
                                    displayMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                                }`}
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Empty State */}
                {filteredWorkspaces.length === 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {searchQuery ? 'No matching rooms' : 'No rooms yet'}
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Create your first Digital Sales Room to start engaging with buyers'
                            }
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={() => navigate('/workspace/new/edit')}
                                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Create Your First Room
                            </button>
                        )}
                    </div>
                )}

                {/* Grid View */}
                {displayMode === 'grid' && filteredWorkspaces.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredWorkspaces.map((workspace) => {
                            const engagement = getEngagementLevel(workspace);

                            return (
                                <div
                                    key={workspace.id}
                                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                                >
                                    {/* Preview/Thumbnail */}
                                    <div
                                        className="aspect-video bg-gradient-to-br from-indigo-500 to-purple-600 relative cursor-pointer"
                                        onClick={() => navigate(`/room/${workspace.id}`)}
                                    >
                                        {workspace.coverImage ? (
                                            <img
                                                src={workspace.coverImage}
                                                alt={(workspace.title || workspace.name || 'Untitled')}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <span className="text-6xl opacity-50">🏢</span>
                                            </div>
                                        )}

                                        {/* Engagement badge */}
                                        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${engagement.color}`}>
                                            {engagement.level}
                                        </div>

                                        {/* Quick view overlay */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <span className="text-white font-medium">View Room</span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {(workspace.title || workspace.name || 'Untitled')}
                                                </h3>
                                                {workspace.companyName && (
                                                    <p className="text-sm text-gray-500 truncate">
                                                        {workspace.companyName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                {workspace.analytics?.totalViews || 0} views
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {workspace.analytics?.uniqueViewers || 0} visitors
                                            </div>
                                        </div>

                                        <div className="text-xs text-gray-400 mb-4">
                                            Updated {formatDate(workspace.updatedAt)}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                            <button
                                                onClick={() => navigate(`/workspace/${workspace.id}/edit`)}
                                                className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => navigate(`/workspace/${workspace.id}/analytics`)}
                                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Analytics"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => copyShareLink(workspace)}
                                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Copy share link"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setWorkspaceToDelete(workspace);
                                                    setDeleteModalOpen(true);
                                                }}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Table View */}
                {displayMode === 'table' && filteredWorkspaces.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Room
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Views
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Visitors
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Last Activity
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredWorkspaces.map((workspace) => {
                                    const engagement = getEngagementLevel(workspace);

                                    return (
                                        <tr
                                            key={workspace.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg flex-shrink-0">
                                                        {workspace.companyLogo ? (
                                                            <img
                                                                src={workspace.companyLogo}
                                                                alt=""
                                                                className="w-full h-full rounded-lg object-cover"
                                                            />
                                                        ) : (
                                                            '🏢'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {(workspace.title || workspace.name || 'Untitled')}
                                                        </div>
                                                        {workspace.companyName && (
                                                            <div className="text-sm text-gray-500">
                                                                {workspace.companyName}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${engagement.color}`}>
                                                    {engagement.level}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {workspace.analytics?.totalViews || 0}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {workspace.analytics?.uniqueViewers || 0}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(workspace.updatedAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/room/${workspace.id}`)}
                                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/workspace/${workspace.id}/edit`)}
                                                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/workspace/${workspace.id}/analytics`)}
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Analytics"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => copyShareLink(workspace)}
                                                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                                        title="Copy link"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setWorkspaceToDelete(workspace);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && workspaceToDelete && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                            Delete Room?
                        </h3>
                        <p className="text-gray-500 text-center mb-6">
                            Are you sure you want to delete "{workspaceToDelete.name}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setWorkspaceToDelete(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkspacesListPage;
