import React, { useState, useEffect, useRef } from 'react';
import { Menu, Plus, MessageSquare, ChevronDown, LogOut, Zap, BookOpen, HelpCircle, BarChart3, Folder, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SavedChat } from '../types';
import { useUserUsage } from '../hooks/useUserUsage';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans';

interface ChatSidebarProps {
  user?: any;
  onNewChat?: () => void;
  recentChats?: SavedChat[];
  onSelectChat?: (chatId: string) => void;
  activeChatId?: string;
  onOpenDeckLibrary?: () => void;
  onUploadToStyleLibrary?: (files: FileList) => Promise<void>;
  chatActive?: boolean;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  user,
  onNewChat,
  recentChats = [],
  onSelectChat,
  activeChatId,
  onOpenDeckLibrary,
  onUploadToStyleLibrary,
  chatActive
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get real user profile with subscription data
  const { userProfile, usage } = useUserUsage();

  // Auto-close sidebar when chat becomes active
  useEffect(() => {
    if (chatActive) {
      setIsExpanded(false);
    }
  }, [chatActive]);

  // Get user's plan info
  const plan = userProfile?.plan || 'trial';
  const planConfig = SUBSCRIPTION_PLANS[plan];
  const slidesUsed = usage?.slidesThisMonth || 0;
  const slidesLimit = planConfig.slidesPerMonth;
  const decksUsed = usage?.decksThisMonth || 0;
  const decksLimit = planConfig.decksPerMonth;

  // Get trial days remaining
  const trialDaysRemaining = userProfile?.trial?.daysRemaining || 0;
  const isOnTrial = plan === 'trial';

  // Handle style library upload
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onUploadToStyleLibrary) return;

    setIsUploading(true);
    try {
      await onUploadToStyleLibrary(files);
      setIsExpanded(false);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      {/* Collapsed hamburger button */}
      {!isExpanded && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsExpanded(true)}
          className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full bg-slate-50 border border-slate-200/50 shadow-sm hover:bg-slate-100/60 hover:shadow-md transition-all flex items-center justify-center text-slate-600 hover:text-slate-900"
          aria-label="Expand menu"
        >
          <Menu size={20} />
        </motion.button>
      )}

      {/* Expanded sidebar */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-slate-200 shadow-xl z-50 flex flex-col overflow-hidden"
            >
              {/* Gradient Bar - Gemini Style */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              {/* Header with logo */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {/* Deckr Logo - Stacked Slides */}
                    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="sidebar-slide1" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#7145FF"/>
                          <stop offset="50%" stopColor="#5D5FEF"/>
                          <stop offset="100%" stopColor="#818CF8"/>
                        </linearGradient>
                        <linearGradient id="sidebar-slide2" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#5D5FEF"/>
                          <stop offset="100%" stopColor="#6366F1"/>
                        </linearGradient>
                        <linearGradient id="sidebar-slide3" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4F46E5"/>
                          <stop offset="100%" stopColor="#5D5FEF"/>
                        </linearGradient>
                      </defs>
                      {/* Slide 3 (back) */}
                      <g transform="translate(15, 45) rotate(-8 27.5 16.25)">
                        <rect width="55" height="32.5" rx="2.5" fill="url(#sidebar-slide3)" opacity="0.8"/>
                      </g>
                      {/* Slide 2 (middle) */}
                      <g transform="translate(17, 40) rotate(-4 27.5 16.25)">
                        <rect width="55" height="32.5" rx="2.5" fill="url(#sidebar-slide2)" opacity="0.9"/>
                      </g>
                      {/* Slide 1 (front) */}
                      <g transform="translate(20, 35)">
                        <rect width="55" height="32.5" rx="2.5" fill="url(#sidebar-slide1)"/>
                        <rect y="0" width="55" height="0.8" rx="2.5" fill="#FFFFFF" opacity="0.2"/>
                      </g>
                    </svg>
                    <div className="flex flex-col">
                      <span
                        className="text-lg bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600 bg-clip-text text-transparent animate-gradient-x"
                        style={{
                          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                          fontWeight: 600,
                          backgroundSize: '200% 200%'
                        }}
                      >
                        Deckr.ai
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="w-8 h-8 rounded-lg hover:bg-slate-100/60 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all"
                    aria-label="Collapse menu"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                {/* New Chat Button - CLAUDE.md Design System */}
                <button
                  onClick={() => {
                    onNewChat?.();
                    setIsExpanded(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#4F46E5] hover:scale-[1.02] text-white transition-all duration-150 shadow-sm hover:shadow-md"
                  style={{
                    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    filter: 'brightness(1)',
                    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
                >
                  <Plus size={18} strokeWidth={2.5} />
                  <span>New chat</span>
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto p-3">
                {/* Style Library Upload Button */}
                <div className="mb-4">
                  <button
                    onClick={handleUploadClick}
                    disabled={isUploading}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left group hover:bg-slate-100/60 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    ) : (
                      <Upload size={16} className="text-slate-600 group-hover:text-indigo-600 flex-shrink-0" strokeWidth={2} />
                    )}
                    <span className="text-sm text-slate-700 group-hover:text-slate-900 font-normal">
                      {isUploading ? 'Uploading...' : 'Upload Style'}
                    </span>
                  </button>
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                <div className="mb-4">
                  <h3 className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Recents
                  </h3>
                  {recentChats.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-slate-400">
                      No recent chats yet
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {recentChats.slice(0, 10).map((chat) => {
                        const isActive = chat.id === activeChatId;
                        return (
                          <button
                            key={chat.id}
                            onClick={() => {
                              onSelectChat?.(chat.id);
                              setIsExpanded(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left group ${
                              isActive
                                ? 'bg-indigo-50 border border-indigo-200'
                                : 'hover:bg-slate-100/60'
                            }`}
                          >
                            <MessageSquare
                              size={16}
                              className={`flex-shrink-0 ${
                                isActive
                                  ? 'text-indigo-600'
                                  : 'text-slate-400 group-hover:text-slate-700'
                              }`}
                              strokeWidth={2}
                            />
                            <span className={`text-sm truncate font-normal ${
                              isActive
                                ? 'text-indigo-900 font-medium'
                                : 'text-slate-700 group-hover:text-slate-900'
                            }`}>
                              {chat.title}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </nav>

              {/* User info at bottom */}
              {user && (
                <div className="p-3 border-t border-slate-200 relative">
                  {/* User dropdown menu - Opens UPWARD */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute bottom-[72px] left-3 right-3 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-10"
                      >
                        {/* Usage */}
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100/60 transition-all text-left">
                          <BarChart3 size={16} className="text-slate-600" strokeWidth={2} />
                          <span className="text-sm text-slate-700 font-normal">Usage</span>
                        </button>

                        {/* Get help */}
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100/60 transition-all text-left">
                          <HelpCircle size={16} className="text-slate-600" strokeWidth={2} />
                          <span className="text-sm text-slate-700 font-normal">Get help</span>
                        </button>

                        {/* Learn more */}
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100/60 transition-all text-left">
                          <BookOpen size={16} className="text-slate-600" strokeWidth={2} />
                          <span className="text-sm text-slate-700 font-normal">Learn more</span>
                        </button>

                        {/* Upgrade plan */}
                        <button
                          onClick={() => {
                            window.location.href = '/pricing';
                            setIsUserMenuOpen(false);
                            setIsExpanded(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 transition-all text-left border-t border-slate-100 group"
                        >
                          <Zap size={16} className="text-amber-600 group-hover:text-amber-700" strokeWidth={2} />
                          <span className="text-sm text-amber-700 font-medium group-hover:text-amber-800">
                            {isOnTrial ? `Upgrade (${trialDaysRemaining}d left)` : 'Upgrade plan'}
                          </span>
                        </button>

                        {/* Logout */}
                        <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100/60 transition-all text-left border-t border-slate-100">
                          <LogOut size={16} className="text-slate-600" strokeWidth={2} />
                          <span className="text-sm text-slate-700 font-normal">Log out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* User info button */}
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-100/60 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {user.displayName || user.email?.split('@')[0] || 'User'}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-500">
                          {isOnTrial ? `Trial (${trialDaysRemaining}d left)` : planConfig.displayName}
                        </div>
                        <div className="text-xs font-mono text-slate-400">
                          {slidesUsed}/{slidesLimit === -1 ? '∞' : slidesLimit}
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 group-hover:text-slate-600 flex-shrink-0 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                      strokeWidth={2}
                    />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatSidebar;
