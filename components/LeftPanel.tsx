import React from 'react';
import { CheckCircle2, MessageSquareQuote } from 'lucide-react';

export const LeftPanel: React.FC = () => {
  return (
    <div className="hidden lg:flex flex-col justify-between p-12 bg-[#0f172a] text-white relative overflow-hidden h-full min-h-[600px]">

      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-600 rounded-full blur-[100px] opacity-20"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-600 rounded-full blur-[100px] opacity-20"></div>

      <div className="relative z-10">
        {/* Deckr.ai Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-11 h-11 bg-[#1d4ed8] rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
            D
          </div>
          <span className="font-bold text-3xl tracking-tight text-white">deckr.ai</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
          Make Every SE Perform Like Your <span className="text-blue-500">Top 1%</span>
        </h1>

        <p className="text-slate-300 text-lg mb-10 leading-relaxed max-w-md">
          Deckr is the AI agent that clones your top performer's workflow—handling the Research & Slides (Prep), the Synthetic Data (Demo), and Automates Technical Followups.
        </p>

        <div className="space-y-5 mb-12">
          <div className="flex items-center gap-3 text-slate-200">
            <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" />
            <span className="text-lg">Increase tech win rates by 40%</span>
          </div>
          <div className="flex items-center gap-3 text-slate-200">
            <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" />
            <span className="text-lg">Reduce tech win time by 25%</span>
          </div>
          <div className="flex items-center gap-3 text-slate-200">
            <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" />
            <span className="text-lg">Stand out from your competitors</span>
          </div>
        </div>
      </div>

      {/* Testimonial Card */}
      <div className="relative z-10 bg-slate-800/40 backdrop-blur-xl p-8 rounded-2xl border border-slate-700/50 shadow-xl">
        <MessageSquareQuote className="w-8 h-8 text-blue-500 mb-4 opacity-80" />
        <p className="text-slate-100 italic text-lg mb-6 font-light leading-relaxed">
          "With Deckr, All SEs have 30% free time to work on learning new skills, focusing on the customer rather than the grunt work."
        </p>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-base font-bold text-white shadow-md">
            AR
          </div>
          <div>
            <div className="font-semibold text-white">Alex Rivera</div>
            <div className="text-sm text-slate-400">VP of Presales</div>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Trusted By</p>
        <div className="flex items-center opacity-70 hover:opacity-100 transition-opacity duration-300">
           {/* Google Logo */}
           <svg className="h-8 w-auto text-white fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
           </svg>
        </div>
      </div>
    </div>
  );
};
