import React, { useState } from 'react';

interface QuickSetupBubbleProps {
  isVisible: boolean;
  onGenerate: (config: GenerationConfig) => void;
  onDismiss: () => void;
}

export interface GenerationConfig {
  audience: string;
  slideCount: number;
  style: string;
}

const QuickSetupBubble: React.FC<QuickSetupBubbleProps> = ({
  isVisible,
  onGenerate,
  onDismiss
}) => {
  const [selectedAudience, setSelectedAudience] = useState<string>('');
  const [slideCount, setSlideCount] = useState<number>(5);
  const [selectedStyle, setSelectedStyle] = useState<string>('auto');

  if (!isVisible) return null;

  const audiences = [
    { id: 'internal_team', name: 'Team', icon: '👥' },
    { id: 'executives', name: 'Executives', icon: '👔' },
    { id: 'customers', name: 'Customers', icon: '🎯' },
    { id: 'sales_prospects', name: 'Sales', icon: '💼' },
    { id: 'investors', name: 'Investors', icon: '💰' },
    { id: 'conference_audience', name: 'Conference', icon: '🎤' },
    { id: 'educational', name: 'Training', icon: '📚' },
    { id: 'partners', name: 'Partners', icon: '🤝' }
  ];

  const slideCounts = [3, 5, 7, 10, 15, 20];

  const styles = [
    { id: 'auto', name: 'Auto (AI Decides)', icon: '✨' },
    { id: 'visual', name: 'Visual Story', icon: '🎨' },
    { id: 'executive', name: 'Executive Brief', icon: '📊' },
    { id: 'data', name: 'Data-Driven', icon: '📈' },
    { id: 'technical', name: 'Technical', icon: '⚙️' }
  ];

  const handleGenerate = () => {
    onGenerate({
      audience: selectedAudience,
      slideCount,
      style: selectedStyle
    });
  };

  return (
    <div className="quick-setup-bubble">
      <div className="bubble-content">
        <div className="bubble-header">
          <span className="sparkle">✨</span>
          <span>Quick Setup</span>
        </div>

        {/* Step 1: Audience */}
        <div className="setup-section">
          <label className="setup-label">Who's your audience?</label>
          <div className="option-grid">
            {audiences.map(aud => (
              <button
                key={aud.id}
                className={`option-btn ${selectedAudience === aud.id ? 'selected' : ''}`}
                onClick={() => setSelectedAudience(aud.id)}
              >
                <span className="option-icon">{aud.icon}</span>
                <span className="option-name">{aud.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Slide Count */}
        <div className="setup-section">
          <label className="setup-label">How many slides?</label>
          <div className="slide-count-selector">
            {slideCounts.map(count => (
              <button
                key={count}
                className={`count-btn ${slideCount === count ? 'selected' : ''}`}
                onClick={() => setSlideCount(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Style (Optional) */}
        <div className="setup-section">
          <label className="setup-label">
            Style <span className="optional">(optional)</span>
          </label>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="style-select"
          >
            {styles.map(style => (
              <option key={style.id} value={style.id}>
                {style.icon} {style.name}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="bubble-actions">
          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={!selectedAudience}
          >
            Generate {slideCount} Slides →
          </button>
          <button className="dismiss-btn" onClick={onDismiss}>
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        .quick-setup-bubble {
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
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .bubble-content {
          background: linear-gradient(135deg,
            rgba(99, 102, 241, 0.95) 0%,
            rgba(139, 92, 246, 0.95) 50%,
            rgba(59, 130, 246, 0.95) 100%
          );
          backdrop-filter: blur(12px);
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 20px;
          padding: 24px;
          box-shadow:
            0 8px 32px rgba(99, 102, 241, 0.5),
            0 0 60px rgba(139, 92, 246, 0.4);
          min-width: 500px;
          animation: glow 3s ease-in-out infinite;
        }

        @keyframes glow {
          0%, 100% {
            box-shadow:
              0 8px 32px rgba(99, 102, 241, 0.5),
              0 0 60px rgba(139, 92, 246, 0.4);
          }
          50% {
            box-shadow:
              0 8px 32px rgba(99, 102, 241, 0.7),
              0 0 100px rgba(139, 92, 246, 0.6);
          }
        }

        .bubble-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
          font-size: 16px;
          font-weight: 700;
          color: white;
        }

        .sparkle {
          font-size: 24px;
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .setup-section {
          margin-bottom: 20px;
        }

        .setup-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: white;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .optional {
          font-size: 11px;
          opacity: 0.7;
          font-weight: 400;
          text-transform: lowercase;
        }

        .option-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .option-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 8px;
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid transparent;
          border-radius: 12px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .option-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .option-btn.selected {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.6);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }

        .option-icon {
          font-size: 20px;
        }

        .option-name {
          text-align: center;
        }

        .slide-count-selector {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .count-btn {
          padding: 10px 18px;
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid transparent;
          border-radius: 10px;
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .count-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }

        .count-btn.selected {
          background: rgba(255, 255, 255, 0.3);
          border-color: rgba(255, 255, 255, 0.6);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }

        .style-select {
          width: 100%;
          padding: 12px;
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 10px;
          color: white;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .style-select:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .style-select option {
          background: #667eea;
          color: white;
        }

        .bubble-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 20px;
        }

        .generate-btn {
          padding: 14px 24px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.2) 100%);
          border: 2px solid rgba(255, 255, 255, 0.5);
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .generate-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.3) 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .generate-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .dismiss-btn {
          padding: 10px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          color: white;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dismiss-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        @media (max-width: 640px) {
          .bubble-content {
            min-width: 340px;
          }

          .option-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default QuickSetupBubble;
