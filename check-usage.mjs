import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function checkUsage() {
  try {
    const userId = '1AXu8cQX2Xag4Lp4uxnhA0fjf112';

    console.log(`🔍 Checking usage for user ${userId}...\n`);

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('❌ User document not found!');
      return;
    }

    const userData = userDoc.data();
    console.log('📊 User Data:');
    console.log(JSON.stringify(userData, null, 2));

    console.log('\n📈 Usage Stats:');
    console.log(`   Plan: ${userData.plan || 'Not set'}`);
    console.log(`   Slides this month: ${userData.usage?.slidesThisMonth || 0}`);
    console.log(`   Decks this month: ${userData.usage?.decksThisMonth || 0}`);
    console.log(`   Last updated: ${userData.usage?.lastUpdated ? new Date(userData.usage.lastUpdated).toISOString() : 'Never'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsage();
