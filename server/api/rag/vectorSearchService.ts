/**
 * Vector Search Service
 *
 * Uses Vertex AI Vector Search for similarity search and Firestore for metadata.
 * Supports filtering by userId, deckId, and visibility (public/private).
 *
 * Architecture:
 * - Firestore: Stores slide metadata (deckId, deckName, imageUrl, userId, visibility)
 * - Vertex AI Vector Search: Stores embeddings and performs similarity search
 */

import { EMBEDDING_DIMENSION, PROJECT_ID, LOCATION } from './embeddingService';

// Vector Search configuration
const INDEX_ENDPOINT_ID = process.env.VECTOR_SEARCH_INDEX_ENDPOINT || '';
const DEPLOYED_INDEX_ID = process.env.VECTOR_SEARCH_DEPLOYED_INDEX || '';
const INDEX_ID = process.env.VECTOR_SEARCH_INDEX_ID || '8375369295886024704';  // Index ID for upserts
const PUBLIC_ENDPOINT_DOMAIN = process.env.VECTOR_SEARCH_PUBLIC_DOMAIN || '1662060584.us-central1-549403515075.vdb.vertexai.goog';

// Firestore collection names
const SLIDES_COLLECTION = 'rag_slides';
const DECKS_COLLECTION = 'rag_decks';

/**
 * Slide classification metadata (from slideClassificationService)
 */
export interface SlideClassificationData {
  // Sales/business context
  salesStage: string;
  persona: string;
  contentType: string;

  // Visual characteristics
  visualElements: string[];
  layout: string;
  visualStyle: string;

  // Content hints (boolean flags for fast filtering)
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
  textDensity: string;

  // Extracted text
  extractedTitle?: string;
  extractedKeywords?: string[];
}

/**
 * Slide record stored in Firestore
 */
export interface SlideRecord {
  slideId: string;
  deckId: string;
  deckName: string;
  slideIndex: number;
  imageUrl: string;
  userId: string;
  visibility: 'public' | 'private';
  embedding: number[];
  createdAt: number;

  // Classification metadata (optional for backward compatibility)
  classification?: SlideClassificationData;
}

/**
 * Search result with similarity score
 */
export interface SearchResult {
  slideId: string;
  deckId: string;
  deckName: string;
  slideIndex: number;
  imageUrl: string;
  score: number;
  visibility: 'public' | 'private';

  // Classification metadata (when available)
  classification?: SlideClassificationData;
}

/**
 * Get access token for Vertex AI API
 */
async function getAccessToken(): Promise<string> {
  if (process.env.K_SERVICE) {
    const response = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      { headers: { 'Metadata-Flavor': 'Google' } }
    );
    const data = await response.json();
    return data.access_token;
  }

  const { execSync } = await import('child_process');
  const token = execSync('gcloud auth print-access-token', { encoding: 'utf-8' }).trim();
  return token;
}

/**
 * Initialize Firebase Admin SDK
 */
async function getFirestoreDb() {
  const { initializeApp, cert, getApps } = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');

  if (getApps().length === 0) {
    // In production, uses default service account
    // Locally, uses GOOGLE_APPLICATION_CREDENTIALS or gcloud auth
    initializeApp({
      projectId: PROJECT_ID,
    });
  }

  return getFirestore();
}

/**
 * Upsert slide metadata to Firestore and embedding to Vector Search
 */
export async function upsertSlide(slide: SlideRecord): Promise<void> {
  const db = await getFirestoreDb();

  // Store metadata in Firestore
  await db.collection(SLIDES_COLLECTION).doc(slide.slideId).set({
    slideId: slide.slideId,
    deckId: slide.deckId,
    deckName: slide.deckName,
    slideIndex: slide.slideIndex,
    imageUrl: slide.imageUrl,
    userId: slide.userId,
    visibility: slide.visibility,
    createdAt: slide.createdAt,
  });

  // Upsert embedding to Vector Search
  await upsertToVectorSearch(slide.slideId, slide.embedding, {
    deckId: slide.deckId,
    userId: slide.userId,
    visibility: slide.visibility,
  });
}

/**
 * Upsert multiple slides
 */
export async function upsertSlides(slides: SlideRecord[]): Promise<void> {
  const db = await getFirestoreDb();
  const batch = db.batch();

  // Batch write metadata to Firestore
  for (const slide of slides) {
    const docRef = db.collection(SLIDES_COLLECTION).doc(slide.slideId);
    const slideData: Record<string, any> = {
      slideId: slide.slideId,
      deckId: slide.deckId,
      deckName: slide.deckName,
      slideIndex: slide.slideIndex,
      imageUrl: slide.imageUrl,
      userId: slide.userId,
      visibility: slide.visibility,
      createdAt: slide.createdAt,
    };

    // Add classification metadata if available
    if (slide.classification) {
      slideData.classification = slide.classification;
      // Also store top-level fields for easier Firestore queries
      slideData.contentType = slide.classification.contentType;
      slideData.layout = slide.classification.layout;
      slideData.visualStyle = slide.classification.visualStyle;
      slideData.persona = slide.classification.persona;
      slideData.salesStage = slide.classification.salesStage;
      slideData.visualElements = slide.classification.visualElements;
      slideData.hasMetrics = slide.classification.contentHints?.hasMetrics || false;
      slideData.hasScreenshots = slide.classification.contentHints?.hasProductUI || false;
      slideData.hasCharts = slide.classification.visualElements?.includes('charts') || false;
      slideData.hasIcons = slide.classification.visualElements?.includes('icons') || false;
    }

    batch.set(docRef, slideData);
  }

  await batch.commit();

  // Batch upsert embeddings to Vector Search
  await batchUpsertToVectorSearch(
    slides.map(s => ({
      id: s.slideId,
      embedding: s.embedding,
      restricts: [
        { namespace: 'deckId', allowList: [s.deckId] },
        { namespace: 'userId', allowList: [s.userId] },
        { namespace: 'visibility', allowList: [s.visibility] },
      ],
    }))
  );
}

/**
 * Store deck metadata
 */
export async function upsertDeck(deck: {
  deckId: string;
  name: string;
  userId: string;
  visibility: string;
  slideCount: number;
  createdAt: number;
}): Promise<void> {
  const db = await getFirestoreDb();
  await db.collection(DECKS_COLLECTION).doc(deck.deckId).set(deck);
}

/**
 * Upsert a single embedding to Vertex AI Vector Search
 */
async function upsertToVectorSearch(
  id: string,
  embedding: number[],
  restricts: { deckId: string; userId: string; visibility: string }
): Promise<void> {
  if (!INDEX_ID) {
    console.warn('[Vector Search] INDEX_ID not configured, skipping vector upsert');
    return;
  }

  const token = await getAccessToken();
  // Use Index ID (not Endpoint ID) for upserts with STREAM_UPDATE indexes
  const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/indexes/${INDEX_ID}:upsertDatapoints`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      datapoints: [{
        datapointId: id,
        featureVector: embedding,
        restricts: [
          { namespace: 'deckId', allowList: [restricts.deckId] },
          { namespace: 'userId', allowList: [restricts.userId] },
          { namespace: 'visibility', allowList: [restricts.visibility] },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vector Search upsert failed: ${response.status} - ${error}`);
  }
}

/**
 * Batch upsert embeddings to Vertex AI Vector Search
 */
async function batchUpsertToVectorSearch(
  datapoints: Array<{
    id: string;
    embedding: number[];
    restricts: Array<{ namespace: string; allowList: string[] }>;
  }>
): Promise<void> {
  if (!INDEX_ID) {
    console.warn('[Vector Search] INDEX_ID not configured, skipping batch upsert');
    return;
  }

  const token = await getAccessToken();
  // Use Index ID (not Endpoint ID) for upserts with STREAM_UPDATE indexes
  const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/indexes/${INDEX_ID}:upsertDatapoints`;

  // Process in batches of 100
  const BATCH_SIZE = 100;
  for (let i = 0; i < datapoints.length; i += BATCH_SIZE) {
    const batch = datapoints.slice(i, i + BATCH_SIZE);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datapoints: batch.map(dp => ({
          datapointId: dp.id,
          featureVector: dp.embedding,
          restricts: dp.restricts,
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vector Search batch upsert failed: ${response.status} - ${error}`);
    }
  }
}

/**
 * Search for similar slides using Vertex AI Vector Search
 */
export async function searchSlides(
  queryEmbedding: number[],
  options: {
    topK?: number;
    userId?: string;
    deckId?: string;
    visibility?: 'public' | 'private';
    fallbackToPublic?: boolean;
  } = {}
): Promise<SearchResult[]> {
  const { topK = 10, userId, deckId, visibility, fallbackToPublic = false } = options;

  // If Vector Search not configured, fall back to Firestore-only search
  if (!INDEX_ENDPOINT_ID || !DEPLOYED_INDEX_ID) {
    console.warn('[Vector Search] Not configured, using Firestore fallback');
    return searchSlidesFirestoreFallback(queryEmbedding, options);
  }

  // Build restriction filters
  const restricts: Array<{ namespace: string; allowList: string[] }> = [];

  if (deckId) {
    restricts.push({ namespace: 'deckId', allowList: [deckId] });
  }

  if (visibility) {
    restricts.push({ namespace: 'visibility', allowList: [visibility] });
  } else if (userId && !fallbackToPublic) {
    // Only search user's private slides
    restricts.push({ namespace: 'userId', allowList: [userId] });
    restricts.push({ namespace: 'visibility', allowList: ['private'] });
  } else if (userId && fallbackToPublic) {
    // Search user's slides + public
    restricts.push({ namespace: 'visibility', allowList: ['public', 'private'] });
  }

  // Query Vector Search using public endpoint
  const token = await getAccessToken();

  // Use public endpoint domain for queries
  const endpoint = `https://${PUBLIC_ENDPOINT_DOMAIN}/v1/projects/${PROJECT_ID}/locations/${LOCATION}/indexEndpoints/${INDEX_ENDPOINT_ID}:findNeighbors`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      deployedIndexId: DEPLOYED_INDEX_ID,
      queries: [{
        datapoint: {
          featureVector: queryEmbedding,
        },
        neighborCount: topK,
        ...(restricts.length > 0 && {
          restricts: restricts,
        }),
      }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vector Search query failed: ${response.status} - ${error}`);
  }

  const result = await response.json();
  const neighbors = result.nearestNeighbors?.[0]?.neighbors || [];

  if (neighbors.length === 0) {
    // If no results and fallbackToPublic, try public only
    if (fallbackToPublic && userId) {
      return searchSlides(queryEmbedding, { ...options, visibility: 'public', fallbackToPublic: false });
    }
    return [];
  }

  // Fetch metadata from Firestore
  const db = await getFirestoreDb();
  const slideIds = neighbors
    .map((n: { datapoint?: { datapointId: string }; datapointId?: string }) =>
      n.datapoint?.datapointId || n.datapointId)
    .filter((id: string | undefined): id is string => !!id);

  if (slideIds.length === 0) {
    console.log('[Vector Search] No valid slide IDs found in neighbors');
    return [];
  }

  // Firestore 'in' queries support max 10 items, batch if needed
  const batches: string[][] = [];
  for (let i = 0; i < slideIds.length; i += 10) {
    batches.push(slideIds.slice(i, i + 10));
  }

  const slideMap = new Map<string, any>();
  for (const batch of batches) {
    const slideDocs = await db.collection(SLIDES_COLLECTION)
      .where('slideId', 'in', batch)
      .get();
    slideDocs.forEach(doc => {
      slideMap.set(doc.id, doc.data());
    });
  }

  // Build results with scores
  const results: SearchResult[] = neighbors.map((neighbor: { datapoint?: { datapointId: string }; datapointId?: string; distance?: number }) => {
    const datapointId = neighbor.datapoint?.datapointId || neighbor.datapointId;
    const slide = slideMap.get(datapointId);
    if (!slide) return null;

    return {
      slideId: slide.slideId,
      deckId: slide.deckId,
      deckName: slide.deckName,
      slideIndex: slide.slideIndex,
      imageUrl: slide.imageUrl,
      score: 1 - (neighbor.distance || 0), // Convert distance to similarity
      visibility: slide.visibility,
    };
  }).filter(Boolean) as SearchResult[];

  // Filter by userId if needed (post-filter for complex queries)
  if (userId && !visibility) {
    return results.filter(r =>
      r.visibility === 'public' ||
      slideMap.get(r.slideId)?.userId === userId
    );
  }

  return results;
}

/**
 * Fallback search using Firestore when Vector Search not configured
 * Uses cosine similarity computed locally
 */
async function searchSlidesFirestoreFallback(
  queryEmbedding: number[],
  options: {
    topK?: number;
    userId?: string;
    deckId?: string;
    visibility?: 'public' | 'private';
    fallbackToPublic?: boolean;
  }
): Promise<SearchResult[]> {
  const { topK = 10, userId, deckId, visibility, fallbackToPublic = false } = options;
  const db = await getFirestoreDb();

  // Build Firestore query
  let query = db.collection(SLIDES_COLLECTION).limit(500); // Limit for performance

  if (deckId) {
    query = query.where('deckId', '==', deckId);
  }

  if (visibility) {
    query = query.where('visibility', '==', visibility);
  } else if (userId && !fallbackToPublic) {
    query = query.where('userId', '==', userId).where('visibility', '==', 'private');
  }

  const snapshot = await query.get();

  if (snapshot.empty && fallbackToPublic && userId) {
    // Try public slides
    const publicQuery = db.collection(SLIDES_COLLECTION)
      .where('visibility', '==', 'public')
      .limit(500);
    const publicSnapshot = await publicQuery.get();
    return rankByEmbedding(publicSnapshot, queryEmbedding, topK);
  }

  return rankByEmbedding(snapshot, queryEmbedding, topK);
}

/**
 * Rank documents by embedding similarity
 */
function rankByEmbedding(
  snapshot: FirebaseFirestore.QuerySnapshot,
  queryEmbedding: number[],
  topK: number
): SearchResult[] {
  const scored = snapshot.docs.map(doc => {
    const data = doc.data();
    // Note: For Firestore fallback, we'd need to store embeddings too
    // This is a simplified version that assumes embeddings are stored
    const embedding = data.embedding as number[] | undefined;
    const score = embedding ? cosineSimilarity(queryEmbedding, embedding) : 0;

    return {
      slideId: data.slideId,
      deckId: data.deckId,
      deckName: data.deckName,
      slideIndex: data.slideIndex,
      imageUrl: data.imageUrl,
      score,
      visibility: data.visibility,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (normA * normB);
}

/**
 * Get a slide by ID
 */
export async function getSlide(slideId: string): Promise<SlideRecord | null> {
  const db = await getFirestoreDb();
  const doc = await db.collection(SLIDES_COLLECTION).doc(slideId).get();
  return doc.exists ? (doc.data() as SlideRecord) : null;
}

/**
 * Get all slides for a deck
 */
export async function getDeckSlides(deckId: string): Promise<SlideRecord[]> {
  const db = await getFirestoreDb();
  // Note: removed orderBy to avoid composite index requirement
  const snapshot = await db.collection(SLIDES_COLLECTION)
    .where('deckId', '==', deckId)
    .get();

  // Sort in memory
  const slides = snapshot.docs.map(doc => doc.data() as SlideRecord);
  slides.sort((a, b) => (a.slideIndex || 0) - (b.slideIndex || 0));
  return slides;
}

/**
 * Delete a slide
 */
export async function deleteSlide(slideId: string): Promise<void> {
  const db = await getFirestoreDb();
  await db.collection(SLIDES_COLLECTION).doc(slideId).delete();

  // Also delete from Vector Search if configured
  if (INDEX_ENDPOINT_ID) {
    const token = await getAccessToken();
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/indexEndpoints/${INDEX_ENDPOINT_ID}:removeDatapoints`;

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datapointIds: [slideId],
      }),
    });
  }
}

/**
 * Delete all slides for a deck
 */
export async function deleteDeck(deckId: string): Promise<void> {
  const db = await getFirestoreDb();

  // Get all slides for this deck
  const slides = await getDeckSlides(deckId);
  const slideIds = slides.map(s => s.slideId);

  // Delete from Firestore
  const batch = db.batch();
  for (const slideId of slideIds) {
    batch.delete(db.collection(SLIDES_COLLECTION).doc(slideId));
  }
  batch.delete(db.collection(DECKS_COLLECTION).doc(deckId));
  await batch.commit();

  // Delete from Vector Search if configured
  if (INDEX_ENDPOINT_ID && slideIds.length > 0) {
    const token = await getAccessToken();
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/indexEndpoints/${INDEX_ENDPOINT_ID}:removeDatapoints`;

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        datapointIds: slideIds,
      }),
    });
  }
}

/**
 * Delete all slides for a user (used when clearing style library)
 */
export async function deleteUserSlides(userId: string): Promise<{ deletedCount: number }> {
  const db = await getFirestoreDb();

  // Get all slides for this user
  const snapshot = await db.collection(SLIDES_COLLECTION)
    .where('userId', '==', userId)
    .get();

  if (snapshot.empty) {
    console.log(`[RAG] No slides found for user ${userId}`);
    return { deletedCount: 0 };
  }

  const slideIds = snapshot.docs.map(doc => doc.id);
  console.log(`[RAG] Found ${slideIds.length} slides to delete for user ${userId}`);

  // Delete from Firestore in batches (max 500 per batch)
  const batchSize = 500;
  for (let i = 0; i < slideIds.length; i += batchSize) {
    const batch = db.batch();
    const batchIds = slideIds.slice(i, i + batchSize);
    for (const slideId of batchIds) {
      batch.delete(db.collection(SLIDES_COLLECTION).doc(slideId));
    }
    await batch.commit();
  }

  // Delete from Vector Search if configured
  if (INDEX_ENDPOINT_ID && slideIds.length > 0) {
    try {
      const token = await getAccessToken();
      const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/indexEndpoints/${INDEX_ENDPOINT_ID}:removeDatapoints`;

      // Delete in batches of 100 (Vector Search limit)
      for (let i = 0; i < slideIds.length; i += 100) {
        const batchIds = slideIds.slice(i, i + 100);
        await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            datapointIds: batchIds,
          }),
        });
      }
      console.log(`[RAG] Deleted ${slideIds.length} datapoints from Vector Search`);
    } catch (error) {
      console.error('[RAG] Error deleting from Vector Search:', error);
      // Continue even if Vector Search delete fails - Firestore is already cleaned
    }
  }

  return { deletedCount: slideIds.length };
}

/**
 * Search slides by metadata filters (Firestore-based, no embeddings)
 * This is fast and efficient for filtering by classification attributes
 */
export async function searchSlidesByMetadata(
  filters: {
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
    userId?: string;
    deckId?: string;
    visibility?: 'public' | 'private';
  },
  topK: number = 20
): Promise<SearchResult[]> {
  const db = await getFirestoreDb();
  let query: FirebaseFirestore.Query = db.collection(SLIDES_COLLECTION);

  // Apply equality filters (Firestore can only have one inequality filter)
  if (filters.deckId) {
    query = query.where('deckId', '==', filters.deckId);
  }

  if (filters.visibility) {
    query = query.where('visibility', '==', filters.visibility);
  }

  if (filters.userId) {
    query = query.where('userId', '==', filters.userId);
  }

  // Apply classification filters
  if (filters.contentType) {
    const types = Array.isArray(filters.contentType) ? filters.contentType : [filters.contentType];
    if (types.length === 1) {
      query = query.where('contentType', '==', types[0]);
    } else if (types.length <= 10) {
      query = query.where('contentType', 'in', types);
    }
  }

  if (filters.layout) {
    const layouts = Array.isArray(filters.layout) ? filters.layout : [filters.layout];
    if (layouts.length === 1) {
      query = query.where('layout', '==', layouts[0]);
    } else if (layouts.length <= 10) {
      query = query.where('layout', 'in', layouts);
    }
  }

  if (filters.visualStyle) {
    const styles = Array.isArray(filters.visualStyle) ? filters.visualStyle : [filters.visualStyle];
    if (styles.length === 1) {
      query = query.where('visualStyle', '==', styles[0]);
    } else if (styles.length <= 10) {
      query = query.where('visualStyle', 'in', styles);
    }
  }

  if (filters.persona) {
    const personas = Array.isArray(filters.persona) ? filters.persona : [filters.persona];
    if (personas.length === 1) {
      query = query.where('persona', '==', personas[0]);
    } else if (personas.length <= 10) {
      query = query.where('persona', 'in', personas);
    }
  }

  // Boolean filters
  if (filters.hasMetrics !== undefined) {
    query = query.where('hasMetrics', '==', filters.hasMetrics);
  }

  if (filters.hasScreenshots !== undefined) {
    query = query.where('hasScreenshots', '==', filters.hasScreenshots);
  }

  if (filters.hasCharts !== undefined) {
    query = query.where('hasCharts', '==', filters.hasCharts);
  }

  if (filters.hasIcons !== undefined) {
    query = query.where('hasIcons', '==', filters.hasIcons);
  }

  // Limit results
  query = query.limit(topK);

  const snapshot = await query.get();

  // Post-filter for array-contains (visualElements)
  let docs = snapshot.docs;
  if (filters.visualElements && filters.visualElements.length > 0) {
    docs = docs.filter(doc => {
      const data = doc.data();
      const slideElements = data.visualElements || [];
      return filters.visualElements!.some(el => slideElements.includes(el));
    });
  }

  // Map to SearchResult
  return docs.map(doc => {
    const data = doc.data();
    return {
      slideId: data.slideId,
      deckId: data.deckId,
      deckName: data.deckName,
      slideIndex: data.slideIndex,
      imageUrl: data.imageUrl,
      score: 1.0, // Metadata match has perfect score
      visibility: data.visibility,
      classification: data.classification,
    };
  });
}

/**
 * Get stats for debugging
 */
export async function getVectorStoreStats(): Promise<{
  totalSlides: number;
  totalDecks: number;
  publicSlides: number;
  privateSlides: number;
}> {
  const db = await getFirestoreDb();

  const [slidesSnapshot, decksSnapshot] = await Promise.all([
    db.collection(SLIDES_COLLECTION).get(),
    db.collection(DECKS_COLLECTION).get(),
  ]);

  let publicSlides = 0;
  let privateSlides = 0;

  slidesSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.visibility === 'public') publicSlides++;
    else privateSlides++;
  });

  return {
    totalSlides: slidesSnapshot.size,
    totalDecks: decksSnapshot.size,
    publicSlides,
    privateSlides,
  };
}
