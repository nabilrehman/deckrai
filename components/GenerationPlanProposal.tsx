import React, { useState } from 'react';

export interface GenerationPlan {
  slideCount: number;
  style: 'executive' | 'visual' | 'data' | 'technical';
  audience: string;
  reasoning: string;
  estimatedTime: string;
}

interface GenerationPlanProposalProps {
  plan: GenerationPlan;
  onApprove: () => void;
  onModify: (modifiedPlan: Partial<GenerationPlan>) => void;
  onReject: () => void;
}

const GenerationPlanProposal: React.FC<GenerationPlanProposalProps> = ({
  plan,
  onApprove,
  onModify,
  onReject
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCount, setEditedCount] = useState(plan.slideCount);
  const [editedStyle, setEditedStyle] = useState(plan.style);

  const styles = [
    { id: 'executive', name: 'Executive Brief', icon: '📊', desc: 'Clean & professional' },
    { id: 'visual', name: 'Visual Story', icon: '🎨', desc: 'Image-driven & engaging' },
    { id: 'data', name: 'Data-Driven', icon: '📈', desc: 'Chart & analytics focused' },
    { id: 'technical', name: 'Technical', icon: '⚙️', desc: 'Detailed diagrams' }
  ];

  const handleModifySubmit = () => {
    onModify({
      slideCount: editedCount,
      style: editedStyle as any
    });
    setIsEditing(false);
  };

  return (
    <div className="plan-proposal-overlay">
      <div className="plan-proposal-card">
        {/* AI Avatar & Header */}
        <div className="plan-header">
          <div className="ai-avatar">
            <div className="ai-avatar-pulse"></div>
            ✨
          </div>
          <div>
            <h3 className="plan-title">I've analyzed your notes</h3>
            <p className="plan-subtitle">Here's what I recommend:</p>
          </div>
        </div>

        {/* Proposal Content */}
        <div className="plan-content">
          <div className="plan-section">
            <div className="plan-label">Slide Count</div>
            {!isEditing ? (
              <div className="plan-value-large">{plan.slideCount} slides</div>
            ) : (
              <div className="slide-count-editor">
                {[3, 5, 7, 10, 15, 20].map(count => (
                  <button
                    key={count}
                    className={`count-option ${editedCount === count ? 'selected' : ''}`}
                    onClick={() => setEditedCount(count)}
                  >
                    {count}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="plan-section">
            <div className="plan-label">Style</div>
            {!isEditing ? (
              <div className="plan-value">
                <span className="style-icon">
                  {styles.find(s => s.id === plan.style)?.icon}
                </span>
                <span className="style-name">
                  {styles.find(s => s.id === plan.style)?.name}
                </span>
              </div>
            ) : (
              <div className="style-selector">
                {styles.map(style => (
                  <button
                    key={style.id}
                    className={`style-option ${editedStyle === style.id ? 'selected' : ''}`}
                    onClick={() => setEditedStyle(style.id as any)}
                  >
                    <span className="style-icon">{style.icon}</span>
                    <span className="style-info">
                      <span className="style-name">{style.name}</span>
                      <span className="style-desc">{style.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="plan-section">
            <div className="plan-label">Audience</div>
            <div className="plan-value">{plan.audience}</div>
          </div>

          {/* AI Reasoning */}
          <div className="reasoning-section">
            <div className="reasoning-icon">💡</div>
            <div className="reasoning-content">
              <div className="reasoning-label">Why this approach?</div>
              <p className="reasoning-text">{plan.reasoning}</p>
            </div>
          </div>

          {/* Time Estimate */}
          <div className="time-estimate">
            ⏱️ Estimated time: {plan.estimatedTime}
          </div>
        </div>

        {/* Actions */}
        <div className="plan-actions">
          {!isEditing ? (
            <>
              <button className="btn-approve" onClick={onApprove}>
                <span className="btn-icon">✓</span>
                Looks good, generate
              </button>
              <button className="btn-modify" onClick={() => setIsEditing(true)}>
                <span className="btn-icon">✏️</span>
                Modify plan
              </button>
              <button className="btn-reject" onClick={onReject}>
                Start over
              </button>
            </>
          ) : (
            <>
              <button className="btn-approve" onClick={handleModifySubmit}>
                <span className="btn-icon">✓</span>
                Apply changes
              </button>
              <button className="btn-reject" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        .plan-proposal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
          padding: 20px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .plan-proposal-card {
          background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.98) 0%,
            rgba(249, 250, 251, 0.98) 100%
          );
          border-radius: 24px;
          padding: 32px;
          max-width: 600px;
          width: 100%;
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 0 100px rgba(99, 102, 241, 0.2);
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 2px solid rgba(99, 102, 241, 0.1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .plan-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 28px;
          padding-bottom: 20px;
          border-bottom: 2px solid rgba(99, 102, 241, 0.1);
        }

        .ai-avatar {
          position: relative;
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-center;
          font-size: 28px;
          flex-shrink: 0;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
        }

        .ai-avatar-pulse {
          position: absolute;
          inset: -4px;
          border-radius: 18px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          opacity: 0.5;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.2;
          }
        }

        .plan-title {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .plan-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .plan-content {
          margin-bottom: 24px;
        }

        .plan-section {
          margin-bottom: 20px;
        }

        .plan-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: #8b5cf6;
          margin-bottom: 8px;
        }

        .plan-value-large {
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .plan-value {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 18px;
          font-weight: 600;
          color: #374151;
        }

        .style-icon {
          font-size: 24px;
        }

        .slide-count-editor {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .count-option {
          padding: 12px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          font-size: 16px;
          font-weight: 700;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
        }

        .count-option:hover {
          border-color: #8b5cf6;
          transform: translateY(-2px);
        }

        .count-option.selected {
          border-color: #8b5cf6;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .style-selector {
          display: grid;
          gap: 8px;
        }

        .style-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .style-option:hover {
          border-color: #8b5cf6;
        }

        .style-option.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
        }

        .style-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .style-name {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .style-desc {
          font-size: 12px;
          color: #6b7280;
        }

        .reasoning-section {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: linear-gradient(135deg,
            rgba(99, 102, 241, 0.05) 0%,
            rgba(139, 92, 246, 0.05) 100%
          );
          border-radius: 12px;
          border: 1px solid rgba(139, 92, 246, 0.1);
          margin: 20px 0;
        }

        .reasoning-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .reasoning-label {
          font-size: 12px;
          font-weight: 600;
          color: #8b5cf6;
          margin-bottom: 6px;
        }

        .reasoning-text {
          font-size: 14px;
          line-height: 1.6;
          color: #4b5563;
          margin: 0;
        }

        .time-estimate {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #f3f4f6;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
        }

        .plan-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .plan-actions button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
        }

        .btn-icon {
          font-size: 18px;
        }

        .btn-approve {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .btn-approve:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .btn-modify {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }

        .btn-modify:hover {
          background: rgba(102, 126, 234, 0.05);
        }

        .btn-reject {
          background: transparent;
          color: #6b7280;
          padding: 10px;
          font-size: 13px;
        }

        .btn-reject:hover {
          color: #374151;
        }
      `}</style>
    </div>
  );
};

export default GenerationPlanProposal;
