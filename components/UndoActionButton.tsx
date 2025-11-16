import React, { useState, useEffect } from 'react';

interface UndoActionButtonProps {
  onUndo: () => void;
  actionDescription: string;
  autoHideDelay?: number; // milliseconds
}

const UndoActionButton: React.FC<UndoActionButtonProps> = ({
  onUndo,
  actionDescription,
  autoHideDelay = 8000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isUndoing, setIsUndoing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, autoHideDelay);

    return () => clearTimeout(timer);
  }, [autoHideDelay]);

  const handleUndo = async () => {
    setIsUndoing(true);
    await onUndo();
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: '12px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '24px',
        fontSize: '13px',
        color: '#4B5563',
        animation: 'slideInUp 300ms ease-out',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
      }}
    >
      {/* Icon */}
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: 'rgba(99, 102, 241, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#6366F1" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>

      {/* Text */}
      <span style={{
        fontWeight: '500'
      }}>
        {actionDescription}
      </span>

      {/* Undo Button */}
      <button
        onClick={handleUndo}
        disabled={isUndoing}
        style={{
          padding: '6px 14px',
          background: '#FFFFFF',
          border: '1px solid rgba(99, 102, 241, 0.2)',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#6366F1',
          cursor: isUndoing ? 'not-allowed' : 'pointer',
          transition: 'all 150ms ease',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: 'none',
          opacity: isUndoing ? 0.5 : 1
        }}
        onMouseEnter={(e) => {
          if (!isUndoing) {
            e.currentTarget.style.background = '#6366F1';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = '#6366F1';
            e.currentTarget.style.boxShadow = '0 2px 6px rgba(99, 102, 241, 0.3)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isUndoing) {
            e.currentTarget.style.background = '#FFFFFF';
            e.currentTarget.style.color = '#6366F1';
            e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
            e.currentTarget.style.boxShadow = 'none';
          }
        }}
      >
        {isUndoing ? (
          <>
            <div style={{
              width: '10px',
              height: '10px',
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 600ms linear infinite'
            }} />
            Undoing...
          </>
        ) : (
          <>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
            Undo
          </>
        )}
      </button>

      {/* Dismiss Button */}
      <button
        onClick={() => setIsVisible(false)}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          color: '#9CA3AF',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 150ms ease',
          marginLeft: '-4px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
          e.currentTarget.style.color = '#4B5563';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#9CA3AF';
        }}
        title="Dismiss"
      >
        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default UndoActionButton;
