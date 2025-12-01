import React from 'react';
import { STARTER_PROMPTS, StarterPrompt } from '../constants';

interface StarterPromptsProps {
  onPromptClick: (prompt: string) => void;
  maxVisible?: number; // Default: 4
}

/**
 * StarterPrompts Component
 *
 * Displays clickable prompt chips to help users discover output types.
 * Part of Phase 1 UX enhancement for multi-output content creation.
 */
const StarterPrompts: React.FC<StarterPromptsProps> = ({
  onPromptClick,
  maxVisible = 4
}) => {
  const visiblePrompts = STARTER_PROMPTS.slice(0, maxVisible);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      marginBottom: '24px'
    }}>
      {/* Section Header */}
      <div style={{
        color: '#424242',
        fontSize: '15px',
        fontWeight: '500',
        letterSpacing: '-0.01em'
      }}>
        Try these examples:
      </div>

      {/* Prompt Chips Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '12px'
      }}>
        {visiblePrompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onPromptClick(prompt.text)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px 16px',
              background: 'white',
              border: '1.5px solid #E0E0E0',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '400',
              color: '#424242',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
              lineHeight: '1.5',
              boxShadow: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FAFAFA';
              e.currentTarget.style.borderColor = '#8B5CF6';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#E0E0E0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Icon */}
            <span style={{
              fontSize: '20px',
              lineHeight: '1',
              flexShrink: 0
            }}>
              {prompt.icon}
            </span>

            {/* Text */}
            <span style={{ flex: 1 }}>
              {prompt.text}
            </span>
          </button>
        ))}
      </div>

      {/* Category Indicators (optional visual enhancement) */}
      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        marginTop: '4px'
      }}>
        {Array.from(new Set(visiblePrompts.map(p => p.category))).map(category => (
          <span
            key={category}
            style={{
              fontSize: '11px',
              fontWeight: '500',
              color: '#9E9E9E',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {category === 'sales' ? '💼 Sales' :
             category === 'social' ? '📱 Social' :
             category === 'marketing' ? '📊 Marketing' :
             category === 'training' ? '🎓 Training' : category}
          </span>
        ))}
      </div>
    </div>
  );
};

export default StarterPrompts;
