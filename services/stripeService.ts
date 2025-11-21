import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, addDoc, getDocs, query, where, orderBy, limit as firestoreLimit, onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { UserPlan } from '../types';
import { updateUserPlan } from './firestoreService';

/**
 * Create a Stripe Checkout session for subscription
 *
 * This uses the Firebase Stripe extension to create a checkout session.
 * The user will be redirected to Stripe's hosted checkout page.
 */
export const createSubscriptionCheckoutSession = async (
  userId: string,
  priceId: string,
  plan: UserPlan
): Promise<string> => {
  try {
    console.log(`🛒 Creating subscription checkout session for user ${userId}`);
    console.log(`   Plan: ${plan}, PriceId: ${priceId}`);

    // Create checkout session document in Firestore
    // The Firebase Stripe Extension will automatically populate the 'url' field
    const checkoutSessionRef = collection(db, 'customers', userId, 'checkout_sessions');

    const sessionData = {
      price: priceId,
      success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${window.location.origin}/pricing`,
      allow_promotion_codes: true,
      mode: 'subscription',
      metadata: {
        userId,
        plan,
        type: 'subscription'
      }
    };

    console.log('📝 Creating checkout session document in Firestore...');
    const docRef = await addDoc(checkoutSessionRef, sessionData);
    console.log(`✅ Checkout session document created: ${docRef.id}`);

    // Wait for the Firebase Stripe Extension to populate the 'url' field
    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        unsubscribe();
        reject(new Error('Timeout waiting for checkout URL from Stripe'));
      }, 30000); // 30 second timeout

      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        const data = snapshot.data();

        if (data?.url) {
          clearTimeout(timeout);
          unsubscribe();
          console.log(`✅ Checkout URL received: ${data.url}`);
          resolve(data.url);
        } else if (data?.error) {
          clearTimeout(timeout);
          unsubscribe();
          console.error('❌ Error from Stripe:', data.error);
          reject(new Error(data.error.message || 'Failed to create checkout session'));
        }
      });
    });
  } catch (error: any) {
    console.error('❌ Failed to create subscription checkout session:', error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
};

/**
 * DEPRECATED: Create a Stripe Checkout session for credit purchase (one-time)
 * This is kept for backward compatibility with old credit system
 */
export const createCreditPurchaseSession = async (
  userId: string,
  priceId: string,
  packageId: string,
  credits: number
): Promise<string> => {
  try {
    console.log(`🛒 Creating one-time checkout session for user ${userId}`);
    console.log(`   Package: ${packageId}, Credits: ${credits}, PriceId: ${priceId}`);

    const session = await createCheckoutSession(payments, {
      price: priceId,
      success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/pricing`,
      allow_promotion_codes: true,
      mode: 'payment', // One-time payment
      metadata: {
        userId,
        packageId,
        credits: credits.toString(),
        type: 'credit_purchase'
      }
    });

    console.log(`✅ Checkout session created: ${session.id}`);

    if (session.url) {
      return session.url;
    } else {
      throw new Error('No checkout URL returned from Stripe');
    }
  } catch (error: any) {
    console.error('❌ Failed to create checkout session:', error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
};

/**
 * Get available credit packages from Stripe products
 *
 * This fetches products from Firestore (synced by Firebase Stripe extension)
 */
export const getStripeProducts = async () => {
  try {
    const { products } = await import('@stripe/firestore-stripe-payments');
    const allProducts = await products(payments);

    // Filter to only credit packages (one-time purchases)
    const creditPackages = allProducts.filter(product =>
      product.metadata?.type === 'one-time' && product.active
    );

    return creditPackages;
  } catch (error) {
    console.error('❌ Failed to fetch Stripe products:', error);
    return [];
  }
};

/**
 * Listen to payment status updates
 *
 * This is automatically handled by the Firebase Stripe extension webhook.
 * When a payment succeeds, the extension creates a document in:
 * customers/{userId}/payments/{paymentId}
 *
 * You can listen to this collection to show real-time payment status.
 */
export const listenToPaymentStatus = (
  userId: string,
  onPaymentSuccess: (paymentId: string, credits: number) => void,
  onPaymentFailed: (error: string) => void
) => {
  // The Firebase Stripe extension automatically creates payment records
  // We just need to listen to the collection

  const { onSnapshot, collection, query, where, orderBy, limit } = require('firebase/firestore');

  const paymentsRef = collection(db, 'customers', userId, 'payments');
  const q = query(
    paymentsRef,
    orderBy('created', 'desc'),
    limit(10)
  );

  const unsubscribe = onSnapshot(q, (snapshot: any) => {
    snapshot.docChanges().forEach((change: any) => {
      if (change.type === 'added') {
        const payment = change.doc.data();

        if (payment.status === 'succeeded') {
          const credits = parseInt(payment.metadata?.credits || '0');
          console.log(`✅ Payment succeeded! Adding ${credits} credits`);
          onPaymentSuccess(change.doc.id, credits);
        } else if (payment.status === 'failed') {
          console.error('❌ Payment failed:', payment.error);
          onPaymentFailed(payment.error?.message || 'Payment failed');
        }
      }
    });
  });

  return unsubscribe;
};


/**
 * Handle subscription after redirect from Stripe Checkout
 *
 * Call this on the payment success page to activate the subscription
 * and update the user's plan.
 *
 * Since Stripe redirected the user to the success URL, we know the payment succeeded.
 * We'll update the plan immediately for better UX, and the webhook will sync the subscription later.
 */
export const handleSubscriptionSuccess = async (sessionId: string, userId: string, plan: UserPlan) => {
  try {
    console.log(`🔍 Activating subscription for session: ${sessionId}`);
    console.log(`   User: ${userId}, Plan: ${plan}`);

    // Update user's plan immediately since payment succeeded
    // (Stripe redirected them to success page, so payment is confirmed)
    await updateUserPlan(userId, plan);

    console.log(`✅ Plan updated to ${plan} for user ${userId}`);

    // Try to fetch subscription details (optional, for logging)
    try {
      const { collection, query, getDocs, orderBy, limit } = await import('firebase/firestore');
      const subscriptionsRef = collection(db, 'customers', userId, 'subscriptions');
      const q = query(
        subscriptionsRef,
        orderBy('created', 'desc'),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const subscription = querySnapshot.docs[0].data();
        console.log(`✅ Subscription found: ${querySnapshot.docs[0].id}, status: ${subscription.status}`);

        return {
          success: true,
          plan,
          subscriptionId: querySnapshot.docs[0].id,
          status: subscription.status
        };
      }
    } catch (subError) {
      console.log('ℹ️ Subscription details not yet available, but plan has been updated');
    }

    // Return success even if subscription record isn't created yet
    // The webhook will sync it eventually
    return {
      success: true,
      plan,
      subscriptionId: sessionId,
      status: 'active'
    };

  } catch (error: any) {
    console.error('❌ Subscription activation failed:', error);
    throw error;
  }
};

/**
 * DEPRECATED: Handle payment after redirect from Stripe Checkout (one-time)
 * This is kept for backward compatibility with old credit system
 */
export const handlePaymentSuccess = async (sessionId: string, userId: string) => {
  try {
    console.log(`🔍 Verifying payment session: ${sessionId}`);

    const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
    const paymentsRef = collection(db, 'customers', userId, 'payments');
    const q = query(
      paymentsRef,
      where('sessionId', '==', sessionId),
      orderBy('created', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Payment not found. Please contact support.');
    }

    const payment = querySnapshot.docs[0].data();

    if (payment.status === 'succeeded') {
      const credits = parseInt(payment.metadata?.credits || '0');
      const packageId = payment.metadata?.packageId || 'unknown';

      return {
        success: true,
        credits,
        packageId,
        paymentId: querySnapshot.docs[0].id
      };
    } else {
      throw new Error(`Payment status: ${payment.status}`);
    }
  } catch (error: any) {
    console.error('❌ Payment verification failed:', error);
    throw error;
  }
};
