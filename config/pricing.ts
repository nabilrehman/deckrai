/**
 * Centralized Pricing Configuration for deckr.ai
 * Last updated: November 2025
 *
 * IMPORTANT: This is the single source of truth for all pricing.
 * Any changes here should be reflected in:
 * - index.html (marketing page)
 * - components/PricingBadge.tsx
 * - components/PricingPage.tsx
 * - components/EnhancedModal.tsx
 * - components/AnalyticsDashboard.tsx
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // USD per month
  credits: number; // Monthly credit allocation
  rolloverLimit: number; // Max credits that can roll over
  features: string[];
  popular?: boolean;
  cta: string;
}

export interface CreditPack {
  id: string;
  credits: number;
  price: number; // USD one-time
  bonus?: number; // Bonus credits
  popular?: boolean;
}

/**
 * Monthly Subscription Plans
 * Pricing model: 1 credit = 1 slide creation or edit
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 10,
    rolloverLimit: 0, // No rollover for free tier
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
    popular: false
  },
  {
    id: 'startup',
    name: 'Startup',
    price: 35,
    credits: 100,
    rolloverLimit: 50, // Can rollover up to 50 credits
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
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 90,
    credits: 300,
    rolloverLimit: 150, // Can rollover up to 150 credits
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
    popular: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 250,
    credits: 1000,
    rolloverLimit: 500, // Can rollover up to 500 credits
    features: [
      'Everything in Business',
      '1,000 credits/month shared pool',
      'Rollover up to 500 unused credits',
      'Unlimited team members',
      'SSO & advanced security',
      'Custom branding',
      'API access',
      'Dedicated account manager',
      'SLA guarantee'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

/**
 * One-Time Credit Packs
 * Credits never expire, can be used anytime
 */
export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    credits: 25,
    price: 10,
    popular: false
  },
  {
    id: 'pro',
    credits: 100,
    price: 35,
    bonus: 10, // Get 110 credits total
    popular: true
  },
  {
    id: 'ultimate',
    credits: 250,
    price: 80,
    bonus: 30, // Get 280 credits total
    popular: false
  }
];

/**
 * Helper function to calculate price per credit
 */
export function getPricePerCredit(pack: CreditPack): number {
  const totalCredits = pack.credits + (pack.bonus || 0);
  return pack.price / totalCredits;
}

/**
 * Helper function to get plan by ID
 */
export function getPlanById(planId: string): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
}

/**
 * Helper function to get credit pack by ID
 */
export function getPackById(packId: string): CreditPack | undefined {
  return CREDIT_PACKS.find(pack => pack.id === packId);
}

/**
 * Pricing constants
 */
export const PRICING_CONSTANTS = {
  CREDIT_COST_PER_SLIDE: 1,
  AVERAGE_SLIDES_PER_DECK: 10,
  FREE_TIER_MONTHLY_LIMIT: 10,
  TRIAL_PERIOD_DAYS: 14,
  MONEY_BACK_GUARANTEE_DAYS: 14
} as const;
