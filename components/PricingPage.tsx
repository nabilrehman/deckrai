import React from 'react';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans';

interface PricingPageProps {
    onClose: () => void;
    onSelectPlan?: (planId: 'starter' | 'business' | 'enterprise') => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onClose, onSelectPlan }) => {
    const starterPlan = SUBSCRIPTION_PLANS.starter;
    const businessPlan = SUBSCRIPTION_PLANS.business;
    const enterprisePlan = SUBSCRIPTION_PLANS.enterprise;

    const plans = [
        {
            id: 'starter' as const,
            name: starterPlan.displayName,
            price: `$${starterPlan.price}`,
            period: '/month',
            yearlyPrice: starterPlan.yearlyPrice ? `$${starterPlan.yearlyPrice}/year` : undefined,
            description: starterPlan.description,
            features: [
                `${starterPlan.slidesPerMonth} slides per month`,
                `${starterPlan.decksPerMonth} decks per month`,
                'Advanced AI models',
                'Deep mode (AI self-correction)',
                'No watermarks',
                'Save decks to cloud',
                'PDF export',
                'Email support'
            ],
            cta: 'Get Starter',
            highlighted: false,
            disabled: false
        },
        {
            id: 'business' as const,
            name: businessPlan.displayName,
            price: `$${businessPlan.price}`,
            period: '/month',
            yearlyPrice: businessPlan.yearlyPrice ? `$${businessPlan.yearlyPrice}/year` : undefined,
            description: businessPlan.description,
            features: [
                `${businessPlan.slidesPerMonth} slides per month`,
                `${businessPlan.decksPerMonth} decks per month`,
                '⭐ Style Library access',
                '⭐ Brand Adherence',
                'Priority generation queue',
                'Advanced AI models',
                'Deep mode',
                'No watermarks',
                'Dedicated support'
            ],
            cta: 'Get Business',
            highlighted: true,
            disabled: false
        },
        {
            id: 'enterprise' as const,
            name: enterprisePlan.displayName,
            price: 'Custom',
            period: '',
            description: enterprisePlan.description,
            features: [
                'Unlimited slides',
                'Unlimited decks',
                'Everything in Business',
                'Custom branding',
                'API access',
                'Team collaboration',
                'Advanced analytics',
                'SLA guarantee',
                'Dedicated account manager'
            ],
            cta: 'Contact Sales',
            highlighted: false,
            disabled: false
        }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-8 max-w-6xl w-full shadow-2xl my-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex-1"></div>
                        <h2 className="text-4xl font-display font-bold text-brand-text-primary">
                            Choose Your Plan
                        </h2>
                        <div className="flex-1 flex justify-end">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <p className="text-brand-text-secondary text-lg">
                        Start with a 14-day free trial, no credit card required
                    </p>
                    <div className="inline-block mt-4 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700 font-medium">
                            ✨ All plans include a 14-day free trial
                        </p>
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {plans.map((plan, index) => (
                        <div
                            key={plan.name}
                            className={`rounded-xl border-2 p-8 flex flex-col transition-all duration-300 ${
                                plan.highlighted
                                    ? 'border-brand-primary-500 shadow-xl scale-105 bg-gradient-to-br from-brand-primary-50 to-white'
                                    : 'border-gray-200 hover:border-brand-primary-300 hover:shadow-lg'
                            }`}
                        >
                            {plan.highlighted && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <span className="bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                                        Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-2xl font-display font-bold text-brand-text-primary mb-2">
                                    {plan.name}
                                </h3>
                                <p className="text-brand-text-secondary text-sm mb-4">
                                    {plan.description}
                                </p>
                                <div className="flex items-baseline mb-1">
                                    <span className="text-5xl font-bold text-brand-text-primary">
                                        {plan.price}
                                    </span>
                                    <span className="text-brand-text-secondary ml-2">
                                        {plan.period}
                                    </span>
                                </div>
                            </div>

                            <ul className="space-y-3 mb-8 flex-grow">
                                {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <svg
                                            className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                        <span className="text-brand-text-secondary text-sm">
                                            {feature}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                onClick={() => {
                                    if (plan.id === 'enterprise') {
                                        window.location.href = 'mailto:sales@deckr.ai?subject=Enterprise Plan Inquiry';
                                    } else if (onSelectPlan) {
                                        onSelectPlan(plan.id);
                                    }
                                }}
                                disabled={plan.disabled}
                                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                                    plan.highlighted
                                        ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                                        : plan.id === 'enterprise'
                                        ? 'bg-gray-800 text-white hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                }`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="border-t border-gray-200 pt-8">
                    <h3 className="text-xl font-semibold text-brand-text-primary mb-4 text-center">
                        Frequently Asked Questions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-semibold text-brand-text-primary mb-2">
                                How does the free trial work?
                            </h4>
                            <p className="text-brand-text-secondary text-sm">
                                Start with a 14-day free trial with full access to your chosen plan. No credit card required. Cancel anytime during the trial period with no charges.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-brand-text-primary mb-2">
                                What happens after my trial ends?
                            </h4>
                            <p className="text-brand-text-secondary text-sm">
                                After your trial, you'll need to select a paid plan to continue. Your data and decks are saved, so you can pick up right where you left off.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-brand-text-primary mb-2">
                                Can I upgrade or downgrade anytime?
                            </h4>
                            <p className="text-brand-text-secondary text-sm">
                                Yes! Once paid plans launch, you'll be able to change your plan at any time. Changes take effect immediately.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-brand-text-primary mb-2">
                                What payment methods do you accept?
                            </h4>
                            <p className="text-brand-text-secondary text-sm">
                                We'll accept all major credit cards via Stripe, ensuring secure and easy payments.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;
