# 🚀 Deckr.ai Stripe Integration - Setup Checklist

## What We Just Built ✅

- ✅ **Stripe payment integration** using Firebase Stripe extension
- ✅ **Credit purchase page** with real Stripe checkout
- ✅ **Usage dashboard** (like Claude's settings page)
- ✅ **Payment success page** with confetti celebration
- ✅ **Firestore security rules** for payments
- ✅ **Real-time credit tracking** with webhooks

---

## 📋 What YOU Need to Do Now

### Step 1: Install Firebase Stripe Extension (15 mins)

1. **Go to Firebase Console:**
   ```
   https://console.firebase.google.com/project/deckr-477706/extensions
   ```

2. **Click "Install Extension"**

3. **Search for "Run Payments with Stripe"** (official by Firebase)

4. **Click "Install in console"**

5. **You'll need a Stripe account:**
   - Go to https://stripe.com/register
   - Sign up (takes 2 minutes)
   - Verify your email

6. **Get your Stripe API keys:**
   - Go to: https://dashboard.stripe.com/apikeys
   - Copy your **Secret key** (starts with `sk_test_...`)
   - Copy your **Publishable key** (starts with `pk_test_...`)

7. **Configure the extension:**
   ```
   Stripe API Secret Key: sk_test_YOUR_KEY_HERE
   Products collection: products
   Customer details collection: customers
   Sync new users: Yes
   Automatically delete data: Yes
   Deploy location: us-central1
   ```

8. **Click "Install Extension"** (takes 2-3 minutes to deploy)

---

### Step 2: Add Stripe Publishable Key to Your App (2 mins)

1. **Create `.env.local` file** (already in .gitignore):
   ```bash
   cd /Users/nabilrehman/Downloads/deckr.ai-fina
   touch .env.local
   ```

2. **Add your Stripe publishable key:**
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   VITE_GEMINI_API_KEY=your_existing_gemini_key
   ```

3. **Restart your dev server:**
   ```bash
   npm run dev
   ```

---

### Step 3: Create Products in Stripe (10 mins)

You need to create 4 products in Stripe that match your pricing:

1. **Go to Stripe Dashboard:**
   ```
   https://dashboard.stripe.com/products
   ```

2. **Click "Add product"** and create these:

#### Product 1: Starter Pack
```
Name: Deckr.ai - Starter Pack (25 Credits)
Description: 25 credits for creating slides
Pricing model: One-time
Price: $10.00 USD
```

**Add metadata** (click "Add metadata" under the price):
```
credits: 25
packageId: starter
type: one-time
```

**Copy the Price ID** (starts with `price_...`) - you'll need this!

#### Product 2: Pro Pack (Most Popular)
```
Name: Deckr.ai - Pro Pack (110 Credits)
Description: 100 credits + 10 bonus = 110 total credits
Pricing model: One-time
Price: $30.00 USD

Metadata:
credits: 110
packageId: pro
type: one-time
bonus: 10
```

Copy the Price ID!

#### Product 3: Business Pack
```
Name: Deckr.ai - Business Pack (350 Credits)
Description: 300 credits + 50 bonus = 350 total credits
Pricing model: One-time
Price: $75.00 USD

Metadata:
credits: 350
packageId: business
type: one-time
bonus: 50
```

Copy the Price ID!

#### Product 4: Enterprise Pack
```
Name: Deckr.ai - Enterprise Pack (1200 Credits)
Description: 1000 credits + 200 bonus = 1200 total credits
Pricing model: One-time
Price: $200.00 USD

Metadata:
credits: 1200
packageId: enterprise
type: one-time
bonus: 200
```

Copy the Price ID!

---

### Step 4: Update Your Pricing Config with Price IDs (5 mins)

1. **Open `config/pricing.ts`**

2. **Add a new field `stripePriceId` to each credit pack:**

```typescript
export const CREDIT_PACKS: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 25,
    price: 10,
    pricePerCredit: 0.40,
    stripePriceId: 'price_PASTE_YOUR_STARTER_PRICE_ID_HERE', // ← ADD THIS
    bestFor: 'Individual users & testing',
    neverExpires: true
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 100,
    price: 30,
    pricePerCredit: 0.30,
    stripePriceId: 'price_PASTE_YOUR_PRO_PRICE_ID_HERE', // ← ADD THIS
    bonus: 10,
    popular: true,
    bestFor: 'Small teams & startups',
    neverExpires: true
  },
  // ... repeat for business and enterprise
];
```

3. **Update the type definition in `types.ts`:**

```typescript
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  pricePerCredit: number;
  stripePriceId?: string; // ← ADD THIS LINE
  bonus?: number;
  popular?: boolean;
  bestFor?: string;
  neverExpires: boolean;
}
```

4. **Update the Stripe service to use real price IDs** in `services/stripeService.ts`:

Find this line (around line 236):
```typescript
const priceId = `price_${pack.id}`; // This will be replaced with real Stripe price ID
```

Replace with:
```typescript
const priceId = pack.stripePriceId || `price_${pack.id}`;

if (!pack.stripePriceId) {
  throw new Error(`Stripe price ID not configured for ${pack.name}`);
}
```

---

### Step 5: Configure Webhook (5 mins)

1. **Get your webhook URL** (after extension installs):
   ```
   https://us-central1-deckr-477706.cloudfunctions.net/ext-firestore-stripe-payments-handleWebhookEvents
   ```

2. **Go to Stripe Dashboard → Webhooks:**
   ```
   https://dashboard.stripe.com/webhooks
   ```

3. **Click "Add endpoint"**

4. **Enter your webhook URL** (from step 1)

5. **Select events to listen to:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

6. **Click "Add endpoint"**

7. **Copy the webhook signing secret** (starts with `whsec_...`)

8. **Update Firebase extension config:**
   - Go to Firebase Console → Extensions
   - Find "Run Payments with Stripe"
   - Click "Manage"
   - Add the webhook secret

---

### Step 6: Deploy Firestore Rules (2 mins)

```bash
cd /Users/nabilrehman/Downloads/deckr.ai-fina
firebase deploy --only firestore:rules
```

If you don't have Firebase CLI:
```bash
npm install -g firebase-tools
firebase login
```

---

### Step 7: Test the Integration (10 mins)

1. **Start your app:**
   ```bash
   npm run dev
   ```

2. **Sign in to your app**

3. **Go to pricing page** (click "Get More Credits" from header)

4. **Click "Purchase" on Starter Pack**

5. **You should be redirected to Stripe checkout page**

6. **Use test card:**
   ```
   Card number: 4242 4242 4242 4242
   Expiry: 12/34 (any future date)
   CVC: 123
   ZIP: 12345
   ```

7. **Complete payment**

8. **You should be redirected back with confetti! 🎉**

9. **Check your Firestore:**
   - `customers/{userId}/payments/{paymentId}` should exist
   - `users/{userId}` should have updated credits

10. **Check your credits in the app** (should show +25)

---

## 🐛 Troubleshooting

### "Extension not found" error
**Fix:** Make sure the Firebase Stripe extension is fully installed (takes 2-3 mins)

### "Invalid API key" error
**Fix:** Double-check your `.env.local` has the correct `VITE_STRIPE_PUBLISHABLE_KEY`

### Products not showing in checkout
**Fix:**
1. Make sure you created products in Stripe
2. Check that metadata includes `packageId` and `credits`
3. Wait 1-2 minutes for Firestore sync

### Credits not added after payment
**Fix:**
1. Check Firestore: `customers/{userId}/payments/{paymentId}`
2. Check webhook is configured correctly
3. Check Firebase Functions logs: `firebase functions:log`

### "Insufficient credits" error
**Fix:** The webhook hasn't processed yet. Wait 5-10 seconds and refresh.

---

## 🎯 What Happens When User Purchases?

### User Flow:
1. User clicks "Purchase" on your site
2. → Redirects to Stripe checkout page (checkout.stripe.com)
3. → User enters card info on Stripe
4. → Stripe processes payment
5. → Webhook fires to Firebase
6. → Firebase extension creates payment record
7. → Your code adds credits to user
8. → User redirected back with success message
9. → Confetti! 🎉

### Technical Flow:
```
User clicks Purchase
    ↓
createCreditPurchaseSession()
    ↓
Firebase Stripe Extension creates checkout session
    ↓
User redirected to Stripe (checkout.stripe.com)
    ↓
User pays with card
    ↓
Stripe webhook → Firebase Function
    ↓
Firebase extension creates:
  - customers/{userId}/payments/{paymentId}
    ↓
PaymentSuccessPage.tsx listens to payments collection
    ↓
Calls handlePaymentSuccess()
    ↓
Calls addCredits() from creditService.ts
    ↓
Updates users/{userId}/credits
    ↓
Creates creditTransactions/{id}
    ↓
useCredits hook updates in real-time
    ↓
🎉 User sees new credit balance!
```

---

## 📊 Accessing New Pages

### Usage Dashboard:
- **URL:** Add a button in your Header component
- **Code:**
  ```typescript
  <button onClick={() => setCurrentView('usage')}>
    Usage
  </button>
  ```

### Pricing Page:
- Already accessible from Header "Get More Credits" button
- Or programmatically: `setCurrentView('pricing')`

### Payment Success:
- Automatically shown when URL has `?session_id=...`
- User is redirected here after successful Stripe payment

---

## 🔒 Security Notes

✅ **Card data never touches your servers** - Stripe handles everything
✅ **Firestore rules protect user data** - Users can only see their own payments
✅ **Webhook signature verification** - Prevents fake payment notifications
✅ **Credit transactions are write-protected** - Only backend can create them

---

## 💰 Pricing & Costs

### Stripe Fees (per transaction):
- 2.9% + $0.30 per successful charge
- Example: $10 purchase = $0.59 fee (you keep $9.41)

### Firebase Costs (very low):
- Firestore: ~$0.01 per 1000 reads
- Cloud Functions: ~$0.40 per million invocations
- Estimated: <$5/month for 100 transactions

### Your Revenue:
```
Starter Pack ($10):
  Stripe fee: -$0.59
  Your cut: $9.41
  Gemini cost (25 slides × $0.07): -$1.75
  Profit: $7.66 (77% margin)

Pro Pack ($30):
  Stripe fee: -$1.17
  Your cut: $28.83
  Gemini cost (110 slides × $0.07): -$7.70
  Profit: $21.13 (70% margin)
```

---

## 🚀 Going Live (When Ready)

### 1. Switch to Live Mode in Stripe
   - Get live API keys (starts with `pk_live_` and `sk_live_`)
   - Update `.env.production`:
     ```
     VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
     ```
   - Update Firebase extension config with `sk_live_...`

### 2. Recreate Products in Live Mode
   - Stripe test mode and live mode are separate
   - Recreate all 4 products in live mode
   - Update price IDs in `config/pricing.ts`

### 3. Update Webhook for Live Mode
   - Add webhook URL in live mode
   - Update webhook secret in extension

### 4. Test with Real Card ($1 test)
   - Use a real card
   - Purchase Starter Pack
   - Verify credits are added
   - Request refund if needed

### 5. Deploy to Production
   ```bash
   npm run build
   gcloud run deploy deckr-app --source . --region us-central1 --allow-unauthenticated
   ```

---

## ✅ Final Checklist

Before launching to users:

- [ ] Firebase Stripe extension installed
- [ ] Stripe account verified
- [ ] 4 products created in Stripe
- [ ] Price IDs added to `config/pricing.ts`
- [ ] `.env.local` has Stripe publishable key
- [ ] Webhook configured and tested
- [ ] Firestore rules deployed
- [ ] Test purchase successful (test mode)
- [ ] Credits added correctly
- [ ] Payment success page shows confetti
- [ ] Usage page displays correctly
- [ ] All security rules working

---

## 📚 Documentation Links

- **Full Stripe Setup Guide:** `STRIPE_SETUP_GUIDE.md`
- **Firebase Stripe Extension:** https://extensions.dev/extensions/stripe/firestore-stripe-payments
- **Stripe Testing:** https://stripe.com/docs/testing
- **Production Issues:** `PRODUCTION_FIXES_REQUIRED.md`

---

## 🆘 Need Help?

1. **Stripe Issues:** https://support.stripe.com
2. **Firebase Issues:** https://firebase.google.com/support
3. **Extension Issues:** https://github.com/stripe/stripe-firebase-extensions/issues

---

**Estimated Total Setup Time:** 45-60 minutes

**Once set up, everything runs automatically!** 🎉
