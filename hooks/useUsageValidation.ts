/**
 * Custom Hook: Usage Validation
 * Centralizes usage limit checking and tracking across the app
 *
 * Best Practices Implemented:
 * - Pre-generation validation
 * - Real-time usage tracking
 * - Proactive alerts (80% threshold)
 * - Clear error messages
 */

import { useState, useCallback } from 'react';
import { canGenerateSlides, getSubscriptionStatus } from '../services/subscriptionService';
import { incrementSlideCount } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';

interface UsageValidationResult {
  allowed: boolean;
  error?: string;
  warning?: string;
  currentUsage: number;
  limit: number;
  usagePercentage: number;
  isTrialExpired?: boolean;
  trialDaysRemaining?: number;
}

export const useUsageValidation = () => {
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  /**
   * Check if user can generate slides before allowing generation
   * Returns detailed validation result with warnings
   */
  const validateGeneration = useCallback(async (slideCount: number): Promise<UsageValidationResult> => {
    if (!user) {
      return {
        allowed: false,
        error: 'Please sign in to generate slides',
        currentUsage: 0,
        limit: 0,
        usagePercentage: 0
      };
    }

    setIsChecking(true);

    try {
      // Check subscription status (trial expiration, etc.)
      const status = await getSubscriptionStatus(user.uid);

      // Check if trial has expired
      if (status.isExpired) {
        return {
          allowed: false,
          error: `Your trial has expired. Upgrade to continue generating slides.`,
          currentUsage: 0,
          limit: 0,
          usagePercentage: 100,
          isTrialExpired: true
        };
      }

      // Check usage limits
      const canGenerate = await canGenerateSlides(user.uid, slideCount);

      if (!canGenerate.allowed) {
        return {
          allowed: false,
          error: canGenerate.reason || 'Usage limit reached',
          currentUsage: canGenerate.currentUsage,
          limit: canGenerate.limit,
          usagePercentage: (canGenerate.currentUsage / canGenerate.limit) * 100,
          trialDaysRemaining: status.trialDaysRemaining
        };
      }

      // Calculate usage percentage
      const usagePercentage = canGenerate.limit === -1
        ? 0
        : Math.round((canGenerate.currentUsage / canGenerate.limit) * 100);

      // Show warning if approaching limit (80% threshold - industry best practice)
      let warning: string | undefined;
      if (usagePercentage >= 80 && usagePercentage < 100) {
        const remaining = canGenerate.limit - canGenerate.currentUsage;
        warning = `You're approaching your monthly limit. ${remaining} slides remaining this month.`;
      }

      // Show trial warning if 3 days or less remaining
      if (status.isTrial && status.trialDaysRemaining && status.trialDaysRemaining <= 3) {
        warning = `Trial ends in ${status.trialDaysRemaining} day${status.trialDaysRemaining === 1 ? '' : 's'}. Upgrade to keep your access.`;
      }

      return {
        allowed: true,
        warning,
        currentUsage: canGenerate.currentUsage,
        limit: canGenerate.limit,
        usagePercentage,
        trialDaysRemaining: status.trialDaysRemaining
      };

    } catch (error: any) {
      console.error('[useUsageValidation] Validation error:', error);
      return {
        allowed: false,
        error: 'Failed to validate usage. Please try again.',
        currentUsage: 0,
        limit: 0,
        usagePercentage: 0
      };
    } finally {
      setIsChecking(false);
    }
  }, [user]);

  /**
   * Track usage after successful generation
   * Call this AFTER slides are successfully generated
   */
  const trackUsage = useCallback(async (slideCount: number): Promise<void> => {
    if (!user) {
      console.warn('[useUsageValidation] Cannot track usage: No user logged in');
      return;
    }

    try {
      await incrementSlideCount(user.uid, slideCount);
      console.log(`[useUsageValidation] Tracked ${slideCount} slide(s) for user ${user.uid}`);
    } catch (error) {
      console.error('[useUsageValidation] Failed to track usage:', error);
      // Don't throw - we don't want to break the user flow if tracking fails
    }
  }, [user]);

  /**
   * Validate and track in one call (convenience method)
   * Use this for simpler flows where you generate immediately after validation
   */
  const validateAndGenerate = useCallback(async (
    slideCount: number,
    generateFn: () => Promise<void>
  ): Promise<{ success: boolean; error?: string; warning?: string }> => {
    const validation = await validateGeneration(slideCount);

    if (!validation.allowed) {
      return {
        success: false,
        error: validation.error
      };
    }

    try {
      // Execute generation
      await generateFn();

      // Track usage on success
      await trackUsage(slideCount);

      return {
        success: true,
        warning: validation.warning
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Generation failed'
      };
    }
  }, [validateGeneration, trackUsage]);

  return {
    validateGeneration,
    trackUsage,
    validateAndGenerate,
    isChecking
  };
};
