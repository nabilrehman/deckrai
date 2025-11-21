import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { handleSubscriptionSuccess } from '../services/stripeService';
import { UserPlan } from '../types';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const activateSubscription = async () => {
      const sessionId = searchParams.get('session_id');
      const plan = searchParams.get('plan') as UserPlan;

      if (!sessionId || !plan || !user) {
        setError('Missing required information');
        setStatus('error');
        return;
      }

      try {
        console.log('🔄 Activating subscription...');
        console.log('   Session ID:', sessionId);
        console.log('   Plan:', plan);
        console.log('   User:', user.uid);

        await handleSubscriptionSuccess(sessionId, user.uid, plan);

        console.log('✅ Subscription activated successfully!');
        setStatus('success');

        // Redirect to app after 3 seconds
        setTimeout(() => {
          navigate('/app');
        }, 3000);
      } catch (error: any) {
        console.error('❌ Failed to activate subscription:', error);
        setError(error.message || 'Failed to activate subscription');
        setStatus('error');
      }
    };

    activateSubscription();
  }, [searchParams, user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4">
              <svg className="animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Activating your subscription...</h2>
            <p className="text-gray-600">Please wait while we confirm your payment with Stripe.</p>
            <p className="text-sm text-gray-500 mt-2">This may take up to 30 seconds.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Your subscription has been activated.</p>
            <p className="text-sm text-gray-500">Redirecting you to the app...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Activation Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-4">Your payment was successful, but we couldn't activate your subscription. Please contact support.</p>
            <button
              onClick={() => navigate('/app')}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Go to App
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
