import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBLy_kNUmiwOkwUHQ9KKH2NE-J1PNRbwMM",
  authDomain: "deckr-477706.firebaseapp.com",
  projectId: "deckr-477706",
  storageBucket: "deckr-477706.firebasestorage.app",
  messagingSenderId: "542490560050",
  appId: "1:542490560050:web:8c4c8f5cd881a0ea83727a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function activateSubscription() {
  try {
    const userId = '1AXu8cQX2Xag4Lp4uxnhA0fjf112'; // Your user ID

    console.log(`🔍 Checking subscription for user ${userId}...\n`);

    // Check if subscription exists
    const subscriptionsRef = collection(db, 'customers', userId, 'subscriptions');
    const q = query(subscriptionsRef, orderBy('created', 'desc'), limit(1));
    const subscriptionDocs = await getDocs(q);

    if (subscriptionDocs.empty) {
      console.log('❌ No subscriptions found');
      console.log('   The Stripe Extension may still be processing the payment.');
      console.log('   Wait a few moments and try again.\n');
      return;
    }

    const subscription = subscriptionDocs.docs[0].data();
    console.log('✅ Subscription found:');
    console.log(`   ID: ${subscriptionDocs.docs[0].id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Created: ${new Date(subscription.created * 1000).toISOString()}\n`);

    // Update user's plan to business
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      plan: 'business',
      subscriptionId: subscriptionDocs.docs[0].id,
      updatedAt: Date.now()
    });

    console.log('✅ User plan updated to Business!');
    console.log('   Refresh your app to see the changes.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

activateSubscription();
