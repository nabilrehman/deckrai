/**
 * Search Endpoint
 *
 * POST /api/rag/search
 *
 * Search for similar slides using text or image queries.
 * Supports filtering by userId, deckId, visibility.
 * Configurable topK for number of results.
 */

import { Request, Response } from 'express';
import { generateTextEmbedding, generateImageEmbedding } from './embeddingService';
import { searchSlides, SearchResult, getVectorStoreStats } from './vectorSearchService';

/**
 * Request body for search
 */
interface SearchRequest {
  // Query can be text OR imageUrl
  query?: string;           // Text query (semantic search)
  imageUrl?: string;        // Image query (find similar slides)

  // Filters
  userId?: string;          // Filter to user's private slides
  deckId?: string;          // Filter to specific deck
  visibility?: 'public' | 'private';  // Filter by visibility

  // Options
  topK?: number;            // Number of results (default: 10)
  fallbackToPublic?: boolean;  // Fallback to public if no private results
}

/**
 * Response for search endpoint
 */
interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  query: {
    type: 'text' | 'image';
    value: string;
  };
  filters: {
    userId?: string;
    deckId?: string;
    visibility?: string;
  };
  stats: {
    totalResults: number;
    searchTimeMs: number;
  };
  error?: string;
}

/**
 * Search for similar slides
 */
export async function searchHandler(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();

  try {
    const {
      query,
      imageUrl,
      userId,
      deckId,
      visibility,
      topK = 10,
      fallbackToPublic = true,
    } = req.body as SearchRequest;

    // Validate: need either query or imageUrl
    if (!query && !imageUrl) {
      res.status(400).json({
        success: false,
        error: 'Either query (text) or imageUrl (image) is required',
      });
      return;
    }

    console.log(`[RAG] Search: ${query ? `"${query}"` : `image: ${imageUrl?.substring(0, 50)}...`}`);
    console.log(`[RAG] Filters: userId=${userId}, deckId=${deckId}, visibility=${visibility}, topK=${topK}`);

    // Generate query embedding
    let queryEmbedding: number[];
    let queryType: 'text' | 'image';

    if (query) {
      queryType = 'text';
      queryEmbedding = await generateTextEmbedding(query);
    } else {
      queryType = 'image';
      queryEmbedding = await generateImageEmbedding(imageUrl!);
    }

    // Search vector store
    const results = await searchSlides(queryEmbedding, {
      topK,
      userId,
      deckId,
      visibility,
      fallbackToPublic,
    });

    const searchTimeMs = Date.now() - startTime;
    console.log(`[RAG] Found ${results.length} results in ${searchTimeMs}ms`);

    const response: SearchResponse = {
      success: true,
      results,
      query: {
        type: queryType,
        value: query || imageUrl!.substring(0, 100),
      },
      filters: {
        userId,
        deckId,
        visibility,
      },
      stats: {
        totalResults: results.length,
        searchTimeMs,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('[RAG] Search error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get RAG stats (for debugging/monitoring)
 */
export async function statsHandler(req: Request, res: Response): Promise<void> {
  try {
    const stats = getVectorStoreStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[RAG] Stats error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
