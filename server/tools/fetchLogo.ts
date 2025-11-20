/**
 * fetchCompanyLogoTool
 *
 * Find and fetch a company's logo
 *
 * Use cases:
 * - Get company logo for branding slides
 * - Add client logos to presentations
 * - Ensure professional branding
 *
 * @tool
 */

import { GoogleGenAI } from '@google/genai';
import type { ToolResult, FetchCompanyLogoParams, CompanyLogo } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || '' });

/**
 * Fetch company logo using web research
 */
export async function fetchCompanyLogo(params: FetchCompanyLogoParams): Promise<ToolResult<CompanyLogo>> {
  const startTime = Date.now();

  try {
    console.log(`[fetchCompanyLogoTool] Fetching logo for: ${params.companyWebsite}`);
    console.log(`[fetchCompanyLogoTool] Size preference: ${params.size}`);

    const logoPrompt = `Find the official company logo for ${params.companyWebsite}.

**Requirements:**
- Find a ${params.size} resolution version (small: 100-200px, medium: 200-400px, large: 400px+)
- Prefer transparent PNG format
- Get the official logo from the company website or press kit
- Look for logo in common locations:
  - /logo.png
  - /images/logo.png
  - /assets/logo.png
  - Press kit / media resources page
  - About page

Return a JSON object:

{
  "companyName": "Company Name",
  "logoUrl": "https://direct-url-to-logo.png",
  "format": "png|jpg|svg"
}

**Important:**
- Return the DIRECT URL to the image file
- Prefer PNG or SVG format
- Ensure the URL is accessible (not behind authentication)
- If multiple sizes available, pick the one closest to requested size`;

    // Call Gemini 3.0 with web grounding
    console.log(`[fetchCompanyLogoTool] Calling Gemini 3.0 with web grounding...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: logoPrompt }],
        },
      ],
      config: {
        tools: [{ googleSearch: {} }], // Enable web grounding
      },
    });

    const resultText = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    console.log(`[fetchCompanyLogoTool] Response preview: ${resultText.substring(0, 200)}...`);

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

    // Parse the result
    const logoInfo = JSON.parse(jsonText.trim());

    // TODO: In a full implementation, we would fetch the image and convert to base64
    // For now, we'll return the URL and let the caller handle fetching if needed
    const companyLogo: CompanyLogo = {
      companyName: logoInfo.companyName,
      logoUrl: logoInfo.logoUrl,
      logoBase64: '', // Would be populated by actually fetching the image
      format: logoInfo.format as 'png' | 'jpg' | 'svg',
    };

    const executionTime = Date.now() - startTime;
    console.log(`[fetchCompanyLogoTool] ✅ Logo found in ${executionTime}ms`);
    console.log(`[fetchCompanyLogoTool] Company: ${companyLogo.companyName}`);
    console.log(`[fetchCompanyLogoTool] URL: ${companyLogo.logoUrl}`);
    console.log(`[fetchCompanyLogoTool] Format: ${companyLogo.format}`);

    return {
      success: true,
      data: companyLogo,
      metadata: {
        executionTime,
        model: 'gemini-3-pro-preview',
      },
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[fetchCompanyLogoTool] ❌ Error:`, error);

    return {
      success: false,
      error: {
        code: 'LOGO_FETCH_FAILED',
        message: 'Failed to fetch company logo',
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
export const fetchCompanyLogoTool = {
  name: 'fetchCompanyLogoTool',
  description: 'Find and fetch a company\'s logo using web research. Returns logo URL and metadata. Useful for adding client branding to presentations.',
  parameters: {
    type: 'object',
    properties: {
      companyWebsite: {
        type: 'string',
        description: 'Company website URL (e.g., "atlassian.com", "https://www.google.com")',
      },
      size: {
        type: 'string',
        enum: ['small', 'medium', 'large'],
        description: 'Preferred logo size: "small" (100-200px), "medium" (200-400px), "large" (400px+)',
      },
    },
    required: ['companyWebsite', 'size'],
  },
  execute: fetchCompanyLogo,
};
