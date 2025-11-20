/**
 * matchSlidesToReferencesTool
 *
 * Intelligently match slide specifications to uploaded reference templates
 *
 * Use cases:
 * - User uploads company slide deck as reference templates
 * - Match each slide spec to the best reference for brand consistency
 * - Extract design blueprints from matched references
 * - Generate slides that perfectly match company brand
 *
 * @tool
 */

import type { ToolResult, MatchReferencesParams, MatchReferencesResult, SlideSpecification, StyleLibraryItem } from '../types';
import { matchReferencesToSlides, getMatchingStats, validateMatching } from '../../services/referenceMatchingEngine';

/**
 * Match slide specifications to reference slides
 */
export async function matchSlidesToReferences(params: MatchReferencesParams): Promise<ToolResult<MatchReferencesResult>> {
  const startTime = Date.now();

  try {
    console.log(`[matchSlidesToReferencesTool] Matching ${params.slideSpecifications.length} slides to ${params.styleLibraryItems.length} references`);

    // Validate inputs
    if (!params.slideSpecifications || params.slideSpecifications.length === 0) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'No slide specifications provided',
          details: 'slideSpecifications array is empty or missing',
        },
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    if (!params.styleLibraryItems || params.styleLibraryItems.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_REFERENCES',
          message: 'No reference slides available',
          details: 'styleLibraryItems array is empty. User needs to upload reference templates first.',
        },
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    // Convert to format expected by matching engine
    const slideSpecs = params.slideSpecifications.map(spec => ({
      slideNumber: spec.slideNumber,
      slideType: spec.slideType || 'content',
      headline: spec.headline,
      content: spec.content || spec.visualDescription || '',
      visualDescription: spec.visualDescription,
      dataVisualization: spec.dataVisualization,
      brandContext: spec.brandContext,
    }));

    const references = params.styleLibraryItems.map(item => ({
      name: item.name,
      src: item.src,
    }));

    console.log(`[matchSlidesToReferencesTool] Calling matchReferencesToSlides...`);

    // Call the matching engine
    const matchMap = await matchReferencesToSlides(slideSpecs, references);

    // Validate results
    const validation = validateMatching(slideSpecs, matchMap);
    if (!validation.valid) {
      console.warn(`[matchSlidesToReferencesTool] Warning: ${validation.missingSlides.length} slides not matched`);
    }

    // Get statistics
    const stats = getMatchingStats(matchMap);

    // Convert to result format
    const matches: MatchReferencesResult['matches'] = [];
    matchMap.forEach((matchWithBlueprint: any, slideNumber: number) => {
      matches.push({
        slideNumber,
        referenceName: matchWithBlueprint.match.referenceName,
        referenceSrc: matchWithBlueprint.match.referenceSrc,
        matchScore: matchWithBlueprint.match.matchScore,
        matchReason: matchWithBlueprint.match.matchReason,
        category: matchWithBlueprint.match.category,
        blueprint: matchWithBlueprint.blueprint, // Include full blueprint
      });
    });

    // Sort by slide number
    matches.sort((a, b) => a.slideNumber - b.slideNumber);

    const result: MatchReferencesResult = {
      matches,
      statistics: {
        totalSlides: slideSpecs.length,
        totalReferences: references.length,
        matchedSlides: stats.totalMatches,
        unmatchedSlides: validation.missingSlides,
        averageMatchScore: stats.averageScore,
        byCategory: stats.byCategory,
        byReference: stats.byReference,
      },
    };

    const executionTime = Date.now() - startTime;
    console.log(`[matchSlidesToReferencesTool] ✅ Matched ${result.statistics.matchedSlides}/${result.statistics.totalSlides} slides in ${executionTime}ms`);
    console.log(`[matchSlidesToReferencesTool] Average match score: ${result.statistics.averageMatchScore.toFixed(1)}%`);

    return {
      success: true,
      data: result,
      metadata: {
        executionTime,
        model: 'gemini-3-pro-preview', // Matching uses Gemini 3.0 Pro for vision
      },
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[matchSlidesToReferencesTool] ❌ Error:`, error);

    return {
      success: false,
      error: {
        code: 'MATCHING_FAILED',
        message: 'Failed to match slides to references',
        details: error.message,
      },
      metadata: {
        executionTime,
      },
    };
  }
}

/**
 * ADK Tool Schema (to be exported by tools/index.ts)
 */
export const matchSlidesToReferencesTool = {
  name: 'matchSlidesToReferencesTool',
  description: `Intelligently match slide specifications to uploaded reference templates using AI vision analysis.

  This tool analyzes both the slide content requirements and the visual design of reference templates to find the best match for each slide. It ensures perfect brand consistency by matching slides to templates with similar:
  - Content type (title, content, data visualization, closing)
  - Visual hierarchy (center-dominant, asymmetric, Z-pattern, etc.)
  - Layout structure (single column, multi-column, image-heavy, etc.)
  - Brand context (colors, typography, visual style)

  Returns matched references with design blueprints and quality scores (0-100).

  When to use:
  - User uploaded reference templates to style library
  - Need to generate slides matching company brand exactly
  - Want to ensure visual consistency across entire deck
  - User says "use my template slides" or "match my company style"

  Note: User must upload references to style library first. This tool works with existing styleLibraryItems.`,
  parameters: {
    type: 'object',
    properties: {
      slideSpecifications: {
        type: 'array',
        description: 'Array of slide specifications to match. Each spec should include slideNumber, headline, content, and optionally slideType, visualDescription, brandContext.',
        items: {
          type: 'object',
          properties: {
            slideNumber: { type: 'number' },
            headline: { type: 'string' },
            content: { type: 'string' },
            slideType: { type: 'string' },
            visualDescription: { type: 'string' },
            brandContext: { type: 'string' },
          },
          required: ['slideNumber', 'headline'],
        },
      },
      styleLibraryItems: {
        type: 'array',
        description: 'Array of reference slides from user\'s style library. Each item should include name (filename) and src (Firebase Storage URL or data URL).',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            src: { type: 'string' },
          },
          required: ['name', 'src'],
        },
      },
    },
    required: ['slideSpecifications', 'styleLibraryItems'],
  },
  execute: matchSlidesToReferences,
};
