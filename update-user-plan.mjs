import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

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

async function updateUserPlan() {
  try {
    const email = 'anam.nabil1@gmail.com';
    const newPlan = 'business';

    console.log(`🔍 Looking for user with email: ${email}`);

    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`❌ No user found with email: ${email}`);
      return;
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log(`✅ Found user: ${userId}`);
    console.log(`   Current plan: ${userData.plan || 'No plan set'}`);
    console.log(`   Name: ${userData.displayName}`);

    // Update user to business plan
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      plan: newPlan,
      trial: null, // Remove trial info
      'subscription.status': 'active',
      'subscription.currentPeriodEnd': Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days from now
    });

    console.log(`\n✅ User updated successfully!`);
    console.log(`   Email: ${email}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   New plan: ${newPlan}`);
    console.log(`   Subscription status: active`);
    console.log(`   Limits: 250 slides/month, 50 decks/month`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateUserPlan();
