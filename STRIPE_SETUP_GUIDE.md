# 🚀 Stripe Integration Setup Guide - Deckr.ai

This guide will walk you through setting up Stripe payments for Deckr.ai using the official Firebase Stripe extension.

## 📋 Prerequisites

- Firebase project on Blaze (pay-as-you-go) plan
- Stripe account (sign up at https://stripe.com)
- Firebase CLI installed (`npm install -g firebase-tools`)

---

## Step 1: Install Firebase Stripe Extension

### 1.1 Go to Firebase Console
```
https://console.firebase.google.com/project/deckr-477706/extensions
```

### 1.2 Install the Extension
1. Click "Install Extension"
2. Search for **"Run Payments with Stripe"**
3. Click on the official Stripe extension by Firebase
4. Click "Install in console"

### 1.3 Configure the Extension

You'll be asked for these values:

**Stripe API Key (Secret):**
```
Get from: https://dashboard.stripe.com/apikeys
Use: sk_test_... (for testing) or sk_live_... (for production)
```

**Firestore Collection:**
```
customers
```

**Products and Pricing Plans Collection:**
```
products
```

**Customer Details Collection:**
```
customers/{uid}/checkout_sessions
```

**Sync New Users:**
```
Sync new users to Stripe customers and Cloud Firestore: Yes
```

**Delete Stripe Data:**
```
Delete Stripe customer data when the user is deleted: Yes
```

**Configure Webhooks:**
```
Automatically set up webhooks: Yes
```

**Deploy Location:**
```
us-central1
```

---

## Step 2: Get Your Stripe Keys

### 2.1 API Keys
Go to: https://dashboard.stripe.com/apikeys

Copy both:
- **Publishable key** (starts with `pk_test_` or `pk_live_`)
- **Secret key** (starts with `sk_test_` or `sk_live_`)

### 2.2 Add to Environment Variables

Create `.env.local` (not committed to git):
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
```

The secret key is automatically configured by the Firebase extension.

---

## Step 3: Create Products and Prices in Stripe

### Option A: Via Stripe Dashboard (Recommended for Beginners)

1. Go to: https://dashboard.stripe.com/products
2. Click "Add product"
3. Create each credit pack:

#### Starter Pack
- **Name:** Deckr.ai - Starter Pack (25 Credits)
- **Description:** 25 credits for creating slides
- **Pricing:** One-time payment
- **Price:** $10.00 USD
- **Metadata:**
  - `credits`: `25`
  - `packageId`: `starter`
  - `type`: `one-time`

#### Pro Pack (Most Popular)
- **Name:** Deckr.ai - Pro Pack (110 Credits)
- **Description:** 100 credits + 10 bonus credits
- **Pricing:** One-time payment
- **Price:** $30.00 USD
- **Metadata:**
  - `credits`: `110`
  - `packageId`: `pro`
  - `type`: `one-time`
  - `bonus`: `10`

#### Business Pack
- **Name:** Deckr.ai - Business Pack (350 Credits)
- **Description:** 300 credits + 50 bonus credits
- **Pricing:** One-time payment
- **Price:** $75.00 USD
- **Metadata:**
  - `credits`: `350`
  - `packageId`: `business`
  - `type`: `one-time`
  - `bonus`: `50`

#### Enterprise Pack
- **Name:** Deckr.ai - Enterprise Pack (1200 Credits)
- **Description:** 1000 credits + 200 bonus credits
- **Pricing:** One-time payment
- **Price:** $200.00 USD
- **Metadata:**
  - `credits`: `1200`
  - `packageId`: `enterprise`
  - `type`: `one-time`
  - `bonus`: `200`

### Option B: Via Stripe CLI (Advanced)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Create products
stripe products create \
  --name "Deckr.ai - Starter Pack (25 Credits)" \
  --description "25 credits for creating slides"

# Create price (replace prod_xxx with product ID from above)
stripe prices create \
  --product prod_xxx \
  --currency usd \
  --unit-amount 1000 \
  --metadata[credits]=25 \
  --metadata[packageId]=starter
```

---

## Step 4: Sync Products to Firestore

The Firebase extension automatically syncs products from Stripe to Firestore.

### 4.1 Verify Sync

1. Go to Firebase Console → Firestore Database
2. Check for `products` collection
3. Each product should have a subcollection called `prices`

If products aren't syncing:
```bash
# Trigger manual sync via Cloud Function
firebase functions:shell
> ext-firestore-stripe-payments-syncStripeProducts()
```

---

## Step 5: Configure Webhooks

### 5.1 Get Webhook URL

After installing the extension, find your webhook URL:
```
https://us-central1-deckr-477706.cloudfunctions.net/ext-firestore-stripe-payments-handleWebhookEvents
```

### 5.2 Add to Stripe Dashboard

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. **Endpoint URL:** (paste your webhook URL from above)
4. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click "Add endpoint"

### 5.3 Update Extension Configuration

1. Go back to Firebase Console → Extensions
2. Find "Run Payments with Stripe"
3. Click "Manage"
4. Add the webhook signing secret from Stripe (starts with `whsec_`)

---

## Step 6: Test the Integration

### 6.1 Use Test Mode

Make sure you're using test keys:
- `pk_test_...`
- `sk_test_...`

### 6.2 Test Card Numbers

Use these in Stripe Checkout:

**Successful Payment:**
```
Card: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Payment Declined:**
```
Card: 4000 0000 0000 0002
```

**Insufficient Funds:**
```
Card: 4000 0000 0000 9995
```

### 6.3 Test Flow

1. Go to your app's pricing page
2. Click "Purchase" on any pack
3. Complete checkout with test card
4. Verify credits are added to Firestore
5. Check Stripe Dashboard for payment

---

## Step 7: Go Live

### 7.1 Switch to Live Mode

1. Get live API keys from Stripe
2. Update Firebase extension configuration:
   - Replace `sk_test_` with `sk_live_`
3. Update `.env.local`:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY_HERE
   ```

### 7.2 Re-create Products in Live Mode

Stripe test mode and live mode are separate. Repeat Step 3 in live mode.

### 7.3 Update Webhook

Add the webhook URL to **live mode** webhooks in Stripe Dashboard.

### 7.4 Test with Real Card

Use a real card with a small amount ($1) to verify everything works.

---

## 🔧 Troubleshooting

### Products Not Showing in Firestore

**Solution:**
```bash
firebase functions:shell
> ext-firestore-stripe-payments-syncStripeProducts()
```

### Webhook Events Not Firing

**Check:**
1. Webhook URL is correct
2. Webhook signing secret matches
3. Events are selected in Stripe Dashboard
4. Cloud Function logs: `firebase functions:log`

### Credits Not Added After Payment

**Check Firestore:**
```
customers/{userId}/payments/{paymentId}
```

Should have:
- `status: "succeeded"`
- `metadata.credits: "25"`

**Check Cloud Function:**
```bash
firebase functions:log --only ext-firestore-stripe-payments
```

### Local Testing

Use Stripe CLI to test webhooks locally:
```bash
stripe listen --forward-to localhost:5001/deckr-477706/us-central1/ext-firestore-stripe-payments-handleWebhookEvents
stripe trigger checkout.session.completed
```

---

## 📊 Monitoring

### Stripe Dashboard
- Payments: https://dashboard.stripe.com/payments
- Customers: https://dashboard.stripe.com/customers
- Webhooks: https://dashboard.stripe.com/webhooks

### Firebase Console
- Cloud Functions logs
- Firestore data
- Extension logs

### Set Up Alerts

1. Stripe → Settings → Notifications
2. Enable email alerts for:
   - Failed payments
   - Disputes
   - Payouts

---

## 💰 Pricing Summary

| Pack | Price | Credits | Price/Credit |
|------|-------|---------|--------------|
| Starter | $10 | 25 | $0.40 |
| Pro | $30 | 110 | $0.27 |
| Business | $75 | 350 | $0.21 |
| Enterprise | $200 | 1200 | $0.17 |

---

## 🔒 Security Checklist

- [ ] Using live secret key (not test key in production)
- [ ] Webhook endpoint is using HTTPS
- [ ] Webhook signing secret is configured
- [ ] Firestore security rules are deployed
- [ ] Only authenticated users can create checkout sessions
- [ ] Credit transactions are write-protected

---

## 📚 Resources

- **Firebase Stripe Extension:** https://extensions.dev/extensions/stripe/firestore-stripe-payments
- **Stripe API Docs:** https://stripe.com/docs/api
- **Firebase Functions:** https://firebase.google.com/docs/functions
- **Stripe Testing:** https://stripe.com/docs/testing

---

## Need Help?

- Stripe Support: https://support.stripe.com
- Firebase Support: https://firebase.google.com/support
- Extension Issues: https://github.com/stripe/stripe-firebase-extensions/issues
