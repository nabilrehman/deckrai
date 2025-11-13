import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    deleteDoc,
    serverTimestamp,
    Timestamp,
    increment,
    writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { UserProfile, UserPlan, UserUsage, SavedDeck, Slide, PLAN_LIMITS, StyleLibraryItem } from '../types';

// ============================================================================
// USER PROFILE OPERATIONS
// ============================================================================

/**
 * Create or update user profile in Firestore
 */
export const createOrUpdateUserProfile = async (
    uid: string,
    email: string,
    displayName: string,
    photoURL?: string
): Promise<UserProfile> => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    const now = Date.now();

    if (userSnap.exists()) {
        // Update existing user
        await updateDoc(userRef, {
            displayName,
            photoURL,
            lastLoginAt: now
        });
        return userSnap.data() as UserProfile;
    } else {
        // Create new user with default free plan
        const newUser: UserProfile = {
            uid,
            email,
            displayName,
            photoURL,
            plan: 'free',
            usage: {
                slidesThisMonth: 0,
                decksThisMonth: 0,
                monthStart: now,
                lastUpdated: now
            },
            subscription: {
                status: 'none'
            },
            createdAt: now,
            lastLoginAt: now
        };

        await setDoc(userRef, newUser);
        return newUser;
    }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        return userSnap.data() as UserProfile;
    }
    return null;
};

/**
 * Update user's plan
 */
export const updateUserPlan = async (uid: string, plan: UserPlan): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        plan,
        'subscription.status': plan === 'free' ? 'none' : 'active'
    });
};

// ============================================================================
// USAGE TRACKING
// ============================================================================

/**
 * Check if monthly usage counter needs to be reset
 */
const shouldResetUsage = (monthStart: number): boolean => {
    const now = new Date();
    const monthStartDate = new Date(monthStart);

    return now.getMonth() !== monthStartDate.getMonth() ||
           now.getFullYear() !== monthStartDate.getFullYear();
};

/**
 * Get user's current usage with auto-reset if new month
 */
export const getUserUsage = async (uid: string): Promise<UserUsage> => {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        throw new Error('User profile not found');
    }

    const userData = userSnap.data() as UserProfile;
    const usage = userData.usage;

    // Check if we need to reset monthly counters
    if (shouldResetUsage(usage.monthStart)) {
        const now = Date.now();
        const resetUsage: UserUsage = {
            slidesThisMonth: 0,
            decksThisMonth: 0,
            monthStart: now,
            lastUpdated: now
        };

        await updateDoc(userRef, { usage: resetUsage });
        return resetUsage;
    }

    return usage;
};

/**
 * Increment slide generation count
 */
export const incrementSlideCount = async (uid: string, count: number = 1): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        'usage.slidesThisMonth': increment(count),
        'usage.lastUpdated': Date.now()
    });
};

/**
 * Increment deck generation count
 */
export const incrementDeckCount = async (uid: string): Promise<void> => {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
        'usage.decksThisMonth': increment(1),
        'usage.lastUpdated': Date.now()
    });
};

/**
 * Check if user has reached their usage limit
 */
export const checkUsageLimit = async (uid: string, slidesToGenerate: number): Promise<{
    allowed: boolean;
    currentUsage: number;
    limit: number;
    plan: UserPlan;
}> => {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) {
        throw new Error('User profile not found');
    }

    const usage = await getUserUsage(uid);
    const limits = PLAN_LIMITS[userProfile.plan];
    const currentUsage = usage.slidesThisMonth;
    const limit = limits.slidesPerMonth;

    return {
        allowed: currentUsage + slidesToGenerate <= limit,
        currentUsage,
        limit,
        plan: userProfile.plan
    };
};

// ============================================================================
// STORAGE OPERATIONS (for deck images)
// ============================================================================

/**
 * Convert base64 string to Blob
 */
const base64ToBlob = (base64: string): Blob => {
    const parts = base64.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
};

/**
 * Upload a single image to Firebase Storage and return the download URL
 */
const uploadImageToStorage = async (
    base64Image: string,
    path: string
): Promise<string> => {
    // If it's already a URL (starts with http/https), return it as-is
    if (base64Image.startsWith('http://') || base64Image.startsWith('https://')) {
        return base64Image;
    }

    const blob = base64ToBlob(base64Image);
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
};

/**
 * Upload all images in a slide to Storage and return a new slide with URLs
 */
const uploadSlideImages = async (
    slide: Slide,
    userId: string,
    deckId: string
): Promise<Slide> => {
    const slideId = slide.id;

    // Upload all history images
    const historyUrls = await Promise.all(
        slide.history.map((img, index) =>
            uploadImageToStorage(img, `decks/${userId}/${deckId}/${slideId}/history_${index}.png`)
        )
    );

    // Upload pending personalization variations if they exist
    let pendingPersonalization = slide.pendingPersonalization;
    if (pendingPersonalization?.variations) {
        const variationUrls = await Promise.all(
            pendingPersonalization.variations.map((img, index) =>
                uploadImageToStorage(img, `decks/${userId}/${deckId}/${slideId}/variation_${index}.png`)
            )
        );
        pendingPersonalization = {
            ...pendingPersonalization,
            variations: variationUrls
        };
    }

    // Return slide with URLs instead of base64
    // Only include optional fields if they exist (Firestore doesn't allow undefined values)
    const slideWithUrls: Slide = {
        id: slide.id,
        name: slide.name,
        originalSrc: historyUrls[0], // First history item is original
        history: historyUrls
    };

    if (pendingPersonalization) {
        slideWithUrls.pendingPersonalization = pendingPersonalization;
    }

    if (slide.isInStyleLibrary !== undefined) {
        slideWithUrls.isInStyleLibrary = slide.isInStyleLibrary;
    }

    return slideWithUrls;
};

// ============================================================================
// DECK OPERATIONS
// ============================================================================

/**
 * Save a deck to Firestore (uploads images to Storage first)
 */
export const saveDeck = async (
    userId: string,
    deckName: string,
    slides: Slide[]
): Promise<SavedDeck> => {
    const now = Date.now();
    const deckId = `deck_${userId}_${now}`;

    // Upload all slide images to Firebase Storage and get URLs
    const slidesWithUrls = await Promise.all(
        slides.map(slide => uploadSlideImages(slide, userId, deckId))
    );

    // Get thumbnail URL (first slide's current version)
    const thumbnailUrl = slidesWithUrls[0]?.history[slidesWithUrls[0].history.length - 1] || '';

    const deck: SavedDeck = {
        id: deckId,
        userId,
        name: deckName,
        slides: slidesWithUrls, // Use slides with Storage URLs instead of base64
        createdAt: now,
        updatedAt: now,
        slideCount: slidesWithUrls.length,
        thumbnailUrl
    };

    const deckRef = doc(db, 'decks', deckId);
    await setDoc(deckRef, deck);

    // Increment deck count
    await incrementDeckCount(userId);

    return deck;
};

/**
 * Get all decks for a user
 */
export const getUserDecks = async (userId: string, limitCount: number = 50): Promise<SavedDeck[]> => {
    const decksRef = collection(db, 'decks');
    const q = query(
        decksRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as SavedDeck);
};

/**
 * Get a specific deck by ID
 */
export const getDeck = async (deckId: string): Promise<SavedDeck | null> => {
    const deckRef = doc(db, 'decks', deckId);
    const deckSnap = await getDoc(deckRef);

    if (deckSnap.exists()) {
        return deckSnap.data() as SavedDeck;
    }
    return null;
};

/**
 * Update an existing deck (uploads new images to Storage)
 */
export const updateDeck = async (
    deckId: string,
    deckName: string,
    slides: Slide[]
): Promise<void> => {
    // Get existing deck to retrieve userId
    const deckRef = doc(db, 'decks', deckId);
    const deckSnap = await getDoc(deckRef);

    if (!deckSnap.exists()) {
        throw new Error('Deck not found');
    }

    const userId = deckSnap.data().userId;

    // Upload all slide images to Firebase Storage and get URLs
    const slidesWithUrls = await Promise.all(
        slides.map(slide => uploadSlideImages(slide, userId, deckId))
    );

    const thumbnailUrl = slidesWithUrls[0]?.history[slidesWithUrls[0].history.length - 1] || '';

    await updateDoc(deckRef, {
        name: deckName,
        slides: slidesWithUrls,
        updatedAt: Date.now(),
        slideCount: slidesWithUrls.length,
        thumbnailUrl
    });
};

/**
 * Delete a deck
 */
export const deleteDeck = async (deckId: string): Promise<void> => {
    const deckRef = doc(db, 'decks', deckId);
    await deleteDoc(deckRef);
};

// ============================================================================
// STYLE LIBRARY OPERATIONS
// ============================================================================

/**
 * Add an item to user's style library
 */
export const addToStyleLibrary = async (
    userId: string,
    item: StyleLibraryItem
): Promise<void> => {
    const itemRef = doc(db, 'users', userId, 'styleLibrary', item.id);
    await setDoc(itemRef, {
        ...item,
        createdAt: Date.now()
    });
};

/**
 * Get all style library items for a user
 */
export const getUserStyleLibrary = async (userId: string): Promise<StyleLibraryItem[]> => {
    const libraryRef = collection(db, 'users', userId, 'styleLibrary');
    const q = query(libraryRef, orderBy('createdAt', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: data.id,
            src: data.src,
            name: data.name
        } as StyleLibraryItem;
    });
};

/**
 * Remove an item from user's style library
 */
export const removeFromStyleLibrary = async (
    userId: string,
    itemId: string
): Promise<void> => {
    const itemRef = doc(db, 'users', userId, 'styleLibrary', itemId);
    await deleteDoc(itemRef);
};

/**
 * Batch add multiple items to style library
 *
 * Uploads images to Firebase Storage and stores metadata in Firestore.
 * - Storage: Actual image files (no size limit)
 * - Firestore: Metadata with Storage URLs (small, efficient queries)
 */
export const batchAddToStyleLibrary = async (
    userId: string,
    items: StyleLibraryItem[]
): Promise<void> => {
    const now = Date.now();
    console.log(`📤 Uploading ${items.length} reference slides to Firebase Storage...`);

    // Step 1: Upload all images to Storage in parallel
    const uploadPromises = items.map(async (item, index) => {
        try {
            // Convert base64 to blob
            const base64Data = item.src.split(',')[1];
            const mimeType = item.src.match(/data:(.*?);/)?.[1] || 'image/png';
            const blob = base64ToBlob(`data:${mimeType};base64,${base64Data}`);

            // Upload to Firebase Storage
            const storagePath = `users/${userId}/styleLibrary/${item.id}.png`;
            const storageRef = ref(storage, storagePath);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);

            console.log(`✅ Uploaded ${index + 1}/${items.length}: ${item.name}`);

            // Return metadata with Storage URL
            return {
                id: item.id,
                name: item.name,
                src: downloadURL, // Storage URL, not base64
                createdAt: now,
            };
        } catch (error) {
            console.error(`❌ Failed to upload ${item.name}:`, error);
            throw error;
        }
    });

    const uploadedItems = await Promise.all(uploadPromises);

    // Step 2: Save metadata to Firestore (tiny URLs, no size limit issues)
    const batch = writeBatch(db);
    uploadedItems.forEach(item => {
        const itemRef = doc(db, 'users', userId, 'styleLibrary', item.id);
        batch.set(itemRef, item);
    });

    await batch.commit();
    console.log(`✅ Successfully saved ${items.length} items to Firestore`);
};

// ============================================================================
// ADMIN OPERATIONS
// ============================================================================

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (limitCount: number = 100): Promise<UserProfile[]> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'), limit(limitCount));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as UserProfile);
};

/**
 * Get total usage statistics (admin only)
 */
export const getTotalUsageStats = async (): Promise<{
    totalUsers: number;
    totalDecks: number;
    totalSlides: number;
    freeUsers: number;
    proUsers: number;
    enterpriseUsers: number;
}> => {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const decksSnapshot = await getDocs(collection(db, 'decks'));

    let totalSlides = 0;
    let freeUsers = 0;
    let proUsers = 0;
    let enterpriseUsers = 0;

    usersSnapshot.forEach(doc => {
        const user = doc.data() as UserProfile;
        totalSlides += user.usage.slidesThisMonth;

        switch (user.plan) {
            case 'free': freeUsers++; break;
            case 'pro': proUsers++; break;
            case 'enterprise': enterpriseUsers++; break;
        }
    });

    return {
        totalUsers: usersSnapshot.size,
        totalDecks: decksSnapshot.size,
        totalSlides,
        freeUsers,
        proUsers,
        enterpriseUsers
    };
};
