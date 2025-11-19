import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStripePayments, createCheckoutSession } from '@stripe/firestore-stripe-payments';
import { db } from '../config/firebase';
import { addCredits } from './creditService';

// Initialize Stripe Payments
const payments = getStripePayments(db, {
  productsCollection: 'products',
  customersCollection: 'customers'
});

/**
 * Create a Stripe Checkout session for credit purchase
 *
 * This uses the Firebase Stripe extension to create a checkout session.
 * The user will be redirected to Stripe's hosted checkout page.
 */
export const createCreditPurchaseSession = async (
  userId: string,
  priceId: string,
  packageId: string,
  credits: number
): Promise<string> => {
  try {
    console.log(`🛒 Creating checkout session for user ${userId}`);
    console.log(`   Package: ${packageId}, Credits: ${credits}, PriceId: ${priceId}`);

    const session = await createCheckoutSession(payments, {
      price: priceId,
      success_url: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${window.location.origin}/pricing`,
      allow_promotion_codes: true, // Let users apply coupon codes
      metadata: {
        userId,
        packageId,
        credits: credits.toString(),
        type: 'credit_purchase'
      }
    });

    console.log(`✅ Checkout session created: ${session.id}`);

    // Return the checkout session URL
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
 * Process completed payment (called by webhook or client)
 *
 * Note: The Firebase Stripe extension webhook automatically handles this,
 * but this function can be used for additional processing if needed.
 */
export const processCompletedPayment = async (
  userId: string,
  paymentId: string,
  credits: number,
  packageId: string
): Promise<void> => {
  try {
    // Add credits to user account
    const result = await addCredits(
      userId,
      credits,
      `Purchased ${packageId} package`,
      'purchase',
      {
        packageId,
        invoiceId: paymentId
      }
    );

    if (result.success) {
      console.log(`✅ Credits added successfully. New balance: ${result.newBalance}`);
    } else {
      throw new Error(result.error || 'Failed to add credits');
    }
  } catch (error: any) {
    console.error('❌ Failed to process payment:', error);
    throw error;
  }
};

/**
 * Handle payment after redirect from Stripe Checkout
 *
 * Call this on the payment success page to verify the payment
 * and add credits to the user's account.
 */
export const handlePaymentSuccess = async (sessionId: string, userId: string) => {
  try {
    console.log(`🔍 Verifying payment session: ${sessionId}`);

    // The Firebase Stripe extension automatically creates the payment record
    // We just need to wait for it and verify
    const { doc, getDoc } = await import('firebase/firestore');

    // Find the payment by checking recent payments
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

      // Process the payment (add credits)
      await processCompletedPayment(userId, querySnapshot.docs[0].id, credits, packageId);

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
