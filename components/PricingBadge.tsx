import React, { useState } from 'react';

interface PricingBadgeProps {
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  decksUsed?: number;
  decksLimit?: number;
  onUpgrade: () => void;
}

const PricingBadge: React.FC<PricingBadgeProps> = ({
  plan,
  decksUsed = 0,
  decksLimit = 10,
  onUpgrade
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const percentage = Math.min((decksUsed / decksLimit) * 100, 100);
  const isNearLimit = percentage >= 80;

  if (plan !== 'free') {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-brand-primary-200/50">
        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 animate-pulse"></div>
        <span className="text-xs font-semibold gradient-text">{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Collapsed State */}
      <div className={`flex items-center gap-3 px-4 py-2 rounded-xl glass border transition-all duration-300 cursor-pointer ${
        isNearLimit
          ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50'
          : 'border-brand-border/30 hover:border-brand-primary-300'
      }`}>
        <div className="flex flex-col min-w-[120px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-brand-text-secondary">Free Plan</span>
            <span className={`text-xs font-bold ${isNearLimit ? 'text-amber-600' : 'text-brand-text-primary'}`}>
              {decksUsed}/{decksLimit}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                isNearLimit
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                  : 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500'
              }`}
              style={{ width: `${percentage}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>

        {isNearLimit && (
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Expanded State */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-2 w-80 p-5 rounded-2xl shadow-card-lg border border-brand-border/50 bg-white z-50 animate-slide-down">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-display font-bold text-base text-brand-text-primary mb-1">
                {isNearLimit ? 'Running out of decks!' : 'Free Plan'}
              </h4>
              <p className="text-xs text-brand-text-secondary">
                {isNearLimit
                  ? `Only ${decksLimit - decksUsed} decks remaining this month`
                  : 'Perfect for trying deckr.ai'}
              </p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary-50 to-brand-accent-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">This Month</span>
              <span className="text-xs font-bold text-gray-900">{decksUsed} / {decksLimit} decks</span>
            </div>
            <div className="relative w-full h-2 bg-white rounded-full overflow-hidden shadow-inner">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-brand-primary-500 via-brand-accent-500 to-brand-primary-600 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, backgroundSize: '200% 100%' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Pro Features Preview */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-brand-text-secondary mb-2">Unlock with Pro:</p>
            <ul className="space-y-2">
              {[
                { icon: '∞', text: 'Unlimited decks' },
                { icon: '🎨', text: 'Remove watermarks' },
                { icon: '📊', text: 'Analytics dashboard' },
                { icon: '🔗', text: 'Share with tracking' }
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-2 text-xs text-brand-text-secondary">
                  <span className="flex items-center justify-center w-5 h-5 rounded-md bg-brand-primary-100 text-brand-primary-600 font-semibold">
                    {feature.icon}
                  </span>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Upgrade CTA */}
          <button
            onClick={onUpgrade}
            className="w-full btn btn-primary py-3 shadow-btn hover:shadow-btn-hover group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
            </svg>
            Upgrade to Pro
            <span className="ml-auto text-xs opacity-90">$29/mo</span>
          </button>

          {/* Money-back Guarantee */}
          <p className="text-center text-[10px] text-brand-text-tertiary mt-3 flex items-center justify-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            14-day money-back guarantee
          </p>
        </div>
      )}
    </div>
  );
};

export default PricingBadge;
