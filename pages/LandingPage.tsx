import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemoPlayer } from '../components/DemoPlayer';
import { Shield, Zap, Layers, ArrowRight, Brain, LayoutTemplate, Lock, Check, PlayCircle, CreditCard, Sparkles, Wand2, Globe, Database, FileText, Command, ChevronRight, Terminal, Activity, BarChart3, Share2, Search, Mic, FileJson, UploadCloud, CheckCircle2, ShieldCheck, ScanLine, MousePointer2 } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';

// --- UI Components ---

const Badge = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = 'primary', className = "", onClick }: { children: React.ReactNode, variant?: 'primary' | 'secondary' | 'ghost', className?: string, onClick?: () => void }) => {
  const baseClass = "px-5 py-2.5 rounded-lg font-medium text-sm transition-all active:scale-95 flex items-center gap-2";
  const variants = {
    primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20 border border-slate-900",
    secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm",
    ghost: "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
  };
  return <button onClick={onClick} className={`${baseClass} ${variants[variant]} ${className}`}>{children}</button>;
};

const BentoCard = ({ title, desc, children, className = "", size = "sm" }: any) => (
  <div className={`group relative rounded-3xl bg-white border border-slate-200 p-8 overflow-hidden hover:shadow-xl transition-all duration-500 ${size === "lg" ? "md:col-span-2" : ""} ${className}`}>
     <div className="relative z-10 h-full flex flex-col">
        <div className="flex-1 mb-6 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-500">
           {children}
        </div>
        <div>
           <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
           <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
        </div>
     </div>
     <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
  </div>
);

const IntegrationIcon = ({ icon: Icon, color }: any) => (
   <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center hover:-translate-y-1 hover:shadow-md transition-all duration-300">
      <Icon size={24} className={color} />
   </div>
);

const WorkflowStep = ({ step, active }: { step: any, active: boolean }) => (
  <div className={`flex gap-4 p-4 rounded-xl transition-all duration-500 ${active ? 'bg-white shadow-lg border border-slate-100 scale-105' : 'opacity-50 hover:opacity-80'}`}>
     <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
        <step.icon size={20} />
     </div>
     <div>
        <h4 className={`font-bold mb-1 transition-colors ${active ? 'text-slate-900' : 'text-slate-600'}`}>{step.title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
     </div>
  </div>
);

// --- Visual Assets ---

const GridBackground = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
    <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-blue-400 opacity-20 blur-[100px]"></div>
    <div className="absolute right-0 top-0 -z-10 h-[500px] w-[500px] bg-purple-400/10 blur-[120px] rounded-full mix-blend-multiply"></div>
  </div>
);

const Logo = ({ name, className }: { name: string, className?: string }) => (
  <div className={`flex items-center gap-2 font-bold text-lg tracking-tight text-slate-900 ${className}`}>
    <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-white text-xs">D</div>
    {name}
  </div>
);

// --- Sections ---

const Navbar = ({ onNavigateToLogin }: { onNavigateToLogin: () => void }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/50 h-14' : 'bg-transparent h-20'}`}>
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <div className="cursor-pointer">
          <Logo name="deckr.ai" />
        </div>

        <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-200/50 backdrop-blur-sm">
          {['Product', 'Solutions', 'Enterprise', 'Pricing'].map((item) => (
            <button key={item} className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all">
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onNavigateToLogin} className="text-sm font-medium text-slate-500 hover:text-slate-900 mr-2">
            Sign In
          </button>
          <Button variant="primary" onClick={onNavigateToLogin}>
            Start Free Trial
          </Button>
        </div>
      </div>
    </nav>
  );
};

const ProductFrame = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={`relative rounded-xl overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_20px_50px_-12px_rgba(0,0,0,0.12)] bg-white ${className}`}>
     <div className="h-10 bg-white border-b border-slate-100 flex items-center px-4 justify-between">
        <div className="flex gap-2">
           <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/50" />
           <div className="w-3 h-3 rounded-full bg-amber-400/20 border border-amber-400/50" />
           <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/50" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-md border border-slate-100 shadow-sm text-[10px] font-medium text-slate-400 min-w-[200px] justify-center">
           <Lock size={10} /> deckr.ai/workspace/campaigns/series-b
        </div>
        <div className="flex gap-3">
           <div className="w-4 h-4 rounded bg-slate-100" />
           <div className="w-4 h-4 rounded bg-slate-100" />
        </div>
     </div>
     <div className="flex h-[600px]">
        <div className="w-14 border-r border-slate-100 bg-slate-50/50 flex flex-col items-center py-4 gap-4">
           <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm"><Command size={16} /></div>
           <div className="w-full h-[1px] bg-slate-200" />
           {[LayoutTemplate, FileText, Database, Activity].map((Icon, i) => (
              <div key={i} className="p-2 rounded-md text-slate-400 hover:bg-white hover:text-slate-600 hover:shadow-sm transition-all cursor-pointer"><Icon size={18} /></div>
           ))}
        </div>
        <div className="flex-1 bg-white relative overflow-hidden">
           {children}
        </div>
     </div>
  </div>
);

// --- Main Landing Page Component ---

export const LandingPage = () => {
  const navigate = useNavigate();
  const [credits, setCredits] = useState(420);
  const [heroInput, setHeroInput] = useState("Tailor my Atlassian customer facing deck for my upcoming customer meeting with Nike.com");
  const [demoTrigger, setDemoTrigger] = useState(0);
  const demoRef = useRef<HTMLDivElement>(null);
  const [activeWorkflow, setActiveWorkflow] = useState(0);

  // Workflow Autoplay
  useEffect(() => {
     const interval = setInterval(() => setActiveWorkflow(prev => (prev + 1) % 3), 5000);
     return () => clearInterval(interval);
  }, []);

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleHeroGenerate = () => {
    setDemoTrigger(prev => prev + 1);
    demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const workflowSteps = [
    { icon: Layers, title: "1. SE prompts Deckr", desc: "Write prompt to customize meeting, generate demo data, add relevant info" },
    { icon: Database, title: "2. Paste discovery notes, call notes etc", desc: "Connect CRM notes or discovery calls. We identify pain points and map them to your existing solutions." },
    { icon: Sparkles, title: "3. Deck and Demo Data ready in 30 seconds tailored to your customer", desc: "We generate new slides that look exactly like your best designer made them, tailored to this specific deal." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 overflow-x-hidden">
      <Navbar onNavigateToLogin={handleNavigateToLogin} />

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
         <GridBackground />

         {/* Agentic Decorative Lines */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[500px] bg-gradient-to-b from-transparent via-slate-200 to-transparent -z-10" />
         <div className="absolute top-32 left-10 w-4 h-4 border-l border-t border-slate-300 -z-10" />
         <div className="absolute top-32 right-10 w-4 h-4 border-r border-t border-slate-300 -z-10" />

         <div className="max-w-6xl mx-auto text-center relative z-10">
            <motion.h1
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
               className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-8 leading-tight relative"
            >
               Clone Your{' '}
               <span className="relative inline-block">
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 blur-3xl" />
                  <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 animate-gradient-x">
                     Best SE
                  </span>
                  {/* Technical HUD Element */}
                  <div className="absolute -bottom-2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
                  <div className="absolute -bottom-2 left-[10%] w-1 h-1 bg-blue-500 rounded-full" />
                  <div className="absolute -bottom-2 right-[10%] w-1 h-1 bg-purple-500 rounded-full" />
               </span>
               , <br className="hidden md:block" />For every customer call
            </motion.h1>

            <motion.p
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
               className="text-xl text-slate-600 max-w-3xl mx-auto mb-12 font-normal leading-relaxed"
            >
               Bridge the gap between "Generic" and "Expert." Deckr is the AI agent that clones your top performer's workflow—handling the Research & Slides (Prep), the Synthetic Data (Demo), and Automates Technical Followups.
            </motion.p>

            {/* CTA Button */}
            <motion.div
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
               className="flex justify-center mb-24"
            >
               <button
                  onClick={() => demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl hover:shadow-slate-900/30"
               >
                  Book a Demo
               </button>
            </motion.div>

            {/* Product Demo Frame */}
            <motion.div
               ref={demoRef}
               initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
               className="max-w-6xl mx-auto relative z-10"
            >
               <ProductFrame className="shadow-2xl">
                  <DemoPlayer
                     onDeductCredits={(n) => setCredits(c => Math.max(0, c - n))}
                     externalTrigger={demoTrigger}
                     customPrompt={heroInput}
                  />
               </ProductFrame>
            </motion.div>
         </div>
      </section>

      {/* --- Workflow Section --- */}
      <section className="py-32 px-6 relative">
         <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
               <Badge className="bg-blue-50 text-blue-600 border-blue-100 mb-4">Deckr, Presales Copilot</Badge>
               <h2 className="text-4xl font-bold text-slate-900 mb-4">Your Content + Deal Context = Magic</h2>
               <p className="text-slate-500 max-w-2xl mx-auto">We generate same slides that you have in your library. We customize your approved assets to fit the customer's story.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
               <div className="space-y-6">
                  {workflowSteps.map((step, i) => (
                     <div key={i} onClick={() => setActiveWorkflow(i)} className="cursor-pointer">
                        <WorkflowStep step={step} active={activeWorkflow === i} />
                     </div>
                  ))}
               </div>
               
               {/* Workflow Visualization Container */}
               <div className="relative h-[500px] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-0 bg-slate-50/50 pattern-grid-lg opacity-50" />
                  <AnimatePresence mode="wait">
                     
                     {/* Visual 1: Dump Context (Hub & Spoke) */}
                     {activeWorkflow === 0 && (
                        <motion.div key="step1" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full flex items-center justify-center">
                           {/* Center Logo */}
                           <div className="w-24 h-24 bg-slate-900 rounded-2xl flex items-center justify-center z-20 shadow-2xl border-4 border-white">
                              <div className="text-white font-bold text-4xl">D</div>
                           </div>
                           
                           {/* Orbiting Integrations */}
                           {[
                              { icon: LayoutTemplate, color: "text-blue-500", label: "Sales Master Deck" },
                              { icon: FileText, color: "text-orange-500", label: "Pricing Slides" },
                              { icon: Database, color: "text-purple-500", label: "Tech Specs" },
                              { icon: FileText, color: "text-slate-500", label: "Case Studies" },
                              { icon: FileJson, color: "text-green-500", label: "Deep Research Customer" }
                           ].map((item, i) => (
                              <motion.div 
                                 key={i}
                                 className="absolute"
                                 initial={{ scale: 0, opacity: 0 }}
                                 animate={{ 
                                    scale: 1, 
                                    opacity: 1,
                                    rotate: 360 
                                 }}
                                 transition={{ 
                                    rotate: { duration: 30, repeat: Infinity, ease: "linear" },
                                    scale: { delay: i * 0.1 }
                                 }}
                                 style={{ width: '100%', height: '100%' }}
                              >
                                 <div 
                                    className="absolute top-1/2 left-1/2 w-16 h-16 -ml-8 -mt-8 bg-white rounded-xl shadow-lg border border-slate-100 flex flex-col items-center justify-center gap-1"
                                    style={{ transform: `rotate(${i * 72}deg) translateX(140px) rotate(-${i * 72}deg) rotate(-360deg)` }}
                                 >
                                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="flex flex-col items-center gap-1">
                                       <item.icon size={20} className={item.color} />
                                       <span className="text-[8px] font-bold text-slate-500 uppercase text-center leading-none px-1">{item.label}</span>
                                    </motion.div>
                                 </div>
                                 {/* Connection Line */}
                                 <div className="absolute top-1/2 left-1/2 w-[140px] h-[1px] bg-slate-200 -z-10 origin-left" style={{ transform: `rotate(${i * 72}deg)` }} />
                              </motion.div>
                           ))}
                           
                           <div className="absolute bottom-8 text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                              Getting pain points from discovery notes
                           </div>
                        </motion.div>
                     )}

                     {/* Visual 2: Planning (Scanning) */}
                     {activeWorkflow === 1 && (
                        <motion.div key="step2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
                           {/* Grid of Slides */}
                           <div className="grid grid-cols-3 gap-3 opacity-50 scale-95">
                              {[...Array(9)].map((_, i) => (
                                 <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="w-24 h-16 bg-white border border-slate-200 rounded shadow-sm overflow-hidden relative flex items-center justify-center"
                                 >
                                    {i === 4 ? <div className="text-[8px] font-bold text-slate-300">PAIN POINT</div> : <div className="h-2 w-12 bg-slate-100 rounded m-2" />}
                                    {i !== 4 && <div className="h-8 bg-slate-50 m-2 rounded-sm" />}
                                 </motion.div>
                              ))}
                           </div>

                           {/* Scanner Line */}
                           <motion.div 
                              className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent z-10 border-b-2 border-blue-500/30"
                              initial={{ top: '-100%' }}
                              animate={{ top: '100%' }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                           />

                           {/* Resulting Plan */}
                           <motion.div 
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 1, type: 'spring' }}
                              className="absolute z-20 bg-slate-900 text-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 border border-slate-700"
                           >
                              <div className="flex items-center gap-2 text-sm font-bold text-blue-300">
                                 <Search size={16} /> Mapping Solutions
                              </div>
                              <div className="w-32 space-y-2 text-[10px] text-slate-400">
                                 <div className="flex justify-between"><span>Pain Point</span><span className="text-white">Data Silos</span></div>
                                 <div className="flex justify-between"><span>Solution</span><span className="text-white">Slide #42 (Arch)</span></div>
                              </div>
                              <div className="mt-2 flex gap-1">
                                 {[1,2,3].map(i => <div key={i} className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{animationDelay: `${i*0.2}s`}} />)}
                              </div>
                           </motion.div>

                           <div className="absolute bottom-8 text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                              Tailoring for Nike.com language
                           </div>
                        </motion.div>
                     )}

                     {/* Visual 3: Shiny Delivery */}
                     {activeWorkflow === 2 && (
                        <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full flex items-center justify-center">
                           {/* Glow Background */}
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                           
                           {/* Two Asset Cards */}
                           <div className="flex flex-col gap-4">
                              {/* Deck Card */}
                              <motion.div
                                 className="relative w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden p-4"
                                 initial={{ x: -50, opacity: 0 }}
                                 animate={{ x: 0, opacity: 1 }}
                                 transition={{ duration: 0.6, type: "spring" }}
                              >
                                 {/* Shine Effect */}
                                 <motion.div
                                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent z-20"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 1, repeatDelay: 3 }}
                                 />

                                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600" />

                                 <div className="relative z-10 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                                       <FileText size={20} className="text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customized for Nike.com</div>
                                       <div className="text-sm font-bold text-slate-900">Custom Demo Deck</div>
                                    </div>
                                    <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold">
                                       PPTX
                                    </div>
                                 </div>
                              </motion.div>

                              {/* CSV Card */}
                              <motion.div
                                 className="relative w-72 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden p-4"
                                 initial={{ x: -50, opacity: 0 }}
                                 animate={{ x: 0, opacity: 1 }}
                                 transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
                              >
                                 {/* Shine Effect */}
                                 <motion.div
                                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent z-20"
                                    animate={{ x: ['-100%', '200%'] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 1.5, repeatDelay: 3 }}
                                 />

                                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-600 to-emerald-600" />

                                 <div className="relative z-10 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                                       <Database size={20} className="text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                       <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Synthetic Data</div>
                                       <div className="text-sm font-bold text-slate-900">Custom Demo Data</div>
                                    </div>
                                    <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-[10px] font-bold">
                                       CSV
                                    </div>
                                 </div>
                              </motion.div>
                           </div>

                           {/* Sparkles */}
                           {[...Array(6)].map((_, i) => (
                              <motion.div
                                 key={i}
                                 className="absolute text-yellow-400"
                                 initial={{ scale: 0, opacity: 0 }}
                                 animate={{ 
                                    scale: [0, 1, 0], 
                                    opacity: [0, 1, 0],
                                    x: Math.random() * 200 - 100,
                                    y: Math.random() * 200 - 100
                                 }}
                                 transition={{ 
                                    duration: 2, 
                                    repeat: Infinity, 
                                    delay: i * 0.3,
                                    repeatDelay: 1
                                 }}
                              >
                                 <Sparkles size={24} />
                              </motion.div>
                           ))}
                           
                           <motion.div 
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: 0.5 }}
                              className="absolute -bottom-12 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-bold shadow-lg border border-green-100 flex items-center gap-2"
                           >
                              <CheckCircle2 size={16} /> Brand Match 100%
                           </motion.div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            </div>
         </div>
      </section>

      {/* --- Bento Grid Features --- */}
      <section className="py-32 bg-white border-y border-slate-100">
         <div className="max-w-6xl mx-auto px-6">
            <div className="mb-16">
               <h2 className="text-3xl font-bold text-slate-900 mb-4">Enterprise Grade by Design</h2>
               <p className="text-slate-500">We don't reinvent the wheel. We make your wheel spin faster.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[600px]">
               <BentoCard
                  size="lg"
                  title="Solution Narratives"
                  desc="Generate best-in-class solution narratives tailored to your customer's pain points."
                  className="bg-slate-50"
               >
                  <div className="relative w-full h-48 flex items-center justify-center gap-6 px-8">
                     {/* Input Elements */}
                     <div className="flex flex-col gap-2">
                        {[
                           { label: "Architecture", color: "bg-purple-100 text-purple-600" },
                           { label: "Solution", color: "bg-blue-100 text-blue-600" },
                           { label: "Pain Mapping", color: "bg-orange-100 text-orange-600" },
                           { label: "Customize", color: "bg-green-100 text-green-600" }
                        ].map((item, i) => (
                           <motion.div
                              key={i}
                              initial={{ x: -30, opacity: 0 }}
                              whileInView={{ x: 0, opacity: 1 }}
                              viewport={{ once: true }}
                              transition={{ delay: i * 0.1, duration: 0.5 }}
                              className={`px-3 py-2 rounded-lg text-xs font-bold ${item.color} shadow-sm`}
                           >
                              {item.label}
                           </motion.div>
                        ))}
                     </div>

                     {/* Flow Arrow */}
                     <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="flex items-center"
                     >
                        <ArrowRight size={32} className="text-slate-300" />
                     </motion.div>

                     {/* Output Deck */}
                     <motion.div
                        initial={{ x: 30, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
                        className="relative w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden p-4"
                     >
                        <motion.div
                           className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent z-20"
                           animate={{ x: ['-100%', '200%'] }}
                           transition={{ duration: 2, repeat: Infinity, delay: 1, repeatDelay: 3 }}
                        />
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-purple-600" />
                        <div className="relative z-10 flex items-center gap-3">
                           <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                              <FileText size={20} className="text-blue-600" />
                           </div>
                           <div className="flex-1">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Output</div>
                              <div className="text-sm font-bold text-slate-900">Custom Deck</div>
                           </div>
                           <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold">PPTX</div>
                        </div>
                     </motion.div>
                  </div>
               </BentoCard>

               <BentoCard
                  title="Brand Governance"
                  desc="We enforce your fonts, colors, and spacing tokens. No AI hallucinations."
               >
                  <div className="flex flex-col gap-3 w-full max-w-[200px]">
                     <div className="flex items-center gap-2 bg-white border border-slate-100 p-2 rounded-lg shadow-sm">
                        <div className="w-6 h-6 rounded bg-blue-600" />
                        <div className="flex-1 h-2 bg-slate-100 rounded" />
                        <Check size={14} className="text-green-500" />
                     </div>
                     <div className="flex items-center gap-2 bg-white border border-slate-100 p-2 rounded-lg shadow-sm opacity-50">
                        <div className="w-6 h-6 rounded bg-red-500" />
                        <div className="flex-1 h-2 bg-slate-100 rounded" />
                        <Shield size={14} className="text-slate-400" />
                     </div>
                  </div>
               </BentoCard>

               <BentoCard
                  title="Demo Data Generation"
                  desc="Generate synthetic demo data that matches your customer's use case."
               >
                   <div className="flex flex-col gap-2">
                      <div className="bg-white border border-slate-100 p-3 rounded-lg shadow-sm">
                         <div className="flex items-center gap-2 mb-2">
                            <Database size={16} className="text-green-600" />
                            <span className="text-xs font-bold text-slate-700">customers.csv</span>
                         </div>
                         <div className="grid grid-cols-3 gap-1">
                            {[1,2,3,4,5,6].map(i => <div key={i} className="h-1.5 bg-slate-100 rounded" />)}
                         </div>
                      </div>
                      <div className="bg-white border border-slate-100 p-3 rounded-lg shadow-sm opacity-70">
                         <div className="flex items-center gap-2 mb-2">
                            <Database size={16} className="text-blue-600" />
                            <span className="text-xs font-bold text-slate-700">metrics.csv</span>
                         </div>
                         <div className="grid grid-cols-3 gap-1">
                            {[1,2,3,4,5,6].map(i => <div key={i} className="h-1.5 bg-slate-100 rounded" />)}
                         </div>
                      </div>
                   </div>
               </BentoCard>

               <BentoCard
                  title="Revenue Stack Integrations"
                  desc="Connects to Seismic, Gong, Chorus, Salesforce, and more."
                  size="lg"
               >
                  <div className="flex flex-wrap gap-4 justify-center">
                     <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center font-bold text-blue-600 text-xs">SFDC</div>
                        <span className="text-xs text-slate-500">Salesforce</span>
                     </div>
                     <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center font-bold text-purple-600 text-xs">GONG</div>
                        <span className="text-xs text-slate-500">Gong</span>
                     </div>
                     <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center font-bold text-green-600 text-xs">CHO</div>
                        <span className="text-xs text-slate-500">Chorus</span>
                     </div>
                     <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center font-bold text-orange-600 text-xs">SIS</div>
                        <span className="text-xs text-slate-500">Seismic</span>
                     </div>
                  </div>
               </BentoCard>
            </div>
         </div>
      </section>
      {/* --- CTA --- */}
      <section className="py-32 px-6">
         <div className="max-w-5xl mx-auto bg-slate-900 rounded-[2.5rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/30 blur-[120px] rounded-full" />

             <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">Ready to scale your Presales?</h2>
                <div className="flex justify-center">
                   <button className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold hover:scale-105 transition-transform shadow-xl hover:shadow-white/20">
                      Contact Sales
                   </button>
                </div>
                <p className="mt-8 text-slate-400 text-sm">Schedule a personalized demo with our team.</p>
             </div>
         </div>
      </section>

      <footer className="bg-white border-t border-slate-200 py-16 px-6">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white text-xs font-bold">D</div>
               <span className="font-bold text-slate-900">deckr.ai</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-500">
               <a href="#" className="hover:text-slate-900">Privacy</a>
               <a href="#" className="hover:text-slate-900">Terms</a>
               <a href="#" className="hover:text-slate-900">Twitter</a>
               <a href="#" className="hover:text-slate-900">GitHub</a>
            </div>
            <div className="text-slate-400 text-sm">
               © 2025 Deckr Inc.
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
