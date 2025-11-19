import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { handlePaymentSuccess } from '../services/stripeService';
import confetti from 'canvas-confetti';

interface PaymentSuccessPageProps {
  onReturnToEditor?: () => void;
}

const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({ onReturnToEditor }) => {
  const { user } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [credits, setCredits] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      // Get session ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');

      if (!sessionId) {
        setStatus('error');
        setError('No payment session found');
        return;
      }

      if (!user) {
        setStatus('error');
        setError('Please sign in to verify payment');
        return;
      }

      try {
        const result = await handlePaymentSuccess(sessionId, user.uid);

        if (result.success) {
          setCredits(result.credits);
          setStatus('success');

          // Trigger confetti celebration!
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });

          // More confetti after a delay
          setTimeout(() => {
            confetti({
              particleCount: 50,
              angle: 60,
              spread: 55,
              origin: { x: 0 }
            });
            confetti({
              particleCount: 50,
              angle: 120,
              spread: 55,
              origin: { x: 1 }
            });
          }, 250);
        }
      } catch (err: any) {
        console.error('Payment verification failed:', err);
        setStatus('error');
        setError(err.message || 'Failed to verify payment');
      }
    };

    verifyPayment();
  }, [user]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment...</h2>
          <p className="text-gray-600">Please wait while we confirm your purchase</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/pricing'}
              className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onReturnToEditor}
              className="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Return to Editor
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            If you were charged but didn't receive credits, please contact support.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          {/* Animated ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-4 border-green-200 rounded-full animate-ping"></div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h2>
        <p className="text-gray-600 mb-8">
          Your credits have been added to your account
        </p>

        {/* Credits Added */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 mb-8">
          <div className="text-white mb-2 text-sm font-medium">Credits Added</div>
          <div className="text-5xl font-bold text-white mb-2">+{credits}</div>
          <div className="text-indigo-100 text-sm">Start creating amazing slides!</div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onReturnToEditor}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            Start Creating →
          </button>
          <button
            onClick={() => window.location.href = '/usage'}
            className="w-full bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
          >
            View Usage
          </button>
        </div>

        {/* Receipt Info */}
        <p className="text-xs text-gray-500 mt-8">
          A receipt has been sent to your email
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
