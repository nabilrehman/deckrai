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
import { searchSlides, searchSlidesByMetadata, SearchResult, getVectorStoreStats } from './vectorSearchService';

/**
 * Classification filters for metadata-based search
 */
interface ClassificationFilters {
  contentType?: string | string[];       // 'title', 'features', 'proof', etc.
  layout?: string | string[];            // 'grid-3-col', 'split-50-50', etc.
  visualStyle?: string | string[];       // 'minimal', 'modern', 'bold', etc.
  persona?: string | string[];           // 'c-suite', 'technical', etc.
  salesStage?: string | string[];        // 'outreach', 'consideration', etc.
  visualElements?: string[];             // 'icons', 'charts', 'screenshots'

  // Content hint filters
  hasMetrics?: boolean;
  hasScreenshots?: boolean;
  hasCharts?: boolean;
  hasIcons?: boolean;
}

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

  // Classification filters (metadata-based)
  filters?: ClassificationFilters;

  // Options
  topK?: number;            // Number of results (default: 10)
  fallbackToPublic?: boolean;  // Fallback to public if no private results
  metadataOnly?: boolean;   // If true, search only by metadata (no embedding)
}

/**
 * Response for search endpoint
 */
interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  query: {
    type: 'text' | 'image' | 'metadata';
    value: string;
  };
  filters: {
    userId?: string;
    deckId?: string;
    visibility?: string;
    classification?: ClassificationFilters;
  };
  stats: {
    totalResults: number;
    searchTimeMs: number;
  };
  error?: string;
}

/**
 * Check if classification filters are provided
 */
function hasClassificationFilters(filters?: ClassificationFilters): boolean {
  if (!filters) return false;
  return !!(
    filters.contentType ||
    filters.layout ||
    filters.visualStyle ||
    filters.persona ||
    filters.salesStage ||
    filters.visualElements?.length ||
    filters.hasMetrics !== undefined ||
    filters.hasScreenshots !== undefined ||
    filters.hasCharts !== undefined ||
    filters.hasIcons !== undefined
  );
}

/**
 * Build filter description for logging
 */
function describeFilters(filters?: ClassificationFilters): string {
  if (!filters) return 'none';
  const parts: string[] = [];
  if (filters.contentType) parts.push(`contentType=${JSON.stringify(filters.contentType)}`);
  if (filters.layout) parts.push(`layout=${JSON.stringify(filters.layout)}`);
  if (filters.visualStyle) parts.push(`visualStyle=${JSON.stringify(filters.visualStyle)}`);
  if (filters.persona) parts.push(`persona=${JSON.stringify(filters.persona)}`);
  if (filters.salesStage) parts.push(`salesStage=${JSON.stringify(filters.salesStage)}`);
  if (filters.visualElements?.length) parts.push(`visualElements=${JSON.stringify(filters.visualElements)}`);
  if (filters.hasMetrics !== undefined) parts.push(`hasMetrics=${filters.hasMetrics}`);
  if (filters.hasScreenshots !== undefined) parts.push(`hasScreenshots=${filters.hasScreenshots}`);
  if (filters.hasCharts !== undefined) parts.push(`hasCharts=${filters.hasCharts}`);
  if (filters.hasIcons !== undefined) parts.push(`hasIcons=${filters.hasIcons}`);
  return parts.length > 0 ? parts.join(', ') : 'none';
}

/**
 * Search for similar slides
 *
 * Supports three modes:
 * 1. Semantic search (query or imageUrl) - Uses embeddings for similarity
 * 2. Metadata search (filters only) - Uses Firestore for fast filtering
 * 3. Combined search (query + filters) - Uses both for refined results
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
      filters,
      topK = 10,
      fallbackToPublic = true,
      metadataOnly = false,
    } = req.body as SearchRequest;

    const hasFilters = hasClassificationFilters(filters);

    // Validate: need either query, imageUrl, or metadata filters
    if (!query && !imageUrl && !hasFilters && !metadataOnly) {
      res.status(400).json({
        success: false,
        error: 'Either query (text), imageUrl (image), or filters (metadata) is required',
      });
      return;
    }

    console.log(`[RAG] Search mode: ${metadataOnly || (!query && !imageUrl) ? 'metadata' : query ? 'text' : 'image'}`);
    console.log(`[RAG] Query: ${query ? `"${query}"` : imageUrl ? `image: ${imageUrl.substring(0, 50)}...` : 'none'}`);
    console.log(`[RAG] Base filters: userId=${userId}, deckId=${deckId}, visibility=${visibility}, topK=${topK}`);
    console.log(`[RAG] Classification filters: ${describeFilters(filters)}`);

    let results: SearchResult[];
    let queryType: 'text' | 'image' | 'metadata';
    let queryValue: string;

    // Mode 1: Metadata-only search (no embeddings)
    if (metadataOnly || (!query && !imageUrl)) {
      queryType = 'metadata';
      queryValue = describeFilters(filters);

      results = await searchSlidesByMetadata(
        {
          ...filters,
          userId,
          deckId,
          visibility,
        },
        topK
      );
    }
    // Mode 2 & 3: Semantic search (optionally with post-filtering)
    else {
      if (query) {
        queryType = 'text';
        queryValue = query;
      } else {
        queryType = 'image';
        queryValue = imageUrl!.substring(0, 100);
      }

      // Generate query embedding
      const queryEmbedding = query
        ? await generateTextEmbedding(query)
        : await generateImageEmbedding(imageUrl!);

      // Search vector store (get more results if we need to post-filter)
      const searchTopK = hasFilters ? topK * 3 : topK;
      results = await searchSlides(queryEmbedding, {
        topK: searchTopK,
        userId,
        deckId,
        visibility,
        fallbackToPublic,
      });

      // Post-filter by classification if filters provided
      if (hasFilters && results.length > 0) {
        results = filterResultsByClassification(results, filters!);
        results = results.slice(0, topK); // Trim to requested topK
      }
    }

    const searchTimeMs = Date.now() - startTime;
    console.log(`[RAG] Found ${results.length} results in ${searchTimeMs}ms`);

    const response: SearchResponse = {
      success: true,
      results,
      query: {
        type: queryType,
        value: queryValue,
      },
      filters: {
        userId,
        deckId,
        visibility,
        classification: hasFilters ? filters : undefined,
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
 * Post-filter search results by classification metadata
 */
function filterResultsByClassification(
  results: SearchResult[],
  filters: ClassificationFilters
): SearchResult[] {
  return results.filter(result => {
    const c = result.classification;
    if (!c) return true; // Include slides without classification

    // Check each filter
    if (filters.contentType) {
      const types = Array.isArray(filters.contentType) ? filters.contentType : [filters.contentType];
      if (!types.includes(c.contentType)) return false;
    }

    if (filters.layout) {
      const layouts = Array.isArray(filters.layout) ? filters.layout : [filters.layout];
      if (!layouts.includes(c.layout)) return false;
    }

    if (filters.visualStyle) {
      const styles = Array.isArray(filters.visualStyle) ? filters.visualStyle : [filters.visualStyle];
      if (!styles.includes(c.visualStyle)) return false;
    }

    if (filters.persona) {
      const personas = Array.isArray(filters.persona) ? filters.persona : [filters.persona];
      if (!personas.includes(c.persona)) return false;
    }

    if (filters.salesStage) {
      const stages = Array.isArray(filters.salesStage) ? filters.salesStage : [filters.salesStage];
      if (!stages.includes(c.salesStage)) return false;
    }

    if (filters.visualElements?.length) {
      const hasAny = filters.visualElements.some(el =>
        c.visualElements?.includes(el as any)
      );
      if (!hasAny) return false;
    }

    // Boolean filters
    if (filters.hasMetrics !== undefined && c.contentHints?.hasMetrics !== filters.hasMetrics) {
      return false;
    }
    if (filters.hasScreenshots !== undefined && c.contentHints?.hasProductUI !== filters.hasScreenshots) {
      return false;
    }
    if (filters.hasCharts !== undefined) {
      const hasCharts = c.visualElements?.includes('charts') || false;
      if (hasCharts !== filters.hasCharts) return false;
    }
    if (filters.hasIcons !== undefined) {
      const hasIcons = c.visualElements?.includes('icons') || false;
      if (hasIcons !== filters.hasIcons) return false;
    }

    return true;
  });
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
