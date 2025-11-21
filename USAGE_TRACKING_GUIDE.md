# Usage Tracking Implementation Guide

## 📊 What Counts as Usage

**Every slide operation counts as 1 slide generation:**

### ✅ Operations That Count (Each = 1 slide)
1. **New Slide Generation** - Creating a slide from scratch
2. **Slide Edit** - Any modification to existing slide (text, images, layout)
3. **Slide Regeneration** - Regenerating a slide with new prompt
4. **Slide Redesign** - Applying new style/theme to slide
5. **Inpainting** - Modifying specific areas of a slide
6. **Personalization** - Customizing slide with user data

### ❌ Operations That DON'T Count
- Viewing slides
- Downloading slides
- Reordering slides
- Deleting slides
- Saving decks
- Opening existing decks

---

## 🔧 Implementation

### Hook Usage
Use the `useUsageValidation` hook for all slide operations:

```typescript
import { useUsageValidation } from '../hooks/useUsageValidation';

const MyComponent = () => {
  const { validateGeneration, trackUsage } = useUsageValidation();

  const handleSlideEdit = async () => {
    // 1. VALIDATE before operation (1 slide = 1 edit)
    const validation = await validateGeneration(1);

    if (!validation.allowed) {
      alert(validation.error); // Show error to user
      return;
    }

    // 2. Show warning if approaching limit
    if (validation.warning) {
      console.warn(validation.warning);
    }

    try {
      // 3. PERFORM the operation
      await performSlideEdit();

      // 4. TRACK usage after success
      await trackUsage(1);
    } catch (error) {
      console.error('Edit failed:', error);
    }
  };
};
```

---

## 📍 Integration Points

### 1. **Slide Editor** (`components/SlideEditor.tsx`)
Track when user edits a slide:

```typescript
const handleSaveEdit = async () => {
  const validation = await validateGeneration(1);
  if (!validation.allowed) {
    showUpgradeModal();
    return;
  }

  await saveSlideEdit();
  await trackUsage(1); // ✅ Count this edit
};
```

### 2. **Bulk Generation** (`components/ChatLandingView.tsx`)
Track multiple slides at once:

```typescript
const handleGenerateDeck = async (slideCount: number) => {
  const validation = await validateGeneration(slideCount);
  if (!validation.allowed) {
    showLimitReachedMessage();
    return;
  }

  const slides = await generateSlides(slideCount);
  await trackUsage(slideCount); // ✅ Track all slides
};
```

### 3. **Personalization** (`services/geminiService.ts`)
Track personalization operations:

```typescript
export const personalizeSlide = async (slideId: string, userId: string) => {
  // Check if user can perform operation
  const canGenerate = await canGenerateSlides(userId, 1);
  if (!canGenerate.allowed) {
    throw new Error(canGenerate.reason);
  }

  // Perform personalization
  const result = await performPersonalization(slideId);

  // Track usage
  await incrementSlideCount(userId, 1); // ✅ Count personalization

  return result;
};
```

### 4. **Inpainting** (any inpainting service)
```typescript
const handleInpaint = async (area: BoundingBox) => {
  await validateGeneration(1);
  await performInpainting(area);
  await trackUsage(1); // ✅ Count inpainting
};
```

---

## 🎯 Validation Flow

```
User clicks "Edit Slide"
       ↓
validateGeneration(1)
       ↓
   ┌─────────────────┐
   │  Check Limits   │
   └─────────────────┘
       ↓
   ┌─── Expired? ────┐
   │  Yes → Block    │
   │  No → Continue  │
   └─────────────────┘
       ↓
   ┌─── At Limit? ───┐
   │  Yes → Block    │
   │  No → Continue  │
   └─────────────────┘
       ↓
   ┌─── Warning? ────┐
   │  80%+ → Warn    │
   │  <80% → Allow   │
   └─────────────────┘
       ↓
Perform Operation
       ↓
trackUsage(1)
       ↓
Update Firestore
```

---

## 📊 Current Limits

| Plan | Monthly Slides | Cost |
|------|----------------|------|
| **Trial** | 20 slides | Free (14 days) |
| **Starter** | 75 slides | $19/month |
| **Business** | 250 slides | $99/month |
| **Enterprise** | Unlimited | Custom |

---

## 🚨 Warning Thresholds

### 80% Usage (Proactive Warning)
Show amber warning when user reaches 80% of their limit:

```typescript
// Trial: 20 slides → Warn at 16 slides
// Starter: 75 slides → Warn at 60 slides
// Business: 250 slides → Warn at 200 slides
```

**UI Behavior:**
- Badge turns amber
- Warning icon appears
- Message: "You're approaching your monthly limit. X slides remaining."

### 100% Usage (Block)
Block operations when limit is reached:

```typescript
if (slidesUsed >= slidesLimit) {
  showUpgradeModal({
    title: "Usage Limit Reached",
    message: "You've used all your slides this month. Upgrade to continue.",
    cta: "Upgrade Now"
  });
}
```

---

## 🔄 Monthly Reset

Usage resets automatically on the 1st of each month:

```typescript
// In services/firestoreService.ts
const shouldResetUsage = (monthStart: number): boolean => {
  const now = new Date();
  const monthStartDate = new Date(monthStart);

  return now.getMonth() !== monthStartDate.getMonth() ||
         now.getFullYear() !== monthStartDate.getFullYear();
};
```

---

## 🧪 Testing Usage Tracking

### Test 1: Single Edit
```javascript
// In browser console
import { incrementSlideCount } from './services/firestoreService';
await incrementSlideCount('USER_ID', 1);
// Check Firestore: usage.slidesThisMonth should increase by 1
```

### Test 2: Bulk Generation
```javascript
await incrementSlideCount('USER_ID', 10);
// Check Firestore: usage.slidesThisMonth should increase by 10
```

### Test 3: Limit Reached
```javascript
// Set usage to limit in Firestore
import { doc, updateDoc } from 'firebase/firestore';
const userRef = doc(db, 'users', 'USER_ID');
await updateDoc(userRef, { 'usage.slidesThisMonth': 75 });

// Try to generate → Should be blocked
```

### Test 4: Warning Threshold
```javascript
// Set usage to 60 (80% of 75)
await updateDoc(userRef, { 'usage.slidesThisMonth': 60 });
// Badge should turn amber, warning should appear
```

---

## 📝 Firestore Structure

```javascript
users/
  {userId}/
    plan: 'starter'
    usage: {
      slidesThisMonth: 45,      // Current usage
      decksThisMonth: 8,
      monthStart: 1700000000000, // Timestamp
      lastUpdated: 1700000000000
    }
```

---

## 🎨 UI Components

### 1. **UsageWarningBanner**
Shows proactive warnings:

```tsx
<UsageWarningBanner
  warning="You're approaching your monthly limit. 15 slides remaining."
  currentUsage={60}
  limit={75}
  usagePercentage={80}
  onUpgrade={() => navigate('/pricing')}
/>
```

### 2. **PricingBadge**
Shows current usage in sidebar:

```tsx
<PricingBadge
  plan="starter"
  slidesUsed={60}
  slidesLimit={75}
  trialDaysRemaining={undefined}
  onUpgrade={() => navigate('/pricing')}
/>
// Displays: "Starter | 60/75"
```

---

## ✅ Implementation Checklist

- [x] `useUsageValidation` hook created
- [x] `UsageWarningBanner` component created
- [x] `PricingBadge` updated for slides tracking
- [ ] Integrate validation in `SlideEditor.tsx`
- [ ] Integrate validation in `ChatLandingView.tsx`
- [ ] Integrate tracking in all generation functions
- [ ] Integrate tracking in all edit functions
- [ ] Test with real user flows
- [ ] Add analytics events for usage tracking

---

## 🚀 Next Steps

1. **Add validation to all edit endpoints**
   - Find all places where slides are modified
   - Add `validateGeneration(1)` before operation
   - Add `trackUsage(1)` after success

2. **Test end-to-end**
   - Create test user
   - Perform 20 operations
   - Verify limit is enforced
   - Test upgrade flow

3. **Analytics**
   - Track which features users hit limits on
   - Monitor conversion rate (limit → upgrade)
   - A/B test warning thresholds

---

## 📞 Support

For questions about usage tracking implementation:
- Check: `hooks/useUsageValidation.ts`
- Check: `services/subscriptionService.ts`
- Check: `services/firestoreService.ts`
