import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatInterface from './ChatInterface';
import ThinkingSection, { ThinkingStep } from './ThinkingSection';
import ActionSummary, { ActionItem } from './ActionSummary';
import ModeSelectionCards from './ModeSelectionCards';
import PlanDisplay from './PlanDisplay';
import SlidePreviewInline from './SlidePreviewInline';
import UndoActionButton from './UndoActionButton';
import ChatInputWithMentions from './ChatInputWithMentions';
import VariationThumbnailGrid from './VariationThumbnailGrid';
import ArtifactsVariationView from './ArtifactsVariationView';
import ChatSidebar from './ChatSidebar';
import { Slide, StyleLibraryItem, StoredChatMessage} from '../types';
import { analyzeNotesAndAskQuestions, generateSlidesWithContext, GenerationContext } from '../services/intelligentGeneration';
import { detectVibeFromNotes, getDesignerStylesForVibe, getDesignerStyleById, generateStylePromptModifier, PresentationVibe } from '../services/vibeDetection';
import { createSlideFromPrompt, findBestStyleReferenceFromPrompt, executeSlideTask } from '../services/geminiService';
import { saveChat, getUserChats, getChat, batchAddToStyleLibrary } from '../services/firestoreService';
import { indexDeckToRAG, isRAGServiceAvailable } from '../services/ragService';
import { selectReferenceSlidesForDeck, SlideSpec } from '../services/slideSelectionAgent';
import { SavedChat } from '../types';
import { useUsageValidation } from '../hooks/useUsageValidation';
import { useAuth } from '../contexts/AuthContext';

// PDF.js library type declaration (loaded via CDN in index.html)
declare const pdfjsLib: any;

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

  // Props for variation selection mode
  onVariationModeChange?: (mode: 'normal' | 'variation-selection') => void;
  onSetPendingVariations?: (variations: string[]) => void;
  onSetVariationTargetSlide?: (slideId: string, slideName: string) => void;

  // Props for deck library
  onOpenDeckLibrary?: () => void;

  // Props for style library
  onStyleLibraryUpdated?: () => void;  // Callback when style library changes
  onClearStyleLibrary?: () => void;     // Callback to clear all style library items
}

/**
 * Helper: Launder image through canvas to ensure it's a clean base64 data URL
 */
const launderImageSrc = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
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
      } catch (error) {
        reject(new Error(`Failed to process image: ${(error as Error).message}`));
      }
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
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
  onUndoLastChange,
  onVariationModeChange,
  onSetPendingVariations,
  onSetVariationTargetSlide,
  onOpenDeckLibrary,
  onStyleLibraryUpdated,
  onClearStyleLibrary
}) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

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

  // Usage tracking hook
  const { trackUsage, validateGeneration } = useUsageValidation();

  // Deck Upload State (for deck customization workflow)
  const [uploadedDeckSlides, setUploadedDeckSlides] = useState<Slide[]>([]);
  const [uploadedAssets, setUploadedAssets] = useState<Array<{
    id: string;
    name: string;
    type: 'image' | 'logo';
    src: string;
  }>>([]);
  const [awaitingCustomizationPrompt, setAwaitingCustomizationPrompt] = useState(false);

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
   * Execute a customization plan with uploaded files and assets
   */
  const executeCustomizationPlan = useCallback(async (
    plan: any,
    allUploadedFiles: Slide[],
    assets: Array<{ id: string; name: string; type: string; src: string }>
  ) => {
    setIsProcessing(true);
    setThinkingStartTime(Date.now());
    setThinkingSteps([]);

    try {
      const { createSlideFromPrompt: createSlide } = await import('../services/geminiService');

      // Start with all uploaded slides (the complete deck)
      const slidesMap = new Map(allUploadedFiles.map(slide => [slide.id, slide]));
      const newSlides: Slide[] = [];

      for (let i = 0; i < plan.tasks.length; i++) {
        const task = plan.tasks[i];

        if (task.type === 'EDIT_SLIDE') {
          addThinkingStep({
            id: `edit-${i}`,
            title: `Editing ${task.slideName}`,
            status: 'active',
            type: 'generating'
          });

          const targetSlide = allUploadedFiles.find(s => s.id === task.slideId);
          if (targetSlide) {
            // Check if LLM mentioned any asset filenames in the prompt
            let logoImage: string | null = null;
            let customImage: string | null = null;

            for (const asset of assets) {
              const promptLower = task.detailed_prompt.toLowerCase();
              const assetNameLower = asset.name.toLowerCase();

              if (promptLower.includes(assetNameLower) || promptLower.includes(asset.name)) {
                // LLM mentioned this file - check context to determine if logo or custom image
                const isLogo = promptLower.includes('logo') || assetNameLower.includes('logo');
                if (isLogo) {
                  logoImage = asset.src;
                } else {
                  customImage = asset.src;
                }
              }
            }

            const { images } = await createSlide(
              targetSlide.originalSrc,
              task.detailed_prompt,
              false,
              [],
              undefined,
              null,
              logoImage,
              customImage
            );
            const finalImage = await launderImageSrc(images[0]);

            // Replace the slide in the map with the edited version
            slidesMap.set(task.slideId, {
              ...targetSlide,
              history: [...(targetSlide.history || [targetSlide.originalSrc]), finalImage]
            });
          }

          updateThinkingStep(`edit-${i}`, { status: 'completed' });

        } else if (task.type === 'ADD_SLIDE') {
          addThinkingStep({
            id: `add-${i}`,
            title: `Adding ${task.newSlideName}`,
            status: 'active',
            type: 'generating'
          });

          // Use style library or first uploaded slide as reference
          let referenceSrc: string | null = null;
          if (styleLibrary && styleLibrary.length > 0) {
            const { findBestStyleReferenceFromPrompt } = await import('../services/geminiService');
            const bestRef = await findBestStyleReferenceFromPrompt(task.detailed_prompt, styleLibrary);
            referenceSrc = bestRef?.src || null;
          } else if (allUploadedFiles.length > 0) {
            referenceSrc = allUploadedFiles[0].originalSrc;
          }

          // Check if LLM mentioned any asset filenames in the prompt
          let logoImage: string | null = null;
          let customImage: string | null = null;

          for (const asset of assets) {
            const promptLower = task.detailed_prompt.toLowerCase();
            const assetNameLower = asset.name.toLowerCase();

            if (promptLower.includes(assetNameLower) || promptLower.includes(asset.name)) {
              // LLM mentioned this file - check context to determine if logo or custom image
              const isLogo = promptLower.includes('logo') || assetNameLower.includes('logo');
              if (isLogo) {
                logoImage = asset.src;
              } else {
                customImage = asset.src;
              }
            }
          }

          const { images } = await createSlide(
            referenceSrc,
            task.detailed_prompt,
            false,
            [],
            undefined,
            null,
            logoImage,
            customImage
          );
          const finalImage = await launderImageSrc(images[0]);

          // Add new slide to separate array
          newSlides.push({
            id: `slide-${Date.now()}-${i}`,
            originalSrc: finalImage,
            history: [finalImage],
            name: task.newSlideName
          });

          updateThinkingStep(`add-${i}`, { status: 'completed' });
        }
      }

      // Build final deck: all original slides (with edits applied) + new slides
      const generatedSlides = [...Array.from(slidesMap.values()), ...newSlides];

      const duration = ((Date.now() - thinkingStartTime) / 1000).toFixed(1);

      addMessage({
        role: 'assistant',
        content: `✅ Done! Customized ${generatedSlides.length} slide(s).`,
        thinking: {
          steps: thinkingSteps.map(s => ({ ...s, status: 'completed' as const })),
          duration: `${duration}s`
        },
        slidePreview: generatedSlides
      });

      // Pass to parent
      if (onSlidesGenerated) onSlidesGenerated(generatedSlides);
      if (onDeckGenerated) onDeckGenerated(generatedSlides);

      // Clear uploads
      setUploadedDeckSlides([]);
      setUploadedAssets([]);
      setIsProcessing(false);

    } catch (error: any) {
      console.error('Error executing plan:', error);
      addMessage({
        role: 'assistant',
        content: `I encountered an error: ${error.message}\n\nPlease try again.`
      });
      setIsProcessing(false);
    }
  }, [addMessage, addThinkingStep, updateThinkingStep, thinkingStartTime, thinkingSteps, onSlidesGenerated, onDeckGenerated, launderImageSrc, styleLibrary]);

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

  /**
   * Helper: Upload files to style library
   */
  const handleUploadToStyleLibrary = async (files: FileList): Promise<void> => {
    if (!user) {
      alert('Please log in to upload to style library');
      return;
    }

    const fileArray = Array.from(files);
    const newItems: StyleLibraryItem[] = [];

    try {
      // Process each file
      for (const file of fileArray) {
        if (file.type === 'application/pdf') {
          // PDF processing → extract all pages
          const fileReader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            fileReader.onload = async (event) => {
              try {
                const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;

                for (let i = 1; i <= pdf.numPages; i++) {
                  const page = await pdf.getPage(i);
                  const viewport = page.getViewport({ scale: 1.5 });
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;

                  if (context) {
                    await page.render({ canvasContext: context, viewport }).promise;
                    const id = `${file.name}-p${i}-${Date.now()}`;
                    const src = canvas.toDataURL('image/png');
                    const name = pdf.numPages === 1
                      ? file.name.replace('.pdf', '')
                      : `${file.name.replace('.pdf', '')} - Page ${i}`;

                    // Validate src before pushing
                    if (src && src.startsWith('data:image')) {
                      newItems.push({ id, src, name });
                      console.log(`✅ Processed page ${i}: ${name}`);
                    } else {
                      console.error(`❌ Failed to generate valid image for page ${i}`);
                    }
                  }
                }
                resolve();
              } catch (err) {
                console.error("PDF processing error:", err);
                reject(new Error("Failed to process PDF file."));
              }
            };
            fileReader.onerror = () => reject(new Error("Failed to read PDF file."));
            fileReader.readAsArrayBuffer(file);
          });
        } else if (file.type.startsWith('image/')) {
          // Image processing → direct upload
          const fileReader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            fileReader.onload = async (event) => {
              try {
                const src = event.target?.result as string;
                const laundered = await launderImageSrc(src);
                const id = `${file.name}-${Date.now()}`;
                const name = file.name.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');

                // Validate laundered src before pushing
                if (laundered && laundered.startsWith('data:image')) {
                  newItems.push({ id, src: laundered, name });
                  console.log(`✅ Processed image: ${name}`);
                } else {
                  console.error(`❌ Failed to launder image: ${file.name}`);
                }
                resolve();
              } catch (err) {
                console.error("Image processing error:", err);
                reject(new Error("Failed to process image file."));
              }
            };
            fileReader.onerror = () => reject(new Error("Failed to read image file."));
            fileReader.readAsDataURL(file);
          });
        }
      }

      // Upload to Firestore
      if (newItems.length > 0) {
        console.log(`📤 Uploading ${newItems.length} items to style library...`);
        console.log(`🔍 Sample item:`, newItems[0]);

        // Double-check all items have valid src fields
        const invalidItems = newItems.filter(item => !item.src || !item.src.startsWith('data:image'));
        if (invalidItems.length > 0) {
          console.error(`❌ Found ${invalidItems.length} invalid items:`, invalidItems);
          throw new Error(`${invalidItems.length} items have invalid image data`);
        }

        const uploadedItems = await batchAddToStyleLibrary(user.uid, newItems);
        console.log(`✅ Successfully uploaded ${newItems.length} items`);

        // Index to RAG for semantic search (non-blocking)
        console.log(`🧠 Indexing ${uploadedItems.length} slides to RAG...`);
        indexDeckToRAG(
          `upload-${Date.now()}`,
          uploadedItems.map(item => ({ imageUrl: item.src, name: item.name })),
          user.uid,
          'private'
        ).then(ragResult => {
          if (ragResult.success) {
            console.log(`✅ RAG indexing complete: ${ragResult.deckId}`);
          } else {
            console.warn(`⚠️ RAG indexing failed (non-blocking): ${ragResult.error}`);
          }
        }).catch(err => {
          console.warn(`⚠️ RAG indexing error (non-blocking):`, err);
        });

        // Notify parent to refresh style library
        onStyleLibraryUpdated?.();

        alert(`✅ Successfully added ${newItems.length} item${newItems.length > 1 ? 's' : ''} to your style library!`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`❌ Error uploading files: ${(error as Error).message}`);
      throw error;
    }
  };

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

    // Check if user has uploaded ANY files - pass them as context to LLM
    if (uploadedDeckSlides.length > 0 || uploadedAssets.length > 0) {
      setIsProcessing(true);
      setThinkingStartTime(Date.now());
      setThinkingSteps([]);

      try {
        // Let LLM handle everything via generateDeckExecutionPlan
        const { generateDeckExecutionPlan, createSlideFromPrompt: createSlide } = await import('../services/geminiService');

        // Build context with uploaded files
        const allUploadedFiles = [
          ...uploadedDeckSlides,
          ...uploadedAssets.map(asset => ({
            id: asset.id,
            originalSrc: asset.src,
            history: [asset.src],
            name: asset.name
          }))
        ];

        // Show detailed analysis steps
        addThinkingStep({
          id: 'analyze-deck',
          title: `Analyzing deck: ${uploadedDeckSlides.length} slides`,
          status: 'active',
          type: 'thinking'
        });

        if (uploadedAssets.length > 0) {
          addThinkingStep({
            id: 'analyze-assets',
            title: `Analyzing uploaded assets: ${uploadedAssets.map(a => a.name).join(', ')}`,
            status: 'pending',
            type: 'thinking'
          });
        }

        addThinkingStep({
          id: 'understand-intent',
          title: 'Understanding your customization request',
          status: 'pending',
          type: 'thinking'
        });

        addThinkingStep({
          id: 'create-plan',
          title: 'Analyzing slides visually and creating execution plan',
          status: 'pending',
          type: 'thinking'
        });

        // Simulate analysis progress
        await new Promise(resolve => setTimeout(resolve, 500));
        updateThinkingStep('analyze-deck', { status: 'completed' });

        if (uploadedAssets.length > 0) {
          updateThinkingStep('analyze-assets', { status: 'active' });
          await new Promise(resolve => setTimeout(resolve, 500));
          updateThinkingStep('analyze-assets', { status: 'completed' });
        }

        updateThinkingStep('understand-intent', { status: 'active' });
        await new Promise(resolve => setTimeout(resolve, 300));
        updateThinkingStep('understand-intent', { status: 'completed' });

        updateThinkingStep('create-plan', { status: 'active' });

        // Build extended prompt with asset info for LLM
        let extendedPrompt = userPrompt;
        if (uploadedAssets.length > 0) {
          const assetList = uploadedAssets.map(a => `- ${a.name}`).join('\n');
          extendedPrompt += `\n\n**User also uploaded these image files:**\n${assetList}\n\nAnalyze these images to determine their purpose (logo, slide to recreate, reference, etc.) and use them appropriately in your plan.`;
        }

        // Generate execution plan - LLM decides what to do (with vision!)
        const plan = await generateDeckExecutionPlan(
          extendedPrompt,
          allUploadedFiles.map(s => ({ id: s.id, name: s.name, src: s.originalSrc }))
        );

        // Log master agent output for debugging
        console.log('🤖 MASTER AGENT (Gemini 3 Pro) OUTPUT:');
        console.log('Thought Process:', plan.thought_process);
        console.log('Tasks:', JSON.stringify(plan.tasks, null, 2));

        updateThinkingStep('create-plan', { status: 'completed' });

        console.log('🎯 Execution Plan:', plan);

        const duration = ((Date.now() - thinkingStartTime) / 1000).toFixed(1);

        // Show the plan to the user for approval
        const editTasks = plan.tasks.filter((t: any) => t.type === 'EDIT_SLIDE');
        const addTasks = plan.tasks.filter((t: any) => t.type === 'ADD_SLIDE');

        addMessage({
          role: 'assistant',
          content: `I've analyzed your request and created a customization plan:`,
          thinking: {
            steps: thinkingSteps.map(s => ({ ...s, status: 'completed' as const })),
            duration: `${duration}s`
          },
          component: (
            <div style={{
              marginTop: '16px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '20px'
            }}>
              {/* Plan Summary */}
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  📋 Customization Plan
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#6B7280', lineHeight: '1.5' }}>
                  {plan.companyName && `Customizing for ${plan.companyName} • `}
                  {editTasks.length} slide{editTasks.length !== 1 ? 's' : ''} to modify
                  {addTasks.length > 0 && ` • ${addTasks.length} new slide${addTasks.length !== 1 ? 's' : ''} to add`}
                </p>
              </div>

              {/* Tasks List */}
              <div style={{
                background: '#F9FAFB',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  {editTasks.length > 0 && (
                    <div style={{ marginBottom: addTasks.length > 0 ? '12px' : 0 }}>
                      <div style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        ✏️ Slides to Modify:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#6B7280' }}>
                        {editTasks.map((task: any, idx: number) => (
                          <li key={idx} style={{ marginBottom: '6px' }}>
                            <strong>{task.slideName}</strong> - {task.detailed_prompt.substring(0, 120)}...
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {addTasks.length > 0 && (
                    <div>
                      <div style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                        ➕ New Slides to Add:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#6B7280' }}>
                        {addTasks.map((task: any, idx: number) => (
                          <li key={idx} style={{ marginBottom: '6px' }}>
                            <strong>{task.newSlideName}</strong> - {task.detailed_prompt.substring(0, 120)}...
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-start' }}>
                <button
                  onClick={() => {
                    executeCustomizationPlan(plan, allUploadedFiles, uploadedAssets);
                  }}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  ✓ Approve & Execute Plan
                </button>
                <button
                  onClick={() => {
                    addMessage({
                      role: 'assistant',
                      content: `I'd be happy to modify the plan! What would you like to change?\n\nYou can tell me about:\n• Which slides to modify\n• What changes to make\n• Additional slides to add\n• Or describe any other adjustments`
                    });
                  }}
                  style={{
                    padding: '12px 24px',
                    background: '#F3F4F6',
                    color: '#4B5563',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                >
                  ✎ Modify Plan
                </button>
              </div>
            </div>
          )
        });

        setIsProcessing(false);
        return;

      } catch (error: any) {
        console.error('Error processing files:', error);
        addMessage({
          role: 'assistant',
          content: `I encountered an error: ${error.message}\n\nPlease try again.`
        });
        setIsProcessing(false);
        return;
      }
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

          // Store ALL variations (not just first one)
          return {
            ...slide,
            slideId,
            variations: result.images,  // All 3 variations
            variationPrompts: result.prompts,
            taskPrompt: userPrompt
          };
        });

        const editedSlides = (await Promise.all(editPromises)).filter(Boolean) as any[];

        // If single slide with variations, trigger artifacts variation view
        if (editedSlides.length === 1 && editedSlides[0].variations) {
          const targetSlide = artifactSlides.find(s => s.id === editedSlides[0].slideId);
          const slideName = targetSlide?.name || `Slide ${artifactSlides.findIndex(s => s.id === editedSlides[0].slideId) + 1}`;

          // Trigger variation selection mode in artifacts panel via callbacks
          onSetPendingVariations?.(editedSlides[0].variations);
          onSetVariationTargetSlide?.(editedSlides[0].slideId, slideName);
          onVariationModeChange?.('variation-selection');

          // Add message about variation generation
          addMessage({
            role: 'assistant',
            content: `✨ Created 3 variations! Review them in the artifacts panel and choose your favorite.`
          });
        } else {
          // Multiple slides - apply first variation to all automatically
          if (editedSlides.length > 1) {
            // Apply first variation (Professional style) to each slide
            editedSlides.forEach(editedSlide => {
              if (editedSlide.variations && editedSlide.variations.length > 0 && onSlideUpdate) {
                const firstVariation = editedSlide.variations[0];
                onSlideUpdate(editedSlide.slideId, {
                  history: [...(artifactSlides.find(s => s.id === editedSlide.slideId)?.history || []), firstVariation]
                });
              }
            });

            // Confirm changes
            addMessage({
              role: 'assistant',
              content: `✅ Updated ${editedSlides.length} slides with Professional style! Each slide was generated with 3 variations, and I applied the Professional version to all.`
            });
          } else {
            // Fallback for edge cases
            addMessage({
              role: 'assistant',
              content: `✨ Created ${editedSlides.length > 0 && editedSlides[0].variations ? editedSlides[0].variations.length : 3} variations for ${editedSlides.length} slide${editedSlides.length > 1 ? 's' : ''}!`,
              component: editedSlides.length === 1 && editedSlides[0].variations ? (
                <VariationThumbnailGrid
                  variations={editedSlides[0].variations}
                  slideId={editedSlides[0].slideId}
                  onApplyVariation={(slideId, variationIndex) => {
                    // Apply the selected variation
                    const selectedImage = editedSlides[0].variations[variationIndex];
                    if (onSlideUpdate) {
                      onSlideUpdate(slideId, {
                        history: [...(artifactSlides.find(s => s.id === slideId)?.history || []), selectedImage]
                      });
                    }
                    // Add confirmation message
                    addMessage({
                      role: 'assistant',
                      content: `✅ Applied variation ${variationIndex + 1} to the slide!`
                    });
                  }}
                />
              ) : undefined
            });
          }
        }
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
        userPrompt: inputValue,
        mode: mode  // Store mode in plan to avoid stale closure bugs
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

    // VALIDATE usage limits BEFORE generation
    const validation = await validateGeneration(plan.slideCount);

    if (!validation.allowed) {
      addMessage({
        role: 'assistant',
        content: `❌ ${validation.error}\n\nYou have used ${validation.currentUsage}/${validation.limit} slides this month.${validation.isTrialExpired ? '\n\n🚀 Upgrade to continue generating slides!' : '\n\nUpgrade your plan to generate more slides.'}`
      });
      setIsProcessing(false); // Reset processing state on early return
      return;
    }

    // Show warning if approaching limit
    if (validation.warning) {
      console.warn(`⚠️ ${validation.warning}`);
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

      // Step 2.5: Brand colors (disabled - use Deckr.ai branding only)
      // User only wants Deckr.ai branding, not target customer brand research
      let brandTheme = null;

      // Step 3: Get designer style configuration
      const designerStyle = selectedStyle.id ? getDesignerStyleById(selectedStyle.id) : null;

      // Build style library for AI Style Scout
      // Only use style library in 'template' mode, not in 'crazy' (scratch) mode
      let styleLibraryForScout: StyleLibraryItem[] = [];
      if (plan.mode === 'template' && styleLibrary.length > 0) {
        // Use all reference slides from style library
        styleLibraryForScout = styleLibrary;
        console.log(`✅ Template mode: Using ${styleLibraryForScout.length} reference slides from style library`);
      } else if (plan.mode === 'crazy') {
        console.log('✅ Start from Scratch mode: Skipping style library (generating fresh designs)');
      }

      // Add designer-specific prompt modifier
      const stylePromptModifier = designerStyle
        ? generateStylePromptModifier(designerStyle)
        : '';

      // Step 3.5: Use intelligent agent to select references from RAG
      let agentReferenceMap: Map<number, string> = new Map();

      if (plan.mode === 'template' && styleLibraryForScout.length > 0) {
        console.log('🔍 Checking RAG service availability for agent matching...');
        const ragAvailable = await isRAGServiceAvailable();
        console.log(`🔍 RAG service available: ${ragAvailable}`);

        if (ragAvailable) {
          const agentStep: ThinkingStep = {
            id: 'step-agent-matching',
            title: 'AI Agent selecting best references from library',
            status: 'active',
            type: 'thinking'
          };
          addThinkingStep(agentStep);

          try {
            console.log('🤖 Starting AGENT-BASED reference matching (RAG + ADK)...');

            // Convert slide descriptions to SlideSpec format
            const slideSpecs: SlideSpec[] = slideDescriptions.slice(0, plan.slideCount).map((desc, idx) => ({
              slideNumber: idx + 1,
              slideType: desc.split('\n')[0] || 'content',
              headline: desc.split('\n')[0] || '',
              content: desc,
              visualDescription: desc,
            }));

            // Run intelligent agent to select references
            const agentResults = await selectReferenceSlidesForDeck(slideSpecs, {
              maxIterationsPerSlide: 3,
              concurrency: 2,
            });

            // Build reference map - use fresh URLs from style library when possible
            // RAG URLs may have expired tokens, so we match by path and use fresh style library URLs
            const getFreshUrl = (ragUrl: string): string => {
              // Extract the path portion from the RAG URL (before ?alt=media)
              const ragPathMatch = ragUrl.match(/\/o\/([^?]+)/);
              if (!ragPathMatch) return ragUrl;
              const ragPath = decodeURIComponent(ragPathMatch[1]);

              // Find matching URL in style library by path
              for (const item of styleLibraryForScout) {
                const itemPathMatch = item.src.match(/\/o\/([^?]+)/);
                if (itemPathMatch) {
                  const itemPath = decodeURIComponent(itemPathMatch[1]);
                  if (itemPath === ragPath) {
                    console.log(`🔄 Refreshed URL for: ${ragPath.split('/').pop()}`);
                    return item.src; // Fresh URL with valid token
                  }
                }
              }

              // No match found - use original (may fail if token expired)
              console.log(`⚠️ No fresh URL found for: ${ragPath.split('/').pop()}`);
              return ragUrl;
            };

            for (const [slideNum, result] of agentResults) {
              const ragUrl = result.selectedSlide.imageUrl;
              // Skip invalid URLs (like "No suitable slide found")
              if (!ragUrl || !ragUrl.startsWith('http')) {
                console.log(`⚠️ Slide ${slideNum}: Invalid RAG URL, will use Style Scout`);
                continue;
              }
              const freshUrl = getFreshUrl(ragUrl);
              // Only use if we found a fresh URL (not the stale RAG URL)
              if (freshUrl !== ragUrl) {
                agentReferenceMap.set(slideNum, freshUrl);
              } else {
                console.log(`⚠️ Slide ${slideNum}: No fresh URL match, will use Style Scout`);
              }
            }

            const matchedCount = agentReferenceMap.size;
            const totalCount = slideDescriptions.slice(0, plan.slideCount).length;
            const fallbackCount = totalCount - matchedCount;

            console.log(`✅ Agent matched ${matchedCount}/${totalCount} slides to references`);
            if (fallbackCount > 0) {
              console.log(`📋 ${fallbackCount} slides will use Style Scout fallback`);
            }

            updateThinkingStep('step-agent-matching', {
              status: 'completed',
              content: matchedCount === totalCount
                ? `AI agent selected ${matchedCount} optimal references`
                : `AI agent matched ${matchedCount}/${totalCount} slides (${fallbackCount} will use Style Scout)`
            });
          } catch (agentError) {
            console.warn('⚠️ Agent matching completely failed, falling back to Style Scout:', agentError);
            updateThinkingStep('step-agent-matching', {
              status: 'completed',
              content: 'Using Style Scout fallback for all slides'
            });
          }
        }
      }

      // Step 4: Generate actual slides with AI
      const generatedSlides: Slide[] = [];
      const totalSlides = Math.min(slideDescriptions.length, plan.slideCount);
      const BATCH_SIZE = totalSlides; // Generate all slides in parallel for maximum speed

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

          try {
            // Get reference: prefer agent selection, fallback to Style Scout
            let referenceSrc: string | null = null;
            if (agentReferenceMap.has(slideNumber)) {
              // Use agent-selected reference from RAG
              referenceSrc = agentReferenceMap.get(slideNumber)!;
              console.log(`🤖 Slide ${slideNumber}: Using agent-selected reference`);
            } else if (styleLibraryForScout.length > 0) {
              // Fallback to Style Scout
              const bestReference = await findBestStyleReferenceFromPrompt(
                description,
                styleLibraryForScout
              );
              referenceSrc = bestReference?.src || null;
              console.log(`🔍 Slide ${slideNumber}: Using Style Scout reference`);
            }

            // Apply designer style modifier to prompt
            const finalPrompt = description + stylePromptModifier;

            const { images } = await createSlideFromPrompt(
              referenceSrc,
              finalPrompt,
              false,
              [],
              undefined,
              brandTheme,  // theme - use researched brand colors
              null,  // logoImage
              currentAttachedImages.length > 0 ? currentAttachedImages[0] : null  // customImage - use first uploaded image
            );

            const finalImage = await launderImageSrc(images[0]);

            updateThinkingStep(`step-slide-${slideNumber}`, { status: 'completed' });

            return {
              success: true as const,
              slide: {
                id: `slide-${Date.now()}-${slideNumber}`,
                originalSrc: finalImage,
                history: [finalImage],
                name: description.substring(0, 40).split('\n')[0] || `Slide ${slideNumber}`,
              }
            };
          } catch (error) {
            // Individual slide failure should not crash entire batch
            console.error(`[Batch] Slide ${slideNumber} failed:`, error);
            updateThinkingStep(`step-slide-${slideNumber}`, {
              status: 'error',
              content: (error as Error).message || 'Generation failed'
            });
            return {
              success: false as const,
              error: (error as Error).message || 'Generation failed'
            };
          }
        });

        // Use Promise.allSettled to allow partial batch success
        const batchResults = await Promise.allSettled(batchPromises);

        // Extract successful slides
        const successfulSlides = batchResults
          .filter((result): result is PromiseFulfilledResult<{success: true; slide: Slide}> =>
            result.status === 'fulfilled' && result.value.success
          )
          .map(result => result.value.slide);

        generatedSlides.push(...successfulSlides);

        // Log any failures
        const failedCount = batchResults.length - successfulSlides.length;
        if (failedCount > 0) {
          console.warn(`⚠️ ${failedCount} slide(s) failed in this batch`);
        }
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

      // Track usage for generated slides
      await trackUsage(generatedSlides.length);
      console.log(`✅ Tracked ${generatedSlides.length} slides for usage`);

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
  }, [detectedVibe, thinkingStartTime, thinkingSteps, addMessage, addThinkingStep, updateThinkingStep, onDeckGenerated, onSlidesGenerated, onUndoLastChange, currentAttachedImages, trackUsage, validateGeneration, generationMode, styleLibrary]);

  /**
   * Handler: Execute deck customization plan
   */
  const handleExecuteCustomization = useCallback(async (customizationPlan: any) => {
    console.log('🎨 Executing customization plan:', customizationPlan);

    setIsProcessing(true);
    setThinkingStartTime(Date.now());
    setThinkingSteps([]);

    try {
      // Start with uploaded slides
      let customizedSlides = [...uploadedDeckSlides];

      // Process each customization action
      for (let i = 0; i < customizationPlan.customizations.length; i++) {
        const customization = customizationPlan.customizations[i];
        const stepNum = i + 1;

        if (customization.action === 'modify') {
          // Modify existing slide
          const slideIndex = customization.slideIndex || 0;
          const step: ThinkingStep = {
            id: `step-modify-${stepNum}`,
            title: `Modifying slide ${slideIndex + 1}`,
            status: 'active',
            type: 'generating'
          };
          addThinkingStep(step);

          const slideToModify = customizedSlides[slideIndex];
          if (slideToModify) {
            const currentSrc = slideToModify.history && slideToModify.history.length > 0
              ? slideToModify.history[slideToModify.history.length - 1]
              : slideToModify.originalSrc;

            // Enhance description with detailed prompt
            const enhancedPrompt = `${customization.description}

IMPORTANT DESIGN REQUIREMENTS:
- Professional, modern design with clean layout
- Clear visual hierarchy (PRIMARY headline 60-80pt, SECONDARY subhead 24-36pt, TERTIARY body 16-20pt)
- Strategic use of whitespace (60-70% empty space for breathing room)
- High-contrast typography (dark text on light background or vice versa)
- Tasteful use of brand colors and imagery
- Avoid clutter - every element must serve a purpose
- Create a designer-grade slide that looks professionally crafted`;

            // Check if any uploaded assets are referenced in description
            const referencedAsset = uploadedAssets.find(asset =>
              customization.description.toLowerCase().includes(asset.name.toLowerCase())
            );

            const { images } = await createSlideFromPrompt(
              currentSrc,  // Use existing slide as reference
              enhancedPrompt,
              false,
              [],
              undefined,
              null,
              referencedAsset?.type === 'logo' ? referencedAsset.src : null,  // Pass logo if referenced
              referencedAsset?.type === 'image' ? referencedAsset.src : null  // Pass custom image if referenced
            );

            const finalImage = await launderImageSrc(images[0]);
            customizedSlides[slideIndex] = {
              ...slideToModify,
              history: [...(slideToModify.history || [slideToModify.originalSrc]), finalImage]
            };
          }

          updateThinkingStep(`step-modify-${stepNum}`, { status: 'completed' });

        } else if (customization.action === 'add') {
          // Add new slide
          const step: ThinkingStep = {
            id: `step-add-${stepNum}`,
            title: `Adding new slide: ${customization.description.substring(0, 30)}...`,
            status: 'active',
            type: 'generating'
          };
          addThinkingStep(step);

          // Use style library if available, otherwise use uploaded deck for consistency
          let referenceSrc: string | null = null;
          if (styleLibrary && styleLibrary.length > 0) {
            const { findBestStyleReferenceFromPrompt } = await import('../services/geminiService');
            const bestReference = await findBestStyleReferenceFromPrompt(
              customization.description,
              styleLibrary
            );
            referenceSrc = bestReference?.src || null;
          } else if (customizedSlides.length > 0) {
            // Fallback: Use first slide from uploaded deck for brand consistency
            const firstSlide = customizedSlides[0];
            referenceSrc = firstSlide.history && firstSlide.history.length > 0
              ? firstSlide.history[firstSlide.history.length - 1]
              : firstSlide.originalSrc;
          }

          // Enhance description with detailed design prompt
          const enhancedPrompt = `${customization.description}

IMPORTANT DESIGN REQUIREMENTS:
- Professional, modern design with clean layout
- Clear visual hierarchy (PRIMARY headline 60-80pt, SECONDARY subhead 24-36pt, TERTIARY body 16-20pt)
- Strategic use of whitespace (60-70% empty space for breathing room)
- High-contrast typography (dark text on light background or vice versa)
- Tasteful use of brand colors and imagery
- Avoid clutter - every element must serve a purpose
- Create a designer-grade slide that looks professionally crafted

CONTENT FOCUS: ${customization.description}`;

          // Check if any uploaded assets are referenced in description
          const referencedAsset = uploadedAssets.find(asset =>
            customization.description.toLowerCase().includes(asset.name.toLowerCase())
          );

          const { images } = await createSlideFromPrompt(
            referenceSrc,
            enhancedPrompt,
            false,
            [],
            undefined,
            null,
            referencedAsset?.type === 'logo' ? referencedAsset.src : null,  // Pass logo if referenced
            referencedAsset?.type === 'image' ? referencedAsset.src : null  // Pass custom image if referenced
          );

          const finalImage = await launderImageSrc(images[0]);
          const newSlide: Slide = {
            id: `slide-${Date.now()}-${stepNum}`,
            originalSrc: finalImage,
            history: [finalImage],
            name: customization.description.substring(0, 40).split('\n')[0] || `New Slide ${stepNum}`
          };

          // Insert at appropriate position
          if (customization.position === 'end') {
            customizedSlides.push(newSlide);
          } else if (customization.position === 'after' && customization.positionIndex !== undefined) {
            customizedSlides.splice(customization.positionIndex + 1, 0, newSlide);
          } else if (customization.position === 'before' && customization.positionIndex !== undefined) {
            customizedSlides.splice(customization.positionIndex, 0, newSlide);
          } else {
            customizedSlides.push(newSlide);
          }

          updateThinkingStep(`step-add-${stepNum}`, { status: 'completed' });

        } else if (customization.action === 'recreate') {
          // Recreate/redesign an uploaded image as a slide
          const step: ThinkingStep = {
            id: `step-recreate-${stepNum}`,
            title: `Recreating slide: ${customization.description.substring(0, 30)}...`,
            status: 'active',
            type: 'generating'
          };
          addThinkingStep(step);

          // Find the asset that should be used as the slide source
          const sourceAsset = uploadedAssets.find(asset =>
            customization.assetName && asset.name.includes(customization.assetName)
          ) || uploadedAssets[0];  // Fallback to first asset if not specified

          if (sourceAsset) {
            // Enhance description with detailed design prompt
            const enhancedPrompt = `${customization.description}

IMPORTANT DESIGN REQUIREMENTS:
- Professional, modern design with clean layout
- Clear visual hierarchy (PRIMARY headline 60-80pt, SECONDARY subhead 24-36pt, TERTIARY body 16-20pt)
- Strategic use of whitespace (60-70% empty space for breathing room)
- High-contrast typography (dark text on light background or vice versa)
- Tasteful use of brand colors and imagery
- Avoid clutter - every element must serve a purpose
- Create a designer-grade slide that looks professionally crafted

CONTENT FOCUS: ${customization.description}`;

            const { images } = await createSlideFromPrompt(
              sourceAsset.src,  // Use uploaded image as reference
              enhancedPrompt,
              false,
              [],
              undefined,
              null,
              null,
              null
            );

            const finalImage = await launderImageSrc(images[0]);
            const newSlide: Slide = {
              id: `slide-${Date.now()}-${stepNum}`,
              originalSrc: finalImage,
              history: [finalImage],
              name: customization.description.substring(0, 40).split('\n')[0] || `Recreated Slide ${stepNum}`
            };

            // Insert at appropriate position
            if (customization.position === 'end') {
              customizedSlides.push(newSlide);
            } else if (customization.position === 'after' && customization.positionIndex !== undefined) {
              customizedSlides.splice(customization.positionIndex + 1, 0, newSlide);
            } else if (customization.position === 'before' && customization.positionIndex !== undefined) {
              customizedSlides.splice(customization.positionIndex, 0, newSlide);
            } else {
              customizedSlides.push(newSlide);
            }
          }

          updateThinkingStep(`step-recreate-${stepNum}`, { status: 'completed' });

        } else if (customization.action === 'remove') {
          // Remove slide
          const slideIndex = customization.slideIndex || 0;
          customizedSlides.splice(slideIndex, 1);
        }
      }

      const duration = ((Date.now() - thinkingStartTime) / 1000).toFixed(1);

      // Show success message
      addMessage({
        role: 'assistant',
        content: `✅ Successfully customized ${customizedSlides.length} slides for ${customizationPlan.companyName || 'the customer'}!`,
        thinking: {
          steps: thinkingSteps.map(s => ({ ...s, status: 'completed' as const })),
          duration: `${duration}s`
        },
        slidePreview: customizedSlides,
        undoAction: onUndoLastChange,
        undoDescription: `Customized ${customizedSlides.length} slides`
      });

      // Pass slides to parent
      setTimeout(() => {
        if (onSlidesGenerated) {
          onSlidesGenerated(customizedSlides);
        }
        if (onDeckGenerated) {
          onDeckGenerated(customizedSlides);
        }

        // Clear upload state
        setUploadedDeckSlides([]);
        setUploadedAssets([]);
        setAwaitingCustomizationPrompt(false);
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error executing customization:', error);

      addMessage({
        role: 'assistant',
        content: `I encountered an error while customizing the deck: ${error.message}\n\nPlease try again.`
      });
    } finally {
      setIsProcessing(false);
    }
  }, [uploadedDeckSlides, uploadedAssets, styleLibrary, thinkingStartTime, thinkingSteps, addMessage, addThinkingStep, updateThinkingStep, onSlidesGenerated, onDeckGenerated, onUndoLastChange]);

  /**
   * Handler: Process file uploads (Silent attachment - like images)
   * Intelligently categorizes files:
   * - PDFs → deck slides (for customization reference)
   * - Single images → assets (logos, images to use in slides)
   */
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // DON'T activate chat mode yet - keep hero view visible
    // Only activate when user submits a prompt

    const newSlides: Slide[] = [];
    const newAssets: Array<{ id: string; name: string; type: 'image' | 'logo'; src: string }> = [];

    try {

      for (const file of fileArray) {
        if (file.type === 'application/pdf') {
          // PDF processing → deck slides
          const fileReader = new FileReader();
          await new Promise<void>((resolve, reject) => {
            fileReader.onload = async (event) => {
              try {
                const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
                const pdf = await pdfjsLib.getDocument(typedarray).promise;

                for (let i = 1; i <= pdf.numPages; i++) {
                  const page = await pdf.getPage(i);
                  const viewport = page.getViewport({ scale: 1.5 });
                  const canvas = document.createElement('canvas');
                  const context = canvas.getContext('2d');
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;

                  if (context) {
                    await page.render({ canvasContext: context, viewport }).promise;
                    const id = `${file.name}-p${i}-${Date.now()}`;
                    const src = canvas.toDataURL('image/png');
                    newSlides.push({ id, originalSrc: src, history: [src], name: `${file.name} - Slide ${i}` });
                  }
                }
                resolve();
              } catch (err) {
                console.error("PDF processing error:", err);
                reject(new Error("Failed to process PDF file."));
              }
            };
            fileReader.readAsArrayBuffer(file);
          });
        } else if (file.type.startsWith('image/')) {
          // Image processing → assets
          await new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              const id = `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const fileName = file.name.toLowerCase();

              // Intelligent type detection
              const isLogo = fileName.includes('logo') || fileName.includes('brand');

              newAssets.push({
                id,
                name: file.name,
                type: isLogo ? 'logo' : 'image',
                src
              });
              resolve();
            };
            reader.readAsDataURL(file);
          });
        }
      }

      // Store files silently - append to existing uploads
      if (newSlides.length > 0) {
        setUploadedDeckSlides(prev => [...prev, ...newSlides]);
        console.log('✅ Uploaded deck slides:', newSlides.length);
      }

      if (newAssets.length > 0) {
        setUploadedAssets(prev => [...prev, ...newAssets]);
        console.log('✅ Uploaded assets:', newAssets.length, newAssets.map(a => `${a.name} (${a.type})`));
      }

      // Don't add message or activate chat - just store files
      // User will see attachment indicator in hero view

    } catch (error: any) {
      console.error('❌ Error processing files:', error);
      addMessage({
        role: 'assistant',
        content: `I encountered an error while processing your files: ${error.message}`
      });
    }
  }, [addMessage]);

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
      {/* Chat Sidebar */}
      <ChatSidebar
        user={user}
        recentChats={savedChats}
        onNewChat={handleNewChat}
        onSelectChat={handleLoadChat}
        activeChatId={currentChatId}
        onOpenDeckLibrary={onOpenDeckLibrary}
        onUploadToStyleLibrary={handleUploadToStyleLibrary}
        onClearStyleLibrary={onClearStyleLibrary}
        onSignOut={handleSignOut}
        chatActive={chatActive}
      />

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

      {/* My Decks Button - Top Left (Hidden - now in ChatSidebar) */}
      {false && onOpenDeckLibrary && (
        <button
          onClick={onOpenDeckLibrary}
          className="btn-secondary"
          style={{
            position: 'fixed',
            top: '24px',
            left: '24px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(113, 69, 255, 0.2)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '500',
            color: '#7145FF',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(113, 69, 255, 0.1)',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(113, 69, 255, 0.05)';
            e.currentTarget.style.borderColor = 'rgba(113, 69, 255, 0.3)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(113, 69, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
            e.currentTarget.style.borderColor = 'rgba(113, 69, 255, 0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(113, 69, 255, 0.1)';
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          My Decks
        </button>
      )}

      {/* Content Layer - Gemini Pattern */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        overflow: 'hidden'
      }}>

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

                {/* Attachment indicator - shown when files uploaded */}
                {(uploadedDeckSlides.length > 0 || uploadedAssets.length > 0) && (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '8px'
                  }}>
                    {/* Deck slides attachment */}
                    {uploadedDeckSlides.length > 0 && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        background: '#F3F4F6',
                        borderRadius: '12px',
                        fontSize: '14px',
                        color: '#4B5563',
                        fontWeight: '500'
                      }}>
                        {/* Thumbnail preview of first slide */}
                        <img
                          src={uploadedDeckSlides[0].originalSrc}
                          alt="First slide preview"
                          style={{
                            width: '64px',
                            height: '36px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            border: '1px solid #E5E7EB',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                          }}
                        />
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          flex: 1
                        }}>
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Deck: {uploadedDeckSlides.length} slides</span>
                        </div>
                        <button
                          onClick={() => setUploadedDeckSlides([])}
                          style={{
                            marginLeft: 'auto',
                            padding: '4px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#9CA3AF'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#E5E7EB';
                            e.currentTarget.style.color = '#4B5563';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.color = '#9CA3AF';
                          }}
                          title="Remove deck"
                        >
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    )}

                    {/* Assets attachment */}
                    {uploadedAssets.length > 0 && (
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        {uploadedAssets.map((asset, idx) => (
                          <div key={asset.id} style={{
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 10px 6px 6px',
                            background: '#EEF2FF',
                            borderRadius: '12px',
                            fontSize: '13px',
                            color: '#4338CA',
                            fontWeight: '500',
                            border: '1px solid #C7D2FE'
                          }}>
                            <img
                              src={asset.src}
                              alt={asset.name}
                              style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '1px solid #C7D2FE',
                                background: 'white'
                              }}
                            />
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              maxWidth: '150px'
                            }}>
                              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {asset.name}
                              </span>
                            </div>
                            <button
                              onClick={() => setUploadedAssets(prev => prev.filter((_, i) => i !== idx))}
                              style={{
                                padding: '4px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#818CF8'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#C7D2FE';
                                e.currentTarget.style.color = '#4338CA';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#818CF8';
                              }}
                              title={`Remove ${asset.name}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
