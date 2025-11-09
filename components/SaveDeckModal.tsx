import React, { useState, useEffect } from 'react';

interface SaveDeckModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (deckName: string) => void;
    defaultName?: string;
    isSaving?: boolean;
    showSuccess?: boolean;
}

const SaveDeckModal: React.FC<SaveDeckModalProps> = ({
    isOpen,
    onClose,
    onSave,
    defaultName = 'Untitled Deck',
    isSaving = false,
    showSuccess = false
}) => {
    const [deckName, setDeckName] = useState(defaultName);

    useEffect(() => {
        if (isOpen) {
            setDeckName(defaultName);
        }
    }, [isOpen, defaultName]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (deckName.trim()) {
            onSave(deckName.trim());
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isSaving) {
            handleSave();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scaleIn"
                onClick={(e) => e.stopPropagation()}
            >
                {showSuccess ? (
                    // Success State
                    <div className="p-8 text-center">
                        <div className="mb-4 flex justify-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-bounceIn">
                                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="text-2xl font-display font-bold text-brand-text-primary mb-2">
                            Deck Saved Successfully!
                        </h3>
                        <p className="text-brand-text-secondary mb-6">
                            Your presentation has been saved to the cloud.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200"
                        >
                            Got it
                        </button>
                    </div>
                ) : (
                    // Save Form State
                    <>
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-2xl font-display font-bold text-brand-text-primary flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary to-brand-primary-600 flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                </div>
                                Save Deck
                            </h2>
                            <p className="text-brand-text-secondary text-sm ml-13">
                                Give your presentation a memorable name
                            </p>
                        </div>

                        <div className="p-6">
                            <label className="block text-sm font-semibold text-brand-text-primary mb-2">
                                Deck Name
                            </label>
                            <input
                                type="text"
                                value={deckName}
                                onChange={(e) => setDeckName(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder="e.g., Q4 Sales Presentation"
                                autoFocus
                                disabled={isSaving}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all duration-200 font-medium text-brand-text-primary placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
                            />

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={onClose}
                                    disabled={isSaving}
                                    className="flex-1 px-6 py-3 border-2 border-gray-200 text-brand-text-secondary rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !deckName.trim()}
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Save Deck
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default SaveDeckModal;
