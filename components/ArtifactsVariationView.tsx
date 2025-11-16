import React, { useState } from 'react';

interface ArtifactsVariationViewProps {
  variations: string[];
  slideId: string;
  slideName?: string;
  onApply: (slideId: string, variationIndex: number) => void;
  onRegenerate?: () => void;
  onCancel: () => void;
}

const ArtifactsVariationView: React.FC<ArtifactsVariationViewProps> = ({
  variations,
  slideId,
  slideName,
  onApply,
  onRegenerate,
  onCancel
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const labels = ['Professional', 'Creative', 'Minimalist'];

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#FFFFFF',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        animation: 'zoomIn 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '24px 32px',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        background: 'linear-gradient(to bottom, #FAFAFA, #FFFFFF)'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: '600',
          color: '#1F2937',
          marginBottom: '8px'
        }}>
          Choose Your Favorite
        </h2>
        <p style={{
          margin: 0,
          fontSize: '14px',
          color: '#6B7280'
        }}>
          {slideName || `Slide ${slideId}`} • {variations.length} variations generated
        </p>
      </div>

      {/* Main Preview Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '32px',
        gap: '24px',
        overflow: 'auto'
      }}>
        {/* Large Preview */}
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F9FAFB',
          borderRadius: '16px',
          border: '2px solid rgba(99, 102, 241, 0.1)',
          padding: '24px',
          minHeight: '400px',
          position: 'relative'
        }}>
          <img
            src={variations[selectedIndex]}
            alt={`Variation ${selectedIndex + 1}`}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
            }}
          />

          {/* Label Badge */}
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            {labels[selectedIndex]}
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          maxWidth: '800px',
          margin: '0 auto',
          width: '100%'
        }}>
          {variations.map((imageSrc, index) => (
            <div
              key={index}
              onClick={() => setSelectedIndex(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                position: 'relative',
                aspectRatio: '16/9',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: selectedIndex === index
                  ? '3px solid #6366F1'
                  : '2px solid rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease',
                transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                boxShadow: selectedIndex === index
                  ? '0 8px 24px rgba(99, 102, 241, 0.4)'
                  : hoveredIndex === index
                  ? '0 4px 12px rgba(0, 0, 0, 0.15)'
                  : '0 2px 4px rgba(0, 0, 0, 0.08)'
              }}
            >
              <img
                src={imageSrc}
                alt={`Variation ${index + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  background: '#F5F5F5'
                }}
              />

              {/* Label overlay */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)',
                padding: '12px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {labels[index]}
              </div>

              {/* Selected checkmark */}
              {selectedIndex === index && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#6366F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.5)'
                }}>
                  <svg width="16" height="16" fill="white" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        padding: '24px 32px',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        background: '#FAFAFA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <button
          onClick={onCancel}
          style={{
            padding: '12px 24px',
            background: '#FFFFFF',
            color: '#6B7280',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F9FAFB';
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)';
          }}
        >
          Cancel
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              style={{
                padding: '12px 24px',
                background: '#FFFFFF',
                color: '#6366F1',
                border: '1px solid #6366F1',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F5F3FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
              }}
            >
              🔄 Regenerate
            </button>
          )}

          <button
            onClick={() => onApply(slideId, selectedIndex)}
            style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
            }}
          >
            ✓ Apply {labels[selectedIndex]} Version
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes zoomOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  );
};

export default ArtifactsVariationView;
