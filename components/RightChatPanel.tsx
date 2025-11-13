import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface EditQueueItem {
  id: string;
  originalText: string;
  action: 'change' | 'remove';
  newText?: string;
}

interface RightChatPanelProps {
  onClose: () => void;
  onSubmit: (message: string) => void;
  isLoading: boolean;
  initialMessage?: string;
  loadingStatus?: string;
  // Batch editing props
  isBatchMode?: boolean;
  editQueue?: EditQueueItem[];
  onAddToQueue?: (action: 'change' | 'remove', newText?: string) => void;
  onClearQueue?: () => void;
  selectedText?: string;
}

const RightChatPanel: React.FC<RightChatPanelProps> = ({
  onClose,
  onSubmit,
  isLoading,
  initialMessage,
  loadingStatus,
  isBatchMode = false,
  editQueue = [],
  onAddToQueue,
  onClearQueue,
  selectedText,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add initial message when panel opens
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setMessages([{ role: 'user', content: initialMessage }]);
    }
  }, [initialMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    onSubmit(userMessage);
  };

  const handleAddChange = () => {
    if (!input.trim() || !onAddToQueue) return;
    onAddToQueue('change', input.trim());
    setInput('');
  };

  const handleAddRemove = () => {
    if (!onAddToQueue) return;
    onAddToQueue('remove');
    setInput('');
  };

  const handleApplyAll = () => {
    if (editQueue.length === 0 || !onSubmit) return;

    // Convert queue to natural language
    const batchPrompt = editQueue.map(item => {
      if (item.action === 'remove') {
        return `remove "${item.originalText}"`;
      } else {
        return `change "${item.originalText}" to "${item.newText}"`;
      }
    }).join(', and ');

    setMessages(prev => [...prev, { role: 'user', content: `Batch edit: ${batchPrompt}` }]);
    onSubmit(batchPrompt);
    if (onClearQueue) onClearQueue();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-purple-100 shadow-2xl flex flex-col z-50 animate-slide-in-right">
      {/* Header - Minimal Canva Style */}
      <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-white border-b border-purple-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm">✨</span>
          </div>
          <h2 className="text-base font-semibold text-gray-900">Deckr Assistant</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-purple-100 rounded-full transition-colors"
          aria-label="Close panel"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2.5 rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                {loadingStatus && (
                  <span className="text-sm text-gray-600">{loadingStatus}</span>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Clean Design */}
      <div className="px-6 py-4 bg-white border-t border-gray-100">
        {/* Context Indicator */}
        {isBatchMode && editQueue.length > 0 && !input.trim() ? (
          // Show batch summary when ready to submit
          <div className="mb-3 bg-purple-50 rounded-xl px-3 py-2 border border-purple-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm">✨</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-600 font-medium">Making all edits</p>
                <p className="text-sm text-purple-900 font-medium">{editQueue.length} {editQueue.length === 1 ? 'change' : 'changes'} ready</p>
              </div>
            </div>
          </div>
        ) : isBatchMode && selectedText ? (
          // Show current editing context - prominent
          <div className="mb-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl px-3 py-2.5 border-2 border-purple-400 shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-base">✏️</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-purple-600 font-bold uppercase tracking-wide">Now Editing</p>
                <p className="text-base text-purple-900 font-bold truncate">"{selectedText}"</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Edit Queue - Simple text with checkmarks */}
        {isBatchMode && editQueue.length > 0 && (
          <div className="mb-3 space-y-1.5">
            <div className="flex items-center justify-between px-1 mb-1">
              <p className="text-xs font-medium text-gray-500">Edit plan:</p>
              {onClearQueue && (
                <button
                  type="button"
                  onClick={onClearQueue}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  clear
                </button>
              )}
            </div>
            {editQueue.map((item) => (
              <div key={item.id} className="flex items-start gap-2 text-xs text-gray-700 px-1">
                <span className="text-green-500 flex-shrink-0 font-bold">✓</span>
                <span className="leading-relaxed">
                  {item.action === 'remove' ? (
                    <>Remove "{item.originalText}"</>
                  ) : (
                    <>Change "{item.originalText}" to "{item.newText}"</>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Suggestion pills - "change text" highlighted by default */}
        {isBatchMode && selectedText && (
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs rounded-full transition-colors font-medium shadow-sm"
            >
              change text
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
            >
              restyle
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
            >
              remove
            </button>
          </div>
        )}

        {/* Unified input for both modes */}
        <div className="flex gap-2 items-end">
          {isBatchMode ? (
            <input
              ref={inputRef as any}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) {
                    handleAddChange();
                  }
                }
              }}
              placeholder={selectedText ? `New text for "${selectedText}"...` : "Describe your change..."}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            />
          ) : (
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-gray-50 border-0 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-all"
              rows={2}
              style={{ maxHeight: '120px' }}
            />
          )}
          <button
            onClick={() => {
              if (isBatchMode) {
                // If user has typed text, add to queue (don't submit yet)
                if (input.trim()) {
                  handleAddChange();
                }
                // If input is empty and queue has items, submit the batch
                else if (editQueue.length > 0) {
                  handleApplyAll();
                }
              } else {
                handleSubmit();
              }
            }}
            disabled={isBatchMode ? (!input.trim() && editQueue.length === 0) || isLoading : !input.trim() || isLoading}
            className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg disabled:shadow-none flex-shrink-0"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>
        {!isBatchMode && (
          <p className="mt-2 text-xs text-gray-400">
            Enter to send, Shift+Enter for new line
          </p>
        )}
      </div>
    </div>
  );
};

export default RightChatPanel;
