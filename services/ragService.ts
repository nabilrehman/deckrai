/**
 * RAG Service Client
 *
 * Client-side service for interacting with the Slide RAG Engine API.
 * Handles indexing slides and searching for similar slides.
 */

// RAG API URL - configurable via environment variable
const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8081';

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
 * Search for similar slides using text query
 */
export async function searchSlidesByText(
  query: string,
  options: {
    topK?: number;
    userId?: string;
    deckId?: string;
    visibility?: 'public' | 'private';
    fallbackToPublic?: boolean;
  } = {}
): Promise<{
  success: boolean;
  results: Array<{
    slideId: string;
    deckId: string;
    deckName: string;
    slideIndex: number;
    imageUrl: string;
    score: number;
  }>;
  error?: string;
}> {
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
  options: {
    topK?: number;
    userId?: string;
    deckId?: string;
    visibility?: 'public' | 'private';
    fallbackToPublic?: boolean;
  } = {}
): Promise<{
  success: boolean;
  results: Array<{
    slideId: string;
    deckId: string;
    deckName: string;
    slideIndex: number;
    imageUrl: string;
    score: number;
  }>;
  error?: string;
}> {
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
    const response = await fetch(`${RAG_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}
