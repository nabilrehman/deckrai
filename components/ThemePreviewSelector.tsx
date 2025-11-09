import React, { useState, useEffect } from 'react';
import { createSlideFromPrompt } from '../services/geminiService';

interface ThemePreview {
  id: string;
  name: string;
  description: string;
  icon: string;
  previewSrc: string | null;
  isGenerating: boolean;
}

interface ThemePreviewSelectorProps {
  samplePrompt: string;
  styleReference: string | null;
  onSelectTheme: (themeId: string, previewSrc: string) => void;
  onSkip: () => void;
}

const ThemePreviewSelector: React.FC<ThemePreviewSelectorProps> = ({
  samplePrompt,
  styleReference,
  onSelectTheme,
  onSkip,
}) => {
  const [themes, setThemes] = useState<ThemePreview[]>([
    {
      id: 'executive',
      name: 'Executive',
      description: 'Clean, professional, minimal',
      icon: '📊',
      previewSrc: null,
      isGenerating: true,
    },
    {
      id: 'visual',
      name: 'Visual Story',
      description: 'Bold, image-driven, engaging',
      icon: '🎨',
      previewSrc: null,
      isGenerating: true,
    },
    {
      id: 'data',
      name: 'Data-Driven',
      description: 'Charts, analytics, detailed',
      icon: '📈',
      previewSrc: null,
      isGenerating: true,
    },
  ]);

  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);

  // Generate preview slides on mount
  useEffect(() => {
    const generatePreviews = async () => {
      for (let i = 0; i < themes.length; i++) {
        const theme = themes[i];

        try {
          // Create style-specific prompt
          const stylePrompt = `${samplePrompt}\n\nStyle: ${theme.name} - ${theme.description}`;

          // Generate preview slide
          const { images } = await createSlideFromPrompt(
            styleReference,
            stylePrompt,
            false,
            [],
            undefined,
            null,
            null
          );

          // Update this theme with preview
          setThemes(prev =>
            prev.map(t =>
              t.id === theme.id
                ? { ...t, previewSrc: images[0], isGenerating: false }
                : t
            )
          );
        } catch (error) {
          console.error(`Failed to generate ${theme.name} preview:`, error);
          setThemes(prev =>
            prev.map(t =>
              t.id === theme.id ? { ...t, isGenerating: false } : t
            )
          );
        }
      }
    };

    generatePreviews();
  }, [samplePrompt, styleReference]);

  const handleSelectTheme = () => {
    if (!selectedThemeId) return;
    const selectedTheme = themes.find(t => t.id === selectedThemeId);
    if (selectedTheme?.previewSrc) {
      onSelectTheme(selectedThemeId, selectedTheme.previewSrc);
    }
  };

  const allGenerated = themes.every(t => !t.isGenerating);
  const anySuccessful = themes.some(t => t.previewSrc !== null);

  return (
    <div className="theme-preview-overlay">
      <div className="theme-preview-card">
        {/* Header */}
        <div className="preview-header">
          <div className="header-content">
            <h2 className="preview-title">Choose Your Visual Style</h2>
            <p className="preview-subtitle">
              Pick the style you like best. We'll generate your full deck in this theme.
            </p>
          </div>
        </div>

        {/* Theme Previews Grid */}
        <div className="theme-grid">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`theme-card ${selectedThemeId === theme.id ? 'selected' : ''} ${
                theme.isGenerating ? 'generating' : ''
              }`}
              onClick={() => {
                if (theme.previewSrc) {
                  setSelectedThemeId(theme.id);
                }
              }}
            >
              {/* Theme Header */}
              <div className="theme-header">
                <span className="theme-icon">{theme.icon}</span>
                <div>
                  <h3 className="theme-name">{theme.name}</h3>
                  <p className="theme-description">{theme.description}</p>
                </div>
              </div>

              {/* Preview Image */}
              <div className="preview-container">
                {theme.isGenerating ? (
                  <div className="preview-loading">
                    <div className="spinner"></div>
                    <p>Generating preview...</p>
                  </div>
                ) : theme.previewSrc ? (
                  <>
                    <img src={theme.previewSrc} alt={theme.name} className="preview-image" />
                    <div className="preview-overlay">
                      <div className="preview-check">
                        {selectedThemeId === theme.id && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="preview-error">
                    <p>Failed to generate preview</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="preview-actions">
          {allGenerated && anySuccessful ? (
            <>
              <button
                className="btn-select-theme"
                onClick={handleSelectTheme}
                disabled={!selectedThemeId}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {selectedThemeId ? `Generate with ${themes.find(t => t.id === selectedThemeId)?.name}` : 'Select a theme'}
              </button>
              <button className="btn-skip" onClick={onSkip}>
                Skip and use default style
              </button>
            </>
          ) : (
            <div className="generating-message">
              <div className="spinner"></div>
              <p>Generating theme previews...</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .theme-preview-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease-out;
          padding: 20px;
          overflow-y: auto;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .theme-preview-card {
          background: white;
          border-radius: 24px;
          padding: 32px;
          max-width: 1200px;
          width: 100%;
          animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          max-height: 90vh;
          overflow-y: auto;
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

        .preview-header {
          text-align: center;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 2px solid #e5e7eb;
        }

        .preview-title {
          font-size: 32px;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 8px;
        }

        .preview-subtitle {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }

        .theme-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .theme-card {
          border: 3px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s;
          background: white;
        }

        .theme-card:hover:not(.generating) {
          border-color: #8b5cf6;
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(139, 92, 246, 0.2);
        }

        .theme-card.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
        }

        .theme-card.generating {
          cursor: not-allowed;
          opacity: 0.7;
        }

        .theme-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .theme-icon {
          font-size: 32px;
        }

        .theme-name {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
        }

        .theme-description {
          font-size: 13px;
          color: #6b7280;
          margin: 4px 0 0 0;
        }

        .preview-container {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 12px;
          overflow: hidden;
          background: #f3f4f6;
        }

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .theme-card.selected .preview-overlay {
          opacity: 1;
        }

        .preview-check {
          width: 64px;
          height: 64px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .check-icon {
          width: 48px;
          height: 48px;
          color: #8b5cf6;
        }

        .preview-loading,
        .preview-error,
        .generating-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 12px;
        }

        .preview-loading p,
        .preview-error p,
        .generating-message p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e5e7eb;
          border-top-color: #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .preview-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-select-theme {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .btn-select-theme:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .btn-select-theme:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-icon {
          width: 20px;
          height: 20px;
        }

        .btn-skip {
          padding: 12px;
          background: transparent;
          color: #6b7280;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-skip:hover {
          color: #374151;
        }

        @media (max-width: 768px) {
          .theme-grid {
            grid-template-columns: 1fr;
          }

          .preview-title {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default ThemePreviewSelector;
