/**
 * Reference Matching Engine
 *
 * Intelligently matches slide specifications to reference slides using Gemini 2.5 Pro.
 * Uses a single API call to analyze all slides and references together for optimal matching.
 *
 * Enhanced with RAG (Retrieval-Augmented Generation) for pre-filtering large libraries.
 */

import { GoogleGenAI } from '@google/genai';
import type {
  ReferenceMatch,
  MatchWithBlueprint,
  DeepDesignBlueprint,
} from '../types/referenceMatching';
import { analyzeReferenceSlide } from './deepReferenceAnalyzer';
import { browserLogger } from './browserLogger';
import { searchSlidesByText, isRAGServiceAvailable } from './ragService';
import { selectReferenceSlidesForDeck, SlideSpec } from './slideSelectionAgent';

// Handle both Node.js (backend) and browser (frontend) environments
const apiKey = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env.VITE_GEMINI_API_KEY
  : process.env.VITE_GEMINI_API_KEY;

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey });

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
    browserLogger.error('No reference slides provided');
    throw new Error('No reference slides provided');
  }

  if (slideSpecs.length === 0) {
    browserLogger.error('No slide specifications provided');
    throw new Error('No slide specifications provided');
  }

  browserLogger.info(`Starting reference matching: ${slideSpecs.length} slides, ${references.length} references`);

  // RAG Pre-filtering: If library is large, use RAG to narrow down candidates
  // Note: For smaller libraries, visual layout matching is better done by Gemini seeing all options
  let filteredReferences = references;
  const RAG_THRESHOLD = 50; // Only use RAG if more than 50 references

  if (references.length > RAG_THRESHOLD) {
    try {
      const ragAvailable = await isRAGServiceAvailable();
      if (ragAvailable) {
        browserLogger.info(`[RAG] Pre-filtering ${references.length} references...`);
        const matchedUrls = new Set<string>();

        // Search RAG for each slide specification
        for (const spec of slideSpecs) {
          const query = [spec.slideType, spec.headline, spec.content?.substring(0, 100)]
            .filter(Boolean)
            .join(' ');

          if (query.trim()) {
            const searchResult = await searchSlidesByText(query, { topK: 5 });
            if (searchResult.success && searchResult.results) {
              for (const result of searchResult.results) {
                matchedUrls.add(result.imageUrl);
              }
            }
          }
        }

        if (matchedUrls.size > 0) {
          // Filter references to only RAG-matched ones
          filteredReferences = references.filter(ref => matchedUrls.has(ref.src));
          browserLogger.info(`[RAG] ✅ Filtered from ${references.length} to ${filteredReferences.length} relevant references`);

          // Fall back to full list if RAG filtered too aggressively
          if (filteredReferences.length < 3) {
            browserLogger.warn(`[RAG] Too few matches, using full library`);
            filteredReferences = references;
          }
        } else {
          browserLogger.warn(`[RAG] No matches found, using full library`);
        }
      }
    } catch (ragError) {
      browserLogger.warn(`[RAG] Pre-filter failed, using full library:`, ragError);
    }
  }

  try {
    // Step 1: Prepare reference descriptions with visual analysis
    const referenceDescriptions = await Promise.all(
      filteredReferences.map(async (ref, index) => {
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
    const prompt = MATCHING_PROMPT
      .replace('{{REFERENCES}}', referencesText)
      .replace('{{SLIDE_SPECS}}', slideSpecsText);

    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    const responseText = result.text;

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
    browserLogger.info('Matching strategy', { strategy: matchingResult.overallStrategy });

    // Step 4: Create map of matches with full reference data
    const matchMap = new Map<number, MatchWithBlueprint>();

    for (const match of matchingResult.matches) {
      // Strip category suffix and file extension from referenceName if present
      // Gemini returns names like "Name (content).png" or "Name.png" but we stored "Name"
      let cleanReferenceName = match.referenceName
        .replace(/\.png$/i, '')            // Remove .png extension first
        .replace(/\s*\([^)]+\)\s*$/, '')  // Then remove (content), (image-content), etc.
        .trim();

      // Find the reference by name (also clean the reference name for comparison)
      const reference = filteredReferences.find(ref => {
        const cleanRefName = ref.name
          .replace(/\.png$/i, '')
          .replace(/\s*\([^)]+\)\s*$/, '')
          .trim();
        return cleanRefName === cleanReferenceName;
      });

      if (!reference) {
        const message = `Reference ${match.referenceName} (cleaned: ${cleanReferenceName}) not found, skipping slide ${match.slideNumber}`;
        console.warn(message);
        console.warn(`Available references: ${filteredReferences.map(r => r.name).join(', ')}`);
        browserLogger.warn(message);
        continue;
      }

      browserLogger.info(`Matched slide ${match.slideNumber} to reference`, {
        slideNumber: match.slideNumber,
        referenceName: cleanReferenceName,
        matchScore: match.matchScore,
        category: match.category
      });

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

    browserLogger.info(`Reference matching complete: ${matchMap.size} slides matched`);
    return matchMap;
  } catch (error) {
    console.error('Error matching references to slides:', error);
    browserLogger.error('Error matching references to slides', { error: error instanceof Error ? error.message : 'Unknown error' });
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
    // Fetch the image
    let imageData: string;
    if (referenceUrl.startsWith('data:')) {
      imageData = referenceUrl;
    } else {
      const response = await fetch(referenceUrl);
      const blob = await response.blob();
      imageData = await blobToBase64(blob);
    }

    const match = imageData.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
      throw new Error('Invalid base64 image data string.');
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const prompt = `Categorize this slide into ONE of these categories:
- "title" - Title/cover slide with large headline
- "content" - Text content, bullets, paragraphs
- "data-viz" - Charts, graphs, data visualizations
- "image-content" - Heavy use of images/photos
- "closing" - Closing slide, CTA, contact info

Respond with ONLY the category name, nothing else.`;

    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Upgraded to 3.0 Pro for better vision
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

    const category = result.text.trim().toLowerCase();

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

/**
 * Agent-based reference matching using the ADK Slide Selection Agent
 *
 * This is an alternative to matchReferencesToSlides that uses an intelligent
 * agent with tools to search and select the best references. The agent can:
 * - Search by semantic similarity (text descriptions)
 * - Search by metadata filters (layout, content type, visual elements)
 * - Visually analyze candidates with Gemini Vision
 * - Iterate if initial results aren't satisfactory
 *
 * Use this when:
 * - You have a large library indexed in RAG with rich classification metadata
 * - You want more intelligent, iterative matching
 * - The simple RAG pre-filter + Gemini matching isn't finding good matches
 *
 * @param slideSpecs - Array of slide specifications from Master Agent
 * @param options - Optional configuration
 * @returns Map of slideNumber → MatchWithBlueprint
 */
export async function matchReferencesWithAgent(
  slideSpecs: SlideSpecification[],
  options: {
    maxIterationsPerSlide?: number;
    concurrency?: number;
  } = {}
): Promise<Map<number, MatchWithBlueprint>> {
  const { maxIterationsPerSlide = 3, concurrency = 2 } = options;

  if (slideSpecs.length === 0) {
    browserLogger.error('No slide specifications provided');
    throw new Error('No slide specifications provided');
  }

  browserLogger.info(`[AgentMatching] Starting agent-based matching for ${slideSpecs.length} slides`);

  try {
    // Convert SlideSpecification to SlideSpec format for the agent
    const agentSlideSpecs: SlideSpec[] = slideSpecs.map(spec => ({
      slideNumber: spec.slideNumber,
      slideType: spec.slideType,
      headline: spec.headline,
      content: spec.content,
      visualDescription: spec.visualDescription,
      dataVisualization: spec.dataVisualization,
      brandContext: spec.brandContext,
    }));

    // Run the agent to select references
    const agentResults = await selectReferenceSlidesForDeck(agentSlideSpecs, {
      maxIterationsPerSlide,
      concurrency,
    });

    // Convert agent results to MatchWithBlueprint format
    const matchMap = new Map<number, MatchWithBlueprint>();

    for (const [slideNumber, result] of agentResults) {
      const slideSpec = slideSpecs.find(s => s.slideNumber === slideNumber);
      if (!slideSpec) continue;

      // Get the selected slide reference
      const selectedSlide = result.selectedSlide;

      // Analyze the reference to get deep blueprint
      const slideContext = `This reference will be used for: ${slideSpec.slideType} - "${slideSpec.headline}". Content: ${slideSpec.content.substring(0, 300)}`;
      const blueprint = await analyzeReferenceSlide(selectedSlide.imageUrl, slideContext);

      // Create the match result
      const referenceMatch: ReferenceMatch = {
        slideNumber,
        referenceSrc: selectedSlide.imageUrl,
        referenceName: selectedSlide.deckName || `Slide ${selectedSlide.slideIndex}`,
        matchScore: result.matchScore,
        matchReason: result.matchReason,
        category: selectedSlide.classification?.contentType || 'content',
      };

      matchMap.set(slideNumber, {
        match: referenceMatch,
        blueprint,
      });

      browserLogger.info(`[AgentMatching] Matched slide ${slideNumber}`, {
        score: result.matchScore,
        iterations: result.searchIterations,
        toolCalls: result.toolCallsUsed.length,
      });
    }

    browserLogger.info(`[AgentMatching] Completed: ${matchMap.size}/${slideSpecs.length} slides matched`);
    return matchMap;
  } catch (error) {
    console.error('[AgentMatching] Error:', error);
    browserLogger.error('[AgentMatching] Error', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw new Error(
      `Agent-based matching failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Determines which matching strategy to use based on context
 *
 * Decision factors:
 * - Library size: Large libraries benefit more from agent-based matching
 * - RAG availability: Agent requires RAG service to be available
 * - Complexity: Complex slide types benefit from agent's iterative approach
 *
 * @param referenceCount - Number of references in the library
 * @param slideSpecs - The slide specifications to match
 * @returns 'agent' | 'standard' - Recommended matching strategy
 */
export async function recommendMatchingStrategy(
  referenceCount: number,
  slideSpecs: SlideSpecification[]
): Promise<'agent' | 'standard'> {
  // Check if RAG is available (required for agent-based matching)
  const ragAvailable = await isRAGServiceAvailable();

  if (!ragAvailable) {
    browserLogger.info('[Strategy] RAG not available, using standard matching');
    return 'standard';
  }

  // Use agent for large libraries (where RAG pre-filtering helps most)
  if (referenceCount > 50) {
    browserLogger.info(`[Strategy] Large library (${referenceCount} refs), recommending agent`);
    return 'agent';
  }

  // Check for complex slide types that benefit from iterative matching
  const complexTypes = ['technical', 'comparison', 'data-viz', 'timeline', 'architecture'];
  const hasComplexSlides = slideSpecs.some(spec =>
    complexTypes.some(type =>
      spec.slideType.toLowerCase().includes(type) ||
      spec.visualDescription?.toLowerCase().includes(type)
    )
  );

  if (hasComplexSlides) {
    browserLogger.info('[Strategy] Complex slides detected, recommending agent');
    return 'agent';
  }

  // Default to standard for smaller, simpler cases
  browserLogger.info('[Strategy] Using standard matching');
  return 'standard';
}

/**
 * Result of base template selection
 */
export interface DeckBaseTemplates {
  titleTemplate: {
    imageUrl: string;
    name: string;
    matchScore: number;
    matchReason: string;
  } | null;
  contentTemplate: {
    imageUrl: string;
    name: string;
    matchScore: number;
    matchReason: string;
  } | null;
}

/**
 * Selects the best base templates for a deck from the style library.
 *
 * This ensures visual consistency across all slides by:
 * 1. Finding the best TITLE slide template (for slide 1)
 * 2. Finding the best CONTENT slide template (for slides 2-N)
 *
 * These templates define the consistent layout elements:
 * - Logo position
 * - Page number position
 * - Header position and styling
 * - Footer layout
 *
 * @param styleLibrary - Array of style library items
 * @param deckContext - Brief description of the deck being created
 * @returns DeckBaseTemplates with selected title and content templates
 */
export async function selectDeckBaseTemplates(
  styleLibrary: StyleLibraryItem[],
  deckContext?: string
): Promise<DeckBaseTemplates> {
  browserLogger.info(`[BaseTemplates] Selecting base templates from ${styleLibrary.length} items`);

  if (styleLibrary.length === 0) {
    browserLogger.warn('[BaseTemplates] No style library items, returning null templates');
    return { titleTemplate: null, contentTemplate: null };
  }

  // If only 1-2 slides, use them directly
  if (styleLibrary.length <= 2) {
    browserLogger.info('[BaseTemplates] Small library, using first item(s) directly');
    const titleTemplate = styleLibrary[0] ? {
      imageUrl: styleLibrary[0].src,
      name: styleLibrary[0].name,
      matchScore: 100,
      matchReason: 'Only template available in style library',
    } : null;

    const contentTemplate = styleLibrary[1] || styleLibrary[0] ? {
      imageUrl: (styleLibrary[1] || styleLibrary[0]).src,
      name: (styleLibrary[1] || styleLibrary[0]).name,
      matchScore: 100,
      matchReason: 'Only template available in style library',
    } : null;

    return { titleTemplate, contentTemplate };
  }

  try {
    // Try to use RAG for intelligent template selection
    const ragAvailable = await isRAGServiceAvailable();

    if (ragAvailable) {
      browserLogger.info('[BaseTemplates] Using RAG for template selection');
      return await selectTemplatesWithRAG(styleLibrary, deckContext);
    } else {
      browserLogger.info('[BaseTemplates] RAG unavailable, using Gemini classification');
      return await selectTemplatesWithGemini(styleLibrary, deckContext);
    }
  } catch (error) {
    console.error('[BaseTemplates] Error selecting templates:', error);
    browserLogger.error('[BaseTemplates] Error', { error: error instanceof Error ? error.message : 'Unknown' });

    // Fallback: categorize locally and pick first of each type
    return await selectTemplatesWithGemini(styleLibrary, deckContext);
  }
}

/**
 * Select templates using RAG search
 */
async function selectTemplatesWithRAG(
  styleLibrary: StyleLibraryItem[],
  deckContext?: string
): Promise<DeckBaseTemplates> {
  // Search for title templates
  const titleQuery = `title slide cover slide opening slide ${deckContext || ''}`.trim();
  const titleResults = await searchSlidesByText(titleQuery, { topK: 3 });

  // Search for content templates
  const contentQuery = `content slide body slide information slide bullets ${deckContext || ''}`.trim();
  const contentResults = await searchSlidesByText(contentQuery, { topK: 3 });

  let titleTemplate: DeckBaseTemplates['titleTemplate'] = null;
  let contentTemplate: DeckBaseTemplates['contentTemplate'] = null;

  // Find best title template from results
  if (titleResults.success && titleResults.results && titleResults.results.length > 0) {
    const best = titleResults.results[0];
    // Match to style library item
    const libraryItem = styleLibrary.find(item => item.src === best.imageUrl);
    titleTemplate = {
      imageUrl: best.imageUrl,
      name: libraryItem?.name || best.deckName || 'Title Template',
      matchScore: Math.round((1 - (best.distance || 0)) * 100),
      matchReason: `Selected via RAG search as best title/cover slide match${deckContext ? ` for ${deckContext}` : ''}`,
    };
  }

  // Find best content template from results
  if (contentResults.success && contentResults.results && contentResults.results.length > 0) {
    // Try to avoid selecting the same template as title
    const candidates = contentResults.results.filter(r => r.imageUrl !== titleTemplate?.imageUrl);
    const best = candidates[0] || contentResults.results[0];
    const libraryItem = styleLibrary.find(item => item.src === best.imageUrl);
    contentTemplate = {
      imageUrl: best.imageUrl,
      name: libraryItem?.name || best.deckName || 'Content Template',
      matchScore: Math.round((1 - (best.distance || 0)) * 100),
      matchReason: `Selected via RAG search as best content slide template${deckContext ? ` for ${deckContext}` : ''}`,
    };
  }

  // Fallback to Gemini if RAG didn't return results
  if (!titleTemplate || !contentTemplate) {
    browserLogger.warn('[BaseTemplates] RAG returned incomplete results, supplementing with Gemini');
    const geminiTemplates = await selectTemplatesWithGemini(styleLibrary, deckContext);
    titleTemplate = titleTemplate || geminiTemplates.titleTemplate;
    contentTemplate = contentTemplate || geminiTemplates.contentTemplate;
  }

  browserLogger.info('[BaseTemplates] Selected templates via RAG', {
    title: titleTemplate?.name,
    content: contentTemplate?.name,
  });

  return { titleTemplate, contentTemplate };
}

/**
 * Select templates using Gemini visual analysis
 */
async function selectTemplatesWithGemini(
  styleLibrary: StyleLibraryItem[],
  deckContext?: string
): Promise<DeckBaseTemplates> {
  // Categorize all slides first
  const categorized: Array<{
    item: StyleLibraryItem;
    category: string;
  }> = [];

  // Process in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < styleLibrary.length && categorized.length < 10; i += batchSize) {
    const batch = styleLibrary.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async item => {
        const category = await quickCategorizeReference(item.src);
        return { item, category };
      })
    );
    categorized.push(...results);
  }

  // Find title slides
  const titleSlides = categorized.filter(c => c.category === 'title');
  const contentSlides = categorized.filter(c =>
    c.category === 'content' || c.category === 'data-viz' || c.category === 'image-content'
  );

  let titleTemplate: DeckBaseTemplates['titleTemplate'] = null;
  let contentTemplate: DeckBaseTemplates['contentTemplate'] = null;

  // Pick best title
  if (titleSlides.length > 0) {
    titleTemplate = {
      imageUrl: titleSlides[0].item.src,
      name: titleSlides[0].item.name,
      matchScore: 90,
      matchReason: `Classified as title slide via Gemini vision analysis`,
    };
  } else if (categorized.length > 0) {
    // Use first slide as title template
    titleTemplate = {
      imageUrl: categorized[0].item.src,
      name: categorized[0].item.name,
      matchScore: 70,
      matchReason: `Fallback: First slide in library (no explicit title slide found)`,
    };
  }

  // Pick best content template (different from title)
  const contentCandidates = contentSlides.filter(c => c.item.src !== titleTemplate?.imageUrl);
  if (contentCandidates.length > 0) {
    contentTemplate = {
      imageUrl: contentCandidates[0].item.src,
      name: contentCandidates[0].item.name,
      matchScore: 90,
      matchReason: `Classified as content slide via Gemini vision analysis`,
    };
  } else if (categorized.length > 1) {
    // Use second slide as content template
    const secondSlide = categorized.find(c => c.item.src !== titleTemplate?.imageUrl);
    if (secondSlide) {
      contentTemplate = {
        imageUrl: secondSlide.item.src,
        name: secondSlide.item.name,
        matchScore: 70,
        matchReason: `Fallback: Second distinct slide in library`,
      };
    }
  }

  browserLogger.info('[BaseTemplates] Selected templates via Gemini classification', {
    title: titleTemplate?.name,
    content: contentTemplate?.name,
  });

  return { titleTemplate, contentTemplate };
}
