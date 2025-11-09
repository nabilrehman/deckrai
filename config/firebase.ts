import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase config for deckr-477706
const firebaseConfig = {
    apiKey: "AIzaSyAZ_o-Jyi7ZQnsXPY8-l3TWgoHU_5dKOhQ",
    authDomain: "deckr-477706.firebaseapp.com",
    projectId: "deckr-477706",
    storageBucket: "deckr-477706.firebasestorage.app",
    messagingSenderId: "948199894623",
    appId: "1:948199894623:web:5211c1c6467b7f7e3635ea",
    measurementId: "G-6M0668ZXVJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Auth providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

export default app;
