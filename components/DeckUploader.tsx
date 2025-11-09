

import React, { useState, useCallback, useRef } from 'react';
import { Slide, StyleLibraryItem, DebugLog } from '../types';
import { createSlideFromPrompt, generateOutlineFromNotes, enhanceOutlinePrompts } from '../services/geminiService';

declare const pdfjsLib: any;

interface DeckUploaderProps {
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
                return reject(new Error('Failed to get canvas context for image processing.'));
            }
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject(new Error('Failed to load the selected image for processing.'));
        img.crossOrigin = 'Anonymous';
        img.src = src;
    });
};

const Spinner: React.FC<{text?: string, size?: string}> = ({ text, size = 'h-8 w-8' }) => (
    <div className="flex flex-col items-center justify-center">
        <svg className={`animate-spin text-brand-primary ${size}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {text && <p className="mt-4 text-lg text-brand-text-secondary">{text}</p>}
    </div>
);

const ProcessingLoader: React.FC = () => (
    <div className="w-full max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-2xl">
                <svg className="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">Processing your presentation</h3>
            <p className="text-lg text-gray-600">Analyzing content and converting slides...</p>
        </div>

        {/* Skeleton Slides */}
        <div className="space-y-5">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border-2 border-gray-200 shadow-sm animate-pulse">
                    <div className="flex gap-5">
                        {/* Thumbnail skeleton */}
                        <div className="w-40 h-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded-xl shimmer-animation" />

                        {/* Content skeleton */}
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded-lg shimmer-animation w-3/4" />
                            <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded-lg shimmer-animation w-1/2" />
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Progress indicator */}
        <div className="mt-10 flex items-center justify-center gap-3 text-base text-gray-600">
            <svg className="w-5 h-5 text-green-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">This usually takes 10-15 seconds</span>
        </div>

        <style>{`
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
            .shimmer-animation {
                animation: shimmer 2s infinite linear;
            }
        `}</style>
    </div>
);

const defaultOutline = `---
SLIDE 1: Title Slide

Visual:
- Klick Health + Google Cloud logos
- Background: Healthcare/pharma imagery (subtle)

Content:
Revenue & Resource Forecasting with BigQuery ML
Pharma Marketing Analytics Solution
[Your Name]
Data Analytics Customer Engineer, Google Cloud
[Date]

---
SLIDE 2: The Challenge

Title: "The Pharma Marketing Question"

Content:
How much does marketing spend actually drive revenue?

What Klick Health Needs:
✓ Quantified marketing ROI
✓ Revenue forecasts (26 weeks ahead)
✓ Data-driven resource planning
✓ Fast, repeatable process

---
SLIDE 3: The Data Landscape

Title: "3 Years of Pharma Marketing History"

Content:
Dataset Overview:
• 468 weeks of revenue data (Oct 2022 - Sept 2025)
• Marketing spend with dramatic campaign spikes
Key Observation: Marketing spend and revenue show strong correlation (0.80+) → Perfect for ML.

---
SLIDE 4: Solution Architecture

Title: "End-to-End ML Pipeline in BigQuery"

Content:
A simple 3-stage architecture diagram:
1. BigQuery Data Warehouse (Input)
2. BigQuery ML ARIMA_PLUS_XREG (Model Training)
3. Predictions & Insights (Output)
Key Benefit: No data movement, SQL-native, Serverless.
`;


const DeckUploader: React.FC<DeckUploaderProps> = ({ onDeckUpload, styleLibrary, isTestMode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'notes' | 'outline' | 'upload'>('notes');
  
  const [rawNotes, setRawNotes] = useState('');
  const [deckOutline, setDeckOutline] = useState(defaultOutline);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [uploadedStyleReference, setUploadedStyleReference] = useState<{ src: string, name: string } | null>(null);
  const [isUploadingStyle, setIsUploadingStyle] = useState(false);
  
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [isGeneratingDeck, setIsGeneratingDeck] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const styleUploadInputRef = React.useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsLoading(true);
    setError(null);
    const newSlides: Slide[] = [];
    const filePromises: Promise<void>[] = [];
    
    const processPdf = async (file: File) => {
        const fileReader = new FileReader();
        return new Promise<void>((resolve, reject) => {
            fileReader.onload = async (e) => {
                try {
                    const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
                    const pdf = await pdfjsLib.getDocument(typedarray).promise;
                    const pagePromises: Promise<void>[] = [];
                    const pdfSlides: Slide[] = [];

                    for (let i = 1; i <= pdf.numPages; i++) {
                        pagePromises.push((async (pageNum) => {
                            const page = await pdf.getPage(pageNum);
                            const viewport = page.getViewport({ scale: 1.5 });
                            const canvas = document.createElement('canvas');
                            const context = canvas.getContext('2d');
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;

                            if (context) {
                                await page.render({ canvasContext: context, viewport }).promise;
                                const id = `${file.name}-p${pageNum}-${Date.now()}`;
                                const src = canvas.toDataURL('image/png');
                                pdfSlides.push({ id, originalSrc: src, history: [src], name: `Page ${pageNum}` });
                            }
                        })(i));
                    }
                    await Promise.all(pagePromises);
                    newSlides.push(...pdfSlides);
                    resolve();
                } catch (err) {
                    console.error("PDF processing error:", err);
                    reject(new Error("Failed to process PDF file. It might be corrupted or in an unsupported format."));
                }
            };
            fileReader.readAsArrayBuffer(file);
        });
    };

    const processImage = (file: File) => {
        return new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const src = e.target?.result as string;
                const id = `${file.name}-${Date.now()}`;
                newSlides.push({ id, originalSrc: src, history: [src], name: file.name.split('.')[0] });
                resolve();
            };
            reader.readAsDataURL(file);
        });
    };

    for (const file of Array.from(files)) {
        if (file.type === 'application/pdf') {
            filePromises.push(processPdf(file));
        } else if (file.type.startsWith('image/')) {
            filePromises.push(processImage(file));
        }
    }
    
    try {
        await Promise.all(filePromises);
        if (newSlides.length > 0) {
            onDeckUpload(newSlides.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })));
        } else if (filePromises.length > 0){
            setError("No valid image or PDF files were selected.");
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsLoading(false);
    }
  }, [onDeckUpload]);

  const handleGeneratePlan = useCallback(async () => {
    if (!rawNotes.trim()) {
        setError("Please paste your notes or content first.");
        return;
    }
    setIsGeneratingPlan(true);
    setError(null);
    try {
        const outlineArray = await generateOutlineFromNotes(rawNotes);
        setDeckOutline(outlineArray.join('\n\n---\n\n'));
        setActiveTab('outline');
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsGeneratingPlan(false);
    }
  }, [rawNotes]);


  const handleGenerateDeck = useCallback(async (promptsFromTemplate?: string[]) => {
    let prompts = promptsFromTemplate || deckOutline.split('---').map(p => p.trim()).filter(p => p.length > 0);
    
    if (prompts.length === 0) {
        setError("Please outline your deck with at least one slide description.");
        return;
    }

    if (isTestMode && prompts.length > 5) {
        prompts = prompts.slice(0, 5);
    }
    
     if (!isTestMode && prompts.length > 30) {
        setError(`Your outline has ${prompts.length} slides, which is more than the maximum of 30. The deck has been truncated.`);
        prompts = prompts.slice(0, 30);
    }

    setIsGeneratingDeck(true);
    setError(null);
    setGenerationProgress(0);

    const CONCURRENT_BATCH_SIZE = 3;
    const allGeneratedSlides: Slide[] = [];
    let completedCount = 0;
    
    let referenceSrc: string | null = null;
    if (uploadedStyleReference) {
        referenceSrc = uploadedStyleReference.src;
    } else if (selectedStyleId) {
        const selectedItem = styleLibrary.find(item => item.id === selectedStyleId);
        if (selectedItem) {
            referenceSrc = selectedItem.src;
        }
    }


    try {
        const progressMessage = isTestMode ? `Enhancing outline for ${prompts.length} slides (Test Mode)...` : 'Enhancing outline with AI...';
        setProgressText(progressMessage);
        const enhancedPrompts = await enhanceOutlinePrompts(prompts);
        
        const totalSlides = enhancedPrompts.length;

        for (let i = 0; i < totalSlides; i += CONCURRENT_BATCH_SIZE) {
            const batchPrompts = enhancedPrompts.slice(i, i + CONCURRENT_BATCH_SIZE);
            
            const batchPromises = batchPrompts.map(async (prompt, indexInBatch) => {
                const slideNumber = i + indexInBatch + 1;
                const logs: DebugLog[] = [];
                
                const designerMessage = `(${slideNumber}/${totalSlides}) AI Designer is creating the slide...`;
                setProgressText(designerMessage);

                const { images } = await createSlideFromPrompt(referenceSrc, prompt, false, logs, undefined, null, null);
                
                const finalImage = await launderImageSrc(images[0]);
                
                completedCount++;
                setGenerationProgress(Math.round((completedCount / totalSlides) * 100));

                return {
                    id: `slide-${Date.now()}-${slideNumber}`,
                    originalSrc: finalImage,
                    history: [finalImage],
                    name: prompt.substring(0, 30).split('\n')[0] || `Slide ${slideNumber}`,
                };
            });

            const batchResults = await Promise.all(batchPromises);
            allGeneratedSlides.push(...batchResults);
        }
        
        onDeckUpload(allGeneratedSlides);

    } catch (err: any) {
        console.error("Deck generation failed:", err);
        const errorMessage = (err.message || 'An unknown error occurred').substring(0, 500);
        setError(`Failed to generate the deck: ${errorMessage}`);
    } finally {
        setIsGeneratingDeck(false);
        setProgressText('');
    }
  }, [deckOutline, styleLibrary, onDeckUpload, isTestMode, selectedStyleId, uploadedStyleReference]);


  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); processFiles(e.dataTransfer.files); };

  const handleStyleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setIsUploadingStyle(true);
    setError(null);

    try {
        let styleSrc: string | null = null;

        if (file.type === 'application/pdf') {
            const fileReader = new FileReader();
            styleSrc = await new Promise<string>((resolve, reject) => {
                fileReader.onload = async (event) => {
                    try {
                        const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
                        const pdf = await pdfjsLib.getDocument(typedarray).promise;
                        if (pdf.numPages > 0) {
                            const page = await pdf.getPage(1); // Get first page
                            const viewport = page.getViewport({ scale: 1.5 });
                            const canvas = document.createElement('canvas');
                            canvas.height = viewport.height;
                            canvas.width = viewport.width;
                            const context = canvas.getContext('2d');
                            if (context) {
                                await page.render({ canvasContext: context, viewport }).promise;
                                resolve(canvas.toDataURL('image/png'));
                            } else { reject(new Error('Canvas context not available')) }
                        } else { reject(new Error('PDF has no pages')) }
                    } catch (err) { reject(err); }
                };
                fileReader.readAsArrayBuffer(file);
            });
        } else if (file.type.startsWith('image/')) {
             styleSrc = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target?.result as string);
                reader.readAsDataURL(file);
            });
        }

        if (styleSrc) {
            setUploadedStyleReference({ src: styleSrc, name: file.name });
            setSelectedStyleId(null); // Deselect library item
        } else {
            throw new Error("Unsupported file type for style reference. Please use an image or a single-page PDF.");
        }
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsUploadingStyle(false);
        if(e.target) e.target.value = ''; // Reset file input
    }
  };


  const renderTabContent = () => {
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
                    {styleLibrary.map(item => (
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
                            <img src={item.src} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        </div>
                    ))}
                </div>
            )}

            <div className="relative flex items-center justify-center my-4">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-brand-border/30" />
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs font-medium text-brand-text-tertiary">{styleLibrary.length > 0 ? 'Or upload custom' : 'Upload custom style'}</span>
                </div>
            </div>

            {isUploadingStyle ? (
                 <div className="text-center py-4">
                    <Spinner text="Processing style..." size="h-6 w-6"/>
                </div>
            ) : uploadedStyleReference ? (
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
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        </button>
                    </div>
                </div>
            ) : (
                 <button
                    type="button"
                    onClick={() => styleUploadInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold text-brand-primary-500 bg-brand-primary-50 rounded-xl hover:bg-brand-primary-100 border-2 border-dashed border-brand-primary-300 hover:border-brand-primary-500 transition-all group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    Upload a Reference File
                </button>
            )}
            <input ref={styleUploadInputRef} type="file" className="sr-only" accept="application/pdf,image/*" onChange={handleStyleFileChange} />
        </div>
    );

    switch (activeTab) {
        case 'notes':
            return (
                 <div className="flex flex-col">
                    <div className="mb-4 text-center">
                        <h3 className="font-display font-semibold text-lg text-brand-text-primary mb-2">Share Your Ideas</h3>
                        <p className="text-brand-text-secondary text-sm">Paste any content—meeting notes, documents, code, etc. The AI will create a presentation plan.</p>
                    </div>
                    <textarea
                        value={rawNotes}
                        onChange={e => setRawNotes(e.target.value)}
                        placeholder="Paste your raw notes, meeting transcripts, or any content here..."
                        className="input-premium w-full p-5 text-sm bg-brand-surface rounded-2xl resize-none text-brand-text-primary placeholder-brand-text-tertiary h-[200px] font-light leading-relaxed overflow-y-auto"
                    />
                    {styleSelectionUI}
                    <div className="pt-6">
                        <button
                            onClick={handleGeneratePlan}
                            disabled={!rawNotes || isGeneratingPlan}
                            className="btn btn-primary w-full text-base py-4 shadow-btn hover:shadow-btn-hover"
                        >
                            {isGeneratingPlan ? <Spinner size="h-5 w-5" /> : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                    Generate Presentation Plan
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )
        case 'outline':
            return (
                <div className="flex flex-col">
                    <div className="mb-4 text-center">
                        <h3 className="font-display font-semibold text-lg text-brand-text-primary mb-2">Structure Your Deck</h3>
                        <p className="text-brand-text-secondary text-sm">Review the AI-generated outline or write your own. Use "---" to separate slides.</p>
                    </div>
                    <textarea
                        value={deckOutline}
                        onChange={e => setDeckOutline(e.target.value)}
                        placeholder="Title slide for Q3 sales kickoff\n---\nAn agenda slide with 5 items..."
                        className="input-premium w-full p-5 text-sm bg-brand-surface rounded-2xl resize-none text-brand-text-primary placeholder-brand-text-tertiary font-mono h-[200px] leading-relaxed overflow-y-auto"
                    />
                     {styleSelectionUI}
                    <div className="pt-4">
                        {isTestMode && (
                            <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded-xl">
                                <p className="text-amber-700 text-xs font-medium text-center">Test Mode Active: Only the first 5 slides will be generated</p>
                            </div>
                        )}
                        <button
                            onClick={() => handleGenerateDeck()}
                            disabled={!deckOutline || isGeneratingDeck}
                            className="btn btn-primary w-full text-base py-4 shadow-btn hover:shadow-btn-hover"
                        >
                             {isGeneratingDeck ? <Spinner size="h-5 w-5" /> : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Generate Deck
                                </>
                             )}
                        </button>
                    </div>
                </div>
            )
        case 'upload':
             return (
                 <div
                    className={`w-full flex-grow text-center p-12 border-3 border-dashed rounded-3xl transition-all duration-300 flex flex-col justify-center items-center min-h-[300px] ${
                        isDragging
                            ? 'border-brand-primary-500 bg-gradient-to-br from-brand-primary-50 to-brand-accent-50 shadow-premium'
                            : 'border-brand-border hover:border-brand-primary-300 hover:bg-brand-background/50'
                    }`}
                    onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                >
                    {isLoading ? (
                        <ProcessingLoader />
                    ) : (
                        <>
                            <div className={`p-6 rounded-2xl mb-6 transition-all duration-300 ${
                                isDragging ? 'bg-brand-primary-100 scale-110' : 'bg-brand-background'
                            }`}>
                                <svg className="w-16 h-16 text-brand-primary-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                            </div>
                            <h3 className="font-display font-semibold text-xl text-brand-text-primary mb-2">Drop your files here</h3>
                            <p className="text-brand-text-secondary mb-1">or click to browse</p>
                            <p className="text-xs text-brand-text-tertiary mb-8">Supports PDF and image files</p>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="btn btn-primary shadow-btn hover:shadow-btn-hover"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                                </svg>
                                Choose Files
                            </button>
                            <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="application/pdf,image/*" onChange={e => processFiles(e.target.files)} />
                        </>
                    )}
                </div>
            )
    }
  }

  if (isGeneratingDeck) {
      return (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-12 animate-fade-in">
             <div className="mb-8">
                <Spinner text={progressText || "Generating your deck..."} size="h-12 w-12" />
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
      )
  }

  return (
    <div className="w-full flex flex-col items-center justify-start p-6 md:p-12 pb-32 animate-fade-in">
        <div className="text-center w-full max-w-5xl mx-auto">
             {/* Compact Social Proof */}
             <div className="mb-8 flex items-center justify-center gap-8 text-sm text-brand-text-tertiary animate-slide-down">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-display font-bold gradient-text">2,500+</span>
                  <span>Companies</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-display font-bold gradient-text">50K+</span>
                  <span>Decks Created</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-display font-bold gradient-text">4.9/5</span>
                  <span>Rating</span>
                </div>
             </div>

             <div className="mb-8 animate-slide-up">
                <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text mb-3">
                    What will you create today?
                </h1>
                <p className="text-brand-text-secondary text-lg font-light">Transform your ideas into stunning presentations with AI</p>
             </div>

             {/* Premium Tab Switcher */}
             <div className="relative p-1.5 glass rounded-2xl flex items-center justify-center max-w-lg mx-auto mb-10 border border-brand-border/50 shadow-glass">
                 <div className="absolute inset-0 bg-gradient-to-r from-brand-primary-500/5 via-brand-accent-500/5 to-brand-primary-500/5 rounded-2xl"></div>
                 <button
                    onClick={() => setActiveTab('notes')}
                    className={`relative px-6 py-3 text-sm font-semibold rounded-xl w-full transition-all duration-300 ${
                        activeTab === 'notes'
                            ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 text-white shadow-premium'
                            : 'text-brand-text-secondary hover:text-brand-primary-500'
                    }`}
                 >
                    <div className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9 2a2 2 0 00-2 2v8a2 2 0 002 2h6a2 2 0 002-2V6.414A2 2 0 0016.414 5L14 2.586A2 2 0 0012.586 2H9z" />
                        <path d="M3 8a2 2 0 012-2v10h8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                      </svg>
                      <span>From Notes</span>
                    </div>
                 </button>
                 <button
                    onClick={() => setActiveTab('outline')}
                    className={`relative px-6 py-3 text-sm font-semibold rounded-xl w-full transition-all duration-300 ${
                        activeTab === 'outline'
                            ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 text-white shadow-premium'
                            : 'text-brand-text-secondary hover:text-brand-primary-500'
                    }`}
                 >
                    <div className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
                      </svg>
                      <span>From Outline</span>
                    </div>
                 </button>
                 <button
                    onClick={() => setActiveTab('upload')}
                    className={`relative px-6 py-3 text-sm font-semibold rounded-xl w-full transition-all duration-300 ${
                        activeTab === 'upload'
                            ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 text-white shadow-premium'
                            : 'text-brand-text-secondary hover:text-brand-primary-500'
                    }`}
                 >
                    <div className="flex items-center justify-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span>Upload File</span>
                    </div>
                 </button>
             </div>

            {/* Premium Content Card */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-card-lg border border-brand-border/50 flex flex-col animate-scale-in">
                 {renderTabContent()}
            </div>

            {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm animate-slide-down">
                    <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Quick Examples Section */}
            {!rawNotes && !deckOutline.trim() && activeTab !== 'upload' && (
              <div className="mt-10 p-6 bg-gradient-to-br from-brand-primary-50 to-brand-accent-50 rounded-2xl border border-brand-primary-200 animate-slide-up">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary-500 to-brand-accent-500 text-white flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-brand-text-primary mb-1 text-left">💡 Quick Start Ideas</h4>
                    <p className="text-sm text-brand-text-secondary text-left mb-3">Try one of these popular use cases:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <button
                        onClick={() => {
                          setActiveTab('notes');
                          setRawNotes('Create a sales pitch for our new AI-powered analytics platform targeting Fortune 500 companies. Focus on ROI, ease of implementation, and competitive advantages.');
                        }}
                        className="p-3 bg-white rounded-lg text-left hover:shadow-card transition-all border border-brand-border/30 hover:border-brand-primary-300 group"
                      >
                        <span className="font-medium text-brand-primary-500 group-hover:text-brand-primary-600">📊 Sales Pitch</span>
                        <p className="text-xs text-brand-text-tertiary mt-1">B2B product presentation</p>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('notes');
                          setRawNotes('Build a quarterly business review for Q3 2025. Include key metrics, achievements, challenges, and strategic initiatives for next quarter.');
                        }}
                        className="p-3 bg-white rounded-lg text-left hover:shadow-card transition-all border border-brand-border/30 hover:border-brand-primary-300 group"
                      >
                        <span className="font-medium text-brand-primary-500 group-hover:text-brand-primary-600">📈 QBR Deck</span>
                        <p className="text-xs text-brand-text-tertiary mt-1">Executive summary</p>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('notes');
                          setRawNotes('Create an investor pitch deck for a Series A fundraise. Our startup: AI-powered customer service platform. Seeking $5M. Include problem, solution, market size, traction, team, and ask.');
                        }}
                        className="p-3 bg-white rounded-lg text-left hover:shadow-card transition-all border border-brand-border/30 hover:border-brand-primary-300 group"
                      >
                        <span className="font-medium text-brand-primary-500 group-hover:text-brand-primary-600">🚀 Investor Pitch</span>
                        <p className="text-xs text-brand-text-tertiary mt-1">Fundraising deck</p>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('notes');
                          setRawNotes('Design a training presentation for new employees about our company culture, values, team structure, and onboarding process.');
                        }}
                        className="p-3 bg-white rounded-lg text-left hover:shadow-card transition-all border border-brand-border/30 hover:border-brand-primary-300 group"
                      >
                        <span className="font-medium text-brand-primary-500 group-hover:text-brand-primary-600">👥 Training Deck</span>
                        <p className="text-xs text-brand-text-tertiary mt-1">Employee onboarding</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trust Signals Footer */}
            <div className="mt-10 flex items-center justify-center gap-8 text-xs text-brand-text-tertiary">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Free to start</span>
              </div>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>10 decks/month on free plan</span>
              </div>
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
            </div>
        </div>
    </div>
  );
};

export default DeckUploader;