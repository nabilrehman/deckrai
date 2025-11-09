import React from 'react';

interface EnhancedModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'upgrade' | 'confirm' | 'success' | 'warning' | 'feature';
  title?: string;
  message?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'success' | 'danger';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: React.ReactNode;
}

const EnhancedModal: React.FC<EnhancedModalProps> = ({
  isOpen,
  onClose,
  type,
  title,
  message,
  primaryAction,
  secondaryAction,
  children
}) => {
  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'upgrade':
        return {
          icon: (
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-premium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          ),
          gradient: 'from-orange-500 via-orange-400 to-orange-500',
          defaultTitle: 'Upgrade to Pro',
          defaultMessage: 'Unlock all features and take your presentations to the next level'
        };

      case 'confirm':
        return {
          icon: (
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 text-white shadow-premium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
          ),
          gradient: 'from-brand-primary-500 via-brand-accent-500 to-brand-primary-600',
          defaultTitle: 'Confirm Action',
          defaultMessage: 'Are you sure you want to proceed?'
        };

      case 'success':
        return {
          icon: (
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-premium animate-scale-in">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          ),
          gradient: 'from-green-500 via-emerald-400 to-green-500',
          defaultTitle: 'Success!',
          defaultMessage: 'Your action completed successfully'
        };

      case 'warning':
        return {
          icon: (
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-premium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          ),
          gradient: 'from-amber-500 via-orange-400 to-amber-500',
          defaultTitle: 'Warning',
          defaultMessage: 'Please review before continuing'
        };

      case 'feature':
        return {
          icon: (
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-premium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
              </svg>
            </div>
          ),
          gradient: 'from-purple-500 via-purple-400 to-purple-600',
          defaultTitle: 'New Feature',
          defaultMessage: 'Check out what's new'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-3xl shadow-premium border-2 border-brand-border/30 w-full max-w-md pointer-events-auto animate-scale-in overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient accent */}
          <div className="relative p-8 text-center">
            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config.gradient}`}></div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-lg text-brand-text-tertiary hover:text-brand-text-primary hover:bg-brand-background transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-6">
              {config.icon}
            </div>

            {/* Title */}
            <h2 className="font-display font-bold text-2xl text-brand-text-primary mb-3">
              {title || config.defaultTitle}
            </h2>

            {/* Message */}
            {message && (
              <p className="text-brand-text-secondary leading-relaxed">
                {message}
              </p>
            )}
          </div>

          {/* Custom Content */}
          {children && (
            <div className="px-8 pb-8">
              {children}
            </div>
          )}

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <div className="px-8 pb-8 flex flex-col-reverse sm:flex-row gap-3">
              {secondaryAction && (
                <button
                  onClick={secondaryAction.onClick}
                  className="flex-1 btn btn-secondary"
                >
                  {secondaryAction.label}
                </button>
              )}

              {primaryAction && (
                <button
                  onClick={primaryAction.onClick}
                  className={`flex-1 btn ${
                    primaryAction.variant === 'success'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-btn hover:shadow-btn-hover'
                      : primaryAction.variant === 'danger'
                      ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-btn hover:shadow-btn-hover'
                      : 'btn-primary shadow-btn hover:shadow-btn-hover'
                  }`}
                >
                  {primaryAction.label}
                </button>
              )}
            </div>
          )}

          {/* Footer (for specific types) */}
          {type === 'upgrade' && (
            <div className="px-8 pb-6 text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-brand-text-tertiary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>14-day money-back guarantee • Cancel anytime</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// Upgrade Modal - Specific implementation with detailed pricing
export const UpgradeModal: React.FC<{ isOpen: boolean; onClose: () => void; onUpgrade: () => void }> = ({
  isOpen,
  onClose,
  onUpgrade
}) => {
  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      type="upgrade"
      title="Unlock the Full Power of deckr.ai"
      message="Join thousands of professionals creating winning presentations"
      primaryAction={{
        label: 'Upgrade to Pro - $29/mo',
        onClick: onUpgrade,
        variant: 'primary'
      }}
      secondaryAction={{
        label: 'Maybe Later',
        onClick: onClose
      }}
    >
      <div className="space-y-4 mb-6">
        {[
          { icon: '∞', text: 'Unlimited decks and slides', highlight: true },
          { icon: '🎨', text: 'Remove deckr.ai watermark' },
          { icon: '📊', text: 'Advanced analytics dashboard' },
          { icon: '🔗', text: 'Password-protected sharing' },
          { icon: '⚡', text: 'Priority AI processing' },
          { icon: '👥', text: 'Team collaboration features' }
        ].map((feature, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
              feature.highlight
                ? 'bg-gradient-to-r from-brand-primary-50 to-brand-accent-50 border-2 border-brand-primary-200'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary-100 to-brand-accent-100 text-xl">
              {feature.icon}
            </div>
            <span className={`font-medium ${feature.highlight ? 'text-brand-text-primary' : 'text-brand-text-secondary'}`}>
              {feature.text}
            </span>
            {feature.highlight && (
              <span className="ml-auto px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-bold border border-green-200">
                Popular
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500 text-white flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-sm">
            <div className="font-semibold text-blue-900 mb-1">Limited Time Offer</div>
            <div className="text-blue-700">Get 20% off your first 3 months with code <span className="font-mono font-bold">EARLY20</span></div>
          </div>
        </div>
      </div>
    </EnhancedModal>
  );
};

// Delete Confirmation Modal
export const DeleteConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: string;
}> = ({ isOpen, onClose, onConfirm, itemName, itemType }) => {
  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      type="warning"
      title={`Delete ${itemType}?`}
      message={`Are you sure you want to delete "${itemName}"? This action cannot be undone.`}
      primaryAction={{
        label: 'Delete Forever',
        onClick: onConfirm,
        variant: 'danger'
      }}
      secondaryAction={{
        label: 'Cancel',
        onClick: onClose
      }}
    />
  );
};

// Success Modal
export const SuccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}> = ({ isOpen, onClose, title, message }) => {
  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      type="success"
      title={title}
      message={message}
      primaryAction={{
        label: 'Got it!',
        onClick: onClose,
        variant: 'success'
      }}
    />
  );
};

export default EnhancedModal;
