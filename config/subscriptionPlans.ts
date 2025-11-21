/**
 * Subscription Plan Configuration
 * Defines pricing tiers, limits, and features for the application
 */

export type SubscriptionPlan = 'trial' | 'starter' | 'business' | 'enterprise';

export interface SubscriptionTier {
  id: SubscriptionPlan;
  name: string;
  displayName: string;
  price: number; // Monthly price in USD (0 for trial)
  yearlyPrice?: number; // Optional yearly pricing
  stripePriceId?: string; // Stripe Price ID for monthly subscription
  stripeYearlyPriceId?: string; // Stripe Price ID for yearly subscription

  // Usage Limits
  slidesPerMonth: number; // -1 means unlimited
  decksPerMonth: number; // -1 means unlimited

  // Feature Flags
  features: {
    styleLibrary: boolean; // Access to style library feature
    brandAdherence: boolean; // Brand consistency/adherence feature
    deepMode: boolean; // AI self-correction mode
    priorityGeneration: boolean; // Faster generation queue
    advancedModels: boolean; // Access to premium AI models
    removeWatermarks: boolean; // Remove deckr.ai watermarks
    teamCollaboration: boolean; // Team features (coming soon)
    apiAccess: boolean; // API access for integrations
    customBranding: boolean; // White-labeling
    dedicatedSupport: boolean; // Dedicated customer support
  };

  // Trial Settings (only for trial tier)
  trialDays?: number;

  // Display Properties
  description: string;
  popular?: boolean; // Show "Most Popular" badge
  cta: string; // Call-to-action button text
}

/**
 * Subscription plan definitions
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionTier> = {
  trial: {
    id: 'trial',
    name: 'Trial',
    displayName: '14-Day Free Trial',
    price: 0,
    slidesPerMonth: 20,
    decksPerMonth: 5,
    trialDays: 14,
    description: 'Try deckr.ai for 14 days',
    cta: 'Start Free Trial',
    features: {
      styleLibrary: false,
      brandAdherence: false,
      deepMode: true,
      priorityGeneration: false,
      advancedModels: false,
      removeWatermarks: false,
      teamCollaboration: false,
      apiAccess: false,
      customBranding: false,
      dedicatedSupport: false,
    },
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    displayName: 'Starter',
    price: 19,
    yearlyPrice: 190, // ~$15.83/month (2 months free)
    slidesPerMonth: 75,
    decksPerMonth: 15,
    description: 'Perfect for individuals and small projects',
    cta: 'Start with Starter',
    features: {
      styleLibrary: false,
      brandAdherence: false,
      deepMode: true,
      priorityGeneration: false,
      advancedModels: true,
      removeWatermarks: true,
      teamCollaboration: false,
      apiAccess: false,
      customBranding: false,
      dedicatedSupport: false,
    },
    // Stripe Price IDs
    stripePriceId: 'price_1SVp1L3ZT6RXP9jPJmKvhbln',
    stripeYearlyPriceId: undefined,
  },

  business: {
    id: 'business',
    name: 'Business',
    displayName: 'Business',
    price: 99,
    yearlyPrice: 990, // ~$82.50/month (2 months free)
    slidesPerMonth: 250,
    decksPerMonth: 50,
    description: 'For teams and professional use',
    popular: true,
    cta: 'Go Business',
    features: {
      styleLibrary: true, // ⭐ Business exclusive
      brandAdherence: true, // ⭐ Business exclusive
      deepMode: true,
      priorityGeneration: true,
      advancedModels: true,
      removeWatermarks: true,
      teamCollaboration: false, // Coming soon
      apiAccess: false, // Coming soon
      customBranding: false,
      dedicatedSupport: true,
    },
    // Stripe Price IDs
    stripePriceId: 'price_1SVp1q3ZT6RXP9jPArCVfX9w',
    stripeYearlyPriceId: undefined,
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    displayName: 'Enterprise',
    price: 0, // Custom pricing
    slidesPerMonth: -1, // Unlimited
    decksPerMonth: -1, // Unlimited
    description: 'Custom solutions for organizations',
    cta: 'Contact Sales',
    features: {
      styleLibrary: true,
      brandAdherence: true,
      deepMode: true,
      priorityGeneration: true,
      advancedModels: true,
      removeWatermarks: true,
      teamCollaboration: true,
      apiAccess: true,
      customBranding: true,
      dedicatedSupport: true,
    },
  },
};

/**
 * Helper function to get plan details
 */
export const getPlan = (planId: SubscriptionPlan): SubscriptionTier => {
  return SUBSCRIPTION_PLANS[planId];
};

/**
 * Check if a plan has a specific feature
 */
export const hasFeature = (
  planId: SubscriptionPlan,
  feature: keyof SubscriptionTier['features']
): boolean => {
  return SUBSCRIPTION_PLANS[planId].features[feature];
};

/**
 * Get the next upgrade tier
 */
export const getUpgradePath = (currentPlan: SubscriptionPlan): SubscriptionPlan | null => {
  const upgradePaths: Record<SubscriptionPlan, SubscriptionPlan | null> = {
    trial: 'starter',
    starter: 'business',
    business: 'enterprise',
    enterprise: null, // Already at top tier
  };

  return upgradePaths[currentPlan];
};

/**
 * Calculate days remaining in trial
 */
export const getTrialDaysRemaining = (trialStartDate: number, trialDays: number = 14): number => {
  const now = Date.now();
  const trialEndDate = trialStartDate + trialDays * 24 * 60 * 60 * 1000;
  const msRemaining = trialEndDate - now;
  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

  return Math.max(0, daysRemaining);
};

/**
 * Check if trial has expired
 */
export const isTrialExpired = (trialStartDate: number, trialDays: number = 14): boolean => {
  return getTrialDaysRemaining(trialStartDate, trialDays) <= 0;
};
