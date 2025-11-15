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

  // Calculate total thinking time if not provided
  // Use provided duration, or default to "a few seconds" if not available
  const thinkingTime = duration || 'a few seconds';

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

        {/* Thought duration */}
        <span>Thought for {thinkingTime}</span>

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
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '2px'
              }}>
                {step.status === 'completed' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="#10B981" opacity="0.1"/>
                    <path
                      d="M9 12l2 2 4-4"
                      stroke="#10B981"
                      strokeWidth="2"
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
