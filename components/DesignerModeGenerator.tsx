import React, { useState, useCallback, useRef } from 'react';
import { Slide, StyleLibraryItem, DebugSession, DebugLog } from '../types';
import FloatingActionBubble from './FloatingActionBubble';
import SessionInspectorPanel from './SessionInspectorPanel';
import { generateDesignerOutline } from '../services/designerOrchestrator';
import { buildPromptFromSpec } from '../services/outlineParser';
import { createSlideFromPrompt } from '../services/geminiService';
import { autoSaveSession } from '../services/sessionLogger';
import type { DesignerGenerationProgress } from '../types/designerMode';

declare const pdfjsLib: any;

interface DesignerModeGeneratorProps {
  onDeckUpload: (slides: Slide[]) => void;
  styleLibrary: StyleLibraryItem[];
  isTestMode: boolean;
  onLibraryUpload?: (items: StyleLibraryItem[]) => void;
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

const DesignerModeGenerator: React.FC<DesignerModeGeneratorProps> = ({
  onDeckUpload,
  styleLibrary,
  isTestMode,
  onLibraryUpload,
}) => {
  // Core state
  const [rawNotes, setRawNotes] = useState('');
  const [slideCount, setSlideCount] = useState(10);
  const [uploadedStyleReference, setUploadedStyleReference] = useState<{ src: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'planning' | 'parallel' | 'creating' | 'complete' | 'error'>('planning');
  const [progressMessage, setProgressMessage] = useState('');
  const [currentSlideProgress, setCurrentSlideProgress] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [generatedSlides, setGeneratedSlides] = useState<Slide[]>([]);

  // Bubble state
  const [showActionBubble, setShowActionBubble] = useState(false);

  // Debug/Session Inspector state
  const [debugSessions, setDebugSessions] = useState<DebugSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<DebugSession | null>(null);
  const [showSessionInspector, setShowSessionInspector] = useState(false);

  const styleUploadInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);

  /**
   * Extract context from notes using LLM (not regex!)
   * Handles complex scenarios: "I work at Google, presenting to Microsoft"
   * See CLAUDE.md - don't use regex for natural language extraction
   */
  const extractPresentationContext = async (notes: string): Promise<{
    myCompany: string;
    audienceCompany?: string;
    audience: string;
  }> => {
    try {
      // Use lightweight Gemini Flash for quick extraction
      const ai = new (await import('@google/genai')).GoogleGenAI({
        apiKey: import.meta.env.VITE_GEMINI_API_KEY
      });

      const prompt = `You are analyzing presentation notes to understand the CONTEXT and PURPOSE.

**CRITICAL:** Differentiate between presentation CONTENT vs. presentation METADATA:
- CONTENT = what will be shown ON the slides (e.g., "Targeted accounts", "Upcoming renewals", lists, data)
- METADATA = who's creating it, who's the audience, what's the purpose

**Your Task:**
1. First, determine: What TYPE of presentation is this? (sales pitch, internal training, case study, conference talk, etc.)
2. Then infer: WHO is the likely AUDIENCE based on the presentation type and content?
3. Extract: WHICH COMPANY is creating the deck (whose brand to use)?
4. Extract: Is there a specific company being presented TO (for personalization)?

**Examples:**

Input: "my company is solarwinds.com. Outline: Sales workflow training. 1. Messaging - Call to action. 2. List - Targeted accounts, Upcoming Renewals. 3. Call strategy..."
Analysis: This is INTERNAL SALES TRAINING about workflows and best practices.
Output: {"myCompany": "solarwinds.com", "audienceCompany": null, "audience": "Internal sales team"}

Input: "Atlassian case study showing how Acme Corp improved productivity by 40%"
Analysis: This is a CASE STUDY presentation to potential customers.
Output: {"myCompany": "Atlassian", "audienceCompany": null, "audience": "Potential enterprise customers"}

Input: "I work at Google, presenting cloud migration benefits to Microsoft IT team"
Analysis: This is a B2B SALES PITCH.
Output: {"myCompany": "Google", "audienceCompany": "Microsoft", "audience": "Microsoft IT executives"}

Input: "Startup pitch deck for Sand Hill Road investors"
Analysis: This is an INVESTOR PITCH.
Output: {"myCompany": "Your Startup", "audienceCompany": null, "audience": "Venture capital investors"}

**Now analyze these notes:**
${notes.substring(0, 1500)}

Return ONLY valid JSON: {"myCompany": "...", "audienceCompany": null or "...", "audience": "..."}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        config: {
          thinkingConfig: {
            thinkingBudget: 8192 // Use thinking mode for better context understanding
          }
        },
        contents: prompt
      });

      const jsonText = response.candidates[0].content.parts[0].text.trim();
      // Remove markdown code blocks if present
      const cleanJson = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const context = JSON.parse(cleanJson);

      console.log(`🏢 LLM extracted context:`, context);

      return {
        myCompany: context.myCompany || 'Your Company',
        audienceCompany: context.audienceCompany || undefined,
        audience: context.audience || 'Business leaders and decision makers'
      };
    } catch (error) {
      console.error('❌ Context extraction failed:', error);
      return {
        myCompany: 'Your Company',
        audience: 'Business leaders and decision makers'
      };
    }
  };

  /**
   * Main generation handler
   */
  const handleDesignerGenerate = useCallback(async () => {
    if (!rawNotes.trim()) {
      setError('Please paste your notes or content first.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCurrentPhase('planning');
    setProgressMessage('Initializing Designer Mode...');
    setCurrentSlideProgress(0);
    setTotalSlides(slideCount);
    setTimeElapsed(0);
    startTimeRef.current = Date.now();

    // Start timer
    timerRef.current = window.setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    try {
      // Step 1: Extract presentation context with LLM (not regex!)
      setProgressMessage('🤖 Understanding your presentation context...');
      const context = await extractPresentationContext(rawNotes);
      console.log(`🏢 Presentation context:`, context);
      console.log(`   - My company (brand): ${context.myCompany}`);
      console.log(`   - Audience company: ${context.audienceCompany || 'None specified'}`);
      console.log(`   - Audience type: ${context.audience}`);

      // Build enhanced content with audience personalization
      let enhancedContent = rawNotes;
      if (context.audienceCompany) {
        enhancedContent = `[CONTEXT: Presenting to ${context.audienceCompany}. Personalize content for their needs and reference their products/challenges where relevant.]\n\n${rawNotes}`;
        console.log(`📝 Added audience personalization context for ${context.audienceCompany}`);
      }

      // Step 2: Generate designer outline with parallel agents
      const result = await generateDesignerOutline(
        {
          company: context.myCompany,
          content: enhancedContent,
          audience: context.audience,
          goal: 'Inform and persuade',
          slideCount: slideCount,
        },
        (progress: DesignerGenerationProgress) => {
          setCurrentPhase(progress.phase);
          setProgressMessage(progress.message);
          if (progress.currentSlide) setCurrentSlideProgress(progress.currentSlide);
          if (progress.totalSlides) setTotalSlides(progress.totalSlides);
        }
      );

      if (!result.success || !result.outline) {
        throw new Error(result.error || 'Failed to generate designer outline');
      }

      console.log('✅ Designer outline generated:', result.outline);
      console.log(`📊 Brand research found: ${result.outline.brandResearch.colors.length} colors`);

      // Step 3: Extract brand colors for theme
      const brandColors = result.outline.brandResearch.colors;

      // Validation: Warn if brand colors are using defaults
      if (brandColors.length === 0 || brandColors[0]?.hex === '#0052CC') {
        console.warn('⚠️ WARNING: Brand colors may not have been extracted correctly!');
        console.warn('   Using default colors instead of company brand colors');
        console.warn('   This may indicate a parsing issue');
      } else {
        console.log('✅ Brand colors extracted successfully:');
        brandColors.forEach((color, idx) => {
          console.log(`   ${idx + 1}. ${color.name}: ${color.hex} - ${color.usage}`);
        });
      }

      const theme = {
        primaryColor: brandColors[0]?.hex || '#0052CC',
        secondaryColor: brandColors[1]?.hex || '#172B4D',
        backgroundColor: '#FFFFFF',
        textColor: '#172B4D',
      };

      console.log('🎨 Theme created from brand research:', theme);

      // Step 4: Generate slides from specifications
      setCurrentPhase('creating');
      setProgressMessage('Creating slides from designer specifications...');
      setCurrentSlideProgress(0);

      const slideSpecs = result.outline.slideSpecifications;
      const slides: Slide[] = [];

      // Limit slides in test mode
      const specsToGenerate = isTestMode && slideSpecs.length > 5
        ? slideSpecs.slice(0, 5)
        : slideSpecs;

      for (let i = 0; i < specsToGenerate.length; i++) {
        const spec = specsToGenerate[i];
        setProgressMessage(`Creating slide ${i + 1} of ${specsToGenerate.length}: ${spec.title}`);
        setCurrentSlideProgress(i + 1);

        // Build prompt from specification
        const prompt = buildPromptFromSpec(spec, result.outline.brandResearch);
        console.log(`📝 Slide ${i + 1} prompt:`, prompt.substring(0, 200) + '...');

        // Designer Mode does NOT use styleLibrary by default (prevents using old references from other sessions)
        // Only use uploadedStyleReference if explicitly provided
        const styleRef = uploadedStyleReference?.src || null;

        if (styleRef) {
          console.log(`🎨 Using uploaded style reference for slide ${i + 1}`);
        } else {
          console.log(`🎨 No style reference for slide ${i + 1} - generating from brand guidelines only`);
        }

        // Generate slide with brand theme
        const { images } = await createSlideFromPrompt(
          styleRef,
          prompt,
          false,
          [],
          undefined,
          theme,
          null
        );

        const finalImage = await launderImageSrc(images[0]);

        slides.push({
          id: `designer-slide-${Date.now()}-${i}`,
          originalSrc: finalImage,
          history: [finalImage],
          name: spec.title || `Slide ${i + 1}`,
        });

        console.log(`✅ Slide ${i + 1} created successfully`);
      }

      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Step 5: Upload to editor
      setGeneratedSlides(slides);
      onDeckUpload(slides);

      setCurrentPhase('complete');
      setProgressMessage(`🎉 Designer Mode complete! ${slides.length} slides generated in ${Math.floor(timeElapsed)}s`);

      // Show action bubble
      setShowActionBubble(true);

      // Create comprehensive debug session
      const debugLogs: DebugLog[] = [
        {
          title: "User Input (Notes)",
          content: rawNotes
        },
        {
          title: "Presentation Context (LLM Extraction)",
          content: JSON.stringify(context, null, 2)
        },
        {
          title: "Master Planning Agent Output (Brand Research + Architecture)",
          content: result.rawOutput || "Not available"
        },
        {
          title: "Brand Colors Extracted",
          content: result.outline.brandResearch.colors.map((c, i) =>
            `${i + 1}. ${c.name}: ${c.hex} - ${c.usage}`
          ).join('\n')
        },
        {
          title: "Theme Created",
          content: JSON.stringify(theme, null, 2)
        },
        {
          title: "Slide Specifications",
          content: result.outline.slideSpecifications.map((spec, i) =>
            `\n=== SLIDE ${i + 1}: ${spec.title} ===\nHeadline: ${spec.headline}\nInfo Density: ${spec.infoDensity}\nVisual Approach: ${spec.visualApproach}\nBackground: ${spec.backgroundColor}`
          ).join('\n\n')
        },
        ...slideSpecs.map((spec, i) => ({
          title: `Slide ${i + 1} - Imagen Prompt`,
          content: buildPromptFromSpec(spec, result.outline.brandResearch)
        }))
      ];

      const debugSession: DebugSession = {
        id: `designer-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: 'Success',
        workflow: 'Deck Task',
        initialPrompt: `Designer Mode: ${slideCount} slides for ${context.myCompany}`,
        finalImages: slides.map(s => s.originalSrc),
        logs: debugLogs,
        model: 'gemini-2.5-pro + gemini-2.5-flash-image',
        deepMode: false
      };

      setDebugSessions(prev => [...prev, debugSession]);
      console.log('📊 Debug session created:', debugSession.id);

      // Auto-save session log (downloads file + console logs)
      autoSaveSession(debugSession, {
        mode: 'designer',
        timestamp: new Date().toISOString(),
        duration: timeElapsed,
        slideCount: slides.length,
        company: context.myCompany
      });
      console.log('💾 Session log auto-saved!');

    } catch (err: any) {
      console.error('Designer Mode generation failed:', err);
      setError(err.message || 'Failed to generate designer deck. Please try again.');
      setCurrentPhase('error');
      setProgressMessage(`Error: ${err.message}`);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } finally {
      setIsGenerating(false);
    }
  }, [rawNotes, slideCount, uploadedStyleReference, styleLibrary, isTestMode, onDeckUpload]);

  /**
   * Style reference upload handler
   */
  const handleStyleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setError(null);

    try {
      if (file.type === 'application/pdf') {
        // Process all pages and add to style library
        const fileReader = new FileReader();
        const pdfPages = await new Promise<StyleLibraryItem[]>((resolve, reject) => {
          fileReader.onload = async (event) => {
            try {
              const typedarray = new Uint8Array(event.target?.result as ArrayBuffer);
              const pdf = await pdfjsLib.getDocument(typedarray).promise;
              const pagePromises: Promise<StyleLibraryItem | null>[] = [];

              for (let i = 1; i <= pdf.numPages; i++) {
                pagePromises.push((async (pageNum): Promise<StyleLibraryItem | null> => {
                  const page = await pdf.getPage(pageNum);
                  const viewport = page.getViewport({ scale: 1.5 });
                  const canvas = document.createElement('canvas');
                  canvas.height = viewport.height;
                  canvas.width = viewport.width;
                  const context = canvas.getContext('2d');
                  if (context) {
                    await page.render({ canvasContext: context, viewport }).promise;
                    const id = `${file.name}-p${pageNum}-${Date.now() + pageNum}`;
                    const src = canvas.toDataURL('image/png');
                    return { id, src, name: `${file.name.replace(/\.pdf$/i, '')} - Page ${pageNum}` };
                  }
                  return null;
                })(i));
              }
              const resolvedItems = await Promise.all(pagePromises);
              resolve(resolvedItems.filter((item): item is StyleLibraryItem => item !== null));
            } catch (err) {
              console.error("PDF processing error:", err);
              reject(new Error("Failed to process PDF file. It may be corrupted."));
            }
          };
          fileReader.readAsArrayBuffer(file);
        });

        if (pdfPages.length > 0 && onLibraryUpload) {
          onLibraryUpload(pdfPages);
          setUploadedStyleReference({ src: pdfPages[0].src, name: file.name });
        } else if (pdfPages.length > 0) {
          setUploadedStyleReference({ src: pdfPages[0].src, name: file.name });
        } else {
          throw new Error('PDF has no pages');
        }
      } else if (file.type.startsWith('image/')) {
        const styleSrc = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });
        setUploadedStyleReference({ src: styleSrc, name: file.name });
      } else {
        throw new Error('Unsupported file type. Please use an image or PDF file.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Loading state during generation
  if (isGenerating) {
    const phaseInfo = {
      planning: { emoji: '🧠', title: 'Master Planning', desc: 'Researching brand and architecting deck...' },
      parallel: { emoji: '⚡', title: 'Parallel Agents', desc: 'Creating detailed slide specifications...' },
      creating: { emoji: '🎨', title: 'Creating Slides', desc: 'Generating designer-quality slides...' },
      complete: { emoji: '✅', title: 'Complete', desc: 'Your deck is ready!' },
      error: { emoji: '❌', title: 'Error', desc: 'Something went wrong' },
    };

    const info = phaseInfo[currentPhase];
    const progressPercent = currentPhase === 'creating'
      ? Math.round((currentSlideProgress / totalSlides) * 100)
      : currentPhase === 'complete'
      ? 100
      : 50;

    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center p-12 animate-fade-in">
        <div className="mb-8">
          <div className="text-6xl mb-4 animate-bounce">{info.emoji}</div>
          <h2 className="font-display text-3xl font-bold gradient-text mb-2">{info.title}</h2>
          <p className="text-brand-text-secondary text-lg mb-4">{info.desc}</p>
          <Spinner text={progressMessage} size="h-12 w-12" />
        </div>

        <div className="w-full max-w-md mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-brand-text-primary">Progress</span>
            <span className="text-sm font-bold gradient-text">{progressPercent}%</span>
          </div>
          <div className="w-full bg-brand-border rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-brand-primary-500 via-brand-accent-500 to-brand-primary-500 transition-all duration-500 animate-shimmer"
              style={{ width: `${progressPercent}%`, backgroundSize: '200% 100%' }}
            ></div>
          </div>
        </div>

        {currentPhase === 'creating' && (
          <div className="text-sm text-brand-text-tertiary">
            Slide {currentSlideProgress} of {totalSlides} • {timeElapsed}s elapsed
          </div>
        )}

        {currentPhase === 'parallel' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl max-w-md">
            <p className="text-blue-700 text-sm font-medium">
              🚀 Parallel agents are creating {totalSlides} detailed slide specifications simultaneously
            </p>
          </div>
        )}

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
      {/* Floating Action Bubble */}
      {showActionBubble && !isGenerating && (
        <FloatingActionBubble
          isVisible={showActionBubble}
          mode="initial"
          onGenerateSlides={() => {}}
          onChangeStyle={() => {}}
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
          <h1 className="font-display text-5xl md:text-6xl font-bold gradient-text mb-3">
            Designer Mode
          </h1>
          <p className="text-brand-text-secondary text-lg font-light">
            AI researches your brand, creates detailed specifications, and generates designer-quality slides
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13 7H7v6h6V7z" />
              <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium text-purple-700">
              Powered by parallel AI agents • Brand research • Visual hierarchy framework
            </span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-card-lg border border-brand-border/50 flex flex-col animate-scale-in">
          <div className="flex flex-col">
            <div className="mb-4 text-center">
              <h3 className="font-display font-semibold text-lg text-brand-text-primary mb-2">
                Share Your Content
              </h3>
              <p className="text-brand-text-secondary text-sm">
                Paste your notes, case study, or presentation content. AI will auto-detect your company and brand.
              </p>
            </div>

            <textarea
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="Paste your content here... (e.g., 'Atlassian case study: How Acme Corp improved team collaboration with 85% adoption in 30 days using Jira and Confluence...')"
              className="input-premium w-full p-5 text-sm bg-brand-surface rounded-2xl resize-none text-brand-text-primary placeholder-brand-text-tertiary h-[200px] font-light leading-relaxed overflow-y-auto"
            />

            {/* Slide Count Selector */}
            <div className="mt-4 pt-4 border-t border-brand-border/30">
              <div className="flex items-center justify-between mb-3">
                <label className="font-display text-sm font-semibold text-brand-text-primary">
                  Number of Slides
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSlideCount(Math.max(5, slideCount - 1))}
                    className="w-8 h-8 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-primary-500 hover:bg-brand-primary-50 transition-all flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <span className="font-display text-2xl font-bold gradient-text min-w-[3ch] text-center">
                    {slideCount}
                  </span>
                  <button
                    onClick={() => setSlideCount(Math.min(20, slideCount + 1))}
                    className="w-8 h-8 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-primary-500 hover:bg-brand-primary-50 transition-all flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-brand-text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Style Reference Upload */}
            <div className="mt-4 pt-4 border-t border-brand-border/30">
              <h4 className="font-display text-sm font-semibold text-brand-text-primary mb-3 text-center flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-brand-primary-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" />
                </svg>
                Style Reference <span className="text-brand-text-tertiary font-normal">(Optional)</span>
              </h4>

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
              <input ref={styleUploadInputRef} type="file" className="sr-only" accept="application/pdf,image/*" onChange={handleStyleFileChange} />
            </div>

            {/* Generate Button */}
            <div className="pt-6">
              <button
                onClick={handleDesignerGenerate}
                disabled={!rawNotes || isGenerating}
                className="btn btn-primary w-full text-base py-4 shadow-btn hover:shadow-btn-hover"
              >
                {isGenerating ? (
                  <Spinner size="h-5 w-5" />
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 7H7v6h6V7z" />
                      <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                    </svg>
                    Generate with Designer Mode
                  </>
                )}
              </button>
              <p className="mt-3 text-xs text-brand-text-tertiary text-center">
                ⚡ Uses parallel AI agents • Researches brand • Creates {slideCount} designer-quality slides • ~3-4 minutes
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm animate-slide-down">
            <p className="text-red-600 text-sm font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Floating Debug Button (temporary for development) */}
      {debugSessions.length > 0 && (
        <button
          onClick={() => {
            setSelectedSession(debugSessions[debugSessions.length - 1]);
            setShowSessionInspector(true);
          }}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg transition-all hover:scale-105"
          title="View Debug Sessions"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold text-sm">Debug ({debugSessions.length})</span>
        </button>
      )}

      {/* Session Inspector Panel */}
      {showSessionInspector && selectedSession && (
        <SessionInspectorPanel
          session={selectedSession}
          onClose={() => setShowSessionInspector(false)}
        />
      )}
    </div>
  );
};

export default DesignerModeGenerator;
