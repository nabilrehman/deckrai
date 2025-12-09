/**
 * DeckWidget - Deck carousel widget for Digital Sales Rooms
 *
 * Features:
 * - Browse and select from user's saved decks
 * - Slide carousel with thumbnails
 * - Keyboard navigation
 * - Fullscreen mode
 * - Integrated slide analytics tracking
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DeckBlock, SavedDeck, Slide } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDecks, getDeck } from '../../services/firestoreService';
import {
    recordSlideView,
    generateSessionId,
    detectDeviceType
} from '../../services/slideAnalyticsService';

interface DeckWidgetProps {
    block: DeckBlock;
    isEditing: boolean;
    updateBlock: (updates: Partial<DeckBlock>) => void;
    workspaceId?: string; // For analytics tracking
    viewerInfo?: {
        id?: string;
        email?: string;
        name?: string;
        company?: string;
    };
    onSlideView?: (slideIndex: number) => void; // Analytics callback
}

const DeckWidget: React.FC<DeckWidgetProps> = ({
    block,
    isEditing,
    updateBlock,
    workspaceId,
    viewerInfo,
    onSlideView
}) => {
    const { user } = useAuth();
    const [showLibrary, setShowLibrary] = useState(false);
    const [decks, setDecks] = useState<SavedDeck[]>([]);
    const [loadingDecks, setLoadingDecks] = useState(false);
    const [selectedDeck, setSelectedDeck] = useState<SavedDeck | null>(null);
    const [loadingDeck, setLoadingDeck] = useState(false);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(block.startSlide || 0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Analytics tracking
    const sessionIdRef = useRef<string>(generateSessionId());
    const slideStartTimeRef = useRef<number>(Date.now());
    const enableAnalytics = !isEditing && workspaceId && block.deckId;

    // Track slide view when navigating away from a slide
    const trackSlideView = useCallback(async (slideIndex: number, durationMs: number) => {
        if (!enableAnalytics || durationMs < 500) return;

        try {
            await recordSlideView(
                workspaceId!,
                block.id,
                slideIndex,
                sessionIdRef.current,
                durationMs,
                viewerInfo,
                isFullscreen
            );
        } catch (error) {
            console.error('Error tracking slide view:', error);
        }
    }, [enableAnalytics, workspaceId, block.id, viewerInfo, isFullscreen]);

    // Reset timer when slide changes
    useEffect(() => {
        slideStartTimeRef.current = Date.now();
    }, [currentSlideIndex]);

    // Track final slide on unmount
    useEffect(() => {
        return () => {
            if (enableAnalytics) {
                const duration = Date.now() - slideStartTimeRef.current;
                if (duration > 500) {
                    recordSlideView(
                        workspaceId!,
                        block.id,
                        currentSlideIndex,
                        sessionIdRef.current,
                        duration,
                        viewerInfo,
                        isFullscreen
                    ).catch(() => {});
                }
            }
        };
    }, []);

    // Load user's decks when library opens
    useEffect(() => {
        if (showLibrary && user) {
            loadDecks();
        }
    }, [showLibrary, user]);

    // Load the selected deck when deckId changes
    useEffect(() => {
        if (block.deckId && !selectedDeck) {
            loadDeckById(block.deckId);
        }
    }, [block.deckId]);

    const loadDecks = async () => {
        if (!user) return;
        setLoadingDecks(true);
        try {
            const userDecks = await getUserDecks(user.uid);
            setDecks(userDecks);
        } catch (err) {
            console.error('Error loading decks:', err);
        } finally {
            setLoadingDecks(false);
        }
    };

    const loadDeckById = async (deckId: string) => {
        setLoadingDeck(true);
        try {
            const deck = await getDeck(deckId);
            if (deck) {
                setSelectedDeck(deck);
            }
        } catch (err) {
            console.error('Error loading deck:', err);
        } finally {
            setLoadingDeck(false);
        }
    };

    const handleSelectDeck = (deck: SavedDeck) => {
        setSelectedDeck(deck);
        updateBlock({ deckId: deck.id });
        setShowLibrary(false);
        setCurrentSlideIndex(0);
    };

    // Get current slide image
    const getCurrentSlideImage = (slide: Slide): string => {
        if (slide.history && slide.history.length > 0) {
            return slide.history[slide.history.length - 1];
        }
        return slide.originalSrc;
    };

    // Navigation with analytics tracking
    const nextSlide = useCallback(() => {
        if (selectedDeck && currentSlideIndex < selectedDeck.slides.length - 1) {
            // Track time on current slide before moving
            const duration = Date.now() - slideStartTimeRef.current;
            trackSlideView(currentSlideIndex, duration);

            const newIndex = currentSlideIndex + 1;
            setCurrentSlideIndex(newIndex);
            onSlideView?.(newIndex);
        }
    }, [selectedDeck, currentSlideIndex, onSlideView, trackSlideView]);

    const prevSlide = useCallback(() => {
        if (currentSlideIndex > 0) {
            // Track time on current slide before moving
            const duration = Date.now() - slideStartTimeRef.current;
            trackSlideView(currentSlideIndex, duration);

            const newIndex = currentSlideIndex - 1;
            setCurrentSlideIndex(newIndex);
            onSlideView?.(newIndex);
        }
    }, [currentSlideIndex, onSlideView, trackSlideView]);

    const goToSlide = useCallback((index: number) => {
        if (index !== currentSlideIndex) {
            // Track time on current slide before moving
            const duration = Date.now() - slideStartTimeRef.current;
            trackSlideView(currentSlideIndex, duration);
        }
        setCurrentSlideIndex(index);
        onSlideView?.(index);
    }, [currentSlideIndex, onSlideView, trackSlideView]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedDeck || showLibrary) return;

            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            } else if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false);
            } else if (e.key === 'f' && !isEditing) {
                setIsFullscreen(!isFullscreen);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedDeck, showLibrary, isFullscreen, nextSlide, prevSlide, isEditing]);

    // Empty state - show Browse Library button
    if (isEditing && !block.deckId) {
        return (
            <>
                <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                        📊
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-gray-800">Add Presentation</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Select a deck from your library
                        </p>
                    </div>
                    <button
                        onClick={() => setShowLibrary(true)}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                        Browse Library
                    </button>
                </div>

                {/* Deck Library Modal */}
                {showLibrary && (
                    <DeckLibraryModal
                        decks={decks}
                        loading={loadingDecks}
                        onSelect={handleSelectDeck}
                        onClose={() => setShowLibrary(false)}
                    />
                )}
            </>
        );
    }

    // Loading state
    if (loadingDeck || (!selectedDeck && block.deckId)) {
        return (
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-white/70 text-sm">Loading presentation...</p>
                </div>
            </div>
        );
    }

    // No deck selected
    if (!selectedDeck) {
        return (
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
                <p className="text-white/50">No deck selected</p>
            </div>
        );
    }

    const currentSlide = selectedDeck.slides[currentSlideIndex];
    const totalSlides = selectedDeck.slides.length;

    // Fullscreen view
    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col">
                {/* Main slide */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <img
                        src={getCurrentSlideImage(currentSlide)}
                        alt={`Slide ${currentSlideIndex + 1}`}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>

                {/* Controls */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="text-white/70 text-sm mr-2">
                        {currentSlideIndex + 1} / {totalSlides}
                    </span>
                    <button
                        onClick={() => setIsFullscreen(false)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Navigation */}
                <button
                    onClick={prevSlide}
                    disabled={currentSlideIndex === 0}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white transition-all ${currentSlideIndex === 0 ? 'opacity-30' : 'hover:bg-white/20'}`}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={nextSlide}
                    disabled={currentSlideIndex === totalSlides - 1}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 text-white transition-all ${currentSlideIndex === totalSlides - 1 ? 'opacity-30' : 'hover:bg-white/20'}`}
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Thumbnail strip */}
                <div className="bg-black/80 p-4 overflow-x-auto">
                    <div className="flex gap-2 justify-center">
                        {selectedDeck.slides.map((slide, idx) => (
                            <button
                                key={slide.id}
                                onClick={() => goToSlide(idx)}
                                className={`flex-shrink-0 w-20 h-12 rounded overflow-hidden border-2 transition-all ${
                                    idx === currentSlideIndex
                                        ? 'border-indigo-500 ring-2 ring-indigo-500/50'
                                        : 'border-transparent opacity-60 hover:opacity-100'
                                }`}
                            >
                                <img
                                    src={getCurrentSlideImage(slide)}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Normal view
    return (
        <>
            <div className="w-full max-w-full rounded-2xl overflow-hidden bg-slate-900 shadow-xl">
                {/* Edit overlay */}
                {isEditing && (
                    <div className="bg-slate-800 px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white/70 uppercase">Deck</span>
                            <span className="text-xs text-white/50 truncate max-w-[200px]">{selectedDeck.name}</span>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedDeck(null);
                                updateBlock({ deckId: '' });
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                        >
                            Change
                        </button>
                    </div>
                )}

                {/* Main slide */}
                <div className="relative bg-white overflow-hidden aspect-[16/9]">
                    <img
                        src={getCurrentSlideImage(currentSlide)}
                        alt={`Slide ${currentSlideIndex + 1}`}
                        className="w-full h-full object-contain"
                    />

                    {/* Navigation arrows */}
                    <button
                        onClick={prevSlide}
                        disabled={currentSlideIndex === 0}
                        className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white transition-all ${currentSlideIndex === 0 ? 'opacity-30' : 'hover:bg-black/70'}`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={nextSlide}
                        disabled={currentSlideIndex === totalSlides - 1}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white transition-all ${currentSlideIndex === totalSlides - 1 ? 'opacity-30' : 'hover:bg-black/70'}`}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Thumbnail strip & controls */}
                <div className="bg-slate-800 p-3">
                    <div className="flex items-center gap-4">
                        {/* Thumbnails */}
                        <div className="flex-1 overflow-x-auto">
                            <div className="flex gap-2">
                                {selectedDeck.slides.map((slide, idx) => (
                                    <button
                                        key={slide.id}
                                        onClick={() => goToSlide(idx)}
                                        className={`flex-shrink-0 w-16 h-10 rounded overflow-hidden border-2 transition-all ${
                                            idx === currentSlideIndex
                                                ? 'border-indigo-500'
                                                : 'border-transparent opacity-60 hover:opacity-100'
                                        }`}
                                    >
                                        <img
                                            src={getCurrentSlideImage(slide)}
                                            alt={`Thumbnail ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-white/50 text-xs">
                                {currentSlideIndex + 1} / {totalSlides}
                            </span>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsFullscreen(true)}
                                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded text-white/70 hover:text-white transition-colors"
                                    title="Fullscreen"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Deck Library Modal */}
            {showLibrary && (
                <DeckLibraryModal
                    decks={decks}
                    loading={loadingDecks}
                    onSelect={handleSelectDeck}
                    onClose={() => setShowLibrary(false)}
                />
            )}
        </>
    );
};

// Deck Library Modal Component
interface DeckLibraryModalProps {
    decks: SavedDeck[];
    loading: boolean;
    onSelect: (deck: SavedDeck) => void;
    onClose: () => void;
}

const DeckLibraryModal: React.FC<DeckLibraryModalProps> = ({ decks, loading, onSelect, onClose }) => {
    // Get first slide image for thumbnail
    const getDeckThumbnail = (deck: SavedDeck): string | null => {
        if (deck.thumbnailUrl) return deck.thumbnailUrl;
        if (deck.slides && deck.slides.length > 0) {
            const firstSlide = deck.slides[0];
            if (firstSlide.history && firstSlide.history.length > 0) {
                return firstSlide.history[firstSlide.history.length - 1];
            }
            return firstSlide.originalSrc;
        }
        return null;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">My Decks</h2>
                        <p className="text-sm text-gray-500">{decks.length} presentations</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                        </div>
                    ) : decks.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <p className="text-gray-500">No decks yet</p>
                            <p className="text-sm text-gray-400 mt-1">Create a presentation in the main app first</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {decks.map((deck) => {
                                const thumbnail = getDeckThumbnail(deck);
                                return (
                                    <button
                                        key={deck.id}
                                        onClick={() => onSelect(deck)}
                                        className="group text-left bg-gray-50 rounded-xl overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all"
                                    >
                                        {/* Thumbnail */}
                                        <div className="aspect-video bg-gray-200 relative overflow-hidden">
                                            {thumbnail ? (
                                                <img
                                                    src={thumbnail}
                                                    alt={deck.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl">
                                                    📊
                                                </div>
                                            )}
                                            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 rounded text-white text-xs">
                                                {deck.slideCount} slides
                                            </div>
                                        </div>
                                        {/* Info */}
                                        <div className="p-3">
                                            <h3 className="font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                                                {deck.name}
                                            </h3>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(deck.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DeckWidget;
