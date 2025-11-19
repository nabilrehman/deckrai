/**
 * Outline Parser
 * Parses the markdown output from Python parallel-orchestrator.py
 * Extracts brand research, slide architecture, and slide specifications
 *
 * **NEW:** Tries JSON parsing first (reliable), falls back to regex (legacy)
 */

import type {
  DesignerOutline,
  BrandResearch,
  BrandColor,
  SlideArchitecture,
  SlideSpecification,
  DesignSystem,
  VisualHierarchy
} from '../types/designerMode';

/**
 * Try to extract and parse JSON from the master output
 * Handles both single JSON block and multiple JSON blocks
 * Returns null if JSON not found or invalid
 */
function tryExtractJSON(markdownOutput: string): any | null {
  try {
    // Extract ALL JSON blocks (master agent often creates multiple)
    const jsonMatches = markdownOutput.matchAll(/```json\s*([\s\S]*?)\s*```/g);
    const blocks = Array.from(jsonMatches);

    if (blocks.length === 0) {
      console.log('⚠️ No JSON blocks found in master output, falling back to regex parsing');
      return null;
    }

    console.log(`📊 Found ${blocks.length} JSON block(s) in master output`);

    // Try to parse each block and merge them
    let brandResearch: any = null;
    const allSlides: any[] = [];

    for (let i = 0; i < blocks.length; i++) {
      try {
        let jsonText = blocks[i][1].trim();

        // Extract JSON from response - handle conversational text before JSON
        // Try to find JSON object in the response if direct parse fails
        const objMatch = jsonText.match(/\{[\s\S]*\}/);
        if (objMatch) {
          jsonText = objMatch[0];
        }

        const parsed = JSON.parse(jsonText);

        // Extract brand research from first block that has it
        if (parsed.brandResearch && !brandResearch) {
          brandResearch = parsed.brandResearch;
        }

        // Collect slides from all blocks
        if (parsed.slides && Array.isArray(parsed.slides)) {
          allSlides.push(...parsed.slides);
        }
      } catch (e) {
        console.warn(`⚠️ Failed to parse JSON block ${i + 1}:`, e);
      }
    }

    // Merge all data
    const merged = {
      brandResearch: brandResearch || { colors: [], typography: {} },
      slides: allSlides
    };

    console.log(`✅ Successfully merged ${allSlides.length} slide(s) from ${blocks.length} JSON block(s)`);
    return merged;
  } catch (e) {
    console.warn('⚠️ Failed to extract JSON from master output:', e);
    return null;
  }
}

/**
 * Convert JSON data to DesignerOutline format
 */
function convertJSONToOutline(jsonData: any): DesignerOutline {
  const outline: DesignerOutline = {
    brandResearch: {
      sources: [],
      colors: (jsonData.brandResearch?.colors || []).map((c: any) => ({
        name: c.name || 'Color',
        hex: c.hex || '#000000',
        rgb: parseRGB(c.rgb),
        usage: c.usage || ''
      })),
      typography: {
        primaryFont: jsonData.brandResearch?.typography?.primaryFont || 'Inter',
        weights: jsonData.brandResearch?.typography?.weights || ['Regular'],
        fallbackFont: jsonData.brandResearch?.typography?.fallback || 'sans-serif',
        source: ''
      },
      personality: ''
    },
    deckArchitecture: [],
    designSystem: {
      colorPalette: {
        backgrounds: ['#FFFFFF'],
        text: ['#172B4D'],
        primary: jsonData.brandResearch?.colors?.[0]?.hex || '#0052CC',
        accents: []
      },
      typographyHierarchy: {
        h1: { font: 'Inter', size: '48pt', weight: 'Bold', usage: 'Main headlines' },
        h2: { font: 'Inter', size: '32pt', weight: 'Semibold', usage: 'Sub-headlines' },
        body: { font: 'Inter', size: '18pt', weight: 'Regular', usage: 'Body text' }
      }
    },
    slideSpecifications: (jsonData.slides || []).map((s: any) => ({
      slideNumber: s.slideNumber || 1,
      title: s.title || '',
      headline: s.headline || s.title || '',
      subhead: s.subhead,
      content: s.content, // Extract body text/bullet points/scenarios
      visualHierarchy: s.visualHierarchy || {
        primary: { percentage: 60, description: 'Main content' },
        secondary: { percentage: 30, description: 'Supporting elements' },
        tertiary: { percentage: 10, description: 'Details' }
      },
      infoDensity: s.infoDensity || 'Medium',
      visualApproach: s.visualApproach || '',
      eyeFlowPattern: s.eyeFlowPattern || '',
      backgroundColor: s.backgroundColor || '#FFFFFF',
      textColors: {
        headline: '#172B4D',
        body: '#172B4D'
      },
      typography: {
        headline: { font: 'Inter', size: '48pt', weight: 'Bold', color: '#172B4D' }
      },
      designRationale: s.designRationale
    }))
  };

  return outline;
}

/**
 * Parse RGB string like "255, 106, 41" to {r, g, b}
 */
function parseRGB(rgbString: string): { r: number; g: number; b: number } {
  if (!rgbString) return { r: 0, g: 0, b: 0 };
  const parts = rgbString.split(',').map(p => parseInt(p.trim()));
  return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0 };
}

/**
 * Parse complete designer outline from markdown output
 * UPDATED: Tries JSON first, falls back to regex parsing
 */
export function parseDesignerOutline(markdownOutput: string): DesignerOutline {
  try {
    // Try JSON parsing first (new, reliable method)
    const jsonData = tryExtractJSON(markdownOutput);
    if (jsonData) {
      console.log('✅ Using JSON parsing (reliable)');
      return convertJSONToOutline(jsonData);
    }

    // Fall back to regex parsing (legacy method)
    console.log('⚠️ Using regex parsing (legacy fallback)');
    const outline: DesignerOutline = {
      brandResearch: parseBrandResearch(markdownOutput),
      deckArchitecture: parseDeckArchitecture(markdownOutput),
      designSystem: parseDesignSystem(markdownOutput),
      slideSpecifications: parseSlideSpecifications(markdownOutput),
    };

    // Safety net: If no slide specifications found, generate defaults
    if (outline.slideSpecifications.length === 0) {
      console.warn('⚠️ No slide specifications found, generating default slides');

      // Try to infer slide count from content
      const slideCountMatch = markdownOutput.match(/(\d+)\s+slides?/i);
      const defaultCount = slideCountMatch ? parseInt(slideCountMatch[1]) : 10;

      for (let i = 1; i <= defaultCount; i++) {
        outline.slideSpecifications.push({
          slideNumber: i,
          title: `Slide ${i}`,
          headline: `Slide ${i}`,
          visualHierarchy: {
            primary: { percentage: 60, description: 'Main content' },
            secondary: { percentage: 30, description: 'Supporting info' },
            tertiary: { percentage: 10, description: 'Details' }
          },
          infoDensity: 'Medium',
          visualApproach: 'Professional',
          eyeFlowPattern: 'Top to bottom',
          backgroundColor: '#FFFFFF',
          textColors: { headline: '#172B4D', body: '#172B4D' },
          typography: {
            headline: { font: 'Inter', size: '48pt', weight: 'Bold', color: '#172B4D' }
          }
        });
      }
    }

    // Optional sections
    const execSummary = extractSection(markdownOutput, '## EXECUTIVE SUMMARY');
    if (execSummary) {
      outline.executiveSummary = execSummary.trim();
    }

    const prodNotes = extractSection(markdownOutput, '## PRODUCTION NOTES');
    if (prodNotes) {
      outline.productionNotes = prodNotes.trim();
    }

    console.log(`✅ Parsed outline: ${outline.slideSpecifications.length} slides, ${outline.brandResearch.colors.length} brand colors`);
    return outline;
  } catch (error) {
    console.error('Error parsing designer outline:', error);
    throw new Error(`Failed to parse designer outline: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Extract a section from markdown by heading
 */
function extractSection(markdown: string, heading: string): string | null {
  const headingRegex = new RegExp(`${escapeRegex(heading)}[\\s\\S]*?(?=\\n## |$)`, 'i');
  const match = markdown.match(headingRegex);
  if (!match) return null;

  // Remove the heading itself
  return match[0].replace(new RegExp(`^${escapeRegex(heading)}\\s*\\n`, 'i'), '');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse brand research section
 */
function parseBrandResearch(markdown: string): BrandResearch {
  const section = extractSection(markdown, '## BRAND RESEARCH');
  if (!section) {
    console.warn('⚠️ Brand research section not found, using defaults');
    // Return defaults instead of throwing error
    return {
      sources: ['Default brand guidelines'],
      colors: [
        { name: 'Primary', hex: '#0052CC', rgb: { r: 0, g: 82, b: 204 }, usage: 'Main brand color' },
        { name: 'Secondary', hex: '#172B4D', rgb: { r: 23, g: 43, b: 77 }, usage: 'Text and accents' },
      ],
      typography: {
        primaryFont: 'Inter',
        weights: ['Regular', 'Medium', 'Bold'],
        source: 'Google Fonts'
      },
      personality: 'Professional, modern, and trustworthy'
    };
  }

  const colors: BrandColor[] = [];
  const sources: string[] = [];
  let typography: BrandResearch['typography'] = {
    primaryFont: 'Inter',
    weights: ['Regular', 'Medium', 'Bold'],
    source: 'Google Fonts'
  };
  let personality = '';

  // Extract research sources
  const sourcesMatch = section.match(/###\s*Research Sources\s*\n([\s\S]*?)(?=\n###|$)/i);
  if (sourcesMatch) {
    const sourceLines = sourcesMatch[1].match(/^-\s*(.+)$/gm);
    if (sourceLines) {
      sources.push(...sourceLines.map(line => line.replace(/^-\s*/, '').trim()));
    }
  }

  // Extract brand colors
  const colorsMatch = section.match(/###\s*Brand Colors\s*\n([\s\S]*?)(?=\n###|$)/i);
  if (colorsMatch) {
    const colorLines = colorsMatch[1].split('\n-').slice(1);
    for (const line of colorLines) {
      // Updated regex to handle ACTUAL master agent format:
      // **Primary:** SolarWinds Orange - #FF6A29 | RGB: 255, 106, 41
      // Captures: "Primary" and "FF6A29"
      const nameMatch = line.match(/\*\*([^:]+?):\*\*[^#]*#([A-F0-9]{6})/i);
      if (nameMatch) {
        const [, name, hex] = nameMatch;
        const usageMatch = line.match(/Usage:\s*(.+?)(?:\n|$)/i);
        colors.push({
          name: name.trim(),
          hex: `#${hex.toUpperCase()}`,
          rgb: hexToRgb(`#${hex}`),
          usage: usageMatch ? usageMatch[1].trim() : ''
        });
      }
    }
  }

  // Extract typography
  const typoMatch = section.match(/###\s*Typography\s*\n([\s\S]*?)(?=\n###|$)/i);
  if (typoMatch) {
    const fontMatch = typoMatch[1].match(/Primary Font:\s*(.+)/i);
    const fallbackMatch = typoMatch[1].match(/Fallback:\s*(.+)/i);
    const weightsMatch = typoMatch[1].match(/Weights:\s*(.+)/i);
    const sourceMatch = typoMatch[1].match(/Source:\s*(.+)/i);

    if (fontMatch) typography.primaryFont = fontMatch[1].trim();
    if (fallbackMatch) typography.fallbackFont = fallbackMatch[1].trim();
    if (weightsMatch) typography.weights = weightsMatch[1].split(',').map(w => w.trim());
    if (sourceMatch) typography.source = sourceMatch[1].trim();
  }

  // Extract brand personality
  const personalityMatch = section.match(/###\s*Brand Personality\s*\n([\s\S]*?)(?=\n###|$)/i);
  if (personalityMatch) {
    personality = personalityMatch[1].trim();
  }

  return {
    sources,
    colors,
    typography,
    personality
  };
}

/**
 * Parse deck architecture table
 */
function parseDeckArchitecture(markdown: string): SlideArchitecture[] {
  const section = extractSection(markdown, '## DECK ARCHITECTURE');
  if (!section) {
    console.warn('⚠️ Deck architecture section not found, generating default structure');
    // Return empty array - will be inferred from slide specifications
    return [];
  }

  const architecture: SlideArchitecture[] = [];

  // Match table rows (skip header)
  const tableMatch = section.match(/\|[\s\S]*?\n\|([\s\S]*?)(?=\n\n|$)/);
  if (!tableMatch) return architecture;

  const rows = tableMatch[1].split('\n').filter(line => line.trim() && !line.includes('---'));

  for (const row of rows) {
    const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
    if (cells.length >= 6) {
      architecture.push({
        slideNumber: parseInt(cells[0]) || architecture.length + 1,
        title: cells[1],
        purpose: cells[2],
        infoDensity: cells[3] as 'Low' | 'Medium' | 'High',
        visualApproach: cells[4] as any,
        hierarchyType: cells[5]
      });
    }
  }

  return architecture;
}

/**
 * Parse design system
 */
function parseDesignSystem(markdown: string): DesignSystem {
  const section = extractSection(markdown, '## DESIGN SYSTEM');
  if (!section) {
    return {
      colorPalette: { backgrounds: ['#FFFFFF'], text: ['#172B4D'], primary: '#0052CC', accents: [] },
      typographyHierarchy: {
        h1: { font: 'Inter', size: '48pt', weight: 'Bold', usage: 'Main headlines' },
        h2: { font: 'Inter', size: '32pt', weight: 'Semibold', usage: 'Sub-headlines' },
        body: { font: 'Inter', size: '18pt', weight: 'Regular', usage: 'Body text' }
      }
    };
  }

  const designSystem: DesignSystem = {
    colorPalette: {
      backgrounds: [],
      text: [],
      primary: '',
      accents: []
    },
    typographyHierarchy: {
      h1: { font: 'Inter', size: '48pt', weight: 'Bold', usage: 'Main headlines' },
      h2: { font: 'Inter', size: '32pt', weight: 'Semibold', usage: 'Sub-headlines' },
      body: { font: 'Inter', size: '18pt', weight: 'Regular', usage: 'Body text' }
    }
  };

  // Extract color palette
  const colorMatch = section.match(/###\s*Color Palette\s*\n([\s\S]*?)(?=\n###|$)/i);
  if (colorMatch) {
    const colorText = colorMatch[1];
    const bgMatch = colorText.match(/Backgrounds?:\s*([#A-F0-9,\s()]+)/i);
    const textMatch = colorText.match(/Text:\s*([#A-F0-9,\s()]+)/i);
    const primaryMatch = colorText.match(/Primary[^:]*:\s*([#A-F0-9]+)/i);
    const accentMatch = colorText.match(/Accents?:\s*([#A-F0-9,\s()]+)/i);

    if (bgMatch) designSystem.colorPalette.backgrounds = extractColors(bgMatch[1]);
    if (textMatch) designSystem.colorPalette.text = extractColors(textMatch[1]);
    if (primaryMatch) designSystem.colorPalette.primary = primaryMatch[1].trim();
    if (accentMatch) designSystem.colorPalette.accents = extractColors(accentMatch[1]);
  }

  return designSystem;
}

/**
 * Parse individual slide specifications
 */
function parseSlideSpecifications(markdown: string): SlideSpecification[] {
  const section = extractSection(markdown, '## DETAILED SLIDE SPECIFICATIONS');
  if (!section) {
    console.warn('⚠️ Detailed slide specifications not found, trying alternate patterns...');

    // Try to find any slide specification patterns in the entire document
    const slidePattern = /###\s*(?:SLIDE\s+)?(\d+)[:.]\s*([^\n]+)/gi;
    const specs: SlideSpecification[] = [];
    let match;

    while ((match = slidePattern.exec(markdown)) !== null) {
      const slideNum = parseInt(match[1]);
      const title = match[2].trim();

      specs.push({
        slideNumber: slideNum,
        title: title,
        headline: title,
        visualHierarchy: {
          primary: { percentage: 60, description: 'Main content area' },
          secondary: { percentage: 30, description: 'Supporting information' },
          tertiary: { percentage: 10, description: 'Accents and details' }
        },
        infoDensity: 'Medium',
        visualApproach: 'Professional presentation',
        eyeFlowPattern: 'Top to bottom, left to right',
        backgroundColor: '#FFFFFF',
        textColors: {
          headline: '#172B4D',
          body: '#172B4D'
        },
        typography: {
          headline: { font: 'Inter', size: '48pt', weight: 'Bold', color: '#172B4D' }
        }
      });
    }

    console.log(`📝 Extracted ${specs.length} slides from alternate patterns`);
    return specs.length > 0 ? specs : [];
  }

  const specs: SlideSpecification[] = [];

  // Split by slide headers
  const slidePattern = /###\s*SLIDE\s+(\d+):\s*([^\n]+)\n([\s\S]*?)(?=###\s*SLIDE\s+\d+:|$)/gi;
  let match;

  while ((match = slidePattern.exec(section)) !== null) {
    const [, slideNum, title, content] = match;

    const spec: SlideSpecification = {
      slideNumber: parseInt(slideNum),
      title: title.trim(),
      headline: '',
      visualHierarchy: extractVisualHierarchy(content),
      infoDensity: 'Medium',
      visualApproach: '',
      eyeFlowPattern: '',
      backgroundColor: '#FFFFFF',
      textColors: {
        headline: '#172B4D',
        body: '#172B4D'
      },
      typography: {
        headline: { font: 'Inter', size: '48pt', weight: 'Bold', color: '#172B4D' }
      }
    };

    // Extract headline
    const headlineMatch = content.match(/\*\*Headline:\*\*\s*(.+)/i);
    if (headlineMatch) spec.headline = headlineMatch[1].trim();

    // Extract subhead
    const subheadMatch = content.match(/\*\*Subhead:\*\*\s*(.+)/i);
    if (subheadMatch) spec.subhead = subheadMatch[1].trim();

    // Extract information density
    const densityMatch = content.match(/\*\*Information Density:\*\*\s*(Low|Medium|High)/i);
    if (densityMatch) spec.infoDensity = densityMatch[1] as any;

    // Extract visual approach
    const approachMatch = content.match(/\*\*Visual Approach:\*\*\s*(.+)/i);
    if (approachMatch) spec.visualApproach = approachMatch[1].trim();

    // Extract eye flow pattern
    const flowMatch = content.match(/\*\*Eye Flow Pattern:\*\*\s*(.+)/i);
    if (flowMatch) spec.eyeFlowPattern = flowMatch[1].trim();

    // Extract background color
    const bgMatch = content.match(/Background.*?Color:\s*#([A-F0-9]{6})/i);
    if (bgMatch) spec.backgroundColor = `#${bgMatch[1]}`;

    // Extract design rationale
    const rationaleMatch = content.match(/\*\*(?:🧠\s*)?DESIGN RATIONALE\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/i);
    if (rationaleMatch) spec.designRationale = rationaleMatch[1].trim();

    specs.push(spec);
  }

  return specs;
}

/**
 * Extract visual hierarchy from slide content
 */
function extractVisualHierarchy(content: string): VisualHierarchy {
  const hierarchy: VisualHierarchy = {
    primary: { percentage: 60, description: '' },
    secondary: { percentage: 30, description: '' },
    tertiary: { percentage: 10, description: '' }
  };

  // Match PRIMARY (XX% or XX-XX%) - handle numbered lists "1. " and markdown bold **
  // Example formats:
  // - "1.  **PRIMARY (60-70%):** Description"
  // - "**PRIMARY (60%):** Description"
  const primaryMatch = content.match(/(?:^\d+\.\s*)?\*?\*?PRIMARY\s*\((\d+(?:-\d+)?)%?\):\*?\*?\s*(.+)/im);
  if (primaryMatch) {
    // For ranges like "60-70", take the first number
    const percentStr = primaryMatch[1].split('-')[0];
    hierarchy.primary.percentage = parseInt(percentStr);
    hierarchy.primary.description = primaryMatch[2].trim();
  }

  // Match SECONDARY (XX% or XX-XX%) - handle numbered lists "2. " and markdown bold **
  const secondaryMatch = content.match(/(?:^\d+\.\s*)?\*?\*?SECONDARY\s*\((\d+(?:-\d+)?)%?\):\*?\*?\s*(.+)/im);
  if (secondaryMatch) {
    // For ranges like "20-30", take the first number
    const percentStr = secondaryMatch[1].split('-')[0];
    hierarchy.secondary.percentage = parseInt(percentStr);
    hierarchy.secondary.description = secondaryMatch[2].trim();
  }

  // Match TERTIARY (XX% or XX-XX%) - handle numbered lists "3. " and markdown bold **
  const tertiaryMatch = content.match(/(?:^\d+\.\s*)?\*?\*?TERTIARY\s*\((\d+(?:-\d+)?)%?\):\*?\*?\s*(.+)/im);
  if (tertiaryMatch) {
    // For ranges like "10-15", take the first number
    const percentStr = tertiaryMatch[1].split('-')[0];
    hierarchy.tertiary.percentage = parseInt(percentStr);
    hierarchy.tertiary.description = tertiaryMatch[2].trim();
  }

  return hierarchy;
}

/**
 * Extract hex colors from a string
 */
function extractColors(text: string): string[] {
  const hexPattern = /#[A-F0-9]{6}/gi;
  return (text.match(hexPattern) || []).map(color => color.toUpperCase());
}

/**
 * Convert hex color to RGB
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
 * Build a prompt for createSlideFromPrompt from a slide specification
 */
export function buildPromptFromSpec(spec: SlideSpecification, brandResearch: BrandResearch): string {
  let prompt = `Create a presentation slide:\n\n`;

  // Title and headline
  prompt += `Title: ${spec.title}\n`;
  if (spec.headline) prompt += `Headline: "${spec.headline}"\n`;
  if (spec.subhead) prompt += `Subhead: "${spec.subhead}"\n`;

  // Slide content (body text, bullet points, scenarios)
  if (spec.content) {
    prompt += `\nContent:\n${spec.content}\n`;
  }
  prompt += `\n`;

  // Visual hierarchy
  prompt += `Visual Hierarchy:\n`;
  prompt += `- PRIMARY (${spec.visualHierarchy.primary.percentage}%): ${spec.visualHierarchy.primary.description}\n`;
  prompt += `- SECONDARY (${spec.visualHierarchy.secondary.percentage}%): ${spec.visualHierarchy.secondary.description}\n`;
  prompt += `- TERTIARY (${spec.visualHierarchy.tertiary.percentage}%): ${spec.visualHierarchy.tertiary.description}\n\n`;

  // Visual approach and eye flow
  if (spec.visualApproach) prompt += `Visual Approach: ${spec.visualApproach}\n`;
  if (spec.eyeFlowPattern) prompt += `Eye Flow: ${spec.eyeFlowPattern}\n`;
  prompt += `Information Density: ${spec.infoDensity}\n\n`;

  // Brand colors
  if (brandResearch.colors.length > 0) {
    prompt += `Brand Colors:\n`;
    brandResearch.colors.slice(0, 3).forEach(color => {
      prompt += `- ${color.name}: ${color.hex} (${color.usage})\n`;
    });
    prompt += `\n`;
  }

  // Design rationale
  if (spec.designRationale) {
    prompt += `Design Approach: ${spec.designRationale}\n\n`;
  }

  prompt += `Use exact brand colors, maintain visual hierarchy, and create a professional, designer-quality slide.`;

  return prompt;
}
