import React, { useState, useCallback } from 'react';
import ChatInterface from './ChatInterface';
import ThinkingSection, { ThinkingStep } from './ThinkingSection';
import ActionSummary, { ActionItem } from './ActionSummary';
import { Slide, StyleLibraryItem } from '../types';
import { analyzeNotesAndAskQuestions, generateSlidesWithContext, GenerationContext } from '../services/intelligentGeneration';
import { detectVibeFromNotes, getDesignerStylesForVibe, PresentationVibe } from '../services/vibeDetection';

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

interface ChatControllerProps {
  initialPrompt?: string;
  initialFiles?: File[];
  styleLibrary: StyleLibraryItem[];
  onDeckGenerated: (slides: Slide[]) => void;
  onCancel: () => void;
}

const ChatController: React.FC<ChatControllerProps> = ({
  initialPrompt = '',
  initialFiles = [],
  styleLibrary,
  onDeckGenerated,
  onCancel
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);

  // State from generation flow
  const [detectedVibe, setDetectedVibe] = useState<PresentationVibe | null>(null);
  const [generationPlan, setGenerationPlan] = useState<any>(null);
  const [thinkingStartTime, setThinkingStartTime] = useState<number>(0);


  /**
   * Add a message to the chat
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
   * Update thinking steps in real-time
   */
  const updateThinkingStep = useCallback((stepId: string, updates: Partial<ThinkingStep>) => {
    setThinkingSteps(prev =>
      prev.map(step => step.id === stepId ? { ...step, ...updates } : step)
    );
  }, []);

  /**
   * Add a new thinking step
   */
  const addThinkingStep = useCallback((step: ThinkingStep) => {
    setThinkingSteps(prev => [...prev, step]);
  }, []);

  /**
   * Main orchestration: Handle user's initial prompt
   */
  const handleUserPrompt = useCallback(async (userPrompt: string) => {
    console.log('🎯 ChatController: Processing user prompt:', userPrompt);

    // Add user message
    addMessage({
      role: 'user',
      content: userPrompt
    });

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
        estimatedTime: `${Math.ceil(analysis.suggestions.recommendedSlideCount * 0.5)}-${Math.ceil(analysis.suggestions.recommendedSlideCount * 0.5) + 2} minutes`
      };
      setGenerationPlan(plan);

      updateThinkingStep('step-plan', { status: 'completed' });

      // Calculate thinking duration
      const duration = ((Date.now() - thinkingStartTime) / 1000).toFixed(1);

      // Add AI response with plan
      addMessage({
        role: 'assistant',
        content: `I'll create a **${plan.slideCount}-slide deck** with a ${plan.style} style for ${plan.audience}.\n\n**Plan:**\n${plan.reasoning}\n\n**Estimated viewing time:** ${plan.estimatedTime}\n\nWould you like me to proceed with generating these slides?`,
        thinking: {
          steps: [...thinkingSteps, { ...step3, status: 'completed' }],
          duration: `${duration}s`
        }
      });

      // TODO: Add plan approval buttons inline
      // For now, auto-approve after a brief pause
      setTimeout(() => {
        handleGenerateSlides(plan);
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error processing prompt:', error);

      addMessage({
        role: 'assistant',
        content: `I encountered an error while analyzing your request: ${error.message}\n\nPlease try rephrasing your request or provide more details.`
      });
    } finally {
      setIsProcessing(false);
    }
  }, [thinkingStartTime, thinkingSteps, addMessage, addThinkingStep, updateThinkingStep]);

  /**
   * Generate slides based on approved plan
   */
  const handleGenerateSlides = useCallback(async (plan: any) => {
    console.log('🎨 ChatController: Generating slides...', plan);

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

      const designerStyles = getDesignerStylesForVibe(detectedVibe!);
      const selectedStyle = designerStyles[0]; // Use first recommended style

      updateThinkingStep('step-style', {
        status: 'completed',
        content: `Selected ${selectedStyle.name} theme`
      });

      // Step 2: Generating slides
      const generatedSlides: Slide[] = [];

      for (let i = 0; i < plan.slideCount; i++) {
        const step: ThinkingStep = {
          id: `step-slide-${i}`,
          title: `Generating slide ${i + 1}/${plan.slideCount}`,
          status: 'active',
          type: 'generating' // This will show SlideGenerationLoader
        };
        addThinkingStep(step);

        // Simulate slide generation (replace with actual generation)
        await new Promise(resolve => setTimeout(resolve, 500));

        // TODO: Replace with actual slide generation
        generatedSlides.push({
          id: `slide-${i}`,
          src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          history: []
        });

        updateThinkingStep(`step-slide-${i}`, { status: 'completed' });
      }

      const duration = ((Date.now() - thinkingStartTime) / 1000).toFixed(1);

      // Add completion message with action summary
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
            changes: '+142' // Placeholder
          }))
        }
      });

      // Pass slides to parent → switches to Editor view
      onDeckGenerated(generatedSlides);

    } catch (error: any) {
      console.error('❌ Error generating slides:', error);

      addMessage({
        role: 'assistant',
        content: `I encountered an error while generating slides: ${error.message}\n\nPlease try again.`
      });
    } finally {
      setIsProcessing(false);
    }
  }, [detectedVibe, thinkingStartTime, thinkingSteps, addMessage, addThinkingStep, updateThinkingStep, onDeckGenerated]);

  // Process initial prompt or files on mount
  React.useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleUserPrompt(initialPrompt);
    } else if (initialFiles && initialFiles.length > 0) {
      handleFileUpload(initialFiles);
    }
  }, []);

  /**
   * Handle file uploads (PDF/PowerPoint)
   */
  const handleFileUpload = useCallback(async (files: File[]) => {
    console.log('📁 ChatController: Processing uploaded files:', files);

    // Add user message
    addMessage({
      role: 'user',
      content: `Uploaded ${files.length} file(s): ${files.map(f => f.name).join(', ')}`
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

      // TODO: Extract content from PDF/PowerPoint using pdfjsLib or similar
      // For now, we'll use a placeholder
      const extractedContent = `Sample content extracted from ${files[0].name}`;

      updateThinkingStep('step-process-files', {
        status: 'completed',
        content: `Processed ${files.length} file(s)`
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
      // const analysis = await analyzeNotesAndAskQuestions(extractedContent);

      // Placeholder analysis
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
        content: `Analyzed ${files.length} slide(s) from upload`
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

      // Calculate thinking duration
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

      // TODO: Add plan approval buttons inline
      // For now, auto-approve after a brief pause
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
  }, [thinkingStartTime, thinkingSteps, addMessage, addThinkingStep, updateThinkingStep]);

  return (
    <ChatInterface
      messages={messages}
      isProcessing={isProcessing}
      onSendMessage={handleUserPrompt}
      onCancel={onCancel}
    />
  );
};

export default ChatController;
