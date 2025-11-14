import React, { useState, useRef, useEffect } from 'react';

interface ChatLandingViewProps {
  onStartChat: (initialPrompt: string, files?: File[]) => void;
}

const ChatLandingView: React.FC<ChatLandingViewProps> = ({ onStartChat }) => {
  const [inputValue, setInputValue] = useState('');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Gemini 2.0 Flash');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  const suggestedPrompts = [
    'Sales deck for enterprise clients',
    'Product launch presentation',
    'Investor pitch deck',
    'Training materials'
  ];

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setShowUploadMenu(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false);
      }
    };

    if (showUploadMenu || showModelMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUploadMenu, showModelMenu]);

  const handleGenerate = () => {
    if (inputValue.trim()) {
      onStartChat(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onStartChat('', Array.from(files));
    }
  };

  const handlePromptClick = (prompt: string) => {
    onStartChat(prompt);
  };

  const handleUploadFiles = () => {
    setShowUploadMenu(false);
    fileInputRef.current?.click();
  };

  const handleCreateSingleSlide = () => {
    setShowUploadMenu(false);
    onStartChat('Create a single slide');
  };

  const handleConnectDrive = () => {
    setShowUploadMenu(false);
    // Placeholder for future Drive integration
    alert('Connect with Drive - Coming soon!');
  };

  const models = [
    { name: 'Gemini 2.0 Flash', description: 'Fastest, most efficient' },
    { name: 'Gemini 2.5 Pro', description: 'Advanced reasoning' },
    { name: 'Claude Sonnet 4.5', description: 'Best for complex tasks' }
  ];

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    setShowModelMenu(false);
  };

  return (
    <div className="w-full h-full flex items-center justify-center" style={{
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background - Magic Patterns Inspired */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, #FAFBFC 0%, #F5F7FA 100%)',
        zIndex: 0,
        overflow: 'hidden'
      }}>
        {/* Gradient Orb 1 - Top Left */}
        <div className="mesh-gradient-1" style={{
          position: 'absolute',
          top: '-50%',
          left: '-25%',
          width: '150%',
          height: '150%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.06) 25%, transparent 50%)',
          animation: 'mesh-flow-1 20s ease-in-out infinite',
          opacity: 0.8,
          mixBlendMode: 'normal',
          filter: 'blur(60px)'
        }} />

        {/* Gradient Orb 2 - Bottom Right */}
        <div className="mesh-gradient-2" style={{
          position: 'absolute',
          bottom: '-50%',
          right: '-25%',
          width: '150%',
          height: '150%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(168, 85, 247, 0.10) 0%, rgba(168, 85, 247, 0.05) 25%, transparent 50%)',
          animation: 'mesh-flow-2 25s ease-in-out infinite',
          opacity: 0.7,
          mixBlendMode: 'normal',
          filter: 'blur(60px)'
        }} />

        {/* Gradient Orb 3 - Center Right */}
        <div className="mesh-gradient-3" style={{
          position: 'absolute',
          top: '30%',
          right: '20%',
          width: '80%',
          height: '80%',
          background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 30%, transparent 60%)',
          animation: 'mesh-flow-3 30s ease-in-out infinite',
          opacity: 0.9,
          mixBlendMode: 'normal',
          filter: 'blur(70px)'
        }} />

        {/* Gradient Orb 4 - Center Left (New - adds more depth) */}
        <div className="mesh-gradient-4" style={{
          position: 'absolute',
          top: '60%',
          left: '10%',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.06) 0%, transparent 50%)',
          animation: 'mesh-flow-4 35s ease-in-out infinite',
          opacity: 0.6,
          mixBlendMode: 'normal',
          filter: 'blur(80px)'
        }} />
      </div>

      {/* Content Layer */}
      <div className="w-full max-w-4xl px-6" style={{ position: 'relative', zIndex: 1 }}>
        {/* Branding */}
        <div className="text-center mb-16">
          <h1 style={{
            fontSize: '64px',
            fontWeight: 'var(--font-bold)',
            color: '#0F172A',
            marginBottom: '20px',
            letterSpacing: '-0.03em',
            lineHeight: '1.1'
          }}>
            What can I help you <br/>create today?
          </h1>
          <p style={{
            fontSize: '20px',
            color: '#64748B',
            fontWeight: 'var(--font-regular)',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Describe your presentation or upload existing slides
          </p>
        </div>

        {/* Hero Input - Gemini Match with Auto-Expand */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '32px',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            padding: '20px 24px',
            minHeight: '96px',
            transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.015)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            position: 'relative'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = '1px solid rgba(99, 102, 241, 0.2)';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03), 0 4px 12px rgba(99, 102, 241, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = '1px solid rgba(0, 0, 0, 0.06)';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.015)';
          }}
        >
          {/* Top Zone: Text Input - Auto-expand textarea */}
          <div style={{ flex: 1, minHeight: '24px' }}>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="application/pdf,image/*"
              multiple
              onChange={handleFileUpload}
            />

            {/* Textarea for multi-line auto-expand */}
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your presentation or upload files..."
              rows={1}
              style={{
                width: '100%',
                fontSize: '16px',
                fontWeight: '400',
                color: '#2D3748',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                lineHeight: '1.5',
                padding: '0',
                letterSpacing: '-0.011em',
                resize: 'none',
                overflow: 'hidden',
                fontFamily: 'inherit'
              }}
              className="placeholder:text-gray-400"
              onInput={(e) => {
                // Auto-resize textarea as user types
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>

          {/* Bottom Zone: Controls */}
          <div className="flex items-center justify-between gap-3">
            {/* Left Side: Plus Button + Tools Button */}
            <div className="flex items-center gap-1">
              {/* Plus Button with Dropdown */}
              <div className="relative flex-shrink-0" ref={uploadMenuRef}>
                <button
                  onClick={() => setShowUploadMenu(!showUploadMenu)}
                  className="flex-shrink-0"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '20px',
                    background: showUploadMenu ? '#F9FAFB' : 'transparent',
                    color: showUploadMenu ? '#4F46E5' : '#9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 100ms ease',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!showUploadMenu) {
                      e.currentTarget.style.background = '#F9FAFB';
                      e.currentTarget.style.color = '#4F46E5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showUploadMenu) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#9CA3AF';
                    }
                  }}
                  title="Upload or create"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                {/* Dropdown Menu - Opens Upward */}
                {showUploadMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '48px',
                      left: '0',
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                      minWidth: '220px',
                      padding: '8px',
                      zIndex: 50,
                      animation: 'slideUp 150ms ease-out'
                    }}
                  >
                    <button
                      onClick={handleUploadFiles}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 100ms ease',
                        fontSize: '15px',
                        fontWeight: '400',
                        color: '#1F2937',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span>Upload files</span>
                    </button>

                    <button
                      onClick={handleCreateSingleSlide}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 100ms ease',
                        fontSize: '15px',
                        fontWeight: '400',
                        color: '#1F2937',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span>Create single slide</span>
                    </button>

                    <button
                      onClick={handleConnectDrive}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 100ms ease',
                        fontSize: '15px',
                        fontWeight: '400',
                        color: '#1F2937',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 110 4h-2.5m4.5 0h1.5a2 2 0 012 2v0a2 2 0 01-2 2H9m-6 0h6" />
                      </svg>
                      <span>Connect with Drive</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tools Button - Gemini Style */}
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '16px',
                  color: '#6B7280',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 100ms ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
                  e.currentTarget.style.color = '#4F46E5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#6B7280';
                }}
                title="Tools"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Tools</span>
              </button>
            </div>

            {/* Right Side: Model Selector + Generate Button */}
            <div className="flex items-center gap-2">
              {/* Model Selector */}
              <div className="relative" ref={modelMenuRef}>
                <button
                  onClick={() => setShowModelMenu(!showModelMenu)}
                  style={{
                    padding: '8px 12px',
                    background: '#F3F4F6',
                    border: 'none',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#4B5563',
                    transition: 'all 150ms ease',
                    height: '40px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#E5E7EB';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#F3F4F6';
                  }}
                >
                  <span>{selectedModel.replace('Gemini ', '').replace('Claude ', '')}</span>
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    style={{
                      transform: showModelMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 150ms ease'
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Model Dropdown */}
                {showModelMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '52px',
                      right: '0',
                      background: '#FFFFFF',
                      borderRadius: '16px',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                      minWidth: '280px',
                      padding: '8px',
                      zIndex: 50
                    }}
                  >
                    {models.map((model, index) => (
                      <button
                        key={index}
                        onClick={() => handleModelSelect(model.name)}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          gap: '2px',
                          background: selectedModel === model.name ? '#F0F1FF' : 'transparent',
                          border: 'none',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 100ms ease',
                          textAlign: 'left'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedModel !== model.name) {
                            e.currentTarget.style.background = '#F9FAFB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedModel !== model.name) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        <div style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: selectedModel === model.name ? '#4F46E5' : '#1F2937'
                        }}>
                          {model.name}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          fontWeight: '400'
                        }}>
                          {model.description}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button - Premium Circular Icon */}
              {inputValue.trim() && (
                <button
                  onClick={handleGenerate}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.28)',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.08)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #686BF2 0%, #5349E6 100%)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.42)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.28)';
                  }}
                  title="Submit"
                >
                  {/* Arrow Up Icon - Crisp & Bold */}
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Suggested Prompts - Refined */}
        <div className="flex flex-wrap gap-2 mt-10 justify-center">
          {suggestedPrompts.map((prompt, index) => (
            <button
              key={index}
              onClick={() => handlePromptClick(prompt)}
              style={{
                padding: '11px 20px',
                background: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                borderRadius: '28px',
                color: '#4B5563',
                fontWeight: '400',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 100ms ease',
                boxShadow: '0 0.5px 1px rgba(0, 0, 0, 0.02)',
                letterSpacing: '-0.006em'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.border = '1px solid rgba(99, 102, 241, 0.15)';
                e.currentTarget.style.color = '#4F46E5';
                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 6px rgba(99, 102, 241, 0.05)';
                e.currentTarget.style.transform = 'translateY(-0.5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                e.currentTarget.style.border = '1px solid rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.color = '#4B5563';
                e.currentTarget.style.boxShadow = '0 0.5px 1px rgba(0, 0, 0, 0.02)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

      </div>

      <style>{`
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

        @keyframes mesh-flow-4 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(10%, -10%) scale(1.08);
          }
        }

        @keyframes slideUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatLandingView;
