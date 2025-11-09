import React, { useState, useCallback } from 'react';
import { Slide, StyleLibraryItem } from '../types';
import GenerationPlanProposal, { GenerationPlan } from './GenerationPlanProposal';
import FloatingActionBubble from './FloatingActionBubble';
import { analyzeNotesAndAskQuestions, generateSlidesWithContext, GenerationContext } from '../services/intelligentGeneration';
import { createSlideFromPrompt } from '../services/geminiService';

interface SmartDeckGeneratorProps {
  onDeckUpload: (slides: Slide[]) => void;
  styleLibrary: StyleLibraryItem[];
  isTestMode: boolean;
}

const launderImageSrc = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.crossOrigin = 'Anonymous';
    img.src = src;
  });
};

const Spinner: React.FC<{ text?: string; size?: string }> = ({ text, size = 'h-8 w-8' }) => (
  <div className="flex flex-col items-center justify-center">
    <svg
      className={`animate-spin text-brand-primary ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
    {text && <p className="mt-4 text-lg text-brand-text-secondary">{text}</p>}
  </div>
);

const SmartDeckGenerator: React.FC<SmartDeckGeneratorProps> = ({
  onDeckUpload,
  styleLibrary,
  isTestMode,
}) => {
  // Core state
  const [rawNotes, setRawNotes] = useState('');
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [uploadedStyleReference, setUploadedStyleReference] = useState<{ src: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Planning Agent state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generationPlan, setGenerationPlan] = useState<GenerationPlan | null>(null);
  const [showPlanProposal, setShowPlanProposal] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [generatedSlides, setGeneratedSlides] = useState<Slide[]>([]);
  const [currentContext, setCurrentContext] = useState<GenerationContext | null>(null);

  // Bubble state
  const [showActionBubble, setShowActionBubble] = useState(false);

  const styleUploadInputRef = React.useRef<HTMLInputElement>(null);

  /**
   * Step 1: Analyze notes and create generation plan
   */
  const handleSmartGenerate = useCallback(async () => {
    if (!rawNotes.trim()) {
      setError('Please paste your notes or content first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // AI analyzes notes and provides recommendations
      const analysis = await analyzeNotesAndAskQuestions(rawNotes);

      // Extract audience from questions (if answered by AI)
      let inferredAudience = 'General professional audience';
      if (analysis.questions && analysis.questions.length > 0) {
        const audienceQuestion = analysis.questions.find(q =>
          q.question.toLowerCase().includes('audience')
        );
        if (audienceQuestion && audienceQuestion.options.length > 0) {
          // For now, use first option as default (in full implementation, we'd ask user)
          inferredAudience = audienceQuestion.options[0];
        }
      }

      // Calculate estimated time
      const slideCount = analysis.suggestions.recommendedSlideCount;
      const estimatedMinutes = Math.ceil(slideCount * 0.5); // ~30 seconds per slide
      const estimatedTime = `${estimatedMinutes}-${estimatedMinutes + 2} minutes`;

      // Create generation plan
      const plan: GenerationPlan = {
        slideCount: analysis.suggestions.recommendedSlideCount,
        style: analysis.suggestions.recommendedStyle as any,
        audience: inferredAudience,
        reasoning: analysis.suggestions.reasoning,
        estimatedTime,
      };

      setGenerationPlan(plan);
      setShowPlanProposal(true);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'Failed to analyze notes. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [rawNotes]);

  /**
   * Step 2: User approves plan - start generation
   */
  const handleApprovePlan = useCallback(async () => {
    if (!generationPlan) return;

    setShowPlanProposal(false);
    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);
    setProgressText('Preparing to generate slides...');

    const context: GenerationContext = {
      notes: rawNotes,
      audience: generationPlan.audience,
      slideCount: generationPlan.slideCount,
      style: generationPlan.style,
    };

    setCurrentContext(context);

    try {
      // Generate slide descriptions with full context
      setProgressText('AI is analyzing your content...');
      const slideDescriptions = await generateSlidesWithContext(context);

      // Limit slides in test mode
      let slidesToGenerate = slideDescriptions;
      if (isTestMode && slidesToGenerate.length > 5) {
        slidesToGenerate = slidesToGenerate.slice(0, 5);
      }

      // Get style reference
      let referenceSrc: string | null = null;
      if (uploadedStyleReference) {
        referenceSrc = uploadedStyleReference.src;
      } else if (selectedStyleId) {
        const selectedItem = styleLibrary.find((item) => item.id === selectedStyleId);
        if (selectedItem) {
          referenceSrc = selectedItem.src;
        }
      }

      // Generate slides in batches
      const BATCH_SIZE = 3;
      const allSlides: Slide[] = [];
      let completedCount = 0;
      const totalSlides = slidesToGenerate.length;

      for (let i = 0; i < totalSlides; i += BATCH_SIZE) {
        const batchDescriptions = slidesToGenerate.slice(i, i + BATCH_SIZE);

        const batchPromises = batchDescriptions.map(async (description, indexInBatch) => {
          const slideNumber = i + indexInBatch + 1;

          setProgressText(`Creating slide ${slideNumber} of ${totalSlides}...`);

          const { images } = await createSlideFromPrompt(
            referenceSrc,
            description,
            false,
            [],
            undefined,
            null,
            null
          );

          const finalImage = await launderImageSrc(images[0]);

          completedCount++;
          setGenerationProgress(Math.round((completedCount / totalSlides) * 100));

          return {
            id: `slide-${Date.now()}-${slideNumber}`,
            originalSrc: finalImage,
            history: [finalImage],
            name: description.substring(0, 40).split('\n')[0] || `Slide ${slideNumber}`,
          };
        });

        const batchResults = await Promise.all(batchPromises);
        allSlides.push(...batchResults);
      }

      setGeneratedSlides(allSlides);
      onDeckUpload(allSlides);

      // Show action bubble for incremental generation
      setShowActionBubble(true);
      setProgressText('');
    } catch (err: any) {
      console.error('Generation failed:', err);
      setError(err.message || 'Failed to generate slides. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [generationPlan, rawNotes, styleLibrary, selectedStyleId, uploadedStyleReference, isTestMode, onDeckUpload]);

  /**
   * Step 3: User modifies plan
   */
  const handleModifyPlan = useCallback((modifiedPlan: Partial<GenerationPlan>) => {
    if (!generationPlan) return;

    setGenerationPlan({
      ...generationPlan,
      ...modifiedPlan,
    });
  }, [generationPlan]);

  /**
   * Step 4: User rejects plan - start over
   */
  const handleRejectPlan = useCallback(() => {
    setShowPlanProposal(false);
    setGenerationPlan(null);
  }, []);

  /**
   * Incremental generation from action bubble
   */
  const handleGenerateMoreSlides = useCallback(async (additionalCount: number) => {
    if (!currentContext) return;

    setShowActionBubble(false);
    setIsGenerating(true);
    setError(null);

    const newSlideCount = generatedSlides.length + additionalCount;
    const updatedContext: GenerationContext = {
      ...currentContext,
      slideCount: newSlideCount,
    };

    try {
      setProgressText('Generating additional slides...');
      const slideDescriptions = await generateSlidesWithContext(updatedContext);

      // Only generate NEW slides
      const newDescriptions = slideDescriptions.slice(generatedSlides.length);

      // Get style reference
      let referenceSrc: string | null = null;
      if (uploadedStyleReference) {
        referenceSrc = uploadedStyleReference.src;
      } else if (selectedStyleId) {
        const selectedItem = styleLibrary.find((item) => item.id === selectedStyleId);
        if (selectedItem) {
          referenceSrc = selectedItem.src;
        }
      }

      const newSlides: Slide[] = [];
      for (let i = 0; i < newDescriptions.length; i++) {
        const slideNumber = generatedSlides.length + i + 1;
        setProgressText(`Creating slide ${slideNumber}...`);

        const { images } = await createSlideFromPrompt(
          referenceSrc,
          newDescriptions[i],
          false,
          [],
          undefined,
          null,
          null
        );

        const finalImage = await launderImageSrc(images[0]);

        newSlides.push({
          id: `slide-${Date.now()}-${slideNumber}`,
          originalSrc: finalImage,
          history: [finalImage],
          name: newDescriptions[i].substring(0, 40).split('\n')[0] || `Slide ${slideNumber}`,
        });
      }

      const allSlides = [...generatedSlides, ...newSlides];
      setGeneratedSlides(allSlides);
      onDeckUpload(allSlides);

      setShowActionBubble(true);
      setProgressText('');
    } catch (err: any) {
      console.error('Incremental generation failed:', err);
      setError(err.message || 'Failed to generate additional slides.');
    } finally {
      setIsGenerating(false);
    }
  }, [currentContext, generatedSlides, styleLibrary, selectedStyleId, uploadedStyleReference, onDeckUpload]);

  const handleChangeStyle = useCallback(async (newStyle: 'visual' | 'data' | 'executive') => {
    if (!currentContext) return;

    setShowActionBubble(false);
    // Regenerate with new style
    const updatedContext: GenerationContext = {
      ...currentContext,
      style: newStyle,
    };

    setCurrentContext(updatedContext);
    // For now, just update context. Full regeneration would be triggered separately
    setShowActionBubble(true);
  }, [currentContext]);

  const handleStyleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setError(null);

    try {
      let styleSrc: string | null = null;

      if (file.type.startsWith('image/')) {
        styleSrc = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
      }

      if (styleSrc) {
        setUploadedStyleReference({ src: styleSrc, name: file.name });
        setSelectedStyleId(null);
      } else {
        throw new Error('Unsupported file type. Please use an image file.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Style selection UI
  const styleSelectionUI = (
    <div className="mt-4 pt-4 border-t border-brand-border/30">
      <h4 className="font-display text-sm font-semibold text-brand-text-primary mb-3 text-center flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
        </svg>
        Choose a Style Reference <span className="text-brand-text-tertiary font-normal">(Optional)</span>
      </h4>

      {styleLibrary.length > 0 && (
        <div className="grid grid-cols-5 gap-3 max-h-36 overflow-y-auto pr-2 mb-4">
          {styleLibrary.map((item) => (
            <div
              key={item.id}
              className={`group cursor-pointer aspect-video rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                selectedStyleId === item.id && !uploadedStyleReference
                  ? 'border-brand-primary-500 ring-2 ring-brand-primary-500 ring-offset-2 shadow-premium'
                  : 'border-brand-border hover:border-brand-primary-300 hover:shadow-card'
              }`}
              onClick={() => {
                setSelectedStyleId(selectedStyleId === item.id ? null : item.id);
                setUploadedStyleReference(null);
              }}
              title={`Use style: ${item.name}`}
            >
              <img
                src={item.src}
                alt={item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      )}

      <div className="relative flex items-center justify-center my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-brand-border/30" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium text-brand-text-tertiary">
            {styleLibrary.length > 0 ? 'Or upload custom' : 'Upload custom style'}
          </span>
        </div>
      </div>

      {uploadedStyleReference ? (
        <div className="text-center">
          <p className="text-xs text-brand-text-secondary mb-3 font-medium">Using uploaded style reference</p>
          <div className="inline-block relative group">
            <div className="aspect-video w-36 rounded-xl overflow-hidden border-2 border-brand-primary-500 ring-2 ring-brand-primary-500 ring-offset-2 shadow-premium">
              <img src={uploadedStyleReference.src} alt={uploadedStyleReference.name} className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => setUploadedStyleReference(null)}
              className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1.5 shadow-md hover:bg-red-500 hover:text-white transition-all hover:scale-110 border-2 border-white"
              title="Remove uploaded style"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => styleUploadInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-brand-primary-500 bg-brand-primary-50 rounded-xl hover:bg-brand-primary-100 border-2 border-dashed border-brand-primary-300 hover:border-brand-primary-500 transition-all group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          Upload a Reference File
        </button>
      )}
      <input ref={styleUploadInputRef} type="file" className="sr-only" accept="image/*" onChange={handleStyleFileChange} />
    </div>
  );

  // Loading state during generation
  if (isGenerating) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-12 animate-fade-in">
        <div className="mb-8">
          <Spinner text={progressText || 'Generating your deck...'} size="h-12 w-12" />
        </div>
        <div className="w-full max-w-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-brand-text-primary">Progress</span>
            <span className="text-sm font-bold gradient-text">{generationProgress}%</span>
          </div>
          <div className="w-full bg-brand-border rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-brand-primary-500 via-brand-accent-500 to-brand-primary-500 transition-all duration-500 animate-shimmer"
              style={{ width: `${generationProgress}%`, backgroundSize: '200% 100%' }}
            ></div>
          </div>
        </div>
        {error && (
          <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm max-w-md">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-start p-6 md:p-12 pb-32 animate-fade-in">
      {/* Generation Plan Proposal Overlay */}
      {showPlanProposal && generationPlan && (
        <GenerationPlanProposal
          plan={generationPlan}
          onApprove={handleApprovePlan}
          onModify={handleModifyPlan}
          onReject={handleRejectPlan}
        />
      )}

      {/* Floating Action Bubble */}
      {showActionBubble && !isGenerating && (
        <FloatingActionBubble
          isVisible={showActionBubble}
          mode={generatedSlides.length === 0 ? 'initial' : 'incremental'}
          onGenerateSlides={handleGenerateMoreSlides}
          onChangeStyle={handleChangeStyle}
          onRegenerate={() => {
            setGeneratedSlides([]);
            setShowActionBubble(false);
          }}
          onDismiss={() => setShowActionBubble(false)}
          currentSlideCount={generatedSlides.length}
        />
      )}

      <div className="text-center w-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text mb-3">Smart Deck Generator</h1>
          <p className="text-brand-text-secondary text-lg font-light">
            AI analyzes your notes and creates the perfect presentation plan
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-card-lg border border-brand-border/50 flex flex-col animate-scale-in">
          <div className="flex flex-col">
            <div className="mb-4 text-center">
              <h3 className="font-display font-semibold text-lg text-brand-text-primary mb-2">Share Your Ideas</h3>
              <p className="text-brand-text-secondary text-sm">
                Paste your content and AI will analyze it, propose a plan, and generate slides intelligently.
              </p>
            </div>
            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Paste your raw notes, meeting transcripts, or any content here..."
              className="input-premium w-full p-5 text-sm bg-brand-surface rounded-2xl resize-none text-brand-text-primary placeholder-brand-text-tertiary h-[200px] font-light leading-relaxed overflow-y-auto"
            />
            {styleSelectionUI}
            <div className="pt-6">
              <button
                onClick={handleSmartGenerate}
                disabled={!rawNotes || isAnalyzing}
                className="btn btn-primary w-full text-base py-4 shadow-btn hover:shadow-btn-hover"
              >
                {isAnalyzing ? (
                  <Spinner size="h-5 w-5" />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                    Smart Generate with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm animate-slide-down">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartDeckGenerator;
