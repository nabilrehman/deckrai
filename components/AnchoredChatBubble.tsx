import React, { useState, useRef, useEffect } from 'react';

interface Position {
    x: number;
    y: number;
}

interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp: number;
}

interface EditQueueItem {
    id: string;
    originalText: string;
    action: 'change' | 'remove';
    newText?: string;
}

interface AnchoredChatBubbleProps {
    position: Position;
    onClose: () => void;
    onSubmit: (message: string) => Promise<void>;
    onEnterInpaintMode?: () => void;
    conversationHistory?: ChatMessage[];
    onUpdateHistory?: (history: ChatMessage[]) => void;
    isLoading?: boolean;
    regionText?: string;
    // Batch editing props
    isBatchMode?: boolean;
    editQueue?: EditQueueItem[];
    onAddToQueue?: (action: 'change' | 'remove', newText?: string) => void;
    onClearQueue?: () => void;
    onTransitionToPanel?: () => void; // Callback to transition to right panel
}

const AnchoredChatBubble: React.FC<AnchoredChatBubbleProps> = ({
    position,
    onClose,
    onSubmit,
    onEnterInpaintMode,
    conversationHistory = [],
    onUpdateHistory,
    isLoading = false,
    regionText = 'this',
    isBatchMode = false,
    editQueue = [],
    onAddToQueue,
    onClearQueue,
    onTransitionToPanel
}) => {
    const [inputValue, setInputValue] = useState('');
    const [localHistory, setLocalHistory] = useState<ChatMessage[]>(conversationHistory);
    const [showSuccess, setShowSuccess] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Sync local history with parent
    useEffect(() => {
        if (onUpdateHistory) {
            onUpdateHistory(localHistory);
        }
    }, [localHistory, onUpdateHistory]);

    // Update local history when prop changes
    useEffect(() => {
        setLocalHistory(conversationHistory);
    }, [conversationHistory]);

    // Auto-focus input when chat opens
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [localHistory, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // In batch mode, convert queue to natural language prompt
        if (isBatchMode && editQueue.length > 0) {
            const batchPrompt = editQueue.map(item => {
                if (item.action === 'remove') {
                    return `remove "${item.originalText}"`;
                } else {
                    return `change "${item.originalText}" to "${item.newText}"`;
                }
            }).join(', and ');

            // Add user message showing what's being changed
            const userMessageId = Date.now().toString();
            setLocalHistory(prev => [...prev, {
                id: userMessageId,
                sender: 'user',
                text: `Apply ${editQueue.length} ${editQueue.length === 1 ? 'change' : 'changes'}`,
                timestamp: Date.now()
            }]);

            // Add "Deckr is working..." message
            const workingMessageId = (Date.now() + 1).toString();
            setLocalHistory(prev => [...prev, {
                id: workingMessageId,
                sender: 'assistant',
                text: `Deckr is working on your ${editQueue.length === 1 ? 'edit' : 'edits'}...`,
                timestamp: Date.now()
            }]);

            try {
                await onSubmit(batchPrompt);
                // Clear queue but KEEP chat open for continued conversation
                if (onClearQueue) onClearQueue();

                // Update the working message to success
                setLocalHistory(prev => prev.map(msg =>
                    msg.id === workingMessageId
                        ? { ...msg, text: `✓ Changes applied successfully!` }
                        : msg
                ));

                // Show success state on button
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);

                // Don't close - user can continue with "add Google Cloud logo" etc.
            } catch (error) {
                console.error('Batch edit submission error:', error);
                // Update to error message
                setLocalHistory(prev => prev.map(msg =>
                    msg.id === workingMessageId
                        ? { ...msg, text: `✗ Error applying changes. Please try again.` }
                        : msg
                ));
            }
            return;
        }

        // Normal mode
        if (!inputValue.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: inputValue,
            timestamp: Date.now()
        };

        setLocalHistory(prev => [...prev, userMessage]);
        setInputValue('');

        try {
            await onSubmit(inputValue);
        } catch (error) {
            console.error('Chat submission error:', error);
        }
    };

    const handleAddChange = () => {
        if (!inputValue.trim() || !onAddToQueue) return;

        const wasEmpty = editQueue.length === 0;
        onAddToQueue('change', inputValue);
        setInputValue('');

        // Transition to right side after FIRST action only (Canva-style)
        if (onTransitionToPanel && wasEmpty) {
            console.log('[Chat Bubble] First edit added, moving to right side');
            setTimeout(() => onTransitionToPanel(), 200);
        }
    };

    const handleAddRemove = () => {
        if (!onAddToQueue) return;

        const wasEmpty = editQueue.length === 0;
        onAddToQueue('remove');
        setInputValue('');

        // Transition to right side after FIRST action only (Canva-style)
        if (onTransitionToPanel && wasEmpty) {
            console.log('[Chat Bubble] First edit added, moving to right side');
            setTimeout(() => onTransitionToPanel(), 200);
        }
    };

    const prefillPrompt = (text: string) => {
        setInputValue(text);
        inputRef.current?.focus();
    };

    // Calculate optimal position
    // In batch mode: stay fixed on right for the entire editing session
    const isAnchoredRight = isBatchMode;

    // Dynamic width - grows adaptively based on content like Canva
    const getBubbleWidth = () => {
        if (!isAnchoredRight) return 320; // Default 320px when not anchored

        // Calculate width based on queue content
        const minWidth = 320;
        const maxWidth = 450; // More reasonable max

        // Start small, grow only if needed
        if (editQueue.length === 0) return minWidth;

        const longestText = editQueue.reduce((max, item) => {
            const textLength = item.action === 'remove'
                ? item.originalText.length
                : Math.max(item.originalText.length, item.newText?.length || 0);
            return Math.max(max, textLength);
        }, 0);

        // Very conservative growth: only grow if text is really long (50+ chars)
        if (longestText < 50) return minWidth; // Stay at 320px for normal text
        if (longestText < 80) return 360; // Slightly bigger for medium text
        if (longestText < 120) return 400; // Medium-large
        return maxWidth; // Only max out for very long text
    };

    const bubbleStyle: React.CSSProperties = isAnchoredRight ? {
        position: 'fixed',
        right: 20,
        top: editQueue.length > 3 ? 80 : 120, // Start lower, go full height only with many edits
        width: getBubbleWidth(),
        zIndex: 1000,
        transition: 'width 0.3s ease-in-out, top 0.3s ease-in-out'
    } : {
        position: 'absolute',
        left: position.x > window.innerWidth / 2 ? position.x - 320 : position.x + 20,
        top: position.y,
        zIndex: 1000
    };

    return (
        <>
            {/* Chat Bubble - no backdrop so slide remains clickable */}
            <div
                style={bubbleStyle}
                className="animate-slideIn flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className={`${isAnchoredRight ? 'flex flex-col' : 'w-80'} bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 transition-all duration-300`}>
                    {/* Close button - minimal */}
                    <button
                        onClick={onClose}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-gray-800 text-white rounded-full hover:bg-gray-900 transition-colors flex items-center justify-center shadow-lg z-10"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Conversation History */}
                    {localHistory.length > 0 && (
                        <div className={`px-4 pt-4 pb-2 ${isAnchoredRight ? 'flex-1 overflow-y-auto' : 'max-h-64 overflow-y-auto'} bg-white`}>
                            {localHistory.map((message) => (
                                <div
                                    key={message.id}
                                    className={`mb-3 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
                                >
                                    <div
                                        className={`inline-block px-4 py-2 rounded-2xl text-sm max-w-[85%] ${
                                            message.sender === 'user'
                                                ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-900'
                                        }`}
                                    >
                                        {message.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="text-left mb-3">
                                    <div className="inline-block px-4 py-2 rounded-2xl text-sm bg-gray-100 text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    )}

                    {/* Input Area - Chat Style */}
                    <form onSubmit={handleSubmit} className="p-4 bg-white">
                        {/* Context Indicator */}
                        {(isBatchMode && editQueue.length > 0 && !inputValue.trim()) ? (
                            // Show batch summary when ready to submit
                            <div className="mb-3 bg-purple-50 rounded-xl px-3 py-2 border border-purple-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-sm">✨</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-purple-600 font-medium">Making all edits</p>
                                        <p className="text-sm text-purple-900 font-medium">{editQueue.length} {editQueue.length === 1 ? 'change' : 'changes'} ready</p>
                                    </div>
                                </div>
                            </div>
                        ) : regionText !== 'this area' && regionText !== 'Detecting...' ? (
                            // Show current editing context - prominent
                            <div className="mb-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl px-3 py-2.5 border-2 border-purple-400 shadow-md">
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                                        <span className="text-white text-base">✏️</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-purple-600 font-bold uppercase tracking-wide">Now Editing</p>
                                        <p className="text-base text-purple-900 font-bold truncate">"{regionText}"</p>
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        {/* Edit Queue - Simple text with checkmarks */}
                        {isBatchMode && editQueue.length > 0 && (
                            <div className="mb-3 space-y-1.5">
                                <div className="flex items-center justify-between px-1 mb-1">
                                    <p className="text-xs font-medium text-gray-500">Edit plan:</p>
                                    {onClearQueue && (
                                        <button
                                            type="button"
                                            onClick={onClearQueue}
                                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            clear
                                        </button>
                                    )}
                                </div>
                                {editQueue.map((item) => (
                                    <div key={item.id} className="flex items-start gap-2 text-xs text-gray-700 px-1">
                                        <span className="text-green-500 flex-shrink-0 font-bold">✓</span>
                                        <span className="leading-relaxed">
                                            {item.action === 'remove' ? (
                                                <>Remove "{item.originalText}"</>
                                            ) : (
                                                <>Change "{item.originalText}" to "{item.newText}"</>
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Suggestion pills - "change text" highlighted by default */}
                        {isBatchMode && localHistory.length === 0 && regionText !== 'this area' && regionText !== 'Detecting...' && (
                            <div className="mb-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.focus()}
                                    className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs rounded-full transition-colors font-medium shadow-sm"
                                >
                                    change text
                                </button>
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.focus()}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                                >
                                    restyle
                                </button>
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.focus()}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                                >
                                    remove
                                </button>
                            </div>
                        )}

                        {/* Clean input + gradient submit - unified for both modes */}
                        <div className="flex gap-2 items-end">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (isBatchMode && inputValue.trim()) {
                                            handleAddChange();
                                        }
                                    }
                                }}
                                placeholder={
                                    isBatchMode
                                        ? (regionText !== 'this area' && regionText !== 'Detecting...'
                                            ? `New text for "${regionText}"...`
                                            : "Describe your change...")
                                        : "Describe your change..."
                                }
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            />
                            {/* "Add change" button - only visible when typing */}
                            {isBatchMode && inputValue.trim() ? (
                                <button
                                    type="button"
                                    onClick={handleAddChange}
                                    disabled={isLoading}
                                    className="px-4 h-10 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg disabled:shadow-none flex-shrink-0 text-sm font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add
                                </button>
                            ) : !isBatchMode ? (
                                <button
                                    type="submit"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleSubmit(e);
                                    }}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg disabled:shadow-none flex-shrink-0"
                                >
                                    {isLoading ? (
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                        </svg>
                                    )}
                                </button>
                            ) : null}
                        </div>

                        {/* Apply All Changes button - shows when queue has items and input is empty */}
                        {isBatchMode && editQueue.length > 0 && !inputValue.trim() && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }}
                                disabled={isLoading || showSuccess}
                                className={`mt-3 w-full px-4 py-3 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl disabled:shadow-none text-sm font-bold ${
                                    showSuccess
                                        ? 'bg-gradient-to-r from-green-500 to-green-600'
                                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                                }`}
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Applying changes...
                                    </>
                                ) : showSuccess ? (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Changes Applied ✓
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Apply All Changes
                                    </>
                                )}
                            </button>
                        )}

                        {/* Detecting indicator */}
                        {regionText === 'Detecting...' && (
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Detecting text...</span>
                            </p>
                        )}
                    </form>
                </div>
            </div>

            <style>{`
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(${position.x > window.innerWidth / 2 ? '20px' : '-20px'}) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }

                .animate-slideIn {
                    animation: slideIn 200ms cubic-bezier(0.4, 0, 0.2, 1);
                }

                @keyframes pulseOnce {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.9;
                        transform: scale(1.02);
                    }
                }

                .animate-pulse-once {
                    animation: pulseOnce 400ms ease-in-out;
                }
            `}</style>
        </>
    );
};

export default AnchoredChatBubble;
