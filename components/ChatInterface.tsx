import React, { useState, useRef, useEffect } from 'react';
import ThinkingSection, { ThinkingStep } from './ThinkingSection';
import ActionSummary, { ActionItem } from './ActionSummary';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  thinking?: {
    steps: ThinkingStep[];
    duration: string;
  };
  actions?: {
    label: string;
    icon: 'sparkles' | 'check' | 'edit' | 'file';
    items: ActionItem[];
  };
  component?: React.ReactNode;
}

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isProcessing: boolean;
  onSendMessage: (message: string) => void;
  onCancel: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isProcessing,
  onSendMessage,
  onCancel
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() || isProcessing) return;

    onSendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen" style={{
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, #FAFBFC 0%, #F5F7FA 100%)',
        zIndex: 0
      }}>
        <div className="mesh-gradient-1" style={{
          position: 'absolute',
          top: '-50%',
          left: '-25%',
          width: '150%',
          height: '150%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)',
          animation: 'mesh-flow-1 20s ease-in-out infinite',
          opacity: 0.6
        }} />
        <div className="mesh-gradient-2" style={{
          position: 'absolute',
          bottom: '-50%',
          right: '-25%',
          width: '150%',
          height: '150%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(168, 85, 247, 0.06) 0%, transparent 50%)',
          animation: 'mesh-flow-2 25s ease-in-out infinite',
          opacity: 0.5
        }} />
        <div className="mesh-gradient-3" style={{
          position: 'absolute',
          top: '30%',
          right: '20%',
          width: '80%',
          height: '80%',
          background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.04) 0%, transparent 60%)',
          animation: 'mesh-flow-3 30s ease-in-out infinite',
          opacity: 0.7
        }} />
      </div>

      {/* Content Layer */}
      <div className="flex flex-col h-screen" style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b" style={{
        background: 'var(--color-bg-surface)',
        borderColor: 'var(--color-neutral-200)'
      }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl shadow-md bg-gradient-brand flex items-center justify-center">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h2 style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--color-neutral-900)'
            }}>
              Creating your presentation
            </h2>
            <p style={{
              fontSize: 'var(--text-sm)',
              color: 'var(--color-neutral-500)'
            }}>
              AI is working on it...
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-neutral-200)',
            background: 'transparent',
            color: 'var(--color-neutral-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-neutral-100)';
            e.currentTarget.style.borderColor = 'var(--color-neutral-300)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'var(--color-neutral-200)';
          }}
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-8 py-8" style={{
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div className="space-y-12">
          {messages.map((message) => (
            <div key={message.id}>
              {/* User Message */}
              {message.role === 'user' && (
                <div className="flex items-start gap-4">
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-brand-500)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-semibold)',
                    flexShrink: 0
                  }}>
                    U
                  </div>
                  <div style={{
                    padding: 'var(--space-4) var(--space-5)',
                    background: 'var(--color-bg-surface)',
                    border: '1px solid var(--color-neutral-200)',
                    borderRadius: 'var(--radius-2xl)',
                    fontSize: 'var(--text-base)',
                    color: 'var(--color-neutral-900)',
                    lineHeight: 'var(--leading-relaxed)',
                    maxWidth: '80%'
                  }}>
                    {message.content}
                  </div>
                </div>
              )}

              {/* Assistant Message */}
              {message.role === 'assistant' && (
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-brand" style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div style={{
                    flex: 1,
                    maxWidth: '80%'
                  }}>
                    {/* Thinking Section */}
                    {message.thinking && (
                      <ThinkingSection
                        steps={message.thinking.steps}
                        duration={message.thinking.duration}
                      />
                    )}

                    {/* Main Content */}
                    <div style={{
                      padding: 'var(--space-4) var(--space-5)',
                      background: 'var(--color-bg-surface)',
                      border: '1px solid var(--color-neutral-200)',
                      borderRadius: 'var(--radius-2xl)',
                      fontSize: 'var(--text-base)',
                      color: 'var(--color-neutral-900)',
                      lineHeight: 'var(--leading-relaxed)',
                      marginTop: message.thinking ? 'var(--space-4)' : '0'
                    }}>
                      {message.content}
                    </div>

                    {/* Action Summary */}
                    {message.actions && (
                      <div style={{ marginTop: 'var(--space-4)' }}>
                        <ActionSummary
                          label={message.actions.label}
                          icon={message.actions.icon}
                          items={message.actions.items}
                        />
                      </div>
                    )}

                    {/* Inline Component (e.g., plan approval buttons, theme preview) */}
                    {message.component && (
                      <div style={{ marginTop: 'var(--space-4)' }}>
                        {message.component}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator when processing */}
          {isProcessing && (
            <div className="flex items-start gap-4">
              <div className="bg-gradient-brand" style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div style={{
                padding: 'var(--space-4) var(--space-5)',
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 'var(--radius-2xl)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                <div className="flex gap-1">
                  <div className="dot-pulse" style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--color-brand-500)',
                    animation: 'pulse 1.4s ease-in-out infinite'
                  }} />
                  <div className="dot-pulse" style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--color-brand-500)',
                    animation: 'pulse 1.4s ease-in-out 0.2s infinite'
                  }} />
                  <div className="dot-pulse" style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--color-brand-500)',
                    animation: 'pulse 1.4s ease-in-out 0.4s infinite'
                  }} />
                </div>
                <span style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-brand-600)',
                  fontWeight: 'var(--font-medium)'
                }}>
                  Thinking...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t px-8 py-6" style={{
        background: 'var(--color-bg-surface)',
        borderColor: 'var(--color-neutral-200)'
      }}>
        <div className="max-w-900px mx-auto" style={{
          background: '#FFFFFF',
          borderRadius: '20px',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          padding: '8px 12px',
          transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.015)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}
        onMouseEnter={(e) => {
          if (document.activeElement?.tagName !== 'INPUT') {
            e.currentTarget.style.border = '1px solid rgba(99, 102, 241, 0.2)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03), 0 4px 12px rgba(99, 102, 241, 0.08)';
          }
        }}
        onMouseLeave={(e) => {
          if (document.activeElement?.tagName !== 'INPUT') {
            e.currentTarget.style.border = '1px solid rgba(0, 0, 0, 0.06)';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.015)';
          }
        }}>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask for changes or modifications..."
            style={{
              flex: 1,
              fontSize: '16px',
              fontWeight: '400',
              color: '#2D3748',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              lineHeight: '1.5',
              padding: '10px 4px',
              letterSpacing: '-0.011em'
            }}
            className="placeholder:text-gray-400"
            onFocus={(e) => {
              const container = e.currentTarget.parentElement;
              if (container) {
                container.style.border = '1px solid rgba(99, 102, 241, 0.4)';
                container.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(99, 102, 241, 0.12)';
              }
            }}
            onBlur={(e) => {
              const container = e.currentTarget.parentElement;
              if (container) {
                container.style.border = '1px solid rgba(0, 0, 0, 0.06)';
                container.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.015)';
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="bg-gradient-brand"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-lg)',
              border: 'none',
              cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
              opacity: inputValue.trim() ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes mesh-flow-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(5%, -8%) scale(1.1);
          }
          66% {
            transform: translate(-3%, 5%) scale(0.95);
          }
        }

        @keyframes mesh-flow-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(-6%, 4%) scale(1.05) rotate(2deg);
          }
          66% {
            transform: translate(4%, -6%) scale(0.98) rotate(-2deg);
          }
        }

        @keyframes mesh-flow-3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translate(-8%, 8%) scale(1.15);
            opacity: 0.4;
          }
        }
      `}</style>
      </div>
    </div>
  );
};

export default ChatInterface;
