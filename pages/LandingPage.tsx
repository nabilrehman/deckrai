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
  const [heroInput, setHeroInput] = useState("Adapt our 'Enterprise Q3' deck for Atlassian...");
  const [demoTrigger, setDemoTrigger] = useState(0);
  const demoRef = useRef<HTMLDivElement>(null);

  const handleNavigateToLogin = () => {
    navigate('/login');
  };

  const handleHeroGenerate = () => {
    setDemoTrigger(prev => prev + 1);
    demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

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
               className="text-6xl md:text-8xl font-bold tracking-tighter text-slate-900 mb-8 mt-10 leading-[0.9] relative"
            >
               <span className="relative inline-block mt-2 pb-4">
                  <span className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 blur-3xl" />
                  <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 animate-gradient-x">
                     Tailor your slides,
                  </span>
                  {/* Technical HUD Element */}
                  <div className="absolute -bottom-2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
                  <div className="absolute -bottom-2 left-[10%] w-1 h-1 bg-blue-500 rounded-full" />
                  <div className="absolute -bottom-2 right-[10%] w-1 h-1 bg-purple-500 rounded-full" />
               </span>
               <br/>
               <span className="text-4xl md:text-6xl text-slate-800">
                   for every customer meeting.
               </span>
            </motion.h1>

            <motion.p
               initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
               className="text-xl text-slate-500 max-w-2xl mx-auto mb-24 font-light leading-relaxed"
            >
               Deckr uses your existing decks and magically transforms it according to your customer's pain points while retaining your original sales deck.
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
            </motion.div>
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
                   <button onClick={handleNavigateToLogin} className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold hover:scale-105 transition-transform shadow-xl hover:shadow-white/20">
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
