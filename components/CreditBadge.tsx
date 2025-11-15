import React, { useState } from 'react';
import { useCredits } from '../hooks/useCredits';

interface CreditBadgeProps {
  onBuyCredits?: () => void;
  className?: string;
}

const CreditBadge: React.FC<CreditBadgeProps> = ({ onBuyCredits, className = '' }) => {
  const { credits, loading, isLowOnCredits, isOutOfCredits } = useCredits();
  const [showTooltip, setShowTooltip] = useState(false);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 ${className}`}>
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-600">...</span>
      </div>
    );
  }

  if (credits === null) {
    return null; // User not logged in
  }

  // Determine badge color based on credit level
  const getBadgeStyle = () => {
    if (isOutOfCredits()) {
      return {
        container: 'bg-red-50 border-red-300 border-2',
        text: 'text-red-700',
        icon: 'text-red-500',
        pulseClass: 'animate-pulse'
      };
    } else if (isLowOnCredits()) {
      return {
        container: 'bg-orange-50 border-orange-300 border',
        text: 'text-orange-700',
        icon: 'text-orange-500',
        pulseClass: ''
      };
    } else {
      return {
        container: 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 border',
        text: 'text-indigo-700',
        icon: 'text-indigo-500',
        pulseClass: ''
      };
    }
  };

  const style = getBadgeStyle();

  return (
    <div
      className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg ${style.container} ${style.pulseClass} ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Credit Icon */}
      <svg
        className={`w-5 h-5 ${style.icon}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* Credit Count */}
      <span className={`font-semibold text-sm ${style.text}`}>
        {credits} {credits === 1 ? 'credit' : 'credits'}
      </span>

      {/* Buy More Button */}
      {onBuyCredits && (
        <button
          onClick={onBuyCredits}
          className="ml-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors"
        >
          Buy more
        </button>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-full mt-2 right-0 z-50 w-56 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Your Credit Balance</p>
            <p className="text-gray-300">
              {credits === 0
                ? 'Out of credits! Purchase more to continue creating slides.'
                : credits <= 3
                ? `Low on credits! ${credits} remaining.`
                : `You have ${credits} credits available.`}
            </p>
            <p className="text-gray-400 mt-1">1 credit = 1 slide</p>
          </div>
          {/* Arrow */}
          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45" />
        </div>
      )}
    </div>
  );
};

export default CreditBadge;
