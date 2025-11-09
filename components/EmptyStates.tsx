import React from 'react';

interface EmptyStateProps {
  type: 'no-decks' | 'no-analytics' | 'no-search' | 'no-notifications' | 'error' | 'no-slides';
  onAction?: () => void;
  actionLabel?: string;
  customTitle?: string;
  customMessage?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  onAction,
  actionLabel,
  customTitle,
  customMessage
}) => {
  const getContent = () => {
    switch (type) {
      case 'no-decks':
        return {
          illustration: <NoDeckIllustration />,
          title: customTitle || 'No decks yet',
          message: customMessage || 'Create your first AI-powered presentation and start winning',
          action: actionLabel || 'Create Your First Deck',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          )
        };

      case 'no-analytics':
        return {
          illustration: <NoAnalyticsIllustration />,
          title: customTitle || 'No analytics data yet',
          message: customMessage || 'Share your deck to start tracking views and engagement',
          action: actionLabel || 'Share Your Deck',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          )
        };

      case 'no-search':
        return {
          illustration: <NoSearchIllustration />,
          title: customTitle || 'No results found',
          message: customMessage || 'Try adjusting your search terms or filters',
          action: actionLabel || 'Clear Search',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )
        };

      case 'no-notifications':
        return {
          illustration: <NoNotificationsIllustration />,
          title: customTitle || 'All caught up!',
          message: customMessage || 'You have no new notifications right now',
          action: null,
          icon: null
        };

      case 'error':
        return {
          illustration: <ErrorIllustration />,
          title: customTitle || 'Something went wrong',
          message: customMessage || 'We encountered an error. Please try again or contact support.',
          action: actionLabel || 'Try Again',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          )
        };

      case 'no-slides':
        return {
          illustration: <NoSlidesIllustration />,
          title: customTitle || 'No slides yet',
          message: customMessage || 'Add your first slide to start building your deck',
          action: actionLabel || 'Add New Slide',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          )
        };

      default:
        return {
          illustration: null,
          title: 'Empty',
          message: '',
          action: null,
          icon: null
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center animate-fade-in">
      {/* Illustration */}
      <div className="mb-8">
        {content.illustration}
      </div>

      {/* Title */}
      <h3 className="font-display font-bold text-2xl text-brand-text-primary mb-3">
        {content.title}
      </h3>

      {/* Message */}
      <p className="text-brand-text-secondary max-w-md mb-8">
        {content.message}
      </p>

      {/* Action Button */}
      {content.action && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary shadow-btn hover:shadow-btn-hover"
        >
          {content.icon}
          {content.action}
        </button>
      )}
    </div>
  );
};

// CSS-only Illustrations

const NoDeckIllustration: React.FC = () => (
  <div className="relative w-48 h-48">
    {/* Stack of cards */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      {/* Card 3 (back) */}
      <div className="absolute w-32 h-40 rounded-2xl bg-gradient-to-br from-brand-primary-100 to-brand-accent-100 border-2 border-brand-primary-200 transform rotate-12 translate-y-2 opacity-40 shadow-card"></div>

      {/* Card 2 (middle) */}
      <div className="absolute w-32 h-40 rounded-2xl bg-gradient-to-br from-brand-primary-200 to-brand-accent-200 border-2 border-brand-primary-300 transform rotate-6 translate-y-1 opacity-60 shadow-card"></div>

      {/* Card 1 (front) */}
      <div className="relative w-32 h-40 rounded-2xl bg-white border-2 border-dashed border-brand-primary-400 flex flex-col items-center justify-center gap-3 shadow-premium animate-float">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-brand-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <div className="w-12 h-1.5 rounded-full bg-brand-primary-200"></div>
        <div className="w-16 h-1 rounded-full bg-brand-primary-100"></div>
      </div>
    </div>

    {/* Sparkles */}
    <div className="absolute top-4 right-8 w-2 h-2 rounded-full bg-gradient-to-br from-brand-accent-400 to-brand-accent-500 animate-pulse" style={{ animationDelay: '0s' }}></div>
    <div className="absolute top-12 right-4 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-brand-primary-400 to-brand-primary-500 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
    <div className="absolute bottom-12 left-8 w-2 h-2 rounded-full bg-gradient-to-br from-brand-accent-400 to-brand-accent-500 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
  </div>
);

const NoAnalyticsIllustration: React.FC = () => (
  <div className="relative w-48 h-48">
    {/* Chart background */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-32 rounded-2xl bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 p-6 shadow-card">
      {/* Empty bars */}
      <div className="flex items-end justify-between h-full gap-3">
        <div className="w-full h-1/4 rounded-t-lg bg-gray-200 animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="w-full h-1/3 rounded-t-lg bg-gray-200 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-full h-1/2 rounded-t-lg bg-gray-200 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        <div className="w-full h-1/4 rounded-t-lg bg-gray-200 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
      </div>
    </div>

    {/* Magnifying glass */}
    <div className="absolute bottom-8 right-8 animate-float">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-brand-primary-400 bg-white/50 backdrop-blur-sm"></div>
        <div className="absolute -bottom-2 -right-2 w-8 h-1 bg-brand-primary-400 rounded-full transform rotate-45 origin-top-left"></div>
      </div>
    </div>
  </div>
);

const NoSearchIllustration: React.FC = () => (
  <div className="relative w-48 h-48">
    {/* Search icon */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-8 border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 flex items-center justify-center shadow-card">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div className="absolute -bottom-4 -right-4 w-12 h-3 bg-gray-300 rounded-full transform rotate-45"></div>
      </div>
    </div>

    {/* Question marks */}
    <div className="absolute top-8 left-12 text-3xl text-gray-200 animate-float" style={{ animationDelay: '0s' }}>?</div>
    <div className="absolute top-12 right-12 text-2xl text-gray-200 animate-float" style={{ animationDelay: '0.3s' }}>?</div>
    <div className="absolute bottom-16 left-8 text-2xl text-gray-200 animate-float" style={{ animationDelay: '0.6s' }}>?</div>
  </div>
);

const NoNotificationsIllustration: React.FC = () => (
  <div className="relative w-48 h-48">
    {/* Bell */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="relative">
        {/* Bell body */}
        <div className="w-24 h-28 bg-gradient-to-br from-green-100 to-emerald-100 border-4 border-green-200 rounded-t-full rounded-b-3xl shadow-card flex items-end justify-center pb-6">
          <div className="w-12 h-8 bg-gradient-to-b from-green-200 to-green-300 rounded-full"></div>
        </div>

        {/* Bell clapper */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3 h-6 bg-green-300 rounded-full"></div>

        {/* Bell top */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-green-200 rounded-full"></div>

        {/* Checkmark */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-premium">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>

    {/* Sparkles */}
    <div className="absolute top-8 right-12 w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse" style={{ animationDelay: '0s' }}></div>
    <div className="absolute top-16 right-8 w-1.5 h-1.5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
    <div className="absolute bottom-16 left-12 w-2 h-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
  </div>
);

const ErrorIllustration: React.FC = () => (
  <div className="relative w-48 h-48">
    {/* Warning triangle */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="relative w-32 h-28 flex items-center justify-center">
        {/* Triangle */}
        <div className="absolute inset-0 animate-float">
          <svg viewBox="0 0 100 90" className="w-full h-full drop-shadow-lg">
            <defs>
              <linearGradient id="error-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FCA5A5" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
            <path
              d="M50 5 L95 85 L5 85 Z"
              fill="url(#error-gradient)"
              stroke="#DC2626"
              strokeWidth="3"
            />
          </svg>
        </div>

        {/* Exclamation mark */}
        <div className="relative z-10 flex flex-col items-center gap-2">
          <div className="w-2 h-12 rounded-full bg-white"></div>
          <div className="w-3 h-3 rounded-full bg-white"></div>
        </div>
      </div>
    </div>

    {/* Alert dots */}
    <div className="absolute top-8 right-8 w-2 h-2 rounded-full bg-red-400 animate-pulse" style={{ animationDelay: '0s' }}></div>
    <div className="absolute top-12 right-4 w-2 h-2 rounded-full bg-orange-400 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
    <div className="absolute bottom-12 left-8 w-2 h-2 rounded-full bg-red-400 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
  </div>
);

const NoSlidesIllustration: React.FC = () => (
  <div className="relative w-48 h-48">
    {/* Presentation screen */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <div className="relative">
        {/* Screen */}
        <div className="w-40 h-28 bg-gradient-to-br from-gray-50 to-slate-50 border-4 border-gray-300 rounded-xl shadow-card flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl border-4 border-dashed border-gray-300 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Stand */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-1 h-8 bg-gray-300"></div>
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-2 bg-gray-300 rounded-full"></div>
      </div>
    </div>

    {/* Plus icons */}
    <div className="absolute top-8 right-12 w-6 h-6 text-brand-primary-300 animate-pulse" style={{ animationDelay: '0s' }}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
      </svg>
    </div>
    <div className="absolute bottom-12 left-8 w-5 h-5 text-brand-accent-300 animate-pulse" style={{ animationDelay: '0.4s' }}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
      </svg>
    </div>
  </div>
);

export default EmptyState;
