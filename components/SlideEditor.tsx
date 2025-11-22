import React, { useState, useEffect, useRef } from 'react';
import { Slide, StyleLibraryItem, DebugLog, DebugSession, LastSuccessfulEditContext, PersonalizationAction } from '../types';
import { getGenerativeVariations, getPersonalizationPlan, getPersonalizedVariationsFromPlan, getInpaintingVariations, remakeSlideWithStyleReference, createSlideFromPrompt, findBestStyleReferenceFromPrompt, detectClickedText, detectAllTextRegions, TextRegion } from '../services/geminiService';
import { incrementSlideCount } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import VariantSelector from './VariantSelector';
import DebugLogViewer from './DebugLogViewer';
import PersonalizationReviewModal from './PersonalizationReviewModal';
import AnchoredChatBubble from './AnchoredChatBubble';
import RightChatPanel from './RightChatPanel';

interface ActiveSlideViewProps {
  slide: Slide;
  onNewSlideVersion: (slideId: string, newSrc: string) => void;
  onUndo: (slideId: string) => void;
  onResetSlide: (slideId: string) => void;
  styleLibrary: StyleLibraryItem[];
  onToggleStyleLibrary: (slide: Slide) => void;
  onAddSessionToHistory: (session: DebugSession) => void;
  onSuccessfulSingleSlideEdit: (context: LastSuccessfulEditContext) => void;
  creationModeInfo: { insertAfterSlideId: string } | null;
  onCancelCreation: () => void;
  slides: Slide[];
  onAddNewSlide: (args: { newSlide: Slide, insertAfterSlideId: string }) => void;
}

const Spinner: React.FC<{ size?: string, className?: string }> = ({ size = 'h-5 w-5', className = '' }) => (
    <svg className={`animate-spin text-white ${size} ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const ResetIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186A1.002 1.002 0 0116.4 8.89l-1.044-.26a5.002 5.002 0 00-8.6-1.527l.096.097V5a1 1 0 01-2 0V3a1 1 0 011-1zm12 16a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186 1.002 1.002 0 01.35-1.39l1.044.26a5.002 5.002 0 008.6 1.527l-.096-.097V15a1 1 0 012 0v2a1 1 0 01-1 1z" clipRule="evenodd" />
    </svg>
);

const UndoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.707-10.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L9.414 11H13a1 1 0 100-2H9.414l1.293-1.293z" clipRule="evenodd" />
    </svg>
);

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-3 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const PendingIcon: React.FC = () => (
    <div className="h-4 w-4 mr-3 flex-shrink-0">
        <div className="h-2 w-2 bg-gray-400 rounded-full mx-auto my-1"></div>
    </div>
);


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

type ProgressStatus = 'pending' | 'in-progress' | 'complete';
interface ProgressStep {
    text: string;
    status: ProgressStatus;
}

const REDESIGN_KEYWORDS = ['remake', 'restyle', 'redesign', 'make it look', 'use the style of', 'make it nice', 'make it better', 'make it professional'];
type GenerationModel = 'gemini-3-pro-image-preview' | 'imagen-4.0-generate-001';

type WorkflowTab = 'edit' | 'personalize' | 'inpaint' | 'redesign';

const ActiveSlideView: React.FC<ActiveSlideViewProps> = ({
    slide,
    onNewSlideVersion,
    onUndo,
    onResetSlide,
    styleLibrary,
    onToggleStyleLibrary,
    onAddSessionToHistory,
    onSuccessfulSingleSlideEdit,
    creationModeInfo,
    onCancelCreation,
    slides,
    onAddNewSlide,
}) => {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<{ images: string[], prompts: string[], context: any } | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false); // Debug logs available via console, modal disabled by default
  const [isDeepMode, setIsDeepMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[] | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [selectedModel, setSelectedModel] = useState<GenerationModel>('gemini-3-pro-image-preview');
  const [activeTab, setActiveTab] = useState<WorkflowTab>('edit');

  const [prompt, setPrompt] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [personalizationPlanToReview, setPersonalizationPlanToReview] = useState<{ plan: PersonalizationAction[], originalImage: string } | null>(null);


  const [isInpaintingMode, setIsInpaintingMode] = useState(false);
  const [inpaintingPrompt, setInpaintingPrompt] = useState('');
  const [brushSize, setBrushSize] = useState(40);
  const imageRef = useRef<HTMLImageElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  // Box selector state
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);

  // Anchored AI Chat state
  const [anchoredChatPosition, setAnchoredChatPosition] = useState<{ x: number; y: number } | null>(null);
  const [isChatRefining, setIsChatRefining] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [rightPanelInitialMessage, setRightPanelInitialMessage] = useState<string>('');
  const [clickedTextRegion, setClickedTextRegion] = useState<TextRegion | null>(null);
  const [isDetectingText, setIsDetectingText] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  // Batch detection cache
  const [cachedTextRegions, setCachedTextRegions] = useState<TextRegion[]>([]);
  const [isBatchDetecting, setIsBatchDetecting] = useState(false);

  // Magnetic cursor state - text follows mouse when active
  const [magneticCursor, setMagneticCursor] = useState<{ active: boolean; textRegion: TextRegion | null }>({
    active: false,
    textRegion: null
  });
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);

  // Batch Edit Mode state
  const [isBatchEditMode, setIsBatchEditMode] = useState<boolean>(false);
  const [editQueue, setEditQueue] = useState<Array<{
    id: string;
    region: TextRegion;
    action: 'change' | 'remove';
    newText?: string;
  }>>([]);
  const [selectedTextForEdit, setSelectedTextForEdit] = useState<TextRegion | null>(null);
  const [batchChatHistory, setBatchChatHistory] = useState<Array<{ id: string; sender: 'user' | 'ai'; text: string; timestamp: number }>>([]);
  const previousSlideIdRef = useRef<string>(slide.id);
  const preservedChatPositionRef = useRef<{ x: number; y: number } | null>(null);

  const currentSrc = !creationModeInfo ? slide.history[slide.history.length - 1] : null;
  const hasHistory = !creationModeInfo && slide.history.length > 1;
  const isImagenSelected = selectedModel === 'imagen-4.0-generate-001';

  useEffect(() => {
    setPrompt('');
    setError(null);
    setCompanyWebsite('');
    setIsInpaintingMode(false);
    setInpaintingPrompt('');
    setUploadedImages([]);
    if (variants) setVariants(null);
    if (personalizationPlanToReview) setPersonalizationPlanToReview(null);

    // Clear batch detection cache and clicked region when slide changes
    console.log('[Slide Change] Clearing cache and clicked region from previous slide');
    setCachedTextRegions([]);
    setClickedTextRegion(null);
    setAnchoredChatPosition(null);
    setMagneticCursor({ active: false, textRegion: null });
    setCursorPosition(null);

    // Close right panel to avoid showing previous slide's context
    setIsRightPanelOpen(false);
    setRightPanelInitialMessage('');
  }, [slide?.id, slide?.history, creationModeInfo]);

  // Window-level mouse tracking for magnetic cursor (best practice for drag operations)
  useEffect(() => {
    if (!magneticCursor.active || !imageRef.current) {
      return;
    }

    console.log('[Magnetic Cursor] 🎯 Setting up window-level mouse tracking');

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      // Calculate position relative to image
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Keep tracking even if cursor goes outside image bounds
      setCursorPosition({ x, y });

      // Throttled logging (20% of events for visibility)
      if (Math.random() < 0.2) {
        console.log('[Magnetic Cursor] 🖱️ Mouse move:', { x, y, clientX: e.clientX, clientY: e.clientY });
      }
    };

    // Attach to window for robust tracking
    window.addEventListener('mousemove', handleWindowMouseMove);

    return () => {
      console.log('[Magnetic Cursor] 🧹 Cleaning up window mouse listener');
      window.removeEventListener('mousemove', handleWindowMouseMove);
    };
  }, [magneticCursor.active]);

  // Helper to convert any image URL to base64 data URL
  const convertToBase64 = async (imageSrc: string): Promise<string> => {
    // If already base64, return as-is
    if (imageSrc.startsWith('data:image/')) {
      return imageSrc;
    }

    // Convert Firebase/blob/http URL to base64 (CORS is now configured!)
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Now works with Firebase CORS
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image for conversion'));
      img.src = imageSrc;
    });
  };

  // Preserve chat position in batch mode
  useEffect(() => {
    if (isBatchEditMode && anchoredChatPosition) {
      preservedChatPositionRef.current = anchoredChatPosition;
      console.log('[Batch Chat] Preserved position:', anchoredChatPosition);
    }
  }, [anchoredChatPosition, isBatchEditMode]);

  // Restore chat position immediately if it gets cleared in batch mode
  useEffect(() => {
    if (isBatchEditMode && !anchoredChatPosition && preservedChatPositionRef.current) {
      console.log('[Batch Chat] Restoring preserved position:', preservedChatPositionRef.current);
      // Restore immediately to prevent any flicker or remount
      setAnchoredChatPosition(preservedChatPositionRef.current);
    }
  }, [anchoredChatPosition, isBatchEditMode]);

  // Pre-load text detection when slide loads (batch detection optimization)
  useEffect(() => {
    const isSlideSwitch = previousSlideIdRef.current !== slide.id;

    if (isSlideSwitch) {
      // Only clear batch edit state when switching to a DIFFERENT slide
      console.log('[Batch Detection] SYNC: Switching slides, clearing batch edit state');
      setIsBatchEditMode(false);
      setEditQueue([]);
      setSelectedTextForEdit(null);
      setAnchoredChatPosition(null);
      setBatchChatHistory([]);
      preservedChatPositionRef.current = null;
      previousSlideIdRef.current = slide.id;
    } else {
      // Same slide, just a new version - keep batch edit mode active if it was
      console.log('[Batch Detection] Same slide updated, preserving batch edit state');
    }

    // Always clear these on any change (slide switch OR version update)
    setCachedTextRegions([]);
    setClickedTextRegion(null);

    const preloadTextDetection = async () => {
      if (!currentSrc || creationModeInfo) return;

      console.log('[Batch Detection] Pre-loading text regions for current slide:', currentSrc.substring(0, 50));
      setIsBatchDetecting(true);

      try {
        // Convert image to base64 if needed (works with Firebase Storage now that CORS is fixed!)
        const base64Src = await convertToBase64(currentSrc);
        const regions = await detectAllTextRegions(base64Src);
        console.log(`[Batch Detection] Found ${regions.length} text regions for current slide:`, regions);
        setCachedTextRegions(regions);
      } catch (error) {
        console.error('[Batch Detection] Failed to pre-load text regions:', error);
        setCachedTextRegions([]); // Clear cache on error, will fallback to per-click detection
      } finally {
        setIsBatchDetecting(false);
      }
    };

    preloadTextDetection();
  }, [currentSrc, creationModeInfo, slide.id]);


  const handleProgressUpdate = (message: string) => {
    setProgressSteps(prevSteps => {
        const newSteps = [...prevSteps];
        const currentStepIndex = newSteps.findIndex(step => step.status === 'in-progress');

        if (currentStepIndex !== -1) {
            newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], text: message };
            return newSteps;
        }

        const nextPendingIndex = newSteps.findIndex(step => step.status === 'pending');
        if (nextPendingIndex !== -1) {
            for (let i = 0; i < nextPendingIndex; i++) {
                if (newSteps[i].status !== 'complete') {
                    newSteps[i] = { ...newSteps[i], status: 'complete' };
                }
            }
            newSteps[nextPendingIndex] = { text: message, status: 'in-progress' };
        }
        return newSteps;
    });
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !currentSrc) {
      setError('Please enter a prompt.');
      return;
    }
    setIsGenerating(true);
    setError(null);

    const isRedesignIntent = REDESIGN_KEYWORDS.some(keyword => prompt.toLowerCase().includes(keyword));

    // Redesign now works with OR without style library (no requirement!)
    const useStyleLibrary = isRedesignIntent && styleLibrary.length > 0;

    const initialSteps = isImagenSelected ?
        [ { text: 'Generating image with Imagen 4...', status: 'pending' as ProgressStatus } ] :
        (useStyleLibrary ?
            [
                { text: 'Analyzing original slide content...', status: 'pending' as ProgressStatus },
                { text: 'Selecting design references...', status: 'pending' as ProgressStatus },
                { text: 'Generating new designs...', status: 'pending' as ProgressStatus },
            ] :
            [
                { text: 'Analyzing current slide...', status: 'pending' as ProgressStatus },
                { text: 'Generating variations...', status: 'pending' as ProgressStatus },
            ]
        );

    if (isDeepMode && !isImagenSelected) {
        initialSteps.splice(useStyleLibrary ? 2 : 1, 0, { text: 'Verifying & correcting variations...', status: 'pending' as ProgressStatus });
    }
    initialSteps.push({ text: 'Finalizing images...', status: 'pending' });
    setProgressSteps(initialSteps);

    let session: Partial<DebugSession> = {
        id: `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        workflow: useStyleLibrary ? 'Remake' : 'Generate',
        initialPrompt: prompt,
        initialImage: currentSrc,
        model: selectedModel,
        deepMode: isDeepMode,
    };

    try {
        let resultLogs: DebugLog[] = [];

        if (useStyleLibrary) {
            // Redesign WITH style library
            // Convert currentSrc to base64 if needed (fixes Firebase Storage URL issue)
            const base64Src = await convertToBase64(currentSrc);
            const { images, logs, variationPrompts, bestReferenceSrc } = await remakeSlideWithStyleReference(prompt, base64Src, styleLibrary, isDeepMode, handleProgressUpdate);
            const context = {
                workflow: 'Remake',
                userIntentPrompt: prompt,
                styleReference: styleLibrary.find(s => s.src === bestReferenceSrc),
            };
            setVariants({ images, prompts: variationPrompts, context });
            if (isDebugMode) setDebugLogs(logs);
            resultLogs = logs;
            session = { ...session, status: 'Success', finalImages: images, logs, styleReferenceImage: bestReferenceSrc };
        } else {
            // Iterative editing OR redesign WITHOUT style library - use current slide as input
            // Convert currentSrc to base64 if needed (fixes Firebase Storage URL issue)
            const base64Src = await convertToBase64(currentSrc);
            const { images, logs, variationPrompts } = await getGenerativeVariations(selectedModel, prompt, base64Src, isDeepMode, handleProgressUpdate);
            const context = { workflow: 'Generate', userIntentPrompt: prompt };
            setVariants({ images, prompts: variationPrompts, context });
            if (isDebugMode) setDebugLogs(logs);
            resultLogs = logs;
            session = { ...session, status: 'Success', finalImages: images, logs };
        }

        setProgressSteps(prev => prev.map(step => ({ ...step, status: 'complete' })));
        await new Promise(resolve => setTimeout(resolve, 300));

    } catch (err: any) {
        setError(err.message || 'An unknown error occurred.');
        session = { ...session, status: 'Failed', error: err.message, logs: debugLogs || [], finalImages: [] };
    } finally {
      setIsGenerating(false);
      setProgressSteps([]);
      setProcessingStatus(null);
      setClickedTextRegion(null); // Clear the overlay after completion
      onAddSessionToHistory(session as DebugSession);
    }
  };

  const handlePersonalize = async () => {
    if (!prompt.trim() || !currentSrc) {
      setError('Please enter a personalization prompt with a company name or website.');
      return;
    }

    // Extract company/website from the prompt
    // Look for patterns like "for Apple", "for apple.com", "personalize for Microsoft", etc.
    const extractedCompany = prompt.match(/(?:for|to)\s+([a-zA-Z0-9.-]+(?:\.[a-zA-Z]{2,})?)/i)?.[1] ||
                            prompt.match(/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1] ||
                            prompt.split(/\s+/).pop() || '';

    if (!extractedCompany) {
      setError('Please include a company name or website in your prompt (e.g., "Personalize for Apple" or "Customize for nike.com")');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgressSteps([{ text: `Researching ${extractedCompany} & analyzing slide for personalization opportunities...`, status: 'in-progress' }]);

    try {
        // Convert currentSrc to base64 if needed (fixes Firebase Storage URL issue)
        console.log('[Personalize] Converting image to base64, currentSrc:', currentSrc.substring(0, 100));
        const base64Src = await convertToBase64(currentSrc);
        console.log('[Personalize] Conversion complete, base64 length:', base64Src.length, 'starts with:', base64Src.substring(0, 50));
        const plan = await getPersonalizationPlan(extractedCompany, base64Src);
        if (plan && plan.length > 0) {
            setPersonalizationPlanToReview({ plan, originalImage: currentSrc });
        } else {
            setError("The AI couldn't find anything to personalize on this slide. Try another slide or a different company.");
        }
    } catch (err: any) {
        setError(err.message || 'An unknown error occurred during personalization planning.');
    } finally {
        setIsGenerating(false);
        setProgressSteps([]);
    }
  };

  const handleAcceptPersonalizationPlan = async (plan: PersonalizationAction[]) => {
    if (!currentSrc) return;
    setPersonalizationPlanToReview(null);
    setIsGenerating(true);
    setError(null);

    const initialSteps: ProgressStep[] = [
        { text: 'Executing content plan...', status: 'pending' },
        { text: 'Generating personalized variations...', status: 'pending' },
    ];
    if (isDeepMode) {
        initialSteps.splice(1, 0, { text: 'Verifying & correcting variations...', status: 'pending' });
    }
    setProgressSteps(initialSteps);

     let session: Partial<DebugSession> = {
        id: `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        workflow: 'Personalize',
        initialPrompt: `Personalize for ${companyWebsite}`,
        initialImage: currentSrc,
        model: 'gemini-3-pro-image-preview',
        deepMode: isDeepMode,
    };

    try {
        // Convert currentSrc to base64 if needed (fixes Firebase Storage URL issue)
        console.log('[Personalize Generate] Converting image to base64, currentSrc:', currentSrc.substring(0, 100));
        const base64Src = await convertToBase64(currentSrc);
        console.log('[Personalize Generate] Conversion complete, base64 length:', base64Src.length, 'starts with:', base64Src.substring(0, 50));
        const { images, logs, variationPrompts } = await getPersonalizedVariationsFromPlan(plan, base64Src, isDeepMode, handleProgressUpdate);
        setProgressSteps(prev => prev.map(step => ({ ...step, status: 'complete' })));
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const context = { workflow: 'Personalize', userIntentPrompt: `Personalize for ${companyWebsite}` };
        setVariants({ images, prompts: variationPrompts, context });
        if (isDebugMode) {
            setDebugLogs(logs);
        }
        session = { ...session, status: 'Success', finalImages: images, logs };

    } catch (err: any) {
         setError(err.message || 'An unknown error occurred during personalization.');
        session = { ...session, status: 'Failed', error: err.message, logs: debugLogs || [], finalImages: [] };
    } finally {
         setIsGenerating(false);
        setProgressSteps([]);
        onAddSessionToHistory(session as DebugSession);
    }
  };

    const handleCreateNewSlide = async () => {
        if (!prompt.trim() || !creationModeInfo) {
            setError('Please enter a prompt for your new slide.');
            return;
        }
        setIsGenerating(true);
        setError(null);

        const initialSteps: ProgressStep[] = [
            { text: 'Analyzing your prompt...', status: 'pending' },
            { text: 'Scouting style library for the best reference...', status: 'pending' },
            { text: 'Generating new slide designs...', status: 'pending' },
        ];
        if (isDeepMode) {
            initialSteps.push({ text: 'Verifying & correcting slide...', status: 'pending' });
        }
        setProgressSteps(initialSteps);
        
        let session: Partial<DebugSession> = {
            id: `session-${Date.now()}`,
            timestamp: new Date().toISOString(),
            workflow: 'Create New Slide',
            initialPrompt: prompt,
            model: 'gemini-3-pro-image-preview',
            deepMode: isDeepMode,
        };

        try {
            const logs: DebugLog[] = [];
            
            handleProgressUpdate('Scouting style library for the best reference...');
            const bestReference = await findBestStyleReferenceFromPrompt(prompt, styleLibrary);
            
            const { images, prompts } = await createSlideFromPrompt(bestReference?.src ?? null, prompt, isDeepMode, logs, handleProgressUpdate);
            
            const context = { 
                workflow: 'Create New Slide', 
                userIntentPrompt: prompt,
                styleReference: bestReference 
            };
            setVariants({ images, prompts, context });
            if (isDebugMode) setDebugLogs(logs);
            session = { ...session, status: 'Success', finalImages: images, logs: logs, styleReferenceImage: bestReference?.src };
            setProgressSteps(prev => prev.map(step => ({ ...step, status: 'complete' })));
        } catch (err: any) {
            setError(err.message || 'An unknown error occurred while creating the slide.');
            session = { ...session, status: 'Failed', error: err.message, logs: debugLogs || [], finalImages: [] };
        } finally {
            setIsGenerating(false);
            setProgressSteps([]);
            onAddSessionToHistory(session as DebugSession);
        }
    };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      setError('Please upload image files only');
      return;
    }

    if (imageFiles.length !== files.length) {
      setError(`Uploaded ${imageFiles.length} images (${files.length - imageFiles.length} non-image files skipped)`);
    } else {
      setError(null);
    }

    const readPromises = imageFiles.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(results => {
      setUploadedImages(results);
    }).catch(err => {
      setError('Failed to read some image files');
      console.error('Image upload error:', err);
    });
  };

  const handleCreateFromUploadedImage = async () => {
    if (uploadedImages.length === 0 || !creationModeInfo) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Add all images as separate slides
      let insertAfter = creationModeInfo.insertAfterSlideId;

      for (let i = 0; i < uploadedImages.length; i++) {
        const imageSrc = uploadedImages[i];
        const newSlide: Slide = {
          id: `slide-${Date.now()}-${i}`,
          name: `Uploaded Slide ${uploadedImages.length > 1 ? i + 1 : ''}`.trim(),
          originalSrc: imageSrc,
          history: [imageSrc],
        };

        onAddNewSlide({ newSlide, insertAfterSlideId: insertAfter });

        // Update insertAfter to the newly created slide so next one goes after it
        insertAfter = newSlide.id;

        // Small delay to ensure unique timestamps
        if (i < uploadedImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      onCancelCreation();
    } catch (err: any) {
      setError(err.message || 'Failed to add uploaded images');
    } finally {
      setIsGenerating(false);
    }
  };


  const handleVariantSelected = async (variantSrc: string, variantIndex: number) => {
    if (!variants) return;

    const lastEdit: LastSuccessfulEditContext = {
      workflow: variants.context.workflow,
      userIntentPrompt: variants.context.userIntentPrompt,
      model: selectedModel,
      deepMode: isDeepMode,
      styleReference: variants.context.styleReference,
    };
    onSuccessfulSingleSlideEdit(lastEdit);

    setVariants(null); 
    try {
        const cleanSrc = await launderImageSrc(variantSrc);
        if (creationModeInfo) {
            const newSlide: Slide = {
                id: `slide-${Date.now()}`,
                name: prompt.substring(0, 30) || 'New Slide',
                originalSrc: cleanSrc,
                history: [cleanSrc],
            };
            onAddNewSlide({ newSlide, insertAfterSlideId: creationModeInfo.insertAfterSlideId });
            onCancelCreation();
        } else {
            onNewSlideVersion(slide.id, cleanSrc);

            // Invalidate cache - new image will trigger automatic re-detection via useEffect
            console.log('[Cache Invalidation] Clearing stale cache after variant selection');
            setCachedTextRegions([]);
        }
    } catch (err: any) {
        console.error("Error processing selected image:", err);
        setError(`Failed to finalize the selected image. ${err.message}`);
    }
  };


  const handleEnterInpaintingMode = () => {
    if (isGenerating || isInpaintingMode || isImagenSelected || creationModeInfo) return;
    setIsInpaintingMode(true);
  };

  useEffect(() => {
    if (isInpaintingMode && maskCanvasRef.current && imageRef.current) {
        const canvas = maskCanvasRef.current;
        const image = imageRef.current;
        const setCanvasSize = () => {
            const rect = image.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };
        setCanvasSize();
        window.addEventListener('resize', setCanvasSize);
        return () => window.removeEventListener('resize', setCanvasSize);
    }
  }, [isInpaintingMode]);

  const getMousePos = (canvas: HTMLCanvasElement, evt: React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
  };

  // Box selector handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsSelecting(true);
    setSelectionStart({ x, y });
    setSelectionBox(null); // Clear previous selection
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(selectionStart.x, currentX);
    const y = Math.min(selectionStart.y, currentY);
    const width = Math.abs(currentX - selectionStart.x);
    const height = Math.abs(currentY - selectionStart.y);

    setSelectionBox({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    setSelectionStart(null);
  };

  const handleClearMask = () => {
    setSelectionBox(null);
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Auto-delete selected area on Delete/Backspace
  const handleDeleteSelection = async () => {
    if (!selectionBox || !imageRef.current || !currentSrc || isGenerating) return;

    // Create mask from selection box
    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    const image = imageRef.current;
    const imageRect = image.getBoundingClientRect();

    // Set canvas size to match image display size
    canvas.width = imageRect.width;
    canvas.height = imageRect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw white rectangle for the selected area
    ctx.fillStyle = 'white';
    ctx.fillRect(selectionBox.x, selectionBox.y, selectionBox.width, selectionBox.height);

    // Automatically remove the selected area
    setIsGenerating(true);
    setError(null);

    const maskDataUrl = canvas.toDataURL('image/png');
    const initialSteps: ProgressStep[] = [{ text: 'Removing selected area...', status: 'pending' }];
    setProgressSteps(initialSteps);

    let session: Partial<DebugSession> = {
      id: `session-${Date.now()}`,
      timestamp: new Date().toISOString(),
      workflow: 'Inpaint',
      initialPrompt: 'remove this',
      initialImage: currentSrc,
      model: 'gemini-3-pro-image-preview',
      deepMode: isDeepMode,
    };

    try {
      const { images, logs, variationPrompts } = await getInpaintingVariations(
        'remove this area completely',
        currentSrc,
        maskDataUrl,
        isDeepMode,
        handleProgressUpdate
      );

      setProgressSteps(prev => prev.map(step => ({ ...step, status: 'complete' })));
      await new Promise(resolve => setTimeout(resolve, 300));

      const context = { workflow: 'Inpaint', userIntentPrompt: 'remove this' };
      setVariants({ images, prompts: variationPrompts, context });
      if (isDebugMode) {
        setDebugLogs(logs);
      }
      session = { ...session, status: 'Success', finalImages: images, logs };
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while removing the area.');
      session = { ...session, status: 'Failed', error: err.message, logs: debugLogs || [], finalImages: [] };
    } finally {
      setIsGenerating(false);
      setIsInpaintingMode(false);
      setSelectionBox(null);
      setProgressSteps([]);
      onAddSessionToHistory(session as DebugSession);
    }
  };

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isInpaintingMode || !selectionBox) return;

      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        handleDeleteSelection();
      } else if (e.key === 'Escape') {
        setIsInpaintingMode(false);
        setSelectionBox(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInpaintingMode, selectionBox, isGenerating]);

  const handleGenerateInpainting = async () => {
    if (!inpaintingPrompt.trim() || !maskCanvasRef.current || !currentSrc) {
      setError('Please paint an area and enter a prompt.');
      return;
    }

    // Ensure canvas has valid dimensions
    if (maskCanvasRef.current.width === 0 || maskCanvasRef.current.height === 0) {
      setError('Canvas not properly initialized. Please try again.');
      return;
    }

    setError(null);
    setIsGenerating(true);

    const context = maskCanvasRef.current.getContext('2d', { willReadFrequently: true });
    if (context) {
        const pixelBuffer = new Uint32Array(context.getImageData(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height).data.buffer);
        const hasDrawing = pixelBuffer.some(pixel => pixel !== 0);
        if (!hasDrawing) {
            setError('Please paint an area on the slide to edit before generating.');
            setIsGenerating(false);
            return;
        }
    }

    const maskDataUrl = maskCanvasRef.current.toDataURL('image/png');
    console.log('[Inpaint] Mask data URL length:', maskDataUrl.length);
    console.log('[Inpaint] Mask data URL prefix:', maskDataUrl.substring(0, 50));
    
    const initialSteps: ProgressStep[] = [{ text: 'Generating inpainting variations...', status: 'pending' }];
    if (isDeepMode) {
        initialSteps.push({ text: 'Verifying & correcting variations...', status: 'pending' });
    }
    setProgressSteps(initialSteps);

    let session: Partial<DebugSession> = {
        id: `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        workflow: 'Inpaint',
        initialPrompt: inpaintingPrompt,
        initialImage: currentSrc,
        model: 'gemini-3-pro-image-preview',
        deepMode: isDeepMode,
    };
    
    try {
        // Convert currentSrc to base64 if needed (fixes Firebase Storage URL issue)
        const base64Src = await convertToBase64(currentSrc);
        const { images, logs, variationPrompts } = await getInpaintingVariations(inpaintingPrompt, base64Src, maskDataUrl, isDeepMode, handleProgressUpdate);
        
        setProgressSteps(prev => prev.map(step => ({ ...step, status: 'complete' })));
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const context = { workflow: 'Inpaint', userIntentPrompt: inpaintingPrompt };
        setVariants({ images, prompts: variationPrompts, context });
        if (isDebugMode) {
            setDebugLogs(logs);
        }
        session = { ...session, status: 'Success', finalImages: images, logs };

    } catch (err: any) {
        setError(err.message || 'An unknown error occurred during inpainting.');
        session = { ...session, status: 'Failed', error: err.message, logs: debugLogs || [], finalImages: [] };
    } finally {
        setIsGenerating(false);
        setIsInpaintingMode(false);
        setProgressSteps([]);
        onAddSessionToHistory(session as DebugSession);
    }
  };

  // Helper to find text region at a specific point from cached regions
  // Added 2% padding on all sides for better hit detection on small text
  // Smart selection: picks longest text when multiple regions overlap
  const findTextAtPoint = (regions: TextRegion[], xPercent: number, yPercent: number): TextRegion | null => {
    const PADDING = 2; // 2% padding makes text regions more forgiving

    // Find all regions that contain the click point
    const overlappingRegions = regions.filter(r => {
      const inX = xPercent >= (r.boundingBox.xPercent - PADDING) &&
                  xPercent <= (r.boundingBox.xPercent + r.boundingBox.widthPercent + PADDING);
      const inY = yPercent >= (r.boundingBox.yPercent - PADDING) &&
                  yPercent <= (r.boundingBox.yPercent + r.boundingBox.heightPercent + PADDING);
      return inX && inY;
    });

    // If no regions found, return null
    if (overlappingRegions.length === 0) return null;

    // If only one region, return it
    if (overlappingRegions.length === 1) return overlappingRegions[0];

    // If multiple regions overlap, return the one with the longest text (most complete)
    const selected = overlappingRegions.reduce((longest, current) =>
      current.text.length > longest.text.length ? current : longest
    );

    console.log(`[Smart Selection] Found ${overlappingRegions.length} overlapping regions, selected longest: "${selected.text}"`);
    return selected;
  };

  // Magnetic cursor handlers - text follows mouse
  const handleActivateMagneticCursor = (textRegion: TextRegion) => {
    console.log('[Magnetic Cursor] 🚀 ACTIVATING for text:', textRegion.text);
    console.log('[Magnetic Cursor] 📦 Text region data:', textRegion);

    // Close chat bubble and hide purple overlay
    setAnchoredChatPosition(null);
    setClickedTextRegion(null); // Hide purple overlay, will show blue magnetic cursor overlay

    // Activate magnetic cursor - Set state FIRST before any calculations
    setMagneticCursor({ active: true, textRegion });

    // Initialize cursor position at the center of the text region
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      // Position relative to the IMAGE element (not viewport)
      const centerX = (textRegion.boundingBox.xPercent / 100) * rect.width + (textRegion.boundingBox.widthPercent / 100) * rect.width / 2;
      const centerY = (textRegion.boundingBox.yPercent / 100) * rect.height + (textRegion.boundingBox.heightPercent / 100) * rect.height / 2;
      setCursorPosition({ x: centerX, y: centerY });
      console.log('[Magnetic Cursor] ✅ Initialized position:', { x: centerX, y: centerY, imageWidth: rect.width, imageHeight: rect.height });
      console.log('[Magnetic Cursor] ✅ State set:', { active: true, textRegion: textRegion.text });
    } else {
      console.error('[Magnetic Cursor] ❌ imageRef.current is null!');
    }
  };

  const handleDropMagneticText = async (dropX: number, dropY: number) => {
    if (!magneticCursor.textRegion || !currentSrc || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const xPercent = (dropX / rect.width) * 100;
    const yPercent = (dropY / rect.height) * 100;

    const sourceRegion = magneticCursor.textRegion;
    const sourceX = sourceRegion.boundingBox.xPercent;
    const sourceY = sourceRegion.boundingBox.yPercent;

    // Calculate natural language direction
    const deltaX = xPercent - sourceX;
    const deltaY = yPercent - sourceY;

    // Determine horizontal direction (lower threshold for better detection)
    let horizontalDirection = '';
    if (Math.abs(deltaX) > 5) {
      if (deltaX < 0) {
        horizontalDirection = 'left';
      } else {
        horizontalDirection = 'right';
      }
    }

    // Determine simplified vertical direction
    let verticalPart = '';
    if (deltaY < -15) {
      verticalPart = 'top';
    } else if (deltaY > 15) {
      verticalPart = 'bottom';
    } else {
      verticalPart = 'center';
    }

    // Combine into natural language (e.g., "top-left", "center-right", "bottom")
    let direction = '';
    if (verticalPart === 'center' && horizontalDirection) {
      direction = horizontalDirection;
    } else if (horizontalDirection && verticalPart !== 'center') {
      direction = `${verticalPart}-${horizontalDirection}`;
    } else {
      direction = verticalPart;
    }

    console.log('[Magnetic Cursor] 📍 REPOSITIONING TEXT:', {
      text: sourceRegion.text,
      fromPosition: { x: `${sourceX.toFixed(1)}%`, y: `${sourceY.toFixed(1)}%` },
      toPosition: { x: `${xPercent.toFixed(1)}%`, y: `${yPercent.toFixed(1)}%` },
      distance: { deltaX: `${deltaX.toFixed(1)}%`, deltaY: `${deltaY.toFixed(1)}%` },
      naturalLanguage: direction
    });

    // Keep the blue box visible at drop position during processing for visual feedback
    // Don't reset magnetic cursor yet - keep it showing where text will be placed

    // Execute the move via AI using TWO-STEP INPAINTING
    setIsGenerating(true);
    setError(null);
    const truncatedText = sourceRegion.text.length > 20 ? sourceRegion.text.substring(0, 20) + '...' : sourceRegion.text;
    setProcessingStatus(`Deckr is moving "${truncatedText}" to ${direction}`);

    try {
      const base64Src = await convertToBase64(currentSrc);

      // STEP 1: Create mask to remove text from old position
      if (!maskCanvasRef.current || !imageRef.current) {
        throw new Error('Canvas reference not available');
      }

      const imgRect = imageRef.current.getBoundingClientRect();
      const canvas = maskCanvasRef.current;
      canvas.width = imgRect.width;
      canvas.height = imgRect.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Create black mask with white rectangle over old text position
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';

      const maskX = (sourceRegion.boundingBox.xPercent / 100) * canvas.width;
      const maskY = (sourceRegion.boundingBox.yPercent / 100) * canvas.height;
      const maskWidth = (sourceRegion.boundingBox.widthPercent / 100) * canvas.width;
      const maskHeight = (sourceRegion.boundingBox.heightPercent / 100) * canvas.height;

      ctx.fillRect(maskX, maskY, maskWidth, maskHeight);

      const base64Mask = canvas.toDataURL('image/png');

      console.log('[Magnetic Cursor - Step 1] Removing text from old position');

      // Inpaint to remove old text
      const { getInpaintingVariations } = await import('../services/geminiService');
      const removeResult = await getInpaintingVariations(
        `Remove the text "${sourceRegion.text}" and fill the area with appropriate background content that matches the surrounding area.`,
        base64Src,
        base64Mask,
        isDeepMode,
        (msg) => setProcessingStatus(msg)
      );

      if (!removeResult.images || removeResult.images.length === 0) {
        throw new Error('Failed to remove text');
      }

      const imageWithTextRemoved = removeResult.images[0];

      // STEP 2: Add text at new position
      // Keep same status message for simplicity
      console.log('[Magnetic Cursor - Step 2] Adding text at new position:', direction);

      const addPrompt = `Recreate the heading text "${sourceRegion.text}" in the ${direction} area of the slide. The text must maintain its EXACT original styling: same font family, same font size, same font weight (bold), same text color, and same text alignment. Position it clearly in the ${direction} area. All other slide elements must remain completely unchanged.`;

      const finalResult = await getGenerativeVariations(
        selectedModel,
        addPrompt,
        imageWithTextRemoved,
        isDeepMode,
        handleProgressUpdate,
        false
      );

      if (!finalResult || !finalResult.images || !finalResult.variationPrompts) {
        throw new Error('Invalid response from API: missing images or prompts');
      }

      const { images } = finalResult;

      if (images.length > 0) {
        const context = {
          workflow: 'Move (Inpaint)',
          userIntentPrompt: `Move "${sourceRegion.text}" to ${direction}`,
          model: selectedModel,
          deepMode: isDeepMode
        };

        if (images.length === 1) {
          onNewSlideVersion(slide.id, images[0]);
          onSuccessfulSingleSlideEdit(context);
          setCachedTextRegions([]); // Clear cache, will re-detect
        } else {
          setVariants({ images, prompts: finalResult.variationPrompts, context });
          onSuccessfulSingleSlideEdit(context);
        }
      }
    } catch (err: any) {
      console.error('[Magnetic Cursor] Error:', err);
      setError(err.message || 'Failed to move text');
    } finally {
      // Reset magnetic cursor visual feedback
      setMagneticCursor({ active: false, textRegion: null });
      setCursorPosition(null);
      setIsGenerating(false);
      setProcessingStatus(null);
    }
  };

  // Anchored AI Chat handlers
  const handleSlideClick = async (e: React.MouseEvent<HTMLImageElement>) => {
    // Don't open chat if in inpainting mode or if image generation is in progress
    console.log('[Edit Mode Click Debug]', {
      isInpaintingMode,
      isGenerating,
      creationModeInfo,
      hasCurrentSrc: !!currentSrc,
      hasImageRef: !!imageRef.current
    });

    if (isInpaintingMode || isGenerating || creationModeInfo || !currentSrc || !imageRef.current) {
      console.log('[Edit Mode Click] BLOCKED - one or more conditions failed');
      return;
    }

    console.log('[Edit Mode Click] PASSED - opening chat bubble');

    // Get click position relative to the image
    const rect = imageRef.current.getBoundingClientRect();
    const clickXImage = e.clientX - rect.left;
    const clickYImage = e.clientY - rect.top;

    // Get click position relative to viewport for chat bubble
    const clickX = e.clientX;
    const clickY = e.clientY;

    // Calculate click position as percentage for matching with cached regions
    const xPercent = (clickXImage / rect.width) * 100;
    const yPercent = (clickYImage / rect.height) * 100;

    // MAGNETIC CURSOR MODE: If active, drop text at clicked position
    if (magneticCursor.active) {
      console.log('[Magnetic Cursor] Dropping at position:', { xPercent, yPercent });
      handleDropMagneticText(clickXImage, clickYImage);
      return;
    }

    // NORMAL MODE: Regular click behavior
    setAnchoredChatPosition({ x: clickX, y: clickY });
    setClickedTextRegion(null);

    // Try using cached text regions first for instant response (0ms)
    if (cachedTextRegions.length > 0) {
      const region = findTextAtPoint(cachedTextRegions, xPercent, yPercent);
      setClickedTextRegion(region);
      console.log('[Click - Cache Hit] Found region instantly:', region);
      // No need to set isDetectingText since we're using cache
    } else {
      // Fallback to per-click detection if cache is empty (shouldn't happen after pre-load)
      console.log('[Click - Cache Miss] Falling back to per-click detection');
      setIsDetectingText(true);
      try {
        // Convert to base64 first (needed for Firebase URLs)
        const base64Src = await convertToBase64(currentSrc);
        const detectedRegion = await detectClickedText(
          base64Src,
          clickXImage,
          clickYImage,
          rect.width,
          rect.height
        );
        console.log('[Click - Fallback] Detected region:', detectedRegion);
        setClickedTextRegion(detectedRegion);
      } catch (error) {
        console.error('[Click - Fallback] Failed to detect clicked text:', error);
      } finally {
        setIsDetectingText(false);
      }
    }
  };

  // Helper to detect if message is a removal/deletion intent
  const isRemovalIntent = (message: string): boolean => {
    const lowerMessage = message.toLowerCase().trim();
    const removalKeywords = ['remove this', 'delete this', 'remove', 'delete', 'clear', 'erase', 'get rid'];
    return removalKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const handleChatSubmit = async (message: string) => {
    if (!message.trim() || !currentSrc) return;

    // In batch edit mode, keep the chat open. In regular mode, transition to right panel
    if (!isBatchEditMode) {
      setRightPanelInitialMessage(message);
      setAnchoredChatPosition(null); // Close floating bubble
      setIsRightPanelOpen(true); // Open right panel
    }
    // In batch mode, chat stays open at its current position

    setIsGenerating(true);
    setError(null);

    // Enhance the message with clicked text context for precision
    let enhancedMessage = message;

    if (clickedTextRegion?.text) {
      console.log('[Prompt Enhancement] Detected text from region:', clickedTextRegion.text);

      // Strip common prompt prefixes from user input to avoid redundancy
      let cleanMessage = message.trim();
      const prefixesToStrip = [
        /^change\s+to\s+/i,
        /^change\s+/i,
        /^update\s+to\s+/i,
        /^replace\s+with\s+/i,
        /^make\s+it\s+/i
      ];

      for (const prefix of prefixesToStrip) {
        cleanMessage = cleanMessage.replace(prefix, '');
      }

      // Enhance message with context about which text to change
      enhancedMessage = `Change the text "${clickedTextRegion.text}" to "${cleanMessage}"`;
      console.log('[Prompt Enhancement] Enhanced prompt with context:', enhancedMessage);
      const truncatedMsg = cleanMessage.length > 30 ? cleanMessage.substring(0, 30) + '...' : cleanMessage;
      setProcessingStatus(`Deckr is updating to "${truncatedMsg}"`);
    } else {
      console.log('[Prompt Enhancement] No text detected, using original message:', message);
      setProcessingStatus('Deckr is working on it...');
    }

    let session: Partial<DebugSession> = {
      timestamp: Date.now(),
      slideId: slide.id,
      slideNumber: slides.findIndex(s => s.id === slide.id) + 1,
      prompt: message,
      model: selectedModel,
      workflow: 'Edit',
      logs: [],
      status: 'In Progress',
      finalImages: [],
    };

    console.log('[API Call] About to call getGenerativeVariations with:', {
      model: selectedModel,
      enhancedMessage
    });

    try {
      // Convert currentSrc to base64 if needed (fixes Firebase Storage URL issue)
      const base64Src = await convertToBase64(currentSrc);
      console.log('[API Call] Converted image to base64, length:', base64Src.length);

      const result = await getGenerativeVariations(
        selectedModel,
        enhancedMessage,
        base64Src,
        isDeepMode,
        handleProgressUpdate,
        false // Use Design Analyst for quality text changes
      );

      console.log('[API Call] Raw response:', result);

      if (!result || !result.images || !result.variationPrompts) {
        throw new Error('Invalid response from API: missing images or prompts');
      }

      const { images, variationPrompts, logs } = result;

      console.log('[API Call] Received response:', { imageCount: images.length, promptCount: variationPrompts.length });

      if (images.length > 0) {
        const context = { workflow: 'Edit', userIntentPrompt: message, model: selectedModel, deepMode: isDeepMode };

        // If only 1 variation, auto-apply instead of showing selector
        if (images.length === 1) {
          onNewSlideVersion(slide.id, images[0]);
          onSuccessfulSingleSlideEdit(context);

          // Deduct credit for edit
          if (user?.uid) {
            try {
              await incrementSlideCount(user.uid, 1);
              console.log('[Credit] Deducted 1 credit for edit');
            } catch (error) {
              console.error('[Credit] Failed to deduct credit:', error);
            }
          }

          // Invalidate cache - new image will trigger automatic re-detection via useEffect
          console.log('[Cache Invalidation] Clearing stale cache after edit');
          // Delay cache clear to allow UI to update with new slide first
          setTimeout(() => {
            setCachedTextRegions([]);
          }, 100);

          // Keep batch edit mode active - user can continue editing
          if (isBatchEditMode) {
            console.log('[Batch Edit] Execution complete, staying in Edit Mode');
            // Clear the queue since changes were applied
            setEditQueue([]);
            // Keep selectedTextForEdit and anchoredChatPosition so chat stays open
            // DON'T exit batch mode - keep it active for continued editing
          }
        } else {
          setVariants({ images, prompts: variationPrompts, context });
          onSuccessfulSingleSlideEdit(context);

          // Deduct credit for edit
          if (user?.uid) {
            try {
              await incrementSlideCount(user.uid, 1);
              console.log('[Credit] Deducted 1 credit for edit');
            } catch (error) {
              console.error('[Credit] Failed to deduct credit:', error);
            }
          }

          // Delay cache clear to allow UI to update
          setTimeout(() => {
            setCachedTextRegions([]);
          }, 100);

          // Keep batch edit mode active - user can continue editing
          if (isBatchEditMode) {
            console.log('[Batch Edit] Execution complete, staying in Edit Mode');
            // Clear the queue since changes were applied
            setEditQueue([]);
            // Keep selectedTextForEdit and anchoredChatPosition so chat stays open
            // DON'T exit batch mode - keep it active for continued editing
          }
        }

        if (isDebugMode) {
          setDebugLogs(logs);
        }
        session = { ...session, status: 'Success', finalImages: images, logs };
      }

    } catch (err: any) {
      console.error('[API Call] Error occurred:', err);
      console.error('[API Call] Error message:', err.message);
      console.error('[API Call] Error stack:', err.stack);
      setError(err.message || 'An unknown error occurred while refining the slide.');
      session = { ...session, status: 'Failed', error: err.message, logs: [], finalImages: [] };
    } finally {
      setIsGenerating(false);
      setProgressSteps([]);
      setProcessingStatus(null);
      setClickedTextRegion(null); // Clear the overlay after completion
      onAddSessionToHistory(session as DebugSession);
    }
  };

  const handleCloseChat = () => {
    setAnchoredChatPosition(null);
    setClickedTextRegion(null); // Clear the text overlay
    // Exit batch edit mode when closing the chat
    if (isBatchEditMode) {
      setIsBatchEditMode(false);
      setEditQueue([]);
      setSelectedTextForEdit(null);
    }
  };

  // Batch Edit Mode: Queue management handlers
  const handleAddToQueue = (action: 'change' | 'remove', newText?: string) => {
    if (!selectedTextForEdit) return;

    const queueItem = {
      id: Date.now().toString(),
      region: selectedTextForEdit,
      action,
      newText
    };

    // Check if this text is already in the queue - update it instead of adding duplicate
    const existingIndex = editQueue.findIndex(q => q.region.text === selectedTextForEdit.text);
    if (existingIndex !== -1) {
      const updatedQueue = [...editQueue];
      updatedQueue[existingIndex] = queueItem;
      setEditQueue(updatedQueue);
      console.log('[Batch Edit] Updated existing queue item:', queueItem);
    } else {
      setEditQueue([...editQueue, queueItem]);
      console.log('[Batch Edit] Added to queue:', queueItem);
    }
  };

  const handleClearQueue = () => {
    setEditQueue([]);
    setSelectedTextForEdit(null); // Clear selected text so user can type general requests
    console.log('[Batch Edit] Cleared queue and selected text');
  };

  // Transition from floating bubble to right side (Canva-style)
  const handleTransitionToRightPanel = () => {
    console.log('[Batch Edit] Moving bubble to right side');
    // Move the bubble to the far right edge (completely off the slide)
    const rightPosition = {
      x: window.innerWidth - 360, // Closer to right edge
      y: 120 // Higher position for better visibility
    };
    setAnchoredChatPosition(rightPosition);
    // Keep Edit Mode active and queue visible
  };

  const handleCloseRightPanel = () => {
    setIsRightPanelOpen(false);
    setRightPanelInitialMessage('');
    setClickedTextRegion(null); // Clear the text overlay
  };

  const handleRightPanelSubmit = async (message: string) => {
    // Similar to handleChatSubmit but keeps panel open for conversation
    if (!message.trim() || !currentSrc) return;

    setIsGenerating(true);
    setError(null);

    // Apply same text detection enhancement
    let enhancedMessage = message;

    if (clickedTextRegion?.text) {
      console.log('[Right Panel] Detected text from region:', clickedTextRegion.text);

      // Strip common prompt prefixes from user input to avoid redundancy
      let cleanMessage = message.trim();
      const prefixesToStrip = [
        /^change\s+to\s+/i,
        /^change\s+/i,
        /^update\s+to\s+/i,
        /^replace\s+with\s+/i,
        /^make\s+it\s+/i
      ];

      for (const prefix of prefixesToStrip) {
        cleanMessage = cleanMessage.replace(prefix, '');
      }

      // Enhance message with context about which text to change
      enhancedMessage = `Change the text "${clickedTextRegion.text}" to "${cleanMessage}"`;
      console.log('[Right Panel] Enhanced prompt with context:', enhancedMessage);
      const truncatedMsg = cleanMessage.length > 30 ? cleanMessage.substring(0, 30) + '...' : cleanMessage;
      setProcessingStatus(`Deckr is updating to "${truncatedMsg}"`);
    } else {
      console.log('[Right Panel] No text detected, using original message:', message);
      setProcessingStatus('Deckr is working on it...');
    }

    let session: Partial<DebugSession> = {
      timestamp: Date.now(),
      slideId: slide.id,
      slideNumber: slides.findIndex(s => s.id === slide.id) + 1,
      prompt: enhancedMessage,
      model: selectedModel,
      workflow: 'Edit',
      logs: [],
      status: 'In Progress',
      finalImages: [],
    };

    try {
      // Convert currentSrc to base64 if needed (fixes Firebase Storage URL issue)
      const base64Src = await convertToBase64(currentSrc);

      const result = await getGenerativeVariations(
        selectedModel,
        enhancedMessage,
        base64Src,
        isDeepMode,
        handleProgressUpdate,
        false // Use Design Analyst for quality text changes
      );

      console.log('[Right Panel] Raw response:', result);

      if (!result || !result.images || !result.variationPrompts) {
        throw new Error('Invalid response from API: missing images or prompts');
      }

      const { images, variationPrompts, logs } = result;

      if (images.length > 0) {
        const context = { workflow: 'Edit', userIntentPrompt: message, model: selectedModel, deepMode: isDeepMode };

        // If only 1 variation, auto-apply instead of showing selector
        if (images.length === 1) {
          onNewSlideVersion(slide.id, images[0]);
          onSuccessfulSingleSlideEdit(context);

          // Invalidate cache - new image will trigger automatic re-detection via useEffect
          console.log('[Cache Invalidation] Clearing stale cache after edit');
          setCachedTextRegions([]);
        } else {
          setVariants({ images, prompts: variationPrompts, context });
          onSuccessfulSingleSlideEdit(context);
        }

        if (isDebugMode) {
          setDebugLogs(logs);
        }
        session = { ...session, status: 'Success', finalImages: images, logs };
      }

    } catch (err: any) {
      console.error('[API Call] Error occurred:', err);
      console.error('[API Call] Error message:', err.message);
      console.error('[API Call] Error stack:', err.stack);
      setError(err.message || 'An unknown error occurred while refining the slide.');
      session = { ...session, status: 'Failed', error: err.message, logs: [], finalImages: [] };
    } finally {
      setIsGenerating(false);
      setProgressSteps([]);
      setProcessingStatus(null);
      setClickedTextRegion(null); // Clear the overlay after completion
      onAddSessionToHistory(session as DebugSession);
    }
  };


  // Intent detection helper
  const detectIntent = (text: string): 'edit' | 'personalize' | 'redesign' | null => {
    const lowerText = text.toLowerCase();

    // Personalization keywords
    if (lowerText.match(/personalize|brand|company|customize|adapt for|tailor for/)) {
      return 'personalize';
    }

    // Redesign keywords
    if (REDESIGN_KEYWORDS.some(keyword => lowerText.includes(keyword))) {
      return 'redesign';
    }

    // Default to edit for any other input
    if (text.trim().length > 0) {
      return 'edit';
    }

    return null;
  };

  const detectedIntent = detectIntent(prompt);

  const renderStandardEditor = () => (
     <div className="w-full">
        <div className="flex justify-between items-center mb-3">
            <h3 className="font-display text-base font-semibold text-brand-text-primary truncate pr-2" title={slide.name}>
                Editing: <span className="gradient-text">{slide.name}</span>
            </h3>
            <div className="flex items-center gap-2">
                {hasHistory && (
                    <button onClick={() => onUndo(slide.id)} className="btn-icon group" disabled={isGenerating} title="Undo">
                        <UndoIcon />
                    </button>
                )}
                {hasHistory && (
                    <button onClick={() => onResetSlide(slide.id)} className="btn-icon group" disabled={isGenerating} title="Reset">
                        <ResetIcon/>
                    </button>
                )}
            </div>
        </div>

        {/* Intent-Based Smart Input and Examples - REMOVED, replaced with ChatInterface in Editor */}
    </div>
  );

  const renderCreationEditor = () => (
     <div className="w-full max-w-2xl mx-auto mt-6 flex-shrink-0">
         <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-brand-text-primary">
                Adding New Slide
            </h3>
        </div>
        <div className="bg-brand-surface p-4 rounded-xl border border-brand-border shadow-card space-y-6">
            {/* Option 1: AI Generation */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary-500" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                    <label className="text-sm font-medium text-brand-text-primary">✨ Generate with AI</label>
                </div>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the new slide you want to create... e.g., 'An agenda slide with 5 points'"
                    className="w-full p-3 text-sm bg-brand-background border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary transition-all resize-none text-brand-text-primary placeholder-brand-text-tertiary h-24"
                    disabled={isGenerating || uploadedImages.length > 0}
                />
                <button
                    onClick={handleCreateNewSlide}
                    disabled={isGenerating || !prompt || uploadedImages.length > 0}
                    className="btn btn-primary w-full text-base mt-3"
                >
                    {isGenerating ? <><Spinner size="h-5 w-5" className="-ml-1 mr-3" /> Creating...</> : 'Create New Slide'}
                </button>
            </div>

            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-brand-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-brand-surface px-2 text-brand-text-tertiary">or</span>
                </div>
            </div>

            {/* Option 2: Upload Images */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    <label className="text-sm font-medium text-brand-text-primary">📤 Upload Images</label>
                </div>
                <input
                    ref={imageUploadInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                />
                <button
                    onClick={() => imageUploadInputRef.current?.click()}
                    disabled={isGenerating || prompt.trim() !== ''}
                    className="w-full p-4 border-2 border-dashed border-brand-border rounded-lg hover:border-brand-primary-300 hover:bg-brand-primary-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {uploadedImages.length > 0 ? (
                        <div className="flex items-center justify-center gap-2 text-brand-primary-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm font-medium">{uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''} uploaded - click below to add</span>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-2 text-brand-text-tertiary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm">Click to select image files (multiple allowed)</span>
                        </div>
                    )}
                </button>
                {uploadedImages.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            {uploadedImages.map((imageSrc, idx) => (
                                <img key={idx} src={imageSrc} alt={`Preview ${idx + 1}`} className="w-full rounded-lg border border-brand-border aspect-video object-cover" />
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setUploadedImages([])}
                                disabled={isGenerating}
                                className="btn btn-secondary flex-1"
                            >
                                Remove All
                            </button>
                            <button
                                onClick={handleCreateFromUploadedImage}
                                disabled={isGenerating}
                                className="btn btn-primary flex-1"
                            >
                                {isGenerating ? <><Spinner size="h-5 w-5" className="-ml-1 mr-3" /> Adding...</> : `Add ${uploadedImages.length} Slide${uploadedImages.length > 1 ? 's' : ''}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Cancel Button */}
            <div className="pt-2 border-t border-brand-border">
                <button onClick={onCancelCreation} disabled={isGenerating} className="btn btn-secondary w-full">
                    Cancel
                </button>
            </div>
        </div>
     </div>
  );


  const renderInpaintingEditor = () => (
    <div className="w-full max-w-2xl mx-auto mt-6 flex-shrink-0">
        <div className="bg-brand-surface p-6 rounded-xl border border-brand-border shadow-card">
            {/* Instructions */}
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">How to use:</p>
                        <ul className="text-sm text-blue-800 space-y-1">
                            <li>• Click and drag to select an area</li>
                            <li>• Press <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono">Backspace</kbd> or <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono">Delete</kbd> to remove it</li>
                            <li>• Press <kbd className="px-2 py-0.5 bg-white border border-blue-300 rounded text-xs font-mono">Esc</kbd> to exit</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Selection info */}
            {selectionBox && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Area selected! Press Backspace or Delete to remove.</span>
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleClearMask}
                    disabled={isGenerating || !selectionBox}
                    className="btn btn-secondary flex-1"
                >
                    Clear Selection
                </button>
                <button
                    onClick={() => { setIsInpaintingMode(false); setSelectionBox(null); }}
                    disabled={isGenerating}
                    className="btn btn-secondary flex-1"
                >
                    Exit
                </button>
            </div>
        </div>
    </div>
  );


  return (
    <>
        <div className="flex flex-col h-full p-4 md:p-6">
            {/* SLIDE PREVIEW - PRIMARY (75% of space) */}
            <div className="flex-grow flex items-center justify-center mb-4">
                <div
                    className={`group relative aspect-video bg-white rounded-2xl shadow-card flex items-center justify-center w-full max-w-5xl border-2 border-brand-border/50 overflow-hidden transition-all duration-300 ${isImagenSelected || creationModeInfo ? 'cursor-default' : 'cursor-pointer hover:shadow-card-hover hover:border-brand-primary-300'}`}
                    onDragStart={(e) => e.preventDefault()}
                >
                {
                    creationModeInfo ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-brand-text-tertiary border-3 border-dashed border-brand-border rounded-2xl bg-gradient-to-br from-gray-50 to-slate-50 p-12">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-brand-primary-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                            </svg>
                            <p className="text-2xl font-display font-semibold">Describe your new slide below...</p>
                        </div>
                    ) : (
                         <img
                            ref={imageRef}
                            src={currentSrc}
                            alt={slide.name}
                            onClick={handleSlideClick}
                            className={`object-contain w-full h-full transition-all select-none ${
                                isInpaintingMode ? 'cursor-crosshair' :
                                magneticCursor.active ? 'cursor-move' :
                                (isImagenSelected ? '' : 'group-hover:scale-[1.02] cursor-pointer')
                            }`}
                            draggable={false}
                        />
                    )
                }

                {/* Hidden canvas for mask generation - used by both inpainting and magnetic cursor */}
                <canvas ref={maskCanvasRef} className="hidden" />

                {/* Magnetic Cursor: Text follows mouse */}
                {magneticCursor.active && magneticCursor.textRegion && cursorPosition && imageRef.current && (
                    <div
                        className={`absolute border-4 rounded-lg pointer-events-none shadow-2xl ${
                            isGenerating
                                ? 'border-purple-500 bg-purple-500/30 animate-pulse'
                                : 'border-blue-500 bg-blue-500/30'
                        }`}
                        style={{
                            left: `${cursorPosition.x}px`,
                            top: `${cursorPosition.y}px`,
                            width: `${(magneticCursor.textRegion.boundingBox.widthPercent / 100) * imageRef.current.offsetWidth}px`,
                            height: `${(magneticCursor.textRegion.boundingBox.heightPercent / 100) * imageRef.current.offsetHeight}px`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 9999,
                            transition: 'none'
                        }}
                    >
                        {/* Corner handles */}
                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-full" />
                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-full" />
                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-full" />
                        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-blue-500 border-2 border-white rounded-full" />

                        {/* Text preview with processing status */}
                        <div className={`absolute -top-9 left-1/2 -translate-x-1/2 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-2 ${
                            isGenerating ? 'bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 via-green-500 via-yellow-500 to-pink-500 bg-[length:300%_100%] animate-gradient shadow-2xl' : 'bg-blue-500'
                        }`}>
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>{processingStatus}</span>
                                </>
                            ) : (
                                <>
                                    <span>↔️</span>
                                    <span>{magneticCursor.textRegion.text}</span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Batch Edit Mode: Show ALL detected text boxes */}
                {isBatchEditMode && !isInpaintingMode && !creationModeInfo && cachedTextRegions.length > 0 && imageRef.current && (
                    <>
                        {cachedTextRegions.map((region, index) => {
                            const isQueued = editQueue.find(q => q.region.text === region.text);
                            const isSelected = selectedTextForEdit?.text === region.text;

                            return (
                                <div
                                    key={`batch-text-${index}`}
                                    className={`absolute border rounded-sm transition-all cursor-pointer group ${
                                        isQueued
                                            ? isQueued.action === 'remove'
                                                ? 'border-red-400 bg-red-50/50'
                                                : 'border-green-400 bg-green-50/50'
                                            : isSelected
                                                ? 'border-purple-500 bg-purple-50/30'
                                                : 'border-gray-300 hover:border-purple-400'
                                    }`}
                                    style={{
                                        left: `${region.boundingBox.xPercent}%`,
                                        top: `${region.boundingBox.yPercent}%`,
                                        width: `${region.boundingBox.widthPercent}%`,
                                        height: `${region.boundingBox.heightPercent}%`,
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTextForEdit(region);
                                        // Only set position if chat isn't already open
                                        if (!anchoredChatPosition) {
                                            const rect = imageRef.current!.getBoundingClientRect();
                                            const x = rect.left + (region.boundingBox.xPercent / 100) * rect.width;
                                            const y = rect.top + (region.boundingBox.yPercent / 100) * rect.height;
                                            setAnchoredChatPosition({ x, y });
                                        }
                                        // If chat is already open, just update the selected text (chat stays in same position)
                                    }}
                                >
                                    {/* Canva-style corner handles */}
                                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-white border border-purple-500 rounded-full opacity-0 group-hover:opacity-100" />
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white border border-purple-500 rounded-full opacity-0 group-hover:opacity-100" />
                                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border border-purple-500 rounded-full opacity-0 group-hover:opacity-100" />
                                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border border-purple-500 rounded-full opacity-0 group-hover:opacity-100" />

                                    {/* Minimal status indicator for queued items */}
                                    {isQueued && (
                                        <div className={`absolute -top-5 left-0 px-2 py-0.5 rounded-full text-xs font-medium text-white shadow-sm ${
                                            isQueued.action === 'remove'
                                                ? 'bg-red-500'
                                                : 'bg-green-500'
                                        }`}>
                                            {isQueued.action === 'remove' ? 'Remove' : 'Edit'}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}

                {/* Text region overlay - shows detected text box with magic status and drag handle */}
                {!isInpaintingMode && !creationModeInfo && !magneticCursor.active && !isBatchEditMode && clickedTextRegion?.boundingBox && imageRef.current && (
                    <div
                        className={`absolute border-2 ${processingStatus ? 'border-purple-600 bg-purple-600/20' : 'border-purple-500 bg-purple-500/10'} rounded ${processingStatus ? 'animate-pulse' : ''} pointer-events-none`}
                        style={{
                            left: `${clickedTextRegion.boundingBox.xPercent}%`,
                            top: `${clickedTextRegion.boundingBox.yPercent}%`,
                            width: `${clickedTextRegion.boundingBox.widthPercent}%`,
                            height: `${clickedTextRegion.boundingBox.heightPercent}%`,
                        }}
                    >
                        {/* Corner handles - Canva style */}
                        <div className={`absolute -top-1.5 -left-1.5 w-3 h-3 ${processingStatus ? 'bg-purple-600' : 'bg-purple-500'} border-2 border-white rounded-full`} />
                        <div className={`absolute -top-1.5 -right-1.5 w-3 h-3 ${processingStatus ? 'bg-purple-600' : 'bg-purple-500'} border-2 border-white rounded-full`} />
                        <div className={`absolute -bottom-1.5 -left-1.5 w-3 h-3 ${processingStatus ? 'bg-purple-600' : 'bg-purple-500'} border-2 border-white rounded-full`} />
                        <div className={`absolute -bottom-1.5 -right-1.5 w-3 h-3 ${processingStatus ? 'bg-purple-600' : 'bg-purple-500'} border-2 border-white rounded-full`} />

                        {/* Label showing detected text or processing status - Click to drag */}
                        <div
                            className={`absolute -top-7 left-0 ${processingStatus ? 'bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 via-green-500 via-yellow-500 to-pink-500 bg-[length:300%_100%] animate-gradient shadow-2xl' : 'bg-purple-500 hover:bg-purple-600 cursor-move active:scale-95'} text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-2 pointer-events-auto transition-all`}
                            style={{ zIndex: 9999 }}
                            onMouseDown={(e) => {
                                // Use onMouseDown instead of onClick for more immediate response
                                console.log('[Purple Label] 🖱️ MOUSE DOWN!', { processingStatus, hasTextRegion: !!clickedTextRegion, clickedText: clickedTextRegion?.text });
                                if (!processingStatus && clickedTextRegion) {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    console.log('[Purple Label] 🚀 Calling handleActivateMagneticCursor...');
                                    handleActivateMagneticCursor(clickedTextRegion);
                                } else {
                                    console.warn('[Purple Label] ⚠️ Cannot activate:', { processingStatus, hasTextRegion: !!clickedTextRegion });
                                }
                            }}
                            title={!processingStatus ? "Click to move this text" : undefined}
                        >
                            {processingStatus ? (
                                <>
                                    <div className="relative flex items-center justify-center">
                                        <span className="text-2xl animate-pulse">✨</span>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 opacity-50 blur-md animate-ping"></div>
                                        </div>
                                    </div>
                                    <span className="font-semibold">{processingStatus}</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                    </svg>
                                    <span>{clickedTextRegion.text}</span>
                                    <span className="text-purple-200 text-[10px]">(click to drag)</span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Floating Edit Mode button - appears on hover at top-right of slide */}
                {!creationModeInfo && !isInpaintingMode && (
                    <div className={`absolute top-4 right-4 z-50 transition-opacity duration-200 ${
                        isBatchEditMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsBatchEditMode(!isBatchEditMode);
                                if (isBatchEditMode) {
                                    // Exiting Edit Mode - clear queue
                                    setEditQueue([]);
                                    setSelectedTextForEdit(null);
                                    setAnchoredChatPosition(null);
                                }
                            }}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg ${
                                isBatchEditMode
                                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 text-white animate-gradient bg-[length:200%_200%]'
                                    : 'bg-gradient-to-r from-pink-400 to-purple-500 hover:from-purple-500 hover:to-pink-500 text-white'
                            }`}
                            disabled={isGenerating}
                            title={isBatchEditMode ? "Exit Edit Mode" : "Enter Edit Mode to batch edit multiple text elements"}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            {isBatchEditMode ? '✨ Edit Mode' : '✨ Edit Mode'}
                        </button>
                    </div>
                )}

                {isInpaintingMode && (
                    <>
                        {/* Interactive overlay for box selection */}
                        <div
                            className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                        >
                            {/* Selection box visualization */}
                            {selectionBox && (
                                <div
                                    className="absolute border-2 border-blue-500 bg-blue-500/20"
                                    style={{
                                        left: `${selectionBox.x}px`,
                                        top: `${selectionBox.y}px`,
                                        width: `${selectionBox.width}px`,
                                        height: `${selectionBox.height}px`,
                                        pointerEvents: 'none',
                                    }}
                                >
                                    {/* Corner handles */}
                                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full" />
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full" />
                                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded-full" />
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded-full" />
                                </div>
                            )}
                        </div>
                    </>
                )}
                 {!isInpaintingMode && !isImagenSelected && !creationModeInfo && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-brand-border/30">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span className="text-xs font-medium text-brand-text-secondary">Click to edit area</span>
                        </div>
                    </div>
                )}
                </div>
            </div>

            {/* COMPACT CHAT INPUT - BOTTOM (25% of space) */}
            <div className="flex-shrink-0">
                {creationModeInfo ? renderCreationEditor() : (isInpaintingMode ? renderInpaintingEditor() : renderStandardEditor())}

                {error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-600 text-sm font-medium text-center">{error}</p>
                    </div>
                )}
            </div>
        </div>
        {variants && (
            <VariantSelector
                variantsData={variants}
                onSelect={handleVariantSelected}
                onCancel={() => setVariants(null)}
                onRegenerate={isInpaintingMode ? handleGenerateInpainting : (creationModeInfo ? handleCreateNewSlide : handleGenerate)}
                isDebugMode={isDebugMode}
            />
        )}
        {personalizationPlanToReview && (
            <PersonalizationReviewModal
                plan={personalizationPlanToReview.plan}
                originalImage={personalizationPlanToReview.originalImage}
                onAccept={handleAcceptPersonalizationPlan}
                onDiscard={() => setPersonalizationPlanToReview(null)}
            />
        )}
        {debugLogs && (
            <DebugLogViewer logs={debugLogs} onClose={() => setDebugLogs(null)} />
        )}
        {anchoredChatPosition && (
            <AnchoredChatBubble
                key={isBatchEditMode ? 'batch-chat' : (selectedTextForEdit?.text || clickedTextRegion?.text || 'chat-bubble')}
                position={anchoredChatPosition}
                onClose={handleCloseChat}
                onSubmit={handleChatSubmit}
                onEnterInpaintMode={handleEnterInpaintingMode}
                isLoading={isChatRefining}
                regionText={
                    isBatchEditMode
                        ? (selectedTextForEdit?.text || 'this slide')
                        : (clickedTextRegion?.text || (isDetectingText ? 'Detecting...' : 'this area'))
                }
                // Batch editing props
                isBatchMode={isBatchEditMode}
                editQueue={editQueue.map(item => ({
                    id: item.id,
                    originalText: item.region.text,
                    action: item.action,
                    newText: item.newText
                }))}
                onAddToQueue={handleAddToQueue}
                onClearQueue={handleClearQueue}
                onTransitionToPanel={handleTransitionToRightPanel}
                conversationHistory={batchChatHistory}
                onUpdateHistory={setBatchChatHistory}
            />
        )}
        {isRightPanelOpen && (
            <RightChatPanel
                onClose={handleCloseRightPanel}
                onSubmit={handleRightPanelSubmit}
                isLoading={isGenerating}
                initialMessage={rightPanelInitialMessage}
                loadingStatus={processingStatus || undefined}
                // Batch editing props
                isBatchMode={isBatchEditMode}
                editQueue={editQueue.map(item => ({
                    id: item.id,
                    originalText: item.region.text,
                    action: item.action,
                    newText: item.newText
                }))}
                onAddToQueue={handleAddToQueue}
                onClearQueue={handleClearQueue}
                selectedText={selectedTextForEdit?.text}
            />
        )}

        <style>{`
            @keyframes gradient {
                0% {
                    background-position: 0% 50%;
                }
                50% {
                    background-position: 100% 50%;
                }
                100% {
                    background-position: 0% 50%;
                }
            }
            .animate-gradient {
                animation: gradient 3s ease infinite;
            }
        `}</style>
    </>
  );
};

export default ActiveSlideView;