
import React, { useState, useEffect } from 'react';
import { SlideContent, BrandProfile } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Server, Globe, ArrowRight, Terminal, Zap, Cpu, Activity, Lock, Cloud, Check, Palette, Type, FileText, RefreshCw, Layers, Sparkles, Share2, BarChart3, Clock, AlertCircle, Bot, Code, TrendingUp, ShieldCheck, FileJson, Shield, CheckCircle2 } from 'lucide-react';

interface SlideRendererProps {
  slide: SlideContent;
  brand: BrandProfile;
}

export const SlideRenderer: React.FC<SlideRendererProps> = ({ slide, brand }) => {
  const primaryColor = brand.primaryColor;
  const secondaryColor = brand.secondaryColor;
  const [isBranded, setIsBranded] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    setIsBranded(false);
    setShowVerification(false);
    // Delay branding trigger specifically for 'impact' and 'security' slides to allow reading the "before" state
    const brandingDelay = (slide.type === 'impact' || slide.type === 'security') ? 2500 : 1800; 
    const brandTimer = setTimeout(() => setIsBranded(true), brandingDelay); 
    const verifyTimer = setTimeout(() => setShowVerification(true), brandingDelay + 1500);
    return () => {
      clearTimeout(brandTimer);
      clearTimeout(verifyTimer);
    };
  }, [slide]);

  const renderContent = () => {
    switch (slide.type) {
      case 'title':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center relative z-10 p-12">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-10 relative"
            >
               <div className={`absolute inset-0 blur-3xl opacity-30 transition-all duration-1000 ${isBranded ? 'bg-blue-500' : 'bg-slate-400'}`} />
               <div className={`w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-bold shadow-2xl relative z-10 transition-all duration-1000 ${isBranded ? 'text-white' : 'bg-slate-200 text-slate-400'}`}
                    style={isBranded ? { background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` } : {}}>
                  {brand.name.charAt(0)}
               </div>
            </motion.div>
            <div className="space-y-6 max-w-4xl mx-auto relative z-10">
              <motion.h1 className={`text-7xl font-bold tracking-tight leading-tight transition-all duration-1000 ${isBranded ? 'text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600' : 'text-slate-300'}`}>
                {slide.title}
              </motion.h1>
              <motion.div className="flex items-center justify-center gap-4">
                 <span className="h-[1px] w-12 bg-slate-300" />
                 <p className={`text-2xl font-light tracking-wide transition-colors duration-1000 ${isBranded ? 'text-slate-500' : 'text-slate-300'}`}>{slide.content[0]}</p>
                 <span className="h-[1px] w-12 bg-slate-300" />
              </motion.div>
            </div>
          </div>
        );
      case 'pricing':
         return (
            <div className="h-full flex flex-col z-10 relative px-16 py-12">
               <div className="flex justify-between items-center mb-16">
                  <motion.h2 className={`text-4xl font-bold transition-colors duration-1000 ${isBranded ? 'text-slate-900' : 'text-slate-300'}`}>{slide.title}</motion.h2>
                  {isBranded && (
                     <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                        <RefreshCw size={12} className="animate-spin" /><span>Auto-calibrated to Enterprise Volume</span>
                     </motion.div>
                  )}
               </div>
               <div className="grid grid-cols-3 gap-8 h-full pb-8">
                  {[{ title: "Starter", price: "$0", user: "Free" }, { title: "Pro", price: "$29", user: "Per User" }, { title: "Enterprise", price: "Custom", user: "Unlimited", active: true }].map((plan, i) => (
                     <div key={i} className={`relative rounded-2xl border p-8 flex flex-col gap-6 transition-all duration-1000 ${plan.active ? (isBranded ? 'bg-slate-900 text-white border-slate-900 scale-105 shadow-2xl' : 'bg-slate-100 text-slate-400 border-slate-200') : (isBranded ? 'bg-white text-slate-600 border-slate-200' : 'bg-white text-slate-300 border-slate-100')}`}>
                        {plan.active && isBranded && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">Recommended</div>}
                        <div className="text-lg font-bold">{plan.title}</div>
                        <div className="flex-1"><div className={`text-5xl font-bold mb-2 transition-all duration-1000`}>{plan.active && isBranded ? <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">$12.5k</span> : plan.price}</div><div className="text-sm opacity-60">{plan.active && isBranded ? "/ mo (Annual Contract)" : plan.user}</div></div>
                        <div className="space-y-3">{[1,2,3].map((_, k) => <div key={k} className="flex items-center gap-3"><Check size={16} className={plan.active && isBranded ? "text-blue-400" : "opacity-50"} /><div className={`h-2 rounded-full w-full ${plan.active && isBranded ? "bg-slate-700" : "bg-slate-100"}`} /></div>)}</div>
                     </div>
                  ))}
               </div>
            </div>
         );
      case 'architecture':
         return (
            <div className="h-full w-full relative p-16 flex flex-col z-10">
               <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold text-slate-900 mb-12">System Architecture</motion.h2>
               
               <div className="flex-1 flex items-center justify-center gap-12">
                  {/* Source */}
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="w-64 p-6 rounded-2xl bg-white border border-slate-200 shadow-xl flex flex-col items-center relative">
                     <div className="absolute -top-3 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase">Source</div>
                     <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4"><Database size={32} /></div>
                     <div className="text-lg font-bold text-slate-900">Ingestion</div>
                     <div className="text-sm text-slate-500 text-center mt-2">Jira, Confluence, Bitbucket APIs</div>
                  </motion.div>

                  {/* Connector */}
                  <motion.div initial={{ width: 0 }} animate={{ width: 80 }} transition={{ delay: 0.5 }} className="h-[2px] bg-slate-300 relative">
                     <motion.div animate={{ x: [0, 80] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full" />
                  </motion.div>

                  {/* Processing */}
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }} className="w-72 p-8 rounded-3xl bg-slate-900 text-white shadow-2xl flex flex-col items-center relative z-10 border border-slate-700">
                     <div className="absolute -top-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase shadow-lg">Intelligence Engine</div>
                     <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-6 border border-white/20"><Cpu size={40} /></div>
                     <div className="text-xl font-bold text-white">Processing</div>
                     <div className="text-sm text-slate-400 text-center mt-2">Normalization & Enrichment</div>
                     <div className="mt-4 flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <div className="text-xs font-mono text-green-400">ACTIVE</div>
                     </div>
                  </motion.div>

                  {/* Connector */}
                  <motion.div initial={{ width: 0 }} animate={{ width: 80 }} transition={{ delay: 0.9 }} className="h-[2px] bg-slate-300 relative">
                     <motion.div animate={{ x: [0, 80] }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-green-500 rounded-full" />
                  </motion.div>

                  {/* Output */}
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }} className="w-64 p-6 rounded-2xl bg-white border border-slate-200 shadow-xl flex flex-col items-center relative">
                     <div className="absolute -top-3 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold uppercase">Destination</div>
                     <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4"><BarChart3 size={32} /></div>
                     <div className="text-lg font-bold text-slate-900">Analytics</div>
                     <div className="text-sm text-slate-500 text-center mt-2">Real-time Executive Dashboards</div>
                  </motion.div>
               </div>
               
               <div className="absolute bottom-0 right-0 p-12 opacity-10 pointer-events-none">
                  <Activity size={200} />
               </div>
            </div>
         );
      case 'impact':
        return (
          <div className="h-full w-full relative overflow-hidden">
             <ImpactScanner isBranded={isBranded} slide={slide} />
          </div>
        );
      case 'security':
        return (
          <div className="h-full w-full relative bg-white overflow-hidden">
             <SecurityScanner isBranded={isBranded} />
          </div>
        );
      default:
        return (
          <div className="h-full flex flex-col z-10 relative p-20">
            <motion.h2 className={`text-5xl font-bold mb-20 tracking-tight transition-colors duration-1000 ${isBranded ? 'text-slate-900' : 'text-slate-300'}`}>{slide.title}</motion.h2>
            <div className="grid grid-cols-1 gap-8">
              {slide.content.map((point, idx) => (
                <motion.div key={idx} className="flex items-center gap-8 group p-4 rounded-2xl hover:bg-slate-50 transition-colors duration-300">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-md transition-all duration-1000 ${isBranded ? '' : 'grayscale opacity-50'}`} style={isBranded ? { backgroundColor: `${primaryColor}10`, color: primaryColor } : { backgroundColor: '#e2e8f0', color: '#94a3b8' }}><Zap size={28} strokeWidth={2.5} /></div>
                  <div className="flex-1"><span className={`text-3xl font-light leading-tight block transition-colors duration-1000 ${isBranded ? 'text-slate-700' : 'text-slate-300'}`}>{point}</span></div>
                </motion.div>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full bg-white flex flex-col relative overflow-hidden">
      {slide.type !== 'title' && (
         <div className="absolute top-0 left-0 right-0 h-24 px-16 flex items-center justify-between z-20">
            <div className={`flex items-center gap-4 transition-opacity duration-1000 ${isBranded ? 'opacity-60' : 'opacity-20'}`}><div className="w-8 h-8 rounded bg-gradient-to-br from-slate-200 to-slate-300 shadow-sm"></div><span className="text-sm font-bold tracking-[0.2em] uppercase text-slate-400">{brand.name}</span></div>
            <div className="px-4 py-1 rounded-full border border-slate-200 bg-white/50 backdrop-blur text-xs text-slate-400 font-mono">CONFIDENTIAL</div>
         </div>
      )}
      <div className={`flex-1 relative transition-all duration-1000 ${isBranded ? '' : 'grayscale contrast-75'}`}>{renderContent()}</div>
      <AnimatePresence>
        {showVerification && (
           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-24 left-16 z-40 flex items-center gap-2">
              <div className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-mono flex items-center gap-2 shadow-xl border border-slate-700"><FileText size={12} className="text-blue-400" />{slide.type === 'pricing' ? 'pricing_v1.pptx' : 'existing_deck.pptx'}</div>
              <motion.div initial={{ width: 0 }} animate={{ width: 40 }} className="h-[1px] bg-blue-500" />
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]" />
           </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
         {showVerification && (
            <div className="absolute inset-0 z-40 pointer-events-none">
               <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute top-8 left-16 p-2 border-2 border-green-400 rounded-xl flex items-start gap-2">
                  <div className="bg-green-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded">MATCH</div><span className="text-xs font-mono text-green-600 font-bold bg-white/80 backdrop-blur px-1 rounded">Brand Identity</span>
               </motion.div>
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="absolute bottom-24 right-16 flex flex-col gap-2 items-end">
                  <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-lg border border-slate-200"><Palette size={14} className="text-purple-500" /><span className="text-xs font-bold text-slate-700">Palette Applied</span><div className="flex gap-1 ml-2"><div className="w-3 h-3 rounded-full" style={{background: brand.primaryColor}} /><div className="w-3 h-3 rounded-full" style={{background: brand.secondaryColor}} /></div></div>
               </motion.div>
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="absolute bottom-24 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur text-white px-4 py-2 rounded-full shadow-xl border border-slate-700"><Check size={14} className="text-green-400" /><span className="text-xs font-mono">Guidelines: Retained</span><span className="w-[1px] h-3 bg-slate-700 mx-1" /><Type size={14} className="text-blue-400" /><span className="text-xs font-mono">{brand.fontFamily}</span></div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
};

// --- Impact Component with Text-to-Visual Scanning Animation ---
const ImpactScanner = ({ isBranded, slide }: { isBranded: boolean, slide: SlideContent }) => {
   const [scanPercent, setScanPercent] = useState(0);

   useEffect(() => {
      if (isBranded) {
         const startTime = Date.now();
         const duration = 2500; // Slightly slower for the text transformation
         const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            setScanPercent(progress * 100);
            if (progress >= 1) clearInterval(interval);
         }, 16);
         return () => clearInterval(interval);
      } else {
         setScanPercent(0);
      }
   }, [isBranded]);

   return (
      <div className="absolute inset-0 bg-white">
         {/* Layer 1: BEFORE (Boring Text) */}
         <div className="absolute inset-0 flex flex-col px-20 py-16 bg-white">
            <div className="flex justify-between items-start mb-12">
               <h2 className="text-5xl font-serif text-black tracking-tight">Current Operational Challenges</h2>
               <span className="text-xs font-bold text-purple-500 uppercase tracking-wider border border-purple-200 px-2 py-1 rounded">GENERIC TEMPLATE</span>
            </div>
            <div className="space-y-10 pl-6 border-l-4 border-black/10">
               {slide.content && slide.content.map((item, i) => (
                  <div key={i} className="flex items-start gap-6">
                     <div className="w-3 h-3 mt-4 rounded-full bg-black/60 flex-shrink-0" />
                     <p className="text-4xl font-serif text-black/70 leading-tight">{item}</p>
                  </div>
               ))}
            </div>
            <div className="mt-auto text-sm text-black/30 font-serif italic">Confidential - Internal Assessment</div>
         </div>

         {/* Layer 2: AFTER (Beautiful Visuals) - Clipped */}
         <div 
            className="absolute inset-0 flex flex-col px-12 py-10 bg-slate-50 z-10"
            style={{ clipPath: `inset(0 ${100 - scanPercent}% 0 0)` }}
         >
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50/30" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[100px] mix-blend-multiply pointer-events-none" />
            
            <div className="flex justify-between items-end mb-12 relative z-10">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <div className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider rounded">Executive Summary</div>
                  </div>
                  <h2 className="text-4xl font-bold text-slate-900">Operational Impact Analysis</h2>
               </div>
               <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-600">
                  <Sparkles size={12} className="text-purple-500" /> <span className="text-purple-600 uppercase mr-1">CONTEXT-ADAPTED</span> & ON-BRAND
               </div>
            </div>

            {/* 3-Column Layout */}
            <div className="flex-1 grid grid-cols-3 gap-6 relative z-10">
               
               {/* Column 1: Silos -> Unified */}
               <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 flex flex-col relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-red-400" />
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-14 h-14 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><AlertCircle size={28} /></div>
                     <div className="text-xs font-bold text-slate-400 uppercase">Problem</div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Data Silos</h3>
                  <p className="text-sm text-slate-500 mb-8">Fragmented visibility across Jira, Confluence, and legacy tools.</p>
                  
                  <div className="mt-auto bg-slate-50 rounded-xl p-4 border border-slate-100 relative overflow-hidden group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors duration-500">
                     <div className="relative z-10">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1 group-hover:text-blue-400">Solution</div>
                        <div className="text-lg font-bold text-slate-900 group-hover:text-blue-900">Unified Data Plane</div>
                     </div>
                     <motion.div 
                        className="absolute -right-4 -bottom-4 text-blue-200 opacity-50 group-hover:opacity-100 transition-opacity duration-500"
                        animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                     >
                        <Layers size={64} />
                     </motion.div>
                  </div>
               </div>

               {/* Column 2: Latency -> Real-time */}
               <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 flex flex-col relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-orange-400" />
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-14 h-14 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><Clock size={28} /></div>
                     <div className="text-xs font-bold text-slate-400 uppercase">Problem</div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Reporting Lag</h3>
                  <p className="text-sm text-slate-500 mb-8">24-48 hour delays in executive decision making cycles.</p>
                  
                  <div className="mt-auto bg-slate-50 rounded-xl p-4 border border-slate-100 relative overflow-hidden group-hover:bg-green-50 group-hover:border-green-100 transition-colors duration-500">
                     <div className="relative z-10">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1 group-hover:text-green-500">Solution</div>
                        <div className="text-lg font-bold text-slate-900 group-hover:text-green-900">Real-time Streaming</div>
                     </div>
                     <motion.div 
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-100 transition-opacity duration-500"
                     >
                        <div className="flex gap-0.5 items-end h-8">
                        {[4, 8, 6, 10, 7].map((h,i) => (
                           <motion.div key={i} animate={{ height: [h*2, h*3, h*2] }} transition={{ repeat: Infinity, duration: 1, delay: i*0.1 }} className="w-1.5 bg-green-400 rounded-t-sm" />
                        ))}
                        </div>
                     </motion.div>
                  </div>
               </div>

               {/* Column 3: Manual -> Automated */}
               <div className="bg-white rounded-2xl border border-slate-100 shadow-xl p-6 flex flex-col relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-slate-400" />
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"><FileText size={28} /></div>
                     <div className="text-xs font-bold text-slate-400 uppercase">Problem</div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Manual Toil</h3>
                  <p className="text-sm text-slate-500 mb-8">20hrs/week spent on manual data consolidation.</p>
                  
                  <div className="mt-auto bg-slate-50 rounded-xl p-4 border border-slate-100 relative overflow-hidden group-hover:bg-purple-50 group-hover:border-purple-100 transition-colors duration-500">
                     <div className="relative z-10">
                        <div className="text-xs font-bold text-slate-400 uppercase mb-1 group-hover:text-purple-500">Solution</div>
                        <div className="text-lg font-bold text-slate-900 group-hover:text-purple-900">Fully Automated</div>
                     </div>
                     <motion.div 
                        className="absolute -right-2 -bottom-2 text-purple-200 opacity-50 group-hover:opacity-100 transition-opacity duration-500"
                     >
                        <Bot size={48} />
                     </motion.div>
                  </div>
               </div>
            </div>
         </div>

         {/* Scanner Line */}
         {scanPercent > 0 && scanPercent < 100 && (
            <div 
               className="absolute top-0 bottom-0 w-[2px] bg-purple-500 z-30 shadow-[0_0_20px_rgba(168,85,247,0.8)]"
               style={{ left: `${scanPercent}%` }}
            >
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-purple-500 flex items-center justify-center">
                  <Sparkles size={14} className="text-purple-600" />
               </div>
            </div>
         )}
      </div>
   );
}

// --- Security Scanner Component ---
const SecurityScanner = ({ isBranded }: { isBranded: boolean }) => {
   const [scanPercent, setScanPercent] = useState(0);

   useEffect(() => {
      if (isBranded) {
         const startTime = Date.now();
         const duration = 2500; 
         const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            setScanPercent(progress * 100);
            if (progress >= 1) clearInterval(interval);
         }, 16);
         return () => clearInterval(interval);
      } else {
         setScanPercent(0);
      }
   }, [isBranded]);

   return (
      <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
         <div className="relative w-full h-full bg-white overflow-hidden">
            
            {/* Layer 1: BEFORE (Boring Text List) */}
            <div className="absolute inset-0 p-20 flex flex-col">
               <div className="flex justify-between items-start mb-12">
                  <h3 className="text-5xl font-serif text-slate-900 tracking-tight">Security & Compliance</h3>
                  <span className="text-xs font-bold text-purple-500 uppercase tracking-wider border border-purple-200 px-2 py-1 rounded">GENERIC TEMPLATE</span>
               </div>
               <div className="space-y-6">
                  {["SOC2 Type II Pending", "ISO 27001 In Progress", "Manual Access Reviews", "Encryption at Rest"].map((item, i) => (
                     <div key={i} className="flex items-center gap-4 opacity-60">
                        <div className="w-2 h-2 bg-slate-400 rounded-full" />
                        <span className="text-3xl font-serif text-slate-600">{item}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Layer 2: AFTER (High Fidelity Grid) - Clipped */}
            <div 
               className="absolute inset-0 p-12 flex flex-col bg-slate-900 text-white"
               style={{ clipPath: `inset(0 ${100 - scanPercent}% 0 0)` }}
            >
               {/* Background Grid */}
               <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
               
               <div className="flex justify-between items-start mb-12 relative z-10">
                  <div>
                     <h3 className="text-4xl font-bold text-white tracking-tight mb-2">Enterprise Trust Center</h3>
                     <p className="text-slate-400">Bank-grade security infrastructure.</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-bold">
                     <ShieldCheck size={12} /> VERIFIED
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex items-center gap-4 group hover:bg-slate-800 hover:border-blue-500/50 transition-all">
                     <div className="w-16 h-16 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:text-blue-300 group-hover:scale-110 transition-transform">
                        <ShieldCheck size={32} />
                     </div>
                     <div>
                        <div className="text-xl font-bold text-white">SOC2 Type II</div>
                        <div className="text-sm text-slate-400">Audited & Certified</div>
                     </div>
                     <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 size={20} className="text-green-400" />
                     </div>
                  </div>

                  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex items-center gap-4 group hover:bg-slate-800 hover:border-purple-500/50 transition-all">
                     <div className="w-16 h-16 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:text-purple-300 group-hover:scale-110 transition-transform">
                        <Globe size={32} />
                     </div>
                     <div>
                        <div className="text-xl font-bold text-white">ISO 27001</div>
                        <div className="text-sm text-slate-400">International Standard</div>
                     </div>
                     <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 size={20} className="text-green-400" />
                     </div>
                  </div>

                   <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex items-center gap-4 group hover:bg-slate-800 hover:border-green-500/50 transition-all">
                     <div className="w-16 h-16 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 group-hover:text-green-300 group-hover:scale-110 transition-transform">
                        <FileJson size={32} />
                     </div>
                     <div>
                        <div className="text-xl font-bold text-white">GDPR Compliant</div>
                        <div className="text-sm text-slate-400">Data Sovereignty Ready</div>
                     </div>
                     <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 size={20} className="text-green-400" />
                     </div>
                  </div>

                  <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex items-center gap-4 group hover:bg-slate-800 hover:border-orange-500/50 transition-all">
                     <div className="w-16 h-16 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:text-orange-300 group-hover:scale-110 transition-transform">
                        <Lock size={32} />
                     </div>
                     <div>
                        <div className="text-xl font-bold text-white">AES-256 Encryption</div>
                        <div className="text-sm text-slate-400">At Rest & In Transit</div>
                     </div>
                     <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 size={20} className="text-green-400" />
                     </div>
                  </div>
               </div>
            </div>

            {/* Scanner Line */}
            {scanPercent > 0 && scanPercent < 100 && (
               <div 
                  className="absolute top-0 bottom-0 w-[2px] bg-blue-500 z-30 shadow-[0_0_20px_rgba(59,130,246,0.8)]"
                  style={{ left: `${scanPercent}%` }}
               >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900 rounded-full shadow-lg border-2 border-blue-500 flex items-center justify-center">
                     <Shield size={14} className="text-blue-400" />
                  </div>
               </div>
            )}
         </div>
      </div>
   );
}
