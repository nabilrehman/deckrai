# Credit System Rebuild Guide
## Complete Implementation with Testing Instructions

---

## 🎯 Overview

Rebuilding the complete credit-based monetization system with 6 phases:
1. ✅ Core Credits Infrastructure
2. ✅ Usage Dashboard
3. ⏳ In-Chat Upgrade Prompts
4. ⏳ Stripe Integration
5. ⏳ Security & Validation
6. ⏳ Analytics & Optimization

---

## Phase 1: Core Credits Infrastructure

### What We're Building
- Credit balance types and interfaces
- Atomic credit transaction service
- Updated user profile with credits
- Firebase integration

### Files to Create/Modify
1. `types.ts` - Add credit types
2. `services/creditService.ts` - New file
3. `services/firestoreService.ts` - Update initialization

### Testing After Phase 1

**Test 1: Check Types Compilation**
```bash
npm run build
# Should complete without TypeScript errors
```

**Test 2: Manual Credit Operations (Browser Console)**
```javascript
// After signing in, open DevTools console:

// 1. Check current credits
import { getCredits } from './services/creditService';
const userId = "YOUR_USER_ID"; // Get from Firebase Auth
const credits = await getCredits(userId);
console.log('Credits:', credits);
// Expected: { current: 50, monthlyAllowance: 50, ... }

// 2. Deduct credits
import { deductCredits } from './services/creditService';
const tx = await deductCredits(userId, 5, 'slide_generation', {
  slideName: 'Test Slide'
});
console.log('Transaction:', tx);
// Expected: Transaction record with balanceAfter = 45

// 3. Verify deduction
const updatedCredits = await getCredits(userId);
console.log('Updated credits:', updatedCredits);
// Expected: current = 45
```

**Test 3: Check Firestore Data**
1. Go to Firebase Console: https://console.firebase.google.com/project/deckr-477706/firestore
2. Navigate to `users/{yourUserId}`
3. Verify `credits` object exists with:
   - `current: 45`
   - `monthlyAllowance: 50`
   - `rolledOver: 0`
   - `purchased: 0`
   - `lastResetAt: <timestamp>`
   - `nextResetAt: <timestamp>`
4. Navigate to `users/{yourUserId}/creditTransactions`
5. Verify transaction document exists with:
   - `type: "slide_generation"`
   - `amount: -5`
   - `balanceAfter: 45`
   - `metadata.slideName: "Test Slide"`

**Success Criteria:**
- ✅ Build completes without errors
- ✅ Can fetch credits from Firestore
- ✅ Can deduct credits atomically
- ✅ Transaction history is recorded
- ✅ No race conditions (try deducting twice rapidly)

---

## Phase 2: Usage Dashboard

### What We're Building
- Full dashboard component with credit display
- Transaction history table
- Compact sidebar view
- Modal integration

### Files to Create/Modify
1. `components/UsageDashboard.tsx` - New file
2. `components/ChatSidebar.tsx` - Add credit badge
3. `pages/AppPage.tsx` - Add dashboard modal

### Testing After Phase 2

**Test 1: Visual Inspection**
```bash
npm run dev
# Navigate to http://localhost:3002
```

1. Sign in to your account
2. Click your avatar in sidebar
3. Click "Usage" button
4. Verify dashboard opens with:
   - Large credit number display
   - Animated progress bar
   - "Resets in X days" text
   - Transaction history table (if any transactions exist)

**Test 2: Sidebar Credit Badge**
1. Look at sidebar (bottom section)
2. Verify you see:
   - User avatar
   - Plan name ("Free plan" or "Business plan")
   - Credit badge with sparkle icon: "50 credits"

**Test 3: Transaction History**
1. In browser console, create test transactions:
```javascript
import { deductCredits, addCredits } from './services/creditService';
const userId = "YOUR_USER_ID";

// Create various transaction types
await deductCredits(userId, 3, 'slide_generation', { slideName: 'Slide 1' });
await deductCredits(userId, 2, 'minor_edit', { slideName: 'Slide 2' });
await addCredits(userId, 25, 'purchase', { reason: 'Test purchase' });
```

2. Refresh dashboard
3. Verify table shows:
   - 3 transactions
   - Correct icons (sparkle, shopping cart)
   - Color-coded amounts (red for deductions, green for additions)
   - Running balance

**Test 4: Progress Bar Colors**
1. Deduct credits until < 30% remain (yellow zone):
```javascript
await deductCredits(userId, 40, 'deck_generation');
```
2. Verify progress bar turns yellow

3. Deduct more until < 10% remain (red zone):
```javascript
await deductCredits(userId, 5, 'slide_generation');
```
4. Verify progress bar turns red

**Test 5: Modal Close**
1. Click X button in top-right corner
2. Verify modal closes smoothly
3. Click "Usage" again
4. Verify modal reopens

**Success Criteria:**
- ✅ Dashboard displays correctly
- ✅ Credit badge shows in sidebar
- ✅ Transaction history populates
- ✅ Progress bar color changes based on usage
- ✅ Modal opens/closes smoothly
- ✅ All animations work (Framer Motion)

---

## Phase 3: In-Chat Upgrade Prompts

### What We're Building
- Credit check before operations
- Low balance warnings
- Upgrade prompts when insufficient credits
- Graceful degradation

### Files to Modify
1. `components/ChatLandingView.tsx` - Add credit check
2. `components/ChatWithArtifacts.tsx` - Add credit warnings
3. `services/geminiService.ts` - Integrate credit deductions

### Testing After Phase 3

**Test 1: Sufficient Credits Flow**
1. Ensure you have 50+ credits
2. Generate a new deck: "Create a 5-slide deck about AI"
3. Verify:
   - Generation proceeds normally
   - No warnings shown
   - Credits deducted after generation completes
   - Transaction recorded

**Test 2: Low Balance Warning (10-20 credits)**
1. Manually set credits to 15:
```javascript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './config/firebase';
const userRef = doc(db, 'users', 'YOUR_USER_ID');
await updateDoc(userRef, { 'credits.current': 15 });
```

2. Start generating a deck
3. Verify warning appears:
   - "⚠️ You have 15 credits remaining"
   - "This operation will use 10 credits"
   - Continue button
   - Upgrade button

**Test 3: Insufficient Credits Block (< 5 credits)**
1. Set credits to 3:
```javascript
await updateDoc(userRef, { 'credits.current': 3 });
```

2. Try to generate a deck
3. Verify operation is blocked:
   - "❌ Insufficient Credits" message
   - "You need 10 credits but have 3"
   - "Upgrade Now" button (primary action)
   - "Buy Credits" button (secondary action)
   - Generation does NOT proceed

**Test 4: Credit Deduction Integration**
1. Generate a single slide
2. Check browser console for logs:
```
[creditService] Credits deducted: { userId, amount: 2, type: 'slide_generation', balanceAfter: 48 }
```

3. Verify in Firestore:
   - Credits decreased by 2
   - Transaction recorded with slide metadata

**Success Criteria:**
- ✅ Operations check credits before proceeding
- ✅ Warnings appear at 20% balance
- ✅ Operations block at insufficient credits
- ✅ Credits deducted automatically after generation
- ✅ No operations bypass credit checks

---

## Phase 4: Stripe Integration (Already Done!)

### What Exists
- Stripe Price IDs configured
- `services/stripeService.ts` with checkout flow
- `components/CreditPurchasePage.tsx` for purchasing

### Testing After Phase 4

**Test 1: Purchase Flow**
1. Click "Buy Credits" from insufficient credits modal
2. Verify redirect to credit purchase page
3. Select "Starter Pack" ($10 / 25 credits)
4. Click "Purchase"
5. Verify Stripe checkout opens

**Test 2: Test Card Payment**
```
Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
ZIP: 12345
```

1. Complete test payment
2. Verify redirect back to app
3. Check credits increased by 25
4. Check transaction in dashboard shows "Credit Purchase"

**Test 3: Failed Payment**
```
Card: 4000 0000 0000 0002 (Decline card)
```

1. Try to purchase with decline card
2. Verify error message shows
3. Verify NO credits added
4. Verify NO transaction recorded

**Success Criteria:**
- ✅ Checkout flow works
- ✅ Successful payment adds credits
- ✅ Failed payment doesn't add credits
- ✅ Confetti animation on success
- ✅ Transaction recorded with Stripe payment ID

---

## Phase 5: Security & Validation

### What to Implement
- Rate limiting
- Fraud detection
- Input validation
- Server-side credit checks

### Testing After Phase 5

**Test 1: Rate Limiting**
1. Rapidly click "Generate" 20 times in a row
2. Verify:
   - First 5 requests proceed
   - Requests 6-20 show "Rate limit exceeded" error
   - Wait 60 seconds
   - Next request proceeds normally

**Test 2: Concurrent Deduction Protection**
1. Open 2 browser tabs with same user
2. In both tabs, simultaneously trigger operations that deduct 10 credits each
3. Verify:
   - One operation succeeds
   - Other operation gets "Insufficient credits" error
   - No race condition (both don't succeed if balance is < 20)

**Test 3: Client-Side Bypass Attempt**
1. In browser console, try direct Firestore write:
```javascript
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './config/firebase';
await updateDoc(doc(db, 'users', 'YOUR_USER_ID'), {
  'credits.current': 9999
});
```

2. Verify Firestore Security Rules block this:
   - Error: "Missing or insufficient permissions"
   - Credits NOT updated

**Success Criteria:**
- ✅ Rate limiting prevents abuse
- ✅ Atomic transactions prevent race conditions
- ✅ Security rules prevent direct credit manipulation
- ✅ Server-side validation for all operations

---

## Phase 6: Analytics & Optimization

### What to Implement
- Credit usage analytics
- Conversion tracking
- Performance monitoring

### Testing After Phase 6

**Test 1: Usage Analytics**
1. Go to Firebase Console → Analytics
2. Navigate to DebugView
3. Perform various operations
4. Verify events logged:
   - `credit_deducted` (with amount, type)
   - `credit_added` (with amount, source)
   - `insufficient_credits` (with attempted_amount)
   - `upgrade_prompted` (with current_balance)

**Test 2: Conversion Funnel**
1. Track upgrade flow:
   - User sees upgrade prompt
   - User clicks "Upgrade Now"
   - User completes purchase
2. Verify funnel in Analytics:
   - Step 1: `upgrade_prompted` → 100 events
   - Step 2: `checkout_initiated` → 40 events (40% CTR)
   - Step 3: `purchase_completed` → 25 events (62% conversion)

**Success Criteria:**
- ✅ All credit operations logged
- ✅ Conversion funnel tracked
- ✅ Dashboard shows usage patterns
- ✅ Alerts for suspicious activity

---

## 🚀 Quick Test Commands

### After Each Phase

```bash
# 1. Rebuild and check for errors
npm run build

# 2. Start dev server
npm run dev

# 3. Run type checking
npx tsc --noEmit

# 4. Check Firebase connection
# (In browser console after signing in)
import { getCredits } from './services/creditService';
await getCredits('YOUR_USER_ID');
```

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot read property 'current' of undefined"
**Fix:** User profile doesn't have credits initialized
```javascript
import { initializeCredits } from './services/creditService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './config/firebase';

const userRef = doc(db, 'users', 'YOUR_USER_ID');
const credits = initializeCredits('free');
await updateDoc(userRef, { credits });
```

### Issue: "Insufficient permissions" when accessing Firestore
**Fix:** Deploy updated Firestore rules
```bash
firebase deploy --only firestore:rules
```

### Issue: Credits don't update in UI
**Fix:** Add real-time listener or force refresh
```typescript
// In AppPage.tsx, add dependency to credits loading effect
useEffect(() => {
  loadCredits();
}, [user, showUsageDashboard]); // Re-load when dashboard closes
```

---

## ✅ Final Checklist

Before deploying to production:

**Phase 1:**
- [ ] Credit types defined
- [ ] creditService.ts created
- [ ] Atomic transactions tested
- [ ] Firestore rules deployed

**Phase 2:**
- [ ] UsageDashboard component created
- [ ] ChatSidebar shows credit badge
- [ ] AppPage integrates modal
- [ ] Animations work smoothly

**Phase 3:**
- [ ] Credit checks before operations
- [ ] Low balance warnings
- [ ] Insufficient credit blocks
- [ ] Automatic deductions

**Phase 4:**
- [ ] Stripe integration tested
- [ ] Test card works
- [ ] Credits added on purchase
- [ ] Transaction recorded

**Phase 5:**
- [ ] Rate limiting active
- [ ] Security rules deployed
- [ ] Concurrent operations safe
- [ ] Server-side validation

**Phase 6:**
- [ ] Analytics events logged
- [ ] Conversion funnel tracked
- [ ] Dashboard shows data
- [ ] Alerts configured

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Firebase Functions logs
3. Check Firestore data structure
4. Verify security rules are deployed
5. Test with fresh user account

**Testing Tips:**
- Use incognito window for fresh state
- Clear localStorage to reset cache
- Use Firebase Auth UID for test user IDs
- Check Network tab for API failures
