
import React, { useState, useCallback, useEffect } from 'react';
import { Slide, DeckAiExecutionPlan, StyleLibraryItem, DebugSession, LastSuccessfulEditContext } from '../types';
import SlidePreviewList from './SlidePreviewList';
import ActiveSlideView from './SlideEditor';
import { generateDeckExecutionPlan, executeSlideTask, createSlideFromPrompt, remakeSlideWithStyleReference, getGenerativeVariations } from '../services/geminiService';
import DeckAiPlanModal from './DeckAiPlanModal';
import VariantSelector from './VariantSelector';

interface EditorProps {
  slides: Slide[];
  activeSlide: Slide;
  onSlideSelect: (id: string) => void;
  onNewSlideVersion: (id: string, newSrc: string) => void;
  onUndo: (id: string) => void;
  onResetSlide: (id: string) => void;
  onSetPendingPersonalization: (slideId: string, pendingData: Slide['pendingPersonalization']) => void;
  onConfirmPersonalization: (slideId: string, newSrc: string) => void;
  onDiscardPendingPersonalization: (slideId: string) => void;
  onAddNewSlide: (args: { newSlide: Slide, insertAfterSlideId: string }) => void;
  onDeleteSlide: (slideId: string) => void;
  styleLibrary: StyleLibraryItem[];
  onToggleStyleLibrary: (slide: Slide) => void;
  onAddSessionToHistory: (session: DebugSession) => void;
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
                return reject(new Error('Failed to get canvas context for image processing.'));
            }
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            reject(new Error('Failed to load the selected image for processing.'));
        };
        img.crossOrigin = 'Anonymous';
        img.src = src;
    });
};


const Editor: React.FC<EditorProps> = ({ 
    slides, 
    activeSlide, 
    onSlideSelect, 
    onNewSlideVersion, 
    onUndo, 
    onResetSlide,
    onSetPendingPersonalization,
    onConfirmPersonalization,
    onDiscardPendingPersonalization,
    onAddNewSlide,
    onDeleteSlide,
    styleLibrary,
    onToggleStyleLibrary,
    onAddSessionToHistory,
}) => {
  const [deckAiPrompt, setDeckAiPrompt] = useState('');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isExecutingPlan, setIsExecutingPlan] = useState(false);
  const [executionPlan, setExecutionPlan] = useState<DeckAiExecutionPlan | null>(null);
  const [personalizingSlideIds, setPersonalizingSlideIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [slideUnderReview, setSlideUnderReview] = useState<Slide | null>(null);
  const [isDeckDebugMode, setIsDeckDebugMode] = useState(false);
  const [isDeckDeepMode, setIsDeckDeepMode] = useState(false);
  const [newSlideState, setNewSlideState] = useState<{ insertAfterSlideId: string } | null>(null);
  const [lastSuccessfulEdit, setLastSuccessfulEdit] = useState<LastSuccessfulEditContext | null>(null);

  useEffect(() => {
    if (lastSuccessfulEdit) {
        setLastSuccessfulEdit(null);
    }
  }, [activeSlide.id]);

  const handleCreateAiPlan = useCallback(async () => {
    if (!deckAiPrompt.trim() || slides.length === 0) return;
    setIsCreatingPlan(true);
    setError(null);
    try {
        const slidesInfo = slides.map(s => ({ id: s.id, name: s.name }));
        const plan = await generateDeckExecutionPlan(deckAiPrompt, slidesInfo);

        let isPlanValid = true;
        if (!plan || !plan.tasks || !Array.isArray(plan.tasks)) {
            isPlanValid = false;
        } else {
            for (const task of plan.tasks) {
                const isEditTask = task.type === 'EDIT_SLIDE';
                const isAddTask = task.type === 'ADD_SLIDE';
                if (!isEditTask && !isAddTask) { isPlanValid = false; break; }
                if (isEditTask && (!task.slideId || typeof task.slideId !== 'string')) { isPlanValid = false; break; }
                if (isAddTask && (!task.insertAfterSlideId || typeof task.insertAfterSlideId !== 'string')) { isPlanValid = false; break; }
            }
        }

        if (!isPlanValid) {
            console.error("Malformed AI Plan Received:", JSON.stringify(plan, null, 2));
            setError("The AI created an invalid execution plan. Please try rephrasing your request to be more specific about which slides to change.");
            setExecutionPlan(null);
        } else if (plan.tasks.length === 0) {
            setError("The AI couldn't find any actionable tasks for your request. Please try being more specific.");
            setExecutionPlan(null);
        } else {
            setExecutionPlan(plan);
        }
    } catch (err: any) {
        setError(err.message || "An unknown error occurred while creating the AI plan.");
    } finally {
        setIsCreatingPlan(false);
    }
  }, [deckAiPrompt, slides]);

  const handleExecutePlan = useCallback(async () => {
    if (!executionPlan) return;

    setIsExecutingPlan(true);
    const taskSlideIds = executionPlan.tasks.map(t => t.type === 'EDIT_SLIDE' ? t.slideId : t.insertAfterSlideId);
    setPersonalizingSlideIds(taskSlideIds);
    setExecutionPlan(null); 
    
    const executionPromises = executionPlan.tasks.map(async (task) => {
        const slideIdForIndicator = task.type === 'EDIT_SLIDE' ? task.slideId : task.insertAfterSlideId;
        try {
            if (task.type === 'EDIT_SLIDE') {
                const slide = slides.find(s => s.id === task.slideId);
                if (!slide) throw new Error(`Slide with ID ${task.slideId} not found.`);
                
                const currentSrc = slide.history[slide.history.length - 1];
                const { images, prompts } = await executeSlideTask(currentSrc, task.detailed_prompt, isDeckDeepMode);
                
                if (images.length > 0) {
                    const launderedVariations = await Promise.all(images.map(v => launderImageSrc(v)));
                    onSetPendingPersonalization(task.slideId, {
                        taskPrompt: task.detailed_prompt,
                        variations: launderedVariations,
                        variationPrompts: prompts,
                    });
                }
            } else if (task.type === 'ADD_SLIDE') {
                const referenceSlide = slides[0];
                if (!referenceSlide) throw new Error("Cannot add a new slide to an empty deck.");
                const referenceSrc = referenceSlide.history[referenceSlide.history.length - 1];

                const { images, prompts } = await createSlideFromPrompt(referenceSrc, task.detailed_prompt, isDeckDeepMode, []);
                if (images.length > 0) {
                     const launderedVariations = await Promise.all(images.map(v => launderImageSrc(v)));
                     const newSlide: Slide = {
                        id: `new-slide-${Date.now()}`,
                        name: task.newSlideName,
                        originalSrc: launderedVariations[0],
                        history: [launderedVariations[0]],
                        pendingPersonalization: {
                          taskPrompt: task.detailed_prompt,
                          variations: launderedVariations,
                          variationPrompts: prompts,
                        },
                      };
                      onAddNewSlide({ newSlide, insertAfterSlideId: task.insertAfterSlideId });
                }
            }
        } catch (err: any) {
            console.error(`Failed to execute task for "${task.type === 'EDIT_SLIDE' ? task.slideName : task.newSlideName}":\n`, err);
            setError(`Task failed for "${task.type === 'EDIT_SLIDE' ? task.slideName : task.newSlideName}": ${err.message}`);
            setPersonalizingSlideIds(prev => prev.filter(id => id !== slideIdForIndicator));
        }
    });

    await Promise.all(executionPromises);
    setIsExecutingPlan(false);
    setPersonalizingSlideIds([]);
  }, [executionPlan, slides, onSetPendingPersonalization, onAddNewSlide, isDeckDeepMode]);


  const handleApplyToAll = useCallback(async () => {
    if (!lastSuccessfulEdit) return;

    const context = { ...lastSuccessfulEdit };
    setLastSuccessfulEdit(null); 

    const otherSlides = slides.filter(s => s.id !== activeSlide.id);
    if (otherSlides.length === 0) return;

    setPersonalizingSlideIds(otherSlides.map(s => s.id));
    setError(null);

    const applyPromises = otherSlides.map(async (slide) => {
        try {
            const currentSrc = slide.history[slide.history.length - 1];
            let resultImages: string[] = [];

            switch (context.workflow) {
                case 'Remake':
                     if (context.styleReference) {
                        const { images } = await remakeSlideWithStyleReference(context.userIntentPrompt, currentSrc, [context.styleReference], context.deepMode, () => {});
                        resultImages = images;
                    } else {
                         const { images } = await getGenerativeVariations(context.model, context.userIntentPrompt, currentSrc, context.deepMode, () => {});
                         resultImages = images;
                    }
                    break;
                case 'Generate':
                case 'Personalize':
                case 'Inpaint':
                default:
                    const { images } = await getGenerativeVariations(context.model, context.userIntentPrompt, currentSrc, context.deepMode, () => {});
                    resultImages = images;
                    break;
            }

            if (resultImages.length > 0) {
                const cleanSrc = await launderImageSrc(resultImages[0]);
                onNewSlideVersion(slide.id, cleanSrc);
            }
        } catch (err: any) {
            console.error(`Failed to apply edit to slide "${slide.name}":`, err);
        } finally {
            setPersonalizingSlideIds(prev => prev.filter(id => id !== slide.id));
        }
    });

    await Promise.all(applyPromises);
  }, [lastSuccessfulEdit, slides, activeSlide.id, onNewSlideVersion]);


  const handleStartAddSlide = (insertAfterSlideId: string) => {
    setNewSlideState({ insertAfterSlideId });
  };

  const handleCancelAddSlide = () => {
    setNewSlideState(null);
  }

  const handleVariantSelected = async (variantSrc: string, variantIndex: number) => {
    if (!slideUnderReview) return;
    
    if (slideUnderReview.pendingPersonalization) {
        const lastEdit: LastSuccessfulEditContext = {
            workflow: 'Remake', 
            userIntentPrompt: slideUnderReview.pendingPersonalization.taskPrompt,
            model: 'gemini-2.5-flash-image',
            deepMode: isDeckDeepMode,
        };
    }
    
    const cleanSrc = await launderImageSrc(variantSrc);
    onConfirmPersonalization(slideUnderReview.id, cleanSrc);
    setSlideUnderReview(null);
  }

  const handleRegenerate = async () => {
    if (!slideUnderReview || !slideUnderReview.pendingPersonalization) return;
    const slideId = slideUnderReview.id;
    const taskPrompt = slideUnderReview.pendingPersonalization.taskPrompt;
    setSlideUnderReview(null); 
    setPersonalizingSlideIds(prev => [...prev, slideId]);

    try {
        const currentSrc = slides.find(s => s.id === slideId)!.history[0]; 
        const { images, prompts } = await executeSlideTask(currentSrc, taskPrompt, isDeckDeepMode);
        if (images.length > 0) {
            const launderedVariations = await Promise.all(images.map(v => launderImageSrc(v)));
            onSetPendingPersonalization(slideId, {
                taskPrompt: taskPrompt,
                variations: launderedVariations,
                variationPrompts: prompts,
            });
        }
    } catch (err: any) {
        setError(`Failed to regenerate slide "${slideUnderReview.name}": ${err.message}`);
    } finally {
        setPersonalizingSlideIds(prev => prev.filter(id => id !== slideId));
    }
  }
  
  const handleActiveSlideClick = (slideId: string) => {
    if (newSlideState) {
        setNewSlideState(null);
    }

    const slide = slides.find(s => s.id === slideId);
    if (slide && slide.pendingPersonalization && slide.pendingPersonalization.variations.length > 0) {
        setSlideUnderReview(slide);
    } else if (slide) {
        onSlideSelect(slide.id);
    }
  };


  return (
    <>
      <SlidePreviewList
        slides={slides}
        activeSlideId={activeSlide.id}
        onSlideSelect={handleActiveSlideClick}
        personalizingSlideIds={personalizingSlideIds}
        onAddSlideAfter={handleStartAddSlide}
        onDeleteSlide={onDeleteSlide}
      />
      <div className="flex-grow flex flex-col min-w-0 bg-brand-background">
        {/* Deck-level AI customization - Hidden for clean single-input UX */}
        {false && !newSlideState && (
            <div className="bg-brand-surface p-4 border-b border-brand-border flex-shrink-0">
              <div className="flex items-start gap-4 max-w-4xl mx-auto">
                  <textarea
                      id="deck-ai-prompt"
                      value={deckAiPrompt}
                      onChange={(e) => setDeckAiPrompt(e.target.value)}
                      placeholder="e.g., Customize this deck for nike.com, add their logo on the top right..."
                      className="flex-grow p-3 text-sm bg-brand-background border border-brand-border rounded-lg focus:ring-2 focus:ring-brand-primary transition-all text-brand-text-primary placeholder-brand-text-tertiary h-20 resize-none"
                      disabled={isCreatingPlan || isExecutingPlan}
                  />
                  <div className="flex flex-col gap-2 self-stretch">
                      <button
                          onClick={handleCreateAiPlan}
                          disabled={isCreatingPlan || isExecutingPlan || !deckAiPrompt}
                          className="px-5 py-2 text-sm font-semibold rounded-lg shadow-sm text-white bg-brand-primary hover:opacity-90 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center flex-grow"
                      >
                        {isCreatingPlan ? 'Planning...' : 'Create AI Plan'}
                      </button>
                  </div>
              </div>
              {error && <p className="text-red-500 text-xs mt-2 text-center max-w-4xl mx-auto">{error}</p>}
            </div>
          )
        }

        <div className="flex-grow overflow-y-auto min-h-0">
            <ActiveSlideView
                slide={activeSlide}
                onNewSlideVersion={onNewSlideVersion}
                onUndo={onUndo}
                onResetSlide={onResetSlide}
                styleLibrary={styleLibrary}
                onToggleStyleLibrary={onToggleStyleLibrary}
                onAddSessionToHistory={onAddSessionToHistory}
                onSuccessfulSingleSlideEdit={setLastSuccessfulEdit}
                creationModeInfo={newSlideState}
                onCancelCreation={handleCancelAddSlide}
                slides={slides}
                onAddNewSlide={onAddNewSlide}
            />
        </div>
      </div>
      
      {executionPlan && (
        <DeckAiPlanModal 
            plan={executionPlan} 
            onConfirm={handleExecutePlan} 
            onCancel={() => setExecutionPlan(null)} 
        />
      )}
       {slideUnderReview && slideUnderReview.pendingPersonalization && (
            <VariantSelector
                variantsData={{
                    images: slideUnderReview.pendingPersonalization.variations,
                    prompts: slideUnderReview.pendingPersonalization.variationPrompts
                }}
                onSelect={handleVariantSelected}
                onCancel={() => {
                    onDiscardPendingPersonalization(slideUnderReview.id);
                    setSlideUnderReview(null);
                }}
                onRegenerate={handleRegenerate}
                isDebugMode={isDeckDebugMode}
            />
        )}

        {lastSuccessfulEdit && (
             <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-brand-surface text-brand-text-primary py-3 px-5 rounded-xl shadow-lg border border-brand-border flex items-center gap-4 animate-fade-in z-50">
                <p className="text-sm font-medium">Liked that change?</p>
                <button
                    onClick={handleApplyToAll}
                    className="px-4 py-1.5 text-sm font-semibold text-white bg-brand-primary rounded-md hover:opacity-90"
                >
                    Apply to All Slides
                </button>
                <button onClick={() => setLastSuccessfulEdit(null)} className="text-brand-text-tertiary hover:text-brand-text-primary">
                    &times;
                </button>
            </div>
        )}
    </>
  );
};

export default Editor;