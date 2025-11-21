/**
 * Subscription Service
 * Handles subscription-related logic and validation
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserProfile, UserPlan, TrialInfo } from '../types';
import { SUBSCRIPTION_PLANS, hasFeature, getTrialDaysRemaining, isTrialExpired } from '../config/subscriptionPlans';

// ============================================================================
// SUBSCRIPTION STATUS
// ============================================================================

/**
 * Get user's current subscription status
 */
export const getSubscriptionStatus = async (userId: string): Promise<{
  plan: UserPlan;
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  trialDaysRemaining?: number;
}> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error('User not found');
  }

  const userData = userSnap.data() as UserProfile;
  const { plan, trial, subscription } = userData;

  const isTrial = plan === 'trial';
  const trialExpired = trial ? isTrialExpired(trial.startDate) : false;
  const trialDaysRemaining = trial ? getTrialDaysRemaining(trial.startDate) : undefined;

  return {
    plan,
    isActive: subscription.status === 'active' || subscription.status === 'trialing',
    isTrial,
    isExpired: isTrial && trialExpired,
    trialDaysRemaining
  };
};

/**
 * Check if user has access to a specific feature
 */
export const canAccessFeature = async (
  userId: string,
  feature: keyof typeof SUBSCRIPTION_PLANS.starter.features
): Promise<boolean> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return false;
  }

  const userData = userSnap.data() as UserProfile;
  return hasFeature(userData.plan, feature);
};

/**
 * Get usage limits for user's current plan
 */
export const getUsageLimits = async (userId: string): Promise<{
  slidesPerMonth: number;
  decksPerMonth: number;
  isUnlimited: boolean;
}> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error('User not found');
  }

  const userData = userSnap.data() as UserProfile;
  const planConfig = SUBSCRIPTION_PLANS[userData.plan];

  return {
    slidesPerMonth: planConfig.slidesPerMonth,
    decksPerMonth: planConfig.decksPerMonth,
    isUnlimited: planConfig.slidesPerMonth === -1
  };
};

// ============================================================================
// USAGE VALIDATION
// ============================================================================

/**
 * Check if user can generate slides (has not exceeded limits)
 */
export const canGenerateSlides = async (
  userId: string,
  slideCount: number
): Promise<{
  allowed: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
  plan: UserPlan;
}> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return {
      allowed: false,
      reason: 'User not found',
      currentUsage: 0,
      limit: 0,
      plan: 'trial'
    };
  }

  const userData = userSnap.data() as UserProfile;
  const { plan, usage, trial } = userData;
  const planConfig = SUBSCRIPTION_PLANS[plan];

  // Check if trial has expired
  if (plan === 'trial' && trial && isTrialExpired(trial.startDate)) {
    return {
      allowed: false,
      reason: 'Trial expired. Please upgrade to continue.',
      currentUsage: usage.slidesThisMonth,
      limit: planConfig.slidesPerMonth,
      plan
    };
  }

  // Check usage limits (-1 means unlimited)
  if (planConfig.slidesPerMonth === -1) {
    return {
      allowed: true,
      currentUsage: usage.slidesThisMonth,
      limit: -1,
      plan
    };
  }

  const allowed = usage.slidesThisMonth + slideCount <= planConfig.slidesPerMonth;

  return {
    allowed,
    reason: allowed ? undefined : `You've reached your monthly limit of ${planConfig.slidesPerMonth} slides. Upgrade to generate more.`,
    currentUsage: usage.slidesThisMonth,
    limit: planConfig.slidesPerMonth,
    plan
  };
};

/**
 * Check if user's trial has expired and needs to upgrade
 */
export const checkTrialExpiration = async (userId: string): Promise<{
  isExpired: boolean;
  daysRemaining: number;
  shouldShowUpgradePrompt: boolean;
}> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return {
      isExpired: false,
      daysRemaining: 0,
      shouldShowUpgradePrompt: false
    };
  }

  const userData = userSnap.data() as UserProfile;
  const { plan, trial } = userData;

  if (plan !== 'trial' || !trial) {
    return {
      isExpired: false,
      daysRemaining: 0,
      shouldShowUpgradePrompt: false
    };
  }

  const expired = isTrialExpired(trial.startDate);
  const daysRemaining = getTrialDaysRemaining(trial.startDate);

  return {
    isExpired: expired,
    daysRemaining,
    shouldShowUpgradePrompt: expired || daysRemaining <= 3 // Show prompt when 3 days or less remaining
  };
};

// ============================================================================
// PLAN UPGRADES
// ============================================================================

/**
 * Upgrade user to a paid plan
 */
export const upgradePlan = async (
  userId: string,
  newPlan: Exclude<UserPlan, 'trial'>,
  stripeSubscriptionId?: string
): Promise<void> => {
  const userRef = doc(db, 'users', userId);

  const updates: any = {
    plan: newPlan,
    'subscription.status': 'active',
    'subscription.currentPeriodEnd': Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days from now
  };

  // Add Stripe subscription ID if provided
  if (stripeSubscriptionId) {
    updates['subscription.stripeSubscriptionId'] = stripeSubscriptionId;
  }

  // Remove trial info when upgrading from trial
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data() as UserProfile;
    if (userData.plan === 'trial') {
      updates.trial = null;
    }
  }

  await updateDoc(userRef, updates);

  console.log('[subscriptionService] User upgraded:', {
    userId,
    newPlan,
    stripeSubscriptionId
  });
};

/**
 * Downgrade user plan (e.g., when subscription cancelled)
 */
export const downgradePlan = async (userId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);

  await updateDoc(userRef, {
    plan: 'trial',
    'subscription.status': 'canceled'
  });

  console.log('[subscriptionService] User downgraded to trial:', userId);
};

/**
 * Get upgrade recommendation based on current usage
 */
export const getUpgradeRecommendation = async (userId: string): Promise<{
  shouldUpgrade: boolean;
  recommendedPlan?: UserPlan;
  reason?: string;
}> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return { shouldUpgrade: false };
  }

  const userData = userSnap.data() as UserProfile;
  const { plan, usage } = userData;
  const planConfig = SUBSCRIPTION_PLANS[plan];

  // Don't recommend upgrade for enterprise users
  if (plan === 'enterprise') {
    return { shouldUpgrade: false };
  }

  // Check if user is approaching limits (80% usage)
  const usagePercentage = (usage.slidesThisMonth / planConfig.slidesPerMonth) * 100;

  if (usagePercentage >= 80) {
    const recommendedPlan = plan === 'trial' ? 'starter' : plan === 'starter' ? 'business' : 'enterprise';

    return {
      shouldUpgrade: true,
      recommendedPlan,
      reason: `You've used ${Math.round(usagePercentage)}% of your monthly slides. Upgrade to ${SUBSCRIPTION_PLANS[recommendedPlan].displayName} for more capacity.`
    };
  }

  return { shouldUpgrade: false };
};

// ============================================================================
// FEATURE ACCESS HELPERS
// ============================================================================

/**
 * Validate feature access and return error message if denied
 */
export const validateFeatureAccess = async (
  userId: string,
  feature: keyof typeof SUBSCRIPTION_PLANS.starter.features
): Promise<{
  allowed: boolean;
  error?: string;
  upgradeRequired?: UserPlan;
}> => {
  const hasAccess = await canAccessFeature(userId, feature);

  if (hasAccess) {
    return { allowed: true };
  }

  // Find which plan has this feature
  const plansWithFeature = (Object.keys(SUBSCRIPTION_PLANS) as UserPlan[]).filter(
    planId => SUBSCRIPTION_PLANS[planId].features[feature]
  );

  const cheapestPlanWithFeature = plansWithFeature[0]; // Plans are ordered: trial < starter < business < enterprise

  return {
    allowed: false,
    error: `This feature requires the ${SUBSCRIPTION_PLANS[cheapestPlanWithFeature].displayName} plan.`,
    upgradeRequired: cheapestPlanWithFeature
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format usage as a percentage
 */
export const getUsagePercentage = (currentUsage: number, limit: number): number => {
  if (limit === -1) return 0; // Unlimited
  return Math.min(Math.round((currentUsage / limit) * 100), 100);
};

/**
 * Get user-friendly plan name
 */
export const getPlanDisplayName = (plan: UserPlan): string => {
  return SUBSCRIPTION_PLANS[plan].displayName;
};

/**
 * Check if plan is a paid plan
 */
export const isPaidPlan = (plan: UserPlan): boolean => {
  return plan !== 'trial';
};
