/**
 * SharedDeckView - Public viewing page for shared decks
 *
 * This is the "Digital Sales Room" view that anyone with a magic link can access.
 * Features:
 * - Public access (no authentication required)
 * - Optional email capture before viewing
 * - Slide navigation
 * - View tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSharedDeckWithSlides, recordView, SharedDeck, SharedSlide } from '../services/magicLinkService';
import EmailCaptureModal from '../components/EmailCaptureModal';

const SharedDeckView: React.FC = () => {
    const { magicLinkId } = useParams<{ magicLinkId: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sharedDeck, setSharedDeck] = useState<SharedDeck | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [showEmailCapture, setShowEmailCapture] = useState(true);
    const [viewRecorded, setViewRecorded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Load shared deck data
    useEffect(() => {
        const loadDeck = async () => {
            if (!magicLinkId) {
                setError('Invalid link');
                setLoading(false);
                return;
            }

            try {
                const result = await getSharedDeckWithSlides(magicLinkId);

                if (!result) {
                    setError('This deck is no longer available');
                    setLoading(false);
                    return;
                }

                setSharedDeck(result);
                setLoading(false);
            } catch (err) {
                console.error('Error loading shared deck:', err);
                setError('Failed to load deck');
                setLoading(false);
            }
        };

        loadDeck();
    }, [magicLinkId]);

    // Record view after email capture (or skip)
    const handleStartViewing = useCallback(async (email?: string, name?: string) => {
        console.log('[SharedDeckView] handleStartViewing called', { email, name, viewRecorded, magicLinkId });
        setShowEmailCapture(false);

        if (!viewRecorded && magicLinkId) {
            try {
                console.log('[SharedDeckView] Calling recordView...');
                await recordView(magicLinkId, email, name);
                setViewRecorded(true);
                console.log('[SharedDeckView] recordView completed successfully');
            } catch (err) {
                console.error('[SharedDeckView] Error recording view:', err);
                // Don't block viewing if tracking fails
            }
        } else {
            console.log('[SharedDeckView] Skipping recordView - viewRecorded:', viewRecorded, 'magicLinkId:', magicLinkId);
        }
    }, [magicLinkId, viewRecorded]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showEmailCapture) return;

            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            } else if (e.key === 'Escape') {
                setIsFullscreen(false);
            } else if (e.key === 'f') {
                setIsFullscreen(!isFullscreen);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showEmailCapture, isFullscreen, currentSlideIndex, sharedDeck]);

    const nextSlide = () => {
        if (sharedDeck && currentSlideIndex < sharedDeck.slides.length - 1) {
            setCurrentSlideIndex(currentSlideIndex + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlideIndex > 0) {
            setCurrentSlideIndex(currentSlideIndex - 1);
        }
    };

    // Helper to get slide image from SharedSlide
    const getCurrentSlideImage = (slide: SharedSlide): string => {
        return slide.imageUrl;
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/70">Loading presentation...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !sharedDeck) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto px-6">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Deck Not Found</h1>
                    <p className="text-white/60 mb-8">{error || 'This link may have expired or been removed.'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-white/90 transition-colors"
                    >
                        Go to Homepage
                    </button>
                </div>
            </div>
        );
    }

    const currentSlide = sharedDeck.slides[currentSlideIndex];
    const totalSlides = sharedDeck.slides.length;

    return (
        <div className={`min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
            {/* Email Capture Modal */}
            {showEmailCapture && (
                <EmailCaptureModal
                    deckName={sharedDeck.deckName}
                    onSubmit={handleStartViewing}
                    onSkip={() => handleStartViewing()}
                />
            )}

            {/* Header */}
            {!isFullscreen && (
                <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                                    </svg>
                                </div>
                                <span className="text-white/50 text-sm">deckr.ai</span>
                            </div>
                            <div className="h-6 w-px bg-white/20"></div>
                            <h1 className="text-white font-semibold truncate max-w-[300px]">{sharedDeck.deckName}</h1>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-white/50 text-sm">
                                {currentSlideIndex + 1} / {totalSlides}
                            </span>
                            <button
                                onClick={() => setIsFullscreen(true)}
                                className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                                title="Fullscreen (F)"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>
            )}

            {/* Main Slide Viewer */}
            <main className={`flex items-center justify-center ${isFullscreen ? 'h-screen' : 'min-h-screen pt-20 pb-24'}`}>
                <div className="relative w-full max-w-5xl mx-auto px-6">
                    {/* Slide Container */}
                    <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden aspect-[16/9]">
                        <img
                            src={getCurrentSlideImage(currentSlide)}
                            alt={`Slide ${currentSlideIndex + 1}`}
                            className="w-full h-full object-contain"
                        />

                        {/* Navigation Arrows */}
                        <button
                            onClick={prevSlide}
                            disabled={currentSlideIndex === 0}
                            className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white transition-all ${currentSlideIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/70'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button
                            onClick={nextSlide}
                            disabled={currentSlideIndex === totalSlides - 1}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white transition-all ${currentSlideIndex === totalSlides - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/70'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {/* Fullscreen Exit Button */}
                        {isFullscreen && (
                            <button
                                onClick={() => setIsFullscreen(false)}
                                className="absolute top-4 right-4 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}

                        {/* Slide Counter (Fullscreen) */}
                        {isFullscreen && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm">
                                {currentSlideIndex + 1} / {totalSlides}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Thumbnail Strip */}
            {!isFullscreen && (
                <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-xl border-t border-white/10">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {sharedDeck.slides.map((slide, index) => (
                                <button
                                    key={slide.id}
                                    onClick={() => setCurrentSlideIndex(index)}
                                    className={`flex-shrink-0 w-20 h-12 rounded-lg overflow-hidden border-2 transition-all ${index === currentSlideIndex
                                            ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                                            : 'border-white/20 hover:border-white/40'
                                        }`}
                                >
                                    <img
                                        src={getCurrentSlideImage(slide)}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </footer>
            )}

            {/* Keyboard Shortcuts Hint */}
            {!isFullscreen && !showEmailCapture && (
                <div className="fixed bottom-24 right-6 text-white/30 text-xs">
                    <span className="px-2 py-1 rounded bg-white/10 mr-2">Arrow keys</span> to navigate
                    <span className="px-2 py-1 rounded bg-white/10 ml-3 mr-2">F</span> fullscreen
                </div>
            )}
        </div>
    );
};

export default SharedDeckView;
