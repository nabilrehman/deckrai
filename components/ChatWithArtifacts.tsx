import React, { useState, useRef, useEffect } from 'react';
import ChatLandingView from './ChatLandingView';
import ArtifactsPanel from './ArtifactsPanel';
import ArtifactsVariationView from './ArtifactsVariationView';
import { Slide, StyleLibraryItem } from '../types';

interface ChatWithArtifactsProps {
  user: any; // Firebase user
  onSignOut: () => void;
  styleLibrary?: StyleLibraryItem[];
  onOpenInEditor?: (slides: Slide[]) => void;
  onOpenDeckLibrary?: () => void;
}

const ChatWithArtifacts: React.FC<ChatWithArtifactsProps> = ({ user, onSignOut, styleLibrary = [], onOpenInEditor, onOpenDeckLibrary }) => {
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [artifactSlides, setArtifactSlides] = useState<Slide[]>([]);
  const [slideHistory, setSlideHistory] = useState<Slide[][]>([]); // For undo functionality
  const [splitRatio, setSplitRatio] = useState(60); // 60% artifacts, 40% chat
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Variation selection mode state
  const [artifactsMode, setArtifactsMode] = useState<'normal' | 'variation-selection'>('normal');
  const [pendingVariations, setPendingVariations] = useState<string[]>([]);
  const [variationTargetSlideId, setVariationTargetSlideId] = useState<string>('');
  const [variationSlideName, setVariationSlideName] = useState<string>('');

  // Save current state to history (for undo)
  const saveToHistory = () => {
    setSlideHistory(prev => [...prev, JSON.parse(JSON.stringify(artifactSlides))]);
  };

  // Undo last change
  const undoLastChange = () => {
    if (slideHistory.length > 0) {
      const previousState = slideHistory[slideHistory.length - 1];
      setArtifactSlides(previousState);
      setSlideHistory(prev => prev.slice(0, -1));
    }
  };

  // Handle slides generated from chat
  const handleSlidesGenerated = (slides: Slide[]) => {
    saveToHistory(); // Save before updating
    setArtifactSlides(slides);
    if (!showArtifacts && slides.length > 0) {
      setShowArtifacts(true);
    }
  };

  // Handle slide updates from chat (conversational editing)
  const handleSlideUpdate = (slideId: string, updates: Partial<Slide>) => {
    saveToHistory(); // Save before updating
    setArtifactSlides(prev =>
      prev.map(slide =>
        slide.id === slideId ? { ...slide, ...updates } : slide
      )
    );
  };

  // Handle adding new slide from chat
  const handleAddSlide = (newSlide: Slide) => {
    setArtifactSlides(prev => [...prev, newSlide]);
  };

  // Handle slide deletion from artifacts panel
  const handleDeleteSlide = (slide: Slide) => {
    setArtifactSlides(prev => prev.filter(s => s.id !== slide.id));
  };

  // Handle opening in classic editor
  const handleOpenInEditor = () => {
    if (onOpenInEditor && artifactSlides.length > 0) {
      onOpenInEditor(artifactSlides);
    } else {
      console.warn('Cannot open in editor: no slides or callback not provided');
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async () => {
    if (artifactSlides.length === 0) {
      alert('No slides to download');
      return;
    }

    console.log('Downloading PDF...');

    try {
      const { jsPDF } = (window as any).jspdf;
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pageAspectRatio = pageWidth / pageHeight;

      for (let i = 0; i < artifactSlides.length; i++) {
        const slide = artifactSlides[i];
        const imgSrc = slide.history && slide.history.length > 0
          ? slide.history[slide.history.length - 1]
          : slide.originalSrc;

        console.log(`[PDF] Processing slide ${i + 1}/${artifactSlides.length}...`);

        // If it's already a data URL, use it directly
        let cleanImgSrc: string;
        if (imgSrc.startsWith('data:image/')) {
          console.log(`[PDF] Slide ${i + 1} is already a data URL, using directly`);
          cleanImgSrc = imgSrc;
        } else {
          // For external URLs, launder through canvas
          console.log(`[PDF] Slide ${i + 1} is external URL, laundering through canvas...`);
          cleanImgSrc = await new Promise<string>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  reject(new Error('Failed to get canvas context'));
                  return;
                }
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                console.log(`[PDF] Slide ${i + 1} successfully laundered`);
                resolve(dataUrl);
              } catch (err: any) {
                console.error(`[PDF] Canvas error for slide ${i + 1}:`, err);
                reject(new Error(`Canvas processing failed: ${err.message}`));
              }
            };
            img.onerror = (err) => {
              console.error(`[PDF] Failed to load image for slide ${i + 1}:`, err);
              reject(new Error(`Failed to load image from URL`));
            };
            img.src = imgSrc;
          });
        }

        // Load the clean image to get dimensions
        const img = new Image();
        img.src = cleanImgSrc;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error(`Failed to load processed image for slide ${i + 1}`));
          setTimeout(() => reject(new Error(`Timeout loading slide ${i + 1}`)), 10000);
        });

        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        const imgAspectRatio = imgWidth / imgHeight;

        let finalImgWidth, finalImgHeight, xOffset, yOffset;

        if (imgAspectRatio > pageAspectRatio) {
          finalImgWidth = pageWidth;
          finalImgHeight = pageWidth / imgAspectRatio;
          xOffset = 0;
          yOffset = (pageHeight - finalImgHeight) / 2;
        } else {
          finalImgHeight = pageHeight;
          finalImgWidth = pageHeight * imgAspectRatio;
          yOffset = 0;
          xOffset = (pageWidth - finalImgWidth) / 2;
        }

        if (i > 0) {
          pdf.addPage();
        }

        pdf.addImage(cleanImgSrc, 'PNG', xOffset, yOffset, finalImgWidth, finalImgHeight);
      }

      pdf.save('deckr-ai-presentation.pdf');
      console.log('[PDF] Download complete!');
    } catch (error: any) {
      console.error("Failed to generate PDF:", error);
      alert(`Sorry, there was an error creating the PDF. ${error.message}`);
    }
  };

  // Handle resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - containerRect.left;
      const newRatio = (offsetX / containerRect.width) * 100;

      // Clamp between 30% and 70%
      const clampedRatio = Math.max(30, Math.min(70, newRatio));
      setSplitRatio(clampedRatio);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        userSelect: isResizing ? 'none' : 'auto'
      }}
    >
      {/* Chat Panel (Left) - Always mounted to maintain conversation */}
      <div
        style={{
          width: showArtifacts ? `${100 - splitRatio}%` : '100%',
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          transition: showArtifacts ? 'none' : 'width 300ms ease'
        }}
      >
        <ChatLandingView
          styleLibrary={styleLibrary}
          user={user}
          onSignOut={onSignOut}
          onSlidesGenerated={handleSlidesGenerated}
          onSlideUpdate={handleSlideUpdate}
          onAddSlide={handleAddSlide}
          artifactSlides={artifactSlides}
          onUndoLastChange={undoLastChange}
          onVariationModeChange={setArtifactsMode}
          onSetPendingVariations={setPendingVariations}
          onSetVariationTargetSlide={(slideId, slideName) => {
            setVariationTargetSlideId(slideId);
            setVariationSlideName(slideName);
          }}
          onOpenDeckLibrary={onOpenDeckLibrary}
        />
      </div>

      {/* Only show resize handle and artifacts panel when artifacts are active */}
      {showArtifacts && (
        <>

      {/* Resize Handle */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: '4px',
          height: '100%',
          cursor: 'col-resize',
          background: 'rgba(0, 0, 0, 0.04)',
          position: 'relative',
          flexShrink: 0,
          transition: isResizing ? 'none' : 'background 150ms ease'
        }}
        onMouseEnter={(e) => {
          if (!isResizing) {
            e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isResizing) {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)';
          }
        }}
      >
        {/* Visual indicator */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '40px',
            background: isResizing ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
            borderRadius: '4px',
            transition: 'background 150ms ease',
            pointerEvents: 'none'
          }}
        />
      </div>

      {/* Artifacts Panel (Right) */}
      <div
        style={{
          width: `${splitRatio}%`,
          height: '100%',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {artifactsMode === 'variation-selection' ? (
          <ArtifactsVariationView
            variations={pendingVariations}
            slideId={variationTargetSlideId}
            slideName={variationSlideName}
            onApply={(slideId, variationIndex) => {
              // Apply the selected variation
              const selectedImage = pendingVariations[variationIndex];
              handleSlideUpdate(slideId, {
                history: [...(artifactSlides.find(s => s.id === slideId)?.history || []), selectedImage]
              });

              // Exit variation mode (zoom out transition)
              setArtifactsMode('normal');
              setPendingVariations([]);
              setVariationTargetSlideId('');
              setVariationSlideName('');
            }}
            onRegenerate={() => {
              // TODO: Trigger regeneration
              console.log('Regenerate variations');
            }}
            onCancel={() => {
              // Exit variation mode without applying
              setArtifactsMode('normal');
              setPendingVariations([]);
              setVariationTargetSlideId('');
              setVariationSlideName('');
            }}
          />
        ) : (
          <ArtifactsPanel
            slides={artifactSlides}
            onSlideClick={(slide) => {
              console.log('Slide clicked:', slide);
            }}
            onSlideEdit={(slide) => {
              // TODO: Implement inline editing or chat-based editing
              console.log('Edit slide:', slide);
            }}
            onSlideDuplicate={(slide) => {
              const newSlide: Slide = {
                ...slide,
                id: `${slide.id}-copy-${Date.now()}`,
                name: `${slide.name} (Copy)`,
                originalSrc: slide.history && slide.history.length > 0
                  ? slide.history[slide.history.length - 1]
                  : slide.originalSrc,
                history: slide.history && slide.history.length > 0
                  ? [slide.history[slide.history.length - 1]]
                  : [slide.originalSrc]
              };
              setArtifactSlides(prev => [...prev, newSlide]);
            }}
            onSlideDelete={handleDeleteSlide}
            onOpenInEditor={handleOpenInEditor}
            onDownloadPDF={handleDownloadPDF}
          />
        )}
      </div>
        </>
      )}

      {/* Toggle Artifacts Button (floating - shown when artifacts hidden) */}
      {!showArtifacts && artifactSlides.length > 0 && (
        <button
          onClick={() => setShowArtifacts(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            padding: '12px 20px',
            background: '#6366F1',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 200ms ease',
            zIndex: 1000
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(99, 102, 241, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" stroke="white" strokeWidth="1.5"/>
            <rect x="9" y="2" width="5" height="5" rx="1" stroke="white" strokeWidth="1.5"/>
            <rect x="2" y="9" width="5" height="5" rx="1" stroke="white" strokeWidth="1.5"/>
            <rect x="9" y="9" width="5" height="5" rx="1" stroke="white" strokeWidth="1.5"/>
          </svg>
          Show Slides ({artifactSlides.length})
        </button>
      )}
    </div>
  );
};

export default ChatWithArtifacts;
