/**
 * Deck Management API Endpoints
 * Create and manage decks following Firebase structure
 */

import { Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from './types';
import { createCanvas, Image, Canvas } from 'canvas';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

// Set up global classes for pdfjs
if (typeof globalThis.Image === 'undefined') {
  (globalThis as any).Image = Image;
  (globalThis as any).HTMLImageElement = Image;
  (globalThis as any).HTMLCanvasElement = Canvas;
  (globalThis as any).CanvasRenderingContext2D = (Canvas as any).Context2d || function() {};
}

// Canvas factory for pdfjs-dist in Node.js
class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    return {
      canvas,
      context: canvas.getContext('2d')
    };
  }

  reset(canvasAndContext: any, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: any) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
  }
}

interface SavedDeck {
  id: string;
  userId: string;
  name: string;
  slides: DeckSlide[];
  createdAt: number;
  updatedAt: number;
  slideCount: number;
  thumbnailUrl?: string;
}

interface DeckSlide {
  id: string;
  originalSrc: string;  // Firebase Storage URL
  history: string[];    // Array of Firebase Storage URLs
  name: string;
}

interface CreateDeckRequest {
  name: string;
  files: Array<{
    name: string;
    content: string;  // base64
    type: 'image' | 'pdf';
  }>;
}

/**
 * Extract pages from PDF as PNG images (base64)
 * Server-side PDF processing using pdfjs-dist + canvas
 * globalThis.Image is set to enable image handling
 */
async function extractPDFPages(pdfBase64: string): Promise<string[]> {
  console.log(`   📄 Extracting PDF pages server-side with pdfjs-dist...`);

  try {
    // Load PDF with pdfjs-dist
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');
    console.log(`   ✓ PDF buffer created (${pdfBuffer.length} bytes)`);

    // Create canvas factory (no image factory needed - using globalThis.Image)
    const canvasFactory = new NodeCanvasFactory();
    console.log(`   ✓ Canvas factory created`);
    console.log(`   ✓ globalThis.Image = ${typeof (globalThis as any).Image}`);

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      canvasFactory: canvasFactory as any
      // Note: No imageFactory - pdfjs will use globalThis.Image
    });

    console.log(`   ⏳ Loading PDF document...`);
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    console.log(`   ✓ PDF has ${pageCount} pages`);

    const pageImages: string[] = [];

    for (let i = 1; i <= pageCount; i++) {
      console.log(`   📄 Processing page ${i}/${pageCount}...`);

      const page = await pdfDoc.getPage(i);
      console.log(`   ✓ Page ${i} loaded`);

      const viewport = page.getViewport({ scale: 2.0 });
      console.log(`   ✓ Viewport: ${Math.round(viewport.width)}x${Math.round(viewport.height)}`);

      // Create canvas using factory
      const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
      console.log(`   ✓ Canvas created for page ${i}`);

      // Render PDF page to canvas
      console.log(`   ⏳ Rendering page ${i} to canvas...`);
      await page.render({
        canvasContext: canvasAndContext.context as any,
        viewport: viewport
      }).promise;
      console.log(`   ✓ Page ${i} rendered to canvas`);

      // Convert canvas to PNG base64
      const pngBase64 = canvasAndContext.canvas.toDataURL('image/png').split(',')[1];
      pageImages.push(pngBase64);

      console.log(`   ✓ Page ${i} converted to PNG (${Math.round(pngBase64.length / 1024)} KB)`);

      // Clean up
      canvasFactory.destroy(canvasAndContext);
    }

    return pageImages;
  } catch (error) {
    console.error(`   ❌ PDF extraction failed:`, error);
    console.error(`   ❌ Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    throw new Error(`Failed to extract PDF pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * POST /api/v1/decks
 * Create a new deck from uploaded files
 */
export async function createDeck(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<SavedDeck>>
) {
  try {
    const { name, files } = req.body as CreateDeckRequest;
    const userId = req.userId!;

    if (!name || !files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name and files'
      });
      return;
    }

    console.log(`📦 Creating deck: "${name}" for user ${userId}`);
    console.log(`   Files: ${files.length}`);

    // Generate deck ID following existing pattern
    const timestamp = Date.now();
    const deckId = `deck_${userId}_${timestamp}`;

    const bucket = getStorage().bucket();
    const slides: DeckSlide[] = [];

    // Process each file
    let slideNumber = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (file.type === 'pdf') {
        // Extract PDF pages server-side
        console.log(`   📄 Processing PDF: ${file.name}`);
        const pdfPages = await extractPDFPages(file.content);

        // Upload each PDF page as a slide
        for (let pageIndex = 0; pageIndex < pdfPages.length; pageIndex++) {
          slideNumber++;
          const slideId = `slide-${timestamp}-${slideNumber}`;
          const storagePath = `decks/${userId}/${deckId}/${slideId}/history_0.png`;
          const fileBuffer = Buffer.from(pdfPages[pageIndex], 'base64');
          const storageFile = bucket.file(storagePath);

          await storageFile.save(fileBuffer, {
            metadata: {
              contentType: 'image/png',
              metadata: {
                userId,
                deckId,
                slideId,
                sourceFile: file.name,
                pageNumber: pageIndex + 1,
                createdAt: new Date().toISOString()
              }
            }
          });

          // Get download URL
          const [downloadUrl] = await storageFile.getSignedUrl({
            action: 'read',
            expires: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
          });

          console.log(`   ✓ Uploaded page ${pageIndex + 1}/${pdfPages.length}: ${Math.round(fileBuffer.length / 1024)} KB`);

          slides.push({
            id: slideId,
            originalSrc: downloadUrl,
            history: [downloadUrl],
            name: `Slide ${slideNumber} (${file.name} p${pageIndex + 1})`
          });
        }

        console.log(`   ✅ Extracted ${pdfPages.length} pages from ${file.name}`);
      } else {
        // Handle image files
        slideNumber++;
        const slideId = `slide-${timestamp}-${slideNumber}`;

        // Upload image to Storage following existing pattern
        // Path: /decks/{userId}/{deckId}/{slideId}/history_0.png
        const storagePath = `decks/${userId}/${deckId}/${slideId}/history_0.png`;
        const fileBuffer = Buffer.from(file.content, 'base64');
        const storageFile = bucket.file(storagePath);

        await storageFile.save(fileBuffer, {
          metadata: {
            contentType: 'image/png',
            metadata: {
              userId,
              deckId,
              slideId,
              createdAt: new Date().toISOString()
            }
          }
        });

        // Get download URL
        const [downloadUrl] = await storageFile.getSignedUrl({
          action: 'read',
          expires: Date.now() + 365 * 24 * 60 * 60 * 1000 // 1 year
        });

        console.log(`   ✓ Uploaded slide ${slideNumber}: ${Math.round(fileBuffer.length / 1024)} KB`);

        // Create slide object
        slides.push({
          id: slideId,
          originalSrc: downloadUrl,
          history: [downloadUrl],
          name: `Slide ${slideNumber}`
        });
      }
    }

    // Create deck document
    const deck: SavedDeck = {
      id: deckId,
      userId,
      name,
      slides,
      createdAt: timestamp,
      updatedAt: timestamp,
      slideCount: slides.length,
      thumbnailUrl: slides[0]?.originalSrc || ''
    };

    // Save to Firestore
    const db = getFirestore();
    await db.collection('decks').doc(deckId).set(deck);

    console.log(`✅ Deck created: ${deckId} with ${slides.length} slides`);

    res.status(201).json({
      success: true,
      data: deck,
      message: `Deck "${name}" created successfully with ${slides.length} slides`
    });

  } catch (error) {
    console.error('Error creating deck:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create deck',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/v1/decks/:deckId
 * Get deck by ID
 */
export async function getDeck(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<SavedDeck>>
) {
  try {
    const { deckId } = req.params;
    const userId = req.userId!;

    const db = getFirestore();
    const deckDoc = await db.collection('decks').doc(deckId).get();

    if (!deckDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Deck not found'
      });
      return;
    }

    const deck = deckDoc.data() as SavedDeck;

    // Verify ownership
    if (deck.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    res.json({
      success: true,
      data: deck
    });

  } catch (error) {
    console.error('Error getting deck:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deck',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
