import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, listAll, deleteObject } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDR7uyLYHS-u9عرض7s3xZ8KqXxN3vKrGVYtE",
  authDomain: "deckr-477706.firebaseapp.com",
  projectId: "deckr-477706",
  storageBucket: "deckr-477706.firebasestorage.app",
  messagingSenderId: "404945494823",
  appId: "1:404945494823:web:a7f5e8e3c2b1d9f0e4c5a6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

const EMAIL = 'anam.nabil1@gmail.com';

async function deleteAllStyleLibraryForUser() {
  try {
    // Find user by email
    console.log(`🔍 Looking for user with email: ${EMAIL}`);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', EMAIL));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('❌ No user found with that email');
      return;
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    console.log(`✅ Found user: ${userId}`);

    // Delete from Firestore
    console.log('🗑️ Deleting Firestore documents...');
    const styleLibraryRef = collection(db, 'users', userId, 'styleLibrary');
    const styleLibrarySnap = await getDocs(styleLibraryRef);

    let firestoreCount = 0;
    for (const docSnap of styleLibrarySnap.docs) {
      await deleteDoc(doc(db, 'users', userId, 'styleLibrary', docSnap.id));
      firestoreCount++;
    }
    console.log(`✅ Deleted ${firestoreCount} items from Firestore`);

    // Delete from Storage
    console.log('🗑️ Deleting Storage files...');
    const storageRef = ref(storage, `users/${userId}/styleLibrary`);

    try {
      const listResult = await listAll(storageRef);
      let storageCount = 0;

      for (const itemRef of listResult.items) {
        await deleteObject(itemRef);
        storageCount++;
      }
      console.log(`✅ Deleted ${storageCount} files from Storage`);
    } catch (error) {
      if (error.code === 'storage/object-not-found') {
        console.log('ℹ️ No files in Storage (already empty)');
      } else {
        throw error;
      }
    }

    console.log('✅ All style library items deleted successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

deleteAllStyleLibraryForUser();
