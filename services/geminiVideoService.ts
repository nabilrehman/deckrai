/**
 * Gemini Video Service
 * Handles sending videos to Gemini 3.0 Pro Preview for analysis
 * Supports both file uploads and URL inputs (YouTube, cloud storage)
 */

import { GoogleGenAI } from "@google/genai";
import { VideoAsset, DemoFeature, VideoAnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Supported video formats
export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/mpeg',
  'video/mov',
  'video/quicktime',
  'video/webm',
  'video/avi',
  'video/x-msvideo',
  'video/x-matroska', // mkv
];

export const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mpeg', '.mpg', '.mov', '.webm', '.avi', '.mkv'];

// Maximum file size for inline upload (20MB)
const MAX_INLINE_SIZE = 20 * 1024 * 1024;

// Re-export types for convenience
export type { VideoAsset, DemoFeature, VideoAnalysisResult };

/**
 * Validates if a file is a supported video format
 */
export function isValidVideoFile(file: File): boolean {
  return SUPPORTED_VIDEO_FORMATS.includes(file.type) ||
         SUPPORTED_VIDEO_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
}

/**
 * Extracts YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Checks if a URL is a YouTube video
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeVideoId(url) !== null;
}

/**
 * Converts a File to base64 data URL
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Extracts thumbnail from video at a specific time
 */
export async function extractVideoThumbnail(
  videoSource: string,
  timeSeconds: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeSeconds, video.duration);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };

    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = videoSource;
    video.load();
  });
}

/**
 * Gets video duration
 */
export async function getVideoDuration(videoSource: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => resolve(video.duration);
    video.onerror = () => reject(new Error('Failed to load video metadata'));
    video.src = videoSource;
    video.load();
  });
}

/**
 * Creates a VideoAsset from a File
 */
export async function createVideoAssetFromFile(file: File): Promise<VideoAsset> {
  if (!isValidVideoFile(file)) {
    throw new Error(`Unsupported video format: ${file.type || file.name}`);
  }

  const base64 = await fileToBase64(file);
  const thumbnail = await extractVideoThumbnail(base64).catch(() => undefined);
  const duration = await getVideoDuration(base64).catch(() => undefined);

  return {
    id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: file.name,
    type: 'file',
    mimeType: file.type || 'video/mp4',
    size: file.size,
    source: base64,
    duration,
    thumbnail,
  };
}

/**
 * Creates a VideoAsset from a URL
 */
export async function createVideoAssetFromUrl(url: string): Promise<VideoAsset> {
  const isYouTube = isYouTubeUrl(url);
  const videoId = isYouTube ? extractYouTubeVideoId(url) : null;

  return {
    id: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: videoId ? `YouTube: ${videoId}` : url.split('/').pop() || 'Video',
    type: 'url',
    mimeType: 'video/mp4', // Default, actual format determined by Gemini
    source: url,
    // For YouTube, we could potentially fetch thumbnail from YouTube API
    thumbnail: videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : undefined,
  };
}

/**
 * Extracts a frame from video at a specific timestamp
 */
export async function extractFrameAtTimestamp(
  videoSource: string,
  timestampSeconds: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';

    video.onloadedmetadata = () => {
      if (timestampSeconds > video.duration) {
        timestampSeconds = video.duration - 1;
      }
      video.currentTime = timestampSeconds;
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };

    video.onerror = () => reject(new Error('Failed to load video for frame extraction'));
    video.src = videoSource;
    video.load();
  });
}

/**
 * Converts timestamp string (MM:SS or HH:MM:SS) to seconds
 */
export function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Converts seconds to timestamp string (MM:SS)
 */
export function secondsToTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Analyzes a demo video using Gemini 2.0 Flash
 * Returns features with timestamps and descriptions for screenshot extraction
 */
export async function analyzeDemoVideo(
  video: VideoAsset,
  userContext?: string,
  onProgress?: (message: string) => void
): Promise<VideoAnalysisResult> {
  onProgress?.('Preparing video for analysis...');

  const prompt = `You are an expert at analyzing product demo videos to identify the best moments for screenshots.

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

  try {
    onProgress?.('Sending video to Gemini for analysis...');

    // Prepare video content for Gemini
    let videoContent: { inlineData: { data: string; mimeType: string } } | { fileData: { fileUri: string } };

    if (video.type === 'file' && video.source.startsWith('data:')) {
      // Extract base64 data from data URL
      const base64Match = video.source.match(/^data:([^;]+);base64,(.+)$/);
      if (!base64Match) {
        throw new Error('Invalid video data format');
      }

      const mimeType = base64Match[1];
      const base64Data = base64Match[2];

      // Check if file is small enough for inline upload
      const estimatedSize = (base64Data.length * 3) / 4; // Approximate original size
      if (estimatedSize > MAX_INLINE_SIZE) {
        throw new Error('Video file is too large. Please use a video under 20MB or provide a URL.');
      }

      videoContent = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        }
      };
    } else if (video.type === 'url') {
      // For URLs, we'll need to use the File API or pass the URL directly
      // Gemini can handle YouTube URLs and other video URLs
      videoContent = {
        fileData: {
          fileUri: video.source,
        }
      };
    } else {
      throw new Error('Invalid video source');
    }

    onProgress?.('Analyzing video content and audio...');

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Using 2.0 flash for video as it has better video support
      contents: [
        {
          role: 'user',
          parts: [
            videoContent as any,
            { text: prompt }
          ]
        }
      ],
    });

    const responseText = result.text?.trim() || '';

    // Parse JSON from response
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                     responseText.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      console.error('Failed to parse video analysis response:', responseText);
      throw new Error('Failed to parse video analysis results');
    }

    const analysisResult: VideoAnalysisResult = JSON.parse(jsonMatch[1]);

    // Add timestamp in seconds to each feature
    analysisResult.features = analysisResult.features.map(f => ({
      ...f,
      timestampSeconds: timestampToSeconds(f.timestamp),
    }));

    onProgress?.(`Found ${analysisResult.features.length} features`);

    return analysisResult;

  } catch (error: any) {
    console.error('Video analysis error:', error);
    return {
      features: [],
      summary: '',
      totalDuration: '',
      error: error.message || 'Failed to analyze video',
    };
  }
}

/**
 * Extracts screenshots for all features identified in the video
 */
export async function extractFeatureScreenshots(
  video: VideoAsset,
  features: DemoFeature[],
  onProgress?: (message: string, current: number, total: number) => void
): Promise<DemoFeature[]> {
  const featuresWithScreenshots: DemoFeature[] = [];

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    onProgress?.(`Extracting screenshot for "${feature.featureName}"...`, i + 1, features.length);

    try {
      const screenshot = await extractFrameAtTimestamp(
        video.source,
        feature.timestampSeconds
      );

      featuresWithScreenshots.push({
        ...feature,
        screenshot,
      });
    } catch (error) {
      console.error(`Failed to extract screenshot for ${feature.featureName}:`, error);
      // Add feature without screenshot
      featuresWithScreenshots.push(feature);
    }
  }

  return featuresWithScreenshots;
}

/**
 * Cleans up a screenshot to remove call UI (Zoom, Teams, etc.)
 * Uses Gemini to identify and describe just the product demo area
 */
export async function cleanDemoScreenshot(
  screenshot: string,
  featureContext: string,
  onProgress?: (message: string) => void
): Promise<string> {
  onProgress?.('Cleaning screenshot to focus on demo content...');

  // For MVP, we'll return the screenshot as-is
  // In a future iteration, we could use Gemini image editing to crop out call UI
  // or use vision to identify the demo area bounds and crop

  return screenshot;
}
