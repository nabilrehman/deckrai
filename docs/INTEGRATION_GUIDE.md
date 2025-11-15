# Credit System Integration Guide

## 🎉 What's Been Built

### **Phase 1: Backend ✅ COMPLETE**
- ✅ Credit types and interfaces (`types.ts`)
- ✅ Pricing configuration (`config/pricing.ts`)
- ✅ Credit service (`services/creditService.ts`)
- ✅ Firestore integration (`services/firestoreService.ts`)
- ✅ Database indexes (`firestore.indexes.json`)
- ✅ Comprehensive tests (`tests/credit-system-test.ts`)

### **Phase 2: Frontend ✅ COMPLETE**
- ✅ `useCredits` hook - Real-time credit balance tracking
- ✅ `CreditBadge` - Header display component
- ✅ `OutOfCreditsModal` - Purchase prompt
- ✅ `LowCreditsWarning` - Low balance banner
- ✅ `CreditPurchasePage` - Full pricing page

---

## 🚀 Quick Integration (5 Steps)

### **Step 1: Add CreditBadge to Header**

Update `components/Header.tsx`:

```tsx
import CreditBadge from './CreditBadge';
import { useState } from 'react';
import OutOfCreditsModal from './OutOfCreditsModal';

const Header: React.FC<HeaderProps> = ({ ... }) => {
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const handlePurchase = (packageId: string) => {
    console.log('Purchase package:', packageId);
    // TODO: Implement Stripe checkout
    setShowPurchaseModal(false);
  };

  return (
    <header className="...">
      {/* Existing header content */}

      {/* Add Credit Badge */}
      {user && (
        <CreditBadge
          onBuyCredits={() => setShowPurchaseModal(true)}
          className="ml-4"
        />
      )}

      {/* Purchase Modal */}
      <OutOfCreditsModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={handlePurchase}
      />
    </header>
  );
};
```

### **Step 2: Add Low Credits Warning to Chat Interface**

Update `components/ChatInterface.tsx` or your main slide creation page:

```tsx
import LowCreditsWarning from './LowCreditsWarning';
import { useCredits } from '../hooks/useCredits';
import { useState } from 'react';
import OutOfCreditsModal from './OutOfCreditsModal';

const ChatInterface: React.FC = ({ ... }) => {
  const { credits, isLowOnCredits } = useCredits();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  return (
    <div className="chat-container">
      {/* Low Credits Warning Banner */}
      {isLowOnCredits() && (
        <LowCreditsWarning
          onBuyCredits={() => setShowPurchaseModal(true)}
        />
      )}

      {/* Rest of chat interface */}
      {/* ... */}

      <OutOfCreditsModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={(packageId) => {
          // Handle purchase
        }}
      />
    </div>
  );
};
```

### **Step 3: Add Credit Check to Slide Creation**

Update your slide creation function (e.g., in `DesignerModeGenerator.tsx`):

```tsx
import { useCredits } from '../hooks/useCredits';
import { consumeCredits, checkCreditAvailability } from '../services/creditService';
import { useState } from 'react';
import OutOfCreditsModal from './OutOfCreditsModal';

const DesignerModeGenerator: React.FC = ({ ... }) => {
  const { user } = useAuth();
  const { credits, hasEnoughCredits } = useCredits();
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);

  const handleCreateSlide = async (prompt: string) => {
    if (!user) {
      // Redirect to login
      return;
    }

    // ✅ PRE-FLIGHT CHECK: Check if user has enough credits
    if (!hasEnoughCredits(1)) {
      setShowOutOfCreditsModal(true);
      return;
    }

    try {
      // ✅ STEP 1: Create the slide
      const slide = await createSlideFromPrompt(prompt);

      // ✅ STEP 2: Consume credit
      const result = await consumeCredits(
        user.uid,
        1,
        `Created slide "${slide.name}"`,
        {
          slideId: slide.id,
          action: 'create',
          idempotencyKey: `${user.uid}-${slide.id}-${Date.now()}` // Prevent duplicates
        }
      );

      if (!result.success) {
        console.error('Failed to consume credits:', result.error);
        setShowOutOfCreditsModal(true);
        return;
      }

      // ✅ SUCCESS: Slide created and credit consumed
      console.log(`✅ Slide created! New balance: ${result.newBalance}`);

      // Add slide to deck
      onSlideCreated(slide);

    } catch (error) {
      console.error('Error creating slide:', error);
    }
  };

  return (
    <div>
      {/* Your existing UI */}

      {/* Out of Credits Modal */}
      <OutOfCreditsModal
        isOpen={showOutOfCreditsModal}
        onClose={() => setShowOutOfCreditsModal(false)}
        onPurchase={(packageId) => {
          // TODO: Implement Stripe checkout
          console.log('Purchase package:', packageId);
          setShowOutOfCreditsModal(false);
        }}
        currentBalance={credits || 0}
      />
    </div>
  );
};
```

### **Step 4: Add Pricing Page Route**

Update your routing (e.g., `App.tsx` or your router):

```tsx
import CreditPurchasePage from './components/CreditPurchasePage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/pricing" element={<CreditPurchasePage />} />
        {/* Other routes */}
      </Routes>
    </BrowserRouter>
  );
}
```

### **Step 5: Deploy Firestore Indexes**

Deploy the Firestore indexes for optimal query performance:

```bash
# Install Firebase CLI if you haven't
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy indexes
firebase deploy --only firestore:indexes
```

---

## 🧪 Testing Locally

### **1. Start the Dev Server**

```bash
npm run dev
```

### **2. Test Credit Flow**

1. **Sign in** with a test account
2. **Check header** - You should see the CreditBadge showing 10 credits (free tier)
3. **Try creating a slide**:
   - Should succeed and credit count should decrease to 9
   - Transaction should be logged in Firestore
4. **Create 9 more slides** to exhaust credits
5. **Try creating one more** - OutOfCreditsModal should appear
6. **Test low credits warning** - Should appear when you have ≤ 3 credits

### **3. Test in Firebase Console**

Open Firebase Console and check:

**Users Collection:**
```
users/{userId}
  credits: {
    totalCredits: 9,
    usedCreditsLifetime: 1,
    usedCreditsThisMonth: 1,
    lastUpdated: 1700000000000
  }
```

**Credit Transactions:**
```
creditTransactions/{txId}
  userId: "user123",
  type: "consumption",
  amount: -1,
  balanceAfter: 9,
  description: "Created slide 'Introduction'",
  timestamp: 1700000000000
```

---

## 💳 Next: Stripe Integration (Phase 4)

### **What You'll Need:**

1. **Stripe Account**
   - Sign up at https://stripe.com
   - Get test API keys (pk_test_... and sk_test_...)

2. **Install Stripe SDK**

```bash
npm install @stripe/stripe-js stripe
```

3. **Create Stripe Checkout Handler**

```typescript
// services/stripeService.ts
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_YOUR_KEY');

export const purchaseCredits = async (packageId: string) => {
  const stripe = await stripePromise;

  // Call your backend to create checkout session
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packageId })
  });

  const { sessionId } = await response.json();

  // Redirect to Stripe Checkout
  await stripe!.redirectToCheckout({ sessionId });
};
```

4. **Backend Webhook Handler** (Firebase Cloud Function)

```typescript
// functions/src/stripe.ts
import Stripe from 'stripe';
import * as functions from 'firebase-functions';
import { addCredits } from './creditService';

const stripe = new Stripe('sk_test_YOUR_KEY');

export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      'whsec_YOUR_WEBHOOK_SECRET'
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, packageId, credits } = session.metadata;

    // Add credits to user account
    await addCredits(
      userId,
      parseInt(credits),
      `Purchased ${packageId} package`,
      'purchase',
      { packageId }
    );
  }

  res.json({ received: true });
});
```

---

## 📊 Monitoring & Analytics

### **Track Credit Usage**

```typescript
import { getCreditStats } from '../services/creditService';

const stats = await getCreditStats(userId);

console.log({
  totalCreditsUsed: stats.totalCreditsLifetime,
  monthlyUsage: stats.totalCreditsThisMonth,
  totalSpent: stats.totalSpent,
  avgCostPerSlide: stats.averageCostPerSlide
});
```

### **Admin Dashboard Query**

```typescript
import { getCreditHistory } from '../services/creditService';

const transactions = await getCreditHistory(userId, 100);

// Group by type
const purchases = transactions.filter(t => t.type === 'purchase');
const consumption = transactions.filter(t => t.type === 'consumption');

console.log(`Purchases: ${purchases.length}`);
console.log(`Slides created: ${consumption.length}`);
```

---

## 🎨 UI Customization

### **Customize Colors**

All components use Tailwind classes. To customize:

```tsx
// CreditBadge.tsx - Change colors
const getBadgeStyle = () => {
  if (isOutOfCredits()) {
    return {
      container: 'bg-red-50 border-red-300', // Change to your brand colors
      text: 'text-red-700',
      icon: 'text-red-500'
    };
  }
  // ...
};
```

### **Adjust Thresholds**

```tsx
// Change when low credits warning appears
<LowCreditsWarning threshold={5} /> // Default is 3
```

### **Customize Purchase Options**

Edit `config/pricing.ts`:

```typescript
export const CREDIT_PACKS = [
  {
    id: 'custom',
    name: 'Your Custom Pack',
    credits: 50,
    price: 25,
    pricePerCredit: 0.50,
    popular: true
  }
];
```

---

## 🐛 Troubleshooting

### **Credits not updating in real-time**

**Solution:** Make sure `useCredits` hook is properly set up with Firestore listeners:

```tsx
import { useCredits } from '../hooks/useCredits';

const { credits } = useCredits(); // Automatically subscribes to changes
```

### **"Insufficient credits" error**

**Solution:** Check Firestore transaction logs:

```typescript
const result = await consumeCredits(...);
if (!result.success) {
  console.error('Error:', result.error);
  // Show appropriate UI
}
```

### **Firestore indexes missing**

**Solution:** Deploy indexes:

```bash
firebase deploy --only firestore:indexes
```

---

## ✅ Production Checklist

Before deploying to production:

- [ ] Deploy Firestore indexes
- [ ] Set up Stripe production keys
- [ ] Configure Stripe webhooks
- [ ] Test credit consumption flow
- [ ] Test purchase flow (Stripe Checkout)
- [ ] Set up monitoring/alerts
- [ ] Add error tracking (Sentry, etc.)
- [ ] Test with real payment (small amount)
- [ ] Set up customer support for credit issues
- [ ] Document refund policy

---

## 🎯 Summary

**What's Working:**
- ✅ Real-time credit balance tracking
- ✅ Credit consumption with atomic transactions
- ✅ Beautiful UI components
- ✅ Low credits warnings
- ✅ Out of credits modal
- ✅ Comprehensive pricing page
- ✅ Transaction logging & auditing

**What's Next:**
- ⏳ Stripe payment integration
- ⏳ Organization/team features
- ⏳ Monthly subscription handling
- ⏳ Credit rollover logic
- ⏳ Usage analytics dashboard

---

**Questions? Issues?**
- Check the code review: `docs/CREDIT_SYSTEM_REVIEW.md`
- Run tests: `npx tsx tests/credit-system-test.ts`
- Review pricing: `config/pricing.ts`
