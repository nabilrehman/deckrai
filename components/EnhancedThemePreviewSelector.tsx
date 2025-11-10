import React, { useState, useEffect } from 'react';
import { createSlideFromPrompt } from '../services/geminiService';
import { DesignerStyle, generateStylePromptModifier } from '../services/vibeDetection';

interface SlidePreview {
  src: string | null;
  isGenerating: boolean;
  error: boolean;
}

interface DesignerPreview {
  style: DesignerStyle;
  slides: SlidePreview[];
}

interface EnhancedThemePreviewSelectorProps {
  designerStyles: DesignerStyle[];
  samplePrompts: string[]; // 3 different slide prompts
  styleReference: string | null;
  onSelectDesigner: (designerStyleId: string, previewSlides: string[]) => void;
  onSkip: () => void;
  detectedVibe: string;
}

const EnhancedThemePreviewSelector: React.FC<EnhancedThemePreviewSelectorProps> = ({
  designerStyles,
  samplePrompts,
  styleReference,
  onSelectDesigner,
  onSkip,
  detectedVibe,
}) => {
  const [designerPreviews, setDesignerPreviews] = useState<DesignerPreview[]>([]);
  const [selectedDesignerId, setSelectedDesignerId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  // Initialize designer previews
  useEffect(() => {
    const initialPreviews: DesignerPreview[] = designerStyles.map(style => ({
      style,
      slides: samplePrompts.map(() => ({
        src: null,
        isGenerating: true,
        error: false,
      })),
    }));
    setDesignerPreviews(initialPreviews);
  }, [designerStyles, samplePrompts]);

  // Generate all preview slides IN PARALLEL
  useEffect(() => {
    const generateAllPreviews = async () => {
      // Create all generation tasks
      const allTasks: Promise<void>[] = [];

      for (let designerIdx = 0; designerIdx < designerStyles.length; designerIdx++) {
        const designer = designerStyles[designerIdx];
        const styleModifier = generateStylePromptModifier(designer);

        // Generate 3 slides for this designer IN PARALLEL
        for (let slideIdx = 0; slideIdx < samplePrompts.length; slideIdx++) {
          const prompt = samplePrompts[slideIdx];

          // Create task but don't await yet
          const task = (async () => {
            try {
              const finalPrompt = prompt + styleModifier;
              console.log(`[Preview Gen] Starting slide ${slideIdx + 1} for ${designer.name}`);
              console.log(`[Preview Gen] Prompt: ${finalPrompt.substring(0, 150)}...`);

              const { images } = await createSlideFromPrompt(
                styleReference,
                finalPrompt,
                false,
                [],
                undefined,
                null,
                null
              );

              console.log(`[Preview Gen] Got ${images?.length || 0} images for ${designer.name} slide ${slideIdx + 1}`);

              if (!images || images.length === 0) {
                console.error(`[Preview Gen] No images returned for ${designer.name} slide ${slideIdx + 1}`);
                throw new Error('No images returned from API');
              }

              // Update this specific slide
              setDesignerPreviews(prev =>
                prev.map((dp, dIdx) =>
                  dIdx === designerIdx
                    ? {
                        ...dp,
                        slides: dp.slides.map((slide, sIdx) =>
                          sIdx === slideIdx
                            ? { src: images[0], isGenerating: false, error: false }
                            : slide
                        ),
                      }
                    : dp
                )
              );

              console.log(`[Preview Gen] ✅ Successfully generated ${designer.name} slide ${slideIdx + 1}`);
            } catch (error) {
              console.error(`[Preview Gen] ❌ Failed to generate slide ${slideIdx + 1} for ${designer.name}:`, error);

              setDesignerPreviews(prev =>
                prev.map((dp, dIdx) =>
                  dIdx === designerIdx
                    ? {
                        ...dp,
                        slides: dp.slides.map((slide, sIdx) =>
                          sIdx === slideIdx
                            ? { src: null, isGenerating: false, error: true }
                            : slide
                        ),
                      }
                    : dp
                )
              );
            }
          })();

          allTasks.push(task);
        }
      }

      // Wait for ALL 9 slides to generate in parallel
      await Promise.all(allTasks);
      setIsGenerating(false);
    };

    if (designerPreviews.length > 0) {
      generateAllPreviews();
    }
  }, [designerStyles, samplePrompts, styleReference]);

  const handleSelectDesigner = () => {
    if (!selectedDesignerId) return;

    const selectedDesigner = designerPreviews.find(dp => dp.style.id === selectedDesignerId);
    if (!selectedDesigner) return;

    const previewSlides = selectedDesigner.slides
      .filter(s => s.src !== null)
      .map(s => s.src!);

    if (previewSlides.length > 0) {
      onSelectDesigner(selectedDesignerId, previewSlides);
    }
  };

  const allGenerated = designerPreviews.every(dp =>
    dp.slides.every(s => !s.isGenerating)
  );

  const anySuccessful = designerPreviews.some(dp =>
    dp.slides.some(s => s.src !== null)
  );

  return (
    <div className="theme-preview-overlay">
      <div className="theme-preview-card">
        {/* Header */}
        <div className="preview-header">
          <div className="header-content">
            <div className="vibe-badge">{detectedVibe} vibe detected</div>
            <h2 className="preview-title">Choose Your Designer Style</h2>
            <p className="preview-subtitle">
              Each designer creates 3 sample slides. Pick the style you love.
            </p>
          </div>
        </div>

        {/* Designer Previews */}
        <div className="designer-grid">
          {designerPreviews.map((designerPreview) => (
            <div
              key={designerPreview.style.id}
              className={`designer-card ${
                selectedDesignerId === designerPreview.style.id ? 'selected' : ''
              }`}
              onClick={() => {
                const hasAnySlide = designerPreview.slides.some(s => s.src !== null);
                if (hasAnySlide) {
                  setSelectedDesignerId(designerPreview.style.id);
                }
              }}
            >
              {/* Designer Header */}
              <div className="designer-header">
                <span className="designer-icon">{designerPreview.style.icon}</span>
                <div className="designer-info">
                  <h3 className="designer-name">{designerPreview.style.name}</h3>
                  <p className="designer-description">{designerPreview.style.description}</p>
                </div>
                {selectedDesignerId === designerPreview.style.id && (
                  <div className="selected-badge">
                    <svg xmlns="http://www.w3.org/2000/svg" className="check-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Slide Previews Grid */}
              <div className="slides-grid">
                {designerPreview.slides.map((slide, idx) => (
                  <div key={idx} className="slide-preview-container">
                    {slide.isGenerating ? (
                      <div className="slide-loading">
                        <div className="spinner"></div>
                        <p className="loading-text">Slide {idx + 1}</p>
                      </div>
                    ) : slide.error ? (
                      <div className="slide-error">
                        <p>Failed</p>
                      </div>
                    ) : slide.src ? (
                      <img src={slide.src} alt={`${designerPreview.style.name} slide ${idx + 1}`} className="slide-preview-image" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="preview-actions">
          {allGenerated && anySuccessful ? (
            <>
              <button
                className="btn-select-designer"
                onClick={handleSelectDesigner}
                disabled={!selectedDesignerId}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="btn-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {selectedDesignerId
                  ? `Generate Full Deck with ${designerPreviews.find(dp => dp.style.id === selectedDesignerId)?.style.name}`
                  : 'Select a designer style'}
              </button>
              <button className="btn-skip" onClick={onSkip}>
                Skip and use default style
              </button>
            </>
          ) : (
            <div className="generating-message">
              <div className="spinner"></div>
              <p>Generating designer previews... This takes ~2-3 minutes for 9 slides</p>
              <p className="progress-hint">You're seeing each designer create 3 unique slides</p>
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
          max-width: 1400px;
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

        .vibe-badge {
          display: inline-block;
          padding: 6px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
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

        .designer-grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-bottom: 32px;
        }

        .designer-card {
          border: 3px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.3s;
          background: white;
        }

        .designer-card:hover {
          border-color: #8b5cf6;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(139, 92, 246, 0.15);
        }

        .designer-card.selected {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.05);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.25);
        }

        .designer-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          position: relative;
        }

        .designer-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .designer-info {
          flex: 1;
        }

        .designer-name {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 4px 0;
        }

        .designer-description {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .selected-badge {
          width: 32px;
          height: 32px;
          background: #8b5cf6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .check-icon {
          width: 20px;
          height: 20px;
          color: white;
        }

        .slides-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .slide-preview-container {
          aspect-ratio: 16 / 9;
          border-radius: 8px;
          overflow: hidden;
          background: #f3f4f6;
          position: relative;
        }

        .slide-preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .slide-loading,
        .slide-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 8px;
        }

        .loading-text {
          font-size: 12px;
          color: #6b7280;
          margin: 0;
        }

        .slide-error p {
          font-size: 12px;
          color: #dc2626;
          margin: 0;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e5e7eb;
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

        .btn-select-designer {
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

        .btn-select-designer:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
        }

        .btn-select-designer:disabled {
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

        .generating-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 20px;
        }

        .generating-message p {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .progress-hint {
          font-size: 12px !important;
          color: #9ca3af !important;
        }

        @media (max-width: 768px) {
          .slides-grid {
            grid-template-columns: 1fr;
          }

          .preview-title {
            font-size: 24px;
          }

          .designer-name {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default EnhancedThemePreviewSelector;
