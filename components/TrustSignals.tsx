import React from 'react';

interface TrustSignalsProps {
  variant?: 'footer' | 'inline' | 'badge';
}

const TrustSignals: React.FC<TrustSignalsProps> = ({ variant = 'footer' }) => {
  const securityBadges = [
    {
      id: 'soc2',
      name: 'SOC 2 Type II',
      description: 'Security & availability certified',
      icon: '🔒',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'gdpr',
      name: 'GDPR Compliant',
      description: 'EU data protection ready',
      icon: '🇪🇺',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'iso',
      name: 'ISO 27001',
      description: 'Information security certified',
      icon: '✓',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'ssl',
      name: '256-bit SSL',
      description: 'Bank-level encryption',
      icon: '🛡️',
      color: 'from-cyan-500 to-cyan-600'
    }
  ];

  const trustStats = [
    { value: '99.9%', label: 'Uptime SLA', icon: '⚡' },
    { value: '256-bit', label: 'Encryption', icon: '🔐' },
    { value: '24/7', label: 'Support', icon: '💬' },
    { value: 'SOC 2', label: 'Certified', icon: '✓' }
  ];

  const awards = [
    { name: 'G2 High Performer', year: '2024', icon: '🏆', color: 'from-orange-500 to-orange-600' },
    { name: 'Capterra Shortlist', year: '2024', icon: '⭐', color: 'from-yellow-500 to-yellow-600' },
    { name: 'Product Hunt #1', year: '2024', icon: '🚀', color: 'from-red-500 to-red-600' }
  ];

  if (variant === 'badge') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="text-xs font-semibold text-green-700">Enterprise-Grade Security</span>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap items-center gap-4 py-4">
        {trustStats.map((stat, index) => (
          <div
            key={index}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-brand-border/30 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <span className="text-xl">{stat.icon}</span>
            <div>
              <div className="font-bold text-sm text-brand-text-primary">{stat.value}</div>
              <div className="text-xs text-brand-text-tertiary">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Footer variant (default)
  return (
    <div className="w-full py-12 bg-gradient-to-br from-gray-50 to-slate-50 border-t border-brand-border/30">
      <div className="container mx-auto px-6">
        {/* Security Badges Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="font-display font-bold text-xl text-brand-text-primary mb-2">
              Enterprise-Grade Security & Compliance
            </h3>
            <p className="text-sm text-brand-text-tertiary">
              Your data is protected by industry-leading security standards
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {securityBadges.map((badge, index) => (
              <div
                key={badge.id}
                className="group relative p-6 rounded-2xl bg-white border-2 border-brand-border/30 hover:border-brand-primary-300 hover:shadow-premium transition-all duration-300 text-center animate-scale-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Icon */}
                <div className={`flex items-center justify-center w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${badge.color} text-white text-2xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  {badge.icon}
                </div>

                {/* Title */}
                <div className="font-bold text-sm text-brand-text-primary mb-1">
                  {badge.name}
                </div>

                {/* Description */}
                <div className="text-xs text-brand-text-tertiary">
                  {badge.description}
                </div>

                {/* Verified checkmark */}
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Stats */}
        <div className="mb-12">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {trustStats.map((stat, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white border border-brand-border/30 shadow-sm"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-brand-primary-50 to-brand-accent-50 text-xl">
                  {stat.icon}
                </div>
                <div>
                  <div className="font-display font-bold text-lg gradient-text">{stat.value}</div>
                  <div className="text-xs text-brand-text-tertiary">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Awards & Recognition */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h4 className="font-semibold text-sm text-brand-text-tertiary uppercase tracking-wider">
              Awards & Recognition
            </h4>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {awards.map((award, index) => (
              <div
                key={index}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border-2 border-brand-border/30 hover:border-brand-primary-300 hover:shadow-card transition-all duration-300"
              >
                <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${award.color} text-white text-xl shadow-md`}>
                  {award.icon}
                </div>
                <div>
                  <div className="font-bold text-sm text-brand-text-primary">{award.name}</div>
                  <div className="text-xs text-brand-text-tertiary">{award.year}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Features List */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                ),
                title: 'Data Encryption',
                description: 'All data encrypted at rest and in transit'
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                  </svg>
                ),
                title: 'Regular Audits',
                description: 'Third-party security audits quarterly'
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ),
                title: 'Privacy First',
                description: 'We never sell or share your data'
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
                    <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                ),
                title: 'Secure Backups',
                description: 'Automated daily backups with redundancy'
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                  </svg>
                ),
                title: 'Access Control',
                description: 'Role-based permissions & SSO support'
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                ),
                title: 'Audit Logs',
                description: 'Complete activity tracking and logs'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-xl bg-white border border-brand-border/30 hover:shadow-card transition-all duration-200"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-brand-primary-50 to-brand-accent-50 text-brand-primary-600 flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <div className="font-semibold text-sm text-brand-text-primary mb-1">
                    {feature.title}
                  </div>
                  <div className="text-xs text-brand-text-tertiary">
                    {feature.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="relative p-8 rounded-3xl bg-gradient-to-r from-brand-primary-500 via-brand-accent-500 to-brand-primary-600 text-white shadow-premium overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-white blur-3xl"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 rounded-full bg-white blur-3xl"></div>
            </div>

            <div className="relative text-center">
              <h3 className="font-display font-bold text-2xl mb-3">
                Need Enterprise-Level Security?
              </h3>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Get custom security policies, dedicated support, SLAs, and advanced compliance features for your organization
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button className="btn bg-white text-brand-primary-600 font-semibold shadow-btn hover:shadow-btn-hover hover:scale-105 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  Contact Sales
                </button>

                <button className="btn bg-white/20 backdrop-blur-sm text-white border-2 border-white/30 font-semibold hover:bg-white/30 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  Security Whitepaper
                </button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/80">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Custom contracts</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Dedicated CSM</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Priority support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustSignals;
