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

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || '' });

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
  sentiment: 'liked' | 'neutral' | 'dismissed';
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
  userContext?: string; // Additional context about what the customer cares about
  includeNeutral?: boolean; // Whether to include neutral sentiment features (default: true)
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
 * Analyzes a demo video to extract features with sentiment and timestamps
 */
export async function analyzeDemoVideo(
  params: AnalyzeDemoVideoParams
): Promise<ToolResult<DemoVideoAnalysisResult>> {
  const startTime = Date.now();
  const { videoSource, userContext, includeNeutral = true } = params;

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

    console.log('[analyzeDemoVideo] Sending to Gemini 3.0 Pro Preview for analysis...');

    // Call Gemini 3.0 Pro Preview with video
    const response = await ai.models.generateContent({
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

    // Filter based on sentiment
    if (!includeNeutral) {
      features = features.filter(f => f.sentiment === 'liked');
    } else {
      features = features.filter(f => f.sentiment !== 'dismissed');
    }

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
  return `You are an expert at analyzing product demo videos and sales calls.
Watch this entire video carefully and identify each distinct feature or capability being demonstrated.

${userContext ? `**User Context:** ${userContext}\n` : ''}

**Your Task:**
1. Watch the full video and identify every main feature/capability being shown
2. For each feature, note the EXACT timestamp when it's clearly visible on screen
   - ONE screenshot moment per main activity (not button clicks or transitions)
   - Choose moments where the feature is fully visible and clear
3. Listen to the audio - detect customer/viewer reactions:
   - **liked**: "I love this", "this is exactly what we need", "amazing", excited tone, asking follow-up questions
   - **neutral**: No clear reaction, just observing, "okay", "I see"
   - **dismissed**: "nah", "skip this", "we don't need", "not important for us", "let's move on"
4. Describe what problem each feature solves for the customer

**Return ONLY valid JSON in this exact format:**
{
  "features": [
    {
      "timestamp": "MM:SS",
      "featureName": "Feature Name",
      "description": "Brief description of what the feature does",
      "problemSolved": "How this feature helps solve a customer problem",
      "sentiment": "liked" | "neutral" | "dismissed"
    }
  ],
  "summary": "Brief 1-2 sentence summary of the demo",
  "totalDuration": "MM:SS"
}

**Critical Guidelines:**
- Focus on the PRODUCT/SOFTWARE being demonstrated, not the call interface (Zoom, Teams, etc.)
- If there's a screen share, analyze what's being shown in the shared screen
- Choose timestamps where the feature is FULLY visible and the screen is STABLE (not during scrolling or transitions)
- If you can't clearly detect sentiment from audio, default to "neutral"
- Be specific about feature names - use the actual product terminology if visible
- For problemSolved, connect to business value (save time, reduce cost, improve efficiency, etc.)`;
}

/**
 * ADK Tool Schema
 */
export const analyzeDemoVideoTool = {
  name: 'analyzeDemoVideoTool',
  description: 'Analyze a demo video to extract features shown, detect customer sentiment from audio, and identify timestamps for screenshots. Use this when creating follow-up decks with demo shots.',
  parameters: {
    type: 'object',
    properties: {
      videoSource: {
        type: 'string',
        description: 'The video source - either a base64 data URL (data:video/mp4;base64,...) or a URL to the video'
      },
      userContext: {
        type: 'string',
        description: 'Optional context about what the customer cares about or what to focus on in the analysis'
      },
      includeNeutral: {
        type: 'boolean',
        description: 'Whether to include features with neutral sentiment (default: true). Set to false to only include features the customer clearly liked.'
      }
    },
    required: ['videoSource']
  },
  execute: analyzeDemoVideo
};
