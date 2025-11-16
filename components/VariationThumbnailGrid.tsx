import React, { useState } from 'react';

interface VariationThumbnailGridProps {
  variations: string[];
  slideId: string;
  onApplyVariation: (slideId: string, variationIndex: number) => void;
}

const VariationThumbnailGrid: React.FC<VariationThumbnailGridProps> = ({
  variations,
  slideId,
  onApplyVariation
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const labels = ['Professional', 'Creative', 'Minimalist'];

  return (
    <div style={{
      marginTop: '16px',
      marginBottom: '8px'
    }}>
      {/* Grid of thumbnails */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '12px',
        maxWidth: '600px'
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
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: selectedIndex === index
                ? '3px solid #6366F1'
                : '2px solid rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
              transform: hoveredIndex === index ? 'scale(1.02)' : 'scale(1)',
              boxShadow: selectedIndex === index
                ? '0 4px 12px rgba(99, 102, 241, 0.3)'
                : hoveredIndex === index
                ? '0 4px 8px rgba(0, 0, 0, 0.1)'
                : 'none'
            }}
          >
            <img
              src={imageSrc}
              alt={`Variation ${index + 1}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                background: '#f5f5f5'
              }}
            />

            {/* Label overlay */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
              padding: '8px',
              color: 'white',
              fontSize: '12px',
              fontWeight: '500',
              textAlign: 'center'
            }}>
              {labels[index] || `Version ${index + 1}`}
            </div>

            {/* Selected checkmark */}
            {selectedIndex === index && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#6366F1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)'
              }}>
                <svg width="14" height="14" fill="white" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Apply button */}
      {selectedIndex !== null && (
        <div style={{
          marginTop: '16px',
          display: 'flex',
          justifyContent: 'center',
          animation: 'slideUp 0.2s ease-out'
        }}>
          <button
            onClick={() => onApplyVariation(slideId, selectedIndex)}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
            }}
          >
            ✓ Apply {labels[selectedIndex]} Version
          </button>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default VariationThumbnailGrid;
