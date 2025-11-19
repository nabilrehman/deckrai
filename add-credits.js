/**
 * Script to add credits to a specific user
 * Usage: node add-credits.js <email> <credits>
 * Example: node add-credits.js anam.nabil1@gmail.com 1000
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, increment, addDoc } from 'firebase/firestore';

// Firebase config - same as in config/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyAZ_oN0LcIwsFMdNk70X1gYjrLxTEBcWsw",
  authDomain: "deckr-477706.firebaseapp.com",
  projectId: "deckr-477706",
  storageBucket: "deckr-477706.appspot.com",
  messagingSenderId: "948199894623",
  appId: "1:948199894623:web:22d07ca6edbc63c1a1c2be"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function addCreditsToUser(email, creditsToAdd) {
  try {
    console.log(`\n🔍 Searching for user: ${email}`);

    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`❌ User not found: ${email}`);
      console.log('💡 Make sure the user has signed in at least once.');
      process.exit(1);
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log(`✅ Found user: ${userData.displayName || email}`);
    console.log(`   Current credits: ${userData.credits?.totalCredits || 0}`);

    // Update credits
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'credits.totalCredits': increment(creditsToAdd),
      'credits.lastUpdated': Date.now()
    });

    // Log transaction
    const transactionRef = collection(db, 'creditTransactions');
    await addDoc(transactionRef, {
      userId: userId,
      type: 'admin_bonus',
      amount: creditsToAdd,
      balanceAfter: (userData.credits?.totalCredits || 0) + creditsToAdd,
      description: 'Admin credit bonus',
      timestamp: Date.now()
    });

    console.log(`\n✅ Successfully added ${creditsToAdd} credits!`);
    console.log(`   New balance: ${(userData.credits?.totalCredits || 0) + creditsToAdd} credits`);
    console.log(`   Transaction logged in creditTransactions collection`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error adding credits:', error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length !== 2) {
  console.log('\n📝 Usage: node add-credits.js <email> <credits>');
  console.log('   Example: node add-credits.js anam.nabil1@gmail.com 1000\n');
  process.exit(1);
}

const [email, credits] = args;
const creditsToAdd = parseInt(credits, 10);

if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
  console.error('❌ Credits must be a positive number');
  process.exit(1);
}

// Run the script
addCreditsToUser(email, creditsToAdd);
