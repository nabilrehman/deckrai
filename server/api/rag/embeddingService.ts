/**
 * Embedding Service
 *
 * Uses Vertex AI Multimodal Embedding API to generate 1408-dim embeddings
 * for slide images. Supports both image and text embeddings in the same
 * semantic space for cross-modal search.
 */

import { VertexAI } from '@google-cloud/vertexai';

// Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'bq-demos-469816';
const LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';
const EMBEDDING_MODEL = 'multimodalembedding@001';
const EMBEDDING_DIMENSION = 1408;

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
});

/**
 * Generate embedding for an image
 * @param imageUrl - URL or base64 data URL of the image
 * @returns 1408-dimensional embedding vector
 */
export async function generateImageEmbedding(imageUrl: string): Promise<number[]> {
  try {
    // Convert URL to base64 if needed
    let base64Data: string;
    let mimeType: string;

    if (imageUrl.startsWith('data:')) {
      // Already base64
      const match = imageUrl.match(/^data:(image\/\w+);base64,(.*)$/);
      if (!match) {
        throw new Error('Invalid base64 image data');
      }
      mimeType = match[1];
      base64Data = match[2];
    } else {
      // Fetch and convert to base64
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
      mimeType = response.headers.get('content-type') || 'image/png';
    }

    // Call Vertex AI Multimodal Embedding API
    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;

    const requestBody = {
      instances: [
        {
          image: {
            bytesBase64Encoded: base64Data,
          },
        },
      ],
    };

    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Embedding API error: ${apiResponse.status} - ${errorText}`);
    }

    const result = await apiResponse.json();
    const embedding = result.predictions[0].imageEmbedding;

    if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(`Invalid embedding dimension: expected ${EMBEDDING_DIMENSION}, got ${embedding?.length}`);
    }

    return embedding;
  } catch (error) {
    console.error('Error generating image embedding:', error);
    throw error;
  }
}

/**
 * Generate embedding for text
 * Text and image embeddings are in the same semantic space,
 * enabling cross-modal search (search images with text queries)
 *
 * @param text - Text to embed (max ~32 tokens)
 * @returns 1408-dimensional embedding vector
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  try {
    // Truncate text to ~32 words (API limit)
    const truncatedText = text.split(/\s+/).slice(0, 32).join(' ');

    const endpoint = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${EMBEDDING_MODEL}:predict`;

    const requestBody = {
      instances: [
        {
          text: truncatedText,
        },
      ],
    };

    const apiResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Embedding API error: ${apiResponse.status} - ${errorText}`);
    }

    const result = await apiResponse.json();
    const embedding = result.predictions[0].textEmbedding;

    if (!embedding || embedding.length !== EMBEDDING_DIMENSION) {
      throw new Error(`Invalid embedding dimension: expected ${EMBEDDING_DIMENSION}, got ${embedding?.length}`);
    }

    return embedding;
  } catch (error) {
    console.error('Error generating text embedding:', error);
    throw error;
  }
}

/**
 * Generate embeddings for multiple images in batch
 * @param imageUrls - Array of image URLs
 * @returns Array of 1408-dimensional embedding vectors
 */
export async function generateBatchImageEmbeddings(imageUrls: string[]): Promise<number[][]> {
  // Process in batches of 5 to avoid rate limits
  const BATCH_SIZE = 5;
  const results: number[][] = [];

  for (let i = 0; i < imageUrls.length; i += BATCH_SIZE) {
    const batch = imageUrls.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(url => generateImageEmbedding(url))
    );
    results.push(...batchResults);

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < imageUrls.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
}

/**
 * Get access token for Vertex AI API
 * Uses Application Default Credentials (ADC)
 */
async function getAccessToken(): Promise<string> {
  // In Cloud Run, use the metadata server
  if (process.env.K_SERVICE) {
    const response = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      { headers: { 'Metadata-Flavor': 'Google' } }
    );
    const data = await response.json();
    return data.access_token;
  }

  // Local development: use gcloud auth
  const { execSync } = await import('child_process');
  const token = execSync('gcloud auth print-access-token', { encoding: 'utf-8' }).trim();
  return token;
}

export { EMBEDDING_DIMENSION, PROJECT_ID, LOCATION };
