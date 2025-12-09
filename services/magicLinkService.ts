/**
 * Magic Link Service
 *
 * Handles creation, validation, and tracking of shared deck magic links.
 * This enables the "Digital Sales Room" feature where users can share
 * decks via unique URLs and track viewer engagement.
 */

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    addDoc,
    increment,
    serverTimestamp,
    onSnapshot,
    Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getDeck } from './firestoreService';
import { createViewNotification } from './notificationService';

// ============================================================================
// TYPES
// ============================================================================

export interface SharedSlide {
    id: string;
    imageUrl: string;  // The latest version of the slide
    name: string;
}

export interface SharedDeck {
    magicLinkId: string;
    deckId: string;
    userId: string;          // Deck owner
    deckName: string;
    thumbnailUrl?: string;
    slides: SharedSlide[];   // Embedded slide data for public access
    slideCount: number;
    createdAt: number;
    totalViews: number;
    uniqueViewers: number;
}

export interface DeckView {
    id?: string;
    viewerEmail?: string;
    viewerName?: string;
    viewedAt: number;
    device: 'desktop' | 'mobile' | 'tablet';
    userAgent?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a cryptographically secure magic link ID
 * Uses a combination of random bytes encoded in base64url format
 */
const generateMagicLinkId = (): string => {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);

    // Convert to base64url (URL-safe base64)
    const base64 = btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return base64;
};

/**
 * Detect device type from user agent
 */
const detectDevice = (userAgent: string): 'desktop' | 'mobile' | 'tablet' => {
    const ua = userAgent.toLowerCase();

    if (/tablet|ipad|playbook|silk/i.test(ua)) {
        return 'tablet';
    }

    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
        return 'mobile';
    }

    return 'desktop';
};

// ============================================================================
// MAGIC LINK OPERATIONS
// ============================================================================

/**
 * Helper to get the latest version of a slide image
 */
const getLatestSlideImage = (slide: { history: string[]; originalSrc: string }): string => {
    return slide.history[slide.history.length - 1] || slide.originalSrc;
};

/**
 * Create a new magic link for sharing a deck
 */
export const createMagicLink = async (
    deckId: string,
    userId: string
): Promise<{ magicLinkId: string; shareUrl: string }> => {
    // Get deck details
    const deck = await getDeck(deckId);
    if (!deck) {
        throw new Error('Deck not found');
    }

    // Verify ownership
    if (deck.userId !== userId) {
        throw new Error('You can only share your own decks');
    }

    // Check if a magic link already exists for this deck
    const existingLink = await getMagicLinkByDeckId(deckId);
    if (existingLink) {
        const shareUrl = `${window.location.origin}/view/${existingLink.magicLinkId}`;
        return { magicLinkId: existingLink.magicLinkId, shareUrl };
    }

    // Generate new magic link
    const magicLinkId = generateMagicLinkId();

    // Extract slide data for embedding (only what's needed for public viewing)
    const slides: SharedSlide[] = deck.slides.map(slide => ({
        id: slide.id,
        imageUrl: getLatestSlideImage(slide),
        name: slide.name
    }));

    const sharedDeck: SharedDeck = {
        magicLinkId,
        deckId,
        userId,
        deckName: deck.name,
        thumbnailUrl: deck.thumbnailUrl,
        slides,
        slideCount: slides.length,
        createdAt: Date.now(),
        totalViews: 0,
        uniqueViewers: 0
    };

    // Save to Firestore
    const sharedDeckRef = doc(db, 'sharedDecks', magicLinkId);
    await setDoc(sharedDeckRef, sharedDeck);

    console.log(`✅ Created magic link: ${magicLinkId} for deck: ${deckId}`);

    const shareUrl = `${window.location.origin}/view/${magicLinkId}`;
    return { magicLinkId, shareUrl };
};

/**
 * Get magic link by deck ID (to check if one already exists)
 */
export const getMagicLinkByDeckId = async (deckId: string): Promise<SharedDeck | null> => {
    const sharedDecksRef = collection(db, 'sharedDecks');
    const q = query(sharedDecksRef, where('deckId', '==', deckId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    return querySnapshot.docs[0].data() as SharedDeck;
};

/**
 * Get shared deck by magic link ID
 */
export const getSharedDeck = async (magicLinkId: string): Promise<SharedDeck | null> => {
    const sharedDeckRef = doc(db, 'sharedDecks', magicLinkId);
    const sharedDeckSnap = await getDoc(sharedDeckRef);

    if (!sharedDeckSnap.exists()) {
        return null;
    }

    return sharedDeckSnap.data() as SharedDeck;
};

/**
 * Get full deck data for viewing (includes slides)
 * Note: Slides are embedded in sharedDeck, so this just returns the shared deck
 * which includes all the data needed for public viewing.
 */
export const getSharedDeckWithSlides = async (magicLinkId: string): Promise<SharedDeck | null> => {
    const sharedDeck = await getSharedDeck(magicLinkId);

    if (!sharedDeck) {
        return null;
    }

    // Check if this link has been revoked
    if ('deleted' in sharedDeck && (sharedDeck as any).deleted) {
        return null;
    }

    return sharedDeck;
};

/**
 * Revoke/delete a magic link
 */
export const revokeMagicLink = async (magicLinkId: string, userId: string): Promise<void> => {
    const sharedDeck = await getSharedDeck(magicLinkId);

    if (!sharedDeck) {
        throw new Error('Magic link not found');
    }

    if (sharedDeck.userId !== userId) {
        throw new Error('You can only revoke your own shared links');
    }

    // Delete the shared deck document
    const sharedDeckRef = doc(db, 'sharedDecks', magicLinkId);
    await setDoc(sharedDeckRef, { deleted: true, deletedAt: Date.now() }, { merge: true });

    console.log(`✅ Revoked magic link: ${magicLinkId}`);
};

// ============================================================================
// VIEW TRACKING
// ============================================================================

/**
 * Record a view event when someone views a shared deck
 */
export const recordView = async (
    magicLinkId: string,
    viewerEmail?: string,
    viewerName?: string
): Promise<void> => {
    console.log('[recordView] Starting for magicLinkId:', magicLinkId);

    const sharedDeck = await getSharedDeck(magicLinkId);
    if (!sharedDeck) {
        console.error('[recordView] Cannot record view: shared deck not found');
        return;
    }
    console.log('[recordView] Found sharedDeck, owner:', sharedDeck.userId);

    const userAgent = navigator.userAgent;
    const device = detectDevice(userAgent);

    // Note: Firestore doesn't allow undefined values, so we only include fields that have values
    const view: DeckView = {
        viewedAt: Date.now(),
        device,
        userAgent,
        // Only include email/name if they exist (Firestore rejects undefined)
        ...(viewerEmail && { viewerEmail }),
        ...(viewerName && { viewerName })
    };

    // Add view to subcollection
    try {
        const viewsRef = collection(db, 'sharedDecks', magicLinkId, 'views');
        await addDoc(viewsRef, view);
        console.log('[recordView] ✅ Added view to subcollection');
    } catch (err) {
        console.error('[recordView] ❌ Failed to add view:', err);
    }

    // Update view counts on shared deck
    try {
        const sharedDeckRef = doc(db, 'sharedDecks', magicLinkId);
        await updateDoc(sharedDeckRef, {
            totalViews: increment(1),
            uniqueViewers: increment(viewerEmail ? 1 : 0)
        });
        console.log('[recordView] ✅ Updated view counts');
    } catch (err) {
        console.error('[recordView] ❌ Failed to update view counts:', err);
    }

    // Create notification for deck owner
    try {
        console.log('[recordView] Creating notification for user:', sharedDeck.userId);
        await createViewNotification(
            sharedDeck.userId,
            sharedDeck.deckName,
            sharedDeck.deckId,
            viewerEmail,
            viewerName
        );
        console.log('[recordView] ✅ Created notification');
    } catch (err) {
        console.error('[recordView] ❌ Failed to create notification:', err);
    }

    console.log(`[recordView] ✅ Completed for magic link: ${magicLinkId}`);
};

/**
 * Get all views for a shared deck
 */
export const getViewsForDeck = async (magicLinkId: string): Promise<DeckView[]> => {
    const viewsRef = collection(db, 'sharedDecks', magicLinkId, 'views');
    const querySnapshot = await getDocs(viewsRef);

    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as DeckView));
};

/**
 * Get all shared decks for a user (to show in analytics)
 */
export const getUserSharedDecks = async (userId: string): Promise<SharedDeck[]> => {
    const sharedDecksRef = collection(db, 'sharedDecks');
    const q = query(sharedDecksRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs
        .map(doc => doc.data() as SharedDeck)
        .filter(deck => !('deleted' in deck)); // Filter out deleted links
};

/**
 * Subscribe to real-time view updates for a shared deck
 */
export const subscribeToViews = (
    magicLinkId: string,
    onViewsUpdate: (views: DeckView[]) => void
): Unsubscribe => {
    const viewsRef = collection(db, 'sharedDecks', magicLinkId, 'views');

    return onSnapshot(viewsRef, (snapshot) => {
        const views = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as DeckView));

        onViewsUpdate(views);
    });
};
