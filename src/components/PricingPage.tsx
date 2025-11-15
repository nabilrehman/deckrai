import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCredits } from '../hooks/useCredits';
import { CREDIT_PACKS, SUBSCRIPTION_PLANS } from '../config/pricing';

interface PricingPageProps {
  onBack?: () => void;
  onSelectPlan?: (planId: string) => void;
  onPurchasePack?: (packId: string) => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onBack, onSelectPlan, onPurchasePack }) => {
  const { user } = useAuth();
  const { credits } = useCredits();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Subscription plans (matching homepage)
  const subscriptionPlans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      credits: 10,
      description: '10 credits • Create 1-2 decks',
      features: [
        '10 credits/month (10 slides)',
        '1 credit = 1 slide creation or edit',
        'Create 1-2 complete decks',
        'All generation features',
        'Basic personalization',
        'PDF export',
        'deckr.ai watermark'
      ],
      cta: 'Start Free',
      popular: false,
      icon: '🎯'
    },
    {
      id: 'startup',
      name: 'Startup',
      price: 35,
      credits: 100,
      description: '100 credits • Create 10-15 decks',
      features: [
        '100 credits/month (100 slides)',
        'Rollover up to 50 unused credits',
        'Remove deckr.ai watermark',
        'Advanced analytics dashboard',
        'Password-protected sharing',
        'Priority AI processing',
        'Team collaboration features'
      ],
      cta: 'Start Trial',
      popular: true,
      icon: '🚀'
    },
    {
      id: 'business',
      name: 'Business',
      price: 90,
      credits: 300,
      description: '300 credits • Teams of 5-15 users',
      features: [
        'Everything in Startup',
        '300 credits/month shared pool',
        'Rollover up to 150 unused credits',
        '5-15 team member seats',
        'Shared brand library',
        'Real-time collaboration',
        'Admin controls & permissions',
        'Dedicated support'
      ],
      cta: 'Contact Sales',
      popular: false,
      icon: '🏢'
    }
  ];

  // One-time credit packs
  const creditPacks = [
    {
      id: 'starter',
      credits: 25,
      price: 10,
      pricePerCredit: 0.40,
      popular: false
    },
    {
      id: 'pro',
      credits: 100,
      price: 35,
      pricePerCredit: 0.35,
      bonus: 10,
      popular: true
    },
    {
      id: 'ultimate',
      credits: 250,
      price: 80,
      pricePerCredit: 0.32,
      bonus: 30,
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back</span>
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Pay only for what you use. No hidden fees, no surprises.
          </p>

          {/* Current Balance (if logged in) */}
          {user && (
            <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-lg shadow-sm border border-indigo-200">
              <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-700">
                Current balance: <strong className="text-indigo-600">{credits} credits</strong>
              </span>
            </div>
          )}
        </div>

        {/* How Credits Work Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-indigo-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">💡 How Credits Work</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Simple Pricing</h3>
              <p className="text-gray-600 text-sm">
                <strong>1 credit = 1 slide</strong> creation or edit
              </p>
              <p className="text-gray-500 text-xs mt-1">Example: 10-slide deck = 10 credits</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">♻️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Rollover Credits</h3>
              <p className="text-gray-600 text-sm">
                Unused subscription credits <strong>roll over</strong> monthly
              </p>
              <p className="text-gray-500 text-xs mt-1">Up to 50% of your monthly allocation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📈</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Flexible Options</h3>
              <p className="text-gray-600 text-sm">
                Choose <strong>monthly plans</strong> or <strong>one-time packs</strong>
              </p>
              <p className="text-gray-500 text-xs mt-1">Scale up or down as needed</p>
            </div>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Monthly Subscriptions</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {subscriptionPlans.map((plan, index) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? 'border-2 border-indigo-500 transform scale-105'
                    : 'border border-gray-200'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="text-center mb-4">
                  <span className="text-5xl">{plan.icon}</span>
                </div>

                {/* Plan Name & Price */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-5xl font-bold text-indigo-600">${plan.price}</span>
                    {plan.price > 0 && <span className="text-gray-500">/month</span>}
                  </div>
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => onSelectPlan?.(plan.id)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all mb-6 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg hover:scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          feature.includes('watermark') ? 'text-gray-400' : 'text-green-500'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        {feature.includes('watermark') ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        )}
                      </svg>
                      <span className={feature.includes('watermark') ? 'text-gray-500 text-sm' : 'text-gray-700 text-sm'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* One-Time Credit Packs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">One-Time Credit Packs</h2>
          <p className="text-gray-600 text-center mb-8">
            Need extra credits? Purchase one-time packs that <strong>never expire</strong>
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {creditPacks.map((pack) => (
              <div
                key={pack.id}
                className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                  pack.popular
                    ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50'
                    : 'border-gray-200'
                }`}
              >
                {/* Popular Badge */}
                {pack.popular && (
                  <div className="mb-4">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                      BEST VALUE
                    </span>
                  </div>
                )}

                {/* Credits */}
                <div className="text-center mb-4">
                  <span className="text-4xl font-bold text-indigo-600">{pack.credits}</span>
                  {pack.bonus && (
                    <span className="text-green-600 font-semibold ml-2">+{pack.bonus}</span>
                  )}
                  <p className="text-gray-600 text-sm mt-1">credits</p>
                </div>

                {/* Price */}
                <div className="text-center mb-4">
                  <span className="text-3xl font-bold text-gray-900">${pack.price}</span>
                  <p className="text-gray-500 text-xs mt-1">
                    ${pack.pricePerCredit.toFixed(2)} per credit
                  </p>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => onPurchasePack?.(pack.id)}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${
                    pack.popular
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Buy Now
                </button>

                {/* Features */}
                <ul className="mt-4 space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Never expires
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    One-time payment
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Use anytime
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ / Trust Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-indigo-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What happens to unused credits?</h3>
              <p className="text-gray-600 text-sm">
                Subscription credits roll over monthly (up to 50% of your plan). One-time packs never expire.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-600 text-sm">
                Yes! Cancel your subscription anytime. You'll keep access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What counts as a credit?</h3>
              <p className="text-gray-600 text-sm">
                Each slide creation or major edit costs 1 credit. Minor text edits don't consume credits.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600 text-sm">
                Yes! All paid plans come with a 14-day money-back guarantee. Start with 10 free credits.
              </p>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>14-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure payment via Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
