# ✅ Stripe Integration - CONFIGURED!

## 🎉 What's Done

I've successfully configured your Stripe integration with **real Price IDs**!

---

## ✅ Completed Steps

### 1. **Fetched Your Stripe Price IDs** ✅
```
✅ Starter:    price_1SU18i3ZT6RXP9jPPS1gqQML ($10.00)
✅ Pro:        price_1SU1B43ZT6RXP9jPBUNtZT9I ($30.00)
✅ Business:   price_1SU1BS3ZT6RXP9jPj6oNdvEe ($70.00)
✅ Enterprise: price_1SU1Bl3ZT6RXP9jPtngLiM32 ($200.00)
```

### 2. **Updated Your Code Files** ✅

**File 1: `types.ts`**
- ✅ Added `stripePriceId?: string` to `CreditPackage` interface

**File 2: `config/pricing.ts`**
- ✅ Added real Stripe Price IDs to all 4 credit packs

**File 3: `components/CreditPurchasePage.tsx`**
- ✅ Updated to use `pack.stripePriceId` instead of placeholder
- ✅ Added validation to ensure price ID exists before checkout

---

## 🚀 What's Left To Do

### **Step 1: Add Your Stripe Publishable Key** (2 mins)

Create `.env.local` file:

```bash
# In your project root
cat > .env.local << 'EOF'
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SU1213ZT6RXP9jPSVOr3zLqhiI8mQZN0xqYFp7gNrJKLWHX9vMKj0FVBp8Y4NnLfPX5eKrGLz3qxVE9Hk7pqS7z00abcdefgh
EOF
```

**Where to get it:**
1. Go to: https://dashboard.stripe.com/test/apikeys
2. Copy the **Publishable key** (starts with `pk_test_...`)
3. Replace the value above with your real key

---

### **Step 2: Install Firebase Stripe Extension** (15 mins)

1. **Go to Firebase Extensions:**
   ```
   https://console.firebase.google.com/project/deckr-477706/extensions
   ```

2. **Click "Install Extension"**

3. **Search for "Run Payments with Stripe"**

4. **Configure:**
   ```
   Stripe API Secret Key: sk_test_YOUR_STRIPE_SECRET_KEY_HERE

   Products collection: products
   Customer details collection: customers
   Sync new users: Yes
   Delete data on user delete: Yes
   Location: us-central1
   ```

5. **Click "Install Extension"** (takes 2-3 minutes)

---

### **Step 3: Configure Stripe Webhook** (5 mins)

**After the extension installs:**

1. **Your webhook URL will be:**
   ```
   https://us-central1-deckr-477706.cloudfunctions.net/ext-firestore-stripe-payments-handleWebhookEvents
   ```

2. **Go to Stripe Dashboard:**
   ```
   https://dashboard.stripe.com/test/webhooks
   ```

3. **Click "Add endpoint"**

4. **Paste your webhook URL**

5. **Select these events:**
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`

6. **Copy the webhook signing secret** (starts with `whsec_...`)

7. **Go back to Firebase Console → Extensions**
   - Click "Manage" on the Stripe extension
   - Add the webhook secret

---

### **Step 4: Deploy Firestore Rules** (2 mins)

```bash
cd /Users/nabilrehman/Downloads/deckr.ai-fina
firebase deploy --only firestore:rules
```

---

### **Step 5: Test It!** (10 mins)

1. **Restart your dev server:**
   ```bash
   npm run dev
   ```

2. **Sign in to your app**

3. **Go to pricing page**

4. **Click "Purchase" on Starter Pack**

5. **You should be redirected to Stripe checkout!**

6. **Use test card:**
   ```
   Card: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   ZIP: 12345
   ```

7. **Complete payment**

8. **You should see confetti and +25 credits!** 🎉

---

## 📊 Your Pricing Structure

| Pack | Price | Credits | Bonus | Total | Stripe Price ID |
|------|-------|---------|-------|-------|-----------------|
| Starter | $10 | 25 | 0 | 25 | `price_1SU18i3ZT6RXP9jPPS1gqQML` |
| Pro ⭐ | $30 | 100 | +10 | 110 | `price_1SU1B43ZT6RXP9jPBUNtZT9I` |
| Business | $70 | 300 | +50 | 350 | `price_1SU1BS3ZT6RXP9jPj6oNdvEe` |
| Enterprise | $200 | 1000 | +200 | 1200 | `price_1SU1Bl3ZT6RXP9jPtngLiM32` |

---

## 🔒 Security Notes

✅ **Your Secret Key** (`sk_test_...`) - Goes in Firebase Extension (server-side only)
✅ **Your Publishable Key** (`pk_test_...`) - Goes in `.env.local` (client-side, safe to use)

**Never commit your `.env.local` file to git!** (Already in .gitignore)

---

## 🎯 Next Steps Summary

1. ✅ **Code configured** (DONE!)
2. ⏳ Add publishable key to `.env.local` (2 mins)
3. ⏳ Install Firebase Stripe extension (15 mins)
4. ⏳ Configure webhook (5 mins)
5. ⏳ Deploy Firestore rules (2 mins)
6. ⏳ Test with test card (10 mins)

**Total remaining time: ~35 minutes**

---

## 📚 Helpful Resources

- **Setup Checklist:** `SETUP_CHECKLIST.md`
- **Stripe Guide:** `STRIPE_SETUP_GUIDE.md`
- **What I Built:** `WHAT_I_BUILT_FOR_YOU.md`

---

## 🆘 Troubleshooting

### "Invalid API key" error
**Fix:** Check `.env.local` has correct `VITE_STRIPE_PUBLISHABLE_KEY`

### Extension not found
**Fix:** Wait 2-3 minutes for extension to deploy

### Credits not added after payment
**Fix:**
1. Check Firebase Functions logs
2. Verify webhook is configured
3. Check `customers/{userId}/payments` in Firestore

---

**You're almost there! Just follow the 5 steps above and you'll be accepting payments!** 🚀
