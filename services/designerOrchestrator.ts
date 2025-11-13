/**
 * Designer Orchestrator - TypeScript Implementation
 * Ports Python parallel-orchestrator.py logic to TypeScript
 * Uses existing geminiService infrastructure
 */

import { GoogleGenAI } from '@google/genai';
import type {
  DesignerGenerationInput,
  DesignerOutline,
  PythonOrchestratorResult,
  DesignerGenerationProgress,
  SlideArchitecture
} from '../types/designerMode';

const MASTER_PROMPT_TEMPLATE = `
# MASTER PLANNING AGENT PROMPT
## Phase 1: Brand Research + Slide Architecture + Design System

You are a master presentation architect. Create the foundation for a presentation deck.

## INPUT PARAMETERS
**Company Name:** {{COMPANY_NAME}}
**Content/Narrative:** {{CONTENT_DESCRIPTION}}
**Target Audience:** {{AUDIENCE_TYPE}}
**Presentation Goal:** {{GOAL}}
**Desired Slide Count:** {{SLIDE_COUNT}}

## CRITICAL INSTRUCTIONS FOR HANDLING INPUT

**The content provided may be:**
- Unstructured brain dumps or meeting notes
- Bullet points without clear organization
- Stream of consciousness thoughts
- Incomplete sentences or fragments
- Mixed topics and ideas
- Raw data points without narrative

**Your job is to:**
1. Extract the KEY THEMES and organize them logically
2. Identify what STORY needs to be told based on the goal
3. Structure the narrative to achieve the presentation goal
4. Create a coherent flow even if the input is chaotic
5. Fill in logical gaps while staying true to the core content
6. Prioritize information based on audience needs and goal

## CRITICAL FORMATTING INSTRUCTIONS
- Use ONLY the section headings shown in the templates below
- DO NOT add numbered headings (e.g., ### 1., ### 2., etc.)
- DO NOT add horizontal rules (---) between headings and content
- Follow the EXACT format shown in the examples

## YOUR OUTPUT MUST INCLUDE

## EXECUTIVE SUMMARY
Brief overview of the presentation strategy.

## BRAND RESEARCH

Research the company's official brand guidelines:
- Search for exact brand colors (hex codes)
- Identify official typography
- Document brand personality
- Cite research sources

EXACT FORMAT REQUIRED:
\`\`\`markdown
## BRAND RESEARCH

### Research Sources
- [Source 1]
- [Source 2]

### Brand Colors
- **Primary:** [Name] - #XXXXXX | RGB: X, X, X
  - Usage: [When to use]
- **Secondary:** [Name] - #XXXXXX | RGB: X, X, X
  - Usage: [When to use]

### Typography
- **Primary Font:** [Font name]
- **Weights:** [Weight 1], [Weight 2]
- **Fallback:** [Alternative font]

### Brand Personality
[3-5 specific traits with explanation]
\`\`\`

## DECK ARCHITECTURE

Plan all slides with architectural approach.

**IMPORTANT:** Structure the deck to achieve the GOAL ({{GOAL}}):
- If goal is "Inform" → Focus on clarity, data, and comprehension
- If goal is "Persuade" → Build logical argument with compelling evidence
- If goal is "Educate/Train" → Progressive learning with examples
- If goal is "Report" → Clear metrics, status, and next steps
- If goal is "Inspire" → Emotional storytelling with vision
- If combination → Balance elements to achieve both objectives

**Extract and organize the narrative from the content, even if unstructured.**

EXACT FORMAT REQUIRED:
\`\`\`markdown
## DECK ARCHITECTURE

| Slide # | Title | Purpose | Info Density | Visual Approach | Hierarchy Type |
|---------|-------|---------|--------------|-----------------|----------------|
| 1 | [Title] | [Purpose] | Low/Med/High | Impact/Data/etc | Center/Asymmetric |
[Continue for all slides]
\`\`\`

## DESIGN SYSTEM

Define the visual system for the deck.

EXACT FORMAT REQUIRED:
\`\`\`markdown
## DESIGN SYSTEM

### Color Palette
- Backgrounds: [List]
- Text: [List]
- Primary: #XXXXXX
- Accents: [List]

### Typography Hierarchy
- H1: [Font], [Size], [Weight], Usage: [When]
- H2: [Font], [Size], [Weight], Usage: [When]
- Body: [Font], [Size], [Weight], Usage: [When]
\`\`\`

## SLIDE BRIEFS

For each slide, create a detailed brief.

EXACT FORMAT REQUIRED:
\`\`\`markdown
## SLIDE BRIEFS

## SLIDE 1 BRIEF: [Title]

**Content Requirements:**
- Headline: [Text]
- Subhead: [Text]
- Key message: [What to communicate]

**Visual Requirements:**
- Primary visual: [Description]
- Visual hierarchy: [PRIMARY/SECONDARY/TERTIARY distribution]
- Eye flow: [Pattern]

**Hierarchy Direction:**
[How to structure visual weight]

**Layout Guidance:**
[Grid, balance, whitespace]

**Color Palette:**
[Which brand colors to use]

**Design Rationale:**
[Why this approach]

[Repeat for all slides]
\`\`\`

Generate complete, detailed output. NO abbreviations. Each slide brief must be fully specified.
`;

const SLIDE_AGENT_PROMPT_TEMPLATE = `
# SLIDE SPECIFICATION AGENT

You are a specialist slide designer creating ONE detailed slide specification.

## BRAND GUIDELINES
{{BRAND_AND_DESIGN}}

## YOUR SLIDE BRIEF
{{SLIDE_BRIEF}}

## OUTPUT TEMPLATE

Generate the specification using this EXACT template:

\`\`\`markdown
### SLIDE {{SLIDE_NUMBER}}: {{TITLE}}

**Headline:** [Exact headline text]
**Subhead:** [Exact subhead if applicable]

---

**🎯 VISUAL HIERARCHY & ARCHITECTURE**

**Information Density:** [Low/Medium/High]
**Visual Approach:** [Impact/Comparison/Process/Data/Story]
**Eye Flow Pattern:** [Describe the visual journey]

**Visual Weight Distribution:**
1. **PRIMARY (60-70%):** [What dominates? Size, position, description]
2. **SECONDARY (20-30%):** [Supporting elements]
3. **TERTIARY (10%):** [Details and accents]

**Focal Point Strategy:**
- First Eye Contact: [What catches attention first]
- Visual Path: [Journey through the slide]
- Retention Element: [What viewers remember]

**Layout Architecture:**
- Grid Structure: [12-column, 2-column, etc.]
- Balance Type: [Symmetric/Asymmetric]
- Whitespace Strategy: [Percentage and where]

---

**📐 DETAILED VISUAL DESIGN**

**Background:**
- Color: #XXXXXX
- Pattern/Texture: [Description]

**Primary Visual Element:**
- Type: [Image/Illustration/Chart/Typography]
- Position: [Exact placement]
- Size: [Dimensions in px]
- Style: [Description]
- Colors: [Hex codes]

---

**📝 TYPOGRAPHY HIERARCHY**

**Headline:**
- Font: [Name], [Weight]
- Size: [XXpt]
- Color: #XXXXXX
- Position: [X, Y coordinates]
- Alignment: [Left/Center/Right]

**Subhead:**
- Font: [Name], [Weight]
- Size: [XXpt]
- Color: #XXXXXX
- Position: [Below headline, spacing]

**Body Text:**
- Font: [Name], [Weight]
- Size: [XXpt]
- Color: #XXXXXX

---

**🎨 COLOR & CONTRAST HIERARCHY**

**Color Palette for This Slide:**
- Dominant Color: #XXXXXX - Usage: [XX% of slide]
- Supporting Color: #XXXXXX - Usage: [XX% of slide]
- Accent Color: #XXXXXX - Usage: [XX% of slide]

**Contrast Strategy:**
- Highest Contrast: [Element and ratio]
- Medium Contrast: [Element and ratio]

**Contrast Ratios:**
- Headline: [X:1] (Meets WCAG [AA/AAA])
- Body: [X:1]

---

**📏 SPACING & MEASUREMENTS**

**Margins:**
- Top: [XXpx]
- Right: [XXpx]
- Bottom: [XXpx]
- Left: [XXpx]

**Element Spacing:**
- Between elements: [Specific measurements]

**Whitespace:**
- Percentage: [XX%]
- Where: [Description]

---

**♿ ACCESSIBILITY & READABILITY**

- Text Contrast Ratio: [All ratios listed]
- Color Blind Safe: [Yes/No with explanation]
- Font Size Minimum: [XXpt]
- Scannability: [Can viewer grasp in 3 seconds?]

---

**🧠 DESIGN RATIONALE**

**Why This Hierarchy:**
[Explanation of visual weight decisions]

**Why This Architecture:**
[Explanation of layout choices]

**Expected Viewer Experience:**
[What the viewer should feel and understand]

---
\`\`\`

Use exact brand colors from guidelines. Provide ALL measurements. NO abbreviations.

---

## FINAL STEP: ONE SINGLE JSON OUTPUT FOR PARSING

**⚠️ CRITICAL INSTRUCTION - READ CAREFULLY:**

You MUST output the JSON in a SPECIFIC way:

1. Generate ALL markdown slide specifications FIRST
2. After the LAST slide's markdown is complete
3. Output ONE SINGLE JSON block containing ALL slides
4. The JSON "slides" array must have {{SLIDE_COUNT}} entries

**❌ DO NOT DO THIS (WRONG - Multiple JSON blocks):**
- Slide 1 markdown... followed by JSON block with 1 slide
- Slide 2 markdown... followed by JSON block with 1 slide
- Slide 3 markdown... followed by JSON block with 1 slide
- Result: {{SLIDE_COUNT}} separate JSON blocks ❌

**✅ DO THIS (CORRECT - ONE JSON block):**
- Slide 1 markdown...
- Slide 2 markdown...
- Slide 3 markdown...
- ... all remaining slides...
- ONE SINGLE JSON block at the end containing ALL {{SLIDE_COUNT}} slides ✅

**The JSON block should have:**
- "brandResearch" with colors and typography
- "slides" array with {{SLIDE_COUNT}} entries (one per slide)

**⚠️ CRITICAL: Each slide MUST include a "content" field:**
- The "content" field contains ALL body text, bullet points, scenarios, quotes, or dialogues for that slide
- Extract this from your detailed markdown specifications (the 📝 TYPOGRAPHY section)
- Include ALL specific company/product terminology (e.g., "SolarWinds licensing", "SWOSH Customers", "renewal dates")
- Be specific and detailed - this is what makes slides unique and relevant!

**DO NOT create {{SLIDE_COUNT}} separate JSON blocks. Create ONE JSON block with {{SLIDE_COUNT}} slides inside the array.**

\`\`\`json
{
  "brandResearch": {
    "colors": [
      {"name": "Primary", "hex": "#XXXXXX", "rgb": "X, X, X", "usage": "..."},
      {"name": "Secondary", "hex": "#XXXXXX", "rgb": "X, X, X", "usage": "..."}
    ],
    "typography": {
      "primaryFont": "...",
      "weights": ["Bold", "Semibold"],
      "fallback": "..."
    }
  },
  "slides": [
    {
      "slideNumber": 1,
      "title": "...",
      "headline": "...",
      "subhead": "...",
      "content": "All body text, bullet points, scenarios, quotes, or any other content that should appear on the slide. Be specific and include company/product-specific terminology.",
      "infoDensity": "Low|Medium|High",
      "visualApproach": "...",
      "eyeFlowPattern": "...",
      "visualHierarchy": {
        "primary": {"percentage": 70, "description": "..."},
        "secondary": {"percentage": 20, "description": "..."},
        "tertiary": {"percentage": 10, "description": "..."}
      },
      "backgroundColor": "#FFFFFF",
      "designRationale": "..."
    },
    {
      "slideNumber": 2,
      "title": "...",
      "headline": "...",
      "subhead": "...",
      "content": "All body text, bullet points, scenarios, quotes, or any other content for slide 2. Include specific details from the user's notes.",
      "infoDensity": "Low|Medium|High",
      "visualApproach": "...",
      "eyeFlowPattern": "...",
      "visualHierarchy": {
        "primary": {"percentage": 60, "description": "..."},
        "secondary": {"percentage": 30, "description": "..."},
        "tertiary": {"percentage": 10, "description": "..."}
      },
      "backgroundColor": "#FFFFFF",
      "designRationale": "..."
    }
    // ... continue for ALL slides (3, 4, 5, etc.)
  ]
}
\`\`\`

`;

/**
 * Generate designer outline using TypeScript port of Python system
 */
export async function generateDesignerOutline(
  input: DesignerGenerationInput,
  onProgress?: (progress: DesignerGenerationProgress) => void
): Promise<PythonOrchestratorResult> {
  const startTime = Date.now();

  try {
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

    // Phase 1: Master Planning
    onProgress?.({
      phase: 'planning',
      message: 'Master planning agent analyzing your presentation...',
      timeElapsed: 0
    });

    const masterPrompt = fillTemplate(MASTER_PROMPT_TEMPLATE, {
      COMPANY_NAME: input.company,
      CONTENT_DESCRIPTION: input.content,
      AUDIENCE_TYPE: input.audience,
      GOAL: input.goal,
      SLIDE_COUNT: input.slideCount.toString()
    });

    const masterStart = Date.now();
    const masterResponse = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: masterPrompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 16384,
          includeThoughts: false
        }
      }
    });

    const masterOutput = extractTextFromResponse(masterResponse);
    const masterTime = (Date.now() - masterStart) / 1000;

    // Debug: Log master output to help diagnose issues
    console.log('📋 Master Agent Output (first 500 chars):');
    console.log(masterOutput.substring(0, 500));
    console.log('...');
    console.log(`📊 Total length: ${masterOutput.length} characters`);

    // Log full output for debugging format issues
    console.log('📋 FULL Master Agent Output:');
    console.log(masterOutput);

    onProgress?.({
      phase: 'planning',
      message: `Master planning complete! (${masterTime.toFixed(1)}s)`,
      timeElapsed: Date.now() - startTime
    });

    // Parse slide briefs
    const slideBriefs = parseSlideBriefsFromMaster(masterOutput);
    const brandAndDesign = extractBrandAndDesignFromMaster(masterOutput);

    onProgress?.({
      phase: 'parallel',
      message: `Spawning ${slideBriefs.length} parallel agents...`,
      totalSlides: slideBriefs.length,
      timeElapsed: Date.now() - startTime
    });

    // Phase 2: Parallel Slide Generation
    const slidePromises = slideBriefs.map(async (brief) => {
      const slidePrompt = fillTemplate(SLIDE_AGENT_PROMPT_TEMPLATE, {
        BRAND_AND_DESIGN: brandAndDesign,
        SLIDE_BRIEF: brief.brief,
        SLIDE_NUMBER: brief.slideNumber.toString(),
        TITLE: brief.title
      });

      const slideStart = Date.now();
      const slideResponse = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: slidePrompt,
        config: {
          thinkingConfig: {
            thinkingBudget: 8192,
            includeThoughts: false
          }
        }
      });

      const slideOutput = extractTextFromResponse(slideResponse);
      const slideTime = (Date.now() - slideStart) / 1000;

      onProgress?.({
        phase: 'parallel',
        message: `Slide ${brief.slideNumber} generated (${slideTime.toFixed(1)}s)`,
        currentSlide: brief.slideNumber,
        totalSlides: slideBriefs.length,
        timeElapsed: Date.now() - startTime
      });

      return {
        slideNumber: brief.slideNumber,
        output: slideOutput,
        success: true
      };
    });

    const slideResults = await Promise.all(slidePromises);

    // Phase 3: Assemble
    onProgress?.({
      phase: 'aggregating',
      message: 'Assembling final document...',
      timeElapsed: Date.now() - startTime
    });

    const finalDocument = assembleFinalDocument(masterOutput, slideResults);

    onProgress?.({
      phase: 'complete',
      message: 'Designer outline generated successfully!',
      totalSlides: slideResults.length,
      timeElapsed: Date.now() - startTime
    });

    // Parse the final document
    const { parseDesignerOutline } = await import('./outlineParser');
    const outline = parseDesignerOutline(finalDocument);

    return {
      success: true,
      outline,
      rawOutput: finalDocument,
      metadata: {
        masterPlanningTime: masterTime,
        totalSlides: slideResults.length,
        successfulSlides: slideResults.filter(r => r.success).length,
        failedSlides: slideResults.filter(r => !r.success).length,
        totalGenerationTime: (Date.now() - startTime) / 1000,
        parallelSpeedup: `${slideResults.length}x`
      }
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    onProgress?.({
      phase: 'error',
      message: `Error: ${errorMessage}`,
      timeElapsed: Date.now() - startTime
    });

    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Fill template with values
 */
function fillTemplate(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

/**
 * Extract text from Gemini response
 */
function extractTextFromResponse(response: any): string {
  if (!response.candidates || response.candidates.length === 0) {
    throw new Error('No response from Gemini');
  }

  const parts = response.candidates[0].content.parts;
  return parts.map((part: any) => part.text || '').join('\n\n');
}

/**
 * Parse slide briefs from master output
 */
function parseSlideBriefsFromMaster(masterOutput: string): Array<{ slideNumber: number; title: string; brief: string }> {
  const briefs: Array<{ slideNumber: number; title: string; brief: string }> = [];
  const briefPattern = /## SLIDE (\d+) BRIEF:\s*([^\n]+)\n([\s\S]*?)(?=## SLIDE \d+ BRIEF:|## NEXT STEPS|$)/gi;

  let match;
  while ((match = briefPattern.exec(masterOutput)) !== null) {
    briefs.push({
      slideNumber: parseInt(match[1]),
      title: match[2].trim(),
      brief: match[0]
    });
  }

  return briefs;
}

/**
 * Extract brand and design system from master output
 */
function extractBrandAndDesignFromMaster(masterOutput: string): string {
  const brandMatch = masterOutput.match(/## BRAND RESEARCH([\s\S]*?)(?=## DECK ARCHITECTURE|$)/i);
  const designMatch = masterOutput.match(/## DESIGN SYSTEM([\s\S]*?)(?=## SLIDE BRIEFS|$)/i);

  let result = '';
  if (brandMatch) result += `## BRAND RESEARCH\n\n${brandMatch[1].trim()}\n\n`;
  if (designMatch) result += `## DESIGN SYSTEM\n\n${designMatch[1].trim()}\n\n`;

  return result;
}

/**
 * Assemble final document from master and slide outputs
 */
function assembleFinalDocument(masterOutput: string, slideResults: any[]): string {
  // Extract sections from master
  const execSummary = extractSection(masterOutput, '## EXECUTIVE SUMMARY');
  const brandResearch = extractSection(masterOutput, '## BRAND RESEARCH');
  const architecture = extractSection(masterOutput, '## DECK ARCHITECTURE');
  const designSystem = extractSection(masterOutput, '## DESIGN SYSTEM');

  let doc = `# COMPLETE SLIDE DECK SPECIFICATION\n## Generated with Parallel Agent Architecture\n\n---\n\n`;

  if (execSummary) doc += `## EXECUTIVE SUMMARY\n\n${execSummary}\n\n---\n\n`;
  if (brandResearch) doc += `## BRAND RESEARCH\n\n${brandResearch}\n\n---\n\n`;
  if (architecture) doc += `## DECK ARCHITECTURE\n\n${architecture}\n\n---\n\n`;
  if (designSystem) doc += `## DESIGN SYSTEM\n\n${designSystem}\n\n---\n\n`;

  doc += `## DETAILED SLIDE SPECIFICATIONS\n\n`;

  // Add slide specifications
  slideResults.sort((a, b) => a.slideNumber - b.slideNumber);
  for (const result of slideResults) {
    if (result.success) {
      doc += `${result.output}\n\n`;
    }
  }

  doc += `---\n\n## PRODUCTION NOTES\n\nGenerated using parallel agent architecture with Gemini 2.5 Pro.\n`;

  return doc;
}

/**
 * Extract section from markdown
 */
function extractSection(markdown: string, heading: string): string | null {
  const pattern = new RegExp(`${escapeRegex(heading)}[\\s\\S]*?(?=\\n## |$)`, 'i');
  const match = markdown.match(pattern);
  if (!match) return null;
  return match[0].replace(new RegExp(`^${escapeRegex(heading)}\\s*\\n`, 'i'), '');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
