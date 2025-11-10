


import React, { useState } from 'react';

import { useAuth } from '../contexts/AuthContext';
import { useUserUsage } from '../hooks/useUserUsage';
import { PLAN_LIMITS } from '../types';

import AuthModal from './AuthModal';



interface HeaderProps {

  hasActiveProject: boolean;

  onReset: () => void;

  onDownloadPdf: () => void;

  isDownloading: boolean;

  onPresent: () => void;

  isTestMode: boolean;

  onToggleTestMode: () => void;

  onSaveDeck: () => void;

  onOpenDeckLibrary: () => void;

  onExportToGoogleSlides: () => void;

  isExportingToSlides: boolean;

}



const Spinner: React.FC = () => (

    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-brand-text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">

        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>

        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>

    </svg>

);



const Header: React.FC<HeaderProps> = ({ hasActiveProject, onReset, onDownloadPdf, isDownloading, onPresent, isTestMode, onToggleTestMode, onSaveDeck, onOpenDeckLibrary, onExportToGoogleSlides, isExportingToSlides }) => {

  const { user, signOut: authSignOut } = useAuth();
  const { userProfile, usage } = useUserUsage();

  const [showPricingDetails, setShowPricingDetails] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);

  const [showUserMenu, setShowUserMenu] = useState(false);

  const [imageError, setImageError] = useState(false);



  // Real usage data from Firestore (fallback to mock for non-authenticated users)
  const plan = userProfile?.plan || 'free';
  const decksUsed = usage?.decksThisMonth || 0;
  const decksLimit = PLAN_LIMITS[plan].decksPerMonth;



  const handleSignOut = async () => {

    try {

      await authSignOut();

      setShowUserMenu(false);

      setImageError(false); // Reset image error on sign out

      // Redirect to landing page
      const landingPage = document.getElementById('landing-page');
      const appRoot = document.getElementById('root');

      if (landingPage && appRoot) {
        landingPage.style.display = 'block';
        appRoot.style.display = 'none';
        document.documentElement.classList.remove('app-loaded');
      }

    } catch (error) {

      console.error('Sign out error:', error);

    }

  };

  return (

    <header className="relative glass border-b border-brand-border/50 flex-shrink-0 z-20 shadow-glass animate-slide-down">

      <div className="absolute top-0 left-0 right-0 h-0.5 header-gradient animate-header-gradient"></div>

      <div className="container mx-auto px-6 md:px-8 py-4 flex justify-between items-center">

        <div className="flex items-center gap-4 group">

          <div className="relative">

            <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">

              <defs>

                <linearGradient id="logo-gradient" x1="0" y1="0" x2="1" y2="1">

                  <stop offset="0%" stopColor="#7145FF"/>

                  <stop offset="50%" stopColor="#5D5FEF"/>

                  <stop offset="100%" stopColor="#818CF8"/>

                </linearGradient>

                <filter id="glow">

                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>

                  <feMerge>

                    <feMergeNode in="coloredBlur"/>

                    <feMergeNode in="SourceGraphic"/>

                  </feMerge>

                </filter>

              </defs>

              <path d="M18 2C10.268 2 4 8.26801 4 16C4 23.732 10.268 30 18 30C19.5913 30 21.1239 29.753 22.5642 29.2848C18.4983 26.6817 15.6667 21.6963 15.6667 16C15.6667 10.3037 18.4983 5.31829 22.5642 2.71517C21.1239 2.24699 19.5913 2 18 2Z" fill="url(#logo-gradient)" filter="url(#glow)"/>

            </svg>

            <div className="absolute inset-0 bg-brand-primary-500 opacity-20 blur-xl rounded-full animate-pulse-glow"></div>

          </div>

          <div className="flex flex-col">

            <span className="font-display font-bold text-2xl gradient-text">deckr.ai</span>

            <span className="text-[10px] font-medium text-brand-text-tertiary tracking-wider uppercase">AI Deck Studio</span>

          </div>

        </div>



        <div className="flex items-center gap-3">

          {/* Pricing Badge */}

          <div

            className="relative"

            onMouseEnter={() => setShowPricingDetails(true)}

            onMouseLeave={() => setShowPricingDetails(false)}

          >

            <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all cursor-pointer shadow-premium ${

              ((decksUsed / decksLimit) * 100) >= 80

                ? 'border-orange-200/50 bg-gradient-to-r from-orange-50 to-amber-50'

                : 'border-brand-primary-200/50 bg-gradient-to-r from-brand-primary-50 to-indigo-50'

            }`}>

              <svg className="w-4 h-4 text-brand-primary-500" fill="currentColor" viewBox="0 0 20 20">

                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />

              </svg>

              <span className={`font-mono text-xs tracking-tight font-semibold ${

                ((decksUsed / decksLimit) * 100) >= 80 ? 'text-orange-700' : 'text-brand-primary-700'

              }`}>

                {plan.toUpperCase()} • {decksUsed}/{decksLimit}

              </span>

            </div>



            {/* Pricing Details Tooltip */}

            {showPricingDetails && (

              <div className="absolute top-full right-0 pt-2 z-50">
                <div className="w-72 bg-white rounded-2xl shadow-premium border-2 border-brand-primary-200 p-4 animate-scale-in">

                <div className="mb-3">

                  <div className="flex items-center justify-between mb-2">

                    <span className="text-sm font-semibold text-brand-text-primary">Decks used this month</span>

                    <span className="text-sm font-bold gradient-text">{decksUsed} / {decksLimit}</span>

                  </div>

                  <div className="w-full bg-brand-border rounded-full h-2">

                    <div

                      className="h-2 rounded-full bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 transition-all"

                      style={{ width: `${(decksUsed / decksLimit) * 100}%` }}

                    ></div>

                  </div>

                </div>

                <div className="pt-3 border-t border-brand-border/30">

                  <button className="btn btn-primary w-full text-sm py-2">

                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">

                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />

                    </svg>

                    Upgrade to Pro

                  </button>

                  <p className="text-xs text-brand-text-tertiary mt-2 text-center">Unlimited decks • Remove watermark • Analytics</p>

                </div>

                </div>

              </div>

            )}

          </div>

          {/* Test Mode Toggle */}

          <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass border border-brand-border/30">

            <span className={`text-xs font-semibold transition-colors ${isTestMode ? 'text-brand-primary-500' : 'text-brand-text-tertiary'}`}>

              Test Mode

            </span>

            <button

              onClick={onToggleTestMode}

              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ${

                isTestMode ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 shadow-premium' : 'bg-slate-200'

              }`}

            >

              <span

                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${

                  isTestMode ? 'translate-x-6' : 'translate-x-1'

                }`}

              />

            </button>

          </div>



          <div className="w-px h-8 bg-gradient-to-b from-transparent via-brand-border to-transparent"></div>



          {/* User Profile / Sign In */}

          {user ? (

            <div className="relative">

              <button

                onClick={() => setShowUserMenu(!showUserMenu)}

                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-brand-background transition-all"

              >

                {user.photoURL && !imageError ? (

                  <img

                    src={user.photoURL}

                    alt={user.displayName || 'User'}

                    className="w-8 h-8 rounded-full border-2 border-brand-primary-200"

                    onError={() => setImageError(true)}

                  />

                ) : (

                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 flex items-center justify-center text-white font-semibold text-sm">

                    {user.displayName?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}

                  </div>

                )}

                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-text-tertiary" viewBox="0 0 20 20" fill="currentColor">

                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />

                </svg>

              </button>



              {/* User Menu Dropdown */}

              {showUserMenu && (

                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-premium border-2 border-brand-primary-200 overflow-hidden animate-scale-in z-50">

                  <div className="p-4 border-b border-brand-border/30 bg-gradient-to-r from-brand-primary-50 to-brand-accent-50">

                    <p className="font-semibold text-brand-text-primary">{user.displayName || 'User'}</p>

                    <p className="text-sm text-brand-text-tertiary truncate">{user.email}</p>

                  </div>

                  <div className="p-2">

                    <button

                      onClick={handleSignOut}

                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 transition-colors text-left"

                    >

                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">

                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />

                      </svg>

                      Sign Out

                    </button>

                  </div>

                </div>

              )}

            </div>

          ) : (

            <button

              onClick={() => setShowAuthModal(true)}

              className="btn btn-secondary text-sm"

            >

              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">

                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />

              </svg>

              Sign In

            </button>

          )}



          {/* My Decks Button */}
          <button
            onClick={onOpenDeckLibrary}
            className="btn-icon group"
            title="My Decks"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-text-secondary group-hover:text-brand-primary-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
          </button>

          {/* Action Buttons */}

          {hasActiveProject && (

            <>

              <button

                onClick={onSaveDeck}

                disabled={isDownloading}

                className="btn-icon group"

                title="Save Deck"

              >

                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-text-secondary group-hover:text-brand-primary-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">

                  <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />

                </svg>

              </button>

              <button

                onClick={onPresent}

                disabled={isDownloading}

                className="btn-icon group"

                title="Present Mode"

              >

                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-text-secondary group-hover:text-brand-primary-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">

                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />

                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />

                </svg>

              </button>



              <button

                onClick={onDownloadPdf}

                disabled={isDownloading}

                className="btn-icon group"

                title="Download PDF"

              >

                {isDownloading ? (

                  <Spinner />

                ) : (

                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-text-secondary group-hover:text-brand-primary-500 transition-colors" viewBox="0 0 20 20" fill="currentColor">

                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />

                  </svg>

                )}

              </button>

              <button

                onClick={onExportToGoogleSlides}

                disabled={isExportingToSlides}

                className="btn-icon group"

                title="Export to Google Slides"

              >

                {isExportingToSlides ? (

                  <Spinner />

                ) : (

                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-text-secondary group-hover:text-brand-primary-500 transition-colors" viewBox="0 0 24 24" fill="currentColor">

                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H6v-2h6v2zm6-4H6v-2h12v2zm0-4H6V7h12v2z" />

                  </svg>

                )}

              </button>

            </>

          )}



          <button

            onClick={onReset}

            disabled={isDownloading}

            className="btn btn-primary shadow-btn hover:shadow-btn-hover"

          >

            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">

              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />

            </svg>

            New Deck

          </button>

        </div>

      </div>



      {/* Auth Modal */}

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

    </header>

  );

};



export default Header;
