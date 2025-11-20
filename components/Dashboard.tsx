
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, TrendingUp, Clock, Plus, Download, Zap, Check, Shield, Lock, Loader2, X, ChevronRight, Sparkles, Layers, Database } from 'lucide-react';

interface DashboardProps {
  credits: number;
  onAddCredits: (amount: number) => void;
}

interface Plan {
  id: string;
  credits: number;
  price: number;
  label?: string;
  color: string;
}

// --- Visual Components ---

const CardPreview = ({ number, holder, expiry, cvc, activeField }: { number: string, holder: string, expiry: string, cvc: string, activeField: string }) => {
   return (
      <div className="w-full aspect-[1.58/1] rounded-2xl bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] p-6 text-white shadow-2xl relative overflow-hidden mb-8 transition-all duration-500 border border-white/10 group perspective-1000">
         {/* Holographic/Glass effects */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full -translate-y-32 translate-x-16 blur-3xl mix-blend-overlay" />
         <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full translate-y-16 -translate-x-16 blur-3xl mix-blend-overlay" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
         
         <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
               {/* Chip */}
               <div className="w-11 h-8 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-md border border-yellow-500/30 relative overflow-hidden shadow-inner">
                  <div className="absolute inset-0 opacity-50 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,#000_2px,#000_3px)] mix-blend-overlay" />
                  <div className="absolute inset-0 opacity-50 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#000_2px,#000_3px)] mix-blend-overlay" />
               </div>
               {/* Logo */}
               <div className="flex flex-col items-end">
                  <div className="text-lg font-black italic tracking-widest opacity-80">VISA</div>
                  <div className="text-[8px] font-medium opacity-50 tracking-widest uppercase">Debit</div>
               </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-1">
                   <div className="flex justify-between px-1">
                     <span className="text-[8px] uppercase tracking-widest opacity-40">Card Number</span>
                   </div>
                   <div className={`font-mono text-xl sm:text-2xl tracking-widest drop-shadow-md transition-all duration-300 ${activeField === 'number' ? 'text-white scale-[1.02] origin-left' : 'text-slate-300'}`}>
                      {number || '•••• •••• •••• ••••'}
                   </div>
               </div>

               <div className="flex justify-between items-end">
                  <div className="space-y-1 flex-1 mr-4">
                     <div className="text-[8px] uppercase tracking-widest opacity-40">Card Holder</div>
                     <div className={`font-medium tracking-wide uppercase text-sm truncate transition-all duration-300 ${activeField === 'holder' ? 'text-white' : 'text-slate-300'}`}>
                        {holder || 'YOUR NAME'}
                     </div>
                  </div>
                  <div className="space-y-1 text-right">
                     <div className="text-[8px] uppercase tracking-widest opacity-40">Expires</div>
                     <div className={`font-mono font-medium tracking-wide text-sm transition-all duration-300 ${activeField === 'expiry' ? 'text-white' : 'text-slate-300'}`}>
                        {expiry || 'MM/YY'}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

const PricingCard = ({ plan, popular = false, onSelect }: { plan: Plan, popular?: boolean, onSelect: (plan: Plan) => void }) => (
  <div 
    onClick={() => onSelect(plan)}
    className={`relative group cursor-pointer rounded-2xl border transition-all duration-300 overflow-hidden ${popular 
      ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-blue-900/20 scale-105 z-10' 
      : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-xl hover:scale-[1.02] z-0'}`}
  >
    {popular && (
       <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
    )}
    
    <div className="p-8 h-full flex flex-col">
       <div className="flex justify-between items-start mb-6">
          <div>
             <h3 className={`text-sm font-bold uppercase tracking-wider mb-2 ${popular ? 'text-blue-400' : 'text-slate-400'}`}>
                {plan.label || 'Credit Pack'}
             </h3>
             <div className={`text-4xl font-bold ${popular ? 'text-white' : 'text-slate-900'}`}>
                {plan.credits}
                <span className={`text-lg font-medium ml-1 ${popular ? 'text-slate-400' : 'text-slate-400'}`}>cr</span>
             </div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${popular ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
             <Database size={24} />
          </div>
       </div>

       <ul className="space-y-3 mb-8 flex-1">
          <li className="flex items-center gap-3">
             <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${popular ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}><Check size={12} /></div>
             <span className={`text-sm ${popular ? 'text-slate-300' : 'text-slate-600'}`}>~{plan.credits} AI Slides</span>
          </li>
          <li className="flex items-center gap-3">
             <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${popular ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}><Check size={12} /></div>
             <span className={`text-sm ${popular ? 'text-slate-300' : 'text-slate-600'}`}>Export to PPTX</span>
          </li>
          {popular && (
             <li className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${popular ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'}`}><Check size={12} /></div>
                <span className={`text-sm ${popular ? 'text-slate-300' : 'text-slate-600'}`}>Priority Generation</span>
             </li>
          )}
       </ul>

       <div className="flex items-center justify-between pt-6 border-t border-dashed border-slate-700/20">
          <div className={`text-2xl font-bold ${popular ? 'text-white' : 'text-slate-900'}`}>${plan.price}</div>
          <button className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
             popular 
             ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/30' 
             : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
          }`}>
             Select Pack
          </button>
       </div>
    </div>
  </div>
);

const UsageRow = ({ title, date, credits, status }: any) => (
  <div className="group flex items-center justify-between py-4 px-4 rounded-xl hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-100 cursor-default">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-500 shadow-sm group-hover:scale-110 transition-transform">
         <Layers size={20} />
      </div>
      <div>
        <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">{title}</div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
           <span>{date}</span>
           <span className="w-1 h-1 rounded-full bg-slate-300" />
           <span>PPTX</span>
        </div>
      </div>
    </div>
    <div className="text-right">
      <div className="font-bold text-sm text-slate-900">-{credits}</div>
      <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Credits</div>
    </div>
  </div>
);

const PaymentModal = ({ plan, isOpen, onClose, onSuccess }: { plan: Plan | null, isOpen: boolean, onClose: () => void, onSuccess: () => void }) => {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success'>('idle');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [holder, setHolder] = useState('');
  const [activeField, setActiveField] = useState('');

  useEffect(() => {
    if (isOpen) {
        setStatus('idle');
        setCardNumber('');
        setExpiry('');
        setCvc('');
        setHolder('');
        setActiveField('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('processing');
    setTimeout(() => {
      setStatus('success');
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }, 2500);
  };

  const formatCardNumber = (val: string) => {
     const v = val.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
     const matches = v.match(/\d{4,16}/g);
     const match = matches && matches[0] || "";
     const parts = [];
     for (let i=0, len=match.length; i<len; i+=4) { parts.push(match.substring(i, i+4)); }
     if (parts.length) return parts.join(" ");
     return val;
  };

  const formatExpiry = (val: string) => {
      const v = val.replace(/\D/g, '');
      if (v.length >= 2) return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
      return v;
  }

  return (
    <AnimatePresence>
      {isOpen && plan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[95vh]"
          >
             {/* Close Button */}
             <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors z-20">
                <X size={18} />
             </button>

            <div className="p-8 overflow-y-auto">
               <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-2">
                     <Shield size={12} /> Secure Checkout
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Purchase {plan.credits} Credits</h2>
                  <p className="text-slate-500 text-sm">Total due today: <span className="text-slate-900 font-bold">${plan.price}.00</span></p>
               </div>

               {status === 'success' ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                     <motion.div 
                        initial={{ scale: 0 }} 
                        animate={{ scale: 1 }} 
                        transition={{ type: "spring" }}
                        className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mb-6 shadow-xl shadow-green-500/30"
                     >
                        <Check size={48} strokeWidth={4} />
                     </motion.div>
                     <h3 className="text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h3>
                     <p className="text-slate-500 mb-8">Your account has been credited with {plan.credits} credits.</p>
                     <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm">
                        <div className="flex justify-between mb-2 text-slate-500"><span>Transaction ID</span><span className="font-mono text-slate-900">tx_88392022</span></div>
                        <div className="flex justify-between text-slate-500"><span>Amount Paid</span><span className="font-bold text-slate-900">${plan.price}.00</span></div>
                     </div>
                  </div>
               ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                     <CardPreview number={cardNumber} holder={holder} expiry={expiry} cvc={cvc} activeField={activeField} />

                     <div className="space-y-5">
                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Card Number</label>
                           <div className="relative">
                              <CreditCard className="absolute left-4 top-3.5 text-slate-400" size={18} />
                              <input 
                                 type="text" 
                                 className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-mono text-sm"
                                 placeholder="0000 0000 0000 0000"
                                 value={cardNumber}
                                 onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                 onFocus={() => setActiveField('number')}
                                 maxLength={19}
                                 required
                              />
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Cardholder Name</label>
                           <input 
                              type="text" 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm"
                              placeholder="Enter name on card"
                              value={holder}
                              onChange={(e) => setHolder(e.target.value.toUpperCase())}
                              onFocus={() => setActiveField('holder')}
                              required
                           />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Expiry</label>
                              <input 
                                 type="text" 
                                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm font-mono"
                                 placeholder="MM/YY"
                                 value={expiry}
                                 onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                 onFocus={() => setActiveField('expiry')}
                                 maxLength={5}
                                 required
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">CVC</label>
                              <div className="relative">
                                 <Lock className="absolute left-4 top-3.5 text-slate-400" size={16} />
                                 <input 
                                    type="password" 
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm font-mono"
                                    placeholder="123"
                                    value={cvc}
                                    onChange={(e) => setCvc(e.target.value)}
                                    onFocus={() => setActiveField('cvc')}
                                    maxLength={3}
                                    required
                                 />
                              </div>
                           </div>
                        </div>
                     </div>

                     <button 
                        disabled={status === 'processing'}
                        type="submit" 
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-bold shadow-xl shadow-slate-900/20 flex items-center justify-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                     >
                        {status === 'processing' ? <Loader2 size={20} className="animate-spin" /> : <Lock size={18} />}
                        <span className="text-lg">{status === 'processing' ? 'Processing...' : 'Pay Now'}</span>
                     </button>
                  </form>
               )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ credits, onAddCredits }) => {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const handleSelectPlan = (plan: Plan) => {
     setSelectedPlan(plan);
     setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = () => {
     if (selectedPlan) {
        onAddCredits(selectedPlan.credits);
     }
     setTimeout(() => {
        setIsPaymentOpen(false);
        setSelectedPlan(null);
     }, 500);
  };

  const plans: Plan[] = [
      { id: 'starter', credits: 100, price: 29, label: 'Starter Pack', color: 'blue' },
      { id: 'pro', credits: 500, price: 99, label: 'Pro Volume', color: 'purple' },
      { id: 'enterprise', credits: 1500, price: 249, label: 'Enterprise Scale', color: 'slate' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 pt-24 animate-in fade-in duration-500 relative">
      {/* Payment Modal */}
      <PaymentModal 
         isOpen={isPaymentOpen} 
         onClose={() => setIsPaymentOpen(false)} 
         plan={selectedPlan} 
         onSuccess={handlePaymentSuccess}
      />

      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Dashboard</h1>
          <p className="text-slate-500 text-lg">Manage your credits and generation history.</p>
        </div>
        <div className="flex gap-3">
           <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
             <Download size={16} /> Export CSV
           </button>
           <button 
             onClick={() => handleSelectPlan(plans[0])}
             className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
           >
             <Plus size={18} /> Quick Refill
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Enhanced Balance Card */}
        <div className="relative rounded-[2rem] overflow-hidden p-10 shadow-2xl group">
           {/* Animated Backgrounds */}
           <div className="absolute inset-0 bg-[#0F172A]" />
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/30 rounded-full blur-[100px] group-hover:bg-blue-600/40 transition-colors duration-1000" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px]" />
           
           <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                 <div className="flex items-center gap-2 text-blue-300 font-bold uppercase tracking-widest text-xs mb-6">
                    <Sparkles size={14} /> Available Credits
                 </div>
                 <div className="text-7xl font-bold text-white mb-2 tracking-tight flex items-baseline gap-2">
                    <motion.span 
                       key={credits}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300"
                    >
                       {credits}
                    </motion.span>
                 </div>
                 <div className="text-slate-400 font-medium">≈ {Math.floor(credits / 4)} Decks Generateable</div>
              </div>
              
              <div className="mt-12">
                 <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                    <span>USAGE LIMIT</span>
                    <span>{Math.round((credits/2000)*100)}%</span>
                 </div>
                 <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                       className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                       initial={{ width: 0 }}
                       animate={{ width: `${(credits / 2000) * 100}%` }}
                       transition={{ duration: 1.5, ease: "circOut" }}
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Usage Chart */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-10 border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col">
           <div className="flex justify-between items-center mb-10">
              <div>
                 <h3 className="text-xl font-bold text-slate-900">Activity Volume</h3>
                 <p className="text-sm text-slate-500">Generations over the last 7 days</p>
              </div>
              <div className="flex gap-2">
                 <button className="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg">7D</button>
                 <button className="px-3 py-1 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-lg">30D</button>
              </div>
           </div>
           
           <div className="flex-1 flex items-end justify-between gap-4 min-h-[200px]">
               {[35, 55, 40, 85, 60, 95, 45].map((val, i) => (
                  <div key={i} className="w-full flex flex-col justify-end group">
                     <div className="relative w-full bg-slate-100 rounded-2xl overflow-hidden" style={{height: '200px'}}>
                        <motion.div 
                           initial={{ height: 0 }} 
                           animate={{ height: `${val}%` }} 
                           transition={{ duration: 0.8, delay: i * 0.1, type: 'spring' }}
                           className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400 opacity-80 group-hover:opacity-100 transition-opacity rounded-t-lg"
                        />
                     </div>
                     <div className="text-center mt-3 text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                     </div>
                  </div>
               ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
         <div className="xl:col-span-2">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Transactions</h3>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm divide-y divide-slate-50 overflow-hidden">
              <UsageRow title="Series B Pitch Deck" date="Today, 10:42 AM" credits="4" />
              <UsageRow title="Quarterly Business Review" date="Yesterday, 4:15 PM" credits="12" />
              <UsageRow title="Sales Enablement Assets" date="Oct 24, 2:30 PM" credits="8" />
              <UsageRow title="Product Launch Keynote" date="Oct 23, 9:15 AM" credits="15" />
              <UsageRow title="Investor Update Q3" date="Oct 21, 11:00 AM" credits="4" />
            </div>
         </div>

         <div>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Purchase Credits</h3>
            <div className="space-y-4">
               {plans.map((plan) => (
                  <PricingCard key={plan.id} plan={plan} popular={plan.id === 'pro'} onSelect={handleSelectPlan} />
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};