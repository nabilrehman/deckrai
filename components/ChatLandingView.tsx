import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatInterface from './ChatInterface';
import ThinkingSection, { ThinkingStep } from './ThinkingSection';
import ActionSummary, { ActionItem } from './ActionSummary';
import ModeSelectionCards from './ModeSelectionCards';
import PlanDisplay from './PlanDisplay';
import SlidePreviewInline from './SlidePreviewInline';
import UndoActionButton from './UndoActionButton';
import ChatInputWithMentions from './ChatInputWithMentions';
import { Slide, StyleLibraryItem, StoredChatMessage } from '../types';
import { analyzeNotesAndAskQuestions, generateSlidesWithContext, executeSlideTask, GenerationContext } from '../services/deckraiService';
import { detectVibeFromNotes, getDesignerStylesForVibe, getDesignerStyleById, generateStylePromptModifier, PresentationVibe } from '../services/vibeDetection';
import { createSlideFromPrompt, findBestStyleReferenceFromPrompt } from '../services/geminiService';
import { saveChat, getUserChats, getChat } from '../services/firestoreService';
import { SavedChat } from '../types';

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
  // New fields for 10/10 chat features
  slidePreview?: Slide[];           // Slides to show inline preview
  beforeSlides?: Slide[];           // For before/after comparison
  showComparison?: boolean;         // Toggle before/after view
  undoAction?: () => void;          // Undo callback
  undoDescription?: string;         // Description like "Updated 3 slides"
  mentionedSlides?: string[];       // IDs of @mentioned slides
  attachedImages?: string[];        // Uploaded image URLs
}

interface ChatLandingViewProps {
  styleLibrary?: StyleLibraryItem[];
  onDeckGenerated?: (slides: Slide[]) => void;

  // New props for artifacts mode
  user?: any;
  onSignOut?: () => void;
  onSlidesGenerated?: (slides: Slide[]) => void;
  onSlideUpdate?: (slideId: string, updates: Partial<Slide>) => void;
  onAddSlide?: (newSlide: Slide) => void;

  // Props for 10/10 chat features
  artifactSlides?: Slide[];         // Current slides for @mentions
  onUndoLastChange?: () => void;    // Undo callback
}

/**
 * Helper: Launder image through canvas to ensure it's a clean base64 data URL
 */
const launderImageSrc = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
};

/**
 * Helper: Convert ChatMessage to StoredChatMessage (serializable format)
 */
const chatMessageToStoredMessage = (message: ChatMessage): StoredChatMessage => {
  const stored: StoredChatMessage = {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp
  };

  // Convert slide previews to storage format
  if (message.slidePreview && message.slidePreview.length > 0) {
    stored.slideImages = message.slidePreview.map(slide =>
      slide.history && slide.history.length > 0
        ? slide.history[slide.history.length - 1]
        : slide.originalSrc
    );
    stored.slideData = message.slidePreview.map(slide => ({
      id: slide.id,
      name: slide.name,
      storageUrl: slide.history && slide.history.length > 0
        ? slide.history[slide.history.length - 1]
        : slide.originalSrc
    }));
  }

  // Convert thinking steps
  if (message.thinking) {
    stored.thinkingSteps = message.thinking.steps;
  }

  return stored;
};

const ChatLandingView: React.FC<ChatLandingViewProps> = ({
  styleLibrary = [],
  onDeckGenerated,
  user,
  onSignOut,
  onSlidesGenerated,
  onSlideUpdate,
  onAddSlide,
  artifactSlides = [],
  onUndoLastChange
}) => {
  // UI State
  const [inputValue, setInputValue] = useState('');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Gemini 2.0 Flash');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Chat State (Gemini Pattern)
  const [chatActive, setChatActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);

  // Generation State
  const [detectedVibe, setDetectedVibe] = useState<PresentationVibe | null>(null);
  const [generationPlan, setGenerationPlan] = useState<any>(null);
  const [thinkingStartTime, setThinkingStartTime] = useState<number>(0);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [generationMode, setGenerationMode] = useState<'template' | 'crazy' | null>(null);
  const [pendingUserPrompt, setPendingUserPrompt] = useState<string>('');
  const [awaitingPlanEdit, setAwaitingPlanEdit] = useState(false);

  // @Mention and Image Upload State (for current message context)
  const [currentMentionedSlides, setCurrentMentionedSlides] = useState<string[]>([]);
  const [currentAttachedImages, setCurrentAttachedImages] = useState<string[]>([]);

  // Chat Storage State
  const [currentChatId, setCurrentChatId] = useState(`chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

  // Debug: Log styleLibrary on mount and when it changes
  useEffect(() => {
    console.log('🔍 ChatLandingView: styleLibrary prop received:', {
      length: styleLibrary?.length || 0,
      hasItems: styleLibrary && styleLibrary.length > 0,
      firstItem: styleLibrary?.[0]?.name || 'none'
    });
  }, [styleLibrary]);

  // Load saved chats on mount
  useEffect(() => {
    if (!user) return;

    const loadChats = async () => {
      setLoadingChats(true);
      try {
        const chats = await getUserChats(user.uid);
        setSavedChats(chats);
      } catch (error) {
        console.error('Failed to load chats:', error);
      } finally {
        setLoadingChats(false);
      }
    };

    loadChats();
  }, [user]);

  // Auto-save chat on message changes (500ms debounce) and refresh chat list
  useEffect(() => {
    if (!user || messages.length === 0) return;

    const storedMessages = messages.map(chatMessageToStoredMessage);

    // Save and then refresh the chat list
    const saveTimeout = setTimeout(async () => {
      try {
        await saveChat(user.uid, currentChatId, storedMessages);

        // Refresh the chat list after saving
        const chats = await getUserChats(user.uid);
        setSavedChats(chats);
      } catch (error) {
        console.error('Auto-save or refresh failed:', error);
      }
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [messages, user, currentChatId]);

  const suggestedPrompts = [
    'Sales deck for enterprise clients',
    'Product launch presentation',
    'Investor pitch deck',
    'Training materials'
  ];

  /**
   * Helper: Add a message to the chat
   */
  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  /**
   * Helper: Update thinking steps in real-time
   */
  const updateThinkingStep = useCallback((stepId: string, updates: Partial<ThinkingStep>) => {
    setThinkingSteps(prev =>
      prev.map(step => step.id === stepId ? { ...step, ...updates } : step)
    );
  }, []);

  /**
   * Helper: Add a new thinking step
   */
  const addThinkingStep = useCallback((step: ThinkingStep) => {
    setThinkingSteps(prev => [...prev, step]);
  }, []);

  /**
   * Helper: Load a saved chat
   */
  const handleLoadChat = useCallback(async (chatId: string) => {
    if (!user) return;

    try {
      const chatData = await getChat(user.uid, chatId);
      if (!chatData) {
        console.error('Chat not found');
        return;
      }

      // Convert StoredChatMessages back to ChatMessages
      const loadedMessages: ChatMessage[] = chatData.messages.map(stored => ({
        id: stored.id,
        role: stored.role,
        content: stored.content,
        timestamp: stored.timestamp,
        thinking: stored.thinkingSteps ? {
          steps: stored.thinkingSteps,
          duration: 'a few seconds'
        } : undefined,
        slidePreview: stored.slideData?.map(data => ({
          id: data.id,
          name: data.name,
          originalSrc: data.storageUrl,
          history: [data.storageUrl]
        }))
      }));

      setMessages(loadedMessages);
      setCurrentChatId(chatId);
      setChatActive(true);

      console.log(`✅ Loaded chat: ${chatData.chat.title}`);
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  }, [user]);

  /**
   * Helper: Start a new chat
   */
  const handleNewChat = useCallback(() => {
    setMessages([]);
    setInputValue('');
    setCurrentChatId(`chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    setChatActive(false);
    setGenerationPlan(null);
    setDetectedVibe(null);
    setThinkingSteps([]);
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      // Use instant scroll for immediate feedback
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setShowUploadMenu(false);
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(event.target as Node)) {
        setShowModelMenu(false);
      }
    };

    if (showUploadMenu || showModelMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUploadMenu, showModelMenu]);

  /**
   * Main Handler: Process user's text prompt (Gemini pattern)
   */
  const handleGenerate = useCallback(async (mentionedSlideIds?: string[]) => {
    if (!inputValue.trim()) return;

    const userPrompt = inputValue.trim();
    setInputValue('');

    // ACTIVATE CHAT MODE → Input slides down!
    setChatActive(true);

    // Add user message
    addMessage({
      role: 'user',
      content: userPrompt
    });

    // Check if we're waiting for mode selection (templates vs scratch)
    if (pendingUserPrompt) {
      // Use AI to understand the user's mode choice
      const lowerPrompt = userPrompt.toLowerCase();

      // Detect if they chose templates or scratch/crazy mode
      const wantsTemplates = lowerPrompt.includes('template') ||
                            lowerPrompt.includes('company') ||
                            lowerPrompt.includes('reference') ||
                            lowerPrompt.includes('uploaded') ||
                            lowerPrompt.includes('brand consistency');

      const wantsScratch = lowerPrompt.includes('scratch') ||
                          lowerPrompt.includes('crazy') ||
                          lowerPrompt.includes('creative') ||
                          lowerPrompt.includes('fresh') ||
                          lowerPrompt.includes('new');

      if (wantsTemplates || wantsScratch) {
        const selectedMode = wantsTemplates ? 'template' : 'crazy';
        const originalPrompt = pendingUserPrompt;

        // Clear pending state
        setPendingUserPrompt('');

        // Continue with the selected mode
        continueWithMode(selectedMode, originalPrompt);
        return;
      }

      // If we can't detect their choice, ask again more clearly
      addMessage({
        role: 'assistant',
        content: `I didn't quite catch that. Please choose one:\n\n**Use Templates** - Match your content to your uploaded references\n**Start from Scratch** - Create fresh designs based on your brand research\n\nJust click one of the buttons above, or type "templates" or "scratch".`
      });
      return;
    }

    // Check if we're editing an existing plan
    if (awaitingPlanEdit && generationPlan) {
      setAwaitingPlanEdit(false);

      // Use AI to understand what they want to change (agentic pattern)
      const { parsePlanModification } = await import('../services/geminiService');
      const modification = await parsePlanModification(userPrompt, {
        slideCount: generationPlan.slideCount,
        style: generationPlan.style,
        audience: generationPlan.audience
      });

      // Apply AI-detected modifications
      const updatedPlan = { ...generationPlan };
      if (modification.slideCount !== undefined) {
        updatedPlan.slideCount = modification.slideCount;
      }
      if (modification.style) {
        updatedPlan.style = modification.style;
      }
      if (modification.audience) {
        updatedPlan.audience = modification.audience;
      }

      setGenerationPlan(updatedPlan);

      // Show updated plan
      addMessage({
        role: 'assistant',
        content: `Great! I've updated the plan:`,
        component: (
          <PlanDisplay
            slideCount={updatedPlan.slideCount}
            style={updatedPlan.style}
            audience={updatedPlan.audience}
            reasoning={updatedPlan.reasoning}
            onGenerate={() => handleGenerateSlides(updatedPlan)}
            onEdit={() => {
              setAwaitingPlanEdit(true);
              addMessage({
                role: 'assistant',
                content: `What else would you like to change?`
              });
            }}
          />
        )
      });

      return;
    }

    // Use AI to detect editing intent (agentic pattern - AI determines action, not regex)
    let isEditingRequest = false;
    let slideIdsToEdit: string[] = [];

    if (artifactSlides && artifactSlides.length > 0) {
      // First check @mentions (instant detection, no AI call needed)
      if (mentionedSlideIds && mentionedSlideIds.length > 0) {
        isEditingRequest = true;
        slideIdsToEdit = mentionedSlideIds;
        console.log('🔧 Detected editing request via @mentions:', mentionedSlideIds);
      } else {
        // No @mentions - use AI to detect natural language editing intent
        const { parseEditIntent } = await import('../services/geminiService');
        const intent = await parseEditIntent(userPrompt, artifactSlides.length);

        if (intent.isEditing) {
          isEditingRequest = true;
          // Convert 1-indexed slide numbers to slide IDs
          slideIdsToEdit = intent.slideNumbers.map(num => {
            const slide = artifactSlides[num - 1]; // Convert to 0-indexed
            return slide?.id;
          }).filter(Boolean) as string[];

          console.log('🤖 AI detected editing intent:', {
            scope: intent.scope,
            slideNumbers: intent.slideNumbers,
            slideIds: slideIdsToEdit,
            action: intent.action
          });
        }
      }
    }

    if (isEditingRequest && slideIdsToEdit.length > 0) {
      // This is an editing request - handle inline editing
      console.log('🔧 Processing edit request for slides:', slideIdsToEdit);

      // Inline editing logic (avoid circular dependency)
      setIsProcessing(true);

      try {
        // Process each slide to edit
        const editPromises = slideIdsToEdit.map(async (slideId) => {
          const slide = artifactSlides.find(s => s.id === slideId);
          if (!slide) return null;

          const currentSrc = slide.history && slide.history.length > 0
            ? slide.history[slide.history.length - 1]
            : slide.originalSrc;

          // Call the same function Editor uses for AI edits
          const { executeSlideTask } = await import('../services/geminiService');
          const result = await executeSlideTask(currentSrc, userPrompt, false);
          const newImageDataUrl = result.images[0];

          return {
            ...slide,
            history: [...(slide.history || [slide.originalSrc]), newImageDataUrl]
          };
        });

        const editedSlides = (await Promise.all(editPromises)).filter(Boolean) as Slide[];

        // Update slides via callback
        if (onSlideUpdate && editedSlides.length > 0) {
          editedSlides.forEach(slide => {
            onSlideUpdate(slide.id, { history: slide.history });
          });
        }

        // Add success message
        addMessage({
          role: 'assistant',
          content: `✅ Updated ${editedSlides.length} slide${editedSlides.length > 1 ? 's' : ''}!`,
          slidePreview: editedSlides
        });
      } catch (error) {
        console.error('Error editing slides:', error);
        addMessage({
          role: 'assistant',
          content: `❌ Sorry, there was an error editing the slides. Please try again.`
        });
      } finally {
        setIsProcessing(false);
      }

      // Clear the mentioned slides after handling
      setCurrentMentionedSlides([]);
      return;
    }

    // Check if user has style library → ask for mode selection (only for NEW deck creation)
    const hasStyleLibrary = styleLibrary && styleLibrary.length > 0;

    console.log('🔍 handleUserPrompt: Checking styleLibrary', {
      styleLibraryExists: !!styleLibrary,
      styleLibraryLength: styleLibrary?.length || 0,
      hasStyleLibrary,
      willShowModal: hasStyleLibrary
    });

    if (hasStyleLibrary) {
      // Ask user to select mode before proceeding
      setPendingUserPrompt(userPrompt);
      addMessage({
        role: 'assistant',
        content: `I found ${styleLibrary.length} reference slide${styleLibrary.length > 1 ? 's' : ''} in your library! Would you like me to:\n\n**Use your company templates** - I'll match your content to uploaded references for perfect brand consistency.\n\n**Or start from scratch** - I'll research your brand from your website and create fresh designs with maximum creativity.`,
        component: (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginTop: '16px'
          }}>
            <button
              onClick={() => continueWithMode('template', userPrompt)}
              style={{
                padding: '8px 20px',
                background: '#8B5CF6',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: 'none'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#7C3AED';
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(139, 92, 246, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#8B5CF6';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Use Templates
            </button>
            <button
              onClick={() => continueWithMode('crazy', userPrompt)}
              style={{
                padding: '8px 20px',
                background: 'transparent',
                color: '#8B5CF6',
                border: '1.5px solid #E0E0E0',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#FAFAFA';
                e.currentTarget.style.borderColor = '#BDBDBD';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = '#E0E0E0';
              }}
            >
              Start from Scratch
            </button>
          </div>
        )
      });
      return; // Wait for mode selection
    }

    // No style library → proceed directly with crazy mode
    continueWithMode('crazy', userPrompt);
  }, [inputValue, addMessage, styleLibrary, artifactSlides, awaitingPlanEdit, generationPlan, onSlideUpdate]);

  /**
   * Handle editing slides via @mentions
   */
  const handleEditSlides = useCallback(async (userPrompt: string, mentionedSlideIds: string[]) => {
    setIsProcessing(true);

    try {
      // Add user message
      addMessage({
        role: 'user',
        content: userPrompt
      });

      // Process each mentioned slide
      const editPromises = mentionedSlideIds.map(async (slideId) => {
        const slide = artifactSlides.find(s => s.id === slideId);
        if (!slide) return null;

        const slideIndex = artifactSlides.findIndex(s => s.id === slideId);
        const currentSrc = slide.history && slide.history.length > 0
          ? slide.history[slide.history.length - 1]
          : slide.originalSrc;

        // Call the same function Editor uses for AI edits
        const newImageDataUrl = await executeSlideTask(currentSrc, userPrompt);

        return {
          ...slide,
          history: [...(slide.history || [slide.originalSrc]), newImageDataUrl]
        };
      });

      const editedSlides = (await Promise.all(editPromises)).filter(Boolean) as Slide[];

      // Update slides via callback
      if (onSlideUpdate && editedSlides.length > 0) {
        editedSlides.forEach(slide => {
          onSlideUpdate(slide.id, { history: slide.history });
        });
      }

      // Add success message
      addMessage({
        role: 'assistant',
        content: `✅ Updated ${editedSlides.length} slide${editedSlides.length > 1 ? 's' : ''}!`,
        slidePreview: editedSlides
      });

    } catch (error) {
      console.error('Error editing slides:', error);
      addMessage({
        role: 'assistant',
        content: `❌ Sorry, there was an error editing the slides. Please try again.`
      });
    } finally {
      setIsProcessing(false);
    }
  }, [artifactSlides, addMessage, onSlideUpdate]);

  /**
   * Continue generation after mode selection
   */
  const continueWithMode = useCallback(async (mode: 'template' | 'crazy', userPrompt: string) => {
    setGenerationMode(mode);
    setIsProcessing(true);
    setThinkingStartTime(Date.now());
    setThinkingSteps([]);

    try {
      // Step 1: Detect vibe
      const step1: ThinkingStep = {
        id: 'step-vibe',
        title: 'Analyzing presentation context',
        content: 'Understanding the tone, audience, and purpose from your request...',
        status: 'active',
        type: 'thinking'
      };
      addThinkingStep(step1);

      const vibe = detectVibeFromNotes(userPrompt);
      console.log('✅ Detected vibe:', vibe);
      setDetectedVibe(vibe);

      updateThinkingStep('step-vibe', {
        status: 'completed',
        content: `Detected ${vibe} presentation style`
      });

      // Step 2: AI analyzes and asks questions
      const step2: ThinkingStep = {
        id: 'step-analyze',
        title: 'Planning slide structure',
        content: 'AI is analyzing your request and creating a deck plan...',
        status: 'active',
        type: 'thinking'
      };
      addThinkingStep(step2);

      const analysis = await analyzeNotesAndAskQuestions(userPrompt);
      console.log('✅ AI analysis complete:', analysis);

      updateThinkingStep('step-analyze', {
        status: 'completed',
        content: `Created plan for ${analysis.suggestions.recommendedSlideCount} slides`
      });

      // Step 3: Create generation plan
      const step3: ThinkingStep = {
        id: 'step-plan',
        title: 'Finalizing recommendations',
        status: 'active',
        type: 'thinking'
      };
      addThinkingStep(step3);

      const plan = {
        slideCount: analysis.suggestions.recommendedSlideCount,
        style: analysis.suggestions.recommendedStyle,
        audience: analysis.questions[0]?.options[0] || 'Professional audience',
        reasoning: analysis.suggestions.reasoning,
        userPrompt: inputValue
      };
      setGenerationPlan(plan);

      updateThinkingStep('step-plan', { status: 'completed' });

      // Calculate thinking duration
      const duration = ((Date.now() - thinkingStartTime) / 1000).toFixed(1);

      // Add AI response with plan and approval buttons
      addMessage({
        role: 'assistant',
        content: `I've analyzed your request and created a plan:`,
        thinking: {
          steps: [...thinkingSteps, { ...step3, status: 'completed' }],
          duration: `${duration}s`
        },
        component: (
          <PlanDisplay
            slideCount={plan.slideCount}
            style={plan.style}
            audience={plan.audience}
            reasoning={plan.reasoning}
            onGenerate={() => handleGenerateSlides(plan)}
            onEdit={() => {
              // Start conversational editing flow
              setAwaitingPlanEdit(true);
              addMessage({
                role: 'assistant',
                content: `I'd be happy to modify the plan! What would you like to change?\n\nYou can tell me about:\n• Slide count (currently ${plan.slideCount} slides)\n• Style (currently ${plan.style})\n• Target audience (currently ${plan.audience})\n• Or describe any other changes you'd like`
              });
            }}
          />
        )
      });

    } catch (error: any) {
      console.error('❌ Error processing prompt:', error);

      addMessage({
        role: 'assistant',
        content: `I encountered an error while analyzing your request: ${error.message}\n\nPlease try rephrasing your request or provide more details.`
      });
    } finally {
      setIsProcessing(false);
    }
  }, [inputValue, thinkingStartTime, thinkingSteps, addMessage, addThinkingStep, updateThinkingStep]);

  /**
   * Handle message submission from ChatInputWithMentions
   */
  const handleSendMessage = useCallback((value: string, mentionedSlideIds?: string[], attachedImages?: string[]) => {
    // Simply set the input value and call handleGenerate
    setInputValue(value);

    // Store images and mentions for use in slide generation
    if (mentionedSlideIds && mentionedSlideIds.length > 0) {
      setCurrentMentionedSlides(mentionedSlideIds);
      console.log('📌 Mentioned slides stored:', mentionedSlideIds);
    } else {
      setCurrentMentionedSlides([]);
    }

    if (attachedImages && attachedImages.length > 0) {
      setCurrentAttachedImages(attachedImages);
      console.log('🖼️ Attached images stored:', attachedImages.length);
    } else {
      setCurrentAttachedImages([]);
    }

    // Trigger the existing generation flow
    // Pass mentionedSlideIds directly to avoid React state timing issues
    handleGenerate(mentionedSlideIds);
  }, [handleGenerate]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  /**
   * Handler: Generate slides based on approved plan
   */
  const handleGenerateSlides = useCallback(async (plan: any) => {
    console.log('🎨 ChatLandingView: Generating slides...', plan);

    setIsProcessing(true);
    setThinkingStartTime(Date.now());
    setThinkingSteps([]);

    try {
      // Step 1: Selecting designer style
      const step1: ThinkingStep = {
        id: 'step-style',
        title: 'Selecting design style',
        status: 'active',
        type: 'thinking'
      };
      addThinkingStep(step1);

      const designerStyles = detectedVibe ? getDesignerStylesForVibe(detectedVibe) : [];
      const selectedStyle = designerStyles.length > 0 ? designerStyles[0] : { name: 'Default' };

      updateThinkingStep('step-style', {
        status: 'completed',
        content: `Selected ${selectedStyle.name} theme`
      });

      // Step 2: Generate slide descriptions with AI
      const step2: ThinkingStep = {
        id: 'step-descriptions',
        title: 'Analyzing content and creating slide plan',
        status: 'active',
        type: 'thinking'
      };
      addThinkingStep(step2);

      const context: GenerationContext = {
        notes: plan.userPrompt,
        slideCount: plan.slideCount,
        audience: plan.audience || 'professional',
        style: selectedStyle.name || 'auto'
      };

      const slideDescriptions = await generateSlidesWithContext(context);

      updateThinkingStep('step-descriptions', {
        status: 'completed',
        content: `Created ${slideDescriptions.length} slide specifications`
      });

      // Step 3: Get designer style configuration
      const designerStyle = selectedStyle.id ? getDesignerStyleById(selectedStyle.id) : null;

      // Build style library for AI Style Scout
      let styleLibraryForScout: StyleLibraryItem[] = [];
      if (styleLibrary.length > 0) {
        styleLibraryForScout = styleLibrary;
      }

      // Add designer-specific prompt modifier
      const stylePromptModifier = designerStyle
        ? generateStylePromptModifier(designerStyle)
        : '';

      // Step 4: Generate actual slides with AI
      const generatedSlides: Slide[] = [];
      const BATCH_SIZE = 3;
      const totalSlides = Math.min(slideDescriptions.length, plan.slideCount);

      for (let i = 0; i < totalSlides; i += BATCH_SIZE) {
        const batchDescriptions = slideDescriptions.slice(i, Math.min(i + BATCH_SIZE, totalSlides));

        const batchPromises = batchDescriptions.map(async (description, indexInBatch) => {
          const slideNumber = i + indexInBatch + 1;

          const step: ThinkingStep = {
            id: `step-slide-${slideNumber}`,
            title: `Generating slide ${slideNumber}/${totalSlides}`,
            status: 'active',
            type: 'generating'
          };
          addThinkingStep(step);

          // Use AI Style Scout to pick the best reference for this specific slide
          let referenceSrc: string | null = null;
          if (styleLibraryForScout.length > 0) {
            const bestReference = await findBestStyleReferenceFromPrompt(
              description,
              styleLibraryForScout
            );
            referenceSrc = bestReference?.src || null;
          }

          // Apply designer style modifier to prompt
          const finalPrompt = description + stylePromptModifier;

          const { images } = await createSlideFromPrompt(
            referenceSrc,
            finalPrompt,
            false,
            [],
            undefined,
            null,  // theme
            null,  // logoImage
            currentAttachedImages.length > 0 ? currentAttachedImages[0] : null  // customImage - use first uploaded image
          );

          const finalImage = await launderImageSrc(images[0]);

          updateThinkingStep(`step-slide-${slideNumber}`, { status: 'completed' });

          return {
            id: `slide-${Date.now()}-${slideNumber}`,
            originalSrc: finalImage,
            history: [finalImage],
            name: description.substring(0, 40).split('\n')[0] || `Slide ${slideNumber}`,
          };
        });

        const batchResults = await Promise.all(batchPromises);
        generatedSlides.push(...batchResults);
      }

      const duration = ((Date.now() - thinkingStartTime) / 1000).toFixed(1);

      // Add completion message
      addMessage({
        role: 'assistant',
        content: `✅ Successfully generated ${generatedSlides.length} slides! Opening the editor...`,
        thinking: {
          steps: thinkingSteps.map(s => ({ ...s, status: 'completed' as const })),
          duration: `${duration}s`
        },
        actions: {
          label: 'Generated Slides',
          icon: 'sparkles',
          items: generatedSlides.map((slide, i) => ({
            name: `Slide ${i + 1}`,
            status: 'completed' as const
          }))
        },
        slidePreview: generatedSlides,  // Show all generated slides
        undoAction: onUndoLastChange,
        undoDescription: `Created ${generatedSlides.length} slides`
      });

      // Pass slides to parent
      setTimeout(() => {
        // Call artifacts callback if in artifacts mode
        if (onSlidesGenerated) {
          onSlidesGenerated(generatedSlides);
        }
        // Call legacy callback if in editor mode
        if (onDeckGenerated) {
          onDeckGenerated(generatedSlides);
        }

        // Clear stored context after generation
        setCurrentAttachedImages([]);
        setCurrentMentionedSlides([]);
      }, 1500);

    } catch (error: any) {
      console.error('❌ Error generating slides:', error);

      addMessage({
        role: 'assistant',
        content: `I encountered an error while generating slides: ${error.message}\n\nPlease try again.`
      });

      // Clear context on error too
      setCurrentAttachedImages([]);
      setCurrentMentionedSlides([]);
    } finally {
      setIsProcessing(false);
    }
  }, [detectedVibe, thinkingStartTime, thinkingSteps, addMessage, addThinkingStep, updateThinkingStep, onDeckGenerated, onSlidesGenerated, onUndoLastChange, currentAttachedImages]);

  /**
   * Handler: Process file uploads (Gemini pattern)
   */
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // ACTIVATE CHAT MODE → Input slides down!
    setChatActive(true);

    // Add user message
    addMessage({
      role: 'user',
      content: `Uploaded ${fileArray.length} file(s): ${fileArray.map(f => f.name).join(', ')}`
    });

    setIsProcessing(true);
    setThinkingStartTime(Date.now());
    setThinkingSteps([]);

    try {
      // Step 1: Processing files
      const step1: ThinkingStep = {
        id: 'step-process-files',
        title: 'Processing uploaded files',
        content: 'Extracting content from your presentation...',
        status: 'active',
        type: 'thinking'
      };
      addThinkingStep(step1);

      // TODO: Extract content from PDF using pdfjsLib
      const extractedContent = `Sample content extracted from ${fileArray[0].name}`;

      updateThinkingStep('step-process-files', {
        status: 'completed',
        content: `Processed ${fileArray.length} file(s)`
      });

      // Step 2: AI analyzes content
      const step2: ThinkingStep = {
        id: 'step-analyze-upload',
        title: 'Analyzing presentation content',
        content: 'AI is analyzing the structure and creating an improvement plan...',
        status: 'active',
        type: 'thinking'
      };
      addThinkingStep(step2);

      // TODO: Call analyzeNotesAndAskQuestions with extracted content
      const analysis = {
        suggestions: {
          recommendedSlideCount: 5,
          recommendedStyle: 'Professional',
          reasoning: 'Based on your uploaded presentation, I recommend regenerating with improved design and clarity.'
        },
        questions: []
      };

      updateThinkingStep('step-analyze-upload', {
        status: 'completed',
        content: `Analyzed ${fileArray.length} slide(s) from upload`
      });

      // Step 3: Create generation plan
      const step3: ThinkingStep = {
        id: 'step-plan-upload',
        title: 'Creating improvement plan',
        status: 'active',
        type: 'thinking'
      };
      addThinkingStep(step3);

      const plan = {
        slideCount: analysis.suggestions.recommendedSlideCount,
        style: analysis.suggestions.recommendedStyle,
        audience: 'Professional audience',
        reasoning: analysis.suggestions.reasoning,
        estimatedTime: `${Math.ceil(analysis.suggestions.recommendedSlideCount * 0.5)}-${Math.ceil(analysis.suggestions.recommendedSlideCount * 0.5) + 2} minutes`
      };
      setGenerationPlan(plan);

      updateThinkingStep('step-plan-upload', { status: 'completed' });

      const duration = ((Date.now() - thinkingStartTime) / 1000).toFixed(1);

      // Add AI response with plan
      addMessage({
        role: 'assistant',
        content: `I've analyzed your presentation. Here's what I recommend:\n\n**Plan:**\n- **${plan.slideCount} improved slides** with ${plan.style} styling\n- ${plan.reasoning}\n- **Estimated viewing time:** ${plan.estimatedTime}\n\nWould you like me to proceed with generating these improved slides?`,
        thinking: {
          steps: [...thinkingSteps, { ...step3, status: 'completed' }],
          duration: `${duration}s`
        }
      });

      // Auto-approve after brief pause (TODO: add approval buttons)
      setTimeout(() => {
        handleGenerateSlides(plan);
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error processing files:', error);

      addMessage({
        role: 'assistant',
        content: `I encountered an error while processing your files: ${error.message}\n\nPlease try uploading again or provide more details.`
      });
    } finally {
      setIsProcessing(false);
    }
  }, [thinkingStartTime, thinkingSteps, addMessage, addThinkingStep, updateThinkingStep, handleGenerateSlides]);

  const handlePromptClick = (prompt: string) => {
    setInputValue(prompt);
    // Trigger the same flow as handleGenerate
    setTimeout(() => handleGenerate(), 100);
  };

  const handleUploadFiles = () => {
    setShowUploadMenu(false);
    fileInputRef.current?.click();
  };

  const handleCreateSingleSlide = () => {
    setShowUploadMenu(false);
    setInputValue('Create a single slide');
    setTimeout(() => handleGenerate(), 100);
  };

  const handleConnectDrive = () => {
    setShowUploadMenu(false);
    // Placeholder for future Drive integration
    alert('Connect with Drive - Coming soon!');
  };

  const models = [
    { name: 'Gemini 2.0 Flash', description: 'Fastest, most efficient' },
    { name: 'Gemini 2.5 Pro', description: 'Advanced reasoning' },
    { name: 'Claude Sonnet 4.5', description: 'Best for complex tasks' }
  ];

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    setShowModelMenu(false);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated Background - Fades out when chat is active */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: chatActive ? '#FFFFFF' : 'linear-gradient(180deg, #FAFBFC 0%, #F5F7FA 100%)',
        zIndex: 0,
        overflow: 'hidden',
        transition: 'background 0.5s ease'
      }}>
        {/* Gradient Orb 1 - Top Left */}
        <div className="mesh-gradient-1" style={{
          position: 'absolute',
          top: '-50%',
          left: '-25%',
          width: '150%',
          height: '150%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0.06) 25%, transparent 50%)',
          animation: 'mesh-flow-1 20s ease-in-out infinite',
          opacity: chatActive ? 0.15 : 0.8,
          mixBlendMode: 'normal',
          filter: 'blur(60px)',
          transition: 'opacity 0.5s ease'
        }} />

        {/* Gradient Orb 2 - Bottom Right */}
        <div className="mesh-gradient-2" style={{
          position: 'absolute',
          bottom: '-50%',
          right: '-25%',
          width: '150%',
          height: '150%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(168, 85, 247, 0.10) 0%, rgba(168, 85, 247, 0.05) 25%, transparent 50%)',
          animation: 'mesh-flow-2 25s ease-in-out infinite',
          opacity: chatActive ? 0.1 : 0.7,
          mixBlendMode: 'normal',
          filter: 'blur(60px)',
          transition: 'opacity 0.5s ease'
        }} />

        {/* Gradient Orb 3 - Center Right */}
        <div className="mesh-gradient-3" style={{
          position: 'absolute',
          top: '30%',
          right: '20%',
          width: '80%',
          height: '80%',
          background: 'radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.04) 30%, transparent 60%)',
          animation: 'mesh-flow-3 30s ease-in-out infinite',
          opacity: chatActive ? 0.12 : 0.9,
          mixBlendMode: 'normal',
          filter: 'blur(70px)',
          transition: 'opacity 0.5s ease'
        }} />

        {/* Gradient Orb 4 - Center Left (New - adds more depth) */}
        <div className="mesh-gradient-4" style={{
          position: 'absolute',
          top: '60%',
          left: '10%',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.06) 0%, transparent 50%)',
          animation: 'mesh-flow-4 35s ease-in-out infinite',
          opacity: chatActive ? 0.08 : 0.6,
          mixBlendMode: 'normal',
          filter: 'blur(80px)',
          transition: 'opacity 0.5s ease'
        }} />
      </div>

      {/* Content Layer - Gemini Pattern */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: chatActive ? 'row' : 'column',
        transition: 'all 0.3s ease',
        overflow: 'hidden'
      }}>

        {/* LEFT SIDEBAR - Only in chat mode */}
        {chatActive && (
          <div style={{
            width: '260px',
            flexShrink: 0,
            borderRight: '1px solid rgba(0, 0, 0, 0.06)',
            background: '#FAFBFC',
            padding: '20px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* New Chat Button */}
            <button
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1F2937',
                transition: 'all 150ms ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F9FAFB';
                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.08)';
              }}
              onClick={handleNewChat}
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Chat</span>
            </button>

            {/* Chat History Header */}
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '16px',
              marginBottom: '4px',
              paddingLeft: '8px'
            }}>
              Recent
            </div>

            {/* Chat History Items */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {!user ? (
                /* Not logged in - Show sign-in prompt */
                <div style={{
                  padding: '20px 16px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 12px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#1F2937',
                    marginBottom: '6px'
                  }}>
                    Sign in to save chats
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6B7280',
                    marginBottom: '16px',
                    lineHeight: '1.5'
                  }}>
                    Your conversations will be saved and accessible across devices
                  </div>
                  <button
                    onClick={() => {
                      // Scroll to top where sign-in button is in header
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      // Could also trigger a sign-in modal here if available
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Sign In
                  </button>
                </div>
              ) : loadingChats ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: '#9CA3AF'
                }}>
                  Loading chats...
                </div>
              ) : savedChats.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: '#9CA3AF'
                }}>
                  No saved chats yet
                </div>
              ) : (
                savedChats.map((chat) => (
                  <div
                    key={chat.id}
                    style={{
                      padding: '10px 12px',
                      background: currentChatId === chat.id ? '#F0F1FF' : '#FFFFFF',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 150ms ease',
                      fontSize: '14px',
                      color: currentChatId === chat.id ? '#4F46E5' : '#4B5563',
                      borderLeft: currentChatId === chat.id ? '3px solid #6366F1' : '3px solid transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (currentChatId !== chat.id) {
                        e.currentTarget.style.background = '#F9FAFB';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentChatId !== chat.id) {
                        e.currentTarget.style.background = '#FFFFFF';
                      }
                    }}
                    onClick={() => handleLoadChat(chat.id)}
                  >
                    <div style={{
                      fontWeight: '500',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {chat.title}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: currentChatId === chat.id ? '#818CF8' : '#9CA3AF',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {chat.lastMessage}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#D1D5DB',
                      marginTop: '4px'
                    }}>
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MAIN CONTENT AREA */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* HERO VIEW - Before chat active */}
          {!chatActive && (
          <div className="w-full flex-1 flex items-center justify-center">
            <div className="w-full max-w-4xl px-6">
              {/* Branding */}
              <div className="text-center mb-16">
                <h1 style={{
                  fontSize: '64px',
                  fontWeight: 'var(--font-bold)',
                  color: '#0F172A',
                  marginBottom: '20px',
                  letterSpacing: '-0.03em',
                  lineHeight: '1.1'
                }}>
                  What can I help you <br/>create today?
                </h1>
                <p style={{
                  fontSize: '20px',
                  color: '#64748B',
                  fontWeight: 'var(--font-regular)',
                  lineHeight: '1.6',
                  maxWidth: '600px',
                  margin: '0 auto'
                }}>
                  Describe your presentation or upload existing slides
                </p>
              </div>

              {/* Hero Input Box - Centered */}
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '32px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  padding: '20px 24px',
                  minHeight: '96px',
                  transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.015)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  marginBottom: '48px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(99, 102, 241, 0.2)';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03), 0 4px 12px rgba(99, 102, 241, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(0, 0, 0, 0.06)';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.015)';
                }}
              >
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="application/pdf,image/*"
                  multiple
                  onChange={handleFileUpload}
                />

                {/* Textarea */}
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your presentation or upload files..."
                  rows={1}
                  style={{
                    width: '100%',
                    fontSize: '16px',
                    fontWeight: '400',
                    color: '#2D3748',
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    lineHeight: '1.5',
                    padding: '0',
                    letterSpacing: '-0.011em',
                    resize: 'none',
                    overflow: 'auto',
                    maxHeight: '240px',
                    fontFamily: 'inherit'
                  }}
                  className="placeholder:text-gray-400"
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    const newHeight = Math.min(target.scrollHeight, 240);
                    target.style.height = newHeight + 'px';
                  }}
                />

                {/* Bottom controls */}
                <div className="flex items-center justify-between gap-3">
                  {/* Left side: Plus button + Tools */}
                  <div className="flex items-center gap-1">
                    {/* Plus Button with Dropdown */}
                    <div className="relative flex-shrink-0" ref={uploadMenuRef}>
                      <button
                        onClick={() => setShowUploadMenu(!showUploadMenu)}
                        className="flex-shrink-0"
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '20px',
                          background: showUploadMenu ? '#F9FAFB' : 'transparent',
                          color: showUploadMenu ? '#4F46E5' : '#9CA3AF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 100ms ease',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          if (!showUploadMenu) {
                            e.currentTarget.style.background = '#F9FAFB';
                            e.currentTarget.style.color = '#4F46E5';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!showUploadMenu) {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#9CA3AF';
                          }
                        }}
                        title="Upload or create"
                      >
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>

                      {/* Upload Menu Dropdown */}
                      {showUploadMenu && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '48px',
                            left: '0',
                            background: '#FFFFFF',
                            borderRadius: '16px',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                            minWidth: '220px',
                            padding: '8px',
                            zIndex: 50,
                            animation: 'slideUp 150ms ease-out'
                          }}
                        >
                          <button
                            onClick={handleUploadFiles}
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              transition: 'all 100ms ease',
                              fontSize: '15px',
                              fontWeight: '400',
                              color: '#1F2937',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                            <span>Upload files</span>
                          </button>

                          <button
                            onClick={handleCreateSingleSlide}
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              transition: 'all 100ms ease',
                              fontSize: '15px',
                              fontWeight: '400',
                              color: '#1F2937',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span>Create single slide</span>
                          </button>

                          <button
                            onClick={handleConnectDrive}
                            style={{
                              width: '100%',
                              padding: '12px 14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              transition: 'all 100ms ease',
                              fontSize: '15px',
                              fontWeight: '400',
                              color: '#1F2937',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15l5.12-5.12A3 3 0 0110.24 9H13a2 2 0 110 4h-2.5m4.5 0h1.5a2 2 0 012 2v0a2 2 0 01-2 2H9m-6 0h6" />
                            </svg>
                            <span>Connect with Drive</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Tools Button */}
                    <button
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 10px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '16px',
                        color: '#6B7280',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        transition: 'all 100ms ease',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F9FAFB';
                        e.currentTarget.style.color = '#4F46E5';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#6B7280';
                      }}
                      title="Tools"
                    >
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                      <span>Tools</span>
                    </button>
                  </div>

                  {/* Right side: Model selector + Submit */}
                  <div className="flex items-center gap-2">
                    {/* Model Selector */}
                    <div className="relative" ref={modelMenuRef}>
                      <button
                        onClick={() => setShowModelMenu(!showModelMenu)}
                        style={{
                          padding: '8px 12px',
                          background: '#F3F4F6',
                          border: 'none',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#4B5563',
                          transition: 'all 150ms ease',
                          height: '40px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                      >
                        <span>{selectedModel.replace('Gemini ', '').replace('Claude ', '')}</span>
                        <svg
                          width="12"
                          height="12"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                          style={{
                            transform: showModelMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 150ms ease'
                          }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Model Dropdown */}
                      {showModelMenu && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '52px',
                            right: '0',
                            background: '#FFFFFF',
                            borderRadius: '16px',
                            border: '1px solid rgba(0, 0, 0, 0.08)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)',
                            minWidth: '280px',
                            padding: '8px',
                            zIndex: 50
                          }}
                        >
                          {models.map((model, index) => (
                            <button
                              key={index}
                              onClick={() => handleModelSelect(model.name)}
                              style={{
                                width: '100%',
                                padding: '12px 14px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                gap: '2px',
                                background: selectedModel === model.name ? '#F0F1FF' : 'transparent',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'all 100ms ease',
                                textAlign: 'left'
                              }}
                              onMouseEnter={(e) => {
                                if (selectedModel !== model.name) {
                                  e.currentTarget.style.background = '#F9FAFB';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedModel !== model.name) {
                                  e.currentTarget.style.background = 'transparent';
                                }
                              }}
                            >
                              <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: selectedModel === model.name ? '#4F46E5' : '#1F2937'
                              }}>
                                {model.name}
                              </div>
                              <div style={{
                                fontSize: '12px',
                                color: '#6B7280',
                                fontWeight: '400'
                              }}>
                                {model.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit Button - Always visible */}
                    <button
                      onClick={handleGenerate}
                      disabled={!inputValue.trim()}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: 'none',
                        cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
                        background: inputValue.trim()
                          ? 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
                          : '#E5E7EB',
                        boxShadow: inputValue.trim()
                          ? '0 2px 8px rgba(99, 102, 241, 0.28)'
                          : 'none',
                        flexShrink: 0,
                        opacity: inputValue.trim() ? 1 : 0.5
                      }}
                      onMouseEnter={(e) => {
                        if (inputValue.trim()) {
                          e.currentTarget.style.transform = 'scale(1.08)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #686BF2 0%, #5349E6 100%)';
                          e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.42)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (inputValue.trim()) {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.background = 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.28)';
                        }
                      }}
                      title="Submit"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={inputValue.trim() ? 'white' : '#9CA3AF'}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Suggested Prompts - Refined */}
              <div className="flex flex-wrap gap-2 mt-10 justify-center">
                {suggestedPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => handlePromptClick(prompt)}
                    style={{
                      padding: '11px 20px',
                      background: 'rgba(0, 0, 0, 0.02)',
                      border: '1px solid rgba(0, 0, 0, 0.05)',
                      borderRadius: '28px',
                      color: '#4B5563',
                      fontWeight: '400',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 100ms ease',
                      boxShadow: '0 0.5px 1px rgba(0, 0, 0, 0.02)',
                      letterSpacing: '-0.006em'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#FFFFFF';
                      e.currentTarget.style.border = '1px solid rgba(99, 102, 241, 0.15)';
                      e.currentTarget.style.color = '#4F46E5';
                      e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03), 0 2px 6px rgba(99, 102, 241, 0.05)';
                      e.currentTarget.style.transform = 'translateY(-0.5px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
                      e.currentTarget.style.border = '1px solid rgba(0, 0, 0, 0.05)';
                      e.currentTarget.style.color = '#4B5563';
                      e.currentTarget.style.boxShadow = '0 0.5px 1px rgba(0, 0, 0, 0.02)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CHAT MESSAGES VIEW - After chat active */}
        {chatActive && (
          <>
            <div
              ref={chatMessagesRef}
              className="flex-1 overflow-y-auto"
              style={{
                maxWidth: '900px',
                margin: '0 auto',
                width: '100%',
                padding: '24px 32px 16px'
              }}
            >
              {messages.map((message) => (
                <div key={message.id} className="mb-8">
                  {message.role === 'user' && (
                    <div className="flex justify-end">
                      <div style={{
                        padding: '16px 20px',
                        background: '#F3F4F6',
                        borderRadius: '20px',
                        maxWidth: '80%',
                        fontSize: '16px',
                        color: '#1F2937',
                        position: 'relative',
                        cursor: message.content.length > 200 ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (message.content.length > 200) {
                          setExpandedMessages(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(message.id)) {
                              newSet.delete(message.id);
                            } else {
                              newSet.add(message.id);
                            }
                            return newSet;
                          });
                        }
                      }}
                      >
                        {(() => {
                          const isExpanded = expandedMessages.has(message.id);
                          const isLong = message.content.length > 200;

                          if (!isLong) {
                            return message.content;
                          }

                          if (isExpanded) {
                            return (
                              <>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  marginTop: '8px',
                                  fontSize: '14px',
                                  color: '#6B7280',
                                  fontWeight: '500'
                                }}>
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{
                                    transform: 'rotate(180deg)'
                                  }}>
                                    <path d="M3 7.5L6 4.5L9 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <span>Show less</span>
                                </div>
                              </>
                            );
                          } else {
                            return (
                              <>
                                <div>{message.content.substring(0, 200).trim()}...</div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  marginTop: '8px',
                                  fontSize: '14px',
                                  color: '#6B7280',
                                  fontWeight: '500'
                                }}>
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                  <span>Show more</span>
                                </div>
                              </>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {message.role === 'assistant' && (
                    <div className="flex items-start gap-4">
                      {/* AI Avatar */}
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>

                      {/* Message Content */}
                      <div style={{ flex: 1 }}>
                        {message.thinking && (
                          <ThinkingSection
                            steps={message.thinking.steps}
                            duration={message.thinking.duration}
                          />
                        )}

                        <div style={{
                          fontSize: '16px',
                          color: '#1F2937',
                          lineHeight: '1.6',
                          marginTop: message.thinking ? '12px' : '0',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {message.content}
                        </div>

                        {message.actions && (
                          <div style={{ marginTop: '12px' }}>
                            <ActionSummary
                              label={message.actions.label}
                              icon={message.actions.icon}
                              items={message.actions.items}
                            />
                          </div>
                        )}

                        {message.component && (
                          <div style={{ marginTop: '12px' }}>
                            {message.component}
                          </div>
                        )}

                        {/* Slide Preview - Show inline thumbnails */}
                        {message.slidePreview && message.slidePreview.length > 0 && (
                          <SlidePreviewInline
                            slides={message.slidePreview}
                            beforeSlides={message.beforeSlides}
                            showComparison={message.showComparison}
                            title={message.showComparison ? 'Before & After' : 'Updated Slides'}
                          />
                        )}

                        {/* Undo Button - Show for reversible actions */}
                        {message.undoAction && message.undoDescription && (
                          <UndoActionButton
                            onUndo={message.undoAction}
                            actionDescription={message.undoDescription}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isProcessing && thinkingSteps.length > 0 && (
                <ThinkingSection
                  steps={thinkingSteps}
                  duration=""
                />
              )}
            </div>

            {/* Chat Input Box - At bottom */}
            <div style={{
              padding: '0 24px 24px',
              maxWidth: '900px',
              margin: '0 auto',
              width: '100%'
            }}>
              <ChatInputWithMentions
                slides={artifactSlides || []}
                value={inputValue}
                onChange={setInputValue}
                onSubmit={(value, mentionedSlideIds, attachedImages) => {
                  handleSendMessage(value, mentionedSlideIds, attachedImages);
                }}
                placeholder="Ask Deckr..."
                disabled={isProcessing}
                showUploadButton={true}
                showToolsButton={false}
              />
            </div>
          </>
        )}
        {/* End MAIN CONTENT AREA */}

      </div>
      </div>
    </div>
  );
};

export default ChatLandingView;
