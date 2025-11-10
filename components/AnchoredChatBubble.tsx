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
    conversationHistory?: ChatMessage[];
    isLoading?: boolean;
    regionText?: string;
}

const AnchoredChatBubble: React.FC<AnchoredChatBubbleProps> = ({
    position,
    onClose,
    onSubmit,
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
                className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[999]"
                onClick={onClose}
            />

            {/* Chat Bubble */}
            <div
                style={bubbleStyle}
                className="animate-slideIn"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-80 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">💬</span>
                            <h3 className="text-sm font-semibold text-gray-900">Refine Slide</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Quick Actions */}
                    {localHistory.length === 0 && (
                        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                            <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => prefillPrompt('Change to: ')}
                                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                    <span>✏️</span>
                                    <span>Change text</span>
                                </button>
                                <button
                                    onClick={() => prefillPrompt('Make this ')}
                                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                    <span>🎨</span>
                                    <span>Restyle</span>
                                </button>
                                <button
                                    onClick={() => prefillPrompt('Remove this')}
                                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                    <span>🗑️</span>
                                    <span>Remove</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Conversation History */}
                    {localHistory.length > 0 && (
                        <div className="px-4 py-3 max-h-64 overflow-y-auto bg-white">
                            {localHistory.map((message) => (
                                <div
                                    key={message.id}
                                    className={`mb-3 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
                                >
                                    <div
                                        className={`inline-block px-3 py-2 rounded-lg text-sm max-w-[85%] ${
                                            message.sender === 'user'
                                                ? 'bg-gray-100 text-gray-900 border border-gray-200'
                                                : 'bg-blue-50 text-gray-900 border border-blue-100'
                                        }`}
                                    >
                                        {message.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="text-left mb-3">
                                    <div className="inline-block px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                            <span className="text-xs">Applying changes...</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>
                    )}

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="px-4 py-3 bg-white border-t border-gray-200">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={`Describe what you'd like to change...`}
                                disabled={isLoading}
                                className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim() || isLoading}
                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                            >
                                <span>✨</span>
                                <span>Apply</span>
                            </button>
                        </div>

                        {/* Context Indicator */}
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <span>💡</span>
                            <span>I'll refine the area you clicked</span>
                        </p>
                    </form>
                </div>

                {/* Visual connector line to clicked region */}
                <div className="absolute top-1/2 -translate-y-1/2 w-2 h-0.5 bg-gray-300"
                    style={{
                        left: position.x > window.innerWidth / 2 ? '100%' : '-8px',
                        width: '8px'
                    }}
                />
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
