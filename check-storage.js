// Diagnostic script to check Firebase Storage and Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getStorage, ref, listAll } from 'firebase/storage';

// Firebase config from your project
const firebaseConfig = {
  apiKey: "AIzaSyAZ_okPdyJlvKZYRlvDUqMdoD6IFIJJjVg",
  authDomain: "deckr-477706.firebaseapp.com",
  projectId: "deckr-477706",
  storageBucket: "deckr-477706.firebasestorage.app",
  messagingSenderId: "948199894623",
  appId: "1:948199894623:web:0f3b8a81e8ef78866fa3a3",
  measurementId: "G-WMMDD59DME"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function checkStyleLibrary(userId) {
  console.log(`\n🔍 Checking style library for user: ${userId}\n`);

  // Check Firestore
  console.log('📋 FIRESTORE CHECK:');
  console.log('==================');
  try {
    const libraryRef = collection(db, 'users', userId, 'styleLibrary');
    const querySnapshot = await getDocs(libraryRef);

    console.log(`✅ Found ${querySnapshot.size} items in Firestore`);

    querySnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n[${index + 1}] Document ID: ${doc.id}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Created: ${new Date(data.createdAt).toLocaleString()}`);
      console.log(`   Storage URL: ${data.src.substring(0, 80)}...`);
    });
  } catch (error) {
    console.error('❌ Firestore error:', error.message);
  }

  // Check Storage
  console.log('\n\n📦 FIREBASE STORAGE CHECK:');
  console.log('==========================');
  try {
    const storageRef = ref(storage, `users/${userId}/styleLibrary`);
    const listResult = await listAll(storageRef);

    console.log(`✅ Found ${listResult.items.length} files in Storage`);

    listResult.items.forEach((itemRef, index) => {
      console.log(`[${index + 1}] ${itemRef.name}`);
    });
  } catch (error) {
    console.error('❌ Storage error:', error.message);
  }
}

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a user ID as argument');
  console.log('Usage: node check-storage.js <userId>');
  process.exit(1);
}

checkStyleLibrary(userId).then(() => {
  console.log('\n✅ Check complete!\n');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Error:', error);
  process.exit(1);
});
