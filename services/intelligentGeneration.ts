/**
 * Intelligent Generation System
 * AI analyzes notes and asks contextual questions to generate better slides
 */

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export interface GenerationContext {
  notes: string;
  audience?: string;
  slideCount?: number;
  style?: string;
  tone?: string;
}

export interface AIQuestion {
  question: string;
  options: string[];
  reasoning: string;
}

/**
 * Step 1: AI analyzes notes and asks clarifying questions
 */
export const analyzeNotesAndAskQuestions = async (notes: string): Promise<{
  questions: AIQuestion[];
  suggestions: {
    recommendedSlideCount: number;
    recommendedStyle: string;
    reasoning: string;
  };
}> => {
  const systemPrompt = `You are an intelligent presentation assistant. Your job is to analyze user's notes and ask smart, contextual questions to generate the perfect presentation.

**Your Task:**
1. Read and analyze the provided notes
2. Understand the context, purpose, and key topics
3. Ask 2-3 targeted questions to clarify:
   - WHO is the audience? (internal team, executives, customers, investors, etc.)
   - HOW MANY slides are needed? (suggest based on content depth)
   - WHAT STYLE would work best? (visual storytelling, data-driven, executive brief, technical)

4. Provide smart recommendations based on the content

**Important:**
- Keep questions conversational and natural
- Provide multiple-choice options for easy answering
- Explain your reasoning briefly
- Don't ask unnecessary questions if context is obvious

**Output Format (JSON):**
{
  "questions": [
    {
      "question": "Who will be viewing this presentation?",
      "options": ["Internal Team", "Executives", "Customers", "Investors", "Conference Audience"],
      "reasoning": "The content seems formal, so understanding the audience will help set the right tone"
    }
  ],
  "suggestions": {
    "recommendedSlideCount": 7,
    "recommendedStyle": "executive",
    "reasoning": "Your notes cover 3 main topics with supporting points. 7 slides would give each topic proper coverage without overwhelming. Executive style works well for the data-focused content."
  }
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    config: {
      thinkingConfig: {
        thinkingBudgetTokens: 10000 // Enable planning mode for better analysis
      }
    },
    contents: [
      { text: systemPrompt },
      { text: `\n\n--- USER'S NOTES ---\n${notes}\n\nAnalyze these notes and ask smart questions to help generate the perfect presentation.` }
    ],
  });

  const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');

  try {
    const parsed = JSON.parse(jsonText);
    return parsed;
  } catch (e) {
    console.error("Failed to parse AI questions:", e, jsonText);
    // Fallback to default questions
    return {
      questions: [
        {
          question: "Who is your audience?",
          options: ["Internal Team", "Executives", "Customers", "Investors"],
          reasoning: "Understanding your audience helps tailor the content and tone"
        },
        {
          question: "How many slides do you need?",
          options: ["3-5 (Quick overview)", "7-10 (Standard deck)", "15+ (Comprehensive)"],
          reasoning: "Based on your content, I can adjust the depth and detail"
        }
      ],
      suggestions: {
        recommendedSlideCount: 7,
        recommendedStyle: "executive",
        reasoning: "Standard deck with professional style"
      }
    };
  }
};

/**
 * Step 2: Generate slides with full context
 */
export const generateSlidesWithContext = async (
  context: GenerationContext
): Promise<string[]> => {
  const systemPrompt = `You are an expert "Presentation Content Strategist" for a leading tech company. Your specialty is transforming raw information into clear, concise, and compelling slide deck outlines.

**Context:**
- Notes: ${context.notes}
- Audience: ${context.audience || 'General professional audience'}
- Target Slides: ${context.slideCount || '7-10'}
- Presentation Style: ${context.style || 'Auto (you decide)'}

**Audience-Specific Guidelines:**

${getAudienceGuidelines(context.audience || '')}

**Style Guidelines:**

${getStyleGuidelines(context.style || 'auto')}

**Your Task:**
1.  **Read and Deeply Understand** the entire context of the provided notes.
2.  **Identify the Key Themes** and narrative pillars: What is the main message? What problem are we solving? What are the key points? What is the call to action?
3.  **Structure a Logical Narrative Flow** suitable for a ${context.audience || 'professional'} audience. Build a compelling story arc.
4.  **Break Down the Narrative into Individual Slides.** Be selective and strategic. Not every detail needs its own slide. Group related concepts.
5.  For each slide, write a **clear and descriptive prompt** that includes:
    - A compelling slide title (SHORT - 3-7 words maximum)
    - Key content/bullet points (2-4 items, each 5-10 words maximum)
    - Visual description (what images, charts, or graphics should be shown)
    - Layout guidance (text-heavy? image-focused? data visualization?)
    - The prompt should be detailed enough for a designer AI to create a professional slide

**Critical Constraints:**
- Generate exactly ${context.slideCount || 7} slides
- Each slide should have a clear purpose in the narrative
- **MINIMAL TEXT RULE**: Keep text concise. Slides are visual aids, not documents.
  - Titles: 3-7 words max
  - Bullet points: 5-10 words each
  - Total text per slide: 30-50 words maximum
  - Prefer powerful visuals over lengthy text
- Be natural and authentic, not overly salesy
- Focus on clarity and value for the ${context.audience || 'audience'}
- Build logical flow from slide to slide
- Adapt depth and complexity to audience knowledge level
- Emphasize visual storytelling - let images and graphics do the heavy lifting

**Output Format:**
Your final output MUST be a JSON array of strings, where each string is the complete, detailed prompt for one slide. Do not add any other explanation or text outside of the JSON array.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    config: {
      thinkingConfig: {
        thinkingBudgetTokens: 15000 // Enable extended planning mode for strategic deck creation
      }
    },
    contents: [{ text: systemPrompt }],
  });

  const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');

  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error("Invalid format");
  } catch (e) {
    console.error("Failed to parse slide descriptions:", e);
    throw new Error("Failed to generate slides. Please try again.");
  }
};

/**
 * Helper: Get audience-specific guidelines
 */
function getAudienceGuidelines(audience: string): string {
  const guidelines: Record<string, string> = {
    'internal_team': `
**Internal Team Audience:**
- Skip company background, they know it
- Focus on updates, progress, blockers
- Include specific action items
- Be direct and collaborative
- Use internal terminology freely`,

    'executives': `
**Executive Audience:**
- Lead with conclusions and recommendations
- Show business impact and ROI
- Be extremely concise
- Use strategic language
- Include key metrics that matter`,

    'customers': `
**Customer Audience:**
- Focus on THEIR problems and needs
- Show how you solve their challenges
- Be authentic and helpful, not pushy
- Include social proof
- Make benefits crystal clear`,

    'investors': `
**Investor Audience:**
- Show market opportunity and traction
- Highlight strong team
- Demonstrate clear path to profitability
- Be realistic about risks
- Include financial projections`,

    'conference_audience': `
**Conference Audience:**
- Big ideas with powerful visuals (minimal text!)
- Tell compelling stories through imagery
- One key message per slide (3-7 words max)
- Inspire and educate visually
- Make it memorable with striking visuals, not dense text`
  };

  return guidelines[audience] || `**General Professional Audience:**
- Clear, professional tone
- Balance detail with readability
- Support claims with evidence`;
}

/**
 * Helper: Get style-specific guidelines
 */
function getStyleGuidelines(style: string): string {
  const guidelines: Record<string, string> = {
    'visual': `
**Visual Storytelling Style:**
- Large, impactful images dominate the slide
- MINIMAL text (3-5 words per slide MAXIMUM)
- Bold, emotional single-phrase headlines
- Tell a story through visuals, not words
- Create visual metaphors instead of bullet points`,

    'executive': `
**Executive Brief Style:**
- Clean, minimal layouts with lots of whitespace
- Ultra-concise bullet points (3-4 max, 5-8 words each)
- Professional aesthetic, no clutter
- Key data points only, not paragraphs
- Clear hierarchy, scannable at a glance`,

    'data': `
**Data-Driven Style:**
- Chart and graph focused (visuals tell the story)
- Show trends and comparisons graphically
- Minimal text labels, let data speak
- One key insight per slide
- Lead with headline, support with visualization`,

    'technical': `
**Technical Style:**
- Diagrams and flowcharts (visual > text)
- Keep explanations brief and bullet-pointed
- Architecture visualizations instead of descriptions
- Step-by-step with minimal words per step
- Technical specs in tables/diagrams, not paragraphs`
  };

  return guidelines[style] || `**Balanced Approach:**
- Mix of text and visuals, but prioritize visuals
- Keep text minimal (30-50 words per slide max)
- Short bullet points (5-10 words each)
- Clear structure with whitespace
- Professional design, avoid clutter`;
}
