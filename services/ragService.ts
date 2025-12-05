/**
 * RAG Service Client
 *
 * Client-side service for interacting with the Slide RAG Engine API.
 * Handles indexing slides and searching for similar slides.
 *
 * Enhanced with classification-based filtering for intelligent slide selection.
 */

// RAG API URL - configurable via environment variable
const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8081';

/**
 * Slide classification metadata
 */
export interface SlideClassification {
  // Sales/business context
  salesStage: 'outreach' | 'qualification' | 'consideration' | 'decision' | 'post-sale' | 'general';
  persona: 'c-suite' | 'technical' | 'business' | 'practitioner' | 'general';
  contentType: 'title' | 'problem' | 'solution' | 'features' | 'benefits' | 'proof' | 'comparison' | 'pricing' | 'technical' | 'team' | 'cta' | 'agenda' | 'divider' | 'content';

  // Visual characteristics
  visualElements: Array<'screenshots' | 'charts' | 'icons' | 'photos' | 'diagrams' | 'illustrations' | 'tables' | 'text-heavy' | 'minimal-text'>;
  layout: 'title-centered' | 'title-left' | 'split-50-50' | 'split-30-70' | 'split-70-30' | 'grid-2x2' | 'grid-3-col' | 'grid-4-col' | 'timeline-horizontal' | 'timeline-vertical' | 'comparison' | 'full-bleed' | 'content-centered' | 'content-left';
  visualStyle: 'minimal' | 'corporate' | 'modern' | 'bold' | 'creative' | 'data-heavy' | 'professional';

  // Content hints
  contentHints: {
    hasMetrics: boolean;
    hasQuote: boolean;
    hasLogo: boolean;
    hasProductUI: boolean;
    hasPeople: boolean;
    hasProcess: boolean;
    hasBullets: boolean;
    hasCallToAction: boolean;
  };

  // Quality indicators
  confidence: number;
  dominantColors: string[];
  textDensity: 'low' | 'medium' | 'high';

  // Extracted text
  extractedTitle?: string;
  extractedKeywords?: string[];
}

/**
 * Classification filters for searching
 */
export interface ClassificationFilters {
  contentType?: string | string[];
  layout?: string | string[];
  visualStyle?: string | string[];
  persona?: string | string[];
  salesStage?: string | string[];
  visualElements?: string[];
  hasMetrics?: boolean;
  hasScreenshots?: boolean;
  hasCharts?: boolean;
  hasIcons?: boolean;
}

/**
 * Search result with classification
 */
export interface SlideSearchResult {
  slideId: string;
  deckId: string;
  deckName: string;
  slideIndex: number;
  imageUrl: string;
  score: number;
  visibility: 'public' | 'private';
  classification?: SlideClassification;
}

/**
 * Index a deck with all its slides to RAG
 */
export async function indexDeckToRAG(
  deckName: string,
  slides: Array<{ imageUrl: string; name?: string }>,
  userId: string,
  visibility: 'public' | 'private' = 'private'
): Promise<{ success: boolean; deckId?: string; error?: string }> {
  try {
    console.log(`[RAG] Indexing deck "${deckName}" with ${slides.length} slides...`);

    const response = await fetch(`${RAG_API_URL}/api/rag/index-deck`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        deckName,
        slides: slides.map(s => ({ imageUrl: s.imageUrl })),
        userId,
        visibility,
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`[RAG] Successfully indexed deck "${deckName}": ${result.slidesIndexed} slides`);
    } else {
      console.error(`[RAG] Failed to index deck: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error('[RAG] Error indexing deck:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search options for all search functions
 */
export interface SearchOptions {
  topK?: number;
  userId?: string;
  deckId?: string;
  visibility?: 'public' | 'private';
  fallbackToPublic?: boolean;
  filters?: ClassificationFilters;
}

/**
 * Search response type
 */
export interface SearchResponse {
  success: boolean;
  results: SlideSearchResult[];
  query?: {
    type: 'text' | 'image' | 'metadata';
    value: string;
  };
  stats?: {
    totalResults: number;
    searchTimeMs: number;
  };
  error?: string;
}

/**
 * Search for similar slides using text query
 */
export async function searchSlidesByText(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  try {
    const response = await fetch(`${RAG_API_URL}/api/rag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        ...options,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('[RAG] Search error:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search for similar slides using an image
 */
export async function searchSlidesByImage(
  imageUrl: string,
  options: SearchOptions = {}
): Promise<SearchResponse> {
  try {
    const response = await fetch(`${RAG_API_URL}/api/rag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl,
        ...options,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('[RAG] Image search error:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search for slides using metadata/classification filters only (no semantic search)
 * This is fast and efficient for filtering by layout, content type, etc.
 */
export async function searchSlidesByMetadata(
  filters: ClassificationFilters,
  options: Omit<SearchOptions, 'filters'> = {}
): Promise<SearchResponse> {
  try {
    const response = await fetch(`${RAG_API_URL}/api/rag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        metadataOnly: true,
        filters,
        ...options,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error('[RAG] Metadata search error:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Unified search function - combines semantic and metadata filtering
 *
 * This is the recommended function for ADK agents as it supports all search modes:
 * 1. Text query only - semantic search
 * 2. Image query only - visual similarity search
 * 3. Filters only - fast metadata filtering
 * 4. Text/Image + Filters - semantic search with post-filtering
 */
export async function searchSlides(
  params: {
    query?: string;
    imageUrl?: string;
    filters?: ClassificationFilters;
    topK?: number;
    userId?: string;
    deckId?: string;
    visibility?: 'public' | 'private';
    fallbackToPublic?: boolean;
    metadataOnly?: boolean;
  }
): Promise<SearchResponse> {
  try {
    const response = await fetch(`${RAG_API_URL}/api/rag/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    return await response.json();
  } catch (error) {
    console.error('[RAG] Search error:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get slide details by ID
 * Useful for getting full classification data for a specific slide
 */
export async function getSlideDetails(slideId: string): Promise<{
  success: boolean;
  slide?: SlideSearchResult;
  error?: string;
}> {
  try {
    const response = await fetch(`${RAG_API_URL}/api/rag/slide/${slideId}`);
    return await response.json();
  } catch (error) {
    console.error('[RAG] Get slide error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get RAG index statistics
 */
export async function getRAGStats(): Promise<{
  success: boolean;
  stats?: {
    totalSlides: number;
    totalDecks: number;
    publicSlides: number;
    privateSlides: number;
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${RAG_API_URL}/api/rag/stats`);
    return await response.json();
  } catch (error) {
    console.error('[RAG] Stats error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if RAG service is available
 */
export async function isRAGServiceAvailable(): Promise<boolean> {
  try {
    console.log(`[RAG] Checking health at ${RAG_API_URL}/health`);

    // Create abort controller for timeout (more compatible than AbortSignal.timeout)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${RAG_API_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log(`[RAG] Health check response: ${response.status} ${response.ok ? 'OK' : 'FAILED'}`);
    return response.ok;
  } catch (error) {
    console.error('[RAG] Health check failed:', error);
    return false;
  }
}
