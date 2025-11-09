import React, { useState, useEffect, useRef } from 'react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onExecute: (command: Command) => void;
}

interface Command {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'action' | 'navigation' | 'create' | 'recent';
  shortcut?: string;
  keywords?: string[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onExecute }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: Command[] = [
    {
      id: 'new-deck',
      title: 'Create New Deck',
      description: 'Start a fresh presentation from scratch',
      category: 'create',
      shortcut: '⌘N',
      keywords: ['new', 'create', 'start', 'deck'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'upload-pdf',
      title: 'Upload PDF',
      description: 'Import an existing PDF to edit',
      category: 'create',
      shortcut: '⌘U',
      keywords: ['upload', 'import', 'pdf'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'share',
      title: 'Share Deck',
      description: 'Share current deck with team or clients',
      category: 'action',
      shortcut: '⌘S',
      keywords: ['share', 'send', 'collaborate'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
        </svg>
      )
    },
    {
      id: 'download',
      title: 'Download PDF',
      description: 'Export current deck as PDF',
      category: 'action',
      shortcut: '⌘D',
      keywords: ['download', 'export', 'pdf', 'save'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'See engagement metrics and insights',
      category: 'navigation',
      shortcut: '⌘A',
      keywords: ['analytics', 'metrics', 'stats', 'insights'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      )
    },
    {
      id: 'present',
      title: 'Present Mode',
      description: 'Enter fullscreen presentation mode',
      category: 'action',
      shortcut: '⌘P',
      keywords: ['present', 'fullscreen', 'show', 'display'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'add-slide',
      title: 'Add New Slide',
      description: 'Insert a new slide after current one',
      category: 'create',
      keywords: ['add', 'new', 'slide', 'insert'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      )
    },
    {
      id: 'personalize',
      title: 'Personalize Slide',
      description: 'AI-powered slide personalization',
      category: 'action',
      keywords: ['personalize', 'ai', 'customize', 'edit'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      )
    },
    {
      id: 'settings',
      title: 'Settings',
      description: 'Manage your account and preferences',
      category: 'navigation',
      keywords: ['settings', 'preferences', 'account', 'config'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 'help',
      title: 'Help & Support',
      description: 'Get help and view documentation',
      category: 'navigation',
      shortcut: '⌘?',
      keywords: ['help', 'support', 'docs', 'documentation'],
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  const filteredCommands = searchQuery.trim() === ''
    ? commands
    : commands.filter(cmd =>
        cmd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.keywords?.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  const categoryLabels = {
    action: 'Actions',
    navigation: 'Navigation',
    create: 'Create',
    recent: 'Recent'
  };

  const categoryIcons = {
    action: '⚡',
    navigation: '🧭',
    create: '✨',
    recent: '🕐'
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onExecute(filteredCommands[selectedIndex]);
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onExecute, onClose]);

  if (!isOpen) return null;

  let currentIndex = 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Command Palette */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-premium border-2 border-brand-border/30 w-full max-w-2xl pointer-events-auto animate-slide-down overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="relative p-4 border-b border-brand-border/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary-50 to-brand-accent-50 text-brand-primary-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for commands..."
                className="flex-1 px-0 py-2 text-lg border-none outline-none text-brand-text-primary placeholder-brand-text-tertiary bg-transparent"
              />
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 border border-gray-200">
                <span className="text-xs font-medium text-gray-600">ESC</span>
              </div>
            </div>
          </div>

          {/* Commands List */}
          <div ref={listRef} className="max-h-[400px] overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <div className="font-semibold text-brand-text-primary mb-2">No commands found</div>
                <div className="text-sm text-brand-text-tertiary">Try searching for something else</div>
              </div>
            ) : (
              <div className="p-2">
                {Object.entries(groupedCommands).map(([category, cmds]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-brand-text-tertiary uppercase tracking-wider">
                      <span>{categoryIcons[category as keyof typeof categoryIcons]}</span>
                      <span>{categoryLabels[category as keyof typeof categoryLabels]}</span>
                    </div>
                    <div className="space-y-1">
                      {cmds.map((cmd) => {
                        const index = currentIndex++;
                        const isSelected = index === selectedIndex;

                        return (
                          <button
                            key={cmd.id}
                            onClick={() => {
                              onExecute(cmd);
                              onClose();
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`w-full group flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-200 text-left ${
                              isSelected
                                ? 'bg-gradient-to-r from-brand-primary-50 to-brand-accent-50 border-2 border-brand-primary-300 shadow-md'
                                : 'hover:bg-gray-50 border-2 border-transparent'
                            }`}
                          >
                            <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${
                              isSelected
                                ? 'bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 text-white shadow-md'
                                : 'bg-gray-100 text-brand-text-secondary group-hover:bg-brand-primary-100 group-hover:text-brand-primary-600'
                            }`}>
                              {cmd.icon}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm text-brand-text-primary mb-0.5">{cmd.title}</div>
                              <div className="text-xs text-brand-text-tertiary truncate">{cmd.description}</div>
                            </div>

                            {cmd.shortcut && (
                              <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 border border-gray-200">
                                <span className="text-xs font-medium text-gray-600">{cmd.shortcut}</span>
                              </div>
                            )}

                            {isSelected && (
                              <div className="flex items-center justify-center w-5 h-5 rounded bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gradient-to-br from-gray-50 to-slate-50 border-t border-brand-border/30">
            <div className="flex items-center justify-between text-xs text-brand-text-tertiary">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono">↑</kbd>
                    <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono">↓</kbd>
                  </div>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-2">
                  <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono">ESC</kbd>
                  <span>Close</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span>Powered by</span>
                <span className="font-semibold gradient-text">deckr.ai</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;
