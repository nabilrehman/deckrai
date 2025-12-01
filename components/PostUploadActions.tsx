import React, { useState } from 'react';
import { POST_UPLOAD_ACTIONS, PostUploadAction } from '../constants';

interface PostUploadActionsProps {
  onActionClick: (prompt: string) => void;
  uploadedFileCount: number;
}

/**
 * PostUploadActions Component
 *
 * Displays contextual quick action chips after user uploads files.
 * Matches Vertex AI pattern: Upload assets → See suggested actions → Generate
 * Part of Phase 2 UX enhancement for sales enablement workflow.
 */
const PostUploadActions: React.FC<PostUploadActionsProps> = ({
  onActionClick,
  uploadedFileCount
}) => {
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState<PostUploadAction | null>(null);
  const [companyName, setCompanyName] = useState('');

  const handleActionClick = (action: PostUploadAction) => {
    if (action.requiresCompanyInput) {
      // Show modal to collect company name
      setSelectedAction(action);
      setShowCompanyModal(true);
    } else {
      // Direct prompt submission
      onActionClick(action.promptTemplate);
    }
  };

  const handleCompanySubmit = () => {
    if (selectedAction && companyName.trim()) {
      const prompt = selectedAction.promptTemplate.replace('{company}', companyName.trim());
      onActionClick(prompt);
      // Reset state
      setShowCompanyModal(false);
      setCompanyName('');
      setSelectedAction(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && companyName.trim()) {
      handleCompanySubmit();
    }
  };

  if (uploadedFileCount === 0) return null;

  return (
    <>
      {/* Quick Actions Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        marginBottom: '16px',
        padding: '16px',
        background: '#F9FAFB',
        border: '1px solid #E5E7EB',
        borderRadius: '12px'
      }}>
        {/* Header */}
        <div style={{
          fontSize: '13px',
          fontWeight: '600',
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          What would you like to do?
        </div>

        {/* Action Chips */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '8px'
        }}>
          {POST_UPLOAD_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                background: 'white',
                border: '1.5px solid #E0E0E0',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '500',
                color: '#424242',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F5F3FF';
                e.currentTarget.style.borderColor = '#8B5CF6';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#E0E0E0';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <span style={{ fontSize: '18px' }}>{action.icon}</span>
              <span style={{ flex: 1 }}>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Company Name Modal */}
      {showCompanyModal && selectedAction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
          onClick={() => setShowCompanyModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '400px',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1F2937',
                marginBottom: '8px'
              }}>
                {selectedAction.icon} {selectedAction.label}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6B7280',
                lineHeight: '1.5'
              }}>
                Enter the company name for this customization
              </div>
            </div>

            {/* Input Field */}
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Nike, Apple, Microsoft..."
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: '2px solid #E5E7EB',
                borderRadius: '10px',
                outline: 'none',
                transition: 'border-color 0.15s ease',
                marginBottom: '20px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#8B5CF6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#E5E7EB';
              }}
            />

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowCompanyModal(false);
                  setCompanyName('');
                  setSelectedAction(null);
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#6B7280',
                  background: 'transparent',
                  border: '1.5px solid #E5E7EB',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCompanySubmit}
                disabled={!companyName.trim()}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'white',
                  background: companyName.trim() ? '#8B5CF6' : '#D1D5DB',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: companyName.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  if (companyName.trim()) {
                    e.currentTarget.style.background = '#7C3AED';
                  }
                }}
                onMouseLeave={(e) => {
                  if (companyName.trim()) {
                    e.currentTarget.style.background = '#8B5CF6';
                  }
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostUploadActions;
