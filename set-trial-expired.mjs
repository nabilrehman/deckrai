import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';

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

async function setTrialExpired() {
  try {
    const userId = '1AXu8cQX2Xag4Lp4uxnhA0fjf112';

    // Set trial start date to 15 days ago (trial is 14 days, so this is expired)
    const fifteenDaysAgo = Date.now() - (15 * 24 * 60 * 60 * 1000);

    console.log(`🔧 Setting trial as expired for user ${userId}...`);
    console.log(`   Trial start date: ${new Date(fifteenDaysAgo).toLocaleDateString()}`);
    console.log(`   Days ago: 15 days`);
    console.log(`   Trial period: 14 days`);
    console.log(`   Status: EXPIRED`);

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      plan: 'trial',
      'trial.startDate': fifteenDaysAgo,
      'subscription.status': 'trialing',
      'usage.slidesThisMonth': 5 // Set some usage to test
    });

    console.log(`✅ Trial set as expired!`);
    console.log(`\n🧪 Now try to generate slides and you should see:`);
    console.log(`   ❌ Your trial has expired. Upgrade to continue generating slides.`);
    console.log(`\n🔄 Refresh your app to see the changes.`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setTrialExpired();
