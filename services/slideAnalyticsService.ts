/**
 * Slide Analytics Service
 *
 * Tracks and aggregates time spent per slide in decks and PDF documents.
 * Provides real-time analytics for Digital Sales Rooms.
 */

import { db } from '../config/firebase';
import {
    collection,
    doc,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp
} from 'firebase/firestore';
import {
    SlideViewEvent,
    SlideAnalytics,
    ContentEngagementAnalytics
} from '../types';

// Generate unique session ID
export const generateSessionId = (): string => {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Detect device type
export const detectDeviceType = (): 'desktop' | 'tablet' | 'mobile' => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
        return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
        return 'mobile';
    }
    return 'desktop';
};

/**
 * Record a slide view event to Firestore
 */
export const recordSlideView = async (
    workspaceId: string,
    blockId: string,
    slideIndex: number,
    sessionId: string,
    durationMs: number,
    viewer?: {
        id?: string;
        email?: string;
        name?: string;
        company?: string;
    },
    isFullscreen: boolean = false
): Promise<string | null> => {
    // Only record meaningful view times (> 500ms)
    if (durationMs < 500) return null;

    try {
        const event: Omit<SlideViewEvent, 'id'> = {
            workspaceId,
            blockId,
            slideIndex,
            viewerId: viewer?.id || null,
            viewerEmail: viewer?.email || null,
            viewerName: viewer?.name || null,
            viewerCompany: viewer?.company || null,
            sessionId,
            startTime: Date.now() - durationMs,
            endTime: Date.now(),
            durationMs,
            isFullscreen,
            deviceType: detectDeviceType(),
            timestamp: Date.now()
        };

        const docRef = await addDoc(
            collection(db, 'slideViewEvents'),
            event
        );

        console.log('[SlideAnalytics] Recorded view:', {
            slideIndex,
            durationMs: `${(durationMs / 1000).toFixed(1)}s`,
            blockId: blockId.substring(0, 8)
        });

        return docRef.id;
    } catch (error) {
        console.error('[SlideAnalytics] Error recording view:', error);
        return null;
    }
};

/**
 * Get all slide view events for a specific block
 */
export const getSlideViewEvents = async (
    workspaceId: string,
    blockId: string
): Promise<SlideViewEvent[]> => {
    try {
        // Try with composite index first
        const q = query(
            collection(db, 'slideViewEvents'),
            where('workspaceId', '==', workspaceId),
            where('blockId', '==', blockId),
            orderBy('timestamp', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as SlideViewEvent));
    } catch (error: any) {
        // If index is missing, try simpler query and filter client-side
        if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
            console.warn('[SlideAnalytics] Missing index, using fallback query. Create index at:', error?.message);

            try {
                // Fallback: query just by workspaceId and filter client-side
                const fallbackQ = query(
                    collection(db, 'slideViewEvents'),
                    where('workspaceId', '==', workspaceId)
                );
                const fallbackSnapshot = await getDocs(fallbackQ);
                const allEvents = fallbackSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as SlideViewEvent));

                // Filter by blockId client-side and sort
                return allEvents
                    .filter(e => e.blockId === blockId)
                    .sort((a, b) => b.timestamp - a.timestamp);
            } catch (fallbackError) {
                console.error('[SlideAnalytics] Fallback query also failed:', fallbackError);
                return [];
            }
        }

        console.error('[SlideAnalytics] Error fetching events:', error);
        return [];
    }
};

/**
 * Calculate aggregated analytics for a content block
 */
export const calculateContentAnalytics = (
    events: SlideViewEvent[],
    totalSlides: number,
    contentName: string,
    blockType: 'deck' | 'pdf'
): ContentEngagementAnalytics => {
    // Group events by slide
    const slideEventsMap = new Map<number, SlideViewEvent[]>();
    for (let i = 0; i < totalSlides; i++) {
        slideEventsMap.set(i, []);
    }

    events.forEach(event => {
        const existing = slideEventsMap.get(event.slideIndex) || [];
        existing.push(event);
        slideEventsMap.set(event.slideIndex, existing);
    });

    // Calculate per-slide analytics
    const slideAnalytics: SlideAnalytics[] = [];
    const uniqueSessionsTotal = new Set(events.map(e => e.sessionId));

    for (let i = 0; i < totalSlides; i++) {
        const slideEvents = slideEventsMap.get(i) || [];
        const uniqueViewers = new Set(slideEvents.map(e => e.sessionId)).size;
        const totalTimeMs = slideEvents.reduce((sum, e) => sum + e.durationMs, 0);
        const maxTime = slideEvents.length > 0
            ? Math.max(...slideEvents.map(e => e.durationMs))
            : 0;

        slideAnalytics.push({
            slideIndex: i,
            totalViews: slideEvents.length,
            uniqueViewers,
            totalTimeSpentMs: totalTimeMs,
            avgTimeSpentMs: slideEvents.length > 0 ? totalTimeMs / slideEvents.length : 0,
            maxTimeSpentMs: maxTime,
            completionRate: uniqueSessionsTotal.size > 0
                ? (uniqueViewers / uniqueSessionsTotal.size) * 100
                : 0
        });
    }

    // Find hotspots (top 20% by avg time spent)
    const sortedByTime = [...slideAnalytics]
        .sort((a, b) => b.avgTimeSpentMs - a.avgTimeSpentMs);
    const hotspotCount = Math.max(1, Math.ceil(totalSlides * 0.2));
    const hotspots = sortedByTime.slice(0, hotspotCount).map(s => s.slideIndex);

    // Find drop-off points (slides with significant viewer drop)
    const dropoffs: number[] = [];
    for (let i = 1; i < slideAnalytics.length; i++) {
        const prevCompletion = slideAnalytics[i - 1].completionRate;
        const currCompletion = slideAnalytics[i].completionRate;
        // More than 20% drop = drop-off point
        if (prevCompletion - currCompletion > 20) {
            dropoffs.push(i);
        }
    }

    // Calculate totals
    const totalTimeSpentMs = events.reduce((sum, e) => sum + e.durationMs, 0);
    const avgCompletionRate = slideAnalytics.reduce((sum, s) => sum + s.completionRate, 0) / totalSlides;

    return {
        blockId: events[0]?.blockId || '',
        blockType,
        contentName,
        totalSlides,
        totalViews: events.length,
        uniqueViewers: uniqueSessionsTotal.size,
        avgCompletionRate,
        totalTimeSpentMs,
        avgTimeSpentMs: uniqueSessionsTotal.size > 0 ? totalTimeSpentMs / uniqueSessionsTotal.size : 0,
        slideAnalytics,
        hotspots,
        dropoffs,
        lastUpdated: Date.now()
    };
};

/**
 * Get complete content engagement analytics
 */
export const getContentEngagementAnalytics = async (
    workspaceId: string,
    blockId: string,
    totalSlides: number,
    contentName: string,
    blockType: 'deck' | 'pdf'
): Promise<ContentEngagementAnalytics> => {
    const events = await getSlideViewEvents(workspaceId, blockId);
    return calculateContentAnalytics(events, totalSlides, contentName, blockType);
};

/**
 * Format duration for display
 */
export const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = Math.round((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
};

/**
 * Get engagement level based on time spent
 */
export const getEngagementLevel = (
    avgTimeMs: number,
    expectedReadTimeMs: number = 10000
): 'low' | 'medium' | 'high' => {
    const ratio = avgTimeMs / expectedReadTimeMs;
    if (ratio < 0.3) return 'low';
    if (ratio < 0.7) return 'medium';
    return 'high';
};
