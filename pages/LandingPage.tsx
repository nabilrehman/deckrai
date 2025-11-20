import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemoPlayer } from '../components/DemoPlayer';
import { Shield, Zap, Layers, ArrowRight, Brain, LayoutTemplate, Lock, Check, PlayCircle, CreditCard, Sparkles, Wand2, Globe, Database, FileText, Command, ChevronRight, Terminal, Activity, BarChart3, Share2, Search, Mic, FileJson, UploadCloud, CheckCircle2, ShieldCheck, ScanLine, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  <div className={`flex items-center gap-3 text-lg ${className}`}>
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="landing-slide1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7145FF"/>
          <stop offset="50%" stopColor="#5D5FEF"/>
          <stop offset="100%" stopColor="#818CF8"/>
        </linearGradient>
        <linearGradient id="landing-slide2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5D5FEF"/>
          <stop offset="100%" stopColor="#6366F1"/>
        </linearGradient>
        <linearGradient id="landing-slide3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5"/>
          <stop offset="100%" stopColor="#5D5FEF"/>
        </linearGradient>
      </defs>
      <g transform="translate(15, 45) rotate(-8 27.5 16.25)">
        <rect width="55" height="32.5" rx="2.5" fill="url(#landing-slide3)" opacity="0.8"/>
      </g>
      <g transform="translate(17, 40) rotate(-4 27.5 16.25)">
        <rect width="55" height="32.5" rx="2.5" fill="url(#landing-slide2)" opacity="0.9"/>
      </g>
      <g transform="translate(20, 35)">
        <rect width="55" height="32.5" rx="2.5" fill="url(#landing-slide1)"/>
        <rect y="0" width="55" height="0.8" rx="2.5" fill="#FFFFFF" opacity="0.2"/>
      </g>
    </svg>
    <span
      className="bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-600 bg-clip-text text-transparent animate-gradient-x"
      style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontWeight: 600,
        letterSpacing: '-0.025em',
        backgroundSize: '200% 200%'
      }}
    >
      {name}
    </span>
  </div>
);

// --- Sections ---

const Navbar = ({ onNavigateToApp }: { onNavigateToApp: () => void }) => {
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
          <Logo name="Deckr.ai" />
        </div>

        <div className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-200/50 backdrop-blur-sm">
          {['Product', 'Solutions', 'Enterprise', 'Pricing'].map((item) => (
            <button key={item} className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-white rounded-full transition-all">
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onNavigateToApp} className="text-sm font-medium text-slate-500 hover:text-slate-900 mr-2">
            Sign In
          </button>
          <Button variant="primary" onClick={onNavigateToApp}>
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

// --- Main Landing Page Component ---

export const LandingPage = () => {
  const navigate = useNavigate();
  const [credits, setCredits] = useState(420);
  const [demoTrigger, setDemoTrigger] = useState(0);
  const [heroInput, setHeroInput] = useState("");
  const demoRef = useRef<HTMLDivElement>(null);
  const [activeWorkflow, setActiveWorkflow] = useState(0);

  // Workflow Autoplay
  useEffect(() => {
     const interval = setInterval(() => setActiveWorkflow(prev => (prev + 1) % 3), 5000);
     return () => clearInterval(interval);
  }, []);

  const handleHeroGenerate = () => {
     if (!heroInput.trim()) return;
     // Navigate to app with the prompt
     navigate('/app', { state: { initialPrompt: heroInput } });
  };

  const handleNavigateToApp = () => {
    navigate('/app');
  };

  const workflowSteps = [
    { icon: Layers, title: "1. Ingest Standard Assets", desc: "Upload your discovery notes and standard sales decks. We index them to understand your design language." },
    { icon: Database, title: "2. Inject Deal Context", desc: "Connect CRM notes or discovery calls. We identify pain points and map them to your existing solutions." },
    { icon: Sparkles, title: "3. Hyper-Personalized Customer Deck", desc: "A customer deck tailored to this specific customer. We generate new slides that look exactly like your best designer made them." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 overflow-x-hidden">
      <Navbar onNavigateToApp={handleNavigateToApp} />

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
         <GridBackground />

         {/* Agentic Decorative Lines */}
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[500px] bg-gradient-to-b from-transparent via-slate-200 to-transparent -z-10" />
         <div className="absolute top-32 left-10 w-4 h-4 border-l border-t border-slate-300 -z-10" />
         <div className="absolute top-32 right-10 w-4 h-4 border-r border-t border-slate-300 -z-10" />

         <div className="max-w-6xl mx-auto text-center relative z-10">
            <motion.div
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
               className="flex justify-center mb-10"
            >
               <div className="bg-white/80 backdrop-blur-md border border-slate-200 text-slate-600 shadow-lg rounded-full px-1.5 py-1.5 flex items-center gap-3 pr-4">
                  <div className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded-full uppercase tracking-wider">Agentic V2</div>
                  <div className="h-3 w-[1px] bg-slate-200" />
                  <span className="text-xs font-bold flex items-center gap-1"><Sparkles size={10} className="text-blue-500" /> Enterprise Grade Generation</span>
               </div>
            </motion.div>

            <motion.h1
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
               className="font-bold tracking-tight mb-6 leading-[1.2] relative max-w-5xl mx-auto"
            >
               <span className="block text-4xl md:text-5xl lg:text-6xl text-slate-900">
                  Deckr customizes your sales deck,
                  <span className="absolute -top-4 -right-6 text-[10px] font-normal text-slate-400 font-mono tracking-widest hidden lg:block">SYS_GEN_01</span>
               </span>
               <span className="relative inline-block mt-1 pb-4 text-4xl md:text-5xl lg:text-6xl">
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 blur-3xl" />
                  <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 animate-gradient-x">
                     for every customer meeting.
                  </span>
                  {/* Technical HUD Element */}
                  <div className="absolute -bottom-2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
                  <div className="absolute -bottom-2 left-[10%] w-1 h-1 bg-blue-500 rounded-full" />
                  <div className="absolute -bottom-2 right-[10%] w-1 h-1 bg-purple-500 rounded-full" />
               </span>
            </motion.h1>

            <motion.p
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
               className="text-lg text-slate-500 max-w-2xl mx-auto mb-24 font-light leading-relaxed"
            >
               Deckr indexes your internal "Gold Standard" library and uses your own high-performing slides to generate deal-specific assets. No generic AI layouts.
            </motion.p>

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

               {/* Floating "Live" indicators around the frame */}
               <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -right-12 top-24 bg-white p-3 rounded-xl shadow-xl border border-slate-100 hidden md:block">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Database size={16} /></div>
                     <div className="text-xs font-bold text-slate-700">Salesforce Connected</div>
                  </div>
                  <div className="flex gap-1">
                     <div className="h-1 w-8 bg-green-500 rounded-full" />
                     <div className="h-1 w-2 bg-slate-200 rounded-full" />
                  </div>
               </motion.div>

               <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute -left-12 bottom-32 bg-white p-3 rounded-xl shadow-xl border border-slate-100 hidden md:block">
                  <div className="flex items-center gap-3 mb-2">
                     <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><LayoutTemplate size={16} /></div>
                     <div>
                        <div className="text-xs font-bold text-slate-700">Internal Library</div>
                        <div className="text-[10px] text-slate-400">Indexed 400+ Slides</div>
                     </div>
                  </div>
               </motion.div>
            </motion.div>
         </div>
      </section>

      {/* --- Workflow Section --- */}
      <section className="py-32 px-6 relative">
         <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
               <Badge className="bg-blue-50 text-blue-600 border-blue-100 mb-4">The Deckr Engine</Badge>
               <h2 className="text-4xl font-bold text-slate-900 mb-4">Your Content + Deal Context = Magic</h2>
               <p className="text-slate-500 max-w-2xl mx-auto">We don't hallucinate designs. We structurally adapt your approved assets to fit the customer's story.</p>
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
                              { icon: LayoutTemplate, color: "text-blue-500", label: "Q3 Master Deck" },
                              { icon: FileText, color: "text-orange-500", label: "Pricing Slides" },
                              { icon: Database, color: "text-purple-500", label: "Tech Specs" },
                              { icon: FileText, color: "text-slate-500", label: "Case Studies" },
                              { icon: FileJson, color: "text-green-500", label: "Brand Tokens" }
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
                                    style={{ transform: `rotate(${i * 72}deg) translateX(140px) rotate(-${i * 72}deg) rotate(-${360}deg)` }}
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
                              Indexing Internal Assets...
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
                        </motion.div>
                     )}

                     {/* Visual 3: Shiny Delivery */}
                     {activeWorkflow === 2 && (
                        <motion.div key="step3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="relative w-full h-full flex items-center justify-center">
                           {/* Glow Background */}
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />

                           {/* The Deck Card */}
                           <motion.div
                              className="relative w-72 aspect-[4/3] bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden group"
                              initial={{ rotateY: 90 }}
                              animate={{ rotateY: 0 }}
                              transition={{ duration: 0.8, type: "spring" }}
                           >
                              {/* Shine Effect */}
                              <motion.div
                                 className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent z-20"
                                 animate={{ x: ['-100%', '200%'] }}
                                 transition={{ duration: 2, repeat: Infinity, delay: 1, repeatDelay: 3 }}
                              />

                              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-purple-600" />

                              <div className="p-6 flex flex-col h-full justify-between relative z-10">
                                 <div>
                                    <div className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">Tailored for Customer</div>
                                    <div className="text-2xl font-bold text-slate-900 mb-2">2nd Meeting <br/>Deck</div>
                                 </div>
                                 <div className="flex justify-between items-end">
                                    <div className="flex -space-x-2">
                                       {[1,2].map(i => <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white" />)}
                                    </div>
                                    <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                                       <FileText size={10} /> PPTX
                                    </div>
                                 </div>
                              </div>
                           </motion.div>

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
                  title="Live Data Connections"
                  desc="Don't present stale data. Charts update in real-time when you open the deck."
                  className="bg-slate-50"
               >
                  <div className="relative w-full max-w-md mx-auto h-48 bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex gap-4 items-end overflow-hidden">
                     <div className="absolute top-4 right-4 flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] text-slate-400 font-mono">LIVE_STREAM</span>
                     </div>
                     {[30, 45, 25, 60, 40, 70, 55].map((h, i) => (
                        <motion.div
                           key={i}
                           initial={{ height: 0 }}
                           whileInView={{ height: `${h}%` }}
                           viewport={{ once: true }}
                           transition={{ delay: i * 0.1, duration: 0.8, type: "spring" }}
                           className="flex-1 bg-blue-500 rounded-t-md opacity-80 hover:opacity-100 transition-opacity"
                        />
                     ))}
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
                  title="Role-Based Access"
                  desc="Granular permissions for Sales, Marketing, and Engineering teams."
               >
                   <div className="flex -space-x-3">
                      {[1,2,3,4].map(i => (
                         <div key={i} className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm">
                            U{i}
                         </div>
                      ))}
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white border-2 border-white flex items-center justify-center text-xs font-bold shadow-sm">+12</div>
                   </div>
               </BentoCard>

               <BentoCard
                  title="Ecosystem Integrations"
                  desc="Works with your existing revenue stack."
                  size="lg"
               >
                  <div className="flex gap-4 opacity-60">
                     <IntegrationIcon icon={Database} color="text-blue-500" />
                     <IntegrationIcon icon={Globe} color="text-green-500" />
                     <IntegrationIcon icon={LayoutTemplate} color="text-orange-500" />
                     <IntegrationIcon icon={Command} color="text-purple-500" />
                     <IntegrationIcon icon={Share2} color="text-pink-500" />
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
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight">Ready to automate your <br/> sales motions?</h2>
                <div className="flex flex-col md:flex-row justify-center gap-4">
                   <button onClick={handleNavigateToApp} className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold hover:scale-105 transition-transform shadow-xl hover:shadow-white/20">
                      Get Started for Free
                   </button>
                   <button className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-full font-bold hover:bg-white/10 transition-colors backdrop-blur-sm">
                      Contact Sales
                   </button>
                </div>
                <p className="mt-8 text-slate-400 text-sm">No credit card required. 14-day free trial on Pro plans.</p>
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
