/**
 * Experiment: Test Vector Search 2.0 for Slide Library
 *
 * This script:
 * 1. Creates a Vector Search 2.0 collection
 * 2. Uploads PDF slides with embeddings
 * 3. Queries for "title slide" and shows results
 */

import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PROJECT_ID = 'deckr-477706';
const LOCATION = 'us-central1';
const API_KEY = process.env.VITE_GEMINI_API_KEY;
const COLLECTION_NAME = 'slide-library-experiment';

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Step 1: Generate multimodal embedding for a slide image
 */
async function generateSlideEmbedding(
  imageBase64: string,
  description: string = "presentation slide"
): Promise<number[]> {
  console.log('📊 Generating embedding...');

  // Extract base64 data (remove data URL prefix)
  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  const response = await fetch(
    `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/multimodalembedding@001:predict`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, use proper OAuth2 token
        // For now, we'll use the Vertex AI client library instead
      },
      body: JSON.stringify({
        instances: [{
          text: description,
          image: { bytesBase64Encoded: base64Data }
        }],
        parameters: { dimension: 512 }  // Use 512 for faster processing
      })
    }
  );

  const data = await response.json();
  return data.predictions[0].imageEmbedding;
}

/**
 * Step 2: Create Vector Search 2.0 collection
 *
 * Note: This uses the REST API since Vector Search 2.0 is in preview
 * and may not have TypeScript SDK yet
 */
async function createCollection() {
  console.log('🔧 Creating Vector Search 2.0 collection...');

  // Collection schema
  const schema = {
    name: COLLECTION_NAME,
    schema: {
      fields: {
        id: { type: 'STRING' },
        name: { type: 'STRING' },
        deck_name: { type: 'STRING' },
        slide_number: { type: 'INTEGER' },
        image_url: { type: 'STRING' },
        embedding: {
          type: 'VECTOR',
          dimension: 512
        },
        uploaded_at: { type: 'INTEGER' }
      }
    }
  };

  console.log('✅ Collection schema ready:', schema);

  // TODO: Make API call to create collection
  // For now, we'll simulate this
  console.log('⚠️  Note: Actual API call requires gcloud auth setup');
  console.log('📝 You would create this collection via:');
  console.log(`   gcloud alpha vector-search collections create ${COLLECTION_NAME} ...`);

  return schema;
}

/**
 * Step 3: Process PDF and upload slides
 */
async function processAndUploadPDF(pdfPath: string) {
  console.log(`📄 Processing PDF: ${pdfPath}`);

  // In a real implementation, you would:
  // 1. Use pdf.js to extract pages as images
  // 2. Generate embeddings for each page
  // 3. Upload to Vector Search 2.0

  console.log('⚠️  For this experiment, we need:');
  console.log('   1. PDF.js to extract slide images');
  console.log('   2. Vertex AI Multimodal API for embeddings');
  console.log('   3. Vector Search 2.0 API client');

  // Simulated data structure
  const slides = [
    {
      id: 'slide-1',
      name: 'Title Slide',
      deck_name: 'Google Cloud Template',
      slide_number: 1,
      image_url: 'gs://bucket/slide-1.png',
      embedding: new Array(512).fill(0).map(() => Math.random()), // Fake embedding
      uploaded_at: Date.now()
    },
    {
      id: 'slide-2',
      name: 'Content Slide',
      deck_name: 'Google Cloud Template',
      slide_number: 2,
      image_url: 'gs://bucket/slide-2.png',
      embedding: new Array(512).fill(0).map(() => Math.random()), // Fake embedding
      uploaded_at: Date.now()
    }
  ];

  console.log(`✅ Processed ${slides.length} slides`);
  return slides;
}

/**
 * Step 4: Query for "title slide"
 */
async function queryForTitleSlide() {
  console.log('🔍 Querying for "title slide"...');

  // Generate embedding for query text
  const queryText = "title slide presentation cover";
  console.log(`📝 Query: "${queryText}"`);

  // In real implementation:
  // const queryEmbedding = await generateTextEmbedding(queryText);
  const queryEmbedding = new Array(512).fill(0).map(() => Math.random());

  // Simulated search results
  const results = [
    {
      id: 'slide-1',
      name: 'Title Slide',
      similarity: 0.95,
      deck_name: 'Google Cloud Template'
    },
    {
      id: 'slide-26',
      name: 'Section Divider',
      similarity: 0.87,
      deck_name: 'Google Cloud Template'
    }
  ];

  console.log('\n📊 Search Results:');
  results.forEach((r, i) => {
    console.log(`\n[${i + 1}] ${r.name}`);
    console.log(`    Similarity: ${r.similarity}`);
    console.log(`    Deck: ${r.deck_name}`);
  });

  return results;
}

/**
 * Main experiment runner
 */
async function runExperiment() {
  console.log('🧪 Vector Search 2.0 Experiment');
  console.log('================================\n');

  try {
    // Step 1: Create collection
    const collection = await createCollection();

    // Step 2: Upload slides
    const pdfPath = path.join(__dirname, '../title_slide.pdf');
    const slides = await processAndUploadPDF(pdfPath);

    // Step 3: Query
    const results = await queryForTitleSlide();

    console.log('\n✅ Experiment complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Collection: ${COLLECTION_NAME}`);
    console.log(`   - Slides uploaded: ${slides.length}`);
    console.log(`   - Query results: ${results.length}`);

    console.log('\n🔬 Next Steps to Make This Real:');
    console.log('   1. Set up gcloud authentication:');
    console.log('      gcloud auth application-default login');
    console.log('   2. Enable Vector Search 2.0 API:');
    console.log('      gcloud services enable aiplatform.googleapis.com');
    console.log('   3. Install required packages:');
    console.log('      npm install @google-cloud/aiplatform');
    console.log('   4. Replace simulated data with real API calls');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  runExperiment();
}

export { runExperiment, generateSlideEmbedding, queryForTitleSlide };
