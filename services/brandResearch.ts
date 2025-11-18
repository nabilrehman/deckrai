/**
 * Brand Research Service
 * Shared service for researching company brand guidelines
 * Used by both Designer Mode and Chat Mode
 */

import { GoogleGenAI } from '@google/genai';
import type { CompanyTheme } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * Extract company name from user's notes/prompt
 */
export async function extractCompanyName(notes: string): Promise<string | null> {
  const extractionPrompt = `You are a text analysis expert. Extract the company name from these notes if mentioned.

Notes:
${notes}

Look for patterns like:
- "my company is..."
- "company name is..."
- "for [company name]"
- "[company].com"
- Any explicit company mention

Return ONLY the company name (e.g., "SolarWinds", "Google", "Apple"). If no company is mentioned, return "NONE".`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{ text: extractionPrompt }]
    });

    const companyName = response.text.trim();

    if (companyName === 'NONE' || !companyName || companyName.length > 50) {
      console.log('ℹ️ No company name found in notes');
      return null;
    }

    console.log(`✅ Found company: ${companyName}`);
    return companyName;
  } catch (error) {
    console.error('❌ Failed to extract company name:', error);
    return null;
  }
}

/**
 * Research brand guidelines for a company
 * Uses the same prompt format as Designer Mode (designerOrchestrator.ts)
 */
export async function researchBrandGuidelines(companyName: string): Promise<any | null> {
  const brandResearchPrompt = `## BRAND RESEARCH

Research the official brand guidelines for ${companyName}.

**Your task:**
- Search for exact brand colors (hex codes)
- Identify official typography
- Document brand personality
- Cite research sources

**EXACT FORMAT REQUIRED:**

### Research Sources
- [List the sources you found]

### Brand Colors
- **Primary:** [Name] - #XXXXXX | RGB: X, X, X
  - Usage: [When to use this color]
- **Secondary:** [Name] - #XXXXXX | RGB: X, X, X
  - Usage: [When to use this color]
- **Accent:** [Name] - #XXXXXX | RGB: X, X, X (if applicable)
  - Usage: [When to use this color]

### Typography
- **Primary Font:** [Font name]
- **Weights:** [Weight 1], [Weight 2]
- **Fallback:** [Alternative font]
- **Source:** [Where font is from]

### Brand Personality
[3-5 specific traits with explanation]

Use Google Search to find accurate information. Return the complete research.`;

  try {
    console.log(`🔍 Researching brand guidelines for ${companyName}...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      config: {
        tools: [{ googleSearch: {} }]
      },
      contents: [{ text: brandResearchPrompt }]
    });

    const researchText = response.text.trim();
    console.log(`✅ Brand research complete for ${companyName}`);

    return researchText;
  } catch (error) {
    console.error(`❌ Brand research failed for ${companyName}:`, error);
    return null;
  }
}

/**
 * Parse brand colors from research text
 * Uses same parsing logic as outlineParser.ts
 */
function parseBrandColors(researchText: string): Array<{
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  usage: string;
}> {
  const colors: any[] = [];

  const colorsMatch = researchText.match(/###\s*Brand Colors\s*\n([\s\S]*?)(?=\n###|$)/i);
  if (!colorsMatch) return colors;

  const colorLines = colorsMatch[1].split('\n-').slice(1);
  for (const line of colorLines) {
    // Match format: **Primary:** SolarWinds Orange - #FF6A29 | RGB: 255, 106, 41
    const nameMatch = line.match(/\*\*([^:]+?):\*\*[^#]*#([A-F0-9]{6})/i);
    if (nameMatch) {
      const [, name, hex] = nameMatch;
      const rgbMatch = line.match(/RGB:\s*(\d+),\s*(\d+),\s*(\d+)/i);
      const usageMatch = line.match(/Usage:\s*(.+?)(?:\n|$)/i);

      colors.push({
        name: name.trim(),
        hex: `#${hex.toUpperCase()}`,
        rgb: rgbMatch
          ? { r: parseInt(rgbMatch[1]), g: parseInt(rgbMatch[2]), b: parseInt(rgbMatch[3]) }
          : hexToRgb(`#${hex}`),
        usage: usageMatch ? usageMatch[1].trim() : ''
      });
    }
  }

  return colors;
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Parse typography from research text
 */
function parseTypography(researchText: string): {
  primaryFont: string;
  weights: string[];
  fallbackFont?: string;
  source?: string;
} {
  const defaultTypo = {
    primaryFont: 'Inter',
    weights: ['Regular', 'Medium', 'Bold'],
    fallbackFont: 'sans-serif',
    source: 'Google Fonts'
  };

  const typoMatch = researchText.match(/###\s*Typography\s*\n([\s\S]*?)(?=\n###|$)/i);
  if (!typoMatch) return defaultTypo;

  const fontMatch = typoMatch[1].match(/Primary Font:\s*(.+)/i);
  const fallbackMatch = typoMatch[1].match(/Fallback:\s*(.+)/i);
  const weightsMatch = typoMatch[1].match(/Weights:\s*(.+)/i);
  const sourceMatch = typoMatch[1].match(/Source:\s*(.+)/i);

  return {
    primaryFont: fontMatch ? fontMatch[1].trim() : defaultTypo.primaryFont,
    weights: weightsMatch ? weightsMatch[1].split(',').map(w => w.trim()) : defaultTypo.weights,
    fallbackFont: fallbackMatch ? fallbackMatch[1].trim() : defaultTypo.fallbackFont,
    source: sourceMatch ? sourceMatch[1].trim() : defaultTypo.source
  };
}

/**
 * Convert brand research to CompanyTheme object
 * Used for slide generation
 */
export function createThemeFromBrandResearch(researchText: string): CompanyTheme | null {
  const colors = parseBrandColors(researchText);

  if (colors.length === 0) {
    console.warn('⚠️ No brand colors found in research');
    return null;
  }

  const typography = parseTypography(researchText);

  const theme: CompanyTheme = {
    primaryColor: colors[0]?.hex || '#0052CC',
    secondaryColor: colors[1]?.hex || '#172B4D',
    accentColor: colors[2]?.hex || colors[0]?.hex || '#0052CC',
    fontStyle: typography.primaryFont || 'Inter',
    visualStyle: 'professional'
  };

  console.log('🎨 Created theme from brand research:', theme);
  return theme;
}

/**
 * Main function: Research brand and create theme
 * This is what Chat Mode and Designer Mode should call
 */
export async function researchBrandAndCreateTheme(notes: string): Promise<CompanyTheme | null> {
  try {
    // Step 1: Extract company name
    const companyName = await extractCompanyName(notes);
    if (!companyName) {
      return null;
    }

    // Step 2: Research brand guidelines
    const researchText = await researchBrandGuidelines(companyName);
    if (!researchText) {
      return null;
    }

    // Step 3: Create theme from research
    const theme = createThemeFromBrandResearch(researchText);
    return theme;
  } catch (error) {
    console.error('❌ Brand research and theme creation failed:', error);
    return null;
  }
}
