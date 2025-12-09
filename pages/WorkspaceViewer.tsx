/**
 * WorkspaceViewer - Public Digital Sales Room View
 *
 * This is the buyer-facing view of a workspace/deal room.
 * Features:
 * - No authentication required (magic link access)
 * - Optional email capture
 * - View tracking and analytics
 * - Interactive widgets (videos, embeds, MAPs)
 */

import React, { useState, useEffect, useCallback } from 'react';
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

interface ViewerInfo {
  email?: string;
  name?: string;
  company?: string;
}

const WorkspaceViewer: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEmailCapture, setShowEmailCapture] = useState(true);
  const [viewerInfo, setViewerInfo] = useState<ViewerInfo>({});
  const [variables, setVariables] = useState<Record<string, string>>({});

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
          // Check if published
          if (ws.status !== 'published' && ws.status !== 'draft') {
            setError('This workspace is not available');
            setLoading(false);
            return;
          }
          setWorkspace(ws);

          // Set up variables for personalization
          setVariables({
            client_name: viewerInfo.name || viewerInfo.company || 'Valued Customer',
            client_company: viewerInfo.company || 'Your Company',
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
  }, [workspaceId, viewerInfo]);

  // Handle email capture
  const handleStartViewing = async (info?: ViewerInfo) => {
    setShowEmailCapture(false);
    if (info) {
      setViewerInfo(info);
      // Update variables with viewer info
      setVariables(prev => ({
        ...prev,
        client_name: info.name || info.company || prev.client_name,
        client_company: info.company || prev.client_company
      }));
    }

    // Record view in analytics
    if (workspaceId) {
      try {
        await recordWorkspaceView(workspaceId, info);
      } catch (error) {
        console.error('Error recording workspace view:', error);
      }
    }
  };

  // Update block (for interactive widgets like MAP)
  const handleUpdateBlock = useCallback(async (blockId: string, updates: Partial<WorkspaceBlock>) => {
    if (!workspace) return;

    const newBlocks = workspace.blocks.map(b =>
      b.id === blockId ? { ...b, ...updates } : b
    );

    setWorkspace({ ...workspace, blocks: newBlocks });

    // Persist to Firestore
    try {
      await updateWorkspace(workspace.id, { blocks: newBlocks });
    } catch (err) {
      console.error('Failed to update block:', err);
    }
  }, [workspace]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-100 flex items-center justify-center">
            <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Workspace Not Found</h1>
          <p className="text-gray-600 mb-8">{error || 'This workspace may have been removed or the link is invalid.'}</p>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center">
                <span className="text-2xl">🏛️</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="pt-12 px-8 pb-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
              <p className="text-gray-600">
                You're about to view <span className="font-semibold text-indigo-600">"{workspace.title}"</span>
              </p>
            </div>

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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Your Name <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@company.com"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Company <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  name="company"
                  placeholder="Acme Inc"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 transition-all"
              >
                Enter Workspace
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => handleStartViewing()}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Skip and continue anonymously
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main workspace view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {workspace.branding?.logoUrl ? (
              <img src={workspace.branding.logoUrl} alt="Logo" className="h-8" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-lg">🏛️</span>
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg text-gray-900">{workspace.title}</h1>
              {viewerInfo.name && (
                <p className="text-sm text-gray-500">Welcome, {viewerInfo.name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">Powered by</span>
            <span className="text-sm font-semibold text-indigo-600">deckr.ai</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {workspace.blocks.filter(b => b.isVisible).map((block) => (
            <div
              key={block.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              {/* Block Title (if exists) */}
              {block.title && (
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">{block.title}</h2>
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
          ))}

          {workspace.blocks.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <p>This workspace is empty.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Questions? Reply to the email that sent you this link.
          </p>
          <p className="text-xs text-gray-400">
            Built with <span className="text-indigo-600 font-medium">deckr.ai</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default WorkspaceViewer;
