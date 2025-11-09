import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const { signInWithGoogle, signInWithFacebook } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithGoogle();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            await signInWithFacebook();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Facebook');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Minimal Header */}
                <div className="relative pt-12 pb-10 px-10 text-center">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 w-10 h-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors text-gray-400 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>

                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-8 shadow-xl">
                        <span className="text-white font-bold text-3xl">D</span>
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to deckr.ai</h2>
                    <p className="text-base text-gray-600">Sign in to save and sync your presentations</p>
                </div>

                {/* Body */}
                <div className="px-10 pb-10">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg animate-slide-down">
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="space-y-3.5">
                        {/* Google Sign In - Following Google's branding guidelines */}
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white border-2 border-gray-300 rounded-xl font-semibold text-gray-800 text-base hover:bg-gray-50 hover:border-gray-400 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
                        </button>

                        {/* Facebook Sign In */}
                        <button
                            onClick={handleFacebookSignIn}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-[#1877F2] border-2 border-[#1877F2] rounded-xl font-semibold text-white text-base hover:bg-[#166FE5] hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                            <span>{loading ? 'Signing in...' : 'Continue with Facebook'}</span>
                        </button>
                    </div>

                    <p className="mt-8 text-sm text-center text-gray-500 leading-relaxed">
                        By continuing, you agree to our <a href="#" className="text-indigo-600 hover:text-indigo-700 underline font-medium">Terms</a> and <a href="#" className="text-indigo-600 hover:text-indigo-700 underline font-medium">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
