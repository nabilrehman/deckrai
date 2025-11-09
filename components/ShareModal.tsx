import React, { useState } from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckTitle: string;
  deckId: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, deckTitle, deckId }) => {
  const [shareLink, setShareLink] = useState(`https://deckr.ai/share/${deckId}`);
  const [isCopied, setIsCopied] = useState(false);
  const [permission, setPermission] = useState<'view' | 'comment' | 'edit'>('view');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDays, setExpirationDays] = useState(7);
  const [trackAnalytics, setTrackAnalytics] = useState(true);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const permissionOptions = [
    { value: 'view' as const, label: 'Can View', icon: '👁️', description: 'Recipients can only view the deck' },
    { value: 'comment' as const, label: 'Can Comment', icon: '💬', description: 'Recipients can view and leave feedback' },
    { value: 'edit' as const, label: 'Can Edit', icon: '✏️', description: 'Recipients can make changes to the deck' }
  ];

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
          className="bg-white rounded-3xl shadow-premium border border-brand-border/50 w-full max-w-2xl pointer-events-auto animate-scale-in overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient accent */}
          <div className="relative p-8 pb-6 border-b border-brand-border/30">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary-500 via-brand-accent-500 to-brand-primary-600"></div>

            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 shadow-premium">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl text-brand-text-primary mb-1">Share Deck</h2>
                  <p className="text-sm text-brand-text-secondary">{deckTitle}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-xl text-brand-text-tertiary hover:text-brand-text-primary hover:bg-brand-background transition-all duration-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Share Link with Copy Button */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-brand-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-primary-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                Share Link
              </label>

              <div className="relative group">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="w-full px-4 py-3 pr-32 bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-brand-border/50 rounded-xl text-sm text-brand-text-primary font-mono focus:outline-none focus:border-brand-primary-300 focus:ring-4 focus:ring-brand-primary-500/10 transition-all"
                />
                <button
                  onClick={handleCopyLink}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg font-semibold text-sm transition-all duration-300 ${
                    isCopied
                      ? 'bg-green-500 text-white shadow-lg'
                      : 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 text-white shadow-btn hover:shadow-btn-hover'
                  }`}
                >
                  {isCopied ? (
                    <span className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                      Copy
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Permission Selector */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-brand-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-primary-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
                Access Permission
              </label>

              <div className="grid grid-cols-3 gap-3">
                {permissionOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPermission(option.value)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                      permission === option.value
                        ? 'border-brand-primary-500 bg-gradient-to-br from-brand-primary-50 to-brand-accent-50 shadow-premium'
                        : 'border-brand-border/50 hover:border-brand-primary-300 bg-white hover:shadow-card'
                    }`}
                  >
                    {permission === option.value && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    <div className="text-2xl mb-2">{option.icon}</div>
                    <div className="font-semibold text-xs text-brand-text-primary mb-1">{option.label}</div>
                    <div className="text-[10px] text-brand-text-tertiary leading-tight">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4 p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-slate-50 border border-brand-border/30">
              <h3 className="flex items-center gap-2 text-sm font-bold text-brand-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-primary-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Advanced Settings
              </h3>

              {/* Password Protection */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-brand-text-primary">Password Protection</span>
                    <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-100 to-yellow-100 text-[10px] font-bold text-amber-700 border border-amber-200">PRO</span>
                  </div>
                  <p className="text-xs text-brand-text-tertiary">Require a password to access this deck</p>
                </div>
                <button
                  onClick={() => setHasPassword(!hasPassword)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    hasPassword ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 shadow-premium' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                      hasPassword ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {hasPassword && (
                <div className="pl-4 animate-slide-down">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-4 py-2.5 bg-white border-2 border-brand-border/50 rounded-xl text-sm focus:outline-none focus:border-brand-primary-300 focus:ring-4 focus:ring-brand-primary-500/10 transition-all"
                  />
                </div>
              )}

              {/* Expiration Date */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-brand-text-primary">Link Expiration</span>
                  </div>
                  <p className="text-xs text-brand-text-tertiary">Automatically expire this link after a set time</p>
                </div>
                <button
                  onClick={() => setHasExpiration(!hasExpiration)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    hasExpiration ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 shadow-premium' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                      hasExpiration ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {hasExpiration && (
                <div className="pl-4 animate-slide-down">
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-white border-2 border-brand-border/50 rounded-xl text-sm focus:outline-none focus:border-brand-primary-300 focus:ring-4 focus:ring-brand-primary-500/10 transition-all cursor-pointer"
                  >
                    <option value={1}>1 day</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>
              )}

              {/* Analytics Tracking */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-brand-text-primary">Track Analytics</span>
                  </div>
                  <p className="text-xs text-brand-text-tertiary">See who views your deck and engagement metrics</p>
                </div>
                <button
                  onClick={() => setTrackAnalytics(!trackAnalytics)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${
                    trackAnalytics ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 shadow-premium' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                      trackAnalytics ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Social Share Preview */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-brand-text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-primary-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                Social Share Preview
              </label>

              <div className="p-5 rounded-2xl border-2 border-brand-border/30 bg-gradient-to-br from-white to-gray-50 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-brand-text-primary mb-0.5">{deckTitle}</div>
                    <div className="text-xs text-brand-text-tertiary">Created with deckr.ai • AI-powered presentations</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-brand-border/20">
                  <div className="text-[10px] font-medium text-brand-text-tertiary uppercase tracking-wide">Share on:</div>
                  <div className="flex items-center gap-2">
                    {['twitter', 'linkedin', 'facebook', 'email'].map((platform) => (
                      <button
                        key={platform}
                        className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-brand-border/50 hover:border-brand-primary-300 hover:shadow-md transition-all duration-200 group"
                        title={`Share on ${platform}`}
                      >
                        {platform === 'twitter' && (
                          <svg className="h-4 w-4 text-[#1DA1F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                          </svg>
                        )}
                        {platform === 'linkedin' && (
                          <svg className="h-4 w-4 text-[#0A66C2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                        )}
                        {platform === 'facebook' && (
                          <svg className="h-4 w-4 text-[#1877F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        )}
                        {platform === 'email' && (
                          <svg className="h-4 w-4 text-brand-text-secondary group-hover:text-brand-primary-500 group-hover:scale-110 transition-all" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gradient-to-br from-gray-50 to-slate-50 border-t border-brand-border/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-brand-text-tertiary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Your data is encrypted and secure</span>
            </div>

            <button
              onClick={onClose}
              className="btn btn-primary py-3 px-6 shadow-btn hover:shadow-btn-hover"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShareModal;
