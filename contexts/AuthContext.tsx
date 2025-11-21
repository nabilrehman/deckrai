import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, signInWithGoogle, signInWithFacebook, signOut } from '../services/authService';
import { createOrUpdateUserProfile } from '../services/firestoreService';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<User>;
    signInWithFacebook: () => Promise<User>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (user) => {
            setUser(user);

            // Create or update user profile in Firestore when user signs in
            if (user) {
                try {
                    await createOrUpdateUserProfile(
                        user.uid,
                        user.email || '',
                        user.displayName || '',
                        user.photoURL || ''
                    );
                    console.log('✅ User profile created/updated in Firestore');
                } catch (error) {
                    console.error('❌ Error creating user profile:', error);
                }
            }

            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        user,
        loading,
        signInWithGoogle,
        signInWithFacebook,
        signOut
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
