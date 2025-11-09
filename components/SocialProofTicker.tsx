import React from 'react';

interface TrustMetric {
  value: string;
  label: string;
  icon: React.ReactNode;
}

const SocialProofTicker: React.FC = () => {
  const trustMetrics: TrustMetric[] = [
    {
      value: '2,500+',
      label: 'Companies',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
        </svg>
      )
    },
    {
      value: '50K+',
      label: 'Decks Created',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
      )
    },
    {
      value: '98%',
      label: 'Satisfaction',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      value: '4.9/5',
      label: 'Rating',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    }
  ];

  // CSS-based company logos with different styles
  const companyLogos = [
    { name: 'TechCorp', color: 'from-blue-500 to-blue-600', initials: 'TC' },
    { name: 'InnovateCo', color: 'from-purple-500 to-purple-600', initials: 'IC' },
    { name: 'DataDrive', color: 'from-green-500 to-green-600', initials: 'DD' },
    { name: 'CloudSync', color: 'from-cyan-500 to-cyan-600', initials: 'CS' },
    { name: 'SalesForce Pro', color: 'from-orange-500 to-orange-600', initials: 'SF' },
    { name: 'MarketPulse', color: 'from-pink-500 to-pink-600', initials: 'MP' },
    { name: 'FinanceHub', color: 'from-indigo-500 to-indigo-600', initials: 'FH' },
    { name: 'GrowthLabs', color: 'from-teal-500 to-teal-600', initials: 'GL' },
    { name: 'VentureOne', color: 'from-red-500 to-red-600', initials: 'V1' },
    { name: 'MetricIQ', color: 'from-yellow-500 to-yellow-600', initials: 'MQ' },
    { name: 'BizStream', color: 'from-violet-500 to-violet-600', initials: 'BS' },
    { name: 'NextGen AI', color: 'from-fuchsia-500 to-fuchsia-600', initials: 'NG' }
  ];

  return (
    <div className="w-full py-12 overflow-hidden bg-gradient-to-br from-gray-50 to-slate-50 border-y border-brand-border/30">
      <div className="container mx-auto px-6">
        {/* Trust Metrics */}
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-brand-text-tertiary uppercase tracking-wider mb-6">
            Trusted by leading teams worldwide
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-8">
            {trustMetrics.map((metric, index) => (
              <div
                key={index}
                className="group relative p-5 rounded-2xl bg-white border-2 border-brand-border/30 hover:border-brand-primary-300 hover:shadow-premium transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Gradient accent on hover */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary-500 via-brand-accent-500 to-brand-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-t-2xl"></div>

                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-brand-primary-50 to-brand-accent-50 text-brand-primary-600 mb-3 group-hover:scale-110 transition-transform duration-300">
                    {metric.icon}
                  </div>
                  <div className="font-display font-bold text-2xl gradient-text mb-1">
                    {metric.value}
                  </div>
                  <div className="text-xs text-brand-text-tertiary font-medium">
                    {metric.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Company Logos Ticker */}
        <div className="relative">
          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 via-gray-50/90 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50 via-slate-50/90 to-transparent z-10 pointer-events-none"></div>

          {/* Scrolling container */}
          <div className="flex gap-6 animate-scroll-infinite">
            {/* First set */}
            {companyLogos.map((company, index) => (
              <div
                key={`logo-1-${index}`}
                className="group flex-shrink-0 w-40 h-24 flex items-center justify-center rounded-xl bg-white border-2 border-brand-border/30 hover:border-brand-primary-300 transition-all duration-300 hover:shadow-card cursor-pointer"
              >
                {/* CSS Logo */}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold text-lg shadow-md grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-110`}>
                    {company.initials}
                  </div>
                  <div className="text-xs font-semibold text-brand-text-secondary group-hover:text-brand-text-primary transition-colors duration-300">
                    {company.name}
                  </div>
                </div>
              </div>
            ))}

            {/* Duplicate set for seamless loop */}
            {companyLogos.map((company, index) => (
              <div
                key={`logo-2-${index}`}
                className="group flex-shrink-0 w-40 h-24 flex items-center justify-center rounded-xl bg-white border-2 border-brand-border/30 hover:border-brand-primary-300 transition-all duration-300 hover:shadow-card cursor-pointer"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${company.color} flex items-center justify-center text-white font-bold text-lg shadow-md grayscale group-hover:grayscale-0 transition-all duration-300 group-hover:scale-110`}>
                    {company.initials}
                  </div>
                  <div className="text-xs font-semibold text-brand-text-secondary group-hover:text-brand-text-primary transition-colors duration-300">
                    {company.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <p className="text-sm text-brand-text-tertiary">
            Join thousands of teams creating winning presentations with AI
          </p>
        </div>
      </div>

      {/* Add the infinite scroll animation to the global styles */}
      <style>{`
        @keyframes scroll-infinite {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-infinite {
          animation: scroll-infinite 30s linear infinite;
        }

        .animate-scroll-infinite:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};

export default SocialProofTicker;
