import React, { useState } from 'react';
import SlideGenerationLoader from './SlideGenerationLoader';
import { Slide } from '../types';

type ViewMode = 'grid' | 'filmstrip' | 'presenter';

interface ArtifactsPanelProps {
  slides: Slide[];
  onSlideClick?: (slide: Slide) => void;
  onSlideEdit?: (slide: Slide) => void;
  onSlideDuplicate?: (slide: Slide) => void;
  onSlideDelete?: (slide: Slide) => void;
  onOpenInEditor?: () => void;
  onDownloadPDF?: () => void;
}

// Helper functions at module scope (accessible to all components)
const getSlideImage = (slide: Slide): string => {
  return slide.history && slide.history.length > 0
    ? slide.history[slide.history.length - 1]
    : slide.originalSrc;
};

const getSlideNumber = (index: number): number => index + 1;

const ArtifactsPanel: React.FC<ArtifactsPanelProps> = ({
  slides,
  onSlideClick,
  onSlideEdit,
  onSlideDuplicate,
  onSlideDelete,
  onOpenInEditor,
  onDownloadPDF
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(
    slides.length > 0 ? slides[0].id : null
  );

  const handleSlideClick = (slide: Slide) => {
    setSelectedSlideId(slide.id);
    onSlideClick?.(slide);
  };

  const selectedSlide = slides.find(s => s.id === selectedSlideId);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--color-bg-app)',
      borderLeft: '1px solid rgba(0, 0, 0, 0.06)'
    }}>
      {/* Header */}
      <div style={{
        padding: 'var(--space-4) var(--space-6)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        background: 'var(--color-bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '2px',
            letterSpacing: '-0.02em',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
          }}>
            Presentation Slides
          </div>
          <div style={{
            fontSize: '13px',
            color: '#6B7280',
            fontWeight: '400'
          }}>
            {slides.filter(s => !s.isGenerating).length} of {slides.length} complete
          </div>
        </div>

        {/* View Mode Controls */}
        <div style={{
          display: 'flex',
          gap: 'var(--space-2)',
          alignItems: 'center'
        }}>
          {/* Grid View */}
          <button
            onClick={() => setViewMode('grid')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              background: viewMode === 'grid' ? '#6366F1' : 'transparent',
              color: viewMode === 'grid' ? 'white' : '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-fast)'
            }}
            title="Grid View"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>

          {/* Filmstrip View */}
          <button
            onClick={() => setViewMode('filmstrip')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              background: viewMode === 'filmstrip' ? '#6366F1' : 'transparent',
              color: viewMode === 'filmstrip' ? 'white' : '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-fast)'
            }}
            title="Filmstrip View"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="3" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="6.5" y="3" width="7.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>

          {/* Presenter View */}
          <button
            onClick={() => setViewMode('presenter')}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              background: viewMode === 'presenter' ? '#6366F1' : 'transparent',
              color: viewMode === 'presenter' ? 'white' : '#6B7280',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition-fast)'
            }}
            title="Presenter View"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="3" y="11" width="2" height="2" rx="0.5" fill="currentColor"/>
              <rect x="7" y="11" width="2" height="2" rx="0.5" fill="currentColor"/>
              <rect x="11" y="11" width="2" height="2" rx="0.5" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area - Different layouts based on view mode */}
      <div style={{
        flex: 1,
        overflow: 'hidden',
        display: 'flex'
      }}>
        {viewMode === 'grid' && (
          <GridView
            slides={slides}
            selectedSlideId={selectedSlideId}
            onSlideClick={handleSlideClick}
            onSlideEdit={onSlideEdit}
            onSlideDuplicate={onSlideDuplicate}
            onSlideDelete={onSlideDelete}
          />
        )}

        {viewMode === 'filmstrip' && (
          <FilmstripView
            slides={slides}
            selectedSlide={selectedSlide}
            selectedSlideId={selectedSlideId}
            onSlideClick={handleSlideClick}
            onSlideEdit={onSlideEdit}
            onSlideDuplicate={onSlideDuplicate}
            onSlideDelete={onSlideDelete}
          />
        )}

        {viewMode === 'presenter' && (
          <PresenterView
            slides={slides}
            selectedSlide={selectedSlide}
            selectedSlideId={selectedSlideId}
            onSlideClick={handleSlideClick}
          />
        )}
      </div>

      {/* Footer Actions */}
      <div style={{
        padding: 'var(--space-4) var(--space-6)',
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        background: 'var(--color-bg-surface)',
        display: 'flex',
        gap: 'var(--space-3)',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onDownloadPDF}
          style={{
            padding: '10px 20px',
            background: 'transparent',
            border: '1.5px solid #E0E0E0',
            borderRadius: '20px',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: '#6366F1',
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
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
          Download PDF
        </button>

        <button
          onClick={onOpenInEditor}
          style={{
            padding: '10px 20px',
            background: '#6366F1',
            border: 'none',
            borderRadius: '20px',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-medium)',
            color: 'white',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            boxShadow: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#4F46E5';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(99, 102, 241, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#6366F1';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Open in Editor
        </button>
      </div>
    </div>
  );
};

// Grid View Component
const GridView: React.FC<{
  slides: Slide[];
  selectedSlideId: string | null;
  onSlideClick: (slide: Slide) => void;
  onSlideEdit?: (slide: Slide) => void;
  onSlideDuplicate?: (slide: Slide) => void;
  onSlideDelete?: (slide: Slide) => void;
}> = ({ slides, selectedSlideId, onSlideClick, onSlideEdit, onSlideDuplicate, onSlideDelete }) => {
  const selectedSlide = slides.find(s => s.id === selectedSlideId);
  const selectedIndex = slides.findIndex(s => s.id === selectedSlideId);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Large Preview Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8F9FA',
        padding: 'var(--space-6)',
        overflow: 'hidden'
      }}>
        {selectedSlide ? (
          <div style={{
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {selectedSlide.isGenerating ? (
              <SlideGenerationLoader size={64} />
            ) : getSlideImage(selectedSlide) ? (
              <img
                src={getSlideImage(selectedSlide)}
                alt={selectedSlide.name || `Slide ${selectedIndex + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                }}
              />
            ) : (
              <div style={{
                padding: 'var(--space-6)',
                color: '#9CA3AF',
                fontSize: 'var(--text-sm)'
              }}>
                No preview available
              </div>
            )}
          </div>
        ) : (
          <div style={{
            padding: 'var(--space-6)',
            color: '#9CA3AF',
            fontSize: 'var(--text-sm)'
          }}>
            Select a slide to preview
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      <div style={{
        borderTop: '1px solid rgba(0, 0, 0, 0.06)',
        background: 'white',
        padding: 'var(--space-4)',
        overflowX: 'auto',
        overflowY: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          gap: 'var(--space-3)',
          minHeight: '120px'
        }}>
          {slides.map((slide, slideIndex) => (
            <div
              key={slide.id}
              onClick={() => onSlideClick(slide)}
              style={{
                flexShrink: 0,
                width: '160px',
                borderRadius: 'var(--radius-md)',
                border: slide.id === selectedSlideId ? '2px solid #6366F1' : '1px solid rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                background: 'white',
                boxShadow: slide.id === selectedSlideId ? '0 0 0 3px rgba(99, 102, 241, 0.1)' : 'none'
              }}
            >
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                background: '#F8F9FA'
              }}>
                {slide.isGenerating ? (
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <SlideGenerationLoader size={24} />
                  </div>
                ) : getSlideImage(slide) && (
                  <img
                    src={getSlideImage(slide)}
                    alt={slide.name || `Slide ${slideIndex + 1}`}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                )}
              </div>
              <div style={{
                padding: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-medium)',
                color: '#6B7280',
                textAlign: 'center',
                borderTop: '1px solid rgba(0, 0, 0, 0.04)'
              }}>
                {slideIndex + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Filmstrip View Component
const FilmstripView: React.FC<{
  slides: Slide[];
  selectedSlide: Slide | undefined;
  selectedSlideId: string | null;
  onSlideClick: (slide: Slide) => void;
  onSlideEdit?: (slide: Slide) => void;
  onSlideDuplicate?: (slide: Slide) => void;
  onSlideDelete?: (slide: Slide) => void;
}> = ({ slides, selectedSlide, selectedSlideId, onSlideClick, onSlideEdit, onSlideDuplicate, onSlideDelete }) => {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Left Sidebar - Thumbnails */}
      <div style={{
        width: '20%',
        borderRight: '1px solid rgba(0, 0, 0, 0.06)',
        overflowY: 'auto',
        padding: 'var(--space-3)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)'
        }}>
          {slides.map((slide, slideIndex) => (
            <div
              key={slide.id}
              onClick={() => onSlideClick(slide)}
              style={{
                borderRadius: 'var(--radius-md)',
                border: slide.id === selectedSlideId ? '2px solid #6366F1' : '1px solid rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                background: 'white'
              }}
            >
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                background: '#F8F9FA'
              }}>
                {slide.isGenerating ? (
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <SlideGenerationLoader size={24} />
                  </div>
                ) : getSlideImage(slide) && (
                  <img
                    src={getSlideImage(slide)}
                    alt={slide.name || `Slide ${slideIndex + 1}`}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                )}
              </div>
              <div style={{
                padding: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-medium)',
                color: '#6B7280',
                textAlign: 'center',
                borderTop: '1px solid rgba(0, 0, 0, 0.04)'
              }}>
                {slideIndex + 1}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Selected Slide */}
      <div style={{
        flex: 1,
        padding: 'var(--space-6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        overflowY: 'auto'
      }}>
        {selectedSlide ? (
          <>
            {/* Large Preview */}
            <div style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              background: 'white'
            }}>
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%',
                background: '#F8F9FA'
              }}>
                {selectedSlide.isGenerating ? (
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <SlideGenerationLoader size={64} />
                  </div>
                ) : getSlideImage(selectedSlide) && (
                  <img
                    src={getSlideImage(selectedSlide)}
                    alt={selectedSlide.name || `Slide ${slides.findIndex(s => s.id === selectedSlide.id) + 1}`}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Slide Info & Actions */}
            <div>
              <input
                type="text"
                value={selectedSlide.name || `Slide ${slides.findIndex(s => s.id === selectedSlide.id) + 1}`}
                onChange={(e) => {
                  // Handle title change
                }}
                style={{
                  width: '100%',
                  padding: 'var(--space-3)',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-semibold)',
                  color: '#111827',
                  border: '1px solid rgba(0, 0, 0, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  background: 'white',
                  marginBottom: 'var(--space-3)'
                }}
              />

              <div style={{
                display: 'flex',
                gap: 'var(--space-2)'
              }}>
                <button
                  onClick={() => onSlideEdit?.(selectedSlide)}
                  disabled={selectedSlide.isGenerating}
                  style={{
                    padding: '8px 16px',
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    cursor: selectedSlide.isGenerating ? 'not-allowed' : 'pointer',
                    opacity: selectedSlide.isGenerating ? 0.5 : 1,
                    transition: 'var(--transition-fast)'
                  }}
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => onSlideDuplicate?.(selectedSlide)}
                  disabled={selectedSlide.isGenerating}
                  style={{
                    padding: '8px 16px',
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    cursor: selectedSlide.isGenerating ? 'not-allowed' : 'pointer',
                    opacity: selectedSlide.isGenerating ? 0.5 : 1,
                    transition: 'var(--transition-fast)'
                  }}
                >
                  📋 Duplicate
                </button>
                <button
                  onClick={() => onSlideDelete?.(selectedSlide)}
                  disabled={selectedSlide.isGenerating}
                  style={{
                    padding: '8px 16px',
                    background: 'white',
                    border: '1px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    color: '#EF4444',
                    cursor: selectedSlide.isGenerating ? 'not-allowed' : 'pointer',
                    opacity: selectedSlide.isGenerating ? 0.5 : 1,
                    transition: 'var(--transition-fast)'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            fontSize: 'var(--text-base)'
          }}>
            Select a slide to preview
          </div>
        )}
      </div>
    </div>
  );
};

// Presenter View Component
const PresenterView: React.FC<{
  slides: Slide[];
  selectedSlide: Slide | undefined;
  selectedSlideId: string | null;
  onSlideClick: (slide: Slide) => void;
}> = ({ slides, selectedSlide, selectedSlideId, onSlideClick }) => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: 'var(--space-6)',
      gap: 'var(--space-4)'
    }}>
      {/* Large Current Slide */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {selectedSlide ? (
          <div style={{
            maxWidth: '800px',
            width: '100%',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-2xl)',
            background: 'white'
          }}>
            <div style={{
              position: 'relative',
              paddingBottom: '56.25%',
              background: '#F8F9FA'
            }}>
              {selectedSlide.isGenerating ? (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <SlideGenerationLoader size={64} />
                </div>
              ) : selectedSlide.src && (
                <img
                  src={selectedSlide.src}
                  alt={selectedSlide.title || `Slide ${selectedSlide.index + 1}`}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <div style={{
            color: '#9CA3AF',
            fontSize: 'var(--text-lg)'
          }}>
            No slide selected
          </div>
        )}
      </div>

      {/* Horizontal Filmstrip */}
      <div style={{
        height: '120px',
        overflowX: 'auto',
        overflowY: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          gap: 'var(--space-3)',
          height: '100%'
        }}>
          {slides.map((slide, slideIndex) => (
            <div
              key={slide.id}
              onClick={() => onSlideClick(slide)}
              style={{
                width: '160px',
                flexShrink: 0,
                borderRadius: 'var(--radius-md)',
                border: slide.id === selectedSlideId ? '2px solid #6366F1' : '1px solid rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                background: 'white',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{
                flex: 1,
                position: 'relative',
                background: '#F8F9FA'
              }}>
                {slide.isGenerating ? (
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <SlideGenerationLoader size={24} />
                  </div>
                ) : getSlideImage(slide) && (
                  <img
                    src={getSlideImage(slide)}
                    alt={slide.name || `Slide ${slideIndex + 1}`}
                    style={{
                      position: 'absolute',
                      top: 0, left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                )}
              </div>
              <div style={{
                padding: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                fontWeight: 'var(--font-medium)',
                color: slide.id === selectedSlideId ? '#6366F1' : '#6B7280',
                textAlign: 'center',
                borderTop: '1px solid rgba(0, 0, 0, 0.04)',
                background: slide.id === selectedSlideId ? 'rgba(99, 102, 241, 0.05)' : 'transparent'
              }}>
                {slideIndex + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Slide Card Component (used in Grid View)
const SlideCard: React.FC<{
  slide: Slide;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}> = ({ slide, isSelected, onClick, onEdit, onDuplicate, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'white',
        borderRadius: 'var(--radius-lg)',
        border: isSelected ? '2px solid #6366F1' : '1px solid rgba(0, 0, 0, 0.06)',
        boxShadow: slide.isGenerating
          ? 'var(--shadow-brand)'
          : isHovered
            ? 'var(--shadow-md)'
            : 'var(--shadow-sm)',
        transition: 'var(--transition-base)',
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
      }}
    >
      {/* 16:9 Aspect Ratio Container */}
      <div style={{
        position: 'relative',
        paddingBottom: '56.25%',
        background: '#F8F9FA'
      }}>
        {/* Slide Preview Image */}
        {slide.isGenerating ? (
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <SlideGenerationLoader size={32} />
          </div>
        ) : getSlideImage(slide) && (
          <img
            src={getSlideImage(slide)}
            alt={slide.name || `Slide ${slideIndex + 1}`}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        )}

        {/* Hover Actions */}
        {!slide.isGenerating && isHovered && (
          <div style={{
            position: 'absolute',
            top: 'var(--space-2)',
            right: 'var(--space-2)',
            display: 'flex',
            gap: 'var(--space-2)'
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              style={{
                width: '32px',
                height: '32px',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              style={{
                width: '32px',
                height: '32px',
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                transition: 'var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FEE2E2';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {/* Title & Metadata */}
      <div style={{
        padding: 'var(--space-3)',
        borderTop: '1px solid rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-semibold)',
          color: '#111827',
          marginBottom: 'var(--space-1)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {slide.name || `Slide ${slideIndex + 1}`}
        </div>

        <div style={{
          fontSize: 'var(--text-xs)',
          color: '#6B7280'
        }}>
          {slide.isGenerating ? 'Generating...' : 'Updated 2m ago'}
        </div>
      </div>
    </div>
  );
};

export default ArtifactsPanel;
