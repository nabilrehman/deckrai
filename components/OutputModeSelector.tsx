import React, { useState } from 'react';
import { OUTPUT_MODES, OutputMode } from '../constants';

interface OutputModeSelectorProps {
  selectedMode: string | null;
  selectedSlideCount: number | null;
  onModeSelect: (modeId: string, defaultSlideCount?: number) => void;
  onSlideCountChange: (count: number) => void;
}

/**
 * OutputModeSelector Component
 *
 * Flexible mode selector with progressive disclosure pattern (Canva-style).
 * Step 1: User selects output mode (Carousel, One Pager, Deck)
 * Step 2: If mode has slides, slide count options smoothly appear
 *
 * Features:
 * - Dynamic mode rendering from OUTPUT_MODES array
 * - Progressive disclosure of slide count options
 * - Smooth expand/collapse animations
 * - Purple highlight for selected mode
 * - Extensible for future output modes
 */
const OutputModeSelector: React.FC<OutputModeSelectorProps> = ({
  selectedMode,
  selectedSlideCount,
  onModeSelect,
  onSlideCountChange
}) => {
  const [isSlideCountExpanded, setIsSlideCountExpanded] = useState(false);

  const handleModeClick = (mode: OutputMode) => {
    const isAlreadySelected = selectedMode === mode.id;

    if (isAlreadySelected) {
      // Toggle slide count expansion if mode has slides
      if (mode.hasSlideCount) {
        setIsSlideCountExpanded(!isSlideCountExpanded);
      }
    } else {
      // Select new mode
      onModeSelect(mode.id, mode.defaultSlideCount);

      // Auto-expand slide count if mode has it
      if (mode.hasSlideCount) {
        setIsSlideCountExpanded(true);
      } else {
        setIsSlideCountExpanded(false);
      }
    }
  };

  const selectedModeObj = OUTPUT_MODES.find(m => m.id === selectedMode);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '16px',
      padding: '16px',
      background: '#F9FAFB',
      border: '1px solid #E5E7EB',
      borderRadius: '12px'
    }}>
      {/* Header */}
      <div style={{
        fontSize: '13px',
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        Choose output format
      </div>

      {/* Mode Selection Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '8px'
      }}>
        {OUTPUT_MODES.map((mode) => {
          const isSelected = selectedMode === mode.id;

          return (
            <button
              key={mode.id}
              onClick={() => handleModeClick(mode)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                padding: '12px',
                background: isSelected ? '#F5F3FF' : 'white',
                border: isSelected ? '2px solid #8B5CF6' : '1.5px solid #E0E0E0',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = '#FAFAFA';
                  e.currentTarget.style.borderColor = '#C0C0C0';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#E0E0E0';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {/* Icon */}
              <span style={{ fontSize: '28px' }}>{mode.icon}</span>

              {/* Label */}
              <span style={{
                fontSize: '14px',
                fontWeight: isSelected ? '600' : '500',
                color: isSelected ? '#8B5CF6' : '#424242',
                textAlign: 'center'
              }}>
                {mode.label}
              </span>

              {/* Description (subtle) */}
              {mode.description && (
                <span style={{
                  fontSize: '11px',
                  color: '#9CA3AF',
                  textAlign: 'center',
                  lineHeight: '1.3'
                }}>
                  {mode.description}
                </span>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  width: '6px',
                  height: '6px',
                  background: '#8B5CF6',
                  borderRadius: '50%'
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Progressive Disclosure: Slide Count Options */}
      {selectedModeObj && selectedModeObj.hasSlideCount && isSlideCountExpanded && (
        <div
          style={{
            overflow: 'hidden',
            animation: 'slideDown 0.3s ease-out',
            marginTop: '4px'
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px',
            background: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px'
          }}>
            {/* Slide count label */}
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#6B7280',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>Number of slides</span>
              {selectedSlideCount && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#8B5CF6',
                  background: '#F5F3FF',
                  padding: '2px 8px',
                  borderRadius: '6px'
                }}>
                  {selectedSlideCount}
                </span>
              )}
            </div>

            {/* Slide count chips */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px'
            }}>
              {selectedModeObj.slideCountOptions?.map((count) => {
                const isCountSelected = selectedSlideCount === count;

                return (
                  <button
                    key={count}
                    onClick={() => onSlideCountChange(count)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: isCountSelected ? 'white' : '#424242',
                      background: isCountSelected ? '#8B5CF6' : '#F3F4F6',
                      border: isCountSelected ? '1.5px solid #8B5CF6' : '1.5px solid #E5E7EB',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCountSelected) {
                        e.currentTarget.style.background = '#E5E7EB';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCountSelected) {
                        e.currentTarget.style.background = '#F3F4F6';
                        e.currentTarget.style.borderColor = '#E5E7EB';
                      }
                    }}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes slideDown {
            from {
              opacity: 0;
              max-height: 0;
              transform: translateY(-8px);
            }
            to {
              opacity: 1;
              max-height: 200px;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
};

export default OutputModeSelector;
