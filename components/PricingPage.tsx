import React from 'react';
import { PLAN_LIMITS } from '../types';

interface PricingPageProps {
    onClose: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onClose }) => {
    const plans = [
        {
            name: 'Free',
            price: '$0',
            period: 'forever',
            description: 'Perfect for getting started',
            features: [
                `${PLAN_LIMITS.free.slidesPerMonth} slides per month`,
                `${PLAN_LIMITS.free.decksPerMonth} decks per month`,
                'Standard AI models',
                'Save decks to cloud',
                'Basic export (PDF)',
                'Community support'
            ],
            cta: 'Current Plan',
            highlighted: false,
            disabled: true
        },
        {
            name: 'Pro',
            price: '$15',
            period: '/month',
            description: 'For professionals and teams',
            features: [
                `${PLAN_LIMITS.pro.slidesPerMonth} slides per month`,
                `${PLAN_LIMITS.pro.decksPerMonth} decks per month`,
                'All AI models (Flash, Pro, Imagen)',
                'Deep mode (AI self-correction)',
                'No watermarks',
                'Personalization features',
                'Priority generation',
                'Email support'
            ],
            cta: 'Coming Soon',
            highlighted: true,
            disabled: true
        },
        {
            name: 'Enterprise',
            price: '$49',
            period: '/month',
            description: 'For organizations at scale',
            features: [
                `${PLAN_LIMITS.enterprise.slidesPerMonth} slides per month`,
                `${PLAN_LIMITS.enterprise.decksPerMonth} decks per month`,
                'Everything in Pro',
                'Custom branding',
                'API access',
                'Team collaboration',
                'Advanced analytics',
                'Dedicated support',
                'SLA guarantee'
            ],
            cta: 'Coming Soon',
            highlighted: false,
            disabled: true
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
                        Start free, upgrade when you're ready
                    </p>
                    <div className="inline-block mt-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700 font-medium">
                            🎉 Currently in free beta - Enjoy unlimited access!
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
                                disabled={plan.disabled}
                                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                                    plan.highlighted
                                        ? 'bg-gradient-to-r from-brand-primary-500 to-brand-accent-500 text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                                        : 'bg-gray-100 text-brand-text-secondary hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
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
                                When will paid plans be available?
                            </h4>
                            <p className="text-brand-text-secondary text-sm">
                                We're currently in beta and all features are free! Paid plans will be introduced once we've refined the product based on user feedback.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-brand-text-primary mb-2">
                                Will my free account be grandfathered?
                            </h4>
                            <p className="text-brand-text-secondary text-sm">
                                Beta users will receive special benefits when we launch paid plans. Stay tuned for announcements!
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
