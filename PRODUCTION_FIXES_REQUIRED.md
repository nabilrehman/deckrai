# Production Fixes Required for Deckr.ai

## 🔴 CRITICAL BLOCKERS (Must Fix Before Launch)

### 1. Stripe Payment Integration - MISSING ENTIRELY

**Current State:**
- Credit system exists ✅
- Pricing pages exist ✅
- Payment processing: **MISSING** ❌

**Required Implementation:**

#### Step 1: Install Stripe
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
npm install stripe  # For backend (Cloud Functions)
```

#### Step 2: Set up Stripe Environment Variables
Create `.env.production` (already gitignored):
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...  # Server-side only
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Step 3: Create Backend Payment Endpoint

**Option A: Firebase Cloud Functions (Recommended)**

Create `functions/src/index.ts`:
```typescript
import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { addCredits } from './creditService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

// Create checkout session for credit packs
export const createCheckoutSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { packageId, userId } = data;
  const pack = CREDIT_PACKS.find(p => p.id === packageId);

  if (!pack) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid package');
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: pack.name,
          description: `${calculateTotalCredits(pack)} credits for Deckr.ai`
        },
        unit_amount: pack.price * 100  // Convert to cents
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    metadata: {
      userId,
      packageId,
      credits: calculateTotalCredits(pack).toString()
    }
  });

  return { sessionId: session.id };
});

// Webhook to handle successful payments
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed', err);
    return res.status(400).send(`Webhook Error`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { userId, packageId, credits } = session.metadata!;

    // Add credits to user account
    await addCredits(
      userId,
      parseInt(credits),
      `Purchased ${packageId} pack`,
      'purchase',
      {
        packageId,
        invoiceId: session.payment_intent as string
      }
    );

    console.log(`✅ Added ${credits} credits to user ${userId}`);
  }

  res.json({ received: true });
});
```

**Option B: Cloud Run Backend (Alternative)**

If you prefer a dedicated backend, create `backend/src/stripe.ts` with similar logic.

#### Step 4: Update Frontend - CreditPurchasePage.tsx

```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const handlePurchasePack = async (packageId: string) => {
  if (!user) {
    alert('Please sign in to purchase credits');
    return;
  }

  try {
    setIsProcessingPayment(true);

    // Call Cloud Function to create checkout session
    const functions = getFunctions();
    const createCheckout = httpsCallable(functions, 'createCheckoutSession');

    const { data } = await createCheckout({
      packageId,
      userId: user.uid
    });

    // Redirect to Stripe Checkout
    const stripe = await stripePromise;
    await stripe!.redirectToCheckout({
      sessionId: (data as any).sessionId
    });
  } catch (error) {
    console.error('Payment failed:', error);
    alert('Payment failed. Please try again.');
  } finally {
    setIsProcessingPayment(false);
  }
};
```

#### Step 5: Deploy Cloud Functions

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize functions
firebase init functions

# Deploy
firebase deploy --only functions
```

#### Step 6: Configure Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://us-central1-deckr-477706.cloudfunctions.net/stripeWebhook`
3. Select events: `checkout.session.completed`
4. Copy webhook secret to `.env` as `STRIPE_WEBHOOK_SECRET`

#### Step 7: Test in Stripe Test Mode

```bash
# Use test keys first
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Test card numbers
4242 4242 4242 4242  # Success
4000 0000 0000 9995  # Declined
```

---

### 2. Firestore Security Rules - Incomplete

**Problem:** `creditTransactions` collection has NO security rules!

**Current firestore.rules (lines 4-41):**
```javascript
match /users/{userId} { ... }
match /decks/{deckId} { ... }
// ❌ Missing: creditTransactions protection
// ❌ Missing: Organization subcollections
```

**Add this to firestore.rules:**
```javascript
// Credit transaction logs - users can read their own
match /creditTransactions/{transactionId} {
  allow read: if isSignedIn() && resource.data.userId == request.auth.uid;
  allow write: if false; // Only backend can write
}

// User chats subcollection
match /users/{userId}/chats/{chatId} {
  allow read: if isOwner(userId);
  allow write: if isOwner(userId);

  match /messages/{messageId} {
    allow read: if isOwner(userId);
    allow write: if isOwner(userId);
  }
}
```

**Deploy:**
```bash
firebase deploy --only firestore:rules
```

---

### 3. Storage Security Rules - Overly Permissive

**Problem (storage.rules:18):**
```javascript
allow read: if isSignedIn();  // ❌ ANY user can read ANY deck!
```

**This means:**
- User A creates a deck
- User B (any authenticated user) can view User A's private deck images

**Fix:**
```javascript
// Only allow reading if:
// 1. You own it
// 2. Deck is explicitly shared (check Firestore)
match /decks/{userId}/{deckId}/{allPaths=**} {
  allow read: if isOwner(userId) || isSharedDeck(deckId);
  allow write: if isOwner(userId);
  allow delete: if isOwner(userId);
}

// Helper function (add at top)
function isSharedDeck(deckId) {
  // Check if deck exists in Firestore and has sharing enabled
  return firestore.get(/databases/(default)/documents/decks/$(deckId)).data.isPublic == true;
}
```

---

### 4. API Key Exposure Risk

**Problem:** `VITE_GEMINI_API_KEY` is bundled into client-side JavaScript

**Current State:**
```typescript
// services/geminiService.ts:6
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY  // ← EXPOSED IN BUNDLE
});
```

**Risk:**
- Anyone can inspect your JS bundle and extract the API key
- Malicious users can make unlimited API calls on your dime
- No rate limiting or user authentication

**Fix: Move to Cloud Functions**

```typescript
// functions/src/gemini.ts
import * as functions from 'firebase-functions';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY  // Server-side only
});

export const generateSlide = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Check user credits first
  const credits = await checkCreditAvailability(context.auth.uid, 1);
  if (!credits.hasEnough) {
    throw new functions.https.HttpsError('failed-precondition', 'Insufficient credits');
  }

  // Generate slide
  const result = await ai.generateContent(data.prompt);

  // Deduct credit
  await consumeCredits(context.auth.uid, 1, 'Generated slide');

  return { image: result.image };
});
```

**Migration Steps:**
1. Move all Gemini calls to Cloud Functions
2. Update frontend to call functions instead of direct API
3. Remove `VITE_GEMINI_API_KEY` from client env vars
4. Keep key in Cloud Functions config only

---

## 🟡 HIGH PRIORITY (Fix Before Scale)

### 5. No Error Tracking / Monitoring

**Problem:** Console.log everywhere, no real monitoring

**What happens when things break in production?**
- You won't know
- Users will leave silently
- No way to debug

**Solution: Add Sentry**

```bash
npm install @sentry/react @sentry/vite-plugin
```

```typescript
// App.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});
```

---

### 6. No Rate Limiting

**Problem:** No protection against abuse

**Scenarios:**
- User creates 10,000 slides in a loop
- Malicious actor drains your Gemini API quota
- DDoS via Firebase functions

**Solution:**

```typescript
// services/rateLimiter.ts
export const checkRateLimit = async (userId: string): Promise<boolean> => {
  const key = `ratelimit:${userId}:${Date.now() / 60000 | 0}`; // Per minute
  const count = await redis.incr(key);
  await redis.expire(key, 60);

  return count <= 10; // Max 10 slides per minute
};
```

Or use Firebase App Check for free DDoS protection:
```bash
firebase appcheck:enable
```

---

### 7. Missing Credit Validation Before Generation

**Problem (ChatLandingView.tsx):**
```typescript
// Line ~300 - Generates slides WITHOUT checking credits first
const slides = await geminiService.generateDeck(prompt);
// Then later checks credits and fails
```

**Risk:**
- User generates 10 slides
- Credit check happens after (races with generation)
- User gets free slides if timing is right

**Fix:**
```typescript
// ALWAYS check credits BEFORE work
const creditCheck = await checkCreditAvailability(user.uid, slideCount);
if (!creditCheck.hasEnough) {
  setShowOutOfCreditsModal(true);
  return;
}

// Lock credits (optimistic lock)
const reservationId = await reserveCredits(user.uid, slideCount);

try {
  const slides = await geminiService.generateDeck(prompt);
  await confirmCreditReservation(reservationId); // Commit
} catch (error) {
  await releaseCreditReservation(reservationId); // Rollback
  throw error;
}
```

---

### 8. Missing Subscription Management

**Problem:** You have subscription plans defined, but no:
- ❌ Recurring billing
- ❌ Subscription cancellation
- ❌ Plan upgrades/downgrades
- ❌ Monthly credit renewal
- ❌ Rollover credit logic

**What you need:**

```typescript
// functions/src/subscriptions.ts
export const handleSubscriptionRenewal = functions.pubsub
  .schedule('0 0 1 * *') // First of each month
  .onRun(async () => {
    const users = await getActiveSubscribers();

    for (const user of users) {
      const plan = getPlanById(user.plan);

      // Add monthly credits
      await addCredits(
        user.uid,
        plan.monthlyCredits,
        'Monthly subscription renewal',
        'subscription_renewal'
      );

      // Handle rollover
      if (plan.limits.rolloverCredits) {
        await handleRollover(user.uid, plan.limits.rolloverCredits);
      }
    }
  });
```

---

## 🟢 RECOMMENDED (Quality of Life)

### 9. Add Health Check Endpoint

```typescript
// For monitoring uptime
export const healthCheck = functions.https.onRequest((req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    version: process.env.APP_VERSION
  });
});
```

### 10. Add User Feedback Collection

```typescript
// Track when users hit errors
await Sentry.captureMessage('User ran out of credits', {
  level: 'info',
  user: { id: user.uid },
  extra: { creditsNeeded: 5, creditsAvailable: 0 }
});
```

---

## 📋 Pre-Launch Checklist

### Payment System
- [ ] Set up Stripe account
- [ ] Create test products/prices
- [ ] Implement checkout flow
- [ ] Test webhook handling
- [ ] Implement subscription management
- [ ] Test refunds/cancellations
- [ ] Switch to live keys

### Security
- [ ] Fix Firestore rules (add creditTransactions protection)
- [ ] Fix Storage rules (prevent unauthorized deck access)
- [ ] Move Gemini API key to Cloud Functions
- [ ] Enable Firebase App Check
- [ ] Add rate limiting
- [ ] Audit all API endpoints for auth checks

### Monitoring
- [ ] Set up Sentry error tracking
- [ ] Add performance monitoring
- [ ] Set up alerting (Slack/email)
- [ ] Create health check endpoint
- [ ] Set up uptime monitoring (e.g., UptimeRobot)

### Business Logic
- [ ] Fix credit check race condition
- [ ] Implement credit reservation/rollback
- [ ] Add subscription renewal cron job
- [ ] Implement rollover credit logic
- [ ] Add usage analytics

### Testing
- [ ] Test payment flow end-to-end
- [ ] Test webhook error handling
- [ ] Load test (1000 concurrent users)
- [ ] Security audit (try to bypass payment)
- [ ] Test credit edge cases (concurrent usage)

### Legal/Compliance
- [ ] Add Terms of Service
- [ ] Add Privacy Policy
- [ ] Add Refund Policy
- [ ] GDPR compliance (if EU users)
- [ ] PCI compliance (Stripe handles this)

---

## 💰 Estimated Costs at Launch

**Current Setup:**
- Gemini API: ~$0.07/slide
- Firebase Storage: $0.026/GB
- Firestore: $0.18/100K reads
- Cloud Functions: $0.40/million invocations

**Projected Costs (100 users, 50 slides/user/month):**
- Gemini: 5,000 slides × $0.07 = **$350/month**
- Firebase: ~**$20/month**
- Stripe fees: 2.9% + $0.30 per transaction
- **Total: ~$400-500/month** (before revenue)

**Break-even:** ~$1,500 revenue/month (with current margins)

---

## 🚀 Deployment Order

1. **Week 1: Payment Integration**
   - Set up Stripe
   - Implement checkout
   - Test thoroughly

2. **Week 2: Security Hardening**
   - Fix Firestore/Storage rules
   - Move API keys server-side
   - Add rate limiting

3. **Week 3: Monitoring & Polish**
   - Set up Sentry
   - Add analytics
   - Load testing

4. **Week 4: Soft Launch**
   - Beta test with 10-20 users
   - Monitor for issues
   - Iterate

5. **Week 5: Public Launch**
   - Marketing push
   - Monitor closely
   - Scale as needed

---

## ⚠️ Don't Launch Without

1. **Stripe integration** - You can't make money
2. **Security rules** - Users can steal data
3. **Error tracking** - You'll be flying blind
4. **Rate limiting** - You'll get abused

Everything else can be fixed post-launch, but these 4 are critical.

---

## Need Help?

**Stripe Setup:**
- Docs: https://stripe.com/docs/payments/checkout
- Firebase Integration: https://github.com/stripe/stripe-firebase-extensions

**Security:**
- Firestore Rules: https://firebase.google.com/docs/firestore/security/get-started
- App Check: https://firebase.google.com/docs/app-check

**Monitoring:**
- Sentry: https://docs.sentry.io/platforms/javascript/guides/react/
- Firebase Performance: https://firebase.google.com/docs/perf-mon

Let me know which area you want to tackle first!
