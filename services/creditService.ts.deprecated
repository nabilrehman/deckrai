import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  runTransaction,
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  CreditBalance,
  CreditTransaction,
  CreditTransactionType,
  UserProfile,
  PLAN_LIMITS,
  CREDIT_COSTS
} from '../types';

// ============================================================================
// CREDIT BALANCE OPERATIONS
// ============================================================================

/**
 * Get user's current credit balance
 */
export const getCredits = async (userId: string): Promise<CreditBalance | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error('[creditService] User not found:', userId);
      return null;
    }

    const userData = userSnap.data() as UserProfile;
    return userData.credits;
  } catch (error) {
    console.error('[creditService] Error fetching credits:', error);
    throw error;
  }
};

/**
 * Check if user has sufficient credits for an operation
 */
export const checkSufficientCredits = async (
  userId: string,
  requiredCredits: number
): Promise<{ sufficient: boolean; current: number; required: number }> => {
  try {
    const credits = await getCredits(userId);

    if (!credits) {
      return { sufficient: false, current: 0, required: requiredCredits };
    }

    const totalAvailable = credits.current;
    return {
      sufficient: totalAvailable >= requiredCredits,
      current: totalAvailable,
      required: requiredCredits
    };
  } catch (error) {
    console.error('[creditService] Error checking credits:', error);
    throw error;
  }
};

// ============================================================================
// CREDIT TRANSACTIONS (ATOMIC)
// ============================================================================

/**
 * Deduct credits from user's balance (ATOMIC)
 * Uses Firestore transaction to prevent race conditions
 *
 * @param userId - User ID
 * @param amount - Number of credits to deduct (positive number)
 * @param type - Type of transaction
 * @param metadata - Optional metadata (slide ID, deck ID, etc.)
 * @returns Transaction record
 */
export const deductCredits = async (
  userId: string,
  amount: number,
  type: CreditTransactionType,
  metadata?: {
    slideId?: string;
    slideName?: string;
    deckId?: string;
    reason?: string;
  }
): Promise<CreditTransaction> => {
  if (amount <= 0) {
    throw new Error('Deduction amount must be positive');
  }

  try {
    const userRef = doc(db, 'users', userId);
    const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Run atomic transaction
    const transaction = await runTransaction(db, async (firestoreTransaction) => {
      const userSnap = await firestoreTransaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnap.data() as UserProfile;
      const credits = userData.credits;

      // Check sufficient balance
      if (credits.current < amount) {
        throw new Error(
          `Insufficient credits. Required: ${amount}, Available: ${credits.current}`
        );
      }

      const balanceBefore = credits.current;
      const balanceAfter = balanceBefore - amount;

      // Update user's credit balance
      firestoreTransaction.update(userRef, {
        'credits.current': balanceAfter
      });

      // Create transaction record
      const txRecord: Omit<CreditTransaction, 'id'> = {
        userId,
        type,
        amount: -amount, // Negative for deductions
        balanceBefore,
        balanceAfter,
        timestamp: Date.now(),
        metadata
      };

      return txRecord;
    });

    // Save transaction to subcollection (outside main transaction for performance)
    const txRef = await addDoc(collection(db, 'users', userId, 'creditTransactions'), {
      ...transaction,
      id: transactionId
    });

    console.log('[creditService] Credits deducted:', {
      userId,
      amount,
      type,
      balanceAfter: transaction.balanceAfter
    });

    return {
      id: txRef.id,
      ...transaction
    };
  } catch (error) {
    console.error('[creditService] Error deducting credits:', error);
    throw error;
  }
};

/**
 * Add credits to user's balance (ATOMIC)
 * Used for purchases, bonuses, refunds, monthly resets
 *
 * @param userId - User ID
 * @param amount - Number of credits to add (positive number)
 * @param type - Type of transaction
 * @param metadata - Optional metadata
 * @returns Transaction record
 */
export const addCredits = async (
  userId: string,
  amount: number,
  type: CreditTransactionType,
  metadata?: {
    stripePaymentId?: string;
    reason?: string;
  }
): Promise<CreditTransaction> => {
  if (amount <= 0) {
    throw new Error('Addition amount must be positive');
  }

  try {
    const userRef = doc(db, 'users', userId);
    const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const transaction = await runTransaction(db, async (firestoreTransaction) => {
      const userSnap = await firestoreTransaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnap.data() as UserProfile;
      const credits = userData.credits;
      const balanceBefore = credits.current;
      const balanceAfter = balanceBefore + amount;

      // Update appropriate credit field based on transaction type
      const updates: any = {
        'credits.current': balanceAfter
      };

      if (type === 'purchase') {
        // Track purchased credits separately (never expire)
        updates['credits.purchased'] = (credits.purchased || 0) + amount;
      }

      firestoreTransaction.update(userRef, updates);

      const txRecord: Omit<CreditTransaction, 'id'> = {
        userId,
        type,
        amount, // Positive for additions
        balanceBefore,
        balanceAfter,
        timestamp: Date.now(),
        metadata
      };

      return txRecord;
    });

    // Save transaction record
    const txRef = await addDoc(collection(db, 'users', userId, 'creditTransactions'), {
      ...transaction,
      id: transactionId
    });

    console.log('[creditService] Credits added:', {
      userId,
      amount,
      type,
      balanceAfter: transaction.balanceAfter
    });

    return {
      id: txRef.id,
      ...transaction
    };
  } catch (error) {
    console.error('[creditService] Error adding credits:', error);
    throw error;
  }
};

// ============================================================================
// CREDIT HISTORY
// ============================================================================

/**
 * Get user's credit transaction history
 */
export const getCreditHistory = async (
  userId: string,
  limitCount: number = 50
): Promise<CreditTransaction[]> => {
  try {
    const txRef = collection(db, 'users', userId, 'creditTransactions');
    const q = query(txRef, orderBy('timestamp', 'desc'), firestoreLimit(limitCount));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as CreditTransaction);
  } catch (error) {
    console.error('[creditService] Error fetching credit history:', error);
    throw error;
  }
};

// ============================================================================
// MONTHLY CREDIT RESET
// ============================================================================

/**
 * Reset monthly credits for a user
 * - Free plan: Reset to monthly allowance (no rollover)
 * - Paid plans: Rollover unused credits up to max limit
 *
 * This should be called by a Cloud Function on a schedule (1st of each month)
 */
export const resetMonthlyCredits = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);

    await runTransaction(db, async (transaction) => {
      const userSnap = await transaction.get(userRef);

      if (!userSnap.exists()) {
        throw new Error('User not found');
      }

      const userData = userSnap.data() as UserProfile;
      const { plan, credits } = userData;
      const planLimits = PLAN_LIMITS[plan];

      const now = Date.now();
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      nextMonth.setHours(0, 0, 0, 0);

      let newCurrent = planLimits.creditsPerMonth;
      let rolledOver = 0;

      // Handle rollover for paid plans
      if (planLimits.allowRollover && credits.current > 0) {
        const maxRollover = planLimits.creditsPerMonth * planLimits.maxRollover;
        rolledOver = Math.min(credits.current, maxRollover);
        newCurrent += rolledOver;
      }

      // Add back any purchased credits (they never expire)
      newCurrent += credits.purchased || 0;

      // Update credits
      transaction.update(userRef, {
        'credits.current': newCurrent,
        'credits.monthlyAllowance': planLimits.creditsPerMonth,
        'credits.rolledOver': rolledOver,
        'credits.lastResetAt': now,
        'credits.nextResetAt': nextMonth.getTime()
      });

      console.log('[creditService] Monthly credits reset:', {
        userId,
        plan,
        newCurrent,
        rolledOver
      });
    });

    // Create transaction record for reset
    await addDoc(collection(db, 'users', userId, 'creditTransactions'), {
      id: `reset-${Date.now()}`,
      userId,
      type: 'monthly_reset',
      amount: PLAN_LIMITS[(await getDoc(doc(db, 'users', userId))).data()?.plan || 'free']
        .creditsPerMonth,
      balanceBefore: (await getCredits(userId))?.current || 0,
      balanceAfter: (await getCredits(userId))?.current || 0,
      timestamp: Date.now(),
      metadata: { reason: 'Monthly credit reset' }
    });
  } catch (error) {
    console.error('[creditService] Error resetting monthly credits:', error);
    throw error;
  }
};

/**
 * Initialize credit balance for new user
 */
export const initializeCredits = (plan: UserProfile['plan']): CreditBalance => {
  const planLimits = PLAN_LIMITS[plan];
  const now = Date.now();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  nextMonth.setHours(0, 0, 0, 0);

  return {
    current: planLimits.creditsPerMonth,
    monthlyAllowance: planLimits.creditsPerMonth,
    rolledOver: 0,
    purchased: 0,
    lastResetAt: now,
    nextResetAt: nextMonth.getTime()
  };
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate credit cost for slide generation
 */
export const calculateSlideGenerationCost = (slideCount: number): number => {
  return slideCount * CREDIT_COSTS.SLIDE_GENERATION;
};

/**
 * Calculate credit cost for deck generation
 */
export const calculateDeckGenerationCost = (slideCount: number): number => {
  return slideCount * CREDIT_COSTS.DECK_GENERATION_PER_SLIDE;
};

/**
 * Get credit usage percentage
 */
export const getCreditUsagePercentage = async (userId: string): Promise<number> => {
  const credits = await getCredits(userId);
  if (!credits || credits.monthlyAllowance === 0) return 0;

  const used = credits.monthlyAllowance - credits.current;
  return Math.round((used / credits.monthlyAllowance) * 100);
};
