import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RightChatPanelProps {
  onClose: () => void;
  onSubmit: (message: string) => void;
  isLoading: boolean;
  initialMessage?: string;
  loadingStatus?: string;
}

const RightChatPanel: React.FC<RightChatPanelProps> = ({
  onClose,
  onSubmit,
  isLoading,
  initialMessage,
  loadingStatus,
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

      {/* Input Area - Canva Style */}
      <div className="px-6 py-4 bg-white border-t border-gray-100">
        <div className="flex gap-2 items-end">
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
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shadow-lg disabled:shadow-none flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default RightChatPanel;
