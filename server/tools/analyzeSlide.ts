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
  const basePrompt = `You are a MASTER SLIDE ANALYZER AND DESIGNER with expertise in both content strategy and visual design.

**Your Job:**
1. Analyze slides from CONTENT and DESIGN perspectives
2. Provide QUALITY FEEDBACK on what's working and what isn't
3. Identify specific IMPROVEMENTS NEEDED
4. Highlight what's GOOD about the slide
5. Suggest what CAN BE IMPROVED

**Your Expertise:**
- Presentation design (10+ years)
- Visual hierarchy, typography, color theory
- Content strategy and storytelling
- Accessibility (WCAG compliance)
- Brand design

---

Analyze this presentation slide and return a JSON object with the following structure:

{
  "category": "<one of: title|problem|solution|features|benefits|usecases|pricing|cta|other>",
  "textDensity": "<low|medium|high>",
  "visualElements": ["<list of visual elements: images, charts, icons, diagrams, etc>"],
  "colorScheme": ["<dominant colors as hex codes>"],
  "layout": "<centered|left-aligned|grid|two-column|image-heavy>",

  "qualityScore": <1-10 rating>,
  "status": "<excellent|good|needs-improvement|poor>",
  "issues": [
    {
      "type": "<too-much-text|too-little-text|poor-contrast|cluttered|bland|off-brand|unclear-message>",
      "severity": "<critical|important|minor>",
      "description": "<what the issue is>",
      "recommendation": "<how to fix it>"
    }
  ],

  "strengths": ["<what's working well>"],
  "improvements": ["<specific actionable improvements>"],
  "suggestions": ["<general suggestions>"]
}

**Quality Assessment Guidelines:**
- qualityScore: 8-10 = excellent, 6-7 = good, 4-5 = needs-improvement, 1-3 = poor
- status: Overall slide quality assessment
- issues: Identify specific problems (too much text, poor contrast, etc.) with severity and fix recommendations
- strengths: What's working well (good visuals, clear message, nice layout, etc.)
- improvements: Specific, actionable changes (reduce text by 50%, add icon, change color X to Y)
- suggestions: General ideas for enhancement

**Common Issues to Check:**
- Too much text (more than 50 words or 5 bullet points)
- Too little text (unclear message)
- Poor color contrast (accessibility)
- Cluttered layout (too many elements)
- Bland design (solid color background, no visuals)
- Off-brand colors or fonts
- Unclear message or purpose`;

  switch (goal) {
    case 'quick':
      return `${basePrompt}\n\nProvide a QUICK analysis focusing on category, status, and top 2 issues only.`;

    case 'content-only':
      return `${basePrompt}\n\nFocus on TEXT QUALITY: Check for too-much-text, unclear-message, readability issues.`;

    case 'visual-only':
      return `${basePrompt}\n\nFocus on VISUAL QUALITY: Check for poor-contrast, cluttered, bland design issues.`;

    case 'full':
    default:
      return `${basePrompt}\n\nProvide COMPREHENSIVE quality assessment with all issues, strengths, and improvements identified.`;
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
