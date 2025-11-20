/**
 * analyzeBrandTool
 *
 * Analyze a company's brand guidelines using web research
 *
 * Use cases:
 * - Extract brand colors, fonts, and visual style
 * - Get official brand guidelines
 * - Apply consistent branding to presentations
 *
 * @tool
 */

import { GoogleGenAI } from '@google/genai';
import type { ToolResult, AnalyzeBrandParams, BrandTheme } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || '' });

/**
 * Analyze company brand guidelines
 */
export async function analyzeBrand(
  params: AnalyzeBrandParams,
  onProgress?: (update: { content: string }) => void
): Promise<ToolResult<BrandTheme>> {
  const startTime = Date.now();

  try {
    console.log(`[analyzeBrandTool] Analyzing brand: ${params.companyWebsite}`);

    const brandPrompt = `Research the brand guidelines for ${params.companyWebsite} and STREAM your discoveries as you find them.

**IMPORTANT: Stream your research process line-by-line as you discover information:**

Format each discovery on a new line starting with "→":
→ Searching for brand guidelines...
→ Found brand page at [URL]
→ Extracting primary color: [hex] ([name])
→ Found typography: [font name]
→ Analyzing visual style: [description]

After streaming all discoveries, return ONLY a JSON object with the brand information.

Return this JSON structure (fill in the values):

\`\`\`json
{
  "primaryColor": "#HEXCODE",
  "secondaryColor": "#HEXCODE",
  "accentColor": "#HEXCODE",
  "fontStyle": "Font name and style description",
  "visualStyle": "Overall design aesthetic description",
  "sources": ["source1", "source2"]
}
\`\`\`

**What to find:**
- Primary color: Main brand color as hex code
- Secondary color: Supporting brand color as hex code
- Accent color: Highlight/CTA color as hex code
- Font style: Official typeface name and description
- Visual style: Overall aesthetic (minimalist, bold, corporate, etc.)
- Sources: URLs where you found this information

**Where to look:**
- Official brand guidelines (brand.company.com, company.com/brand)
- Design system documentation
- Marketing materials and website

Return ONLY the JSON object, no explanatory text before or after.`;

    // Call Gemini 3.0 with STREAMING to get real-time discoveries
    console.log(`[analyzeBrandTool] Streaming brand research from Gemini 3.0...`);

    const response = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: brandPrompt }],
        },
      ],
      config: {
        tools: [{ googleSearch: {} }], // Enable web grounding
      },
    });

    // Stream discoveries in real-time as Gemini finds them
    let fullText = '';
    for await (const chunk of response) {
      const chunkText = chunk.text; // Property, not method
      if (chunkText) {
        fullText += chunkText;

        // Stream each discovery line as it comes in
        const lines = chunkText.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('→')) {
            // Send real-time discovery to UI (remove "→ " prefix)
            const discovery = line.trim().substring(2);
            if (discovery) {
              onProgress?.({ content: discovery });
              console.log(`[analyzeBrandTool] 💡 ${discovery}`);
            }
          }
        }
      }
    }

    const resultText = fullText;
    console.log(`[analyzeBrandTool] Streamed ${resultText.length} characters of discoveries`);

    // Extract JSON from markdown code blocks or find JSON object
    let jsonText = resultText;

    // Try to find JSON in code blocks first
    const jsonMatch = resultText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    } else {
      // Try to find raw JSON object (find first { to last })
      const firstBrace = resultText.indexOf('{');
      const lastBrace = resultText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = resultText.substring(firstBrace, lastBrace + 1);
      }
    }

    // Parse the brand theme
    const brandTheme: BrandTheme = JSON.parse(jsonText.trim());

    const executionTime = Date.now() - startTime;
    console.log(`[analyzeBrandTool] ✅ Brand analysis complete in ${executionTime}ms`);
    console.log(`[analyzeBrandTool] Primary: ${brandTheme.primaryColor}`);
    console.log(`[analyzeBrandTool] Secondary: ${brandTheme.secondaryColor}`);
    console.log(`[analyzeBrandTool] Accent: ${brandTheme.accentColor}`);
    console.log(`[analyzeBrandTool] Font: ${brandTheme.fontStyle}`);

    return {
      success: true,
      data: brandTheme,
      metadata: {
        executionTime,
        model: 'gemini-3-pro-preview',
      },
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[analyzeBrandTool] ❌ Error:`, error);

    return {
      success: false,
      error: {
        code: 'BRAND_ANALYSIS_FAILED',
        message: 'Failed to analyze brand',
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
export const analyzeBrandTool = {
  name: 'analyzeBrandTool',
  description: 'Analyze a company\'s brand guidelines using web research. Extracts brand colors (hex codes), typography, and visual style from official brand guidelines or website.',
  parameters: {
    type: 'object',
    properties: {
      companyWebsite: {
        type: 'string',
        description: 'Company website URL (e.g., "atlassian.com", "https://www.google.com")',
      },
    },
    required: ['companyWebsite'],
  },
  execute: analyzeBrand,
};
