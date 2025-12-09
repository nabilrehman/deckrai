/**
 * WorkspaceAnalyticsPage - Detailed engagement analytics for a workspace
 *
 * Inspired by Dock & Trumpet analytics dashboards:
 * - Overview stats (views, visitors, time spent)
 * - Content engagement breakdown
 * - Slide-level heatmap for decks
 * - Viewer activity timeline
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getWorkspace, getWorkspaceActivities } from '../services/workspaceService';
import { getSlideViewEvents, formatDuration } from '../services/slideAnalyticsService';
import { Workspace } from '../types';

interface Activity {
  id: string;
  type: string;
  timestamp: number;
  viewerEmail?: string;
  viewerName?: string;
  viewerCompany?: string;
  blockId?: string;
  blockType?: string;
  action?: string;
  details?: any;
  isUnique?: boolean;
}

interface SlideStats {
  slideIndex: number;
  views: number;
  totalTimeMs: number;
  avgTimeMs: number;
}

const WorkspaceAnalyticsPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [slideStats, setSlideStats] = useState<Map<string, SlideStats[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'visitors'>('overview');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!workspaceId || !user) return;

      try {
        setLoading(true);

        // Load workspace
        const ws = await getWorkspace(workspaceId);
        if (!ws) {
          setError('Workspace not found');
          return;
        }

        // Check ownership
        if (ws.ownerId !== user.uid) {
          setError('You do not have access to this workspace');
          return;
        }

        setWorkspace(ws);

        // Load activities
        const acts = await getWorkspaceActivities(workspaceId, 200);
        setActivities(acts);

        // Load slide analytics for each deck block
        const deckBlocks = ws.blocks.filter(b => b.type === 'deck');
        const slideStatsMap = new Map<string, SlideStats[]>();

        for (const block of deckBlocks) {
          const events = await getSlideViewEvents(workspaceId, block.id);

          // Aggregate by slide
          const statsMap = new Map<number, { views: number; totalTimeMs: number }>();
          events.forEach(event => {
            const existing = statsMap.get(event.slideIndex) || { views: 0, totalTimeMs: 0 };
            statsMap.set(event.slideIndex, {
              views: existing.views + 1,
              totalTimeMs: existing.totalTimeMs + event.durationMs
            });
          });

          const stats: SlideStats[] = Array.from(statsMap.entries()).map(([slideIndex, data]) => ({
            slideIndex,
            views: data.views,
            totalTimeMs: data.totalTimeMs,
            avgTimeMs: data.views > 0 ? data.totalTimeMs / data.views : 0
          })).sort((a, b) => a.slideIndex - b.slideIndex);

          slideStatsMap.set(block.id, stats);
        }

        setSlideStats(slideStatsMap);
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [workspaceId, user]);

  // Calculate derived metrics
  const totalViews = workspace?.analytics?.totalViews || 0;
  const uniqueViewers = workspace?.analytics?.uniqueViewers || 0;
  const lastViewedAt = workspace?.analytics?.lastViewedAt;

  // Get unique visitors from activities
  const visitors = activities
    .filter(a => a.type === 'view' && a.isUnique)
    .map(a => ({
      email: a.viewerEmail,
      name: a.viewerName,
      company: a.viewerCompany,
      timestamp: a.timestamp
    }));

  // Get content engagement (combining block activities and slide views)
  const contentEngagement = useMemo(() => {
    // Start with block engagement activities
    const engagement = activities
      .filter(a => a.type === 'block_engagement')
      .reduce((acc, a) => {
        const key = a.blockId || 'unknown';
        if (!acc[key]) {
          acc[key] = { views: 0, type: a.blockType || 'unknown', totalTime: 0 };
        }
        acc[key].views++;
        acc[key].totalTime += a.details?.durationMs || 0;
        return acc;
      }, {} as Record<string, { views: number; type: string; totalTime: number }>);

    // Add slide view stats for deck blocks
    slideStats.forEach((stats, blockId) => {
      const totalViews = stats.reduce((sum, s) => sum + s.views, 0);
      const totalTime = stats.reduce((sum, s) => sum + s.totalTimeMs, 0);

      if (!engagement[blockId]) {
        engagement[blockId] = { views: 0, type: 'deck', totalTime: 0 };
      }
      engagement[blockId].views += totalViews;
      engagement[blockId].totalTime += totalTime;
    });

    return engagement;
  }, [activities, slideStats]);

  // Format relative time
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/workspaces')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Workspaces
          </button>
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
                onClick={() => navigate('/workspaces')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Analytics</h1>
                <p className="text-sm text-gray-500">{workspace?.title || 'Workspace'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/workspace/${workspaceId}/edit`)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Edit Room
              </button>
              <button
                onClick={() => navigate(`/room/${workspaceId}`)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                View Room
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Total Views</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{totalViews}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Unique Visitors</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{uniqueViewers}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Content Blocks</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{workspace?.blocks?.length || 0}</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-gray-500">Last Viewed</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {lastViewedAt ? formatRelativeTime(lastViewedAt) : 'Never'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'content', label: 'Content Engagement', icon: '📄' },
                { id: 'visitors', label: 'Visitors', icon: '👥' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  {activities.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No activity yet</p>
                  ) : (
                    <div className="space-y-3">
                      {activities.slice(0, 10).map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'view' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            {activity.type === 'view' ? '👁️' : '🎯'}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.viewerName || activity.viewerEmail || 'Anonymous visitor'}
                              {activity.type === 'view' && ' viewed the room'}
                              {activity.type === 'block_engagement' && ` interacted with ${activity.blockType}`}
                            </p>
                            {activity.viewerCompany && (
                              <p className="text-xs text-gray-500">{activity.viewerCompany}</p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(activity.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Slide Engagement Analytics */}
                {slideStats.size > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Slide Engagement Analytics</h3>

                    {/* Legend */}
                    <div className="flex items-center gap-6 mb-4 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-red-500" />
                        <span>Hot (10s+)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-amber-500" />
                        <span>Warm (3-10s)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-blue-400" />
                        <span>Glanced (&lt;3s)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-gray-200" />
                        <span>Not viewed</span>
                      </div>
                    </div>

                    {Array.from(slideStats.entries()).map(([blockId, stats]) => {
                      const maxTime = Math.max(...stats.map(s => s.avgTimeMs), 1);
                      const totalSlideViews = stats.reduce((sum, s) => sum + s.views, 0);

                      // Get engagement level color
                      const getEngagementColor = (avgTimeMs: number) => {
                        if (avgTimeMs >= 10000) return { bg: 'bg-red-500', text: 'Hot', barColor: '#ef4444' };
                        if (avgTimeMs >= 3000) return { bg: 'bg-amber-500', text: 'Warm', barColor: '#f59e0b' };
                        if (avgTimeMs > 0) return { bg: 'bg-blue-400', text: 'Glanced', barColor: '#60a5fa' };
                        return { bg: 'bg-gray-200', text: 'None', barColor: '#e5e7eb' };
                      };

                      return (
                        <div key={blockId} className="mb-6 bg-gray-50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-gray-700">
                              Presentation Analytics
                            </p>
                            <span className="text-xs text-gray-500">
                              {totalSlideViews} total slide views
                            </span>
                          </div>

                          {/* Slide-by-slide breakdown */}
                          <div className="space-y-2">
                            {stats.map((stat) => {
                              const engagement = getEngagementColor(stat.avgTimeMs);
                              const timeBarWidth = maxTime > 0 ? (stat.avgTimeMs / maxTime) * 100 : 0;

                              return (
                                <div
                                  key={stat.slideIndex}
                                  className="flex items-center gap-3 group"
                                >
                                  {/* Slide number */}
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${engagement.bg}`}>
                                    {stat.slideIndex + 1}
                                  </div>

                                  {/* Time bar */}
                                  <div className="flex-1 h-8 bg-gray-200 rounded-lg overflow-hidden relative">
                                    <div
                                      className="h-full transition-all duration-500 ease-out"
                                      style={{
                                        width: `${Math.max(timeBarWidth, 2)}%`,
                                        backgroundColor: engagement.barColor
                                      }}
                                    />
                                    <div className="absolute inset-0 flex items-center px-3">
                                      <span className="text-xs font-medium text-gray-700">
                                        {formatDuration(stat.avgTimeMs)} avg
                                      </span>
                                    </div>
                                  </div>

                                  {/* Stats */}
                                  <div className="w-24 text-right">
                                    <span className="text-xs text-gray-500">
                                      {stat.views} view{stat.views !== 1 ? 's' : ''}
                                    </span>
                                  </div>

                                  {/* Engagement badge */}
                                  <div className={`w-16 text-center`}>
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                      engagement.text === 'Hot' ? 'bg-red-100 text-red-700' :
                                      engagement.text === 'Warm' ? 'bg-amber-100 text-amber-700' :
                                      engagement.text === 'Glanced' ? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-500'
                                    }`}>
                                      {engagement.text}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Insights */}
                          {stats.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-xs text-gray-500">
                                <span className="font-medium text-gray-700">Top slide:</span>{' '}
                                Slide {stats.reduce((max, s) => s.avgTimeMs > max.avgTimeMs ? s : max, stats[0]).slideIndex + 1}{' '}
                                with {formatDuration(Math.max(...stats.map(s => s.avgTimeMs)))} avg time
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Content Tab */}
            {activeTab === 'content' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Engagement</h3>
                {workspace?.blocks?.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No content blocks yet</p>
                ) : (
                  <div className="space-y-3">
                    {workspace?.blocks?.map((block) => {
                      const engagement = contentEngagement[block.id];
                      return (
                        <div
                          key={block.id}
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${
                            block.type === 'video' ? 'bg-red-100' :
                            block.type === 'deck' ? 'bg-blue-100' :
                            block.type === 'pdf' ? 'bg-orange-100' :
                            block.type === 'text' ? 'bg-gray-100' :
                            'bg-purple-100'
                          }`}>
                            {block.type === 'video' ? '🎬' :
                             block.type === 'deck' ? '📊' :
                             block.type === 'pdf' ? '📄' :
                             block.type === 'text' ? '📝' :
                             block.type === 'embed' ? '🔗' : '📦'}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {block.title || `${block.type.charAt(0).toUpperCase() + block.type.slice(1)} Block`}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">{block.type}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {engagement?.views || 0} interactions
                            </p>
                            {engagement?.totalTime > 0 && (
                              <p className="text-sm text-gray-500">
                                {formatDuration(engagement.totalTime)} total
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Visitors Tab */}
            {activeTab === 'visitors' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visitor Activity</h3>
                {visitors.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500">No identified visitors yet</p>
                    <p className="text-sm text-gray-400 mt-1">Visitors who enter their info will appear here</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Visitor</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Company</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Visited</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visitors.map((visitor, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {visitor.name || 'Anonymous'}
                                </p>
                                {visitor.email && (
                                  <p className="text-sm text-gray-500">{visitor.email}</p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {visitor.company || '-'}
                            </td>
                            <td className="py-3 px-4 text-gray-500 text-sm">
                              {formatRelativeTime(visitor.timestamp)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceAnalyticsPage;
