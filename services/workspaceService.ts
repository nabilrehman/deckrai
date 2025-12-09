/**
 * Workspace Service
 * 
 * Manages CRUD operations for Digital Sales Room (DSR) Workspaces.
 * Handles the "Workspace Engine" logic including template instantiation
 * and block management.
 */

import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    getDocs,
    deleteDoc,
    serverTimestamp,
    increment,
    addDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Workspace, WorkspaceBlock, WorkspaceStatus } from '../types';

// Session storage key for tracking unique views
const VIEW_SESSION_KEY = 'workspace_views';
const ACTIVITIES_COLLECTION = 'activities';

const WORKSPACES_COLLECTION = 'workspaces';

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new Workspace (Deal Room)
 */
export const createWorkspace = async (
    userId: string,
    title: string,
    templateId?: string
): Promise<Workspace> => {
    const now = Date.now();
    const workspaceId = `ws_${userId}_${now}`;

    let blocks: WorkspaceBlock[] = [];

    // If cloning from a template, fetch template blocks first
    if (templateId) {
        const template = await getWorkspace(templateId);
        if (template) {
            // Deep clone blocks to give them new IDs if needed (or keep same for simplicity for now)
            blocks = JSON.parse(JSON.stringify(template.blocks));
        }
    }

    const workspace: Workspace = {
        id: workspaceId,
        ownerId: userId,
        title,
        blocks,
        layout: 'single-column',
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        ...(templateId ? { templateId } : {})
    };

    await setDoc(doc(db, WORKSPACES_COLLECTION, workspaceId), workspace);
    return workspace;
};

/**
 * Get a Workspace by ID
 */
export const getWorkspace = async (workspaceId: string): Promise<Workspace | null> => {
    const snap = await getDoc(doc(db, WORKSPACES_COLLECTION, workspaceId));
    if (snap.exists()) {
        return snap.data() as Workspace;
    }
    return null;
};

/**
 * Update Workspace metadata or blocks
 */
export const updateWorkspace = async (
    workspaceId: string,
    updates: Partial<Workspace>
): Promise<void> => {
    await updateDoc(doc(db, WORKSPACES_COLLECTION, workspaceId), {
        ...updates,
        updatedAt: Date.now()
    });
};

/**
 * Delete a Workspace
 */
export const deleteWorkspace = async (workspaceId: string): Promise<void> => {
    await deleteDoc(doc(db, WORKSPACES_COLLECTION, workspaceId));
};

/**
 * List all workspaces for a user
 */
export const getUserWorkspaces = async (userId: string): Promise<Workspace[]> => {
    const q = query(
        collection(db, WORKSPACES_COLLECTION),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
    );

    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Workspace);
};

// ============================================================================
// BLOCK MANAGEMENT
// ============================================================================

/**
 * Add a new block to a workspace
 */
export const addBlockToWorkspace = async (
    workspaceId: string,
    block: WorkspaceBlock
): Promise<void> => {
    const workspace = await getWorkspace(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    const updatedBlocks = [...workspace.blocks, block];

    await updateWorkspace(workspaceId, { blocks: updatedBlocks });
};

/**
 * Remove a block from a workspace
 */
export const removeBlockFromWorkspace = async (
    workspaceId: string,
    blockId: string
): Promise<void> => {
    const workspace = await getWorkspace(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    const updatedBlocks = workspace.blocks.filter(b => b.id !== blockId);

    await updateWorkspace(workspaceId, { blocks: updatedBlocks });
};

/**
 * Reorder blocks (Drag & Drop persistence)
 */
export const reorderBlocks = async (
    workspaceId: string,
    orderedBlocks: WorkspaceBlock[]
): Promise<void> => {
    // Verify count matches to prevent accidental data loss
    const workspace = await getWorkspace(workspaceId);
    if (!workspace) throw new Error('Workspace not found');

    if (workspace.blocks.length !== orderedBlocks.length) {
        console.warn('Block count mismatch during reorder, proceeding with client order');
    }

    await updateWorkspace(workspaceId, { blocks: orderedBlocks });
};

// ============================================================================
// ANALYTICS / VIEW TRACKING
// ============================================================================

/**
 * Record a view of a workspace
 * Tracks total views and unique viewers (per session)
 */
export const recordWorkspaceView = async (
    workspaceId: string,
    viewerInfo?: {
        email?: string;
        name?: string;
        company?: string;
    }
): Promise<void> => {
    try {
        // Check if this is a unique view (per session)
        const viewedWorkspaces = JSON.parse(sessionStorage.getItem(VIEW_SESSION_KEY) || '[]');
        const isUniqueView = !viewedWorkspaces.includes(workspaceId);

        // Get current workspace to check if analytics exists
        const workspaceRef = doc(db, WORKSPACES_COLLECTION, workspaceId);
        const workspaceSnap = await getDoc(workspaceRef);

        if (!workspaceSnap.exists()) {
            console.error('[WorkspaceService] Workspace not found:', workspaceId);
            return;
        }

        const currentData = workspaceSnap.data();
        const currentAnalytics = currentData?.analytics || { totalViews: 0, uniqueViewers: 0 };

        // Build the new analytics object
        const newAnalytics = {
            totalViews: (currentAnalytics.totalViews || 0) + 1,
            uniqueViewers: isUniqueView
                ? (currentAnalytics.uniqueViewers || 0) + 1
                : (currentAnalytics.uniqueViewers || 0),
            lastViewedAt: Date.now()
        };

        // Update the workspace
        await updateDoc(workspaceRef, {
            analytics: newAnalytics
        });

        // Mark this workspace as viewed in this session
        if (isUniqueView) {
            viewedWorkspaces.push(workspaceId);
            sessionStorage.setItem(VIEW_SESSION_KEY, JSON.stringify(viewedWorkspaces));
        }

        // Also record the activity in a subcollection for detailed tracking
        const activityRef = collection(db, WORKSPACES_COLLECTION, workspaceId, 'activities');
        await addDoc(activityRef, {
            type: 'view',
            timestamp: Date.now(),
            viewerEmail: viewerInfo?.email || null,
            viewerName: viewerInfo?.name || null,
            viewerCompany: viewerInfo?.company || null,
            isUnique: isUniqueView,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
        });

        console.log('[WorkspaceService] View recorded for workspace:', workspaceId, newAnalytics);
    } catch (error) {
        console.error('[WorkspaceService] Error recording view:', error);
        // Don't throw - view tracking shouldn't break the app
    }
};

/**
 * Record block engagement (when user interacts with a specific block)
 */
export const recordBlockEngagement = async (
    workspaceId: string,
    blockId: string,
    blockType: 'video' | 'pdf' | 'deck' | 'embed' | 'text' | 'map',
    action: 'view' | 'play' | 'download' | 'expand' | 'interact',
    details?: {
        durationMs?: number;
        progress?: number; // 0-100 for videos
        pageNumber?: number; // for PDFs
        slideIndex?: number; // for decks
    },
    viewerInfo?: {
        email?: string;
        name?: string;
        company?: string;
    }
): Promise<void> => {
    try {
        const activityRef = collection(db, WORKSPACES_COLLECTION, workspaceId, ACTIVITIES_COLLECTION);
        await addDoc(activityRef, {
            type: 'block_engagement',
            blockId,
            blockType,
            action,
            details: details || {},
            viewerEmail: viewerInfo?.email || null,
            viewerName: viewerInfo?.name || null,
            viewerCompany: viewerInfo?.company || null,
            timestamp: Date.now(),
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
        });

        console.log('[WorkspaceService] Block engagement recorded:', { blockType, action });
    } catch (error) {
        console.error('[WorkspaceService] Error recording block engagement:', error);
    }
};

/**
 * Record video watch progress
 */
export const recordVideoProgress = async (
    workspaceId: string,
    blockId: string,
    progress: number, // 0-100
    durationWatchedMs: number,
    totalDurationMs: number,
    viewerInfo?: {
        email?: string;
        name?: string;
        company?: string;
    }
): Promise<void> => {
    await recordBlockEngagement(workspaceId, blockId, 'video', 'play', {
        progress,
        durationMs: durationWatchedMs
    }, viewerInfo);
};

/**
 * Record PDF page view
 */
export const recordPDFPageView = async (
    workspaceId: string,
    blockId: string,
    pageNumber: number,
    totalPages: number,
    durationMs: number,
    viewerInfo?: {
        email?: string;
        name?: string;
        company?: string;
    }
): Promise<void> => {
    await recordBlockEngagement(workspaceId, blockId, 'pdf', 'view', {
        pageNumber,
        durationMs,
        progress: Math.round((pageNumber / totalPages) * 100)
    }, viewerInfo);
};

/**
 * Get all activities for a workspace (for analytics dashboard)
 */
export const getWorkspaceActivities = async (
    workspaceId: string,
    limit: number = 100
): Promise<any[]> => {
    try {
        const q = query(
            collection(db, WORKSPACES_COLLECTION, workspaceId, ACTIVITIES_COLLECTION),
            orderBy('timestamp', 'desc')
        );

        const snap = await getDocs(q);
        return snap.docs.slice(0, limit).map(d => ({
            id: d.id,
            ...d.data()
        }));
    } catch (error) {
        console.error('[WorkspaceService] Error fetching activities:', error);
        return [];
    }
};

/**
 * Get engagement summary for a workspace
 */
export const getWorkspaceEngagementSummary = async (
    workspaceId: string
): Promise<{
    totalViews: number;
    uniqueViewers: number;
    avgTimeSpent: number;
    blockEngagement: Record<string, { views: number; avgDuration: number }>;
    recentViewers: Array<{ email?: string; name?: string; timestamp: number }>;
}> => {
    const activities = await getWorkspaceActivities(workspaceId, 500);

    // Calculate summary
    const viewActivities = activities.filter(a => a.type === 'view');
    const blockActivities = activities.filter(a => a.type === 'block_engagement');

    // Block engagement map
    const blockEngagement: Record<string, { views: number; totalDuration: number }> = {};
    blockActivities.forEach(a => {
        if (!blockEngagement[a.blockId]) {
            blockEngagement[a.blockId] = { views: 0, totalDuration: 0 };
        }
        blockEngagement[a.blockId].views++;
        blockEngagement[a.blockId].totalDuration += a.details?.durationMs || 0;
    });

    // Format block engagement
    const formattedBlockEngagement: Record<string, { views: number; avgDuration: number }> = {};
    Object.entries(blockEngagement).forEach(([blockId, data]) => {
        formattedBlockEngagement[blockId] = {
            views: data.views,
            avgDuration: data.views > 0 ? data.totalDuration / data.views : 0
        };
    });

    // Recent viewers
    const uniqueViewerMap = new Map<string, { email?: string; name?: string; timestamp: number }>();
    viewActivities.forEach(a => {
        const key = a.viewerEmail || a.sessionId || `anon_${a.timestamp}`;
        if (!uniqueViewerMap.has(key)) {
            uniqueViewerMap.set(key, {
                email: a.viewerEmail,
                name: a.viewerName,
                timestamp: a.timestamp
            });
        }
    });

    return {
        totalViews: viewActivities.length,
        uniqueViewers: uniqueViewerMap.size,
        avgTimeSpent: 0, // Would need session duration tracking
        blockEngagement: formattedBlockEngagement,
        recentViewers: Array.from(uniqueViewerMap.values()).slice(0, 10)
    };
};
