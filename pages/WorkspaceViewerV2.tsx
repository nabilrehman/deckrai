/**
 * WorkspaceViewerV2 - Premium Digital Sales Room View
 *
 * Modern design inspired by Trumpet, Dock, and Aligned.
 * Features:
 * - Sidebar navigation with table of contents
 * - Hero section with welcome video option
 * - Contact card widget
 * - Progress indicator
 * - Glassmorphism effects
 * - Mobile-responsive
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getWorkspace, updateWorkspace, recordWorkspaceView, recordBlockEngagement } from '../services/workspaceService';
import {
  Workspace,
  WorkspaceBlock,
  VideoBlock,
  EmbedBlock,
  PDFBlock,
  DeckBlock,
  TextBlock,
  MAPBlock
} from '../types';

// Import widgets
import EmbedWidget from '../components/widgets/EmbedWidget';
import VideoWidget from '../components/widgets/VideoWidget';
import DocumentWidget from '../components/widgets/DocumentWidget';
import DeckWidget from '../components/widgets/DeckWidget';
import TextWidget from '../components/widgets/TextWidget';
import MAPWidget from '../components/widgets/MAPWidget';
import ContactCard from '../components/widgets/ContactCard';

// Import collaboration components
import { CommentsPanel, LivePresence, ActivityFeed } from '../components/collaboration';
import { WorkspaceComment, WorkspacePresence, WorkspaceActivity } from '../types';

interface ViewerInfo {
  email?: string;
  name?: string;
  company?: string;
}

const WorkspaceViewerV2: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmailCapture, setShowEmailCapture] = useState(true);
  const [viewerInfo, setViewerInfo] = useState<ViewerInfo>({});
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<WorkspaceComment[]>([]);
  const [presence, setPresence] = useState<WorkspacePresence[]>([]);

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Mock presence data (in production, this would come from Firestore real-time listeners)
  useEffect(() => {
    if (workspaceId && viewerInfo.email) {
      // Add current user to presence
      const myPresence: WorkspacePresence = {
        workspaceId,
        userId: viewerInfo.email || 'anonymous',
        userEmail: viewerInfo.email || '',
        userName: viewerInfo.name || 'Guest',
        userRole: 'buyer',
        lastSeen: Date.now(),
        isOnline: true
      };

      // Mock other viewers for demo
      const mockPresence: WorkspacePresence[] = [
        myPresence,
        {
          workspaceId,
          userId: 'seller-1',
          userEmail: 'sales@company.com',
          userName: 'Sarah Chen',
          userRole: 'seller',
          lastSeen: Date.now() - 300000, // 5 mins ago
          isOnline: false
        }
      ];
      setPresence(mockPresence);
    }
  }, [workspaceId, viewerInfo]);

  // Handle adding comments
  const handleAddComment = (content: string, mentions?: string[], parentId?: string) => {
    if (!workspaceId) return;

    const newComment: WorkspaceComment = {
      id: `comment_${Date.now()}`,
      workspaceId,
      parentId,
      authorId: viewerInfo.email || 'anonymous',
      authorName: viewerInfo.name || 'Guest',
      authorEmail: viewerInfo.email || '',
      authorRole: 'buyer',
      content,
      mentions,
      createdAt: Date.now()
    };

    setComments(prev => [...prev, newComment]);
    // In production, save to Firestore here
  };

  // Handle resolving comments
  const handleResolveComment = (commentId: string) => {
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, isResolved: true } : c
    ));
  };

  // Load Workspace
  useEffect(() => {
    const loadWorkspace = async () => {
      if (!workspaceId) {
        setError('Invalid workspace link');
        setLoading(false);
        return;
      }

      try {
        const ws = await getWorkspace(workspaceId);
        if (ws) {
          setWorkspace(ws);
          if (ws.blocks.length > 0) {
            setActiveSection(ws.blocks[0].id);
          }
          setVariables({
            client_name: 'Valued Customer',
            client_company: 'Your Company',
            rep_name: 'Sales Team',
            deal_value: '$XX,XXX',
            close_date: new Date().toLocaleDateString()
          });
        } else {
          setError('Workspace not found');
        }
      } catch (err: any) {
        console.error('Failed to load workspace:', err);
        setError('Failed to load workspace');
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [workspaceId]);

  // Handle email capture
  const handleStartViewing = async (info?: ViewerInfo) => {
    console.log('[WorkspaceViewerV2] handleStartViewing called', { workspaceId, info });
    setShowEmailCapture(false);
    if (info) {
      setViewerInfo(info);
      setVariables(prev => ({
        ...prev,
        client_name: info.name || info.company || prev.client_name,
        client_company: info.company || prev.client_company
      }));
    }

    // Record the view
    if (workspaceId) {
      console.log('[WorkspaceViewerV2] Recording view for workspace:', workspaceId);
      try {
        await recordWorkspaceView(workspaceId, info);
        console.log('[WorkspaceViewerV2] View recorded successfully');
      } catch (error) {
        console.error('[WorkspaceViewerV2] Error recording workspace view:', error);
      }
    } else {
      console.warn('[WorkspaceViewerV2] No workspaceId available');
    }
  };

  // Scroll to section
  const scrollToSection = (blockId: string) => {
    setActiveSection(blockId);
    sectionRefs.current[blockId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Update block
  const handleUpdateBlock = useCallback(async (blockId: string, updates: Partial<WorkspaceBlock>) => {
    if (!workspace) return;
    const newBlocks = workspace.blocks.map(b =>
      b.id === blockId ? { ...b, ...updates } : b
    );
    setWorkspace({ ...workspace, blocks: newBlocks });
    try {
      await updateWorkspace(workspace.id, { blocks: newBlocks });
    } catch (err) {
      console.error('Failed to update block:', err);
    }
  }, [workspace]);

  // Get section icon
  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'text':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'map':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'embed':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'pdf':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
          </svg>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-indigo-200">Loading your deal room...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <svg className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Room Not Found</h1>
          <p className="text-indigo-200 mb-8">{error || 'This deal room may have been removed or the link is invalid.'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Email capture modal
  if (showEmailCapture) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-lg">
          {/* Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="relative px-8 pt-10 pb-6 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-3xl">🏛️</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Welcome to your Deal Room</h1>
              <p className="text-indigo-200">
                <span className="font-semibold text-white">{workspace.title}</span>
              </p>
            </div>

            {/* Form */}
            <div className="px-8 pb-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  handleStartViewing({
                    name: formData.get('name') as string,
                    email: formData.get('email') as string,
                    company: formData.get('company') as string
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-2">
                    Work Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="john@company.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-indigo-200 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    name="company"
                    placeholder="Acme Inc"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 px-6 mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:from-indigo-600 hover:to-purple-700 transition-all"
                >
                  Enter Deal Room
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => handleStartViewing()}
                  className="text-sm text-indigo-300 hover:text-white transition-colors"
                >
                  Continue as guest
                </button>
              </div>
            </div>
          </div>

          {/* Trust badge */}
          <div className="mt-6 text-center">
            <p className="text-xs text-indigo-300/60 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Secure & Private
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress for MAP blocks
  const mapBlocks = workspace.blocks.filter(b => b.type === 'map') as MAPBlock[];
  const totalTasks = mapBlocks.reduce((acc, b) => acc + (b.tasks?.length || 0), 0);
  const completedTasks = mapBlocks.reduce((acc, b) => acc + (b.tasks?.filter(t => t.status === 'completed').length || 0), 0);
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Main workspace view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0'}`}>
        <div className={`h-full flex flex-col ${sidebarOpen ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
          {/* Logo & Title */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {workspace.branding?.logoUrl ? (
                <img src={workspace.branding.logoUrl} alt="Logo" className="h-8" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {workspace.title.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-gray-900 truncate">{workspace.title}</h1>
                <p className="text-xs text-gray-500">Deal Room</p>
              </div>
            </div>

            {/* Progress */}
            {totalTasks > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-semibold text-indigo-600">{progressPercent}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">Contents</p>
            <ul className="space-y-1">
              {workspace.blocks.filter(b => b.isVisible).map((block, index) => (
                <li key={block.id}>
                  <button
                    onClick={() => scrollToSection(block.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      activeSection === block.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${activeSection === block.id ? 'text-indigo-500' : 'text-gray-400'}`}>
                      {getSectionIcon(block.type)}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium">
                      {block.title || `Section ${index + 1}`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact Card */}
          <div className="p-4 border-t border-gray-100">
            <ContactCard
              name="Sales Team"
              title="Account Executive"
              email="sales@company.com"
              calendlyUrl="https://calendly.com"
            />
          </div>
        </div>
      </aside>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={`fixed top-4 z-50 p-2 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-50 transition-all ${sidebarOpen ? 'left-[280px]' : 'left-4'}`}
      >
        <svg className={`w-5 h-5 text-gray-600 transition-transform ${sidebarOpen ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
        {/* Header bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            {viewerInfo.name && (
              <p className="text-sm text-gray-600">
                Welcome back, <span className="font-semibold text-gray-900">{viewerInfo.name}</span>
              </p>
            )}

            <div className="flex items-center gap-4 ml-auto">
              {/* Live Presence */}
              {presence.length > 0 && (
                <LivePresence
                  presenceList={presence}
                  currentUserId={viewerInfo.email}
                />
              )}

              {/* Comments Button */}
              <button
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showComments
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-medium">
                  {comments.length > 0 ? comments.length : 'Comment'}
                </span>
              </button>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                Powered by <span className="font-semibold text-indigo-600">deckr.ai</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="space-y-8">
            {workspace.blocks.filter(b => b.isVisible).map((block) => (
              <div
                key={block.id}
                ref={(el) => (sectionRefs.current[block.id] = el)}
                className="scroll-mt-24"
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Section Header */}
                  {block.title && (
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                      <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <span className="text-indigo-500">{getSectionIcon(block.type)}</span>
                        {block.title}
                      </h2>
                    </div>
                  )}

                  {/* Block Content */}
                  <div className="overflow-hidden">
                    {block.type === 'text' && (
                      <TextWidget
                        block={block as TextBlock}
                        isEditing={false}
                        updateBlock={() => {}}
                        variables={variables}
                      />
                    )}

                    {block.type === 'video' && (
                      <VideoWidget
                        block={block as VideoBlock}
                        isEditing={false}
                        updateBlock={() => {}}
                        onPlay={() => {
                          if (workspaceId) {
                            recordBlockEngagement(workspaceId, block.id, 'video', 'play', {}, viewerInfo);
                          }
                        }}
                      />
                    )}

                    {block.type === 'embed' && (
                      <EmbedWidget
                        block={block as EmbedBlock}
                        isEditing={false}
                        updateBlock={() => {}}
                      />
                    )}

                    {block.type === 'pdf' && (
                      <DocumentWidget
                        block={block as PDFBlock}
                        isEditing={false}
                        updateBlock={() => {}}
                        workspaceId={workspaceId}
                        userId={workspace?.ownerId}
                      />
                    )}

                    {block.type === 'deck' && (
                      <DeckWidget
                        block={block as DeckBlock}
                        isEditing={false}
                        updateBlock={() => {}}
                        workspaceId={workspaceId}
                        viewerInfo={viewerInfo}
                      />
                    )}

                    {block.type === 'map' && (
                      <MAPWidget
                        block={block as MAPBlock}
                        isEditing={false}
                        updateBlock={(updates) => handleUpdateBlock(block.id, updates)}
                        currentUserRole="buyer"
                        currentUserEmail={viewerInfo.email}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {workspace.blocks.length === 0 && (
              <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100">
                <p>This deal room is being prepared.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white mt-12">
          <div className="max-w-4xl mx-auto px-6 py-8 text-center">
            <p className="text-sm text-gray-500 mb-2">
              Questions? Reply to the email that sent you this link.
            </p>
            <p className="text-xs text-gray-400">
              Built with <span className="text-indigo-600 font-medium">deckr.ai</span> • Digital Sales Rooms
            </p>
          </div>
        </footer>
      </main>

      {/* Comments Panel - Fixed sidebar on the right */}
      {showComments && workspaceId && (
        <div className="fixed top-0 right-0 h-full z-50 shadow-2xl">
          <CommentsPanel
            workspaceId={workspaceId}
            currentUserEmail={viewerInfo.email || ''}
            currentUserName={viewerInfo.name || 'Guest'}
            currentUserRole="buyer"
            comments={comments}
            onAddComment={handleAddComment}
            onResolveComment={handleResolveComment}
            stakeholderEmails={presence.map(p => p.userEmail)}
            onToggleCollapse={() => setShowComments(false)}
          />
        </div>
      )}

      {/* Collapsed Comments Button (when panel is closed) */}
      {!showComments && comments.length > 0 && (
        <button
          onClick={() => setShowComments(true)}
          className="fixed right-4 bottom-4 z-40 flex items-center gap-2 px-4 py-3 bg-white rounded-full shadow-lg border border-gray-200 hover:shadow-xl transition-all"
        >
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="font-medium text-gray-700">{comments.length} Comments</span>
        </button>
      )}
    </div>
  );
};

export default WorkspaceViewerV2;
