/**
 * planDeckTool
 *
 * Generate complete slide deck specifications using master planning agent
 *
 * Use cases:
 * - User wants to create a full presentation deck
 * - Need structured slide specifications before generation
 * - Planning deck architecture with brand research
 *
 * This wraps the existing designerOrchestrator.generateDesignerOutline()
 * and makes it available as an ADK tool for flexible orchestration.
 *
 * @tool
 */

import type { ToolResult } from '../types';
import { generateDesignerOutline } from '../../services/designerOrchestrator';

/**
 * Parameters for deck planning
 */
export interface PlanDeckParams {
  company: string;
  content: string;
  audience: string;
  goal: string;
  slideCount: number;
}

/**
 * Deck planning result
 */
export interface PlanDeckResult {
  brandResearch: {
    colors: Array<{ name: string; hex: string; usage: string }>;
    typography: string;
    sources: string[];
  };
  deckArchitecture: Array<{
    slideNumber: number;
    title: string;
    purpose: string;
    infoDensity: 'Low' | 'Medium' | 'High';
    visualApproach: string;
    hierarchyType: string;
  }>;
  slideSpecifications: Array<{
    slideNumber: number;
    title: string;
    headline: string;
    subhead?: string;
    content?: string;
    visualDescription?: string;
    brandContext?: string;
    backgroundColor: string;
    textColors: {
      headline: string;
      body: string;
      accent?: string;
    };
  }>;
  totalTime: number;
}

/**
 * Plan deck architecture and generate slide specifications
 */
export async function planDeck(
  params: PlanDeckParams,
  onProgress?: (update: { content: string }) => void
): Promise<ToolResult<PlanDeckResult>> {
  const startTime = Date.now();

  try {
    console.log(`[planDeckTool] Planning deck for ${params.company}`);
    console.log(`[planDeckTool] Slide count: ${params.slideCount}`);
    console.log(`[planDeckTool] Audience: ${params.audience}`);

    // Send initial progress
    onProgress?.({ content: `Planning ${params.slideCount}-slide deck for ${params.company}...` });

    // Validate inputs
    if (!params.company || !params.content || !params.audience || !params.goal) {
      return {
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Missing required parameters',
          details: 'company, content, audience, and goal are all required',
        },
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    if (params.slideCount < 1 || params.slideCount > 50) {
      return {
        success: false,
        error: {
          code: 'INVALID_SLIDE_COUNT',
          message: 'Slide count must be between 1 and 50',
          details: `Received: ${params.slideCount}`,
        },
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    console.log(`[planDeckTool] Calling designer orchestrator with Gemini 3.0...`);

    // Send progress: generating slide architecture
    onProgress?.({ content: `Generating slide architecture and content structure...` });

    // Call the designer orchestrator
    const result = await generateDesignerOutline({
      company: params.company,
      content: params.content,
      audience: params.audience,
      goal: params.goal,
      slideCount: params.slideCount,
    });

    if (!result.success) {
      return {
        success: false,
        error: {
          code: 'PLANNING_FAILED',
          message: 'Deck planning failed',
          details: result.error || 'Unknown error from designer orchestrator',
        },
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    // Send progress: processing results
    onProgress?.({ content: `Creating detailed slide specifications...` });

    // Extract and format the results
    const planResult: PlanDeckResult = {
      brandResearch: {
        colors: result.brandResearch?.brandColors || [],
        typography: result.brandResearch?.typography?.primaryFont || 'Not specified',
        sources: result.brandResearch?.researchSources || [],
      },
      deckArchitecture: result.deckArchitecture?.map((slide: any) => ({
        slideNumber: slide.slideNumber,
        title: slide.title,
        purpose: slide.purpose,
        infoDensity: slide.infoDensity,
        visualApproach: slide.visualApproach,
        hierarchyType: slide.hierarchyType,
      })) || [],
      slideSpecifications: result.slideSpecifications || [],
      totalTime: result.totalTime || (Date.now() - startTime),
    };

    const executionTime = Date.now() - startTime;
    console.log(`[planDeckTool] ✅ Deck planned successfully in ${executionTime}ms`);
    console.log(`[planDeckTool] Generated ${planResult.slideSpecifications.length} slide specifications`);
    console.log(`[planDeckTool] Brand colors: ${planResult.brandResearch.colors.length}`);

    // Send final progress
    onProgress?.({ content: `Deck plan complete! Generated ${planResult.slideSpecifications.length} slide specifications.` });

    return {
      success: true,
      data: planResult,
      metadata: {
        executionTime,
        model: 'gemini-3-pro-preview', // Uses Gemini 3.0 for planning
      },
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[planDeckTool] ❌ Error:`, error);

    return {
      success: false,
      error: {
        code: 'PLANNING_FAILED',
        message: 'Failed to plan deck',
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
export const planDeckTool = {
  name: 'planDeckTool',
  description: `Plan complete presentation deck architecture using master planning agent with Gemini 3.0.

  This tool performs comprehensive deck planning including:
  - Brand research (colors, typography, visual style)
  - Deck architecture (slide flow, purposes, visual approaches)
  - Complete slide specifications (content, hierarchy, design)

  Use this tool when:
  - User wants to create a full presentation deck (not just single slides)
  - Need structured planning before generation
  - Creating brand-consistent multi-slide presentations
  - User provides: company, content topic, audience, goal, slide count

  Returns:
  - Brand research with exact colors (hex codes) and typography
  - Deck architecture table with all slides planned
  - Complete slide specifications ready for generation

  This is typically the FIRST tool to call when creating a new deck.
  After planning, use createSlideTool for each slide specification.`,
  parameters: {
    type: 'object',
    properties: {
      company: {
        type: 'string',
        description: 'Company name or topic for the presentation (e.g., "Google Cloud", "BigQuery Workshop")',
      },
      content: {
        type: 'string',
        description: 'Content description - what the presentation is about (e.g., "Introduction to data warehousing", "Q4 sales results")',
      },
      audience: {
        type: 'string',
        description: 'Target audience (e.g., "enterprise executives", "technical engineers", "sales team")',
      },
      goal: {
        type: 'string',
        description: 'Presentation goal (e.g., "educate about product", "pitch investment", "report quarterly results")',
      },
      slideCount: {
        type: 'number',
        description: 'Number of slides to plan (1-50). Typical: 5-10 for workshops, 10-15 for pitches, 3-5 for reports.',
      },
    },
    required: ['company', 'content', 'audience', 'goal', 'slideCount'],
  },
  execute: planDeck,
};
