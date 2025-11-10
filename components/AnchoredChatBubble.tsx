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

interface AnchoredChatBubbleProps {
    position: Position;
    onClose: () => void;
    onSubmit: (message: string) => Promise<void>;
    onEnterInpaintMode?: () => void;
    conversationHistory?: ChatMessage[];
    isLoading?: boolean;
    regionText?: string;
}

const AnchoredChatBubble: React.FC<AnchoredChatBubbleProps> = ({
    position,
    onClose,
    onSubmit,
    onEnterInpaintMode,
    conversationHistory = [],
    isLoading = false,
    regionText = 'this'
}) => {
    const [inputValue, setInputValue] = useState('');
    const [localHistory, setLocalHistory] = useState<ChatMessage[]>(conversationHistory);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

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

    const prefillPrompt = (text: string) => {
        setInputValue(text);
        inputRef.current?.focus();
    };

    // Calculate optimal position (right side preferred, fallback to left)
    const bubbleStyle: React.CSSProperties = {
        position: 'absolute',
        left: position.x > window.innerWidth / 2 ? position.x - 320 : position.x + 20,
        top: position.y,
        zIndex: 1000
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/10 z-[999]"
                onClick={onClose}
            />

            {/* Chat Bubble */}
            <div
                style={bubbleStyle}
                className="animate-slideIn"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-80 bg-white rounded-2xl shadow-2xl overflow-hidden border border-purple-200">
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
                        <div className="px-4 pt-4 pb-2 max-h-64 overflow-y-auto bg-white">
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
                        {/* Context Indicator - Above input */}
                        {regionText !== 'this area' && regionText !== 'Detecting...' && (
                            <div className="mb-3 bg-purple-50 rounded-xl px-3 py-2 border border-purple-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-white text-sm">✨</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-purple-600 font-medium">Editing</p>
                                        <p className="text-sm text-purple-900 font-medium truncate">"{regionText}"</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Suggestions - Canva style */}
                        {localHistory.length === 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => prefillPrompt('change to ')}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                                >
                                    change text
                                </button>
                                <button
                                    type="button"
                                    onClick={() => prefillPrompt('make it ')}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                                >
                                    restyle
                                </button>
                                <button
                                    type="button"
                                    onClick={() => prefillPrompt('remove')}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                                >
                                    remove
                                </button>
                            </div>
                        )}

                        {/* Input */}
                        <div className="flex gap-2 items-end">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Describe your change..."
                                disabled={isLoading}
                                className="flex-1 px-4 py-2.5 bg-gray-50 border-0 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            />
                            <button
                                type="submit"
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
                        </div>

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
            `}</style>
        </>
    );
};

export default AnchoredChatBubble;
