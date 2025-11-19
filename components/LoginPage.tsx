import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onCancel }) => {
  const { signInWithGoogle, signInWithFacebook } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithFacebook();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Facebook sign-in failed:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Stripe-style gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b6b] via-[#ff8e53] to-[#ffd93d]">
        <div className="absolute inset-0 bg-gradient-to-tl from-[#6a11cb] via-transparent to-transparent opacity-70"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#a8edea] to-[#fed6e3] opacity-50"></div>
      </div>

      {/* Deckr.ai logo in top left */}
      <div className="absolute top-8 left-8 z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 17H7V10H9V17Z" fill="currentColor" fillOpacity="0.5"/>
              <path d="M13 17H11V7H13V17Z" fill="currentColor"/>
              <path d="M17 17H15V13H17V17Z" fill="currentColor" fillOpacity="0.75"/>
            </svg>
          </div>
          <span className="text-2xl font-bold text-white">deckr.ai</span>
        </div>
      </div>

      {/* Login Card - Centered */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-12 max-w-md w-full mx-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">Sign in to your account</h1>
        </div>

        {/* Auth Buttons */}
        <div className="space-y-3">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Facebook Sign In */}
          <button
            onClick={handleFacebookSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Sign in with Facebook</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8">
          <p className="text-sm text-gray-600 text-center">
            New to Deckr?{' '}
            <span className="text-indigo-600 font-semibold">Get 100 free credits to start!</span>
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p>
              If you use two-step authentication,{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-700 underline">
                keep your backup code in a secure place
              </a>
              . It can help you recover access to your account if you get locked out.
            </p>
          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-8 flex items-center justify-center gap-4 text-sm text-gray-500">
          <span>© Deckr.ai</span>
          <a href="#" className="hover:text-gray-700 transition-colors">Privacy & terms</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
