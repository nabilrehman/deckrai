import React from 'react';

interface ModeSelectionCardsProps {
  onSelectMode: (mode: 'template' | 'crazy') => void;
  referenceCount: number;
}

const ModeSelectionCards: React.FC<ModeSelectionCardsProps> = ({
  onSelectMode,
  referenceCount
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
      marginTop: '20px'
    }}>
      {/* Template Mode Card */}
      <div style={{
        background: '#FFFFFF',
        border: '1.5px solid #E5E7EB',
        borderLeft: '4px solid #6366F1',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.02)';
        e.currentTarget.style.borderColor = '#E5E7EB';
        e.currentTarget.style.borderLeftColor = '#6366F1';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#FFFFFF';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
      }}
      >
        {/* Icon */}
        <div style={{ fontSize: '32px', lineHeight: '1' }}>🎨</div>

        {/* Content */}
        <div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '8px',
            letterSpacing: '-0.01em'
          }}>
            Use Company Templates
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '1.5'
          }}>
            AI matches your content to {referenceCount} uploaded reference{referenceCount > 1 ? 's' : ''}. Perfect brand consistency.
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onSelectMode('template')}
          style={{
            width: '100%',
            padding: '12px',
            background: '#6366F1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4F46E5';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#6366F1';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          }}
        >
          Select Templates
        </button>
      </div>

      {/* Crazy Mode Card */}
      <div style={{
        background: '#FFFFFF',
        border: '1.5px solid #E5E7EB',
        borderLeft: '4px solid #EA580C',
        borderRadius: '12px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(234, 88, 12, 0.02)';
        e.currentTarget.style.borderColor = '#E5E7EB';
        e.currentTarget.style.borderLeftColor = '#EA580C';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(234, 88, 12, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = '#FFFFFF';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
      }}
      >
        {/* Icon */}
        <div style={{ fontSize: '32px', lineHeight: '1' }}>⚡</div>

        {/* Content */}
        <div>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '8px',
            letterSpacing: '-0.01em'
          }}>
            Let Deckr Go Crazy
          </div>
          <div style={{
            fontSize: '14px',
            color: '#6B7280',
            lineHeight: '1.5'
          }}>
            AI researches your brand and creates fresh designs from scratch. Maximum creativity.
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => onSelectMode('crazy')}
          style={{
            width: '100%',
            padding: '12px',
            background: '#EA580C',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#DC2626';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(234, 88, 12, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#EA580C';
            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          }}
        >
          Go Crazy
        </button>
      </div>
    </div>
  );
};

export default ModeSelectionCards;
