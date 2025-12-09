/**
 * EmailCaptureModal - Optional email capture before viewing shared deck
 *
 * Shows a friendly prompt asking viewers for their email (optional).
 * Users can skip if they prefer to remain anonymous.
 */

import React, { useState } from 'react';

interface EmailCaptureModalProps {
    deckName: string;
    onSubmit: (email?: string, name?: string) => void;
    onSkip: () => void;
}

const EmailCaptureModal: React.FC<EmailCaptureModalProps> = ({
    deckName,
    onSubmit,
    onSkip
}) => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Small delay for UX
        await new Promise(resolve => setTimeout(resolve, 300));

        onSubmit(email || undefined, name || undefined);
    };

    const handleSkip = () => {
        onSkip();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-scale-in">
                {/* Gradient Header */}
                <div className="relative h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
                    <div className="absolute inset-0 bg-black/10"></div>

                    {/* Decorative circles */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10"></div>

                    {/* Icon */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                        <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="pt-12 px-8 pb-8">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
                        <p className="text-gray-600">
                            You're about to view <span className="font-semibold text-indigo-600">"{deckName}"</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Your Name <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-gray-900 placeholder-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email <span className="text-gray-400">(optional)</span>
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@company.com"
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-gray-900 placeholder-gray-400"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Opening...
                                </span>
                            ) : (
                                'View Presentation'
                            )}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <button
                            onClick={handleSkip}
                            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Skip and view anonymously
                        </button>
                    </div>

                    <p className="mt-6 text-xs text-gray-400 text-center">
                        By viewing, you agree to our terms. Your info helps the presenter know who viewed their deck.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmailCaptureModal;
