import React from 'react';

export interface ActionItem {
  name: string;
  status: 'completed' | 'modified' | 'created' | 'updated';
  changes?: string; // e.g., "+- 142", "+98", "-23"
  icon?: React.ReactNode;
}

interface ActionSummaryProps {
  label: string;
  items: ActionItem[];
  icon?: 'sparkles' | 'check' | 'edit' | 'file';
}

const ActionSummary: React.FC<ActionSummaryProps> = ({
  label,
  items,
  icon = 'sparkles'
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'sparkles':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.364 6.364l-2.121-2.121M7.757 7.757L5.636 5.636m12.728 0l-2.121 2.121M7.757 16.243l-2.121 2.121"/>
          </svg>
        );
      case 'check':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#10B981" opacity="0.1"/>
            <path d="M9 12l2 2 4-4" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'edit':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        );
      case 'file':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
        );
    }
  };

  const getStatusIcon = (status: ActionItem['status']) => {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#10B981" opacity="0.1"/>
        <path
          d="M9 12l2 2 4-4"
          stroke="#10B981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div style={{
      marginBottom: '12px',
      borderRadius: '12px',
      border: '1px solid rgba(0, 0, 0, 0.06)',
      overflow: 'hidden'
    }}>
      {/* Action Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        background: 'rgba(0, 0, 0, 0.02)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
        fontSize: '13px',
        fontWeight: '600',
        color: '#374151',
        letterSpacing: '-0.006em'
      }}>
        <span style={{ color: '#6366F1' }}>{getIcon()}</span>
        <span>{label}</span>
      </div>

      {/* Action Items */}
      <div style={{
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderBottom: index < items.length - 1 ? '1px solid rgba(0, 0, 0, 0.04)' : 'none',
              transition: 'background 100ms ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.01)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {/* Left: Icon + Name */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flex: 1
            }}>
              {getStatusIcon(item.status)}
              <span style={{
                fontSize: '13px',
                color: '#374151',
                fontWeight: '500',
                letterSpacing: '-0.006em'
              }}>
                {item.name}
              </span>
            </div>

            {/* Right: Changes */}
            {item.changes && (
              <div style={{
                fontSize: '12px',
                fontWeight: '500',
                fontFamily: 'SF Mono, Monaco, Courier New, monospace',
                color: '#10B981',
                background: 'rgba(16, 185, 129, 0.08)',
                padding: '3px 8px',
                borderRadius: '6px',
                letterSpacing: '0.02em'
              }}>
                {item.changes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActionSummary;
