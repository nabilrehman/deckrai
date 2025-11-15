import React from 'react';

interface PlanDisplayProps {
  slideCount: number;
  style: string;
  audience: string;
  reasoning: string;
  onGenerate: () => void;
  onEdit: () => void;
}

const PlanDisplay: React.FC<PlanDisplayProps> = ({
  slideCount,
  style,
  audience,
  reasoning,
  onGenerate,
  onEdit
}) => {
  return (
    <div style={{
      marginTop: '16px'
    }}>
      {/* Main summary - bold and prominent */}
      <p style={{
        margin: '0 0 16px 0',
        fontSize: '16px',
        lineHeight: '1.5',
        color: '#1F2937'
      }}>
        I'll create a <strong style={{ fontWeight: '600' }}>{slideCount}-slide deck</strong> with <strong style={{ fontWeight: '600' }}>{style}</strong> style for <strong style={{ fontWeight: '600' }}>{audience}</strong>.
      </p>

      {/* Reasoning - subtle italic quote */}
      {reasoning && (
        <blockquote style={{
          margin: '0 0 24px 0',
          padding: '16px 20px',
          background: 'transparent',
          borderLeft: '4px solid #8B5CF6',
          fontSize: '15px',
          lineHeight: '1.6',
          color: '#5F6368',
          fontStyle: 'italic'
        }}>
          {reasoning}
        </blockquote>
      )}

      {/* Buttons - Gemini style */}
      <div style={{
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={onGenerate}
          style={{
            padding: '8px 20px',
            background: '#8B5CF6',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#7C3AED';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(139, 92, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#8B5CF6';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Generate Slides
        </button>

        <button
          onClick={onEdit}
          style={{
            padding: '8px 20px',
            background: 'transparent',
            color: '#8B5CF6',
            border: '1.5px solid #E0E0E0',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#FAFAFA';
            e.currentTarget.style.borderColor = '#BDBDBD';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = '#E0E0E0';
          }}
        >
          Edit plan
        </button>
      </div>
    </div>
  );
};

export default PlanDisplay;
