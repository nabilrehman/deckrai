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

async function setUsage() {
  try {
    const userId = '1AXu8cQX2Xag4Lp4uxnhA0fjf112';
    const slidesCount = 249; // Set to 249 to test warning at 99.6%

    console.log(`🔧 Updating usage for user ${userId}...`);
    console.log(`   Setting slidesThisMonth to ${slidesCount}`);

    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'usage.slidesThisMonth': slidesCount,
      'usage.lastUpdated': Date.now()
    });

    console.log(`✅ Usage updated successfully!`);
    console.log(`   Current: ${slidesCount}/250`);
    console.log(`   Percentage: ${((slidesCount/250)*100).toFixed(1)}%`);
    console.log(`\n🧪 Now refresh your app and generate 1 slide to test the warning!`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setUsage();
