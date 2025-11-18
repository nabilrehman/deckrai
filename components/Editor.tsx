
import React, { useState, useCallback, useEffect } from 'react';
import { Slide, DeckAiExecutionPlan, StyleLibraryItem, DebugSession, LastSuccessfulEditContext } from '../types';
import SlidePreviewList from './SlidePreviewList';
import ActiveSlideView from './SlideEditor';
import { executeSlideTask } from '../services/deckraiService';
import { generateDeckExecutionPlan, createSlideFromPrompt, remakeSlideWithStyleReference, getGenerativeVariations } from '../services/geminiService';
import DeckAiPlanModal from './DeckAiPlanModal';
import VariantSelector from './VariantSelector';
import ChatInterface from './ChatInterface';
import ThinkingSection, { ThinkingStep } from './ThinkingSection';
import ActionSummary, { ActionItem } from './ActionSummary';

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
  pendingExecutionPlan?: DeckAiExecutionPlan | null;
  onClearPendingPlan?: () => void;
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
    pendingExecutionPlan,
    onClearPendingPlan,
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

  // Chat Interface State
  interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    thinking?: {
      steps: ThinkingStep[];
      duration: string;
    };
    actions?: {
      label: string;
      icon: 'sparkles' | 'check' | 'edit' | 'file';
      items: ActionItem[];
    };
    component?: React.ReactNode;
  }
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(true);
  const [chatScope, setChatScope] = useState<'slide' | 'deck'>('slide');

  useEffect(() => {
    if (lastSuccessfulEdit) {
        setLastSuccessfulEdit(null);
    }
  }, [activeSlide.id]);

  // Auto-execute pending plan from Designer Mode
  useEffect(() => {
    if (pendingExecutionPlan && onClearPendingPlan) {
      // Set the plan and it will trigger the modal to show
      setExecutionPlan(pendingExecutionPlan);
      // Clear the pending plan from App state
      onClearPendingPlan();
    }
  }, [pendingExecutionPlan, onClearPendingPlan]);

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

  // Chat message handler - reuses existing AI plan logic
  const handleChatMessage = useCallback(async (message: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    setChatMessages(prev => [...prev, userMessage]);
    setIsProcessingChat(true);

    const thinkingStartTime = Date.now();
    const thinkingSteps: ThinkingStep[] = [
      { id: '1', title: 'Analyzing your request', status: 'active', type: 'thinking' },
      { id: '2', title: 'Creating execution plan', status: 'pending', type: 'thinking' },
      { id: '3', title: 'Processing slides', status: 'pending', type: 'generating' }
    ];

    try {
      // Step 1: Analyze request
      const slidesInfo = slides.map(s => ({ id: s.id, name: s.name }));

      // Step 2: Generate plan
      thinkingSteps[0].status = 'completed';
      thinkingSteps[1].status = 'active';

      const plan = await generateDeckExecutionPlan(message, slidesInfo);

      thinkingSteps[1].status = 'completed';
      thinkingSteps[2].status = 'active';

      const thinkingDuration = ((Date.now() - thinkingStartTime) / 1000).toFixed(1) + 's';

      // Step 3: Execute the plan
      setExecutionPlan(plan);

      thinkingSteps[2].status = 'completed';

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `I've created a plan to ${message.toLowerCase()}. ${plan.tasks.length} slide${plan.tasks.length > 1 ? 's' : ''} will be updated.`,
        timestamp: Date.now(),
        thinking: {
          steps: thinkingSteps,
          duration: thinkingDuration
        },
        actions: {
          label: 'Planned Changes',
          icon: 'sparkles',
          items: plan.tasks.map((task, idx) => ({
            id: `task-${idx}`,
            label: task.type === 'EDIT_SLIDE' ? `Edit: ${task.slideName}` : `Add: ${task.newSlideName}`,
            description: task.detailed_prompt,
            status: 'pending' as const
          }))
        }
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}`,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsProcessingChat(false);
    }
  }, [slides]);

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
      <div className="flex-grow flex flex-col min-w-0 bg-brand-background" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Animated Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, #FAFBFC 0%, #F5F7FA 100%)',
          zIndex: 0
        }}>
          <div className="mesh-gradient-1" style={{
            position: 'absolute',
            top: '-50%',
            left: '-25%',
            width: '150%',
            height: '150%',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)',
            animation: 'mesh-flow-1 20s ease-in-out infinite',
            opacity: 0.6
          }} />
          <div className="mesh-gradient-2" style={{
            position: 'absolute',
            bottom: '-50%',
            right: '-25%',
            width: '150%',
            height: '150%',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(168, 85, 247, 0.06) 0%, transparent 50%)',
            animation: 'mesh-flow-2 25s ease-in-out infinite',
            opacity: 0.5
          }} />
        </div>

        {/* Content Layer */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
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

          {/* Chat Interface at Bottom - Full ChatInterface Style */}
          <div style={{
            borderTop: '1px solid var(--color-neutral-200)',
            background: 'var(--color-bg-surface)',
            flexShrink: 0,
            transition: 'all 0.3s ease'
          }}>
            {/* Toggle Header */}
            <div
              onClick={() => setIsChatExpanded(!isChatExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 32px',
                cursor: 'pointer',
                borderBottom: isChatExpanded ? '1px solid var(--color-neutral-200)' : 'none',
                background: isChatExpanded ? 'transparent' : 'linear-gradient(90deg, rgba(99, 102, 241, 0.03) 0%, rgba(168, 85, 247, 0.03) 100%)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className="bg-gradient-brand" style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-xl)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-md)'
                }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <div style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 'var(--font-semibold)',
                    color: 'var(--color-neutral-900)'
                  }}>
                    AI Assistant
                  </div>
                  <div style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-neutral-500)'
                  }}>
                    {chatMessages.length > 0 ? `${chatMessages.length} message${chatMessages.length > 1 ? 's' : ''}` : 'Ready to help'}
                  </div>
                </div>
              </div>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="2"
                style={{
                  transform: isChatExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
              >
                <path d="M19 9l-7 7-7-7"/>
              </svg>
            </div>

            {/* Expandable Content */}
            {isChatExpanded && (
              <div style={{
                padding: '24px 32px',
                maxHeight: '35vh',
                overflow: 'hidden',
                animation: 'slideDown 0.3s ease'
              }}>
                <div style={{
                  maxWidth: '900px',
                  margin: '0 auto'
                }}>
                  {/* Chat Messages - Full ChatInterface Style */}
                  {chatMessages.length > 0 && (
                    <div style={{
                      maxHeight: 'calc(35vh - 140px)',
                      overflowY: 'auto',
                      marginBottom: '24px',
                      paddingRight: '8px'
                    }}>
                      <div className="space-y-12">
                        {chatMessages.map((message) => (
                          <div key={message.id}>
                            {/* User Message */}
                            {message.role === 'user' && (
                              <div className="flex items-start gap-4">
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: 'var(--radius-full)',
                                  background: 'var(--color-brand-500)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                  fontSize: 'var(--text-sm)',
                                  fontWeight: 'var(--font-semibold)',
                                  flexShrink: 0
                                }}>
                                  U
                                </div>
                                <div style={{
                                  padding: 'var(--space-4) var(--space-5)',
                                  background: 'var(--color-bg-surface)',
                                  border: '1px solid var(--color-neutral-200)',
                                  borderRadius: 'var(--radius-2xl)',
                                  fontSize: 'var(--text-base)',
                                  color: 'var(--color-neutral-900)',
                                  lineHeight: 'var(--leading-relaxed)',
                                  maxWidth: '80%'
                                }}>
                                  {message.content}
                                </div>
                              </div>
                            )}

                            {/* Assistant Message */}
                            {message.role === 'assistant' && (
                              <div className="flex items-start gap-4">
                                <div className="bg-gradient-brand" style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: 'var(--radius-full)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                </div>
                                <div style={{
                                  flex: 1,
                                  maxWidth: '80%'
                                }}>
                                  {/* Thinking Section */}
                                  {message.thinking && (
                                    <ThinkingSection
                                      steps={message.thinking.steps}
                                      duration={message.thinking.duration}
                                    />
                                  )}

                                  {/* Main Content */}
                                  <div style={{
                                    padding: 'var(--space-4) var(--space-5)',
                                    background: 'var(--color-bg-surface)',
                                    border: '1px solid var(--color-neutral-200)',
                                    borderRadius: 'var(--radius-2xl)',
                                    fontSize: 'var(--text-base)',
                                    color: 'var(--color-neutral-900)',
                                    lineHeight: 'var(--leading-relaxed)',
                                    marginTop: message.thinking ? 'var(--space-4)' : '0'
                                  }}>
                                    {message.content}
                                  </div>

                                  {/* Action Summary */}
                                  {message.actions && (
                                    <div style={{ marginTop: 'var(--space-4)' }}>
                                      <ActionSummary
                                        label={message.actions.label}
                                        icon={message.actions.icon}
                                        items={message.actions.items}
                                      />
                                    </div>
                                  )}

                                  {/* Custom Component */}
                                  {message.component && (
                                    <div style={{ marginTop: 'var(--space-4)' }}>
                                      {message.component}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scope Pills - Show what the AI will affect */}
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '16px',
                    alignItems: 'center'
                  }}>
                    <button
                      onClick={() => setChatScope('slide')}
                      style={{
                        padding: '6px 14px',
                        background: chatScope === 'slide'
                          ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                          : 'transparent',
                        border: chatScope === 'slide'
                          ? 'none'
                          : '1px solid var(--color-neutral-300)',
                        borderRadius: '16px',
                        fontSize: '13px',
                        color: chatScope === 'slide' ? 'white' : 'var(--color-neutral-700)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: '500',
                        boxShadow: chatScope === 'slide' ? 'var(--shadow-sm)' : 'none'
                      }}
                    >
                      This slide
                    </button>
                    <button
                      onClick={() => setChatScope('deck')}
                      style={{
                        padding: '6px 14px',
                        background: chatScope === 'deck'
                          ? 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                          : 'transparent',
                        border: chatScope === 'deck'
                          ? 'none'
                          : '1px solid var(--color-neutral-300)',
                        borderRadius: '16px',
                        fontSize: '13px',
                        color: chatScope === 'deck' ? 'white' : 'var(--color-neutral-700)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: '500',
                        boxShadow: chatScope === 'deck' ? 'var(--shadow-sm)' : 'none'
                      }}
                    >
                      Whole deck
                    </button>
                  </div>

                  {/* Quick Actions - Only show when no messages */}
                  {chatMessages.length === 0 && !isProcessingChat && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginBottom: '20px',
                      flexWrap: 'wrap'
                    }}>
                      {(chatScope === 'slide' ? [
                        { text: 'Make this slide more professional', icon: '✨' },
                        { text: 'Add a data visualization', icon: '📊' },
                        { text: 'Personalize for enterprise audience', icon: '🎯' },
                        { text: 'Change the color scheme', icon: '🎨' }
                      ] : [
                        { text: 'Update all slides with new branding', icon: '🎨' },
                        { text: 'Make deck more professional', icon: '✨' },
                        { text: 'Add consistent data visualizations', icon: '📊' },
                        { text: 'Personalize entire deck', icon: '🎯' }
                      ]).map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const input = document.querySelector('input[placeholder*="Ask AI"]') as HTMLInputElement;
                            if (input) {
                              input.value = suggestion.text;
                              input.focus();
                            }
                          }}
                          style={{
                            padding: '10px 16px',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
                            border: '1px solid rgba(99, 102, 241, 0.15)',
                            borderRadius: '20px',
                            fontSize: '14px',
                            color: '#6366F1',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <span>{suggestion.icon}</span>
                          <span>{suggestion.text}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input Area - Larger and Better */}
                  <div style={{
                    background: '#FFFFFF',
                    borderRadius: '24px',
                    border: '1px solid rgba(0, 0, 0, 0.06)',
                    padding: '12px 16px',
                    transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1), 0 4px 12px rgba(0, 0, 0, 0.08)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.06)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 8px rgba(0, 0, 0, 0.02)';
                  }}
                  >
                    <input
                      type="text"
                      placeholder={chatScope === 'slide'
                        ? `Ask AI to edit slide ${slides.findIndex(s => s.id === activeSlide.id) + 1} or @mention slides...`
                        : `Ask AI to update the whole deck or @mention specific slides...`}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !isProcessingChat && e.currentTarget.value.trim()) {
                          handleChatMessage(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      disabled={isProcessingChat}
                      style={{
                        flex: 1,
                        fontSize: '16px',
                        fontWeight: '400',
                        color: '#2D3748',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        lineHeight: '1.5',
                        padding: '12px 4px',
                        letterSpacing: '-0.011em'
                      }}
                      className="placeholder:text-gray-400"
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input && input.value.trim()) {
                          handleChatMessage(input.value);
                          input.value = '';
                        }
                      }}
                      disabled={isProcessingChat}
                      className="bg-gradient-brand"
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-xl)',
                        border: 'none',
                        cursor: isProcessingChat ? 'not-allowed' : 'pointer',
                        opacity: isProcessingChat ? 0.5 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all var(--transition-fast)',
                        boxShadow: 'var(--shadow-md)'
                      }}
                    >
                      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Animation Keyframes */}
        <style>{`
          @keyframes mesh-flow-1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(5%, -8%) scale(1.1); }
            66% { transform: translate(-3%, 5%) scale(0.95); }
          }
          @keyframes mesh-flow-2 {
            0%, 100% { transform: translate(0, 0) scale(1) rotate(0deg); }
            33% { transform: translate(-6%, 4%) scale(1.05) rotate(2deg); }
            66% { transform: translate(4%, -6%) scale(0.98) rotate(-2deg); }
          }
          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
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

    </>
  );
};

export default Editor;