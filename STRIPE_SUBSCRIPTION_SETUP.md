# 🚀 Stripe Subscription Setup Guide

## What You Have vs. What You Need

### ✅ What You Already Have (Old System)
```
One-time credit purchases:
- Starter: $10 (price_1SU18i3ZT6RXP9jPPS1gqQML)
- Pro: $30 (price_1SU1B43ZT6RXP9jPBUNtZT9I)
- Business: $70 (price_1SU1BS3ZT6RXP9jPj6oNdvEe)
- Enterprise: $200 (price_1SU1Bl3ZT6RXP9jPtngLiM32)
```

### 🆕 What You Need (New System)
```
Recurring monthly subscriptions:
- Starter: $19/month (NEED TO CREATE)
- Business: $99/month (NEED TO CREATE)
```

---

## Step 1: Create Subscription Products in Stripe (10 min)

### 1.1 Go to Stripe Dashboard
```
https://dashboard.stripe.com/test/products
```

### 1.2 Create "Starter Plan" Product

1. Click **"+ Add product"**
2. Fill in:
   ```
   Product name: Starter Plan
   Description: 75 slides per month, Advanced AI models, No watermarks

   Pricing model: Standard pricing
   Price: $19.00
   Billing period: Monthly (recurring every 1 month)
   ```
3. Click **"Add product"**
4. **COPY THE PRICE ID** (looks like `price_xxxxxxxxxxxxx`)

### 1.3 Create "Business Plan" Product

1. Click **"+ Add product"** again
2. Fill in:
   ```
   Product name: Business Plan
   Description: 250 slides per month, Style Library, Brand Adherence, Priority support

   Pricing model: Standard pricing
   Price: $99.00
   Billing period: Monthly (recurring every 1 month)
   ```
3. Click **"Add product"**
4. **COPY THE PRICE ID**

---

## Step 2: Update Your Code with Price IDs (2 min)

### 2.1 Open `config/subscriptionPlans.ts`

### 2.2 Find these lines and UPDATE them:

```typescript
starter: {
  id: 'starter',
  name: 'Starter',
  displayName: 'Starter',
  price: 19,
  yearlyPrice: 190,
  slidesPerMonth: 75,
  decksPerMonth: 15,
  description: 'Perfect for individuals and small projects',
  cta: 'Start with Starter',
  features: { ... },

  // 👇 UPDATE THESE TWO LINES
  stripePriceId: 'price_YOUR_STARTER_PRICE_ID_HERE',  // ⬅️ PASTE YOUR PRICE ID
  stripeYearlyPriceId: undefined,  // Optional: Create yearly product later
},

business: {
  id: 'business',
  name: 'Business',
  displayName: 'Business',
  price: 99,
  yearlyPrice: 990,
  slidesPerMonth: 250,
  decksPerMonth: 50,
  description: 'For teams and professional use',
  popular: true,
  cta: 'Go Business',
  features: { ... },

  // 👇 UPDATE THESE TWO LINES
  stripePriceId: 'price_YOUR_BUSINESS_PRICE_ID_HERE',  // ⬅️ PASTE YOUR PRICE ID
  stripeYearlyPriceId: undefined,  // Optional: Create yearly product later
},
```

### 2.3 Example (with fake Price IDs):
```typescript
stripePriceId: 'price_1AbCdEfGh123456789',  // Starter monthly
stripePriceId: 'price_1XyZaBcDe987654321',  // Business monthly
```

---

## Step 3: Wire Up Pricing Page (5 min)

### 3.1 Update `components/PricingPage.tsx`

The component already has the `onSelectPlan` prop. Just add this handler to your parent component:

```typescript
import { createSubscriptionCheckoutSession } from '../services/stripeService';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans';
import { useAuth } from '../contexts/AuthContext';

const handleSelectPlan = async (planId: 'starter' | 'business' | 'enterprise') => {
  if (!user) {
    // Show login modal
    setShowAuthModal(true);
    return;
  }

  if (planId === 'enterprise') {
    // Enterprise users should contact sales
    window.location.href = 'mailto:sales@deckr.ai?subject=Enterprise Plan Inquiry';
    return;
  }

  try {
    const plan = SUBSCRIPTION_PLANS[planId];

    if (!plan.stripePriceId) {
      alert('This plan is not available yet. Please try again later.');
      return;
    }

    // Create Stripe checkout session
    const checkoutUrl = await createSubscriptionCheckoutSession(
      user.uid,
      plan.stripePriceId,
      planId
    );

    // Redirect to Stripe checkout
    window.location.href = checkoutUrl;
  } catch (error: any) {
    console.error('Failed to start checkout:', error);
    alert(`Failed to start checkout: ${error.message}`);
  }
};

// Pass to PricingPage
<PricingPage
  onClose={() => setShowPricing(false)}
  onSelectPlan={handleSelectPlan}  // ⬅️ ADD THIS
/>
```

---

## Step 4: Update Payment Success Page (5 min)

### 4.1 Update `components/PaymentSuccessPage.tsx`

Add subscription handling:

```typescript
import { handleSubscriptionSuccess } from '../services/stripeService';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';

const PaymentSuccessPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [plan, setPlan] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      if (!user) return;

      const sessionId = searchParams.get('session_id');
      const planId = searchParams.get('plan');

      if (!sessionId || !planId) {
        setStatus('error');
        return;
      }

      try {
        // Handle subscription payment
        const result = await handleSubscriptionSuccess(
          sessionId,
          user.uid,
          planId as UserPlan
        );

        if (result.success) {
          setPlan(result.plan);
          setStatus('success');
        }
      } catch (error: any) {
        console.error('Payment verification failed:', error);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [user, searchParams]);

  if (status === 'loading') {
    return <div>Verifying your subscription...</div>;
  }

  if (status === 'success') {
    return (
      <div>
        <h1>🎉 Welcome to {plan}!</h1>
        <p>Your subscription is now active!</p>
      </div>
    );
  }

  return <div>❌ Payment verification failed</div>;
};
```

---

## Step 5: Test the Flow (10 min)

### 5.1 Start Dev Server
```bash
npm run dev
```

### 5.2 Test Checkout Flow

1. Sign in to your app
2. Click "Upgrade" or go to Pricing page
3. Click "Start Free Trial" on Starter plan
4. You should be redirected to Stripe Checkout
5. Use test card:
   ```
   Card: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   ZIP: 12345
   ```
6. Complete payment
7. You should be redirected back with success message
8. Check Firestore: `customers/{userId}/subscriptions` should have a new document
9. User's plan should be updated to "starter"

### 5.3 Verify in Firestore

Check that your user document shows:
```javascript
{
  plan: 'starter',  // Updated!
  subscription: {
    status: 'active',
    stripeSubscriptionId: 'sub_xxxxxxxxxxxxx'
  }
}
```

---

## Step 6: Webhook Events (Already Configured)

If you already have the Firebase Stripe Extension installed, it should handle these events automatically:

✅ Required webhook events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

**Verify:** Go to https://dashboard.stripe.com/test/webhooks and check your endpoint is listening to these events.

---

## 🧪 Testing Scenarios

### Test 1: New Subscription
```
1. User on Trial plan
2. Clicks "Upgrade to Starter"
3. Completes Stripe checkout
4. User plan updates to "starter"
5. Usage limit increases to 75 slides
```

### Test 2: Upgrade
```
1. User on Starter plan ($19/mo)
2. Clicks "Upgrade to Business"
3. Completes checkout
4. User plan updates to "business"
5. Unlocks Style Library ⭐
6. Unlocks Brand Adherence ⭐
7. Limit increases to 250 slides
```

### Test 3: Failed Payment
```
1. Use declining test card: 4000 0000 0000 0002
2. Payment should fail
3. User plan should NOT change
4. Show error message
```

---

## 📊 Your Updated Pricing Structure

| Plan | Price | Slides | Stripe Type | Price ID |
|------|-------|--------|-------------|----------|
| Trial | Free | 20 | N/A (14 days) | - |
| Starter | $19/mo | 75 | Recurring subscription | `price_xxxxx` ⬅️ ADD |
| Business | $99/mo | 250 | Recurring subscription | `price_xxxxx` ⬅️ ADD |
| Enterprise | Custom | Unlimited | Contact Sales | - |

---

## 🔐 Security Checklist

- [x] `.env.local` has `VITE_STRIPE_PUBLISHABLE_KEY`
- [x] Firebase Stripe Extension installed
- [x] Webhook configured
- [x] Firestore rules deployed
- [ ] Test subscription flow works
- [ ] Verify plan updates in Firestore
- [ ] Test with declining card (error handling)

---

## 🆘 Troubleshooting

### "No checkout URL returned"
**Fix:** Verify Price ID is correct in `config/subscriptionPlans.ts`

### "Subscription not found"
**Fix:**
1. Check Firebase Stripe Extension is installed
2. Verify webhook is configured
3. Wait 30 seconds after payment for webhook to fire

### Plan not updating after payment
**Fix:**
1. Check Firebase Functions logs
2. Verify `handleSubscriptionSuccess` is called
3. Check Firestore permissions

### Old credit products showing
**Fix:**
- Products are separate in Stripe
- Your old credit products still exist (that's fine!)
- Make sure you're calling `createSubscriptionCheckoutSession` (new)
- Not `createCreditPurchaseSession` (old)

---

## ✅ Quick Checklist

1. [ ] Created Starter subscription product in Stripe ($19/mo)
2. [ ] Created Business subscription product in Stripe ($99/mo)
3. [ ] Copied both Price IDs
4. [ ] Updated `config/subscriptionPlans.ts` with Price IDs
5. [ ] Added `onSelectPlan` handler to PricingPage
6. [ ] Updated PaymentSuccessPage for subscriptions
7. [ ] Tested checkout flow with test card
8. [ ] Verified plan updates in Firestore
9. [ ] Tested error handling with declining card

---

## 🎉 Once Complete

You'll have a fully functional subscription system:
- ✅ 14-day free trial for all new users
- ✅ $19/mo Starter plan (75 slides)
- ✅ $99/mo Business plan (250 slides + premium features)
- ✅ Stripe handles all recurring billing
- ✅ Firebase Extension manages subscriptions
- ✅ Automatic plan updates
- ✅ Webhook handling

**Ready to accept subscriptions!** 🚀
