import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatInterface from './ChatInterface';
import ThinkingSection, { ThinkingStep } from './ThinkingSection';
import ActionSummary, { ActionItem } from './ActionSummary';
import ModeSelectionCards from './ModeSelectionCards';
import PlanDisplay from './PlanDisplay';
import { Slide, StyleLibraryItem } from '../types';
import { analyzeNotesAndAskQuestions, generateSlidesWithContext, GenerationContext } from '../services/intelligentGeneration';
import { detectVibeFromNotes, getDesignerStylesForVibe, getDesignerStyleById, generateStylePromptModifier, PresentationVibe } from '../services/vibeDetection';
import { createSlideFromPrompt, findBestStyleReferenceFromPrompt } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../hooks/useCredits';
import { consumeCredits } from '../services/creditService';
import OutOfCreditsModal from './OutOfCreditsModal';
import LowCreditsWarning from './LowCreditsWarning';

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

interface ChatLandingViewProps {
  styleLibrary: StyleLibraryItem[];
  onDeckGenerated: (slides: Slide[]) => void;
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

const ChatLandingView: React.FC<ChatLandingViewProps> = ({ styleLibrary, onDeckGenerated }) => {
  // UI State
  const [inputValue, setInputValue] = useState('');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Gemini 2.0 Flash');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Auth & Credits
  const { user } = useAuth();
  const { credits, hasEnoughCredits, isLowOnCredits } = useCredits();
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);

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
  const [artifactSlides, setArtifactSlides] = useState<Slide[]>([]);

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
  const handleGenerate = useCallback(async () => {
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

    // Check if we're editing an existing plan
    if (awaitingPlanEdit && generationPlan) {
      setAwaitingPlanEdit(false);

      // Use AI to understand what they want to change
      const updatedPlan = { ...generationPlan };

      // Simple pattern matching for common edits
      const slideCountMatch = userPrompt.match(/(\d+)\s*slides?/i);
      if (slideCountMatch) {
        updatedPlan.slideCount = parseInt(slideCountMatch[1]);
      }

      if (userPrompt.match(/executive|professional|formal/i)) {
        updatedPlan.style = 'executive';
      } else if (userPrompt.match(/visual|creative|modern/i)) {
        updatedPlan.style = 'visual';
      } else if (userPrompt.match(/technical|detailed/i)) {
        updatedPlan.style = 'technical';
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

    // Check if user has style library → ask for mode selection
    const hasStyleLibrary = styleLibrary && styleLibrary.length > 0;

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
  }, [inputValue, addMessage, styleLibrary]);

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

    // Check if user is authenticated
    if (!user) {
      alert('Please sign in to generate slides');
      return;
    }

    // Check if user has enough credits for this generation
    const requiredCredits = plan.slideCount;
    if (!hasEnoughCredits(requiredCredits)) {
      console.log(`⚠️ Insufficient credits: need ${requiredCredits}, have ${credits}`);
      setShowOutOfCreditsModal(true);
      return;
    }

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
            null,
            null
          );

          const finalImage = await launderImageSrc(images[0]);

          // Consume 1 credit for this slide
          const creditResult = await consumeCredits(
            user.uid,
            1,
            `Generated slide ${slideNumber}: ${description.substring(0, 40)}...`,
            {
              slideId: `slide-${Date.now()}-${slideNumber}`,
              action: 'create'
            }
          );

          if (!creditResult.success) {
            console.error(`⚠️ Failed to consume credit for slide ${slideNumber}:`, creditResult.error);
            // Continue anyway - slide is already generated
          } else {
            console.log(`✅ Consumed 1 credit for slide ${slideNumber}. New balance: ${creditResult.newBalance}`);
          }

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

        // Update artifact slides panel
        setArtifactSlides(prev => [...prev, ...batchResults]);
      }

      const duration = ((Date.now() - thinkingStartTime) / 1000).toFixed(1);

      // Add completion message
      addMessage({
        role: 'assistant',
        content: `✅ Successfully generated ${plan.slideCount} slides! Opening the editor...`,
        thinking: {
          steps: thinkingSteps.map(s => ({ ...s, status: 'completed' as const })),
          duration: `${duration}s`
        },
        actions: {
          label: 'Generated Slides',
          icon: 'sparkles',
          items: generatedSlides.map((slide, i) => ({
            name: `Slide ${i + 1}`,
            status: 'completed' as const,
            changes: '+142'
          }))
        }
      });

      // Pass slides to parent → switches to Editor view
      setTimeout(() => {
        onDeckGenerated(generatedSlides);
      }, 1500);

    } catch (error: any) {
      console.error('❌ Error generating slides:', error);

      addMessage({
        role: 'assistant',
        content: `I encountered an error while generating slides: ${error.message}\n\nPlease try again.`
      });
    } finally {
      setIsProcessing(false);
    }
  }, [detectedVibe, thinkingStartTime, thinkingSteps, addMessage, addThinkingStep, updateThinkingStep, onDeckGenerated, user, hasEnoughCredits, credits, styleLibrary]);

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
              onClick={() => {
                setChatActive(false);
                setMessages([]);
                setInputValue('');
              }}
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

            {/* Sample Chat History Item */}
            <div
              style={{
                padding: '10px 12px',
                background: '#FFFFFF',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                fontSize: '14px',
                color: '#4B5563',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F0F1FF';
                e.currentTarget.style.color = '#4F46E5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.color = '#4B5563';
              }}
            >
              {messages.length > 0 && messages[0].content.substring(0, 30) + '...'}
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
          {/* Low Credits Warning Banner */}
          {user && isLowOnCredits() && (
            <LowCreditsWarning onBuyCredits={() => setShowOutOfCreditsModal(true)} />
          )}

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
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: '32px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  padding: '18px 24px',
                  minHeight: '72px',
                  transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.015)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px'
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
                {/* Plus Button */}
                <button
                  onClick={() => setShowUploadMenu(!showUploadMenu)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '20px',
                    background: 'transparent',
                    color: '#9CA3AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 100ms ease',
                    border: 'none',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F9FAFB';
                    e.currentTarget.style.color = '#4F46E5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#9CA3AF';
                  }}
                  title="Add files"
                >
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                {/* Textarea */}
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask Deckr"
                  rows={1}
                  style={{
                    flex: 1,
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
                      height: '40px',
                      flexShrink: 0
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
          </>
        )}
        </div>
        {/* End MAIN CONTENT AREA */}

      </div>

      {/* Edit Plan Modal */}
      {editingPlan && (
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
        onClick={() => setEditingPlan(null)}
        >
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#1F2937',
              marginBottom: '24px'
            }}>
              Edit Presentation Plan
            </h2>

            {/* Slide Count */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Number of Slides
              </label>
              <input
                type="number"
                value={editingPlan.slideCount}
                onChange={(e) => setEditingPlan({ ...editingPlan, slideCount: parseInt(e.target.value) || 1 })}
                min="1"
                max="50"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#6366F1'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
              />
            </div>

            {/* Style */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Presentation Style
              </label>
              <input
                type="text"
                value={editingPlan.style}
                onChange={(e) => setEditingPlan({ ...editingPlan, style: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#6366F1'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                placeholder="e.g., Professional, Modern, Creative"
              />
            </div>

            {/* Audience */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '8px'
              }}>
                Audience
              </label>
              <input
                type="text"
                value={editingPlan.audience}
                onChange={(e) => setEditingPlan({ ...editingPlan, audience: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '16px',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  outline: 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#6366F1'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#D1D5DB'}
                placeholder="e.g., Technical architects, Executives"
              />
            </div>

            {/* Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setEditingPlan(null)}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#6B7280',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleGenerateSlides(editingPlan);
                  setEditingPlan(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                Generate with Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Out of Credits Modal */}
      {user && (
        <OutOfCreditsModal
          isOpen={showOutOfCreditsModal}
          onClose={() => setShowOutOfCreditsModal(false)}
          onPurchase={(packageId) => {
            console.log('Purchase initiated for package:', packageId);
            // TODO: Integrate Stripe payment here
            setShowOutOfCreditsModal(false);
          }}
        />
      )}

      <style>{`
        @keyframes mesh-flow-1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(5%, -8%) scale(1.1);
          }
          66% {
            transform: translate(-3%, 5%) scale(0.95);
          }
        }

        @keyframes mesh-flow-2 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          33% {
            transform: translate(-6%, 4%) scale(1.05) rotate(2deg);
          }
          66% {
            transform: translate(4%, -6%) scale(0.98) rotate(-2deg);
          }
        }

        @keyframes mesh-flow-3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.7;
          }
          50% {
            transform: translate(-8%, 8%) scale(1.15);
            opacity: 0.4;
          }
        }

        @keyframes mesh-flow-4 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(10%, -10%) scale(1.08);
          }
        }

        @keyframes slideUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatLandingView;
