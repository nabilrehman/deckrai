/**
 * useSlideAnalytics - Hook for tracking slide view analytics
 *
 * Usage:
 * const { trackSlideView, sessionId } = useSlideAnalytics({
 *   workspaceId: 'ws_123',
 *   blockId: 'block_456',
 *   viewer: { email: 'viewer@example.com' }
 * });
 *
 * // When slide changes:
 * trackSlideView(previousSlideIndex, timeSpentMs);
 */

import { useRef, useCallback, useEffect } from 'react';
import {
    recordSlideView,
    generateSessionId
} from '../services/slideAnalyticsService';

interface UseSlideAnalyticsProps {
    workspaceId: string;
    blockId: string;
    viewer?: {
        id?: string;
        email?: string;
        name?: string;
        company?: string;
    };
    enabled?: boolean; // Allow disabling analytics (e.g., in edit mode)
}

interface UseSlideAnalyticsReturn {
    trackSlideView: (slideIndex: number, durationMs: number, isFullscreen?: boolean) => Promise<void>;
    sessionId: string;
    startSlideTimer: () => void;
    getElapsedTime: () => number;
}

export const useSlideAnalytics = ({
    workspaceId,
    blockId,
    viewer,
    enabled = true
}: UseSlideAnalyticsProps): UseSlideAnalyticsReturn => {
    const sessionIdRef = useRef<string>(generateSessionId());
    const slideStartTimeRef = useRef<number>(Date.now());
    const pendingTrackRef = useRef<Promise<void> | null>(null);

    // Reset session on mount
    useEffect(() => {
        sessionIdRef.current = generateSessionId();
        slideStartTimeRef.current = Date.now();
    }, [workspaceId, blockId]);

    // Start/reset the slide timer
    const startSlideTimer = useCallback(() => {
        slideStartTimeRef.current = Date.now();
    }, []);

    // Get elapsed time since timer started
    const getElapsedTime = useCallback(() => {
        return Date.now() - slideStartTimeRef.current;
    }, []);

    // Track a slide view
    const trackSlideView = useCallback(async (
        slideIndex: number,
        durationMs: number,
        isFullscreen: boolean = false
    ): Promise<void> => {
        if (!enabled) return;

        // Don't track very short views (< 500ms)
        if (durationMs < 500) return;

        // Wait for any pending track to complete
        if (pendingTrackRef.current) {
            await pendingTrackRef.current;
        }

        pendingTrackRef.current = (async () => {
            try {
                await recordSlideView(
                    workspaceId,
                    blockId,
                    slideIndex,
                    sessionIdRef.current,
                    durationMs,
                    viewer,
                    isFullscreen
                );
            } catch (error) {
                console.error('Error tracking slide view:', error);
            } finally {
                pendingTrackRef.current = null;
            }
        })();

        await pendingTrackRef.current;
    }, [workspaceId, blockId, viewer, enabled]);

    // Track final slide on unmount
    useEffect(() => {
        return () => {
            const finalDuration = Date.now() - slideStartTimeRef.current;
            if (finalDuration > 500 && enabled) {
                // Fire and forget on unmount
                recordSlideView(
                    workspaceId,
                    blockId,
                    -1, // Special index to indicate "last viewed"
                    sessionIdRef.current,
                    finalDuration,
                    viewer,
                    false
                ).catch(() => {
                    // Ignore errors on unmount
                });
            }
        };
    }, [workspaceId, blockId, viewer, enabled]);

    return {
        trackSlideView,
        sessionId: sessionIdRef.current,
        startSlideTimer,
        getElapsedTime
    };
};

export default useSlideAnalytics;
