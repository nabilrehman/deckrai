import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ExportSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    presentationUrl: string;
}

const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({ isOpen, onClose, presentationUrl }) => {
    useEffect(() => {
        if (isOpen) {
            // Realistic confetti celebration across the whole screen!
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = {
                startVelocity: 30,
                spread: 360,
                ticks: 60,
                zIndex: 9999,
                colors: ['#7C3AED', '#A78BFA', '#C4B5FD', '#E9D5FF', '#F3E8FF', '#DDD6FE']
            };

            function randomInRange(min: number, max: number) {
                return Math.random() * (max - min) + min;
            }

            const interval = setInterval(function() {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                // Confetti from left side
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
                });

                // Confetti from right side
                confetti({
                    ...defaults,
                    particleCount,
                    origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
                });
            }, 250);

            // Initial big burst from center
            confetti({
                particleCount: 100,
                spread: 160,
                origin: { y: 0.6 },
                colors: ['#7C3AED', '#A78BFA', '#C4B5FD', '#E9D5FF', '#F3E8FF'],
                zIndex: 9999
            });

            return () => clearInterval(interval);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(presentationUrl);
    };

    const handleOpenPresentation = () => {
        window.open(presentationUrl, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-purple-500/30 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-scale-in">
                {/* Success Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center animate-bounce-in shadow-lg ring-4 ring-purple-500/20">
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-white text-center mb-2">
                    Successfully Exported!
                </h2>

                {/* Message */}
                <p className="text-gray-300 text-center mb-6 text-base">
                    Your presentation has been exported to Google Slides
                </p>

                {/* URL Display */}
                <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-3 mb-6 flex items-center justify-between">
                    <span className="text-sm text-gray-200 truncate flex-1 mr-2 font-mono">
                        {presentationUrl}
                    </span>
                    <button
                        onClick={handleCopyUrl}
                        className="p-2 hover:bg-slate-600 rounded transition-colors flex-shrink-0"
                        title="Copy URL"
                    >
                        <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-500 transition-colors border border-slate-500"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleOpenPresentation}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
                    >
                        Open Slides
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes scale-in {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes bounce-in {
                    0% {
                        opacity: 0;
                        transform: scale(0);
                    }
                    50% {
                        transform: scale(1.1);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .animate-scale-in {
                    animation: scale-in 0.3s ease-out;
                }

                .animate-bounce-in {
                    animation: bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                }
            `}</style>
        </div>
    );
};

export default ExportSuccessModal;
