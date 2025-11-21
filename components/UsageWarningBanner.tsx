/**
 * Usage Warning Banner
 * Shows proactive alerts when users approach their limits
 * Follows SaaS best practices for user communication
 */

import React from 'react';

interface UsageWarningBannerProps {
  warning?: string;
  error?: string;
  currentUsage: number;
  limit: number;
  usagePercentage: number;
  isTrialExpired?: boolean;
  trialDaysRemaining?: number;
  onUpgrade?: () => void;
}

const UsageWarningBanner: React.FC<UsageWarningBannerProps> = ({
  warning,
  error,
  currentUsage,
  limit,
  usagePercentage,
  isTrialExpired,
  trialDaysRemaining,
  onUpgrade
}) => {
  // Don't show anything if no warning/error
  if (!warning && !error) return null;

  // Error state (limit exceeded or trial expired)
  if (error) {
    return (
      <div className="mb-4 p-4 rounded-lg border-2 border-red-500 bg-red-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900 mb-1">
              {isTrialExpired ? 'Trial Expired' : 'Usage Limit Reached'}
            </h3>
            <p className="text-sm text-red-800 mb-3">
              {error}
            </p>
            {limit !== -1 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-red-700 mb-1">
                  <span className="font-medium">Monthly Usage</span>
                  <span className="font-bold">{currentUsage} / {limit} slides</span>
                </div>
                <div className="w-full h-2 bg-red-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-600 transition-all duration-500"
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              </div>
            )}
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Upgrade Now
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Warning state (approaching limit or trial ending)
  if (warning) {
    const isApproachingLimit = usagePercentage >= 80;
    const isTrialEnding = trialDaysRemaining && trialDaysRemaining <= 3;

    return (
      <div className="mb-4 p-4 rounded-lg border-2 border-amber-400 bg-amber-50">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-amber-900 mb-1">
              {isTrialEnding ? 'Trial Ending Soon' : 'Approaching Usage Limit'}
            </h3>
            <p className="text-sm text-amber-800 mb-3">
              {warning}
            </p>
            {isApproachingLimit && limit !== -1 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-amber-700 mb-1">
                  <span className="font-medium">Monthly Usage</span>
                  <span className="font-bold">{currentUsage} / {limit} slides</span>
                </div>
                <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                    style={{ width: `${usagePercentage}%` }}
                  >
                    <div className="h-full w-full animate-pulse bg-white/20" />
                  </div>
                </div>
              </div>
            )}
            {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Upgrade to Continue
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default UsageWarningBanner;
