import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserDecks, deleteDeck } from '../services/firestoreService';
import { SavedDeck } from '../types';

interface DeckLibraryProps {
    onLoadDeck: (slides: SavedDeck['slides']) => void;
    onClose: () => void;
}

const DeckLibrary: React.FC<DeckLibraryProps> = ({ onLoadDeck, onClose }) => {
    const { user } = useAuth();
    const [decks, setDecks] = useState<SavedDeck[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingDeckId, setDeletingDeckId] = useState<string | null>(null);

    const loadDecks = async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const userDecks = await getUserDecks(user.uid);
            setDecks(userDecks);
        } catch (err: any) {
            console.error('Error loading decks:', err);
            setError(err.message || 'Failed to load decks');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDecks();
    }, [user?.uid]);

    const handleDeleteDeck = async (deckId: string) => {
        if (!window.confirm('Are you sure you want to delete this deck? This cannot be undone.')) {
            return;
        }

        try {
            setDeletingDeckId(deckId);
            await deleteDeck(deckId);
            setDecks(prevDecks => prevDecks.filter(d => d.id !== deckId));
        } catch (err: any) {
            console.error('Error deleting deck:', err);
            alert('Failed to delete deck: ' + err.message);
        } finally {
            setDeletingDeckId(null);
        }
    };

    const handleLoadDeck = (deck: SavedDeck) => {
        onLoadDeck(deck.slides);
        onClose();
    };

    if (!user) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                    <h2 className="text-2xl font-display font-bold text-brand-text-primary mb-4">
                        Sign In Required
                    </h2>
                    <p className="text-brand-text-secondary mb-6">
                        Please sign in to view your saved decks.
                    </p>
                    <button onClick={onClose} className="btn btn-primary w-full">
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-6 max-w-6xl w-full shadow-2xl my-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-brand-text-primary">
                            My Decks
                        </h2>
                        <p className="text-brand-text-secondary text-sm mt-1">
                            {decks.length} {decks.length === 1 ? 'deck' : 'decks'} saved
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <svg className="animate-spin h-12 w-12 text-brand-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-brand-text-secondary">Loading your decks...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && decks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-brand-text-primary mb-2">No decks yet</h3>
                        <p className="text-brand-text-secondary text-sm mb-6 text-center max-w-sm">
                            Start creating your first deck and it will automatically be saved here!
                        </p>
                        <button onClick={onClose} className="btn btn-primary">
                            Create New Deck
                        </button>
                    </div>
                )}

                {/* Decks Grid */}
                {!loading && decks.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
                        {decks.map(deck => (
                            <div
                                key={deck.id}
                                className="group bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:border-brand-primary-300 hover:shadow-lg transition-all duration-300"
                            >
                                {/* Thumbnail */}
                                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                    {deck.thumbnailUrl ? (
                                        <img
                                            src={deck.thumbnailUrl}
                                            alt={deck.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-16 h-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="font-semibold text-brand-text-primary mb-1 truncate">
                                        {deck.name}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs text-brand-text-tertiary mb-3">
                                        <span className="flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            {deck.slideCount} slides
                                        </span>
                                        <span>
                                            {new Date(deck.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleLoadDeck(deck)}
                                            className="flex-1 btn btn-primary text-sm py-2"
                                        >
                                            Load Deck
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDeck(deck.id)}
                                            disabled={deletingDeckId === deck.id}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="Delete deck"
                                        >
                                            {deletingDeckId === deck.id ? (
                                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeckLibrary;
