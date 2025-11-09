

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Slide, StyleLibraryItem, DebugSession, Template } from './types';
import Header from './components/Header';
import Editor from './components/Editor';
import GenerationModeSelector from './components/GenerationModeSelector';
import PresentationView from './components/PresentationView';
import SessionInspectorPanel from './components/SessionInspectorPanel';
import StyleLibraryPanel from './components/StyleLibraryPanel';
import DeckLibrary from './components/DeckLibrary';
import SaveDeckModal from './components/SaveDeckModal';
import { TEMPLATES } from './data/templates';
import { useAuth } from './contexts/AuthContext';
import {
    saveDeck,
    getUserStyleLibrary,
    addToStyleLibrary,
    removeFromStyleLibrary,
    batchAddToStyleLibrary
} from './services/firestoreService';


declare const jspdf: any;

const App: React.FC = () => {
  const { user } = useAuth();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [styleLibrary, setStyleLibrary] = useState<StyleLibraryItem[]>([]);
  const [sessionHistory, setSessionHistory] = useState<DebugSession[]>([]);
  const [inspectingSession, setInspectingSession] = useState<DebugSession | null>(null);
  const [isStylePanelVisible, setIsStylePanelVisible] = useState(false); // Hidden by default - not main functionality
  const [isTestMode, setIsTestMode] = useState(true);
  const [isDeckLibraryOpen, setIsDeckLibraryOpen] = useState(false);
  const [currentDeckName, setCurrentDeckName] = useState('Untitled Deck');
  const [isSaveDeckModalOpen, setIsSaveDeckModalOpen] = useState(false);
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Load session history from localStorage on initial render
  useEffect(() => {
    try {
        const savedHistory = localStorage.getItem('aiDeckEditorSessionHistory');
        if (savedHistory) {
            const parsedHistory = JSON.parse(savedHistory);
            if (Array.isArray(parsedHistory)) {
                setSessionHistory(parsedHistory);
            } else {
                console.warn("Corrupted session history found in localStorage. Clearing it.");
                localStorage.removeItem('aiDeckEditorSessionHistory');
            }
        }
    } catch (e) {
        console.error("Failed to load session history from localStorage", e);
        localStorage.removeItem('aiDeckEditorSessionHistory');
    }
  }, []);

  // Load user's style library from Firestore when they sign in
  useEffect(() => {
    const loadStyleLibrary = async () => {
      if (user) {
        try {
          const library = await getUserStyleLibrary(user.uid);
          setStyleLibrary(library);
        } catch (error) {
          console.error('Error loading style library:', error);
        }
      } else {
        // Clear style library when user signs out
        setStyleLibrary([]);
      }
    };

    loadStyleLibrary();
  }, [user?.uid]);

  const handleAddSessionToHistory = useCallback((session: DebugSession) => {
    setSessionHistory(prevHistory => {
        // Retrieve full history from state, not potentially stale storage
        const fullHistory = [session, ...prevHistory];

        // Create a lightweight version for storage, excluding large image data
        const MAX_HISTORY_ENTRIES = 50; // Increased limit
        const historyForStorage = fullHistory.slice(0, MAX_HISTORY_ENTRIES).map(s => {
            const { initialImage, finalImages, styleReferenceImage, ...lightweightSession } = s;
            return lightweightSession;
        });

        try {
            localStorage.setItem('aiDeckEditorSessionHistory', JSON.stringify(historyForStorage));
        } catch(e: any) {
            console.error("Failed to save session history to localStorage", e);
            if (e.name === 'QuotaExceededError') {
                alert("Could not save the full debug session as browser storage is full. The oldest sessions will be removed on next reload.");
            }
        }
        return fullHistory; // Return the full history for the app state
    });
  }, []);


  const handleClearSessionHistory = useCallback(() => {
    if (window.confirm("Are you sure you want to clear the entire debug session history? This cannot be undone.")) {
        setSessionHistory([]);
        try {
            localStorage.removeItem('aiDeckEditorSessionHistory');
        } catch(e) {
            console.error("Failed to clear session history from localStorage", e);
        }
    }
  }, []);


  const handleDeckUpload = useCallback((newSlides: Slide[]) => {
    setSlides(newSlides);
    setActiveSlideId(newSlides[0]?.id || null);
    setStyleLibrary([]); // Reset library on new deck
  }, []);

  const handleToggleTestMode = useCallback(() => {
    setIsTestMode(prev => !prev);
  }, []);

  const handleToggleStyleLibrary = useCallback(async (slide: Slide) => {
    setSlides(prevSlides =>
        prevSlides.map(s => s.id === slide.id ? { ...s, isInStyleLibrary: !s.isInStyleLibrary } : s)
    );

    const isInLibrary = styleLibrary.some(item => item.id === slide.id);

    if (isInLibrary) {
      // Remove from library
      setStyleLibrary(prevLibrary => prevLibrary.filter(item => item.id !== slide.id));

      // Save to Firestore if user is signed in
      if (user) {
        try {
          await removeFromStyleLibrary(user.uid, slide.id);
        } catch (error) {
          console.error('Error removing from style library:', error);
        }
      }
    } else {
      // Add to library
      const currentSrc = slide.history[slide.history.length - 1];
      const newItem = { id: slide.id, src: currentSrc, name: slide.name };
      setStyleLibrary(prevLibrary => [...prevLibrary, newItem]);

      // Save to Firestore if user is signed in
      if (user) {
        try {
          await addToStyleLibrary(user.uid, newItem);
        } catch (error) {
          console.error('Error adding to style library:', error);
        }
      }
    }
  }, [user, styleLibrary]);

  const handleLibraryUpload = useCallback(async (newItems: StyleLibraryItem[]) => {
    const existingSrcs = new Set(styleLibrary.map(item => item.src));
    const trulyNewItems = newItems.filter(item => !existingSrcs.has(item.src));

    if (trulyNewItems.length > 0) {
      setStyleLibrary(prevLibrary => [...prevLibrary, ...trulyNewItems]);

      // Save to Firestore if user is signed in
      if (user) {
        try {
          await batchAddToStyleLibrary(user.uid, trulyNewItems);
        } catch (error) {
          console.error('Error batch uploading to style library:', error);
        }
      }
    }
  }, [user, styleLibrary]);


  const handleNewSlideVersion = useCallback((slideId: string, newSrc: string) => {
    setSlides(prevSlides =>
      prevSlides.map(slide =>
        slide.id === slideId ? { ...slide, history: [...slide.history, newSrc] } : slide
      )
    );
  }, []);
  
  const handleSetPendingPersonalization = useCallback((slideId: string, pendingData: Slide['pendingPersonalization']) => {
    setSlides(prevSlides =>
        prevSlides.map(slide =>
            slide.id === slideId ? { ...slide, pendingPersonalization: pendingData } : slide
        )
    );
  }, []);

  const handleConfirmPersonalization = useCallback((slideId: string, newSrc: string) => {
    setSlides(prevSlides =>
        prevSlides.map(slide => {
            if (slide.id === slideId) {
                return { ...slide, history: [...slide.history, newSrc], pendingPersonalization: undefined };
            }
            return slide;
        })
    );
  }, []);

  const handleDiscardPendingPersonalization = useCallback((slideId: string) => {
    setSlides(prevSlides =>
        prevSlides.map(slide =>
            slide.id === slideId ? { ...slide, pendingPersonalization: undefined } : slide
        )
    );
  }, []);

  const handleAddNewSlide = useCallback(({ newSlide, insertAfterSlideId }: { newSlide: Slide, insertAfterSlideId: string }) => {
    setSlides(prevSlides => {
        const newSlidesArray = [...prevSlides];
        if (insertAfterSlideId === 'START') {
            newSlidesArray.unshift(newSlide);
        } else {
            const insertAtIndex = prevSlides.findIndex(s => s.id === insertAfterSlideId);
            if (insertAtIndex !== -1) {
                newSlidesArray.splice(insertAtIndex + 1, 0, newSlide);
            } else {
                newSlidesArray.push(newSlide);
            }
        }
        return newSlidesArray;
    });
    setActiveSlideId(newSlide.id);
  }, []);

  const handleDeleteSlide = useCallback((slideId: string) => {
    setSlides(prevSlides => {
      const slideIndex = prevSlides.findIndex(s => s.id === slideId);
      if (slideIndex === -1) return prevSlides;

      const newSlides = prevSlides.filter(s => s.id !== slideId);
      
      if (activeSlideId === slideId) {
        if (newSlides.length === 0) {
          setActiveSlideId(null);
        } else {
          // Select the previous slide, or the first slide if the deleted one was the first
          const newActiveIndex = Math.max(0, slideIndex - 1);
          setActiveSlideId(newSlides[newActiveIndex].id);
        }
      }
      return newSlides;
    });
  }, [activeSlideId]);


  const handleUndo = useCallback((slideId: string) => {
    setSlides(prevSlides =>
      prevSlides.map(slide => {
        if (slide.id === slideId && slide.history.length > 1) {
          const newHistory = [...slide.history];
          newHistory.pop();
          return { ...slide, history: newHistory };
        }
        return slide;
      })
    );
  }, []);

  const handleResetSlide = useCallback((slideId: string) => {
    setSlides(prevSlides =>
        prevSlides.map(slide =>
            slide.id === slideId ? { ...slide, history: [slide.originalSrc] } : slide
        )
    );
  }, []);


  const handleResetProject = useCallback(() => {
     if (window.confirm("Are you sure you want to start a new deck? All your changes will be lost.")) {
      setSlides([]);
      setActiveSlideId(null);
    }
  }, []);
  
  const handleDownloadPdf = useCallback(async () => {
    if (slides.length === 0) return;
    setIsDownloadingPdf(true);

    try {
        const { jsPDF } = jspdf;
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageAspectRatio = pageWidth / pageHeight;

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            const imgSrc = slide.history[slide.history.length - 1];

            const img = new Image();
            img.src = imgSrc;
            await new Promise(resolve => { img.onload = resolve; });

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
            
            pdf.addImage(imgSrc, 'PNG', xOffset, yOffset, finalImgWidth, finalImgHeight);
        }
        
        pdf.save('deckr-ai-presentation.pdf');

    } catch (error: any) {
        console.error("Failed to generate PDF:", error);
        alert(`Sorry, there was an error creating the PDF. ${error.message}`);
    } finally {
        setIsDownloadingPdf(false);
    }
}, [slides]);


  const handlePresent = useCallback(() => {
    if (slides.length > 0 && activeSlideId) {
      setIsPresenting(true);
    }
  }, [slides, activeSlideId]);

  const handleExitPresentation = useCallback(() => {
    setIsPresenting(false);
  }, []);

  // Save current deck to Firestore
  const handleSaveDeck = useCallback(() => {
    if (!user) {
      alert('Please sign in to save your deck');
      return;
    }

    if (slides.length === 0) {
      alert('No slides to save');
      return;
    }

    // Open the save deck modal
    setIsSaveDeckModalOpen(true);
    setShowSaveSuccess(false);
  }, [user, slides]);

  // Handle the actual save operation from the modal
  const handleSaveDeckConfirm = useCallback(async (deckName: string) => {
    setIsSavingDeck(true);
    try {
      setCurrentDeckName(deckName);
      await saveDeck(user!.uid, deckName, slides);

      // Show success state
      setIsSavingDeck(false);
      setShowSaveSuccess(true);

      // Auto-close after 2 seconds
      setTimeout(() => {
        setIsSaveDeckModalOpen(false);
        setShowSaveSuccess(false);
      }, 2000);
    } catch (error: any) {
      console.error('Error saving deck:', error);
      setIsSavingDeck(false);
      alert('Failed to save deck: ' + error.message);
    }
  }, [user, slides]);

  // Load deck from library
  const handleLoadDeck = useCallback((loadedSlides: Slide[]) => {
    setSlides(loadedSlides);
    setActiveSlideId(loadedSlides[0]?.id || null);
  }, []);

  // Open deck library
  const handleOpenDeckLibrary = useCallback(() => {
    setIsDeckLibraryOpen(true);
  }, []);

  const activeSlide = useMemo(() => {
    return slides.find(s => s.id === activeSlideId);
  }, [slides, activeSlideId]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-brand-text-primary font-sans overflow-hidden relative">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 left-1/4 w-[600px] h-[600px] bg-brand-primary-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-float"></div>
        <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-indigo-200/40 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-40 left-1/2 w-[400px] h-[400px] bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-float" style={{animationDelay: '4s'}}></div>
      </div>
      <Header
        onReset={handleResetProject}
        hasActiveProject={slides.length > 0}
        onDownloadPdf={handleDownloadPdf}
        isDownloading={isDownloadingPdf}
        onPresent={handlePresent}
        isTestMode={isTestMode}
        onToggleTestMode={handleToggleTestMode}
        onSaveDeck={handleSaveDeck}
        onOpenDeckLibrary={handleOpenDeckLibrary}
      />
      <main className="flex-grow flex flex-row overflow-hidden">
        {slides.length > 0 && activeSlide ? (
          <>
            <Editor
                slides={slides}
                activeSlide={activeSlide}
                onSlideSelect={setActiveSlideId}
                onNewSlideVersion={handleNewSlideVersion}
                // FIX: Pass `handleUndo` to the `onUndo` prop.
                onUndo={handleUndo}
                onResetSlide={handleResetSlide}
                onSetPendingPersonalization={handleSetPendingPersonalization}
                onConfirmPersonalization={handleConfirmPersonalization}
                onDiscardPendingPersonalization={handleDiscardPendingPersonalization}
                onAddNewSlide={handleAddNewSlide}
                onDeleteSlide={handleDeleteSlide}
                styleLibrary={styleLibrary}
                onToggleStyleLibrary={handleToggleStyleLibrary}
                onAddSessionToHistory={handleAddSessionToHistory}
            />
            <StyleLibraryPanel 
                isVisible={isStylePanelVisible}
                library={styleLibrary}
                onRemove={id => handleToggleStyleLibrary(slides.find(s => s.id === id)!)}
                onToggleVisibility={() => setIsStylePanelVisible(!isStylePanelVisible)}
                onLibraryUpload={handleLibraryUpload}
                sessionHistory={sessionHistory}
                onClearSessionHistory={handleClearSessionHistory}
                onSelectSession={setInspectingSession}
            />
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center p-4">
            <GenerationModeSelector
                onDeckUpload={handleDeckUpload}
                styleLibrary={styleLibrary}
                isTestMode={isTestMode}
            />
          </div>
        )}
      </main>

      {isPresenting && activeSlideId && (
        <PresentationView
          slides={slides}
          activeSlideId={activeSlideId}
          onExit={handleExitPresentation}
        />
      )}

      <SessionInspectorPanel
        session={inspectingSession}
        onClose={() => setInspectingSession(null)}
      />

      {isDeckLibraryOpen && (
        <DeckLibrary
          onLoadDeck={handleLoadDeck}
          onClose={() => setIsDeckLibraryOpen(false)}
        />
      )}

      <SaveDeckModal
        isOpen={isSaveDeckModalOpen}
        onClose={() => setIsSaveDeckModalOpen(false)}
        onSave={handleSaveDeckConfirm}
        defaultName={currentDeckName}
        isSaving={isSavingDeck}
        showSuccess={showSaveSuccess}
      />
    </div>
  );
};

export default App;
