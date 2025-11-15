import { CreditPackage, SubscriptionPlan } from '../types';

/**
 * Free credits given to new users
 */
export const FREE_STARTER_CREDITS = 10;

/**
 * 14-day free trial credits
 */
export const TRIAL_CREDITS = 10;

/**
 * Cost per slide creation (for internal tracking)
 * Based on: Gemini 2.5 Flash Image + occasional Pro calls
 */
export const ESTIMATED_COST_PER_SLIDE = 0.07; // $0.07 per slide

/**
 * One-Time Credit Packages
 * Users can purchase these without a subscription
 */
export const CREDIT_PACKS: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 25,
    price: 10,
    pricePerCredit: 0.40,
    bestFor: 'Individual users & testing',
    neverExpires: true
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 100,
    price: 30,
    pricePerCredit: 0.30,
    bonus: 10,  // Get 110 credits total
    popular: true,
    bestFor: 'Small teams & startups',
    neverExpires: true
  },
  {
    id: 'business',
    name: 'Business Pack',
    credits: 300,
    price: 75,
    pricePerCredit: 0.25,
    bonus: 50,  // Get 350 credits total
    bestFor: 'Growing teams',
    neverExpires: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 1000,
    price: 200,
    pricePerCredit: 0.20,
    bonus: 200,  // Get 1,200 credits total
    bestFor: 'Large organizations',
    neverExpires: true
  }
];

/**
 * Monthly Subscription Plans
 * Provides recurring credits with rollover
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    type: 'free',
    monthlyCredits: 10,
    price: 0,
    description: 'Perfect for getting started',
    features: [
      '10 credits/month (10 slides)',
      'Standard AI models',
      'Basic export (PDF)',
      'Save decks to cloud',
      'Community support',
      'Watermark on slides'
    ],
    limits: {
      creditsPerMonth: 10,
      teamMembers: 1,
      decksPerMonth: 5,
      storageGB: 1,
      rolloverCredits: 0  // No rollover for free
    }
  },

  {
    id: 'startup',
    name: 'Startup',
    type: 'subscription',
    monthlyCredits: 100,
    price: 35,
    pricePerCredit: 0.35,
    description: 'For small teams building presentations',
    popular: true,
    features: [
      '100 credits/month (100 slides)',
      'Rollover up to 50 unused credits',
      'All AI models (Flash, Pro, Imagen)',
      'Deep mode (AI self-correction)',
      'No watermarks',
      'Team collaboration (up to 5 members)',
      'Personalization features',
      'Priority generation',
      'Email support'
    ],
    limits: {
      creditsPerMonth: 100,
      teamMembers: 5,
      decksPerMonth: 'unlimited',
      storageGB: 10,
      rolloverCredits: 50
    },
    overage: {
      enabled: true,
      costPerCredit: 0.50,
      description: 'Additional credits: $0.50/credit'
    }
  },

  {
    id: 'business',
    name: 'Business',
    type: 'subscription',
    monthlyCredits: 300,
    price: 90,
    pricePerCredit: 0.30,
    description: 'For growing teams at scale',
    features: [
      '300 credits/month (300 slides)',
      'Rollover up to 150 unused credits',
      'Everything in Startup',
      'Team collaboration (up to 15 members)',
      'Advanced analytics & reporting',
      'API access (basic)',
      'SSO (Google, Microsoft)',
      'Priority support (24/7)',
      'Custom branding'
    ],
    limits: {
      creditsPerMonth: 300,
      teamMembers: 15,
      decksPerMonth: 'unlimited',
      storageGB: 50,
      rolloverCredits: 150
    },
    overage: {
      enabled: true,
      costPerCredit: 0.40,
      description: 'Additional credits: $0.40/credit'
    }
  },

  {
    id: 'enterprise',
    name: 'Enterprise',
    type: 'subscription',
    monthlyCredits: 1000,
    price: 250,
    pricePerCredit: 0.25,
    description: 'For organizations at scale',
    badge: 'Best Value',
    features: [
      '1,000 credits/month (1,000 slides)',
      'Rollover up to 500 unused credits',
      'Everything in Business',
      'Unlimited team members',
      'Full API access with webhooks',
      'SAML SSO',
      'Custom AI model fine-tuning',
      'White-label option',
      'SLA guarantee (99.9% uptime)',
      'Dedicated infrastructure',
      'Custom integrations',
      'On-site training',
      'Quarterly business reviews'
    ],
    limits: {
      creditsPerMonth: 1000,
      teamMembers: 'unlimited',
      decksPerMonth: 'unlimited',
      storageGB: 'unlimited',
      rolloverCredits: 500
    },
    overage: {
      enabled: true,
      costPerCredit: 0.30,
      description: 'Additional credits: $0.30/credit'
    }
  },

  {
    id: 'enterprise-plus',
    name: 'Enterprise Plus',
    type: 'custom',
    monthlyCredits: 'custom',
    price: 'custom',
    description: 'Custom solutions for large-scale needs',
    contactSales: true,
    features: [
      'Custom credit allocation (2,500+ credits/month)',
      'Volume discounts (20-40% off)',
      'Everything in Enterprise',
      'Custom contract terms',
      'Multi-year discounts',
      'Invoice billing (NET 30/60)',
      'Custom data retention policies',
      'Private cloud deployment option',
      'Dedicated support team',
      'Custom SLA agreements'
    ],
    limits: {
      creditsPerMonth: 'custom',
      teamMembers: 'unlimited',
      decksPerMonth: 'unlimited',
      storageGB: 'unlimited'
    }
  }
];

/**
 * Get plan by ID
 */
export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(p => p.id === planId);
};

/**
 * Get credit pack by ID
 */
export const getCreditPackById = (packId: string): CreditPackage | undefined => {
  return CREDIT_PACKS.find(p => p.id === packId);
};

/**
 * Calculate total credits including bonus
 */
export const calculateTotalCredits = (pack: CreditPackage): number => {
  return pack.credits + (pack.bonus || 0);
};

/**
 * Annual discount percentage
 */
export const ANNUAL_DISCOUNT = 0.20; // 20% off

/**
 * Calculate annual price with discount
 */
export const calculateAnnualPrice = (monthlyPrice: number): number => {
  return Math.round(monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT));
};
