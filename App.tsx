

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Slide, StyleLibraryItem, DebugSession, Template, DeckAiExecutionPlan } from './types';
import Header from './components/Header';
import Editor from './components/Editor';
import ChatLandingView from './components/ChatLandingView';
import ChatWithArtifacts from './components/ChatWithArtifacts';
import ChatController from './components/ChatController';
import GenerationModeSelector from './components/GenerationModeSelector';
import PresentationView from './components/PresentationView';
import SessionInspectorPanel from './components/SessionInspectorPanel';
import StyleLibraryPanel from './components/StyleLibraryPanel';
import DeckLibrary from './components/DeckLibrary';
import SaveDeckModal from './components/SaveDeckModal';
import ExportSuccessModal from './components/ExportSuccessModal';
import { TEMPLATES } from './data/templates';
import { useAuth } from './contexts/AuthContext';
import {
    saveDeck,
    getUserStyleLibrary,
    addToStyleLibrary,
    removeFromStyleLibrary,
    batchAddToStyleLibrary,
    deleteAllStyleLibraryItems
} from './services/firestoreService';
import { exportToGoogleSlides, handleOAuthCallback } from './services/googleSlidesService';


declare const jspdf: any;

const App: React.FC = () => {
  const { user } = useAuth();
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isExportingToSlides, setIsExportingToSlides] = useState(false);
  const [showExportSuccessModal, setShowExportSuccessModal] = useState(false);
  const [exportedPresentationUrl, setExportedPresentationUrl] = useState('');
  const [isPresenting, setIsPresenting] = useState(false);
  const [styleLibrary, setStyleLibrary] = useState<StyleLibraryItem[]>([]);
  const [sessionHistory, setSessionHistory] = useState<DebugSession[]>([]);
  const [inspectingSession, setInspectingSession] = useState<DebugSession | null>(null);
  const [isStylePanelVisible, setIsStylePanelVisible] = useState(false); // Hidden by default - not main functionality
  const [isTestMode, setIsTestMode] = useState(false); // Production mode: no 5-slide limit
  const [isDeckLibraryOpen, setIsDeckLibraryOpen] = useState(false);
  const [currentDeckName, setCurrentDeckName] = useState('Untitled Deck');
  const [isSaveDeckModalOpen, setIsSaveDeckModalOpen] = useState(false);
  const [isSavingDeck, setIsSavingDeck] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [pendingExecutionPlan, setPendingExecutionPlan] = useState<DeckAiExecutionPlan | null>(null);
  const [chatState, setChatState] = useState<{ active: boolean; initialPrompt?: string; initialFiles?: File[] }>({ active: false });

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

  // Handle Google OAuth callback (for Google Slides export)
  useEffect(() => {
    handleOAuthCallback();
  }, []);

  // Load user's style library from Firestore when they sign in
  useEffect(() => {
    const loadStyleLibrary = async () => {
      if (user) {
        try {
          console.log(`🔍 DEBUG: Loading style library for user ${user.uid}`);
          const library = await getUserStyleLibrary(user.uid);
          console.log(`🔍 DEBUG: Loaded ${library.length} items from Firestore`);
          if (library.length > 0) {
            console.log('🔍 DEBUG: First 3 items:', library.slice(0, 3).map(item => ({ id: item.id, name: item.name })));
          }
          setStyleLibrary(library);
        } catch (error) {
          console.error('❌ Error loading style library:', error);
        }
      } else {
        console.log('🔍 DEBUG: User signed out, clearing style library');
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


  const handleDeckUpload = useCallback((newSlides: Slide[], executionPlan?: DeckAiExecutionPlan | null) => {
    setSlides(newSlides);
    setActiveSlideId(newSlides[0]?.id || null);
    setStyleLibrary([]); // Reset library on new deck

    // If an execution plan was passed, store it for the Editor to execute
    if (executionPlan) {
      setPendingExecutionPlan(executionPlan);
    }
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
    console.log(`🔍 DEBUG: handleLibraryUpload called with ${newItems.length} items`);
    const existingSrcs = new Set(styleLibrary.map(item => item.src));
    const trulyNewItems = newItems.filter(item => !existingSrcs.has(item.src));
    console.log(`🔍 DEBUG: ${trulyNewItems.length} new items after deduplication (existing: ${styleLibrary.length})`);

    if (trulyNewItems.length > 0) {
      setStyleLibrary(prevLibrary => {
        const newLibrary = [...prevLibrary, ...trulyNewItems];
        console.log(`🔍 DEBUG: Updated styleLibrary state - now has ${newLibrary.length} items`);
        return newLibrary;
      });

      // Save to Firestore if user is signed in
      if (user) {
        try {
          console.log(`📤 Uploading ${trulyNewItems.length} reference slides to Firebase Storage...`);
          await batchAddToStyleLibrary(user.uid, trulyNewItems);
          console.log(`✅ Successfully uploaded ${trulyNewItems.length} reference slides to Storage + Firestore`);
        } catch (error) {
          console.error('❌ Error batch uploading to style library:', error);
          alert(`Failed to upload reference slides: ${error instanceof Error ? error.message : 'Unknown error'}. Please try uploading fewer slides at once.`);
        }
      } else {
        console.log('⚠️ WARNING: User not signed in, slides only stored in local state');
      }
    } else {
      console.log('ℹ️ No new items to upload (all duplicates)');
    }
  }, [user, styleLibrary]);

  const handleDeleteAllStyleLibrary = useCallback(async () => {
    if (!user) {
      alert('You must be signed in to delete from Firestore');
      return;
    }

    const confirmDelete = window.confirm(
      `⚠️ WARNING: This will permanently delete ALL ${styleLibrary.length} reference slides from Firebase Storage and Firestore.\n\nThis action CANNOT be undone.\n\nAre you sure you want to continue?`
    );

    if (!confirmDelete) return;

    try {
      console.log('🗑️ Deleting all style library items...');
      await deleteAllStyleLibraryItems(user.uid);
      setStyleLibrary([]);
      console.log('✅ All style library items deleted successfully');
      alert('✅ Successfully deleted all reference slides from Firestore and Storage!');
    } catch (error) {
      console.error('❌ Error deleting style library:', error);
      alert(`Failed to delete style library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [user, styleLibrary.length]);

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

            console.log(`[PDF] Processing slide ${i + 1}/${slides.length}...`);

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
                    img.crossOrigin = 'anonymous'; // Handle CORS for external URLs
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
                        reject(new Error(`Failed to load image from URL. Check console for details.`));
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
                // Timeout after 10 seconds
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

    } catch (error: any) {
        console.error("Failed to generate PDF:", error);
        alert(`Sorry, there was an error creating the PDF. ${error.message}`);
    } finally {
        setIsDownloadingPdf(false);
    }
}, [slides]);

  const handleExportToGoogleSlides = useCallback(async () => {
    if (slides.length === 0) {
      alert('No slides to export');
      return;
    }

    if (!user) {
      alert('Please sign in to export to Google Slides');
      return;
    }

    setIsExportingToSlides(true);

    try {
      const slideImages = slides.map(slide => ({
        src: slide.history[slide.history.length - 1],
        name: slide.name
      }));

      const presentationUrl = await exportToGoogleSlides(
        slideImages,
        currentDeckName,
        (message) => {
          console.log('[Google Slides Export]', message);
        }
      );

      // Copy URL to clipboard
      navigator.clipboard.writeText(presentationUrl);

      // Show success modal with confetti celebration!
      setExportedPresentationUrl(presentationUrl);
      setShowExportSuccessModal(true);

    } catch (error: any) {
      console.error('Export to Google Slides failed:', error);
      alert(`Failed to export to Google Slides: ${error.message}`);
    } finally {
      setIsExportingToSlides(false);
    }
  }, [slides, currentDeckName, user]);


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
      {/* Only show Header when we have slides */}
      {slides.length > 0 && (
        <Header
          onReset={handleResetProject}
          hasActiveProject={slides.length > 0}
          onDownloadPdf={handleDownloadPdf}
          isDownloading={isDownloadingPdf}
          onExportToGoogleSlides={handleExportToGoogleSlides}
          isExportingToSlides={isExportingToSlides}
          onPresent={handlePresent}
          isTestMode={isTestMode}
          onToggleTestMode={handleToggleTestMode}
          onSaveDeck={handleSaveDeck}
          onOpenDeckLibrary={handleOpenDeckLibrary}
          onDeleteAllStyleLibrary={handleDeleteAllStyleLibrary}
        />
      )}
      <main className="flex-grow flex flex-row overflow-hidden w-full">
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
                pendingExecutionPlan={pendingExecutionPlan}
                onClearPendingPlan={() => setPendingExecutionPlan(null)}
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
          <ChatWithArtifacts
            user={user}
            styleLibrary={styleLibrary}
            onSignOut={() => {
              // Sign out is handled in Header component
              console.log('Sign out requested from artifacts panel');
            }}
            onOpenInEditor={(artifactSlides) => {
              // Transition to classic editor with slides from artifacts
              console.log('Opening in classic editor with', artifactSlides.length, 'slides');
              setSlides(artifactSlides);
              if (artifactSlides.length > 0) {
                setActiveSlideId(artifactSlides[0].id);
              }
            }}
          />
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

      <ExportSuccessModal
        isOpen={showExportSuccessModal}
        onClose={() => setShowExportSuccessModal(false)}
        presentationUrl={exportedPresentationUrl}
      />
    </div>
  );
};

export default App;
