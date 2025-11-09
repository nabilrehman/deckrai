import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    getUserProfile,
    getUserUsage,
    checkUsageLimit,
    createOrUpdateUserProfile
} from '../services/firestoreService';
import { UserProfile, UserUsage, UserPlan, PLAN_LIMITS } from '../types';

interface UseUserUsageReturn {
    userProfile: UserProfile | null;
    usage: UserUsage | null;
    loading: boolean;
    error: string | null;
    refreshUsage: () => Promise<void>;
    checkLimit: (slidesToGenerate: number) => Promise<{
        allowed: boolean;
        currentUsage: number;
        limit: number;
        plan: UserPlan;
    }>;
}

/**
 * Custom hook to manage user profile and usage tracking
 */
export const useUserUsage = (): UseUserUsageReturn => {
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [usage, setUsage] = useState<UserUsage | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadUserData = async () => {
        if (!user) {
            setUserProfile(null);
            setUsage(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Get or create user profile
            let profile = await getUserProfile(user.uid);

            if (!profile) {
                // Create new profile if it doesn't exist
                profile = await createOrUpdateUserProfile(
                    user.uid,
                    user.email || '',
                    user.displayName || 'User',
                    user.photoURL || undefined
                );
            }

            // Get current usage (with auto-reset if new month)
            const currentUsage = await getUserUsage(user.uid);

            setUserProfile(profile);
            setUsage(currentUsage);
        } catch (err: any) {
            console.error('Error loading user data:', err);
            setError(err.message || 'Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    // Load user data on mount and when user changes
    useEffect(() => {
        loadUserData();
    }, [user?.uid]);

    const refreshUsage = async () => {
        if (user) {
            await loadUserData();
        }
    };

    const checkLimit = async (slidesToGenerate: number) => {
        if (!user) {
            throw new Error('User not authenticated');
        }
        return checkUsageLimit(user.uid, slidesToGenerate);
    };

    return {
        userProfile,
        usage,
        loading,
        error,
        refreshUsage,
        checkLimit
    };
};
