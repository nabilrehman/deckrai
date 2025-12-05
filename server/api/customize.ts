/**
 * Deck Customization API Endpoint
 * Customize existing decks with branding, diagrams, etc.
 */

import { Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { AuthenticatedRequest } from '../middleware/auth';
import { GenerationJob, ApiResponse } from './types';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from '@google/genai';

interface CustomizeDeckRequest {
  customization: {
    // Option 1: Simple prompt (like web app)
    prompt?: string;

    // Option 2: Structured fields
    company?: string;
    extractBranding?: boolean;
    modifications?: string[];
    style?: string;
    tone?: string;
  };
  outputFormats: Array<'pdf' | 'images' | 'google_slides'>;
  webhookUrl?: string;
}

/**
 * Parse natural language prompt into structured customization fields
 */
async function parseCustomizationPrompt(prompt: string): Promise<{
  company?: string;
  extractBranding: boolean;
  modifications: string[];
  style?: string;
}> {
  console.log(`   🤖 Parsing prompt: "${prompt}"`);

  const ai = new GoogleGenAI({
    apiKey: process.env.VITE_GEMINI_API_KEY
  });

  const systemPrompt = `You are a prompt parser for a presentation customization API. Parse the user's natural language request into structured fields.

Extract:
1. Company name/domain (if mentioned, e.g., "nike.com", "Nike", "Google")
2. Specific modifications (list of actions like "add logo to slide 1", "insert architecture diagram")
3. Style preference (if mentioned: professional, minimal, visual, executive, technical)

Return JSON with this structure:
{
  "company": "domain.com or null",
  "extractBranding": true/false (true if company mentioned),
  "modifications": ["modification 1", "modification 2", ...],
  "style": "professional" or null
}

Examples:
Input: "customize for nike.com and add logo to slide 1"
Output: {"company": "nike.com", "extractBranding": true, "modifications": ["Add Nike logo to slide 1"], "style": null}

Input: "add architecture diagram as slide 5 showing Cloud Run to SQL to BigQuery"
Output: {"company": null, "extractBranding": false, "modifications": ["Add architecture diagram as slide 5 showing Cloud Run → SQL → BigQuery"], "style": null}

Now parse this request:
"${prompt}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ text: systemPrompt }]
    });

    let jsonText = response.text.trim();

    // Extract JSON from response
    const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      const objMatch = jsonText.match(/\{[\s\S]*\}/);
      if (objMatch) {
        jsonText = objMatch[0];
      }
    }

    const parsed = JSON.parse(jsonText);
    console.log(`   ✓ Parsed: company=${parsed.company}, ${parsed.modifications.length} modifications`);
    return parsed;
  } catch (error) {
    console.error(`   ❌ Failed to parse prompt:`, error);
    // Fallback: treat entire prompt as a single modification
    return {
      extractBranding: false,
      modifications: [prompt]
    };
  }
}

/**
 * POST /api/v1/decks/:deckId/customize
 * Customize an existing deck
 */
export async function customizeDeck(
  req: AuthenticatedRequest,
  res: Response<ApiResponse<{ jobId: string; deckId: string }>>
) {
  try {
    const { deckId } = req.params;
    const userId = req.userId!;
    const request = req.body as CustomizeDeckRequest;

    console.log(`🎨 Customizing deck: ${deckId} for user ${userId}`);

    // Verify deck exists and user owns it
    const db = getFirestore();
    const deckDoc = await db.collection('decks').doc(deckId).get();

    if (!deckDoc.exists) {
      res.status(404).json({
        success: false,
        error: 'Deck not found'
      });
      return;
    }

    const deck = deckDoc.data();
    if (deck?.userId !== userId) {
      res.status(403).json({
        success: false,
        error: 'Access denied'
      });
      return;
    }

    console.log(`   ✓ Found deck with ${deck.slideCount} slides`);

    // Parse prompt if provided, otherwise use structured fields
    let customization = request.customization;
    if (request.customization.prompt) {
      console.log(`   💬 Using natural language prompt`);
      const parsed = await parseCustomizationPrompt(request.customization.prompt);
      // Merge parsed fields with any explicitly provided fields (explicit fields take precedence)
      const { prompt, ...restOfCustomization } = request.customization;
      customization = {
        ...parsed,
        ...restOfCustomization
      };
    }

    // Create customization job
    const jobId = uuidv4();

    const job: GenerationJob = {
      id: jobId,
      userId,
      status: 'pending',
      request: {
        content: {
          type: 'customize',
          deckId,  // Pass the deck ID to load from Firebase
          notes: customization.modifications?.join('\n') || 'Apply customizations'
        },
        customization,
        outputFormats: request.outputFormats,
        slideCount: deck.slideCount
      },
      createdAt: new Date(),
      ...(request.webhookUrl && { webhookUrl: request.webhookUrl }),
      webhookAttempts: 0
    };

    await db.collection('jobs').doc(jobId).set(job);

    console.log(`✅ Customization job created: ${jobId}`);

    res.status(202).json({
      success: true,
      data: { jobId, deckId },
      message: 'Customization job started. Poll /api/v1/jobs/:jobId for status.'
    });

  } catch (error) {
    console.error('Error creating customization job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customization job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
