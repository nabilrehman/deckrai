import React, { useState } from 'react';
import { useCredits } from '../hooks/useCredits';

interface LowCreditsWarningProps {
  onBuyCredits?: () => void;
  threshold?: number; // Show warning when credits fall below this (default: 3)
}

const LowCreditsWarning: React.FC<LowCreditsWarningProps> = ({
  onBuyCredits,
  threshold = 3
}) => {
  const { credits, isLowOnCredits, isOutOfCredits } = useCredits();
  const [dismissed, setDismissed] = useState(false);

  // Don't show if dismissed or if user has enough credits
  if (dismissed || credits === null || credits > threshold) {
    return null;
  }

  // Don't show if completely out (OutOfCreditsModal should handle that)
  if (isOutOfCredits()) {
    return null;
  }

  return (
    <div className="w-full bg-orange-50 border-l-4 border-orange-500 p-4 mb-4 rounded-r-lg shadow-sm">
      <div className="flex items-center justify-between">
        {/* Warning Content */}
        <div className="flex items-start gap-3 flex-1">
          {/* Warning Icon */}
          <svg
            className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>

          {/* Message */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">
              Low on credits!
            </p>
            <p className="text-sm text-orange-700 mt-1">
              You have <strong>{credits} {credits === 1 ? 'credit' : 'credits'}</strong> remaining.
              {credits === 1
                ? ' Purchase more to continue creating slides.'
                : ` Each slide creation costs 1 credit.`
              }
            </p>
            {onBuyCredits && (
              <button
                onClick={onBuyCredits}
                className="mt-2 inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Buy Credits Now
              </button>
            )}
          </div>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 ml-4 text-orange-500 hover:text-orange-700 transition-colors"
          aria-label="Dismiss warning"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default LowCreditsWarning;
