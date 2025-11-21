
import React, { useState, useEffect } from 'react';
import { AppState, WorkflowStep, BrandProfile, SlideContent } from '../types';
import { MOCK_BRAND_PROFILE, INITIAL_SLIDES, DEMO_PROMPT, PLAN_STEPS } from '../constants';
import { analyzeBrand, generateDeckStructure } from '../services/geminiService';
import { SlideRenderer } from './SlideRenderer';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Sparkles, Search, Layers, Cpu, ShieldCheck, CheckCircle2, Loader2, Globe, Plus, ArrowUp, FileText, Play, Library, Maximize2, Share2, Coins, Check, Brain
} from 'lucide-react';

// --- Cursor Component ---
const Cursor = ({ state }: { state: AppState }) => {
   const controls = useAnimation();
   useEffect(() => {
      const sequence = async () => {
         if (state === AppState.IDLE) controls.set({ top: "110%", left: "90%", opacity: 0 });
         if (state === AppState.TYPING_PROMPT) await controls.start({ opacity: 1, top: "45%", left: "48%", transition: { duration: 1, ease: "easeOut" } });
         if (state === AppState.ANALYZING_REQUEST) {
             await controls.start({ top: "62%", left: "60%", transition: { duration: 0.6, ease: "easeInOut" } });
             await controls.start({ scale: 0.8, transition: { duration: 0.1 } });
             await controls.start({ scale: 1, transition: { duration: 0.1 } });
             await controls.start({ opacity: 0, transition: { delay: 0.3 } });
         }
         if (state === AppState.REVIEWING_PLAN) {
             controls.set({ top: "90%", left: "80%", opacity: 1 });
             await new Promise(r => setTimeout(r, 500));
             await controls.start({ top: "50%", left: "50%", transition: { duration: 1.2, ease: "easeInOut" } });
             await controls.start({ opacity: 0, transition: { duration: 0.3 } });
         }
      };
      sequence();
   }, [state, controls]);

   return (
      <motion.div animate={controls} className="absolute z-[100] pointer-events-none drop-shadow-2xl" initial={{ opacity: 0 }}>
         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z" fill="black" stroke="white" strokeWidth="2" strokeLinejoin="round"/></svg>
      </motion.div>
   );
};

// --- Visualizer Component ---
const Visualizer = ({ step, progress, brandProfile }: { step: WorkflowStep | null, progress: number, brandProfile: BrandProfile | null }) => (
  <div className="relative w-full h-full bg-slate-50/50 overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-multiply pointer-events-none" />
    
    <AnimatePresence mode="wait">
      {step === WorkflowStep.RESEARCH && (
         <motion.div key="research" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center opacity-20 blur-sm scale-90">
            <div className="relative w-80 h-80 flex items-center justify-center">
               <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border border-dashed border-blue-200 rounded-full" />
               <div className="relative z-10 bg-white p-4 rounded-full shadow-xl border border-blue-100"><Globe className="text-blue-600 w-8 h-8" /></div>
               {[0, 60, 120, 180, 240, 300].map((deg, i) => (
                  <motion.div key={i} className="absolute w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" initial={{ x: 0, y: 0, opacity: 0 }} animate={{ x: Math.cos(deg * (Math.PI / 180)) * 120, y: Math.sin(deg * (Math.PI / 180)) * 120, opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }} />
               ))}
            </div>
         </motion.div>
      )}

      {step === WorkflowStep.ASSETS && brandProfile && (
        <motion.div key="assets" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center opacity-20 blur-sm scale-90">
            <div className="w-[70%] bg-white rounded-2xl border border-slate-100 shadow-2xl p-6 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600" />
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-14 h-14 rounded-full border-4 border-slate-50 shadow-inner flex-shrink-0" style={{background: brandProfile.primaryColor}} />
                 <div className="flex-1"><h3 className="font-bold text-xl text-slate-900">{brandProfile.name}</h3></div>
               </div>
            </div>
        </motion.div>
      )}

      {step === WorkflowStep.CONTEXT && (
         <motion.div key="context" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden opacity-20 blur-sm scale-90">
            <div className="grid grid-cols-5 gap-3 opacity-40 scale-105 rotate-3 origin-center">
               {[...Array(20)].map((_, i) => <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }} className={`w-16 h-10 rounded border border-slate-300 ${i === 7 ? 'bg-blue-100 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white'}`} />)}
            </div>
         </motion.div>
      )}

      {(step === WorkflowStep.STRUCTURE || step === WorkflowStep.GENERATION) && (
        <motion.div key="generation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center opacity-20 blur-sm scale-90">
            <div className="w-3/4 max-w-sm">
              <div className="grid grid-cols-4 gap-3 mt-8">{[1,2,3,4].map(i => <motion.div key={i} className="aspect-video bg-white shadow-sm border border-slate-200 rounded-md relative overflow-hidden" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} />)}</div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface DemoPlayerProps {
  onDeductCredits: (amount: number) => void;
  externalTrigger?: number;
  customPrompt?: string;
}

export const DemoPlayer: React.FC<DemoPlayerProps> = ({ onDeductCredits, externalTrigger, customPrompt }) => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep | null>(null);
  const [promptText, setPromptText] = useState("");
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [currentPlanStep, setCurrentPlanStep] = useState(-1);

  // Handle external triggers (e.g. from Hero input)
  useEffect(() => {
    if (externalTrigger && state === AppState.IDLE) {
      setPromptText(customPrompt || DEMO_PROMPT);
      setState(AppState.ANALYZING_REQUEST);
    }
  }, [externalTrigger, customPrompt, state]);

  const startDemo = () => {
    if (state !== AppState.IDLE) return;
    setState(AppState.TYPING_PROMPT);
  };

  useEffect(() => {
    if (state === AppState.TYPING_PROMPT) {
      if (promptText.length < DEMO_PROMPT.length) {
         let i = 0;
         const interval = setInterval(() => {
         if (i < DEMO_PROMPT.length) { setPromptText(DEMO_PROMPT.substring(0, i + 1)); i++; } 
         else { clearInterval(interval); setTimeout(() => setState(AppState.ANALYZING_REQUEST), 500); }
         }, 20);
         return () => clearInterval(interval);
      } else {
         setTimeout(() => setState(AppState.ANALYZING_REQUEST), 500);
      }
    }
  }, [state]);

  useEffect(() => {
    if (state === AppState.ANALYZING_REQUEST) { const timer = setTimeout(() => setState(AppState.REVIEWING_PLAN), 2500); return () => clearTimeout(timer); }
  }, [state]);
  
  // Wait on the plan for a moment before starting
  useEffect(() => {
    if (state === AppState.REVIEWING_PLAN) { const timer = setTimeout(() => runWorkflow(), 3000); return () => clearTimeout(timer); }
  }, [state]);

  const runWorkflow = async () => {
    setState(AppState.EXECUTING_WORKFLOW);
    onDeductCredits(4); 
    
    // Step 1: Research
    setCurrentPlanStep(0);
    setWorkflowStep(WorkflowStep.RESEARCH); 
    await new Promise(r => setTimeout(r, 1800));
    
    // Step 2: Similar Slides
    setCurrentPlanStep(1);
    setWorkflowStep(WorkflowStep.CONTEXT);
    await new Promise(r => setTimeout(r, 1800));

    // Step 3: Learn Design
    setCurrentPlanStep(2);
    setWorkflowStep(WorkflowStep.ASSETS);
    let brand = MOCK_BRAND_PROFILE;
    try { if (process.env.API_KEY) brand = await analyzeBrand("Nike"); } catch (e) {}
    setBrandProfile(brand);
    await new Promise(r => setTimeout(r, 2000));

    // Step 4: Designing Slides
    setCurrentPlanStep(3);
    setWorkflowStep(WorkflowStep.STRUCTURE);
    await new Promise(r => setTimeout(r, 1500));

    // Step 5: Architecture Slide
    setCurrentPlanStep(4);
    setWorkflowStep(WorkflowStep.GENERATION);
    let generatedSlides = INITIAL_SLIDES;
    try { if (process.env.API_KEY) generatedSlides = await generateDeckStructure("BigQuery", "Eng", brand); } catch (e) {}
    setSlides(generatedSlides);
    await new Promise(r => setTimeout(r, 1500));
    
    // Step 6: Pain Points
    setCurrentPlanStep(5);
    await new Promise(r => setTimeout(r, 1500));

    // Complete
    setCurrentPlanStep(6); // All done
    setState(AppState.COMPLETE);
  };

  useEffect(() => {
    if (state === AppState.COMPLETE) { const interval = setInterval(() => { setCurrentSlideIndex(prev => (prev + 1) % slides.length); }, 6000); return () => clearInterval(interval); }
  }, [state, slides.length]);

  return (
    <div className="w-full h-full bg-white flex flex-col relative font-sans overflow-hidden rounded-xl">
       {/* Only show cursor if we are simulating the typing/clicking from an idle state internally */}
       {!externalTrigger && <Cursor state={state} />}
       
       {/* Background Visualizer - Persistent but subtle during execution */}
       <div className="absolute inset-0 z-0">
          {(state === AppState.EXECUTING_WORKFLOW || state === AppState.REVIEWING_PLAN) && (
              <Visualizer step={workflowStep} progress={progress} brandProfile={brandProfile} />
          )}
       </div>

       <div className="flex-1 relative z-10">
          <AnimatePresence mode="wait">
            {/* Phase 1: Input & Thinking */}
            {(state === AppState.IDLE || state === AppState.TYPING_PROMPT || state === AppState.ANALYZING_REQUEST) && (
               <motion.div key="input" initial={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(10px)" }} className="absolute inset-0 flex items-center justify-center p-8 bg-white z-20">
                  <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-100 p-6 relative ring-1 ring-slate-200/50">
                     <textarea 
                       value={promptText} 
                       readOnly 
                       placeholder="Describe your presentation..." 
                       className="w-full h-24 text-lg text-slate-800 resize-none outline-none bg-transparent placeholder:text-slate-300 font-light" 
                     />
                     {state === AppState.IDLE && <div className="absolute inset-0 cursor-pointer z-10 flex items-center justify-center" onClick={startDemo}>
                        <motion.div whileHover={{ scale: 1.05 }} className="bg-slate-900/5 text-slate-400 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                           <Play size={14} fill="currentColor" /> Click to view demo
                        </motion.div>
                     </div>}
                     {state === AppState.ANALYZING_REQUEST && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-4 right-6 flex items-center gap-2 text-xs font-bold text-blue-600">
                           <Brain size={14} className="animate-pulse" /> Thinking...
                        </motion.div>
                     )}
                  </div>
               </motion.div>
            )}

            {/* Phase 2 & 3: Plan & Execution - Centered Card */}
            {(state === AppState.REVIEWING_PLAN || state === AppState.EXECUTING_WORKFLOW) && (
               <motion.div key="plan" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 overflow-hidden ring-1 ring-slate-200/50 relative">
                     {/* Header */}
                     <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                           <Sparkles size={16} className="text-purple-500" /> 
                           {state === AppState.REVIEWING_PLAN ? "Proposed Plan" : "Executing Agent"}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">
                           ID: #8832-A
                        </div>
                     </div>
                     
                     {/* Plan Steps List */}
                     <div className="p-2">
                        {PLAN_STEPS.map((step, i) => {
                           const isActive = i === currentPlanStep && state === AppState.EXECUTING_WORKFLOW;
                           const isCompleted = i < currentPlanStep && state === AppState.EXECUTING_WORKFLOW;
                           
                           return (
                              <motion.div 
                                 key={i} 
                                 initial={{ opacity: 0, x: -10 }} 
                                 animate={{ opacity: 1, x: 0 }} 
                                 transition={{ delay: i * 0.1 }}
                                 className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-blue-50/80 shadow-sm scale-[1.02]' : 'hover:bg-slate-50'}`}
                              >
                                 <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                                    {isCompleted ? (
                                       <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="bg-green-500 text-white rounded-full p-1">
                                          <Check size={12} strokeWidth={3} />
                                       </motion.div>
                                    ) : isActive ? (
                                       <Loader2 size={18} className="text-blue-600 animate-spin" />
                                    ) : (
                                       <div className="w-2 h-2 rounded-full bg-slate-200" />
                                    )}
                                 </div>
                                 
                                 <div className="flex-1">
                                    <div className={`text-sm font-medium transition-colors ${isActive ? 'text-blue-900' : isCompleted ? 'text-slate-700' : 'text-slate-500'}`}>
                                       {step.title}
                                    </div>
                                    {(isActive || state === AppState.REVIEWING_PLAN) && (
                                       <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="text-[10px] text-slate-400 mt-0.5">
                                          {step.description}
                                       </motion.div>
                                    )}
                                 </div>
                              </motion.div>
                           );
                        })}
                     </div>

                     {/* Footer Status */}
                     <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                        <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center justify-center gap-2">
                           {state === AppState.REVIEWING_PLAN ? (
                              <>Waiting for approval<span className="w-1 h-1 bg-slate-300 rounded-full animate-ping" /></>
                           ) : (
                              <>Processing<Loader2 size={10} className="animate-spin" /></>
                           )}
                        </div>
                     </div>
                  </div>
               </motion.div>
            )}

            {/* Phase 4: Complete */}
            {state === AppState.COMPLETE && (
               <motion.div key="slides" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-slate-50">
                  <div className="h-10 border-b border-slate-200 bg-white flex items-center justify-between px-4 relative z-20 shadow-sm">
                      <div className="flex gap-2 items-center"><div className="p-1 bg-blue-50 rounded text-blue-600"><FileText size={14} /></div><span className="text-xs font-bold text-slate-700">Deck_v1.pptx</span><span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded font-bold uppercase tracking-wider">Ready</span></div>
                      <button onClick={() => { setBrandProfile(null); setSlides([]); setState(AppState.IDLE); setPromptText(""); setCurrentPlanStep(-1); }} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"><Maximize2 size={14} className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <div className="absolute inset-0 top-10"><AnimatePresence mode="wait"><motion.div key={currentSlideIndex} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}><SlideRenderer slide={slides[currentSlideIndex]} brand={brandProfile || MOCK_BRAND_PROFILE} /></motion.div></AnimatePresence></div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">{slides.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlideIndex ? 'w-6 bg-slate-800' : 'w-1.5 bg-slate-300'}`} />)}</div>
               </motion.div>
            )}
          </AnimatePresence>
       </div>
       
       {/* Step Indicators Footer */}
       <div className="h-10 border-t border-slate-100 flex items-center justify-center gap-8 bg-white z-10">
          {[WorkflowStep.RESEARCH, WorkflowStep.ASSETS, WorkflowStep.CONTEXT, WorkflowStep.STRUCTURE, WorkflowStep.GENERATION].map((step, idx) => (
             <div key={idx} className="flex flex-col items-center gap-1 group cursor-default">
                <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${workflowStep === step ? 'bg-blue-600 scale-125' : (workflowStep && idx < Object.values(WorkflowStep).indexOf(workflowStep)) ? 'bg-blue-200' : 'bg-slate-200'}`} />
             </div>
          ))}
       </div>
    </div>
  );
};
