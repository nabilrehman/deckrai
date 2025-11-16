import React, { useState, useEffect } from 'react';
import { Slide } from '../types';

interface SlidePreviewInlineProps {
  slides: Slide[];
  title?: string;
  showComparison?: boolean; // For before/after views
  beforeSlides?: Slide[];
}

const SlidePreviewInline: React.FC<SlidePreviewInlineProps> = ({
  slides,
  title = 'Updated Slides',
  showComparison = false,
  beforeSlides = []
}) => {
  const [expandedSlideId, setExpandedSlideId] = useState<string | null>(null);

  // Close expanded view on Escape key press
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && expandedSlideId) {
        setExpandedSlideId(null);
      }
    };

    // Add event listener when expanded view is open
    if (expandedSlideId) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [expandedSlideId]);

  const getSlideImage = (slide: Slide): string => {
    return slide.history && slide.history.length > 0
      ? slide.history[slide.history.length - 1]
      : slide.originalSrc;
  };

  return (
    <div style={{
      marginTop: '12px',
      padding: '16px',
      background: '#F9FAFB',
      borderRadius: '12px',
      border: '1px solid rgba(0, 0, 0, 0.06)'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#4B5563',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" stroke="#6366F1" strokeWidth="1.5"/>
            <rect x="9" y="2" width="5" height="5" rx="1" stroke="#6366F1" strokeWidth="1.5"/>
            <rect x="2" y="9" width="5" height="5" rx="1" stroke="#6366F1" strokeWidth="1.5"/>
            <rect x="9" y="9" width="5" height="5" rx="1" stroke="#6366F1" strokeWidth="1.5"/>
          </svg>
          {title}
        </div>
        <div style={{
          fontSize: '12px',
          color: '#9CA3AF'
        }}>
          {slides.length} slide{slides.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Slide Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: showComparison ? 'repeat(auto-fill, minmax(280px, 1fr))' : 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: '12px'
      }}>
        {slides.map((slide, index) => {
          const beforeSlide = showComparison ? beforeSlides[index] : null;
          const isExpanded = expandedSlideId === slide.id;

          return (
            <div
              key={slide.id}
              onClick={() => setExpandedSlideId(isExpanded ? null : slide.id)}
              style={{
                background: 'white',
                borderRadius: '8px',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                boxShadow: isExpanded ? '0 4px 12px rgba(99, 102, 241, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.05)'
              }}
              onMouseEnter={(e) => {
                if (!isExpanded) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isExpanded) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                }
              }}
            >
              {showComparison && beforeSlide ? (
                /* Before/After View */
                <div>
                  {/* Before */}
                  <div style={{
                    position: 'relative',
                    paddingBottom: '56.25%',
                    background: '#F3F4F6'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      padding: '4px 8px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '600',
                      borderRadius: '4px',
                      zIndex: 1
                    }}>
                      BEFORE
                    </div>
                    {getSlideImage(beforeSlide) && (
                      <img
                        src={getSlideImage(beforeSlide)}
                        alt={`Before - Slide ${index + 1}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{
                    height: '2px',
                    background: 'linear-gradient(to right, #E5E7EB, #6366F1, #E5E7EB)'
                  }}></div>

                  {/* After */}
                  <div style={{
                    position: 'relative',
                    paddingBottom: '56.25%',
                    background: '#F3F4F6'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      padding: '4px 8px',
                      background: 'rgba(99, 102, 241, 0.9)',
                      color: 'white',
                      fontSize: '10px',
                      fontWeight: '600',
                      borderRadius: '4px',
                      zIndex: 1
                    }}>
                      AFTER
                    </div>
                    {getSlideImage(slide) && (
                      <img
                        src={getSlideImage(slide)}
                        alt={`After - Slide ${index + 1}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                /* Single View */
                <div style={{
                  position: 'relative',
                  paddingBottom: '56.25%',
                  background: '#F3F4F6'
                }}>
                  {getSlideImage(slide) && (
                    <img
                      src={getSlideImage(slide)}
                      alt={slide.name || `Slide ${index + 1}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  )}

                  {/* Slide number badge */}
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    width: '24px',
                    height: '24px',
                    background: 'rgba(99, 102, 241, 0.9)',
                    color: 'white',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    {index + 1}
                  </div>

                  {/* Expand icon */}
                  {!isExpanded && (
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      width: '24px',
                      height: '24px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                      opacity: 0,
                      transition: 'opacity 200ms ease'
                    }}
                    className="expand-icon"
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6366F1" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                      </svg>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div style={{
                padding: '8px 10px',
                fontSize: '11px',
                color: '#6B7280',
                fontWeight: '500',
                borderTop: '1px solid rgba(0, 0, 0, 0.04)',
                background: 'white'
              }}>
                {slide.name || `Slide ${index + 1}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded view */}
      {expandedSlideId && (
        <div
          onClick={() => setExpandedSlideId(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            animation: 'fadeIn 200ms ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
            }}
          >
            <img
              src={getSlideImage(slides.find(s => s.id === expandedSlideId)!)}
              alt="Expanded view"
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 80px)',
                width: 'auto',
                height: 'auto'
              }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={() => setExpandedSlideId(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 200ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Show expand icon on hover */
        div:hover .expand-icon {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
};

export default SlidePreviewInline;
