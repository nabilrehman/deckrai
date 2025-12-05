/**
 * Index Deck Endpoint
 *
 * POST /api/rag/index-deck
 *
 * Indexes a full deck (PDF) by:
 * 1. Creating a deck record
 * 2. Generating embeddings for each slide
 * 3. Storing slides in the vector index
 */

import { Request, Response } from 'express';
import { generateImageEmbedding, generateBatchImageEmbeddings } from './embeddingService';
import { upsertSlide, upsertSlides, upsertDeck, SlideRecord, SlideClassificationData } from './vectorSearchService';
import { classifySlides, getClassificationSummary } from './slideClassificationService';

/**
 * Request body for indexing a deck
 */
interface IndexDeckRequest {
  deckName: string;
  slides: Array<{
    imageUrl: string;
    name?: string;
  }>;
  userId: string;
  visibility?: 'public' | 'private';
}

/**
 * Response for index-deck endpoint
 */
interface IndexDeckResponse {
  success: boolean;
  deckId: string;
  deckName: string;
  slidesIndexed: number;
  error?: string;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Index a full deck with all its slides
 */
export async function indexDeckHandler(req: Request, res: Response): Promise<void> {
  const startTime = Date.now();

  try {
    const { deckName, slides, userId, visibility = 'private' } = req.body as IndexDeckRequest;

    // Validate request
    if (!deckName) {
      res.status(400).json({ success: false, error: 'deckName is required' });
      return;
    }

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      res.status(400).json({ success: false, error: 'slides array is required and must not be empty' });
      return;
    }

    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' });
      return;
    }

    console.log(`[RAG] Indexing deck: "${deckName}" with ${slides.length} slides for user ${userId}`);

    // Generate deck ID
    const deckId = generateId();

    // Generate embeddings for all slides
    console.log(`[RAG] Generating embeddings for ${slides.length} slides...`);
    const imageUrls = slides.map(s => s.imageUrl);
    const embeddings = await generateBatchImageEmbeddings(imageUrls);

    // Classify slides using Gemini Vision
    console.log(`[RAG] Classifying ${slides.length} slides with Gemini Vision...`);
    let classifications: SlideClassificationData[] = [];
    try {
      classifications = await classifySlides(imageUrls) as unknown as SlideClassificationData[];
      console.log(`[RAG] Classification complete. Sample:`,
        classifications[0] ? getClassificationSummary(classifications[0] as any) : 'No classification'
      );
    } catch (classifyError) {
      console.warn(`[RAG] Classification failed, continuing without metadata:`, classifyError);
      // Continue without classification - slides will still be indexed
    }

    // Create slide records with classification
    const slideRecords: SlideRecord[] = slides.map((slide, index) => ({
      slideId: generateId(),
      deckId,
      deckName,
      slideIndex: index,
      imageUrl: slide.imageUrl,
      userId,
      visibility,
      embedding: embeddings[index],
      createdAt: Date.now(),
      classification: classifications[index] || undefined,
    }));

    // Store deck metadata
    await upsertDeck({
      deckId,
      name: deckName,
      userId,
      visibility,
      slideCount: slides.length,
      createdAt: Date.now(),
    });

    // Store all slides in vector index
    await upsertSlides(slideRecords);

    const duration = Date.now() - startTime;
    console.log(`[RAG] Indexed deck "${deckName}" in ${duration}ms: ${slides.length} slides`);

    const response: IndexDeckResponse = {
      success: true,
      deckId,
      deckName,
      slidesIndexed: slides.length,
    };

    res.json(response);
  } catch (error) {
    console.error('[RAG] Error indexing deck:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Index a single slide (optional, for adding individual slides)
 */
export async function indexSlideHandler(req: Request, res: Response): Promise<void> {
  try {
    const { imageUrl, slideId, userId, deckId, deckName, slideIndex = 0, visibility = 'private' } = req.body;

    // Validate request
    if (!imageUrl) {
      res.status(400).json({ success: false, error: 'imageUrl is required' });
      return;
    }

    if (!userId) {
      res.status(400).json({ success: false, error: 'userId is required' });
      return;
    }

    const finalSlideId = slideId || generateId();
    const finalDeckId = deckId || generateId();

    console.log(`[RAG] Indexing single slide: ${finalSlideId}`);

    // Generate embedding
    const embedding = await generateImageEmbedding(imageUrl);

    // Create slide record
    const slideRecord: SlideRecord = {
      slideId: finalSlideId,
      deckId: finalDeckId,
      deckName: deckName || 'Single Slide',
      slideIndex,
      imageUrl,
      userId,
      visibility,
      embedding,
      createdAt: Date.now(),
    };

    // Store slide
    await upsertSlide(slideRecord);

    console.log(`[RAG] Indexed slide: ${finalSlideId}`);

    res.json({
      success: true,
      slideId: finalSlideId,
      deckId: finalDeckId,
    });
  } catch (error) {
    console.error('[RAG] Error indexing slide:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
