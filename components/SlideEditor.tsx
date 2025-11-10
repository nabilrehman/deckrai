import React, { useState, useEffect, useRef } from 'react';
import { Slide, StyleLibraryItem, DebugLog, DebugSession, LastSuccessfulEditContext, PersonalizationAction } from '../types';
import { getGenerativeVariations, getPersonalizationPlan, getPersonalizedVariationsFromPlan, getInpaintingVariations, remakeSlideWithStyleReference, createSlideFromPrompt, findBestStyleReferenceFromPrompt } from '../services/geminiService';
import VariantSelector from './VariantSelector';
import DebugLogViewer from './DebugLogViewer';
import PersonalizationReviewModal from './PersonalizationReviewModal';
import AnchoredChatBubble from './AnchoredChatBubble';

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
type GenerationModel = 'gemini-2.5-flash-image' | 'imagen-4.0-generate-001';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [variants, setVariants] = useState<{ images: string[], prompts: string[], context: any } | null>(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isDeepMode, setIsDeepMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLog[] | null>(null);
  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([]);
  const [selectedModel, setSelectedModel] = useState<GenerationModel>('gemini-2.5-flash-image');
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

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const imageUploadInputRef = useRef<HTMLInputElement>(null);

  // Anchored AI Chat state
  const [anchoredChatPosition, setAnchoredChatPosition] = useState<{ x: number; y: number } | null>(null);
  const [isChatRefining, setIsChatRefining] = useState(false);

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
  }, [slide?.id, slide?.history, creationModeInfo]);


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
            const { images, logs, variationPrompts, bestReferenceSrc } = await remakeSlideWithStyleReference(prompt, currentSrc, styleLibrary, isDeepMode, handleProgressUpdate);
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
            const { images, logs, variationPrompts } = await getGenerativeVariations(selectedModel, prompt, currentSrc, isDeepMode, handleProgressUpdate);
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
        const plan = await getPersonalizationPlan(extractedCompany, currentSrc);
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
        model: 'gemini-2.5-flash-image',
        deepMode: isDeepMode,
    };

    try {
        const { images, logs, variationPrompts } = await getPersonalizedVariationsFromPlan(plan, currentSrc, isDeepMode, handleProgressUpdate);
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
            model: 'gemini-2.5-flash-image',
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDrawing.current = true;
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getMousePos(canvas, e);
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing.current) return;
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getMousePos(canvas, e);
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = 'rgba(113, 69, 255, 0.7)';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  const handleClearMask = () => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

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
        model: 'gemini-2.5-flash-image',
        deepMode: isDeepMode,
    };
    
    try {
        const { images, logs, variationPrompts } = await getInpaintingVariations(inpaintingPrompt, currentSrc, maskDataUrl, isDeepMode, handleProgressUpdate);
        
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

  // Anchored AI Chat handlers
  const handleSlideClick = (e: React.MouseEvent<HTMLImageElement>) => {
    // Don't open chat if in inpainting mode or if image generation is in progress
    if (isInpaintingMode || isGenerating || creationModeInfo) return;

    // Get click position relative to the viewport
    const clickX = e.clientX;
    const clickY = e.clientY;

    setAnchoredChatPosition({ x: clickX, y: clickY });
  };

  const handleChatSubmit = async (message: string) => {
    if (!message.trim() || !currentSrc) return;

    setIsChatRefining(true);
    setError(null);

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

    try {
      // Use the existing inpainting/variation API
      // This will maintain the visual style automatically
      const { images, prompts: variationPrompts, logs } = await getGenerativeVariations(
        selectedModel,
        message,
        currentSrc,
        isDeepMode,
        handleProgressUpdate
      );

      if (images.length > 0) {
        const context = { workflow: 'Edit', userIntentPrompt: message, model: selectedModel, deepMode: isDeepMode };
        setVariants({ images, prompts: variationPrompts, context });
        onSuccessfulSingleSlideEdit(context);

        if (isDebugMode) {
          setDebugLogs(logs);
        }
        session = { ...session, status: 'Success', finalImages: images, logs };
      }

      // Close the chat after successful submission
      setAnchoredChatPosition(null);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while refining the slide.');
      session = { ...session, status: 'Failed', error: err.message, logs: [], finalImages: [] };
    } finally {
      setIsChatRefining(false);
      setProgressSteps([]);
      onAddSessionToHistory(session as DebugSession);
    }
  };

  const handleCloseChat = () => {
    setAnchoredChatPosition(null);
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

        {/* Intent-Based Smart Input */}
        <div className="bg-white p-4 rounded-xl shadow-card border border-brand-border/50">
            <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-brand-text-primary flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                    </svg>
                    Tell AI what you want
                </label>

                {/* Intent indicator */}
                {detectedIntent && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-brand-primary-100 to-brand-accent-100 border border-brand-primary-200">
                        <div className="w-2 h-2 rounded-full bg-brand-primary-500 animate-pulse"></div>
                        <span className="text-xs font-semibold text-brand-primary-700">
                            {detectedIntent === 'personalize' && '🎨 Personalization detected'}
                            {detectedIntent === 'redesign' && `✨ Redesign${styleLibrary.length > 0 ? ' with style library' : ' without reference'}`}
                            {detectedIntent === 'edit' && '✏️ Iterative editing'}
                        </span>
                    </div>
                )}
            </div>

            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={isImagenSelected
                    ? "e.g., 'A photorealistic image of a robot on a skateboard'"
                    : "Try: 'Add a blue rocket' • 'Personalize for Apple Inc' • 'Remake this slide in modern style'"}
                className="input-premium w-full p-3 text-sm rounded-xl resize-none h-20 font-light leading-relaxed"
                disabled={isGenerating}
            />

            {/* Progress Steps - Inline like ChatGPT */}
            {isGenerating && progressSteps.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-brand-border/30 pt-3">
                    {progressSteps.map((step, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm animate-slide-down">
                            {step.status === 'complete' && (
                                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                            )}
                            {step.status === 'in-progress' && (
                                <svg className="animate-spin h-5 w-5 text-brand-primary-500 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {step.status === 'pending' && (
                                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                </div>
                            )}
                            <span className={`${
                                step.status === 'pending' ? 'text-brand-text-tertiary' :
                                step.status === 'complete' ? 'text-green-700 font-medium' :
                                'text-brand-text-primary font-medium'
                            }`}>
                                {step.text}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Smart Context Detection - No Additional Inputs */}
            {!isGenerating && detectedIntent === 'personalize' && (
                <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500 text-white flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">AI will research company details and personalize automatically</p>
                        <p className="text-xs text-green-700 mt-0.5">Include the company name or website in your prompt above</p>
                    </div>
                </div>
            )}

            <div className="mt-3">
                <button
                    onClick={detectedIntent === 'personalize' ? handlePersonalize : handleGenerate}
                    disabled={isGenerating || !prompt}
                    className={`btn w-full text-sm py-3 shadow-btn hover:shadow-btn-hover ${
                        detectedIntent === 'personalize'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : 'btn-primary'
                    }`}
                >
                    {isGenerating ? <><Spinner size="h-5 w-5" className="-ml-1 mr-3" /> Processing...</> : (
                        <>
                            {detectedIntent === 'personalize' && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                </svg>
                            )}
                            {detectedIntent === 'redesign' && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                            )}
                            {detectedIntent === 'redesign' && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                </svg>
                            )}
                            {(!detectedIntent || detectedIntent === 'edit') && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            )}
                            {detectedIntent === 'personalize' ? 'Personalize with AI' :
                             detectedIntent === 'redesign' ? 'Redesign with AI' :
                             'Generate with AI'}
                        </>
                    )}
                </button>
            </div>
        </div>

        {/* Examples Section */}
        {!prompt && (
            <div className="mt-6 p-4 bg-gradient-to-br from-brand-primary-50 to-brand-accent-50 rounded-2xl border border-brand-primary-200">
                <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-brand-primary-900 mb-2">✨ Try these examples:</p>
                        <ul className="space-y-2 text-sm text-brand-primary-700">
                            <li className="flex items-start gap-2">
                                <span className="text-brand-primary-400">•</span>
                                <button onClick={() => setPrompt('Add a chart showing 50% revenue growth')} className="text-left hover:underline">"Add a chart showing 50% revenue growth"</button>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-brand-primary-400">•</span>
                                <button onClick={() => setPrompt('Personalize this slide for Microsoft')} className="text-left hover:underline">"Personalize this slide for Microsoft"</button>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-brand-primary-400">•</span>
                                <button onClick={() => setPrompt('Remake this in a modern, clean style with better colors')} className="text-left hover:underline">"Remake this in a modern, clean style"</button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        )}
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
        <div className="bg-brand-surface p-4 rounded-xl border border-brand-border shadow-card">
            <label htmlFor="inpainting-prompt" className="text-sm font-medium text-brand-text-secondary block mb-2">
                Describe the change for the selected area:
            </label>
            <textarea
                id="inpainting-prompt"
                value={inpaintingPrompt}
                onChange={(e) => setInpaintingPrompt(e.target.value)}
                placeholder="e.g., 'add a company logo' or 'remove this text'"
                className="w-full p-3 text-sm bg-brand-background border border-brand-border rounded-md focus:ring-2 focus:ring-brand-primary transition-all resize-none text-brand-text-primary placeholder-brand-text-tertiary h-20"
                disabled={isGenerating}
            />
             <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                    <label htmlFor="brush-size" className="text-sm text-brand-text-secondary">Brush Size:</label>
                    <input 
                        type="range" 
                        id="brush-size" 
                        min="5" 
                        max="80" 
                        value={brushSize} 
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-32"
                        disabled={isGenerating}
                    />
                </div>
                 <button onClick={handleClearMask} disabled={isGenerating} className="px-4 py-2 text-sm text-brand-text-secondary bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50">
                    Clear Mask
                </button>
            </div>
             <div className="flex items-center gap-4 mt-4">
                <button onClick={() => setIsInpaintingMode(false)} disabled={isGenerating} className="btn btn-secondary w-full">
                    Cancel
                </button>
                <button
                    onClick={handleGenerateInpainting}
                    disabled={isGenerating || !inpaintingPrompt}
                    className="btn btn-primary w-full text-base"
                >
                     {isGenerating ? <><Spinner size="h-5 w-5" className="-ml-1 mr-3" /> Generating...</> : 'Generate'}
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
                    onClick={handleEnterInpaintingMode}
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
                            className={`object-contain w-full h-full transition-all select-none ${isInpaintingMode ? 'cursor-crosshair' : (isImagenSelected ? '' : 'group-hover:scale-[1.02] cursor-pointer')}`}
                            draggable={false}
                        />
                    )
                }

                {isInpaintingMode && (
                    <canvas
                        ref={maskCanvasRef}
                        className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
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
                position={anchoredChatPosition}
                onClose={handleCloseChat}
                onSubmit={handleChatSubmit}
                isLoading={isChatRefining}
            />
        )}
    </>
  );
};

export default ActiveSlideView;