/**
 * RAG API Server
 *
 * Standalone Express server for the Slide RAG Engine.
 * Deploy to: bq-demos-469816
 *
 * Endpoints:
 * - POST /api/rag/index-deck   - Index a full deck
 * - POST /api/rag/index-slide  - Index a single slide
 * - POST /api/rag/search       - Search for similar slides
 * - GET  /api/rag/stats        - Get index statistics
 * - GET  /health               - Health check
 */

import express from 'express';
import cors from 'cors';
import { indexDeckHandler, indexSlideHandler } from './indexDeck';
import { searchHandler, statsHandler } from './search';
import { deleteDeck, getDeckSlides } from './vectorSearchService';

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' })); // Large limit for base64 images

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'slide-rag-api',
    version: '1.0.0',
    embedding: {
      model: 'multimodalembedding@001',
      dimensions: 1408,
    },
    timestamp: new Date().toISOString(),
  });
});

// RAG API endpoints
app.post('/api/rag/index-deck', indexDeckHandler);
app.post('/api/rag/index-slide', indexSlideHandler);
app.post('/api/rag/search', searchHandler);
app.get('/api/rag/stats', statsHandler);

// Delete deck endpoint
app.delete('/api/rag/deck/:deckId', async (req, res) => {
  try {
    const { deckId } = req.params;
    console.log(`[RAG] Deleting deck: ${deckId}`);

    const slides = await getDeckSlides(deckId);
    await deleteDeck(deckId);

    console.log(`[RAG] Deleted deck ${deckId} with ${slides.length} slides`);
    res.json({ success: true, deletedSlides: slides.length });
  } catch (error) {
    console.error('[RAG] Delete deck error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Info endpoint
app.get('/api/rag', (req, res) => {
  res.json({
    service: 'Slide RAG Engine',
    version: '1.0.0',
    endpoints: {
      'POST /api/rag/index-deck': {
        description: 'Index a full deck (PDF) with all slides',
        body: {
          deckName: 'string (required)',
          slides: '[{ imageUrl: string }] (required)',
          userId: 'string (required)',
          visibility: '"public" | "private" (default: "private")',
        },
      },
      'POST /api/rag/index-slide': {
        description: 'Index a single slide',
        body: {
          imageUrl: 'string (required)',
          userId: 'string (required)',
          slideId: 'string (optional)',
          deckId: 'string (optional)',
          visibility: '"public" | "private" (default: "private")',
        },
      },
      'POST /api/rag/search': {
        description: 'Search for similar slides',
        body: {
          query: 'string (text search) - required if no imageUrl',
          imageUrl: 'string (image similarity) - required if no query',
          userId: 'string (filter to user\'s private slides)',
          deckId: 'string (filter to specific deck)',
          visibility: '"public" | "private" (filter by visibility)',
          topK: 'number (default: 10)',
          fallbackToPublic: 'boolean (default: true)',
        },
      },
      'GET /api/rag/stats': {
        description: 'Get index statistics',
      },
    },
    examples: {
      indexDeck: {
        method: 'POST',
        url: '/api/rag/index-deck',
        body: {
          deckName: 'startup-pitch.pdf',
          slides: [
            { imageUrl: 'https://storage.../slide1.png' },
            { imageUrl: 'https://storage.../slide2.png' },
          ],
          userId: 'user123',
          visibility: 'private',
        },
      },
      searchText: {
        method: 'POST',
        url: '/api/rag/search',
        body: {
          query: 'architecture diagram BigQuery',
          topK: 20,
        },
      },
      searchImage: {
        method: 'POST',
        url: '/api/rag/search',
        body: {
          imageUrl: 'https://storage.../reference.png',
          topK: 5,
          userId: 'user123',
        },
      },
    },
  });
});

// Start server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                  SLIDE RAG ENGINE                          ║
╠════════════════════════════════════════════════════════════╣
║  Status:    Running                                        ║
║  Port:      ${PORT}                                            ║
║  Embedding: multimodalembedding@001 (1408-dim)             ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                ║
║    POST /api/rag/index-deck  - Index a deck                ║
║    POST /api/rag/index-slide - Index a slide               ║
║    POST /api/rag/search      - Search slides               ║
║    GET  /api/rag/stats       - Index statistics            ║
║    GET  /health              - Health check                ║
╚════════════════════════════════════════════════════════════╝
  `);
});

export default app;
