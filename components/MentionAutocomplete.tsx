import React from 'react';
import { Slide } from '../types';

interface MentionAutocompleteProps {
  slides: Slide[];
  searchQuery: string;
  position: { top: number; left: number; bottom?: number };
  onSelect: (slideIds: string[]) => void;
  selectedIndex: number;
}

const MentionAutocomplete: React.FC<MentionAutocompleteProps> = ({
  slides,
  searchQuery,
  position,
  onSelect,
  selectedIndex
}) => {
  // Filter slides based on search query
  const filteredSlides = slides.filter((slide, index) => {
    const slideNum = (index + 1).toString();
    const slideName = slide.name?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();

    return slideNum.includes(query) || slideName.includes(query);
  });

  // Add "all slides" option
  const options = [
    { type: 'all' as const, label: 'All slides', value: slides.map(s => s.id) },
    ...filteredSlides.map((slide, idx) => ({
      type: 'single' as const,
      label: `Slide ${slides.findIndex(s => s.id === slide.id) + 1}`,
      subtitle: slide.name,
      value: [slide.id],
      thumbnail: slide.history && slide.history.length > 0
        ? slide.history[slide.history.length - 1]
        : slide.originalSrc
    }))
  ];

  if (options.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: position.bottom ? `${position.bottom + 8}px` : undefined,
        top: !position.bottom ? `${position.top}px` : undefined,
        left: `${position.left}px`,
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.04)',
        minWidth: '320px',
        maxWidth: '400px',
        maxHeight: '400px',
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '6px',
        zIndex: 1000,
        animation: 'slideUpFade 150ms ease-out',
        scrollbarWidth: 'thin',
        scrollbarColor: '#CBD5E1 #F1F5F9'
      }}
      className="mention-autocomplete-scrollbar"
    >
      {/* Header */}
      <div style={{
        padding: '8px 10px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Select Slides
      </div>

      {/* Options */}
      {options.map((option, index) => (
        <button
          key={option.type === 'all' ? 'all' : option.value[0]}
          onClick={() => onSelect(option.value)}
          style={{
            width: '100%',
            padding: '10px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: selectedIndex === index ? '#F0F1FF' : 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'all 100ms ease',
            textAlign: 'left'
          }}
          onMouseEnter={(e) => {
            if (selectedIndex !== index) {
              e.currentTarget.style.background = '#F9FAFB';
            }
          }}
          onMouseLeave={(e) => {
            if (selectedIndex !== index) {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {/* Thumbnail or Icon */}
          {option.type === 'all' ? (
            <div style={{
              width: '48px',
              height: '36px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          ) : (
            <div style={{
              width: '48px',
              height: '36px',
              borderRadius: '4px',
              background: '#F3F4F6',
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid rgba(0, 0, 0, 0.06)'
            }}>
              {option.thumbnail && (
                <img
                  src={option.thumbnail}
                  alt={option.label}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              )}
            </div>
          )}

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '500',
              color: selectedIndex === index ? '#4F46E5' : '#1F2937',
              marginBottom: option.subtitle ? '2px' : '0'
            }}>
              {option.label}
            </div>
            {option.subtitle && (
              <div style={{
                fontSize: '12px',
                color: '#6B7280',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {option.subtitle}
              </div>
            )}
          </div>

          {/* Selection indicator */}
          {selectedIndex === index && (
            <div style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#6366F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <svg width="12" height="12" fill="white" viewBox="0 0 12 12">
                <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
          )}
        </button>
      ))}

      {/* Footer hint */}
      <div style={{
        padding: '8px 10px',
        fontSize: '11px',
        color: '#9CA3AF',
        borderTop: '1px solid rgba(0, 0, 0, 0.04)',
        marginTop: '4px'
      }}>
        ↑↓ Navigate • ⏎ Select • Esc Cancel
      </div>

      <style>{`
        @keyframes slideUpFade {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Custom scrollbar for webkit browsers */
        .mention-autocomplete-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .mention-autocomplete-scrollbar::-webkit-scrollbar-track {
          background: #F1F5F9;
          border-radius: 4px;
        }

        .mention-autocomplete-scrollbar::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 4px;
        }

        .mention-autocomplete-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}</style>
    </div>
  );
};

export default MentionAutocomplete;
