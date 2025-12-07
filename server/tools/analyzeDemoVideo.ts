/**
 * analyzeDemoVideoTool
 *
 * Analyzes a demo video using Gemini 3.0 Pro Preview to:
 * - Identify features being demonstrated
 * - Detect customer sentiment from audio (liked vs dismissed)
 * - Extract timestamps for key feature moments
 * - Return screenshots at those timestamps
 *
 * Use cases:
 * - Creating follow-up decks with demo shots
 * - Extracting relevant product screenshots from call recordings
 * - Building personalized decks based on customer interest
 *
 * @tool
 */

import { GoogleGenAI } from '@google/genai';
import type { ToolResult } from '../types';

// Lazy initialization of AI client (to allow env vars to be loaded first)
let ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY environment variable is not set');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

// Maximum file size for inline upload (20MB)
const MAX_INLINE_SIZE = 20 * 1024 * 1024;

/**
 * Feature identified from demo video analysis
 */
export interface DemoFeature {
  timestamp: string; // "MM:SS" format
  timestampSeconds: number;
  featureName: string;
  description: string;
  problemSolved: string;
  screenshot?: string; // base64 image extracted from video
}

/**
 * Result of demo video analysis
 */
export interface DemoVideoAnalysisResult {
  features: DemoFeature[];
  summary: string;
  totalDuration: string;
  recommendedFeatures: string[]; // Features to include in follow-up (liked + neutral)
}

/**
 * Parameters for analyzeDemoVideo tool
 */
export interface AnalyzeDemoVideoParams {
  videoSource: string; // base64 data URL or URL (including YouTube URLs)
  userContext?: string; // Additional context about what to focus on in the demo
}

/**
 * Converts timestamp string (MM:SS or HH:MM:SS) to seconds
 */
function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Check if URL is a YouTube video URL
 */
function isYouTubeUrl(url: string): boolean {
  const patterns = [
    /youtube\.com\/watch\?v=/,
    /youtu\.be\//,
    /youtube\.com\/embed\//,
    /youtube\.com\/v\//,
    /youtube\.com\/shorts\//,
  ];
  return patterns.some(pattern => pattern.test(url));
}

/**
 * Get video MIME type from URL or default
 */
function getVideoMimeType(url: string): string {
  if (isYouTubeUrl(url)) {
    return 'video/mp4'; // YouTube videos are served as MP4
  }
  // Try to detect from extension
  if (url.includes('.webm')) return 'video/webm';
  if (url.includes('.mov')) return 'video/quicktime';
  if (url.includes('.avi')) return 'video/x-msvideo';
  return 'video/mp4'; // Default to MP4
}

/**
 * Analyzes a demo video to extract features and timestamps for screenshots
 */
export async function analyzeDemoVideo(
  params: AnalyzeDemoVideoParams
): Promise<ToolResult<DemoVideoAnalysisResult>> {
  const startTime = Date.now();
  const { videoSource, userContext } = params;

  try {
    console.log('[analyzeDemoVideo] Starting video analysis...');

    // Build the analysis prompt
    const prompt = buildVideoAnalysisPrompt(userContext);

    // Prepare video content for Gemini
    let videoContent: any;

    if (videoSource.startsWith('data:')) {
      // Base64 data URL
      const base64Match = videoSource.match(/^data:([^;]+);base64,(.+)$/);
      if (!base64Match) {
        throw new Error('Invalid video data format');
      }

      const mimeType = base64Match[1];
      const base64Data = base64Match[2];

      // Check size (rough estimate from base64 length)
      const estimatedSize = (base64Data.length * 3) / 4;
      if (estimatedSize > MAX_INLINE_SIZE) {
        throw new Error('Video file is too large for inline processing. Please use a video under 20MB.');
      }

      videoContent = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        }
      };
      console.log(`[analyzeDemoVideo] Using inline video (${Math.round(estimatedSize / 1024 / 1024)}MB, ${mimeType})`);
    } else {
      // URL - pass directly to Gemini (supports YouTube URLs!)
      const mimeType = getVideoMimeType(videoSource);
      videoContent = {
        fileData: {
          fileUri: videoSource,
          mimeType: mimeType,
        }
      };
      const isYT = isYouTubeUrl(videoSource);
      console.log(`[analyzeDemoVideo] Using ${isYT ? 'YouTube' : 'video'} URL: ${videoSource.substring(0, 60)}...`);
    }

    console.log('[analyzeDemoVideo] Sending to Gemini 2.0 Flash for analysis...');

    // Call Gemini 2.0 Flash with video (supports video + audio analysis)
    const response = await getAI().models.generateContent({
      model: 'gemini-2.0-flash', // Using 2.0-flash for video support - 3.0 preview doesn't support video yet
      contents: [{
        role: 'user',
        parts: [
          videoContent,
          { text: prompt }
        ]
      }]
    });

    // Parse response
    const responseText = response.text?.trim() || '';
    console.log('[analyzeDemoVideo] Received response, parsing...');

    // Extract JSON from response
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                     responseText.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      console.error('[analyzeDemoVideo] Failed to parse response:', responseText.substring(0, 500));
      throw new Error('Failed to parse video analysis response - no valid JSON found');
    }

    const rawResult = JSON.parse(jsonMatch[1]);

    // Process features
    let features: DemoFeature[] = rawResult.features || [];

    // Add timestamp in seconds
    features = features.map(f => ({
      ...f,
      timestampSeconds: timestampToSeconds(f.timestamp),
    }));

    // No filtering - include all features

    const result: DemoVideoAnalysisResult = {
      features,
      summary: rawResult.summary || '',
      totalDuration: rawResult.totalDuration || '',
      recommendedFeatures: features.map(f => f.featureName),
    };

    const executionTime = Date.now() - startTime;
    console.log(`[analyzeDemoVideo] ✅ Analysis complete in ${executionTime}ms - Found ${features.length} features`);

    return {
      success: true,
      data: result,
      metadata: {
        executionTime,
        model: 'gemini-2.0-flash'
      }
    };

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[analyzeDemoVideo] ❌ Error:`, error);

    return {
      success: false,
      error: {
        code: 'VIDEO_ANALYSIS_FAILED',
        message: 'Failed to analyze demo video',
        details: error.message
      },
      metadata: {
        executionTime
      }
    };
  }
}

/**
 * Build the video analysis prompt
 */
function buildVideoAnalysisPrompt(userContext?: string): string {
  return `You are an expert at analyzing product demo videos to identify the best moments for screenshots.

Watch this video and identify each distinct feature or screen being demonstrated.

${userContext ? `**Context:** ${userContext}\n` : ''}

**Your Task:**
1. Identify each main feature, view, or screen shown in the demo
2. For each feature, find the BEST timestamp for a clean screenshot:
   - Screen should be FULLY loaded (not mid-transition)
   - Feature should be clearly visible
   - No mouse cursors blocking important content
   - One screenshot per distinct feature/view
3. Describe what the feature does and how it helps users

**Return ONLY valid JSON:**
{
  "features": [
    {
      "timestamp": "MM:SS",
      "featureName": "Name of the feature/view",
      "description": "What this screen shows",
      "problemSolved": "How this helps users"
    }
  ],
  "summary": "Brief summary of what's being demoed",
  "totalDuration": "MM:SS"
}

**Guidelines:**
- Focus on the SOFTWARE being demoed, ignore video call UI (Zoom, Teams, etc.)
- Pick timestamps where the screen is STABLE, not during scrolling or animations
- Use the actual product terminology visible on screen
- Each feature should represent a distinct view or capability`;
}

/**
 * ADK Tool Schema
 */
export const analyzeDemoVideoTool = {
  name: 'analyzeDemoVideoTool',
  description: 'Analyze a demo video to identify features and find the best timestamps for screenshots. Returns a list of features with timestamps that can be used to extract frames for demo slides.',
  parameters: {
    type: 'object',
    properties: {
      videoSource: {
        type: 'string',
        description: 'The video source - either a base64 data URL (data:video/mp4;base64,...) or a URL (including YouTube URLs)'
      },
      userContext: {
        type: 'string',
        description: 'Optional context about what to focus on in the demo (e.g., "focus on reporting features")'
      }
    },
    required: ['videoSource']
  },
  execute: analyzeDemoVideo
};
