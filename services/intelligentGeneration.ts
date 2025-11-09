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
    model: "gemini-2.0-flash-exp",
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
  const systemPrompt = `You are an expert presentation creator. Generate slide-by-slide descriptions based on the user's notes and preferences.

**Context:**
- Notes: ${context.notes}
- Audience: ${context.audience || 'General professional audience'}
- Number of Slides: ${context.slideCount || '7-10'}
- Style: ${context.style || 'Auto (you decide)'}

**Audience-Specific Guidelines:**

${getAudienceGuidelines(context.audience || '')}

**Style Guidelines:**

${getStyleGuidelines(context.style || 'auto')}

**Your Task:**
Generate exactly ${context.slideCount || 7} slide descriptions. For each slide, provide:
1. Slide title (clear, concise)
2. Key content/bullet points
3. Visual description (what should be shown)
4. Layout notes (text-heavy? image-focused? chart?)

**Important:**
- Be natural and authentic, not overly salesy
- Focus on clarity and value
- Adapt to the audience's needs and knowledge level
- Each slide should have a clear purpose
- Build a logical narrative flow

Output as JSON array of strings, where each string is a complete slide description.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
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
- Big ideas with powerful visuals
- Tell compelling stories
- One key message per slide
- Inspire and educate
- Make it memorable`
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
- Large, impactful images
- Minimal text (3-5 words per slide)
- Bold, emotional language
- Tell a story
- Create visual metaphors`,

    'executive': `
**Executive Brief Style:**
- Clean, minimal layouts
- Concise bullet points (3-5 per slide)
- Professional aesthetic
- Data to support key points
- Clear hierarchy`,

    'data': `
**Data-Driven Style:**
- Chart and graph focused
- Show trends and comparisons
- Include data labels
- Multiple data points per slide OK
- Lead with insights`,

    'technical': `
**Technical Style:**
- Diagrams and flowcharts
- Technical depth and detail
- Architecture visualizations
- Step-by-step explanations
- Include technical specifications`
  };

  return guidelines[style] || `**Balanced Approach:**
- Mix of text and visuals
- Clear structure
- Professional design`;
}
