import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { CreditBalance, UserProfile } from '../types';
import { useAuth } from '../hooks/useAuth';

/**
 * Custom hook for real-time credit balance tracking
 * Automatically subscribes to Firestore changes and updates when credits change
 */
export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setCredits(null);
      setCreditBalance(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Set up real-time listener on user document
    const userRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;

          if (data.credits) {
            setCredits(data.credits.totalCredits);
            setCreditBalance(data.credits);
          } else {
            // Handle legacy users without credits
            setCredits(0);
            setCreditBalance(null);
          }
        } else {
          setError('User profile not found');
          setCredits(null);
          setCreditBalance(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error listening to credit balance:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);

  // Helper functions
  const hasEnoughCredits = (required: number): boolean => {
    return credits !== null && credits >= required;
  };

  const isLowOnCredits = (): boolean => {
    return credits !== null && credits > 0 && credits <= 3;
  };

  const isOutOfCredits = (): boolean => {
    return credits === 0;
  };

  return {
    credits,
    creditBalance,
    loading,
    error,
    hasEnoughCredits,
    isLowOnCredits,
    isOutOfCredits
  };
};
