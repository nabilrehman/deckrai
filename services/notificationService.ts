/**
 * Notification Service
 *
 * Handles creating, fetching, and managing in-app notifications.
 * Used by the Digital Sales Room feature to notify deck owners
 * when their shared decks are viewed.
 */

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
    onSnapshot,
    Unsubscribe,
    writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType = 'view' | 'comment' | 'share' | 'system' | 'upgrade';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    createdAt: number;
    isRead: boolean;
    actionUrl?: string;
    metadata?: {
        deckId?: string;
        deckName?: string;
        viewerEmail?: string;
        viewerName?: string;
        magicLinkId?: string;
    };
}

// ============================================================================
// CREATE NOTIFICATIONS
// ============================================================================

/**
 * Create a notification for when someone views a shared deck
 */
export const createViewNotification = async (
    userId: string,
    deckName: string,
    deckId: string,
    viewerEmail?: string,
    viewerName?: string
): Promise<string> => {
    console.log('[createViewNotification] Starting with params:', { userId, deckName, deckId, viewerEmail, viewerName });

    const viewerDisplay = viewerName || viewerEmail || 'Someone';

    // Note: Firestore doesn't allow undefined values, so we filter them out
    const metadata: Notification['metadata'] = {
        deckId,
        deckName,
        // Only include email/name if they exist (Firestore rejects undefined)
        ...(viewerEmail && { viewerEmail }),
        ...(viewerName && { viewerName })
    };

    const notification: Omit<Notification, 'id'> = {
        type: 'view',
        title: 'New deck view',
        message: `${viewerDisplay} viewed "${deckName}"`,
        createdAt: Date.now(),
        isRead: false,
        actionUrl: `/app?deck=${deckId}`,
        metadata
    };

    console.log('[createViewNotification] Notification object:', notification);
    console.log('[createViewNotification] Writing to path: users/' + userId + '/notifications');

    try {
        const notificationsRef = collection(db, 'users', userId, 'notifications');
        const docRef = await addDoc(notificationsRef, notification);
        console.log(`[createViewNotification] ✅ Created notification with ID: ${docRef.id} for user: ${userId}`);
        return docRef.id;
    } catch (err: any) {
        console.error('[createViewNotification] ❌ Failed to create notification:', err);
        console.error('[createViewNotification] Error code:', err.code);
        console.error('[createViewNotification] Error message:', err.message);
        throw err;
    }
};

/**
 * Create a generic notification
 */
export const createNotification = async (
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: Notification['metadata'],
    actionUrl?: string
): Promise<string> => {
    const notification: Omit<Notification, 'id'> = {
        type,
        title,
        message,
        createdAt: Date.now(),
        isRead: false,
        actionUrl,
        metadata
    };

    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const docRef = await addDoc(notificationsRef, notification);

    return docRef.id;
};

// ============================================================================
// FETCH NOTIFICATIONS
// ============================================================================

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (
    userId: string,
    limitCount: number = 50
): Promise<Notification[]> => {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(
        notificationsRef,
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Notification));
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, where('isRead', '==', false));

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
};

// ============================================================================
// UPDATE NOTIFICATIONS
// ============================================================================

/**
 * Mark a single notification as read
 */
export const markAsRead = async (userId: string, notificationId: string): Promise<void> => {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, { isRead: true });
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId: string): Promise<void> => {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, where('isRead', '==', false));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return;

    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
        batch.update(doc.ref, { isRead: true });
    });

    await batch.commit();
    console.log(`✅ Marked ${querySnapshot.size} notifications as read`);
};

/**
 * Delete a notification
 */
export const deleteNotification = async (userId: string, notificationId: string): Promise<void> => {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await deleteDoc(notificationRef);
};

/**
 * Delete all notifications for a user
 */
export const deleteAllNotifications = async (userId: string): Promise<void> => {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const querySnapshot = await getDocs(notificationsRef);

    if (querySnapshot.empty) return;

    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`✅ Deleted all notifications for user: ${userId}`);
};

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

/**
 * Subscribe to real-time notification updates
 * Returns an unsubscribe function
 */
export const subscribeToNotifications = (
    userId: string,
    onUpdate: (notifications: Notification[]) => void
): Unsubscribe => {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(50));

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Notification));

        onUpdate(notifications);
    }, (error) => {
        console.error('Error subscribing to notifications:', error);
    });
};

/**
 * Subscribe to unread count updates
 */
export const subscribeToUnreadCount = (
    userId: string,
    onUpdate: (count: number) => void
): Unsubscribe => {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, where('isRead', '==', false));

    return onSnapshot(q, (snapshot) => {
        onUpdate(snapshot.size);
    }, (error) => {
        console.error('Error subscribing to unread count:', error);
    });
};

// ============================================================================
// UTILITY: Format timestamp for display
// ============================================================================

/**
 * Format a timestamp into a human-readable relative time
 */
export const formatNotificationTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;

    // For older notifications, show the date
    return new Date(timestamp).toLocaleDateString();
};
