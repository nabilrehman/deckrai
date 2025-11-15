import React, { useState } from 'react';
import { CREDIT_PACKS, SUBSCRIPTION_PLANS, calculateTotalCredits } from '../config/pricing';
import { CreditPackage, SubscriptionPlan } from '../types';
import { useCredits } from '../hooks/useCredits';

interface CreditPurchasePageProps {
  onPurchasePack?: (packageId: string) => void;
  onSubscribe?: (planId: string) => void;
}

const CreditPackCard: React.FC<{
  pack: CreditPackage;
  onSelect: () => void;
}> = ({ pack, onSelect }) => {
  const totalCredits = calculateTotalCredits(pack);
  const savings = pack.bonus ? Math.round((pack.bonus / pack.credits) * 100) : 0;

  return (
    <div
      className={`
        relative p-6 rounded-xl border-2 transition-all cursor-pointer
        hover:border-blue-500 hover:shadow-xl hover:scale-105
        ${pack.popular
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-lg'
          : 'border-gray-200 bg-white'
        }
      `}
      onClick={onSelect}
    >
      {pack.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
            ⭐ MOST POPULAR
          </span>
        </div>
      )}

      {pack.bonus && savings > 0 && (
        <div className="absolute -top-2 -right-2">
          <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
            SAVE {savings}%
          </div>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{pack.name}</h3>

        <div className="flex items-baseline justify-center gap-2 mb-2">
          <span className="text-5xl font-bold text-blue-600">{pack.credits}</span>
          {pack.bonus && (
            <span className="text-2xl font-semibold text-green-600">+{pack.bonus}</span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {totalCredits} credits total
        </p>

        <div className="text-4xl font-bold text-gray-900 mb-2">
          ${pack.price}
        </div>
        <p className="text-sm text-gray-500 mb-6">
          ${pack.pricePerCredit.toFixed(2)} per credit
        </p>

        {pack.bestFor && (
          <p className="text-sm text-gray-600 mb-6 px-2">
            {pack.bestFor}
          </p>
        )}

        <button
          className={`
            w-full py-3 px-6 rounded-lg font-semibold transition-all
            ${pack.popular
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-2xl'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }
          `}
        >
          Purchase
        </button>

        <p className="text-xs text-gray-500 mt-3">✓ Credits never expire</p>
      </div>
    </div>
  );
};

const SubscriptionPlanCard: React.FC<{
  plan: SubscriptionPlan;
  onSelect: () => void;
}> = ({ plan, onSelect }) => {
  if (plan.type === 'custom') {
    return (
      <div className="relative p-6 rounded-xl border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-white shadow-lg">
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
            CUSTOM
          </span>
        </div>

        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-3">{plan.name}</h3>
          <p className="text-gray-600 mb-6">{plan.description}</p>

          <div className="space-y-2 mb-6">
            {plan.features.slice(0, 5).map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onSelect}
            className="w-full py-3 px-6 rounded-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-2xl transition-all"
          >
            Contact Sales
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        relative p-6 rounded-xl border-2 transition-all cursor-pointer
        hover:border-blue-500 hover:shadow-xl
        ${plan.popular
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-lg scale-105'
          : 'border-gray-200 bg-white'
        }
      `}
      onClick={onSelect}
    >
      {plan.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
            ⭐ RECOMMENDED
          </span>
        </div>
      )}

      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

        <div className="mb-4">
          <div className="text-4xl font-bold text-gray-900">
            ${typeof plan.price === 'number' ? plan.price : '0'}
            <span className="text-lg text-gray-500 font-normal">/month</span>
          </div>
          {typeof plan.monthlyCredits === 'number' && (
            <p className="text-sm text-gray-500 mt-1">
              {plan.monthlyCredits} credits/month
            </p>
          )}
        </div>

        <ul className="space-y-2 mb-6 text-left">
          {plan.features.slice(0, 6).map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          className={`
            w-full py-3 px-6 rounded-lg font-semibold transition-all
            ${plan.popular
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-2xl'
              : plan.type === 'free'
              ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {plan.type === 'free' ? 'Current Plan' : 'Subscribe'}
        </button>
      </div>
    </div>
  );
};

const CreditPurchasePage: React.FC<CreditPurchasePageProps> = ({
  onPurchasePack,
  onSubscribe
}) => {
  const { credits, creditBalance } = useCredits();
  const [activeTab, setActiveTab] = useState<'packs' | 'subscriptions'>('packs');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Get More Credits
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Power your presentations with AI. Choose the perfect plan for your needs.
          </p>

          {/* Current Balance */}
          {credits !== null && (
            <div className="mt-6 inline-flex items-center gap-2 bg-white px-6 py-3 rounded-lg shadow-sm border border-gray-200">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-700">
                Current balance: <strong className="text-blue-600">{credits} credits</strong>
              </span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('packs')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'packs'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              One-Time Purchase
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                activeTab === 'subscriptions'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly Plans
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'packs' ? (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Buy Credits As You Go
              </h2>
              <p className="text-gray-600">
                No subscription required. Credits never expire.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {CREDIT_PACKS.map(pack => (
                <CreditPackCard
                  key={pack.id}
                  pack={pack}
                  onSelect={() => onPurchasePack?.(pack.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Monthly Subscription Plans
              </h2>
              <p className="text-gray-600">
                Get recurring credits with rollover and team features.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {SUBSCRIPTION_PLANS.filter(p => p.id !== 'free').map(plan => (
                <SubscriptionPlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={() => {
                    if (plan.contactSales) {
                      window.location.href = 'mailto:sales@deckrai.com?subject=Enterprise%20Plan%20Inquiry';
                    } else {
                      onSubscribe?.(plan.id);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Why Choose Our Credit System?
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Credits Never Expire</h4>
              <p className="text-gray-600 text-sm">
                Use your credits whenever you need them. No pressure, no deadlines.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Secure Payments</h4>
              <p className="text-gray-600 text-sm">
                Powered by Stripe. Your payment information is always safe.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Instant Access</h4>
              <p className="text-gray-600 text-sm">
                Credits are added to your account immediately after purchase.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditPurchasePage;
