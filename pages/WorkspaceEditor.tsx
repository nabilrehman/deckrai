import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Reorder } from 'framer-motion';
import {
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  addBlockToWorkspace,
  reorderBlocks,
  removeBlockFromWorkspace
} from '../services/workspaceService';
import {
  Workspace,
  WorkspaceBlock,
  BlockType,
  VideoBlock,
  EmbedBlock,
  PDFBlock,
  DeckBlock,
  TextBlock,
  MAPBlock
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import EmbedWidget from '../components/widgets/EmbedWidget';
import VideoWidget from '../components/widgets/VideoWidget';
import DocumentWidget from '../components/widgets/DocumentWidget';
import DeckWidget from '../components/widgets/DeckWidget';
import TextWidget from '../components/widgets/TextWidget';
import MAPWidget from '../components/widgets/MAPWidget';

const WorkspaceEditor: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Load Workspace or Create New
  useEffect(() => {
    const initWorkspace = async () => {
      if (!user) return;

      setLoading(true);
      try {
        if (workspaceId === 'new') {
          // Create mode
          const newWs = await createWorkspace(user.uid, 'Untitled Deal Room');
          navigate(`/workspace/${newWs.id}/edit`, { replace: true });
        } else if (workspaceId) {
          // Edit mode
          const ws = await getWorkspace(workspaceId);
          if (ws) {
            setWorkspace(ws);
          } else {
            setError('Workspace not found');
          }
        }
      } catch (err: any) {
        console.error('Failed to init workspace:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) {
      initWorkspace();
    }
  }, [workspaceId, user, navigate]);

  // Handlers
  const handleReorder = (newOrder: WorkspaceBlock[]) => {
    if (!workspace) return;
    // Optimistic update
    setWorkspace({ ...workspace, blocks: newOrder });
    // Background sync
    reorderBlocks(workspace.id, newOrder).catch(console.error);
  };

  const handleAddBlock = async (type: BlockType) => {
    if (!workspace) return;

    const newBlock: WorkspaceBlock = {
      id: `block_${Date.now()}`,
      type,
      isVisible: true,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Block`
    } as any;

    // Default properties based on type
    if (type === 'video') {
      (newBlock as VideoBlock).source = 'url';
      (newBlock as VideoBlock).url = '';
    } else if (type === 'embed') {
      (newBlock as EmbedBlock).url = '';
      (newBlock as EmbedBlock).provider = 'other';
    } else if (type === 'text') {
      (newBlock as TextBlock).content = '<h2>Welcome to {{client_name}}</h2><p>Start typing your content here. Use variables like {{rep_name}} for personalization.</p>';
    } else if (type === 'map') {
      (newBlock as MAPBlock).tasks = [
        { id: 'task_1', title: 'Review proposal', assignedTo: 'buyer', status: 'pending' },
        { id: 'task_2', title: 'Send contract', assignedTo: 'seller', status: 'pending' }
      ];
    } else if (type === 'pdf') {
      (newBlock as PDFBlock).storageUrl = '';
      (newBlock as PDFBlock).fileName = '';
      (newBlock as PDFBlock).allowDownload = true;
    } else if (type === 'deck') {
      (newBlock as DeckBlock).deckId = '';
    }

    try {
      await addBlockToWorkspace(workspace.id, newBlock);
      // Refresh local state to ensure consistency
      const updated = await getWorkspace(workspace.id);
      if (updated) setWorkspace(updated);
    } catch (err) {
      console.error('Failed to add block:', err);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!workspace) return;
    if (!window.confirm('Delete this block?')) return;

    try {
      const updatedBlocks = workspace.blocks.filter(b => b.id !== blockId);
      setWorkspace({ ...workspace, blocks: updatedBlocks }); // Optimistic
      await removeBlockFromWorkspace(workspace.id, blockId);
    } catch (err) {
      console.error('Failed to delete block:', err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading Workspace...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!workspace) return null;

  return (
    <div className="min-h-screen bg-brand-background">
      <nav className="h-16 border-b border-brand-border/30 bg-white flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-brand-text-secondary hover:text-brand-primary-500">
            &larr; Back
          </button>
          <input
            value={workspace.title}
            onChange={(e) => {
              const newTitle = e.target.value;
              setWorkspace(prev => prev ? { ...prev, title: newTitle } : null);
            }}
            onBlur={(e) => updateWorkspace(workspace.id, { title: e.target.value })}
            className="font-display font-bold text-xl bg-transparent border-none focus:ring-0 text-brand-text-primary"
          />
          <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold uppercase">
            {workspace.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`/room/${workspace.id}`, '_blank')}
            className="btn btn-secondary text-sm"
          >
            Preview
          </button>
          <button
            onClick={async () => {
              await updateWorkspace(workspace.id, { status: 'published' });
              setWorkspace(prev => prev ? { ...prev, status: 'published' } : null);
              setShowShareModal(true);
            }}
            className="btn btn-primary text-sm shadow-btn"
          >
            {workspace.status === 'published' ? 'Share' : 'Publish'}
          </button>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar: Widget Library */}
        <div className="w-72 bg-white border-r border-brand-border/30 p-6 overflow-y-auto">
          <h3 className="font-bold text-sm text-brand-text-tertiary uppercase tracking-wider mb-4">Widgets</h3>
          <div className="space-y-3">
            {['text', 'video', 'pdf', 'deck', 'embed', 'map'].map((type) => (
              <button
                key={type}
                onClick={() => handleAddBlock(type as BlockType)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-brand-border/50 hover:border-brand-primary-300 hover:bg-brand-background transition-all group text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-primary-50 text-brand-primary-500 flex items-center justify-center group-hover:bg-brand-primary-500 group-hover:text-white transition-colors">
                  <span className="capitalize">{type[0]}</span>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-brand-text-primary capitalize">{type}</div>
                  <div className="text-xs text-brand-text-tertiary">Add to workspace</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {workspace.blocks.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-brand-border/50 rounded-3xl bg-white/50">
                <h3 className="text-xl font-bold text-brand-text-secondary mb-2">Empty Workspace</h3>
                <p className="text-brand-text-tertiary">Select a widget from the sidebar to start building.</p>
              </div>
            ) : (
              <Reorder.Group axis="y" values={workspace.blocks} onReorder={handleReorder} className="space-y-4">
                {workspace.blocks.map((block) => (
                  <Reorder.Item key={block.id} value={block}>
                    <div className="bg-white rounded-2xl shadow-card border border-brand-border/20 overflow-hidden relative group">
                      {/* Block Header / Controls */}
                      <div className="h-10 bg-slate-50 border-b border-brand-border/10 flex items-center justify-between px-4 cursor-grab active:cursor-grabbing">
                        <div className="flex items-center gap-2 text-xs font-semibold text-brand-text-secondary uppercase">
                          {block.type} Block
                        </div>
                        <button
                          onClick={() => handleDeleteBlock(block.id)}
                          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>

                      {/* Block Content */}
                      <div className="p-0 overflow-hidden">
                        {block.type === 'text' && (
                          <TextWidget
                            block={block as TextBlock}
                            isEditing={true}
                            updateBlock={(updates) => {
                              const newBlocks = workspace.blocks.map(b =>
                                b.id === block.id ? { ...b, ...updates } : b
                              );
                              handleReorder(newBlocks);
                            }}
                            variables={{
                              client_name: workspace.branding?.logoUrl ? 'Client' : '{{client_name}}',
                              rep_name: user?.displayName || '{{rep_name}}'
                            }}
                          />
                        )}

                        {block.type === 'video' && (
                          <VideoWidget
                            block={block as VideoBlock}
                            isEditing={true}
                            updateBlock={(updates) => {
                              const newBlocks = workspace.blocks.map(b =>
                                b.id === block.id ? { ...b, ...updates } : b
                              );
                              handleReorder(newBlocks);
                            }}
                          />
                        )}

                        {block.type === 'embed' && (
                          <EmbedWidget
                            block={block as EmbedBlock}
                            isEditing={true}
                            updateBlock={(updates) => {
                              const newBlocks = workspace.blocks.map(b =>
                                b.id === block.id ? { ...b, ...updates } : b
                              );
                              handleReorder(newBlocks);
                            }}
                          />
                        )}

                        {block.type === 'pdf' && (
                          <DocumentWidget
                            block={block as PDFBlock}
                            isEditing={true}
                            updateBlock={(updates) => {
                              const newBlocks = workspace.blocks.map(b =>
                                b.id === block.id ? { ...b, ...updates } : b
                              );
                              handleReorder(newBlocks);
                            }}
                            workspaceId={workspaceId}
                            userId={user?.uid}
                          />
                        )}

                        {block.type === 'deck' && (
                          <DeckWidget
                            block={block as DeckBlock}
                            isEditing={true}
                            updateBlock={(updates) => {
                              const newBlocks = workspace.blocks.map(b =>
                                b.id === block.id ? { ...b, ...updates } : b
                              );
                              handleReorder(newBlocks);
                            }}
                          />
                        )}

                        {block.type === 'map' && (
                          <MAPWidget
                            block={block as MAPBlock}
                            isEditing={true}
                            updateBlock={(updates) => {
                              const newBlocks = workspace.blocks.map(b =>
                                b.id === block.id ? { ...b, ...updates } : b
                              );
                              handleReorder(newBlocks);
                            }}
                            currentUserRole="seller"
                            currentUserEmail={user?.email || undefined}
                          />
                        )}
                      </div>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={() => setShowShareModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {workspace.status === 'published' ? 'Workspace Published!' : 'Share Your Workspace'}
                </h2>
                <p className="text-gray-600">Share this link with your prospects</p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/room/${workspace.id}`}
                    className="w-full px-4 py-3 pr-24 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
                  />
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(`${window.location.origin}/room/${workspace.id}`);
                      setIsCopied(true);
                      setTimeout(() => setIsCopied(false), 2000);
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                      isCopied
                        ? 'bg-green-500 text-white'
                        : 'bg-indigo-500 text-white hover:bg-indigo-600'
                    }`}
                  >
                    {isCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const url = encodeURIComponent(`${window.location.origin}/room/${workspace.id}`);
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="text-sm font-medium text-gray-700">LinkedIn</span>
                  </button>
                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/room/${workspace.id}`;
                      const subject = encodeURIComponent(`${workspace.title} - Deal Room`);
                      const body = encodeURIComponent(`Hi,\n\nI've put together a deal room for us: ${url}\n\nLet me know if you have any questions!`);
                      window.open(`mailto:?subject=${subject}&body=${body}`);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Email</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full mt-6 py-3 text-gray-600 hover:text-gray-900 text-sm font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WorkspaceEditor;
