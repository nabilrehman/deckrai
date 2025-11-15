import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CreditBalance, CreditTransaction, UserProfile } from '../types';
import { FREE_STARTER_CREDITS } from '../config/pricing';

/**
 * Get user's current credit balance
 */
export const getCreditBalance = async (userId: string): Promise<CreditBalance> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error('User not found');
  }

  const userData = userSnap.data() as UserProfile;

  // Return credits or initialize if missing
  if (!userData.credits) {
    // Initialize credits for existing users
    const initialCredits: CreditBalance = {
      totalCredits: FREE_STARTER_CREDITS,
      usedCreditsLifetime: 0,
      usedCreditsThisMonth: 0,
      lastUpdated: Date.now()
    };

    await updateDoc(userRef, { credits: initialCredits });
    return initialCredits;
  }

  return userData.credits;
};

/**
 * Consume credits (for slide creation/edit)
 * Uses Firestore transaction for atomic updates to prevent race conditions
 */
export const consumeCredits = async (
  userId: string,
  amount: number,
  description: string,
  metadata?: {
    slideId?: string;
    deckId?: string;
    action?: 'create' | 'edit' | 'regenerate';
  }
): Promise<{ success: boolean; newBalance: number; error?: string }> => {
  const userRef = doc(db, 'users', userId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as UserProfile;
      const currentBalance = userData.credits?.totalCredits || 0;

      // Check if user has enough credits
      if (currentBalance < amount) {
        return {
          success: false,
          newBalance: currentBalance,
          error: 'Insufficient credits'
        };
      }

      // Calculate new balance
      const newBalance = currentBalance - amount;
      const now = Date.now();

      // Update user's credit balance
      const updatedCredits: CreditBalance = {
        ...userData.credits,
        totalCredits: newBalance,
        usedCreditsLifetime: (userData.credits?.usedCreditsLifetime || 0) + amount,
        usedCreditsThisMonth: (userData.credits?.usedCreditsThisMonth || 0) + amount,
        lastUpdated: now
      };

      transaction.update(userRef, { credits: updatedCredits });

      // Log transaction
      const transactionData: Omit<CreditTransaction, 'id'> = {
        userId,
        organizationId: userData.organizationId,
        type: 'consumption',
        amount: -amount,  // Negative for consumption
        balanceAfter: newBalance,
        description,
        metadata,
        timestamp: now
      };

      const transactionsRef = collection(db, 'creditTransactions');
      const newTransactionRef = doc(transactionsRef);
      transaction.set(newTransactionRef, {
        ...transactionData,
        id: newTransactionRef.id
      });

      return { success: true, newBalance };
    });

    return result;
  } catch (error: any) {
    console.error('Error consuming credits:', error);
    return {
      success: false,
      newBalance: 0,
      error: error.message || 'Failed to consume credits'
    };
  }
};

/**
 * Add credits to user account (for purchases, bonuses, refunds)
 */
export const addCredits = async (
  userId: string,
  amount: number,
  description: string,
  type: 'purchase' | 'bonus' | 'refund' | 'subscription_renewal' = 'purchase',
  metadata?: {
    packageId?: string;
    invoiceId?: string;
  }
): Promise<{ success: boolean; newBalance: number; error?: string }> => {
  const userRef = doc(db, 'users', userId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as UserProfile;
      const currentBalance = userData.credits?.totalCredits || 0;
      const newBalance = currentBalance + amount;
      const now = Date.now();

      // Update user's credit balance
      const updatedCredits: CreditBalance = {
        ...userData.credits,
        totalCredits: newBalance,
        usedCreditsLifetime: userData.credits?.usedCreditsLifetime || 0,
        usedCreditsThisMonth: userData.credits?.usedCreditsThisMonth || 0,
        lastCreditPurchase: type === 'purchase' ? now : userData.credits?.lastCreditPurchase,
        lastUpdated: now
      };

      transaction.update(userRef, { credits: updatedCredits });

      // Log transaction
      const transactionData: Omit<CreditTransaction, 'id'> = {
        userId,
        organizationId: userData.organizationId,
        type,
        amount,  // Positive for additions
        balanceAfter: newBalance,
        description,
        metadata,
        timestamp: now
      };

      const transactionsRef = collection(db, 'creditTransactions');
      const newTransactionRef = doc(transactionsRef);
      transaction.set(newTransactionRef, {
        ...transactionData,
        id: newTransactionRef.id
      });

      return { success: true, newBalance };
    });

    console.log(`✅ Added ${amount} credits to user ${userId}. New balance: ${result.newBalance}`);
    return result;
  } catch (error: any) {
    console.error('Error adding credits:', error);
    return {
      success: false,
      newBalance: 0,
      error: error.message || 'Failed to add credits'
    };
  }
};

/**
 * Get credit transaction history for a user
 */
export const getCreditHistory = async (
  userId: string,
  limitCount: number = 50
): Promise<CreditTransaction[]> => {
  try {
    const transactionsRef = collection(db, 'creditTransactions');
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as CreditTransaction);
  } catch (error) {
    console.error('Error fetching credit history:', error);
    return [];
  }
};

/**
 * Check if user has enough credits before performing an action
 */
export const checkCreditAvailability = async (
  userId: string,
  requiredCredits: number
): Promise<{
  hasEnough: boolean;
  currentBalance: number;
  shortfall: number;
}> => {
  const balance = await getCreditBalance(userId);
  const hasEnough = balance.totalCredits >= requiredCredits;

  return {
    hasEnough,
    currentBalance: balance.totalCredits,
    shortfall: hasEnough ? 0 : requiredCredits - balance.totalCredits
  };
};

/**
 * Reset monthly usage counters (called on billing cycle reset)
 */
export const resetMonthlyUsage = async (userId: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data() as UserProfile;

      const updatedCredits: CreditBalance = {
        ...userData.credits,
        usedCreditsThisMonth: 0,  // Reset monthly counter
        lastUpdated: Date.now()
      };

      transaction.update(userRef, { credits: updatedCredits });
    });

    console.log(`✅ Reset monthly usage for user ${userId}`);
  } catch (error) {
    console.error('Error resetting monthly usage:', error);
    throw error;
  }
};

/**
 * Get credit usage statistics for analytics
 */
export const getCreditStats = async (userId: string): Promise<{
  totalCreditsLifetime: number;
  totalCreditsThisMonth: number;
  totalPurchases: number;
  totalSpent: number;
  averageCostPerSlide: number;
}> => {
  const balance = await getCreditBalance(userId);
  const transactions = await getCreditHistory(userId, 1000);

  const purchases = transactions.filter(t => t.type === 'purchase');
  const consumptions = transactions.filter(t => t.type === 'consumption');

  const totalSpent = purchases.reduce((sum, t) => {
    // Estimate cost based on credits (reverse calculate from pricing)
    return sum + (t.amount * 0.30); // Average $0.30 per credit
  }, 0);

  return {
    totalCreditsLifetime: balance.usedCreditsLifetime,
    totalCreditsThisMonth: balance.usedCreditsThisMonth,
    totalPurchases: purchases.length,
    totalSpent,
    averageCostPerSlide: consumptions.length > 0
      ? totalSpent / consumptions.length
      : 0
  };
};

/**
 * Initialize credits for a new user
 */
export const initializeUserCredits = async (
  userId: string,
  initialCredits: number = FREE_STARTER_CREDITS
): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  const now = Date.now();

  const credits: CreditBalance = {
    totalCredits: initialCredits,
    usedCreditsLifetime: 0,
    usedCreditsThisMonth: 0,
    lastUpdated: now
  };

  await updateDoc(userRef, { credits });

  // Log the initial credit grant
  if (initialCredits > 0) {
    await addCredits(
      userId,
      initialCredits,
      'Welcome bonus - Free starter credits',
      'bonus'
    );
  }

  console.log(`✅ Initialized credits for new user ${userId}: ${initialCredits} credits`);
};

/**
 * Bulk credit operation for admin purposes
 * WARNING: Use with caution!
 */
export const bulkAddCredits = async (
  userIds: string[],
  amount: number,
  description: string
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const userId of userIds) {
    try {
      await addCredits(userId, amount, description, 'bonus');
      success++;
    } catch (error) {
      console.error(`Failed to add credits to user ${userId}:`, error);
      failed++;
    }
  }

  console.log(`✅ Bulk credit operation complete: ${success} success, ${failed} failed`);
  return { success, failed };
};
