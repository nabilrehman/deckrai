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
import { UserProfile, UserPlan, UserUsage, SavedDeck, Slide, StyleLibraryItem, SavedChat, StoredChatMessage, TrialInfo } from '../types';
import { SUBSCRIPTION_PLANS } from '../config/subscriptionPlans';

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
        const existingData = userSnap.data() as UserProfile;

        // MIGRATION: Add plan and trial for old users who don't have it
        const updates: any = {
            displayName,
            photoURL,
            lastLoginAt: now
        };

        if (!existingData.plan) {
            console.log('[firestoreService] Migrating old user to trial plan:', uid);
            const trialDays = 14;
            const trialStartDate = now;
            const trialEndDate = now + (trialDays * 24 * 60 * 60 * 1000);

            updates.plan = 'trial';
            updates.trial = {
                isActive: true,
                startDate: trialStartDate,
                endDate: trialEndDate,
                daysRemaining: trialDays
            };

            if (!existingData.usage) {
                updates.usage = {
                    slidesThisMonth: 0,
                    decksThisMonth: 0,
                    monthStart: now,
                    lastUpdated: now
                };
            }

            if (!existingData.subscription) {
                updates.subscription = {
                    status: 'trialing'
                };
            }
        }

        await updateDoc(userRef, updates);

        // Return updated profile
        const updatedSnap = await getDoc(userRef);
        return updatedSnap.data() as UserProfile;
    } else {
        // Create new user with 14-day trial
        const plan: UserPlan = 'trial';
        const trialDays = 14;
        const trialStartDate = now;
        const trialEndDate = now + (trialDays * 24 * 60 * 60 * 1000);

        const trial: TrialInfo = {
            isActive: true,
            startDate: trialStartDate,
            endDate: trialEndDate,
            daysRemaining: trialDays
        };

        const newUser: UserProfile = {
            uid,
            email,
            displayName,
            photoURL,
            plan,
            trial,
            usage: {
                slidesThisMonth: 0,
                decksThisMonth: 0,
                monthStart: now,
                lastUpdated: now
            },
            subscription: {
                status: 'trialing'
            },
            createdAt: now,
            lastLoginAt: now
        };

        await setDoc(userRef, newUser);
        console.log('[firestoreService] New user created with trial:', {
            uid,
            plan,
            trialDaysRemaining: trial.daysRemaining
        });
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
    const updates: any = {
        plan,
        'subscription.status': plan === 'trial' ? 'trialing' : 'active'
    };

    // If upgrading from trial, remove trial info
    if (plan !== 'trial') {
        updates.trial = null;
    }

    await updateDoc(userRef, updates);
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
    const planConfig = SUBSCRIPTION_PLANS[userProfile.plan];
    const currentUsage = usage.slidesThisMonth;
    const limit = planConfig.slidesPerMonth;

    // -1 means unlimited
    const allowed = limit === -1 || (currentUsage + slidesToGenerate <= limit);

    return {
        allowed,
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
 * Delete ALL items from user's style library (Firestore + Storage)
 * WARNING: This permanently deletes all reference slides!
 */
export const deleteAllStyleLibraryItems = async (userId: string): Promise<void> => {
    try {
        console.log('🗑️ Starting deletion of all style library items...');

        // Step 1: Get all items from Firestore
        const libraryRef = collection(db, 'users', userId, 'styleLibrary');
        const querySnapshot = await getDocs(libraryRef);

        console.log(`📋 Found ${querySnapshot.size} items to delete`);

        // Step 2: Delete from Storage and Firestore
        const deletePromises = querySnapshot.docs.map(async (docSnapshot) => {
            const itemId = docSnapshot.id;

            // Delete from Storage
            try {
                const storagePath = `users/${userId}/styleLibrary/${itemId}.png`;
                const storageRef = ref(storage, storagePath);
                await deleteObject(storageRef);
                console.log(`✅ Deleted from Storage: ${itemId}`);
            } catch (storageError: any) {
                // Ignore "object not found" errors (item might have been deleted manually)
                if (storageError.code !== 'storage/object-not-found') {
                    console.error(`❌ Failed to delete from Storage: ${itemId}`, storageError);
                }
            }

            // Delete from Firestore
            await deleteDoc(docSnapshot.ref);
            console.log(`✅ Deleted from Firestore: ${itemId}`);
        });

        await Promise.all(deletePromises);

        console.log('✅ Successfully deleted all style library items');
    } catch (error) {
        console.error('❌ Error deleting style library items:', error);
        throw new Error(`Failed to delete style library: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
// CHAT STORAGE OPERATIONS
// ============================================================================

/**
 * Helper to convert base64 image to blob for Storage upload
 */
const imageUrlToBlob = async (imageUrl: string): Promise<Blob> => {
    if (imageUrl.startsWith('data:image/')) {
        // Already a data URL - convert directly
        return base64ToBlob(imageUrl);
    } else {
        // External URL - fetch and convert
        const response = await fetch(imageUrl);
        return await response.blob();
    }
};

/**
 * Upload chat slide images to Firebase Storage
 * Returns array of Storage URLs
 */
const uploadChatSlideImages = async (
    userId: string,
    chatId: string,
    messageId: string,
    images: string[]
): Promise<string[]> => {
    const uploadPromises = images.map(async (imgUrl, index) => {
        const blob = await imageUrlToBlob(imgUrl);
        const storagePath = `users/${userId}/chats/${chatId}/messages/${messageId}/slide_${index}.png`;
        const storageRef = ref(storage, storagePath);
        await uploadBytes(storageRef, blob);
        return await getDownloadURL(storageRef);
    });

    return await Promise.all(uploadPromises);
};

/**
 * Save a complete chat session
 */
export const saveChat = async (
    userId: string,
    chatId: string,
    messages: StoredChatMessage[],
    title?: string,
    generatedDeckId?: string
): Promise<void> => {
    const now = Date.now();

    // Auto-generate title from first user message if not provided
    const chatTitle = title || messages.find(m => m.role === 'user')?.content.slice(0, 60) || 'Untitled Chat';
    const lastMessage = messages[messages.length - 1]?.content.slice(0, 100) || '';

    // Upload slide images for all messages to Storage
    const messagesWithStorageUrls = await Promise.all(
        messages.map(async (message) => {
            if (message.slideImages && message.slideImages.length > 0) {
                // Upload images to Storage and get URLs
                const storageUrls = await uploadChatSlideImages(
                    userId,
                    chatId,
                    message.id,
                    message.slideImages
                );

                return {
                    ...message,
                    slideImages: storageUrls // Replace with Storage URLs
                };
            }
            return message;
        })
    );

    // Save chat metadata
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    const chatData: SavedChat = {
        id: chatId,
        userId,
        title: chatTitle,
        createdAt: messages[0]?.timestamp || now,
        updatedAt: now,
        lastMessage,
        messageCount: messages.length
    };

    // Only add generatedDeckId if it's defined (Firestore doesn't accept undefined)
    if (generatedDeckId) {
        chatData.generatedDeckId = generatedDeckId;
    }

    await setDoc(chatRef, chatData);

    // Save messages as subcollection
    const batch = writeBatch(db);
    messagesWithStorageUrls.forEach(message => {
        const messageRef = doc(db, 'users', userId, 'chats', chatId, 'messages', message.id);
        batch.set(messageRef, message);
    });
    await batch.commit();

    console.log(`✅ Chat saved: ${chatTitle} (${messages.length} messages)`);
};

/**
 * Get all chats for a user (metadata only)
 */
export const getUserChats = async (userId: string): Promise<SavedChat[]> => {
    const chatsRef = collection(db, 'users', userId, 'chats');
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as SavedChat);
};

/**
 * Get a specific chat with all messages
 */
export const getChat = async (
    userId: string,
    chatId: string
): Promise<{ chat: SavedChat; messages: StoredChatMessage[] } | null> => {
    // Get chat metadata
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
        return null;
    }

    // Get messages
    const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    const messagesSnapshot = await getDocs(q);

    const messages = messagesSnapshot.docs.map(doc => doc.data() as StoredChatMessage);

    return {
        chat: chatSnap.data() as SavedChat,
        messages
    };
};

/**
 * Update existing chat metadata
 */
export const updateChat = async (
    userId: string,
    chatId: string,
    updates: Partial<SavedChat>
): Promise<void> => {
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    await updateDoc(chatRef, {
        ...updates,
        updatedAt: Date.now()
    });
};

/**
 * Delete a chat and all its messages
 */
export const deleteChat = async (userId: string, chatId: string): Promise<void> => {
    // Delete all messages
    const messagesRef = collection(db, 'users', userId, 'chats', chatId, 'messages');
    const messagesSnapshot = await getDocs(messagesRef);

    const batch = writeBatch(db);
    messagesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    // Delete chat metadata
    const chatRef = doc(db, 'users', userId, 'chats', chatId);
    await deleteDoc(chatRef);

    console.log(`✅ Chat deleted: ${chatId}`);
};

/**
 * Auto-save with debouncing (500ms)
 * Call this function on every message update
 */
let autoSaveTimeout: NodeJS.Timeout | null = null;

export const autoSaveChat = (
    userId: string,
    chatId: string,
    messages: StoredChatMessage[],
    title?: string,
    generatedDeckId?: string
): void => {
    // Clear previous timeout
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }

    // Set new timeout (500ms debounce - industry standard)
    autoSaveTimeout = setTimeout(() => {
        saveChat(userId, chatId, messages, title, generatedDeckId)
            .catch(error => {
                console.error('Auto-save failed:', error);
            });
    }, 500);
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
    trialUsers: number;
    starterUsers: number;
    businessUsers: number;
    enterpriseUsers: number;
}> => {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const decksSnapshot = await getDocs(collection(db, 'decks'));

    let totalSlides = 0;
    let trialUsers = 0;
    let starterUsers = 0;
    let businessUsers = 0;
    let enterpriseUsers = 0;

    usersSnapshot.forEach(doc => {
        const user = doc.data() as UserProfile;
        totalSlides += user.usage.slidesThisMonth;

        switch (user.plan) {
            case 'trial': trialUsers++; break;
            case 'starter': starterUsers++; break;
            case 'business': businessUsers++; break;
            case 'enterprise': enterpriseUsers++; break;
        }
    });

    return {
        totalUsers: usersSnapshot.size,
        totalDecks: decksSnapshot.size,
        totalSlides,
        trialUsers,
        starterUsers,
        businessUsers,
        enterpriseUsers
    };
};
