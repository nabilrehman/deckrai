import React, { useState, useRef, useEffect } from 'react';
import ChatLandingView from './ChatLandingView';
import ArtifactsPanel from './ArtifactsPanel';
import { Slide, StyleLibraryItem } from '../types';

interface ChatWithArtifactsProps {
  user: any; // Firebase user
  onSignOut: () => void;
  styleLibrary?: StyleLibraryItem[];
  onOpenInEditor?: (slides: Slide[]) => void;
}

const ChatWithArtifacts: React.FC<ChatWithArtifactsProps> = ({ user, onSignOut, styleLibrary = [], onOpenInEditor }) => {
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [artifactSlides, setArtifactSlides] = useState<Slide[]>([]);
  const [splitRatio, setSplitRatio] = useState(60); // 60% artifacts, 40% chat
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle slides generated from chat
  const handleSlidesGenerated = (slides: Slide[]) => {
    setArtifactSlides(slides);
    if (!showArtifacts && slides.length > 0) {
      setShowArtifacts(true);
    }
  };

  // Handle slide updates from chat (conversational editing)
  const handleSlideUpdate = (slideId: string, updates: Partial<Slide>) => {
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
  const handleDownloadPDF = () => {
    // TODO: Generate and download PDF
    console.log('Downloading PDF...');
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
          overflow: 'hidden'
        }}
      >
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
