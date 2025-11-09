import React, { useState } from 'react';

interface NotificationCenterProps {
  onNotificationClick?: (notification: Notification) => void;
}

interface Notification {
  id: string;
  type: 'view' | 'comment' | 'share' | 'system' | 'upgrade';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    deckName?: string;
    userName?: string;
    avatar?: string;
  };
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNotificationClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'view',
      title: 'New deck view',
      message: 'Sarah Johnson viewed "Q4 Sales Pitch"',
      timestamp: '5 minutes ago',
      isRead: false,
      metadata: {
        deckName: 'Q4 Sales Pitch',
        userName: 'Sarah Johnson',
        avatar: 'SJ'
      }
    },
    {
      id: '2',
      type: 'comment',
      title: 'New comment',
      message: 'Michael Chen left feedback on slide 3',
      timestamp: '1 hour ago',
      isRead: false,
      metadata: {
        deckName: 'Product Roadmap 2024',
        userName: 'Michael Chen',
        avatar: 'MC'
      }
    },
    {
      id: '3',
      type: 'share',
      title: 'Deck shared',
      message: 'Your deck was shared with 5 new people',
      timestamp: '3 hours ago',
      isRead: false,
      metadata: {
        deckName: 'Investor Pitch v3'
      }
    },
    {
      id: '4',
      type: 'upgrade',
      title: 'Upgrade available',
      message: 'Unlock unlimited decks with Pro',
      timestamp: '1 day ago',
      isRead: true
    },
    {
      id: '5',
      type: 'system',
      title: 'Feature update',
      message: 'New AI personalization features are now live',
      timestamp: '2 days ago',
      isRead: true
    },
    {
      id: '6',
      type: 'view',
      title: 'High engagement',
      message: 'Your deck has reached 100 views!',
      timestamp: '3 days ago',
      isRead: true,
      metadata: {
        deckName: 'Marketing Strategy 2024'
      }
    }
  ]);

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'view':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'comment':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'share':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </div>
        );
      case 'upgrade':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        );
      case 'system':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl text-brand-text-secondary hover:text-brand-primary-500 hover:bg-brand-background transition-all duration-200"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>

        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 rounded-full bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Panel */}
          <div className="absolute right-0 top-12 z-50 w-96 bg-white rounded-2xl shadow-premium border-2 border-brand-border/30 overflow-hidden animate-slide-down">
            {/* Header */}
            <div className="relative p-5 border-b border-brand-border/30 bg-gradient-to-br from-gray-50 to-slate-50">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary-500 via-brand-accent-500 to-brand-primary-600"></div>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-brand-text-primary">Notifications</h3>
                  {unreadCount > 0 && (
                    <p className="text-xs text-brand-text-tertiary">{unreadCount} unread</p>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-brand-primary-500 hover:text-brand-primary-600 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 p-1 rounded-xl bg-white border border-brand-border/30">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    filter === 'all'
                      ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 text-white shadow-md'
                      : 'text-brand-text-secondary hover:text-brand-primary-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 ${
                    filter === 'unread'
                      ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 text-white shadow-md'
                      : 'text-brand-text-secondary hover:text-brand-primary-500'
                  }`}
                >
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[500px] overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div className="font-semibold text-brand-text-primary mb-2">All caught up!</div>
                  <div className="text-sm text-brand-text-tertiary">You have no new notifications</div>
                </div>
              ) : (
                <div className="divide-y divide-brand-border/20">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`group relative p-4 transition-all duration-200 cursor-pointer ${
                        !notification.isRead
                          ? 'bg-gradient-to-r from-brand-primary-50/50 to-brand-accent-50/50 hover:from-brand-primary-50 hover:to-brand-accent-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        markAsRead(notification.id);
                        onNotificationClick?.(notification);
                      }}
                    >
                      {/* Unread indicator */}
                      {!notification.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-primary-500 to-brand-accent-500"></div>
                      )}

                      <div className="flex items-start gap-3">
                        {/* Icon or Avatar */}
                        {notification.metadata?.avatar ? (
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 text-white font-bold text-sm shadow-md">
                            {notification.metadata.avatar}
                          </div>
                        ) : (
                          getNotificationIcon(notification.type)
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div className="font-semibold text-sm text-brand-text-primary">{notification.title}</div>
                            <div className="text-xs text-brand-text-tertiary whitespace-nowrap">{notification.timestamp}</div>
                          </div>
                          <div className="text-sm text-brand-text-secondary mb-2">{notification.message}</div>

                          {notification.metadata?.deckName && (
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-brand-border/30 text-xs">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-brand-primary-500" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                              </svg>
                              <span className="font-medium text-brand-text-secondary">{notification.metadata.deckName}</span>
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="flex items-center justify-center w-7 h-7 rounded-lg text-brand-text-tertiary hover:text-red-500 hover:bg-red-50 transition-all duration-200 opacity-0 group-hover:opacity-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 border-t border-brand-border/30 text-center">
                <button className="text-sm font-semibold text-brand-primary-500 hover:text-brand-primary-600 transition-colors">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
