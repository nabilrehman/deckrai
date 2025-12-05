/**
 * Slide Selection Agent (ADK-style)
 *
 * An intelligent agent that uses Gemini function calling to dynamically
 * search and select the best reference slides for a given slide specification.
 *
 * The agent has 3 tools:
 * 1. search_slides - Unified search (semantic + metadata filtering)
 * 2. analyze_slides - Visual analysis of candidate slides using Gemini Vision
 * 3. get_slide_details - Quick metadata lookup for specific slides
 *
 * The agent can iterate: if initial results aren't satisfactory, it can
 * reformulate the query and search again.
 */

import { GoogleGenAI, Type } from '@google/genai';
import {
  searchSlides,
  searchSlidesByMetadata,
  getSlideDetails,
  SlideSearchResult,
  ClassificationFilters,
  SlideClassification,
} from './ragService';
import { browserLogger } from './browserLogger';

// Initialize Gemini API
const apiKey = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env.VITE_GEMINI_API_KEY
  : process.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });

/**
 * Slide specification from the Master Agent
 */
export interface SlideSpec {
  slideNumber: number;
  slideType: string;
  headline: string;
  content: string;
  visualDescription?: string;
  dataVisualization?: string;
  brandContext?: string;
}

/**
 * Result of slide selection for a single slide
 */
export interface SlideSelectionResult {
  slideNumber: number;
  selectedSlide: SlideSearchResult;
  matchScore: number;
  matchReason: string;
  searchIterations: number;
  toolCallsUsed: string[];
}

/**
 * Tool definitions for Gemini function calling
 */
const AGENT_TOOLS = [
  {
    name: 'search_slides',
    description: `Search for reference slides using semantic search, metadata filters, or both.

Use cases:
- Semantic search: Find slides similar to a text description (e.g., "3-column feature grid with icons")
- Metadata filters: Find slides by specific attributes (e.g., layout="grid-3-col", contentType="features")
- Combined: Use both for precise results (e.g., query="product features" + filters={layout:"grid-3-col"})

Available filter values:
- contentType: title, problem, solution, features, benefits, proof, comparison, pricing, technical, team, cta, agenda, divider, content
- layout: title-centered, title-left, split-50-50, split-30-70, split-70-30, grid-2x2, grid-3-col, grid-4-col, timeline-horizontal, timeline-vertical, comparison, full-bleed, content-centered, content-left
- visualStyle: minimal, corporate, modern, bold, creative, data-heavy, professional
- persona: c-suite, technical, business, practitioner, general
- salesStage: outreach, qualification, consideration, decision, post-sale, general
- visualElements: screenshots, charts, icons, photos, diagrams, illustrations, tables, text-heavy, minimal-text
- Boolean filters: hasMetrics, hasScreenshots, hasCharts, hasIcons`,
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'Text query for semantic search (describe the desired slide)',
        },
        filters: {
          type: Type.OBJECT,
          description: 'Classification filters for metadata-based filtering',
          properties: {
            contentType: { type: Type.STRING },
            layout: { type: Type.STRING },
            visualStyle: { type: Type.STRING },
            persona: { type: Type.STRING },
            salesStage: { type: Type.STRING },
            visualElements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            hasMetrics: { type: Type.BOOLEAN },
            hasScreenshots: { type: Type.BOOLEAN },
            hasCharts: { type: Type.BOOLEAN },
            hasIcons: { type: Type.BOOLEAN },
          },
        },
        topK: {
          type: Type.NUMBER,
          description: 'Number of results to return (default: 5)',
        },
      },
    },
  },
  {
    name: 'analyze_slides',
    description: `Analyze candidate slides visually to determine the best match for the target slide design.

Use this after search_slides to evaluate candidates. Provide:
- The slide specification (what you're trying to design)
- URLs of candidate slides to analyze
- Specific aspects to evaluate (layout, visual elements, style match, etc.)

Returns detailed analysis with recommendations.`,
    parameters: {
      type: Type.OBJECT,
      properties: {
        slideSpec: {
          type: Type.OBJECT,
          description: 'The slide specification we are trying to match',
          properties: {
            slideType: { type: Type.STRING },
            headline: { type: Type.STRING },
            content: { type: Type.STRING },
            visualDescription: { type: Type.STRING },
          },
          required: ['slideType', 'headline'],
        },
        candidateUrls: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'URLs of candidate slides to analyze (max 5)',
        },
        evaluationCriteria: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Specific aspects to evaluate (e.g., "layout compatibility", "visual hierarchy", "content density")',
        },
      },
      required: ['slideSpec', 'candidateUrls'],
    },
  },
  {
    name: 'get_slide_details',
    description: `Get detailed metadata for a specific slide by its ID.

Use this to:
- Get full classification data for a slide
- Verify a slide's attributes before final selection
- Quick lookup without visual analysis`,
    parameters: {
      type: Type.OBJECT,
      properties: {
        slideId: {
          type: Type.STRING,
          description: 'The ID of the slide to look up',
        },
      },
      required: ['slideId'],
    },
  },
];

/**
 * Execute tool calls from the agent
 */
async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const startTime = Date.now();
  console.log(`\n[SlideAgent] 🔧 Executing tool: ${toolName}`);
  console.log(`[SlideAgent] 📥 Args:`, JSON.stringify(args, null, 2));
  browserLogger.info(`[SlideAgent] Executing tool: ${toolName}`, args);

  switch (toolName) {
    case 'search_slides': {
      const { query, filters, topK = 5 } = args as {
        query?: string;
        filters?: ClassificationFilters;
        topK?: number;
      };

      console.log(`[SlideAgent] 🔍 Searching with query="${query || 'none'}", filters:`, filters);

      const result = await searchSlides({
        query,
        filters,
        topK,
        fallbackToPublic: true,
      });

      const duration = Date.now() - startTime;
      console.log(`[SlideAgent] ✅ Search found ${result.results.length} results in ${duration}ms`);

      if (result.results.length > 0) {
        console.log(`[SlideAgent] 📊 Top results:`);
        result.results.slice(0, 3).forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.deckName} - ${r.classification?.contentType || 'unknown'} / ${r.classification?.layout || 'unknown'} (score: ${r.score.toFixed(2)})`);
        });
      }

      return {
        success: result.success,
        resultCount: result.results.length,
        results: result.results.map(r => ({
          slideId: r.slideId,
          imageUrl: r.imageUrl,
          deckName: r.deckName,
          score: r.score,
          classification: r.classification ? {
            contentType: r.classification.contentType,
            layout: r.classification.layout,
            visualStyle: r.classification.visualStyle,
            visualElements: r.classification.visualElements,
          } : null,
        })),
      };
    }

    case 'analyze_slides': {
      const { slideSpec, candidateUrls, evaluationCriteria } = args as {
        slideSpec: { slideType: string; headline: string; content?: string; visualDescription?: string };
        candidateUrls: string[];
        evaluationCriteria?: string[];
      };

      console.log(`[SlideAgent] 👁️ Analyzing ${candidateUrls.length} candidate slides visually`);
      console.log(`[SlideAgent] 📋 Target: ${slideSpec.slideType} - "${slideSpec.headline}"`);

      // Use Gemini Vision to analyze candidates
      const analysis = await analyzeSlidesCandidates(slideSpec, candidateUrls, evaluationCriteria);

      const duration = Date.now() - startTime;
      console.log(`[SlideAgent] ✅ Visual analysis complete in ${duration}ms`);
      console.log(`[SlideAgent] 🏆 Best match: Score ${analysis.bestMatch ? 'found' : 'not found'}`);
      if (analysis.bestMatch) {
        console.log(`[SlideAgent]    Reason: ${analysis.bestMatch.reason.substring(0, 100)}...`);
      }

      return analysis;
    }

    case 'get_slide_details': {
      const { slideId } = args as { slideId: string };
      console.log(`[SlideAgent] 📄 Getting details for slide: ${slideId}`);

      const result = await getSlideDetails(slideId);

      const duration = Date.now() - startTime;
      console.log(`[SlideAgent] ✅ Details retrieved in ${duration}ms`);

      return result;
    }

    default:
      console.log(`[SlideAgent] ❌ Unknown tool: ${toolName}`);
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * Analyze candidate slides using Gemini Vision
 */
async function analyzeSlidesCandidates(
  slideSpec: { slideType: string; headline: string; content?: string; visualDescription?: string },
  candidateUrls: string[],
  evaluationCriteria?: string[]
): Promise<{
  analysis: Array<{
    imageUrl: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
  }>;
  bestMatch: {
    imageUrl: string;
    reason: string;
  };
}> {
  try {
    // Limit to 5 candidates max
    const urls = candidateUrls.slice(0, 5);

    // Prepare image parts
    const imageParts = await Promise.all(
      urls.map(async (url, index) => {
        if (url.startsWith('data:')) {
          const match = url.match(/^data:(image\/\w+);base64,(.*)$/);
          if (!match) throw new Error('Invalid base64 image');
          return {
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          };
        } else {
          const response = await fetch(url);
          const blob = await response.blob();
          const base64 = await blobToBase64(blob);
          const match = base64.match(/^data:(image\/\w+);base64,(.*)$/);
          if (!match) throw new Error('Failed to convert image');
          return {
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          };
        }
      })
    );

    const criteria = evaluationCriteria?.join(', ') || 'layout compatibility, visual hierarchy, content density, style match';

    const prompt = `You are an expert presentation designer analyzing ${urls.length} candidate reference slides to find the best match for a new slide design.

=== TARGET SLIDE SPECIFICATION ===
- Slide Type: ${slideSpec.slideType}
- Main Headline: "${slideSpec.headline}"
${slideSpec.content ? `- Content to Include: ${slideSpec.content.substring(0, 300)}` : ''}
${slideSpec.visualDescription ? `- Visual Requirements: ${slideSpec.visualDescription}` : ''}

=== YOUR TASK ===
Analyze each candidate image (numbered 1-${urls.length}) as a potential template for the target slide.

=== EVALUATION CRITERIA ===
For each candidate, evaluate these aspects on a scale of 1-100:

1. LAYOUT COMPATIBILITY (40% weight)
   - Does the layout structure fit the content type?
   - Is there appropriate space for all required elements?
   - Are content zones well-defined and usable?

2. CONTENT CAPACITY (25% weight)
   - Can it fit the headline comfortably?
   - Is there room for all body content/bullets/items?
   - Are text areas appropriately sized?

3. VISUAL HIERARCHY (20% weight)
   - Does the eye flow naturally in the right order?
   - Is the headline area prominent enough?
   - Are supporting elements properly subordinated?

4. STYLE APPROPRIATENESS (15% weight)
   - Does the visual style match the content's tone?
   - Is it professional/modern/clean enough?
   - Does it support the message being conveyed?

=== CONTENT MAPPING EXERCISE ===
For each candidate, mentally place the target content:
- Where would the headline go? Does it fit?
- Where would each bullet/item go? Is there space?
- Where would visuals/icons go? Are there placeholders?
- Is there wasted space or overcrowding?

=== OUTPUT FORMAT ===
Return JSON only (no markdown code blocks):
{
  "analysis": [
    {
      "candidateNumber": 1,
      "score": 85,
      "layoutScore": 90,
      "capacityScore": 85,
      "hierarchyScore": 80,
      "styleScore": 85,
      "strengths": [
        "Specific strength 1 with detail",
        "Specific strength 2 with detail"
      ],
      "weaknesses": [
        "Specific weakness or concern",
        "Any adaptation needed"
      ],
      "contentMapping": "Brief description of where each content element would go",
      "recommendation": "Specific recommendation for this slide type"
    }
  ],
  "bestMatch": {
    "candidateNumber": 1,
    "reason": "Detailed explanation of why this is the best choice, including specific layout features that match the content requirements, how the visual hierarchy supports the message, and why it's better than alternatives"
  },
  "alternativeMatch": {
    "candidateNumber": 2,
    "reason": "Why this would be the second-best choice if the first isn't suitable"
  }
}`;

    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        ...imageParts,
        { text: prompt },
      ],
    });

    const responseText = result.text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Map candidate numbers back to URLs
    return {
      analysis: parsed.analysis.map((a: { candidateNumber: number; score: number; strengths: string[]; weaknesses: string[]; recommendation: string }) => ({
        imageUrl: urls[a.candidateNumber - 1],
        score: a.score,
        strengths: a.strengths,
        weaknesses: a.weaknesses,
        recommendation: a.recommendation,
      })),
      bestMatch: {
        imageUrl: urls[parsed.bestMatch.candidateNumber - 1],
        reason: parsed.bestMatch.reason,
      },
    };
  } catch (error) {
    browserLogger.error('[SlideAgent] Analysis error:', error);
    // Fallback: return first candidate
    return {
      analysis: candidateUrls.map(url => ({
        imageUrl: url,
        score: 70,
        strengths: ['Available reference'],
        weaknesses: ['Could not fully analyze'],
        recommendation: 'Manual review recommended',
      })),
      bestMatch: {
        imageUrl: candidateUrls[0],
        reason: 'Default selection (analysis failed)',
      },
    };
  }
}

/**
 * Convert blob to base64 data URL
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
 * System prompt for the slide selection agent
 */
const AGENT_SYSTEM_PROMPT = `You are an expert Slide Selection Agent specializing in finding the perfect reference slide templates for presentation design. Your task is to find the best reference slide from a style library that matches a given slide specification.

=== YOUR EXPERTISE ===
You understand presentation design principles deeply:
- Visual hierarchy: How elements guide the eye (headline → subheadline → body → CTA)
- Layout principles: Grid systems, whitespace, alignment, balance, golden ratio
- Content density: Matching the amount of content to appropriate layouts
- Brand alignment: Professional, modern, minimal, bold, creative styles
- Audience appropriateness: C-suite prefers clean/minimal, technical audiences accept dense information
- Slide purposes: Different content types need different visual treatments

=== YOUR WORKFLOW ===

STEP 1: DEEP ANALYSIS OF THE SLIDE SPECIFICATION
Before searching, thoroughly understand what the slide needs:
- What is the PRIMARY purpose? (inform, persuade, compare, showcase, prove, close)
- How much content needs to fit? (headline only vs. 3 bullets vs. 10 items vs. data-heavy)
- What visual elements are mentioned or implied? (icons, charts, images, screenshots, quotes, logos)
- What layout would best serve this content? (centered, grid, split, timeline, comparison)
- What is the audience/context? (executive pitch vs. technical deep-dive vs. sales demo)
- Are there any specific visual requirements mentioned? (colors, style, mood)

STEP 2: FORMULATE INTELLIGENT SEARCH STRATEGY
Based on your analysis, decide the best search approach:

A) METADATA-FIRST (when you know exactly what structure you need):
   - Use specific filters like layout="grid-3-col", contentType="features"
   - Example: A features slide with 3 items → filters={layout:"grid-3-col", contentType:"features", hasIcons:true}
   - Good for: "I need a 3-column grid with icons for feature highlights"

B) SEMANTIC-FIRST (when describing the visual feel or complex requirements):
   - Use descriptive text queries like "clean minimal title slide with centered headline and large hero image"
   - Good for: "I need something that feels modern, spacious, and impactful"

C) COMBINED APPROACH (most powerful - use when possible):
   - Use both query AND filters for precise results
   - Example: query="product features with icons and brief descriptions" + filters={layout:"grid-3-col", visualStyle:"modern"}
   - Good for: Getting exact matches that satisfy both content and visual requirements

STEP 3: EXECUTE AND EVALUATE SEARCH
Call search_slides with your strategy. Critically examine the results:
- Do the layouts ACTUALLY match the content requirements?
- Is there enough space for all the content mentioned?
- Is the visual style appropriate for the audience?
- Are there enough quality results to choose from (aim for 3-5 candidates)?

STEP 4: ITERATE IF NEEDED (Critical for good results!)
If results are poor (< 3 good candidates OR no clear match):

Strategy A - Broaden filters:
- Remove the most specific constraint first
- Example: Remove visualStyle, keep layout and contentType

Strategy B - Try different filter combinations:
- Features slide not found with grid-3-col? Try grid-4-col or grid-2x2
- No split-50-50? Try split-30-70 or split-70-30

Strategy C - Add/modify semantic query:
- Be more descriptive about what you're looking for
- Include visual metaphors: "clean whitespace", "bold impactful", "data-rich dashboard"

Strategy D - Search for similar content types:
- "benefits" slides often work for "features"
- "content" is a good fallback for most text-heavy slides
- "comparison" layouts work for "before/after" or "old vs new"

STEP 5: VISUAL ANALYSIS (CRITICAL STEP)
Once you have 3-5 promising candidates, ALWAYS use analyze_slides:
- Mentally map where each piece of content would go
- Check: Can the headline fit? Is there room for all bullets/items?
- Verify: Does the visual hierarchy support the content flow?
- Consider: Will the style feel right for the audience?

STEP 6: MAKE FINAL SELECTION
Choose the best match and provide detailed explanation:
- Why this layout works for this specific content
- How the visual style matches the context/audience
- Where key content elements would be placed
- Any adaptations that might be needed

=== DETAILED SEARCH STRATEGY GUIDE ===

TITLE/COVER SLIDES:
- Primary filters: contentType="title"
- Layout options: title-centered (most common), title-left, full-bleed
- Semantic queries: "bold title slide", "minimal cover", "impactful opening slide"
- Look for: Strong visual hierarchy, minimal text areas, hero image area, branding space

FEATURES/CAPABILITIES SLIDES:
- Count the features first! This determines layout:
  * 3 features → grid-3-col
  * 4 features → grid-4-col or grid-2x2
  * 5-6 features → grid-3-col (2 rows) or grid-2x2 + extra
- Primary filters: contentType="features", hasIcons=true
- Semantic queries: "feature grid with icons", "product capabilities with descriptions"
- Look for: Equal-weight grid items, icon placeholders, concise text areas

BENEFITS/VALUE PROPOSITION:
- Similar to features but often with more explanatory text
- Filters: contentType="benefits"
- Can use: grid layouts OR split layouts (visual + benefits list)
- Semantic: "value proposition layout", "benefits with supporting imagery"

DATA/METRICS/KPI SLIDES:
- Filters: hasMetrics=true, OR hasCharts=true, OR visualElements contains "charts"
- Alternative: contentType="technical" for complex data
- Semantic: "data visualization", "metrics dashboard", "KPI showcase", "chart-focused slide"
- Look for: Chart placeholders, number/stat callouts, data-friendly layouts

PROOF/TESTIMONIAL/SOCIAL PROOF:
- Filters: contentType="proof"
- Boolean helpers: hasQuote=true (testimonials), hasLogo=true (client logos)
- Semantic: "customer testimonial", "client logos grid", "case study results"
- Look for: Quote styling, logo grid areas, stats/results areas

COMPARISON SLIDES:
- Filters: contentType="comparison", layout="comparison"
- Alternative layouts: split-50-50 (equal weight), split-30-70 or split-70-30
- Semantic: "before after comparison", "side by side", "old vs new approach"
- Look for: Two distinct areas, comparison indicators, equal visual weight

PROCESS/TIMELINE/STEPS:
- Filters: layout="timeline-horizontal" OR layout="timeline-vertical"
- Count the steps to choose horizontal (3-5 steps) vs vertical (more steps)
- Semantic: "step by step process", "workflow timeline", "numbered steps"
- Look for: Sequential flow indicators, numbered placeholders, connecting elements

TEAM/PEOPLE/LEADERSHIP:
- Filters: contentType="team"
- Boolean: hasPeople=true
- Count team members: 3-4 → grid layout, 1 featured → split layout
- Semantic: "team member profiles", "leadership grid", "founders showcase"
- Look for: Photo placeholders, bio/description areas, title/role areas

ARCHITECTURE/TECHNICAL/DIAGRAM:
- Filters: contentType="technical", visualElements contains "diagrams"
- Semantic: "architecture diagram", "technical workflow", "system overview"
- Look for: Large diagram area, minimal competing elements, technical style

CTA/CLOSING/CONTACT:
- Filters: contentType="cta", hasCallToAction=true
- Semantic: "call to action", "closing slide", "contact information", "next steps"
- Look for: Prominent CTA area, contact details, minimal distraction, action-oriented

AGENDA/OUTLINE:
- Filters: contentType="agenda"
- Semantic: "agenda slide", "table of contents", "presentation outline"
- Look for: Numbered list areas, clean hierarchy, navigation-friendly

=== CRITICAL RULES ===

1. NEVER skip the search step - always start with search_slides
2. ALWAYS explain your search reasoning before executing
3. If first search yields < 3 good candidates, MUST iterate with different strategy
4. ALWAYS use analyze_slides for final selection - visual verification is crucial
5. COUNT THE CONTENT: A 3-bullet slide needs less space than a 10-bullet slide
6. MATCH DENSITY: Heavy content needs dense layouts; minimal content needs spacious layouts
7. VERIFY CAPACITY: Ensure the selected layout can ACTUALLY FIT all the specified content
8. PREFER ADAPTABLE: When unsure, prefer simpler layouts (easier to adapt)
9. CONSIDER FLOW: Think about how the audience will read/scan the slide

=== OUTPUT FORMAT ===

After your analysis, return your final selection as JSON:
{
  "slideId": "the-slide-id",
  "imageUrl": "the-image-url",
  "score": 85,
  "reason": "Detailed explanation: This [layout type] reference is ideal because [why layout matches content]. The [specific visual element] area perfectly accommodates [specific content from spec]. The [style description] aligns with [audience/context]. The visual hierarchy naturally guides from [element] to [element], matching the intended flow."
}`;

/**
 * Run the slide selection agent for a single slide
 */
export async function selectReferenceSlide(
  slideSpec: SlideSpec,
  maxIterations: number = 3
): Promise<SlideSelectionResult> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[SlideAgent] 🚀 Starting selection for Slide #${slideSpec.slideNumber}`);
  console.log(`[SlideAgent] 📌 Type: ${slideSpec.slideType}`);
  console.log(`[SlideAgent] 📝 Headline: "${slideSpec.headline}"`);
  console.log(`[SlideAgent] 📄 Content preview: ${slideSpec.content.substring(0, 100)}...`);
  console.log(`${'='.repeat(60)}`);
  browserLogger.info(`[SlideAgent] Starting selection for slide ${slideSpec.slideNumber}: ${slideSpec.slideType}`);

  const toolCallsUsed: string[] = [];
  let iterations = 0;
  let selectedSlide: SlideSearchResult | null = null;
  let matchScore = 0;
  let matchReason = '';

  // Initial user message
  const userMessage = `Find the best reference slide for this specification:

Slide #${slideSpec.slideNumber}
Type: ${slideSpec.slideType}
Headline: "${slideSpec.headline}"
Content: ${slideSpec.content.substring(0, 500)}
${slideSpec.visualDescription ? `Visual Description: ${slideSpec.visualDescription}` : ''}
${slideSpec.dataVisualization ? `Data Visualization: ${slideSpec.dataVisualization}` : ''}
${slideSpec.brandContext ? `Brand Context: ${slideSpec.brandContext}` : ''}

Search the library and find the best matching reference slide. Use the tools available to search and analyze candidates.`;

  // Conversation history for multi-turn
  const messages: Array<{ role: 'user' | 'model' | 'function'; content: string; name?: string }> = [
    { role: 'user', content: userMessage },
  ];

  try {
    while (iterations < maxIterations && !selectedSlide) {
      iterations++;
      console.log(`\n[SlideAgent] 🔄 Iteration ${iterations}/${maxIterations}`);
      browserLogger.info(`[SlideAgent] Iteration ${iterations}/${maxIterations}`);

      // Call the model with low temperature for deterministic function calls
      // (As recommended by Google's function calling best practices)
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          { role: 'user', parts: [{ text: AGENT_SYSTEM_PROMPT }] },
          ...messages.map(m => ({
            role: m.role === 'function' ? 'user' : m.role,
            parts: [{ text: m.role === 'function' ? `[Tool Result: ${m.name}]\n${m.content}` : m.content }],
          })),
        ],
        config: {
          temperature: 0.1, // Low temperature for reliable tool selection
          tools: AGENT_TOOLS.map(tool => ({
            functionDeclarations: [{
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            }],
          })),
        },
      });

      // Check for function calls
      const functionCalls = response.functionCalls;

      if (functionCalls && functionCalls.length > 0) {
        console.log(`[SlideAgent] 📞 Model requested ${functionCalls.length} tool call(s)`);

        // Execute each function call
        for (const fc of functionCalls) {
          const toolName = fc.name;
          const toolArgs = fc.args || {};

          toolCallsUsed.push(toolName);

          const result = await executeToolCall(toolName, toolArgs as Record<string, unknown>);

          // Add function result to conversation
          messages.push({
            role: 'function',
            name: toolName,
            content: JSON.stringify(result, null, 2),
          });
        }
      } else {
        console.log(`[SlideAgent] 💬 Model returned text response (no tool calls)`);
        // Model returned text response - check if it made a final decision
        const responseText = response.text;
        messages.push({ role: 'model', content: responseText });

        // Try to extract final selection from response
        const selection = extractSelection(responseText);
        if (selection) {
          selectedSlide = selection.slide;
          matchScore = selection.score;
          matchReason = selection.reason;
        } else {
          // Ask model to make a decision
          messages.push({
            role: 'user',
            content: 'Based on your analysis, please provide your final selection. Which slide is the best match and why? Include the slideId and imageUrl of your chosen slide.',
          });
        }
      }
    }

    // If we still don't have a selection, get the model's final answer
    if (!selectedSlide) {
      const finalResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          { role: 'user', parts: [{ text: AGENT_SYSTEM_PROMPT }] },
          ...messages.map(m => ({
            role: m.role === 'function' ? 'user' : m.role,
            parts: [{ text: m.role === 'function' ? `[Tool Result: ${m.name}]\n${m.content}` : m.content }],
          })),
          { role: 'user', parts: [{ text: 'Please provide your final selection now. Return JSON: {"slideId": "...", "imageUrl": "...", "score": 85, "reason": "..."}' }] },
        ],
      });

      const finalText = finalResponse.text;
      const selection = extractSelection(finalText);
      if (selection) {
        selectedSlide = selection.slide;
        matchScore = selection.score;
        matchReason = selection.reason;
      }
    }

    // Fallback: If still no selection, extract best result from search history
    if (!selectedSlide) {
      console.log(`[SlideAgent] 🔄 Agent didn't select - trying to extract best result from search history...`);

      // Look through messages for search results
      for (const msg of messages) {
        if (msg.role === 'function' && msg.name === 'search_slides') {
          try {
            const searchResult = JSON.parse(msg.content);
            if (searchResult.results && searchResult.results.length > 0) {
              const bestResult = searchResult.results[0]; // Take the top result
              if (bestResult.slideId && bestResult.imageUrl) {
                selectedSlide = {
                  slideId: bestResult.slideId,
                  deckId: bestResult.deckId || '',
                  deckName: bestResult.deckName || '',
                  slideIndex: bestResult.slideIndex || 0,
                  imageUrl: bestResult.imageUrl,
                  score: bestResult.score || 0.5,
                  visibility: 'private',
                };
                matchScore = Math.round((bestResult.score || 0.5) * 100);
                matchReason = `Auto-selected best search result (score: ${bestResult.score?.toFixed(3)})`;
                console.log(`[SlideAgent] ✅ Auto-selected: ${selectedSlide.slideId} (score: ${matchScore})`);
                break;
              }
            }
          } catch {
            // Continue searching
          }
        }
      }
    }

    if (!selectedSlide) {
      console.log(`[SlideAgent] ❌ Failed to select a slide after ${iterations} iterations - no valid search results found`);
      throw new Error('Agent failed to select a slide');
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[SlideAgent] 🎉 SELECTION COMPLETE for Slide #${slideSpec.slideNumber}`);
    console.log(`[SlideAgent] ✅ Selected: ${selectedSlide.deckName || selectedSlide.slideId}`);
    console.log(`[SlideAgent] 📊 Score: ${matchScore}`);
    console.log(`[SlideAgent] 🔄 Iterations: ${iterations}`);
    console.log(`[SlideAgent] 🔧 Tool calls: ${toolCallsUsed.join(' → ')}`);
    console.log(`[SlideAgent] 💡 Reason: ${matchReason.substring(0, 150)}...`);
    console.log(`${'='.repeat(60)}\n`);

    browserLogger.info(`[SlideAgent] Selected slide for #${slideSpec.slideNumber}`, {
      slideId: selectedSlide.slideId,
      score: matchScore,
      iterations,
      toolCalls: toolCallsUsed.length,
    });

    return {
      slideNumber: slideSpec.slideNumber,
      selectedSlide,
      matchScore,
      matchReason,
      searchIterations: iterations,
      toolCallsUsed,
    };
  } catch (error) {
    console.log(`[SlideAgent] ❌ Error selecting slide for #${slideSpec.slideNumber}:`, error);
    browserLogger.error(`[SlideAgent] Error selecting slide for #${slideSpec.slideNumber}:`, error);
    throw error;
  }
}

/**
 * Extract selection from model response
 */
function extractSelection(text: string): { slide: SlideSearchResult; score: number; reason: string } | null {
  try {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*?"slideId"[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Validate slideId is a real ID (contains numbers/alphanumeric), not a message like "No suitable slide found"
      const isValidSlideId = parsed.slideId &&
        typeof parsed.slideId === 'string' &&
        /^[\w-]+$/.test(parsed.slideId) && // alphanumeric, hyphens, underscores only
        !parsed.slideId.toLowerCase().includes('no suitable') &&
        !parsed.slideId.toLowerCase().includes('not found') &&
        !parsed.slideId.toLowerCase().includes('none') &&
        parsed.slideId.length < 100; // slideIds shouldn't be super long

      // Validate imageUrl is a real URL
      const isValidImageUrl = parsed.imageUrl &&
        typeof parsed.imageUrl === 'string' &&
        (parsed.imageUrl.startsWith('http') || parsed.imageUrl.startsWith('data:'));

      if (isValidSlideId && isValidImageUrl) {
        return {
          slide: {
            slideId: parsed.slideId,
            imageUrl: parsed.imageUrl,
            deckId: parsed.deckId || '',
            deckName: parsed.deckName || '',
            slideIndex: parsed.slideIndex || 0,
            score: parsed.score || 0.8,
            visibility: 'public',
          },
          score: parsed.score || 80,
          reason: parsed.reason || 'Selected by agent',
        };
      } else {
        console.log(`[SlideAgent] ⚠️ Invalid selection: slideId="${parsed.slideId}", imageUrl="${parsed.imageUrl?.substring(0, 50)}..."`);
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Select reference slides for multiple slide specifications
 */
export async function selectReferenceSlidesForDeck(
  slideSpecs: SlideSpec[],
  options: {
    maxIterationsPerSlide?: number;
    concurrency?: number;
    userId?: string;
  } = {}
): Promise<Map<number, SlideSelectionResult>> {
  const { maxIterationsPerSlide = 3, concurrency = 2, userId } = options;

  browserLogger.info(`[SlideAgent] Selecting references for ${slideSpecs.length} slides${userId ? ` (userId: ${userId})` : ''}`);

  const results = new Map<number, SlideSelectionResult>();

  // Process in batches for controlled concurrency
  // Use Promise.allSettled to allow partial success (some slides may fail)
  for (let i = 0; i < slideSpecs.length; i += concurrency) {
    const batch = slideSpecs.slice(i, i + concurrency);

    const batchResults = await Promise.allSettled(
      batch.map(spec => selectReferenceSlide(spec, maxIterationsPerSlide, userId))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.set(result.value.slideNumber, result.value);
      } else {
        // Log the failure but continue - Style Scout will handle these
        browserLogger.warn(`[SlideAgent] Slide selection failed: ${result.reason?.message || 'Unknown error'}`);
      }
    }

    browserLogger.info(`[SlideAgent] Progress: ${Math.min(i + concurrency, slideSpecs.length)}/${slideSpecs.length} slides (${results.size} matched)`);
  }

  browserLogger.info(`[SlideAgent] Completed selection for ${results.size} slides`);
  return results;
}
