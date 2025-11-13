/**
 * Reference Strategy Decider Service
 *
 * Determines whether to use INPUT-MODIFY or FULL-RECREATE strategy for each slide.
 * Biased towards INPUT-MODIFY since Gemini excels at modifications.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  StrategyDecision,
  GenerationStrategy,
  MaskRegion,
  PreservedElement,
  ChangedElement,
  DeepDesignBlueprint,
} from '../types/referenceMatching';
import type { SlideSpecification } from './referenceMatchingEngine';

// Initialize Gemini API
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Strategy decision prompt for Gemini 2.5 Pro
 */
const STRATEGY_PROMPT = `You are an expert AI image generation strategist specializing in presentation slides.

Your task is to decide the OPTIMAL generation strategy for creating a new slide based on a reference slide.

CRITICAL CONTEXT:
- Gemini's image generation model is EXCELLENT at modifying/editing existing images (INPUT-MODIFY)
- Gemini is GOOD at recreating from scratch (FULL-RECREATE), but modifications are often higher quality
- PREFER INPUT-MODIFY whenever feasible

REFERENCE SLIDE BLUEPRINT:
{{BLUEPRINT}}

NEW SLIDE SPECIFICATION:
{{SLIDE_SPEC}}

DECISION CRITERIA:

**PREFER INPUT-MODIFY (build-on-top) when:**
1. Background is complex (gradients, photos, patterns, textures) - complexity ≥ 3
2. Visual elements are well-designed and can be preserved (charts, icons, shapes)
3. Changes are primarily text/content updates
4. Layout structure is compatible (similar number of elements, similar hierarchy)
5. Layout compatibility ≥ 60%
6. Content divergence ≤ 60%

**USE FULL-RECREATE when:**
1. Background is simple (solid color, simple gradient) - complexity ≤ 2
2. Content structure is radically different (3 bullets → 8 bullets, single image → chart)
3. Layout needs significant restructuring
4. Visual style needs to be dramatically different
5. Layout compatibility < 60%
6. Content divergence > 60%
7. Reference quality is poor

**ANALYSIS STEPS:**

1. **Visual Complexity** (0-100):
   - Analyze background complexity from blueprint
   - Consider: gradients (complex), photos (very complex), patterns (complex), solid colors (simple)
   - Score: 0-30 (simple), 30-60 (moderate), 60-100 (complex)

2. **Layout Compatibility** (0-100):
   - Compare reference layout to new slide requirements
   - Consider: number of elements, element types, hierarchy, positioning
   - Score: 0-40 (incompatible), 40-70 (moderate), 70-100 (highly compatible)

3. **Content Divergence** (0-100):
   - How different is the new content from what the reference shows?
   - Consider: text changes, data changes, image changes, structural changes
   - Score: 0-30 (minimal changes), 30-60 (moderate changes), 60-100 (radical changes)

4. **Strategy Decision**:
   - If visualComplexity ≥ 60 AND layoutCompatibility ≥ 60 AND contentDivergence ≤ 60: INPUT-MODIFY
   - If layoutCompatibility ≥ 70 AND contentDivergence ≤ 50: INPUT-MODIFY (even if visual complexity is lower)
   - Otherwise: FULL-RECREATE

5. **For INPUT-MODIFY**: Generate mask regions and change instructions
6. **For FULL-RECREATE**: Generate detailed recreation blueprint

OUTPUT FORMAT (JSON only, no markdown):

For INPUT-MODIFY:
{
  "strategy": "input-modify",
  "confidence": 85,
  "reasoning": "Detailed 2-3 sentence explanation of why INPUT-MODIFY is optimal. Reference specific factors: background complexity, layout compatibility, content changes needed.",
  "modificationComplexity": "simple | moderate | complex",
  "visualComplexity": 75,
  "layoutCompatibility": 80,
  "contentDivergence": 35,
  "maskRegions": [
    {
      "type": "text | image | chart | icon | shape | background",
      "bounds": {"x": 100, "y": 200, "width": 800, "height": 150},
      "changeDescription": "Replace headline text from 'Q4 Results' to 'Q1 Forecast'",
      "priority": 1
    }
  ],
  "preservedElements": [
    {
      "type": "background-gradient",
      "reason": "Complex gradient should be preserved (high visual complexity)",
      "bounds": {"x": 0, "y": 0, "width": 1920, "height": 1080}
    }
  ],
  "changedElements": [
    {
      "type": "headline-text",
      "changeDescription": "Update headline text and adjust font size slightly",
      "complexity": 2
    }
  ]
}

For FULL-RECREATE:
{
  "strategy": "full-recreate",
  "confidence": 75,
  "reasoning": "Detailed 2-3 sentence explanation of why FULL-RECREATE is optimal. Reference specific factors that make modification infeasible.",
  "visualComplexity": 25,
  "layoutCompatibility": 45,
  "contentDivergence": 75
}

IMPORTANT GUIDELINES:

1. **Bias towards INPUT-MODIFY**: Default to this unless there's a clear reason not to
2. **Confidence**: 80-100 = very confident, 60-79 = moderately confident, <60 = low confidence
3. **Mask Regions**: For INPUT-MODIFY, identify SPECIFIC regions to change with exact pixel bounds
4. **Priority**: 1 = highest priority (must change), 5 = lowest priority (optional change)
5. **Complexity Ratings**: 1 = trivial (text color change), 5 = very complex (restructure entire layout)

Return ONLY valid JSON, no markdown formatting.`;

/**
 * Decides the optimal generation strategy for a slide
 *
 * @param slideSpec - Specification for the new slide
 * @param blueprint - Deep design blueprint from the matched reference
 * @param referenceImageUrl - URL of the reference image (for visual analysis)
 * @returns Strategy decision with detailed reasoning
 */
export async function decideGenerationStrategy(
  slideSpec: SlideSpecification,
  blueprint: DeepDesignBlueprint,
  referenceImageUrl: string
): Promise<StrategyDecision> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-thinking-exp',
    });

    // Prepare blueprint summary (without the lengthy specificInstructions)
    const blueprintSummary = {
      background: blueprint.background,
      contentLayout: {
        structure: blueprint.contentLayout.structure,
        gridSystem: blueprint.contentLayout.gridSystem,
        keyElements: blueprint.contentLayout.keyElements.map(el => ({
          type: el.type,
          purpose: el.purpose,
        })),
      },
      visualHierarchy: blueprint.visualHierarchy,
      typography: {
        headline: { font: blueprint.typography.headline.font, size: blueprint.typography.headline.size },
        body: { font: blueprint.typography.body.font, size: blueprint.typography.body.size },
      },
    };

    // Prepare slide spec summary
    const slideSpecSummary = `
Type: ${slideSpec.slideType}
Headline: ${slideSpec.headline}
Content: ${slideSpec.content}
${slideSpec.visualDescription ? `Visual: ${slideSpec.visualDescription}` : ''}
${slideSpec.dataVisualization ? `Data: ${slideSpec.dataVisualization}` : ''}
`;

    const prompt = STRATEGY_PROMPT
      .replace('{{BLUEPRINT}}', JSON.stringify(blueprintSummary, null, 2))
      .replace('{{SLIDE_SPEC}}', slideSpecSummary);

    // Fetch reference image for visual analysis
    let imageData: string;
    if (referenceImageUrl.startsWith('data:')) {
      imageData = referenceImageUrl;
    } else {
      const response = await fetch(referenceImageUrl);
      const blob = await response.blob();
      imageData = await blobToBase64(blob);
    }

    const [mimeTypePart, base64Data] = imageData.split(',');
    const mimeType = mimeTypePart.match(/:(.*?);/)?.[1] || 'image/png';

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      { text: prompt },
    ]);

    const responseText = result.response.text();

    // Remove markdown code blocks if present
    const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const decision = JSON.parse(jsonText) as StrategyDecision;

    // Validate the decision
    if (!decision.strategy || !decision.reasoning) {
      throw new Error('Invalid strategy decision: missing required fields');
    }

    if (decision.strategy !== 'input-modify' && decision.strategy !== 'full-recreate') {
      throw new Error(`Invalid strategy: ${decision.strategy}`);
    }

    // Log the decision for debugging
    console.log(`Strategy for slide ${slideSpec.slideNumber}:`, {
      strategy: decision.strategy,
      confidence: decision.confidence,
      visualComplexity: decision.visualComplexity,
      layoutCompatibility: decision.layoutCompatibility,
      contentDivergence: decision.contentDivergence,
    });

    return decision;
  } catch (error) {
    console.error('Error deciding generation strategy:', error);

    // Fallback to INPUT-MODIFY with moderate confidence
    // (since Gemini is better at modifications)
    return {
      strategy: 'input-modify',
      confidence: 50,
      reasoning: `Fallback to INPUT-MODIFY due to analysis error: ${error instanceof Error ? error.message : 'Unknown error'}. Gemini excels at modifications, so this is a safe default.`,
      modificationComplexity: 'moderate',
      visualComplexity: 50,
      layoutCompatibility: 70,
      contentDivergence: 50,
      maskRegions: [
        {
          type: 'text',
          bounds: { x: 0, y: 0, width: 1920, height: 1080 },
          changeDescription: 'Update all text content to match new slide specification',
          priority: 1,
        },
      ],
    };
  }
}

/**
 * Batch strategy decisions for multiple slides
 *
 * @param slidesData - Array of { slideSpec, blueprint, referenceUrl }
 * @returns Map of slideNumber → StrategyDecision
 */
export async function batchDecideStrategies(
  slidesData: Array<{
    slideSpec: SlideSpecification;
    blueprint: DeepDesignBlueprint;
    referenceUrl: string;
  }>
): Promise<Map<number, StrategyDecision>> {
  const decisions = new Map<number, StrategyDecision>();

  // Process in batches to avoid rate limits
  const BATCH_SIZE = 3;
  for (let i = 0; i < slidesData.length; i += BATCH_SIZE) {
    const batch = slidesData.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async ({ slideSpec, blueprint, referenceUrl }) => {
      try {
        const decision = await decideGenerationStrategy(slideSpec, blueprint, referenceUrl);
        decisions.set(slideSpec.slideNumber, decision);
      } catch (error) {
        console.error(`Failed to decide strategy for slide ${slideSpec.slideNumber}:`, error);
        // Continue with other slides even if one fails
      }
    });

    await Promise.all(batchPromises);

    // Small delay between batches
    if (i + BATCH_SIZE < slidesData.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return decisions;
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
 * Gets statistics about strategy decisions
 */
export function getStrategyStats(decisions: Map<number, StrategyDecision>): {
  totalDecisions: number;
  inputModifyCount: number;
  fullRecreateCount: number;
  averageConfidence: number;
  averageVisualComplexity: number;
  averageLayoutCompatibility: number;
  averageContentDivergence: number;
} {
  let inputModifyCount = 0;
  let fullRecreateCount = 0;
  let totalConfidence = 0;
  let totalVisualComplexity = 0;
  let totalLayoutCompatibility = 0;
  let totalContentDivergence = 0;

  decisions.forEach(decision => {
    if (decision.strategy === 'input-modify') {
      inputModifyCount++;
    } else {
      fullRecreateCount++;
    }

    totalConfidence += decision.confidence;
    totalVisualComplexity += decision.visualComplexity || 0;
    totalLayoutCompatibility += decision.layoutCompatibility || 0;
    totalContentDivergence += decision.contentDivergence || 0;
  });

  const count = decisions.size;

  return {
    totalDecisions: count,
    inputModifyCount,
    fullRecreateCount,
    averageConfidence: count > 0 ? totalConfidence / count : 0,
    averageVisualComplexity: count > 0 ? totalVisualComplexity / count : 0,
    averageLayoutCompatibility: count > 0 ? totalLayoutCompatibility / count : 0,
    averageContentDivergence: count > 0 ? totalContentDivergence / count : 0,
  };
}
