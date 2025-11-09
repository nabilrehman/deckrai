import React from 'react';

interface FloatingActionBubbleProps {
  isVisible: boolean;
  mode: 'initial' | 'incremental';
  onGenerateSlides: (count: number) => void;
  onChangeStyle: (style: 'visual' | 'data' | 'executive') => void;
  onRegenerate: () => void;
  onDismiss: () => void;
  currentSlideCount?: number;
}

const FloatingActionBubble: React.FC<FloatingActionBubbleProps> = ({
  isVisible,
  mode,
  onGenerateSlides,
  onChangeStyle,
  onRegenerate,
  onDismiss,
  currentSlideCount = 0
}) => {
  if (!isVisible) return null;

  return (
    <div className="floating-action-bubble">
      {mode === 'initial' ? (
        // Initial generation
        <div className="bubble-content">
          <div className="bubble-header">
            <span className="sparkle">✨</span>
            <span>Ready to generate your deck?</span>
          </div>

          <div className="bubble-actions">
            <button
              className="ai-bubble-btn small"
              onClick={() => onGenerateSlides(3)}
            >
              3
            </button>
            <button
              className="ai-bubble-btn small"
              onClick={() => onGenerateSlides(5)}
            >
              5
            </button>
            <button
              className="ai-bubble-btn small"
              onClick={() => onGenerateSlides(10)}
            >
              10
            </button>
            <button
              className="ai-bubble-btn large"
              onClick={() => onGenerateSlides(20)}
            >
              Full Deck
            </button>
          </div>
        </div>
      ) : (
        // Incremental generation
        <div className="bubble-content">
          <div className="bubble-header">
            <span className="sparkle">🎨</span>
            <span>Looking good! What's next?</span>
          </div>

          <div className="bubble-section">
            <div className="bubble-label">Add More:</div>
            <div className="bubble-actions">
              <button
                className="ai-bubble-btn small"
                onClick={() => onGenerateSlides(3)}
              >
                +3
              </button>
              <button
                className="ai-bubble-btn small"
                onClick={() => onGenerateSlides(5)}
              >
                +5
              </button>
              <button
                className="ai-bubble-btn small"
                onClick={() => onGenerateSlides(10)}
              >
                +10
              </button>
              <button
                className="ai-bubble-btn medium"
                onClick={() => onGenerateSlides(20)}
              >
                Full Deck
              </button>
            </div>
          </div>

          <div className="bubble-section">
            <div className="bubble-label">Change Style:</div>
            <div className="bubble-actions">
              <button
                className="ai-bubble-btn style"
                onClick={() => onChangeStyle('visual')}
              >
                Visual
              </button>
              <button
                className="ai-bubble-btn style"
                onClick={() => onChangeStyle('data')}
              >
                Data
              </button>
              <button
                className="ai-bubble-btn style"
                onClick={() => onRegenerate()}
              >
                Regenerate
              </button>
            </div>
          </div>

          <button className="bubble-dismiss" onClick={onDismiss}>
            Dismiss for now
          </button>
        </div>
      )}

      <style>{`
        .floating-action-bubble {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          animation: bubbleSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes bubbleSlideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        .bubble-content {
          background: linear-gradient(135deg,
            rgba(99, 102, 241, 0.1) 0%,
            rgba(139, 92, 246, 0.1) 50%,
            rgba(59, 130, 246, 0.1) 100%
          );
          backdrop-filter: blur(12px);
          border: 2px solid rgba(139, 92, 246, 0.3);
          border-radius: 20px;
          padding: 20px 24px;
          box-shadow:
            0 8px 32px rgba(99, 102, 241, 0.3),
            0 0 60px rgba(139, 92, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          min-width: 400px;
          animation: glow 3s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% {
            box-shadow:
              0 8px 32px rgba(99, 102, 241, 0.3),
              0 0 60px rgba(139, 92, 246, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow:
              0 8px 32px rgba(99, 102, 241, 0.5),
              0 0 80px rgba(139, 92, 246, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
        }

        .bubble-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          font-size: 15px;
          font-weight: 600;
          color: #6366f1;
        }

        .sparkle {
          font-size: 20px;
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.2) rotate(-10deg); }
          50% { transform: scale(1) rotate(0deg); }
          75% { transform: scale(1.2) rotate(10deg); }
        }

        .bubble-section {
          margin-bottom: 16px;
        }

        .bubble-section:last-of-type {
          margin-bottom: 12px;
        }

        .bubble-label {
          font-size: 12px;
          font-weight: 600;
          color: #8b5cf6;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .bubble-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .ai-bubble-btn {
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow:
            0 4px 12px rgba(99, 102, 241, 0.4),
            0 0 20px rgba(139, 92, 246, 0.3);
          position: relative;
          overflow: hidden;
        }

        .ai-bubble-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transition: left 0.5s;
        }

        .ai-bubble-btn:hover::before {
          left: 100%;
        }

        .ai-bubble-btn:hover {
          transform: translateY(-2px) scale(1.05);
          box-shadow:
            0 6px 20px rgba(99, 102, 241, 0.6),
            0 0 30px rgba(139, 92, 246, 0.5);
        }

        .ai-bubble-btn:active {
          transform: translateY(0) scale(0.98);
        }

        .ai-bubble-btn.small {
          padding: 10px 20px;
          font-size: 16px;
          min-width: 60px;
        }

        .ai-bubble-btn.medium {
          padding: 10px 24px;
          font-size: 15px;
        }

        .ai-bubble-btn.large {
          padding: 12px 28px;
          font-size: 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          box-shadow:
            0 6px 16px rgba(99, 102, 241, 0.5),
            0 0 40px rgba(139, 92, 246, 0.4);
        }

        .ai-bubble-btn.style {
          padding: 8px 18px;
          font-size: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .bubble-dismiss {
          width: 100%;
          padding: 8px;
          background: transparent;
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          color: #8b5cf6;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .bubble-dismiss:hover {
          background: rgba(139, 92, 246, 0.1);
          border-color: rgba(139, 92, 246, 0.5);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .bubble-content {
            min-width: 320px;
            padding: 16px 20px;
          }

          .ai-bubble-btn.small {
            min-width: 50px;
            padding: 8px 16px;
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingActionBubble;
