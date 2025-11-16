import React, { useState } from 'react';
import BrandedLoader from './BrandedLoader';
import SlideGenerationLoader from './SlideGenerationLoader';

export interface ThinkingStep {
  id: string;
  title: string;
  content?: string;
  status: 'pending' | 'active' | 'completed';
  timestamp?: number;
  type?: 'thinking' | 'generating' | 'processing'; // Used to determine which loader to show
}

interface ThinkingSectionProps {
  steps: ThinkingStep[];
  duration?: string; // e.g., "7s"
  defaultExpanded?: boolean;
}

const ThinkingSection: React.FC<ThinkingSectionProps> = ({
  steps,
  duration,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Check if any step is still active (thinking in progress)
  const isThinking = steps.some(step => step.status === 'active');

  // Calculate total thinking time if not provided
  // Safeguard: If duration looks like a timestamp (>1000s), default to "a few seconds"
  let thinkingTime = duration || 'a few seconds';

  // Extract numeric value from duration string (e.g., "3.5s" -> 3.5)
  const numericDuration = parseFloat(thinkingTime);

  // If duration is suspiciously large (>1000 seconds = ~16 mins), it's likely a timestamp bug
  if (!isNaN(numericDuration) && numericDuration > 1000) {
    console.warn('⚠️ Detected timestamp instead of duration:', thinkingTime);
    thinkingTime = 'a few seconds';
  }

  return (
    <div style={{
      marginBottom: '16px',
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Thinking Header - Always Visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 16px',
          background: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: isExpanded ? '12px 12px 0 0' : '12px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          color: '#374151',
          transition: 'all 150ms ease',
          textAlign: 'left'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
        }}
      >
        {/* AI Icon - Using BrandedLoader */}
        <BrandedLoader size={20} variant="inline" />

        {/* Thought duration or Thinking... */}
        {isThinking ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Thinking</span>
            <span style={{
              animation: 'blink 1.4s infinite',
              fontSize: '16px',
              lineHeight: '1'
            }}>...</span>
          </span>
        ) : (
          <span>Thought for {thinkingTime}</span>
        )}

        {/* Expand/Collapse Arrow */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            marginLeft: 'auto',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms ease'
          }}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Blinking animation CSS */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* Thinking Steps - Expandable */}
      {isExpanded && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.01)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {steps.map((step, index) => (
            <div
              key={step.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}
            >
              {/* Status Icon */}
              <div style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {step.status === 'completed' && (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{
                    filter: 'drop-shadow(0 2px 4px rgba(34, 197, 94, 0.2))'
                  }}>
                    <defs>
                      <linearGradient id="checkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#22C55E', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#34D399', stopOpacity: 1 }} />
                      </linearGradient>
                      <radialGradient id="checkGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" style={{ stopColor: '#22C55E', stopOpacity: 0.3 }} />
                        <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 0 }} />
                      </radialGradient>
                    </defs>
                    {/* Ambient glow background */}
                    <circle cx="12" cy="12" r="11" fill="url(#checkGlow)" />
                    {/* Soft background fill */}
                    <circle cx="12" cy="12" r="10" fill="url(#checkGradient)" opacity="0.12"/>
                    {/* Subtle outer ring */}
                    <circle cx="12" cy="12" r="10" stroke="url(#checkGradient)" strokeWidth="1.5" opacity="0.4"/>
                    {/* Bold checkmark */}
                    <path
                      d="M8 12l3 3 5-5"
                      stroke="url(#checkGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}

                {step.status === 'active' && (
                  <>
                    {step.type === 'generating' ? (
                      <SlideGenerationLoader size={20} />
                    ) : (
                      <BrandedLoader size={20} variant="inline" />
                    )}
                  </>
                )}

                {step.status === 'pending' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="#D1D5DB"
                      strokeWidth="2"
                      opacity="0.3"
                    />
                  </svg>
                )}
              </div>

              {/* Step Content */}
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: step.status === 'active' ? '#4F46E5' : '#374151',
                  marginBottom: step.content ? '4px' : '0',
                  letterSpacing: '-0.006em'
                }}>
                  {step.title}
                </div>

                {step.content && (
                  <div style={{
                    fontSize: '13px',
                    color: '#6B7280',
                    lineHeight: '1.5',
                    letterSpacing: '-0.006em'
                  }}>
                    {step.content}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default ThinkingSection;
