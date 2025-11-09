import {
    signInWithPopup,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../config/firebase';

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Google sign-in successful:', result.user.email);
        return result.user;
    } catch (error: any) {
        console.error('Google sign-in error:', error);
        throw new Error(error.message || 'Failed to sign in with Google');
    }
};

// Sign in with Facebook
export const signInWithFacebook = async (): Promise<User> => {
    try {
        const result = await signInWithPopup(auth, facebookProvider);
        console.log('Facebook sign-in successful:', result.user.email);
        return result.user;
    } catch (error: any) {
        console.error('Facebook sign-in error:', error);
        throw new Error(error.message || 'Failed to sign in with Facebook');
    }
};

// Sign out
export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
        console.log('User signed out successfully');
    } catch (error: any) {
        console.error('Sign-out error:', error);
        throw new Error(error.message || 'Failed to sign out');
    }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): User | null => {
    return auth.currentUser;
};
