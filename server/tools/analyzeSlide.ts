/**
 * analyzeSlideTool
 *
 * Analyzes a SINGLE slide using Gemini 3.0 vision capabilities
 *
 * Use cases:
 * - Understanding what's on a specific slide
 * - Getting detailed analysis before editing
 * - Identifying slide category and structure
 *
 * @tool
 */

import { GoogleGenAI } from '@google/genai';
import type { ToolResult, SlideAnalysis } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || '' });

/**
 * Analyzes a single slide with vision
 */
export async function analyzeSlide(params: {
  slideSrc: string;
  slideNumber: number;
  analysisGoal: 'quick' | 'full' | 'content-only' | 'visual-only';
}): Promise<ToolResult<SlideAnalysis>> {
  const startTime = Date.now();

  try {
    console.log(`[analyzeSlide] Analyzing slide ${params.slideNumber} (${params.analysisGoal} analysis)`);

    // Prepare slide image for vision
    const imagePart = {
      inlineData: {
        data: params.slideSrc.split(',')[1],
        mimeType: params.slideSrc.match(/:(.*?);/)?.[1] || 'image/png'
      }
    };

    // Build prompt based on analysis goal
    const prompt = buildAnalysisPrompt(params.analysisGoal);

    // Call Gemini 3.0 with vision
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{
        role: 'user',
        parts: [
          imagePart,
          { text: prompt }
        ]
      }],
      config: {
        thinkingConfig: {
          thinkingBudget: 16384 // Medium thinking for single slide
        }
      }
    });

    // Parse response
    const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
    const analysis: SlideAnalysis = JSON.parse(jsonText);

    const executionTime = Date.now() - startTime;
    console.log(`[analyzeSlide] ✅ Analysis complete in ${executionTime}ms`);

    return {
      success: true,
      data: {
        ...analysis,
        slideNumber: params.slideNumber
      },
      metadata: {
        executionTime,
        model: 'gemini-3-pro-preview'
      }
    };

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[analyzeSlide] ❌ Error:`, error);

    return {
      success: false,
      error: {
        code: 'ANALYSIS_FAILED',
        message: 'Failed to analyze slide with vision',
        details: error.message
      },
      metadata: {
        executionTime
      }
    };
  }
}

/**
 * Build analysis prompt based on goal
 */
function buildAnalysisPrompt(goal: string): string {
  const basePrompt = `Analyze this presentation slide and return a JSON object with the following structure:

{
  "category": "<one of: title|problem|solution|features|benefits|usecases|pricing|cta|other>",
  "textDensity": "<low|medium|high>",
  "visualElements": ["<list of visual elements: images, charts, icons, diagrams, etc>"],
  "colorScheme": ["<dominant colors as hex codes>"],
  "layout": "<centered|left-aligned|grid|two-column|image-heavy>",
  "suggestions": ["<list of improvement suggestions>"]
}`;

  switch (goal) {
    case 'quick':
      return `${basePrompt}\n\nProvide a QUICK analysis focusing on category and layout only.`;

    case 'content-only':
      return `${basePrompt}\n\nFocus ONLY on text content: textDensity and suggestions for content improvements.`;

    case 'visual-only':
      return `${basePrompt}\n\nFocus ONLY on visual elements: visualElements, colorScheme, and layout.`;

    case 'full':
    default:
      return `${basePrompt}\n\nProvide a COMPREHENSIVE analysis with detailed suggestions for improvements.`;
  }
}

/**
 * ADK Tool Schema (to be exported by tools/index.ts)
 */
export const analyzeSlideTool = {
  name: 'analyzeSlideTool',
  description: 'Analyze a SINGLE slide using vision to understand its content, layout, and visual style',
  parameters: {
    type: 'object',
    properties: {
      slideSrc: {
        type: 'string',
        description: 'Base64 data URL of the slide image (starts with data:image/...)'
      },
      slideNumber: {
        type: 'number',
        description: 'The slide number (1-indexed) for reference'
      },
      analysisGoal: {
        type: 'string',
        enum: ['quick', 'full', 'content-only', 'visual-only'],
        description: 'What kind of analysis to perform'
      }
    },
    required: ['slideSrc', 'slideNumber', 'analysisGoal']
  },
  execute: analyzeSlide
};
