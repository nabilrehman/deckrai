/**
 * analyzeDeckTool
 *
 * Analyzes an ENTIRE deck using Gemini 3.0 vision capabilities (batch)
 *
 * Use cases:
 * - Understanding full deck structure and flow
 * - Identifying missing slides
 * - Getting recommendations for deck improvements
 * - Planning multi-slide edits
 *
 * @tool
 */

import { GoogleGenAI } from '@google/genai';
import type { ToolResult, DeckAnalysis, SlideInfo } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || '' });

/**
 * Analyzes an entire deck with batch vision
 */
export async function analyzeDeck(params: {
  slides: SlideInfo[];
  analysisGoal: 'structure' | 'full' | 'recommendations';
}): Promise<ToolResult<DeckAnalysis>> {
  const startTime = Date.now();

  try {
    console.log(`[analyzeDeck] Analyzing ${params.slides.length} slides (${params.analysisGoal} analysis)`);

    // Validate all slides have images
    const slidesWithImages = params.slides.filter(s => s.src);
    if (slidesWithImages.length === 0) {
      throw new Error('No slide images provided for analysis');
    }

    // Build content parts: prompt + all slide images
    const contentParts: any[] = [
      { text: buildDeckAnalysisPrompt(params.analysisGoal, params.slides.length) }
    ];

    // Add each slide image with label
    slidesWithImages.forEach((slide, idx) => {
      contentParts.push({ text: `\n--- SLIDE ${idx + 1} (ID: ${slide.id}, Name: ${slide.name}) ---` });
      contentParts.push({
        inlineData: {
          data: slide.src!.split(',')[1],
          mimeType: slide.src!.match(/:(.*?);/)?.[1] || 'image/png'
        }
      });
    });

    console.log(`[analyzeDeck] Sending ${contentParts.length} content parts to Gemini 3.0...`);

    // Call Gemini 3.0 with batch vision
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{
        role: 'user',
        parts: contentParts
      }],
      config: {
        thinkingConfig: {
          thinkingBudget: 32768 // Max thinking for full deck analysis
        }
      }
    });

    // Parse response
    const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
    const analysis: DeckAnalysis = JSON.parse(jsonText);

    const executionTime = Date.now() - startTime;
    console.log(`[analyzeDeck] ✅ Analysis complete in ${executionTime}ms`);

    return {
      success: true,
      data: {
        ...analysis,
        slideCount: params.slides.length
      },
      metadata: {
        executionTime,
        model: 'gemini-3-pro-preview'
      }
    };

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[analyzeDeck] ❌ Error:`, error);

    return {
      success: false,
      error: {
        code: 'DECK_ANALYSIS_FAILED',
        message: 'Failed to analyze deck with vision',
        details: error.message
      },
      metadata: {
        executionTime
      }
    };
  }
}

/**
 * Build deck analysis prompt based on goal
 */
function buildDeckAnalysisPrompt(goal: string, slideCount: number): string {
  const basePrompt = `You are analyzing a complete ${slideCount}-slide presentation deck using vision.

**Your Task:** Analyze all ${slideCount} slides visually and return a JSON object with this structure:

{
  "slides": [
    {
      "slideNumber": 1,
      "category": "<title|problem|solution|features|benefits|usecases|pricing|cta|other>",
      "textDensity": "<low|medium|high>",
      "visualElements": ["<list of visual elements>"],
      "colorScheme": ["<hex colors>"],
      "layout": "<centered|left-aligned|grid|two-column|image-heavy>",
      "suggestions": ["<improvement suggestions>"]
    }
    // ... for each slide
  ],
  "overallTheme": "<description of consistent visual theme>",
  "deckFlow": "<narrative flow from start to finish>",
  "missingSlides": ["<suggested slides that would improve the deck>"],
  "recommendations": ["<strategic deck-level improvements>"]
}`;

  switch (goal) {
    case 'structure':
      return `${basePrompt}\n\nFocus on STRUCTURE: Analyze deck flow, identify gaps, suggest missing slides. Keep individual slide analysis minimal.`;

    case 'recommendations':
      return `${basePrompt}\n\nFocus on RECOMMENDATIONS: Provide actionable suggestions for improving the deck's effectiveness. Be specific and prioritize high-impact changes.`;

    case 'full':
    default:
      return `${basePrompt}\n\nProvide COMPREHENSIVE analysis: detailed slide-by-slide breakdown + deck-level insights + actionable recommendations.`;
  }
}

/**
 * ADK Tool Schema (to be exported by tools/index.ts)
 */
export const analyzeDeckTool = {
  name: 'analyzeDeckTool',
  description: 'Analyze an ENTIRE deck using batch vision to understand structure, flow, and identify improvements',
  parameters: {
    type: 'object',
    properties: {
      slides: {
        type: 'array',
        description: 'Array of slide objects with id, name, and src (base64 image)',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            src: { type: 'string' }
          },
          required: ['id', 'name', 'src']
        }
      },
      analysisGoal: {
        type: 'string',
        enum: ['structure', 'full', 'recommendations'],
        description: 'What aspect of the deck to focus on'
      }
    },
    required: ['slides', 'analysisGoal']
  },
  execute: analyzeDeck
};
