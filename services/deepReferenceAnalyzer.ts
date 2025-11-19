/**
 * Deep Reference Analyzer Service
 *
 * Uses Gemini 2.5 Pro to extract comprehensive design blueprints from reference slides.
 * Analyzes background, layout, typography, spacing, visual elements, and brand elements.
 */

import { GoogleGenAI } from '@google/genai';
import type {
  DeepDesignBlueprint,
  BackgroundDesign,
  ContentLayout,
  VisualHierarchy,
  Typography,
  Spacing,
  VisualElements,
  BrandElements,
  GenerationStrategyDetails,
} from '../types/referenceMatching';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * Deep analysis prompt for extracting design blueprint from reference slide
 */
const DEEP_ANALYSIS_PROMPT = `You are an expert presentation designer analyzing a reference slide image.

Your task is to extract a COMPREHENSIVE design blueprint that can be used to either:
1. Modify this exact slide (changing text, updating charts, etc.) - PREFERRED when possible
2. Recreate a similar slide from scratch with different content

CRITICAL: Gemini's image generation excels at MODIFICATIONS (changing/adding to existing images).
Therefore, PREFER "build-on-top" approach when feasible - we want to maximize reuse of the base image.

Extract the following information in JSON format:

{
  "background": {
    "type": "solid | gradient | image | pattern | hybrid",
    "colors": ["#hexcode1", "#hexcode2", ...],
    "description": "Detailed visual description of the background",
    "technique": "How to recreate or modify this background (be specific)",
    "complexity": 1-5 (5 = very complex, better to preserve in modifications)
  },
  "contentLayout": {
    "structure": "Overall layout description (e.g., 'centered headline over background', 'left-aligned content with right sidebar')",
    "gridSystem": "Grid system used (e.g., '12-column', 'golden ratio', 'thirds', 'custom')",
    "margins": {
      "top": "pixels or percentage",
      "bottom": "pixels or percentage",
      "left": "pixels or percentage",
      "right": "pixels or percentage"
    },
    "keyElements": [
      {
        "type": "headline | body | image | icon | chart | logo | shape | other",
        "position": {"x": "value", "y": "value", "width": "value", "height": "value"},
        "size": "description",
        "purpose": "what this element does",
        "alignment": "left | center | right | justify"
      }
    ],
    "whitespacePercentage": 0-100
  },
  "visualHierarchy": {
    "primaryFocus": "What the eye sees first",
    "secondaryElements": ["Supporting elements"],
    "tertiaryElements": ["Background/subtle elements"],
    "flowPattern": "How the eye moves (Z-pattern, F-pattern, circular, etc.)",
    "contrastRatios": {
      "primaryToBackground": 4.5,
      "secondaryToBackground": 3.0
    }
  },
  "typography": {
    "headline": {
      "font": "Font name or closest match",
      "size": "in pt or px",
      "color": "#hexcode",
      "spacing": "line-height and letter-spacing",
      "position": "placement on slide",
      "treatment": "bold, shadow, outline, etc.",
      "weight": 100-900,
      "alignment": "left | center | right"
    },
    "body": {
      "font": "Font name or closest match",
      "size": "in pt or px",
      "color": "#hexcode",
      "spacing": "line-height and letter-spacing",
      "position": "placement on slide",
      "treatment": "treatments applied",
      "weight": 100-900,
      "alignment": "left | center | right"
    },
    "code": {
      // Same structure, only if code/monospace text is present
    },
    "caption": {
      // Same structure, only if captions/footnotes are present
    }
  },
  "spacing": {
    "verticalRhythm": "Spacing between vertical elements (e.g., '24px baseline')",
    "horizontalPadding": "Spacing between horizontal elements",
    "elementGaps": "Gaps between grouped elements",
    "baselineGrid": "Baseline grid size if applicable"
  },
  "visualElements": {
    "icons": "Icon style, size, color, usage",
    "shapes": "Shapes used (circles, rectangles, lines) and their styling",
    "images": "Image treatment (rounded corners, shadows, overlays, etc.)",
    "charts": "Chart style (bar, line, pie) and visual treatment",
    "decorative": "Any decorative elements (patterns, textures, etc.)"
  },
  "brandElements": {
    "logo": "Logo position, size, color treatment",
    "colors": ["#brand1", "#brand2", ...],
    "patterns": "Brand-specific patterns or textures used",
    "motifs": "Recurring brand design motifs"
  },
  "generationStrategy": {
    "approach": "recreate | build-on-top",
    "reasoning": "Why this approach is best (PREFER build-on-top when possible since Gemini excels at modifications)",
    "specificInstructions": "DETAILED multi-paragraph instructions for Imagen on how to either modify this slide OR recreate it. Include exact positions, colors, sizes, techniques. Be VERY specific.",
    "confidence": 0-100
  }
}

IMPORTANT GUIDELINES:

1. **Background Complexity**: Rate 1-5. Higher complexity (gradients, photos, complex patterns) = prefer INPUT-MODIFY.

2. **Build-on-Top Strategy**: PREFER this approach when:
   - Background is complex (gradients, images, patterns)
   - Visual elements are well-designed and can be preserved
   - Changes are mostly text/content updates
   - Layout is solid and just needs content adaptation

3. **Recreate Strategy**: Only choose when:
   - Background is simple (solid color)
   - Content structure is radically different
   - Layout needs significant restructuring
   - Better quality can be achieved from scratch

4. **Specific Instructions**: Write 2-3 detailed paragraphs explaining EXACTLY how to:
   - For build-on-top: What to preserve, what to change, how to mask regions, what new content to add
   - For recreate: Step-by-step recreation with exact measurements, colors, positioning

5. **Measurements**: Always provide specific pixel or percentage values, not vague descriptions.

6. **Colors**: Always extract exact hex codes from the image.

7. **Typography**: Identify fonts or closest web-safe alternatives.

Return ONLY valid JSON, no markdown formatting.`;

/**
 * Analyzes a reference slide image and extracts a deep design blueprint
 *
 * @param referenceImageUrl - URL or data URL of the reference slide
 * @param slideContext - Optional context about what type of slide this will be
 * @returns Deep design blueprint
 */
export async function analyzeReferenceSlide(
  referenceImageUrl: string,
  slideContext?: string
): Promise<DeepDesignBlueprint> {
  try {
    // Fetch the image if it's a URL
    let imageData: string;
    if (referenceImageUrl.startsWith('data:')) {
      imageData = referenceImageUrl;
    } else {
      const response = await fetch(referenceImageUrl);
      const blob = await response.blob();
      imageData = await blobToBase64(blob);
    }

    // Extract mime type and base64 data
    const match = imageData.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
      throw new Error('Invalid base64 image data string.');
    }
    const mimeType = match[1];
    const base64Data = match[2];

    // Build the prompt with optional context
    let prompt = DEEP_ANALYSIS_PROMPT;
    if (slideContext) {
      prompt += `\n\nCONTEXT FOR THIS SLIDE:\n${slideContext}\n\nUse this context to inform your analysis and strategy decision.`;
    }

    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        { text: prompt },
      ],
    });

    const responseText = result.text;

    // Remove markdown code blocks if present
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const blueprint = JSON.parse(jsonText) as DeepDesignBlueprint;

    // Validate the blueprint has required fields
    if (!blueprint.background || !blueprint.contentLayout || !blueprint.generationStrategy) {
      throw new Error('Invalid blueprint: missing required fields');
    }

    return blueprint;
  } catch (error) {
    console.error('Error analyzing reference slide:', error);
    throw new Error(`Failed to analyze reference slide: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Analyzes multiple reference slides and extracts blueprints for all
 *
 * @param referenceUrls - Array of reference image URLs
 * @param contexts - Optional array of contexts (parallel to referenceUrls)
 * @returns Map of referenceUrl → blueprint
 */
export async function analyzeMultipleReferences(
  referenceUrls: string[],
  contexts?: string[]
): Promise<Map<string, DeepDesignBlueprint>> {
  const results = new Map<string, DeepDesignBlueprint>();

  // Process references in parallel (but limit concurrency to avoid rate limits)
  const BATCH_SIZE = 3;
  for (let i = 0; i < referenceUrls.length; i += BATCH_SIZE) {
    const batch = referenceUrls.slice(i, i + BATCH_SIZE);
    const batchContexts = contexts?.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async (url, batchIndex) => {
      const context = batchContexts?.[batchIndex];
      try {
        const blueprint = await analyzeReferenceSlide(url, context);
        results.set(url, blueprint);
      } catch (error) {
        console.error(`Failed to analyze reference ${url}:`, error);
        // Continue with other references even if one fails
      }
    });

    await Promise.all(batchPromises);

    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < referenceUrls.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Converts a Blob to base64 data URL
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Generates a reference summary for Master Agent context
 *
 * @param blueprints - Map of referenceUrl → blueprint
 * @returns Summary object
 */
export function generateReferenceSummary(
  blueprints: Map<string, DeepDesignBlueprint>
): {
  totalReferences: number;
  byCategory: { [category: string]: number };
  description: string;
  referenceUrls: string[];
} {
  const byCategory: { [category: string]: number } = {};
  const descriptions: string[] = [];

  blueprints.forEach((blueprint, url) => {
    // Infer category from content layout and visual hierarchy
    const category = inferCategory(blueprint);
    byCategory[category] = (byCategory[category] || 0) + 1;

    // Collect key characteristics
    descriptions.push(
      `${category}: ${blueprint.background.type} background, ${blueprint.visualHierarchy.primaryFocus}`
    );
  });

  const totalReferences = blueprints.size;
  const categorySummary = Object.entries(byCategory)
    .map(([cat, count]) => `${count} ${cat}`)
    .join(', ');

  const description = `Available references (${totalReferences} total): ${categorySummary}. Designs feature ${descriptions.slice(0, 3).join('; ')}.`;

  return {
    totalReferences,
    byCategory,
    description,
    referenceUrls: Array.from(blueprints.keys()),
  };
}

/**
 * Infers the slide category from blueprint characteristics
 */
function inferCategory(blueprint: DeepDesignBlueprint): string {
  const primaryFocus = blueprint.visualHierarchy.primaryFocus.toLowerCase();
  const hasChart = blueprint.visualElements.charts.toLowerCase().includes('chart') ||
                   blueprint.visualElements.charts.toLowerCase().includes('graph');
  const hasImage = blueprint.contentLayout.keyElements.some(el => el.type === 'image');

  if (primaryFocus.includes('title') || primaryFocus.includes('cover') || primaryFocus.includes('headline')) {
    return 'title';
  } else if (hasChart) {
    return 'data-viz';
  } else if (hasImage) {
    return 'image-content';
  } else if (primaryFocus.includes('closing') || primaryFocus.includes('thank') || primaryFocus.includes('contact')) {
    return 'closing';
  } else {
    return 'content';
  }
}
