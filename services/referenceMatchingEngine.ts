/**
 * Reference Matching Engine
 *
 * Intelligently matches slide specifications to reference slides using Gemini 2.5 Pro.
 * Uses a single API call to analyze all slides and references together for optimal matching.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  ReferenceMatch,
  MatchWithBlueprint,
  DeepDesignBlueprint,
} from '../types/referenceMatching';
import { analyzeReferenceSlide } from './deepReferenceAnalyzer';

// Initialize Gemini API
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Slide specification from Master Agent
 */
export interface SlideSpecification {
  slideNumber: number;
  slideType: string;
  headline: string;
  content: string;
  visualDescription?: string;
  dataVisualization?: string;
  brandContext?: string;
}

/**
 * Reference slide item from style library
 */
export interface StyleLibraryItem {
  name: string;
  src: string;
  type: 'image' | 'pdf';
  uploadedAt?: number;
}

/**
 * Matching prompt for Gemini 2.5 Pro
 */
const MATCHING_PROMPT = `You are an expert presentation designer matching slide specifications to reference templates.

Your task is to analyze the slide specifications and available reference slides, then determine the BEST reference for each slide.

MATCHING CRITERIA:

1. **Content Type Match** (40% weight)
   - Title/cover slides → title/cover references
   - Content/bullet slides → content references
   - Data visualization slides → chart/data references
   - Image-heavy slides → image references
   - Closing/CTA slides → closing references

2. **Visual Hierarchy Match** (30% weight)
   - Center-focused content → centered references
   - Left-aligned content → left-aligned references
   - Split content → split-layout references
   - Text density (high/low) → matching density references

3. **Brand Context Match** (20% weight)
   - Technical/engineering content → technical-styled references
   - Executive/strategic content → clean professional references
   - Creative/marketing content → visually rich references

4. **Layout Compatibility** (10% weight)
   - Number of elements (few → minimal reference, many → dense reference)
   - Whitespace requirements
   - Content structure

REFERENCE SLIDE INFORMATION:
{{REFERENCES}}

SLIDE SPECIFICATIONS TO MATCH:
{{SLIDE_SPECS}}

OUTPUT FORMAT (JSON only, no markdown):
{
  "matches": [
    {
      "slideNumber": 1,
      "referenceName": "reference-name.png",
      "matchScore": 85,
      "matchReason": "Detailed explanation of why this reference is the best match for this slide. Include: content type alignment, visual hierarchy compatibility, and specific design elements that make this reference ideal.",
      "category": "title | content | data-viz | image-content | closing"
    }
  ],
  "overallStrategy": "Brief summary of the matching strategy used across all slides"
}

IMPORTANT GUIDELINES:

1. Each slide MUST be matched to exactly ONE reference (the best fit)
2. It's OK to use the same reference for multiple slides if it's truly the best match
3. Match scores should range from 60-100 (anything below 60 means poor fit)
4. Match reasoning should be 2-3 sentences explaining the decision
5. Category should help with future filtering and analysis
6. Consider the FULL context of the presentation when matching

Return ONLY valid JSON, no markdown formatting.`;

/**
 * Matches slide specifications to reference slides using intelligent AI matching
 *
 * @param slideSpecs - Array of slide specifications from Master Agent
 * @param references - Array of reference slides from style library
 * @returns Map of slideNumber → MatchWithBlueprint
 */
export async function matchReferencesToSlides(
  slideSpecs: SlideSpecification[],
  references: StyleLibraryItem[]
): Promise<Map<number, MatchWithBlueprint>> {
  if (references.length === 0) {
    throw new Error('No reference slides provided');
  }

  if (slideSpecs.length === 0) {
    throw new Error('No slide specifications provided');
  }

  try {
    // Step 1: Prepare reference descriptions with visual analysis
    const referenceDescriptions = await Promise.all(
      references.map(async (ref, index) => {
        // Quick visual analysis to categorize reference
        const category = await quickCategorizeReference(ref.src);
        return {
          index: index + 1,
          name: ref.name,
          category,
          description: `Reference ${index + 1}: ${ref.name} (${category})`,
        };
      })
    );

    // Step 2: Prepare slide specifications text
    const slideSpecsText = slideSpecs
      .map(
        spec => `
Slide ${spec.slideNumber}:
- Type: ${spec.slideType}
- Headline: ${spec.headline}
- Content: ${spec.content.substring(0, 200)}${spec.content.length > 200 ? '...' : ''}
${spec.visualDescription ? `- Visual: ${spec.visualDescription}` : ''}
${spec.dataVisualization ? `- Data: ${spec.dataVisualization}` : ''}
${spec.brandContext ? `- Brand Context: ${spec.brandContext}` : ''}
`
      )
      .join('\n');

    const referencesText = referenceDescriptions
      .map(ref => `${ref.description}`)
      .join('\n');

    // Step 3: Run matching with Gemini 2.5 Pro
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-thinking-exp',
    });

    const prompt = MATCHING_PROMPT
      .replace('{{REFERENCES}}', referencesText)
      .replace('{{SLIDE_SPECS}}', slideSpecsText);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Remove markdown code blocks if present
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const matchingResult = JSON.parse(jsonText) as {
      matches: Array<{
        slideNumber: number;
        referenceName: string;
        matchScore: number;
        matchReason: string;
        category: string;
      }>;
      overallStrategy: string;
    };

    console.log('Matching strategy:', matchingResult.overallStrategy);

    // Step 4: Create map of matches with full reference data
    const matchMap = new Map<number, MatchWithBlueprint>();

    for (const match of matchingResult.matches) {
      // Find the reference by name
      const reference = references.find(ref => ref.name === match.referenceName);

      if (!reference) {
        console.warn(`Reference ${match.referenceName} not found, skipping slide ${match.slideNumber}`);
        continue;
      }

      // Create the match object
      const referenceMatch: ReferenceMatch = {
        slideNumber: match.slideNumber,
        referenceSrc: reference.src,
        referenceName: reference.name,
        matchScore: match.matchScore,
        matchReason: match.matchReason,
        category: match.category,
      };

      // Analyze the reference to get deep blueprint
      // Include slide context to inform the analysis
      const slideSpec = slideSpecs.find(s => s.slideNumber === match.slideNumber);
      const slideContext = slideSpec
        ? `This reference will be used for: ${slideSpec.slideType} - "${slideSpec.headline}". Content: ${slideSpec.content.substring(0, 300)}`
        : undefined;

      const blueprint = await analyzeReferenceSlide(reference.src, slideContext);

      matchMap.set(match.slideNumber, {
        match: referenceMatch,
        blueprint,
      });
    }

    return matchMap;
  } catch (error) {
    console.error('Error matching references to slides:', error);
    throw new Error(
      `Failed to match references: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Quick categorization of a reference slide using Gemini
 */
async function quickCategorizeReference(referenceUrl: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-thinking-exp',
    });

    // Fetch the image
    let imageData: string;
    if (referenceUrl.startsWith('data:')) {
      imageData = referenceUrl;
    } else {
      const response = await fetch(referenceUrl);
      const blob = await response.blob();
      imageData = await blobToBase64(blob);
    }

    const [mimeTypePart, base64Data] = imageData.split(',');
    const mimeType = mimeTypePart.match(/:(.*?);/)?.[1] || 'image/png';

    const prompt = `Categorize this slide into ONE of these categories:
- "title" - Title/cover slide with large headline
- "content" - Text content, bullets, paragraphs
- "data-viz" - Charts, graphs, data visualizations
- "image-content" - Heavy use of images/photos
- "closing" - Closing slide, CTA, contact info

Respond with ONLY the category name, nothing else.`;

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      { text: prompt },
    ]);

    const category = result.response.text().trim().toLowerCase();

    // Validate category
    const validCategories = ['title', 'content', 'data-viz', 'image-content', 'closing'];
    if (validCategories.includes(category)) {
      return category;
    } else {
      return 'content'; // Default fallback
    }
  } catch (error) {
    console.error('Error categorizing reference:', error);
    return 'content'; // Default fallback
  }
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
 * Validates that all slides have been matched
 */
export function validateMatching(
  slideSpecs: SlideSpecification[],
  matchMap: Map<number, MatchWithBlueprint>
): { valid: boolean; missingSlides: number[] } {
  const missingSlides: number[] = [];

  for (const spec of slideSpecs) {
    if (!matchMap.has(spec.slideNumber)) {
      missingSlides.push(spec.slideNumber);
    }
  }

  return {
    valid: missingSlides.length === 0,
    missingSlides,
  };
}

/**
 * Gets statistics about the matching results
 */
export function getMatchingStats(matchMap: Map<number, MatchWithBlueprint>): {
  totalMatches: number;
  averageScore: number;
  byCategory: { [category: string]: number };
  byReference: { [referenceName: string]: number };
} {
  const byCategory: { [category: string]: number } = {};
  const byReference: { [referenceName: string]: number } = {};
  let totalScore = 0;

  matchMap.forEach(({ match }) => {
    // Count by category
    if (match.category) {
      byCategory[match.category] = (byCategory[match.category] || 0) + 1;
    }

    // Count by reference
    byReference[match.referenceName] = (byReference[match.referenceName] || 0) + 1;

    // Sum scores
    totalScore += match.matchScore;
  });

  return {
    totalMatches: matchMap.size,
    averageScore: matchMap.size > 0 ? totalScore / matchMap.size : 0,
    byCategory,
    byReference,
  };
}
