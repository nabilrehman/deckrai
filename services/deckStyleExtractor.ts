/**
 * Deck Style Extractor Service
 *
 * Analyzes a brand's style library to extract:
 * 1. Brand Guidelines (typography, colors, spacing, visual patterns)
 * 2. Consistency Rules (logo position, page number position, header position)
 *
 * This ensures all slides in a deck maintain visual consistency.
 */

import { GoogleGenAI } from '@google/genai';
import type { StyleLibraryItem } from '../types';

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * Brand Guidelines extracted from style library analysis
 */
export interface BrandGuidelines {
  typography: {
    // Font families
    headlineFont: string;        // "Montserrat Bold" or "Inter Black"
    bodyFont: string;            // "Open Sans Regular" or "Roboto"
    // Size hierarchy (in points or relative sizes)
    h1Size: string;              // "48pt" or "4rem" - main title
    h2Size: string;              // "36pt" - section headers
    h3Size: string;              // "24pt" - subheadings
    bodySize: string;            // "16pt" - body text
    captionSize: string;         // "12pt" - captions, footnotes
    // Colors
    headlineColor: string;       // "#FFFFFF"
    bodyColor: string;           // "#FFFFFF or #1a1a1a"
    accentTextColor: string;     // "#00a8e8" - for highlighted text
    // Weights
    headlineWeight: string;      // "700 Bold" or "800 Black"
    bodyWeight: string;          // "400 Regular"
    // Spacing
    lineHeight: string;          // "1.5" or "150%"
    letterSpacing: string;       // "normal" or "0.02em" or "tight"
    // Text treatment
    headingCase: string;         // "uppercase", "sentence", "title"
    textAlignment: string;       // "left", "center", "left-headers-center-body"
  };
  colorPalette: {
    primary: string;             // "#1e3a5f"
    secondary: string;           // "#ff6b35"
    accent: string;              // "#00a8e8"
    tertiary: string;            // "#2dd4bf" - third brand color if present
    backgrounds: string[];       // ["#1a1a1a", "#2d2d2d", "#ffffff"]
    textOnDark: string;          // "#FFFFFF"
    textOnLight: string;         // "#1a1a1a"
    gradients: string[];         // ["linear-gradient(135deg, #1e3a5f, #0d1b2a)"]
  };
  spacing: {
    // Margins
    slideMargins: string;        // "5% all sides" or "48px"
    headerTopMargin: string;     // "8%" or "64px"
    // Content area
    contentWidth: string;        // "90% centered" or "1200px max"
    contentAlignment: string;    // "left", "center"
    // Element spacing
    elementGaps: string;         // "24px between sections"
    paragraphSpacing: string;    // "16px between paragraphs"
    listItemSpacing: string;     // "12px between bullet items"
  };
  contentElements: {
    // Bullet points
    bulletStyle: string;         // "•" or "-" or "→" or "custom icon"
    bulletColor: string;         // "#00a8e8" (accent) or "inherit"
    bulletIndent: string;        // "24px" or "1.5em"
    // Numbers/stats
    statNumberStyle: string;     // "large bold primary color" or "48pt white"
    statLabelStyle: string;      // "small caps below number"
    // Quotes/callouts
    quoteStyle: string;          // "left border accent color, italic"
    calloutStyle: string;        // "rounded box, light background"
    // Dividers
    dividerStyle: string;        // "thin line" or "gradient bar" or "none"
    dividerColor: string;        // "#e5e7eb" or "accent"
  };
  visualStyle: {
    // Shapes
    cornerRadius: string;        // "8px rounded" or "0 sharp" or "16px very rounded"
    shapeLanguage: string;       // "geometric rectangles" or "organic curves"
    // Effects
    shadows: string;             // "subtle drop shadows on cards" or "none"
    overlays: string;            // "dark gradient overlay on images"
    // Images
    imageStyle: string;          // "rounded corners, subtle shadow" or "full bleed"
    imageTreatment: string;      // "color filter", "grayscale", "none"
    // Icons
    iconStyle: string;           // "outlined, monochrome" or "filled, colorful"
    iconSize: string;            // "24px" or "32px"
    // Charts/data viz
    chartStyle: string;          // "flat design, brand colors, no gridlines"
    chartColors: string[];       // ["#1e3a5f", "#ff6b35", "#00a8e8"]
    // Background
    backgroundStyle: string;     // "dark gradients, navy to black"
  };
  layoutPatterns: {
    // Common layouts observed
    twoColumnSplit: string;      // "40/60" or "50/50" or "image left, text right"
    threeColumnGrid: string;     // "equal columns with icon headers"
    heroLayout: string;          // "centered text over full image"
    // Content zones
    primaryContentZone: string;  // "center-left, 60% width"
    secondaryContentZone: string; // "right sidebar, 35% width"
  };
  patterns: string[];            // ["headers have colored underline", "3-col grids for features"]
}

/**
 * Consistency Rules for deck-wide uniformity
 */
export interface DeckConsistencyRules {
  titleSlide: {
    hasLogo: boolean;
    logoPosition: 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left' | 'none';
    hasPageNumber: boolean;
    pageNumberPosition: string;
    headerPosition: 'center' | 'top-left' | 'bottom-center';
  };
  contentSlide: {
    headerPosition: 'top-left' | 'top-center' | 'bottom-left';
    headerStyle: string;         // "Bold white text on dark color bar"
    logoPosition: 'bottom-left' | 'bottom-right' | 'top-right' | 'none';
    pageNumberPosition: 'bottom-right' | 'bottom-center' | 'bottom-left' | 'none';
    pageNumberFormat: string;    // "1/10" or "Page 1" or just "1"
    footerLayout: string;        // "Logo left, page number right"
  };
}

/**
 * Combined extraction result
 */
export interface DeckStyleExtraction {
  brandGuidelines: BrandGuidelines;
  consistencyRules: DeckConsistencyRules;
  promptSection: string;         // Pre-formatted text to append to Imagen prompts
}

/**
 * Prompt for extracting brand guidelines from style library
 */
const BRAND_GUIDELINES_PROMPT = `You are an expert brand designer and slide design specialist analyzing a collection of presentation slides from a company's style library.

Your task is to extract COMPREHENSIVE BRAND GUIDELINES to ensure all new slides maintain perfect visual consistency.

Analyze ALL provided images meticulously and extract:

{
  "typography": {
    "headlineFont": "Font family name (e.g., 'Montserrat Bold', 'Inter Black')",
    "bodyFont": "Body font family (e.g., 'Open Sans Regular', 'Roboto')",
    "h1Size": "Main title size (e.g., '48pt', '4rem')",
    "h2Size": "Section header size (e.g., '36pt')",
    "h3Size": "Subheading size (e.g., '24pt')",
    "bodySize": "Body text size (e.g., '16pt', '18pt')",
    "captionSize": "Caption/footnote size (e.g., '12pt')",
    "headlineColor": "#hexcode",
    "bodyColor": "#hexcode",
    "accentTextColor": "#hexcode for highlighted/emphasized text",
    "headlineWeight": "700 Bold or 800 Black",
    "bodyWeight": "400 Regular or 500 Medium",
    "lineHeight": "1.5 or 150%",
    "letterSpacing": "normal, tight, 0.02em",
    "headingCase": "uppercase, sentence, title",
    "textAlignment": "left, center, or left-headers-center-body"
  },
  "colorPalette": {
    "primary": "#hexcode - main brand color",
    "secondary": "#hexcode - secondary brand color",
    "accent": "#hexcode - accent/highlight color",
    "tertiary": "#hexcode - third brand color if present (or 'none')",
    "backgrounds": ["#hex1", "#hex2", "#hex3"],
    "textOnDark": "#hexcode",
    "textOnLight": "#hexcode",
    "gradients": ["linear-gradient(135deg, #hex1, #hex2)"] or []
  },
  "spacing": {
    "slideMargins": "5% all sides or 48px",
    "headerTopMargin": "8% or 64px",
    "contentWidth": "90% centered or 1200px max",
    "contentAlignment": "left or center",
    "elementGaps": "24px between sections",
    "paragraphSpacing": "16px between paragraphs",
    "listItemSpacing": "12px between bullet items"
  },
  "contentElements": {
    "bulletStyle": "• or - or → or ✓ or custom",
    "bulletColor": "#hexcode or inherit",
    "bulletIndent": "24px or 1.5em",
    "statNumberStyle": "large bold primary color, 48pt",
    "statLabelStyle": "small caps below, muted color",
    "quoteStyle": "left border accent color, italic text",
    "calloutStyle": "rounded box, light background, border",
    "dividerStyle": "thin line, gradient bar, or none",
    "dividerColor": "#hexcode or accent"
  },
  "visualStyle": {
    "cornerRadius": "8px rounded or 0 sharp or 16px pill",
    "shapeLanguage": "geometric rectangles, organic curves, angular",
    "shadows": "subtle drop shadows, none, or prominent",
    "overlays": "dark gradient overlay on images, none",
    "imageStyle": "rounded corners shadow, full bleed, framed",
    "imageTreatment": "color filter, grayscale, none",
    "iconStyle": "outlined monochrome, filled colorful",
    "iconSize": "24px, 32px, or 48px",
    "chartStyle": "flat design brand colors, 3D, minimal",
    "chartColors": ["#hex1", "#hex2", "#hex3"],
    "backgroundStyle": "solid dark, gradient, light, image-based"
  },
  "layoutPatterns": {
    "twoColumnSplit": "40/60, 50/50, or image-left-text-right",
    "threeColumnGrid": "equal columns with icon headers",
    "heroLayout": "centered text over full image",
    "primaryContentZone": "center-left 60% width",
    "secondaryContentZone": "right sidebar 35% width"
  },
  "patterns": [
    "Recurring pattern 1 (e.g., 'accent color underlines on headers')",
    "Recurring pattern 2 (e.g., 'icons in circles with brand color background')",
    "Recurring pattern 3 (e.g., 'key numbers in large font with label below')"
  ]
}

CRITICAL ANALYSIS INSTRUCTIONS:
1. Look for CONSISTENT patterns across ALL slides
2. Extract EXACT hex color codes - use color picker accuracy
3. Note typography hierarchy precisely (H1 vs H2 vs H3 vs body)
4. Identify bullet/list styles used consistently
5. Observe how numbers/statistics are styled (often large, bold, colored)
6. Note any recurring decorative elements (underlines, shapes, icons)
7. Identify the overall design language (modern, corporate, playful, technical)

Return ONLY valid JSON, no markdown formatting or explanation.`;

/**
 * Prompt for extracting consistency rules (logo, page numbers, headers)
 */
const CONSISTENCY_RULES_PROMPT = `You are analyzing presentation slides to extract CONSISTENCY RULES for logo placement, page numbering, and header positioning.

Look at these slides and determine:

{
  "titleSlide": {
    "hasLogo": true/false,
    "logoPosition": "bottom-left" | "bottom-right" | "top-right" | "top-left" | "none",
    "hasPageNumber": true/false,
    "pageNumberPosition": "Position if present (e.g., 'bottom-right')",
    "headerPosition": "center" | "top-left" | "bottom-center"
  },
  "contentSlide": {
    "headerPosition": "top-left" | "top-center" | "bottom-left",
    "headerStyle": "Description of header styling (e.g., 'Bold white text on dark blue bar at top')",
    "logoPosition": "bottom-left" | "bottom-right" | "top-right" | "none",
    "pageNumberPosition": "bottom-right" | "bottom-center" | "bottom-left" | "none",
    "pageNumberFormat": "Format observed (e.g., '1/10', 'Page 1', just '1')",
    "footerLayout": "Description of footer (e.g., 'Logo left, page number right, thin line separator')"
  }
}

IMPORTANT:
1. Distinguish between TITLE slides (usually first slide, no page number) and CONTENT slides
2. Look for consistent logo placement across content slides
3. Note the exact position of page numbers (corner, edge, etc.)
4. Describe the header bar/area styling precisely

Return ONLY valid JSON, no markdown formatting.`;

/**
 * Converts a Blob to base64 data URL
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
 * Prepares image data for Gemini Vision
 */
async function prepareImageForGemini(imageUrl: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    let imageData: string;

    if (imageUrl.startsWith('data:')) {
      imageData = imageUrl;
    } else {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        console.warn(`Failed to fetch image: ${imageUrl}`);
        return null;
      }
      const blob = await response.blob();
      imageData = await blobToBase64(blob);
    }

    const match = imageData.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
      console.warn(`Invalid image data format: ${imageUrl.substring(0, 50)}...`);
      return null;
    }

    return {
      mimeType: match[1],
      data: match[2],
    };
  } catch (error) {
    console.warn(`Error preparing image: ${error}`);
    return null;
  }
}

/**
 * Extracts brand guidelines from style library images
 */
export async function extractBrandGuidelines(
  styleLibraryImages: string[]
): Promise<BrandGuidelines> {
  console.log(`[DeckStyleExtractor] Extracting brand guidelines from ${styleLibraryImages.length} images...`);

  // Limit to 10 images to avoid token limits
  const imagesToAnalyze = styleLibraryImages.slice(0, 10);

  // Prepare images for Gemini
  const preparedImages = await Promise.all(
    imagesToAnalyze.map(url => prepareImageForGemini(url))
  );

  const validImages = preparedImages.filter((img): img is { mimeType: string; data: string } => img !== null);

  if (validImages.length === 0) {
    console.warn('[DeckStyleExtractor] No valid images to analyze, returning defaults');
    return getDefaultBrandGuidelines();
  }

  try {
    // Build content array with all images + prompt
    const contents: any[] = validImages.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data,
      },
    }));
    contents.push({ text: BRAND_GUIDELINES_PROMPT });

    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents,
    });

    const responseText = result.text;
    // Extract JSON from response - handle markdown blocks and prose
    let jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // If response starts with prose, try to find the JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const guidelines = JSON.parse(jsonText) as BrandGuidelines;
    console.log('[DeckStyleExtractor] Brand guidelines extracted successfully');
    console.log('[DeckStyleExtractor] 📋 BRAND REPORT:', JSON.stringify({
      typography: { headlineFont: guidelines.typography.headlineFont, headlineColor: guidelines.typography.headlineColor },
      colorPalette: { primary: guidelines.colorPalette.primary, secondary: guidelines.colorPalette.secondary, accent: guidelines.colorPalette.accent },
      patterns: guidelines.patterns?.slice(0, 3) || []
    }, null, 2));

    return guidelines;
  } catch (error) {
    console.error('[DeckStyleExtractor] Error extracting brand guidelines:', error);
    return getDefaultBrandGuidelines();
  }
}

/**
 * Extracts consistency rules from style library images
 */
export async function extractConsistencyRules(
  styleLibraryImages: string[]
): Promise<DeckConsistencyRules> {
  console.log(`[DeckStyleExtractor] Extracting consistency rules from ${styleLibraryImages.length} images...`);

  // Use up to 5 images for consistency rules (need variety)
  const imagesToAnalyze = styleLibraryImages.slice(0, 5);

  const preparedImages = await Promise.all(
    imagesToAnalyze.map(url => prepareImageForGemini(url))
  );

  const validImages = preparedImages.filter((img): img is { mimeType: string; data: string } => img !== null);

  if (validImages.length === 0) {
    console.warn('[DeckStyleExtractor] No valid images for consistency rules, returning defaults');
    return getDefaultConsistencyRules();
  }

  try {
    const contents: any[] = validImages.map(img => ({
      inlineData: {
        mimeType: img.mimeType,
        data: img.data,
      },
    }));
    contents.push({ text: CONSISTENCY_RULES_PROMPT });

    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents,
    });

    const responseText = result.text;
    // Extract JSON from response - handle markdown blocks and prose
    let jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // If response starts with prose, try to find the JSON object
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const rules = JSON.parse(jsonText) as DeckConsistencyRules;
    console.log('[DeckStyleExtractor] Consistency rules extracted successfully');
    console.log('[DeckStyleExtractor] 📍 LAYOUT REPORT:', JSON.stringify({
      titleSlide: { logoPosition: rules.titleSlide.logoPosition, hasLogo: rules.titleSlide.hasLogo },
      contentSlide: {
        logoPosition: rules.contentSlide.logoPosition,
        pageNumberPosition: rules.contentSlide.pageNumberPosition,
        pageNumberFormat: rules.contentSlide.pageNumberFormat,
        headerPosition: rules.contentSlide.headerPosition
      }
    }, null, 2));

    return rules;
  } catch (error) {
    console.error('[DeckStyleExtractor] Error extracting consistency rules:', error);
    return getDefaultConsistencyRules();
  }
}

/**
 * Full extraction: brand guidelines + consistency rules + formatted prompt section
 */
export async function extractDeckStyle(
  styleLibrary: StyleLibraryItem[]
): Promise<DeckStyleExtraction> {
  console.log(`[DeckStyleExtractor] Starting full deck style extraction for ${styleLibrary.length} items`);

  const imageUrls = styleLibrary.map(item => item.src);

  // Extract both in parallel
  const [brandGuidelines, consistencyRules] = await Promise.all([
    extractBrandGuidelines(imageUrls),
    extractConsistencyRules(imageUrls),
  ]);

  // Format the prompt section for appending to Imagen prompts
  const promptSection = formatPromptSection(brandGuidelines, consistencyRules);

  return {
    brandGuidelines,
    consistencyRules,
    promptSection,
  };
}

/**
 * Formats the extracted style info into a prompt section
 */
export function formatPromptSection(
  brandGuidelines: BrandGuidelines,
  consistencyRules: DeckConsistencyRules,
  slideNumber?: number,
  totalSlides?: number
): string {
  const slideInfo = slideNumber && totalSlides
    ? `This is slide ${slideNumber} of ${totalSlides}.`
    : '';

  return `
=== BRAND CONSISTENCY GUIDELINES ===

TYPOGRAPHY SYSTEM:
• Headline Font: ${brandGuidelines.typography.headlineFont}, ${brandGuidelines.typography.headlineWeight}
• Body Font: ${brandGuidelines.typography.bodyFont}, ${brandGuidelines.typography.bodyWeight}
• Size Hierarchy:
  - H1 (Main Title): ${brandGuidelines.typography.h1Size}
  - H2 (Section Header): ${brandGuidelines.typography.h2Size}
  - H3 (Subheading): ${brandGuidelines.typography.h3Size}
  - Body: ${brandGuidelines.typography.bodySize}
  - Caption: ${brandGuidelines.typography.captionSize}
• Colors: Headlines ${brandGuidelines.typography.headlineColor}, Body ${brandGuidelines.typography.bodyColor}, Accent ${brandGuidelines.typography.accentTextColor}
• Text Style: ${brandGuidelines.typography.headingCase} case, ${brandGuidelines.typography.textAlignment} aligned
• Line Height: ${brandGuidelines.typography.lineHeight}, Letter Spacing: ${brandGuidelines.typography.letterSpacing}

COLOR PALETTE:
• Primary: ${brandGuidelines.colorPalette.primary}
• Secondary: ${brandGuidelines.colorPalette.secondary}
• Accent: ${brandGuidelines.colorPalette.accent}
• Tertiary: ${brandGuidelines.colorPalette.tertiary}
• Backgrounds: ${brandGuidelines.colorPalette.backgrounds.join(', ')}
• Text on Dark: ${brandGuidelines.colorPalette.textOnDark}, Text on Light: ${brandGuidelines.colorPalette.textOnLight}
${brandGuidelines.colorPalette.gradients.length > 0 ? `• Gradients: ${brandGuidelines.colorPalette.gradients.join(', ')}` : ''}

SPACING & LAYOUT:
• Slide Margins: ${brandGuidelines.spacing.slideMargins}
• Header Top Margin: ${brandGuidelines.spacing.headerTopMargin}
• Content Width: ${brandGuidelines.spacing.contentWidth}, ${brandGuidelines.spacing.contentAlignment} aligned
• Element Gaps: ${brandGuidelines.spacing.elementGaps}
• Paragraph Spacing: ${brandGuidelines.spacing.paragraphSpacing}
• List Item Spacing: ${brandGuidelines.spacing.listItemSpacing}

CONTENT ELEMENTS:
• Bullet Style: "${brandGuidelines.contentElements.bulletStyle}" in ${brandGuidelines.contentElements.bulletColor}
• Bullet Indent: ${brandGuidelines.contentElements.bulletIndent}
• Statistics/Numbers: ${brandGuidelines.contentElements.statNumberStyle}
• Stat Labels: ${brandGuidelines.contentElements.statLabelStyle}
• Quotes: ${brandGuidelines.contentElements.quoteStyle}
• Callouts: ${brandGuidelines.contentElements.calloutStyle}
• Dividers: ${brandGuidelines.contentElements.dividerStyle}, color ${brandGuidelines.contentElements.dividerColor}

VISUAL STYLE:
• Corner Radius: ${brandGuidelines.visualStyle.cornerRadius}
• Shape Language: ${brandGuidelines.visualStyle.shapeLanguage}
• Shadows: ${brandGuidelines.visualStyle.shadows}
• Image Overlays: ${brandGuidelines.visualStyle.overlays}
• Image Style: ${brandGuidelines.visualStyle.imageStyle}
• Icon Style: ${brandGuidelines.visualStyle.iconStyle}, ${brandGuidelines.visualStyle.iconSize}
• Charts: ${brandGuidelines.visualStyle.chartStyle}
• Chart Colors: ${brandGuidelines.visualStyle.chartColors.join(', ')}
• Background Style: ${brandGuidelines.visualStyle.backgroundStyle}

LAYOUT PATTERNS:
• Two-Column: ${brandGuidelines.layoutPatterns.twoColumnSplit}
• Three-Column: ${brandGuidelines.layoutPatterns.threeColumnGrid}
• Hero Layout: ${brandGuidelines.layoutPatterns.heroLayout}
• Primary Content Zone: ${brandGuidelines.layoutPatterns.primaryContentZone}
• Secondary Content Zone: ${brandGuidelines.layoutPatterns.secondaryContentZone}

RECURRING DESIGN PATTERNS:
${brandGuidelines.patterns.map(p => `• ${p}`).join('\n')}

=== SLIDE CONSISTENCY REQUIREMENTS ===

Content Slide Layout:
• Header Position: ${consistencyRules.contentSlide.headerPosition}
• Header Style: ${consistencyRules.contentSlide.headerStyle}
• Logo Position: ${consistencyRules.contentSlide.logoPosition}
• Page Number: ${consistencyRules.contentSlide.pageNumberPosition}, format "${consistencyRules.contentSlide.pageNumberFormat}"
• Footer Layout: ${consistencyRules.contentSlide.footerLayout}

${slideInfo}

CRITICAL: Follow these guidelines PRECISELY to maintain visual consistency across ALL slides in the deck.
`.trim();
}

/**
 * Formats prompt section for title slides specifically
 */
export function formatTitleSlidePromptSection(
  brandGuidelines: BrandGuidelines,
  consistencyRules: DeckConsistencyRules
): string {
  return `
=== TITLE SLIDE BRAND GUIDELINES ===

TYPOGRAPHY:
• Main Title Font: ${brandGuidelines.typography.headlineFont}, ${brandGuidelines.typography.headlineWeight}
• Title Size: ${brandGuidelines.typography.h1Size} (largest on deck)
• Subtitle Font: ${brandGuidelines.typography.bodyFont}, ${brandGuidelines.typography.bodyWeight}
• Title Color: ${brandGuidelines.typography.headlineColor}
• Text Case: ${brandGuidelines.typography.headingCase}
• Alignment: ${brandGuidelines.typography.textAlignment}

COLORS:
• Primary Brand: ${brandGuidelines.colorPalette.primary}
• Secondary: ${brandGuidelines.colorPalette.secondary}
• Accent: ${brandGuidelines.colorPalette.accent}
• Backgrounds: ${brandGuidelines.colorPalette.backgrounds.join(', ')}
${brandGuidelines.colorPalette.gradients.length > 0 ? `• Gradients: ${brandGuidelines.colorPalette.gradients.join(', ')}` : ''}

VISUAL STYLE:
• Background: ${brandGuidelines.visualStyle.backgroundStyle}
• Corner Radius: ${brandGuidelines.visualStyle.cornerRadius}
• Shape Language: ${brandGuidelines.visualStyle.shapeLanguage}
• Shadows: ${brandGuidelines.visualStyle.shadows}

TITLE SLIDE LAYOUT:
• Title Position: ${consistencyRules.titleSlide.headerPosition}
• Logo: ${consistencyRules.titleSlide.hasLogo ? consistencyRules.titleSlide.logoPosition : 'none'}
• Page Number: ${consistencyRules.titleSlide.hasPageNumber ? consistencyRules.titleSlide.pageNumberPosition : 'NONE (title slides do not have page numbers)'}

DESIGN PATTERNS:
${brandGuidelines.patterns.slice(0, 3).map(p => `• ${p}`).join('\n')}

CRITICAL: This is the TITLE SLIDE - it sets the visual tone and brand impression for the entire deck.
Make it impactful, clean, and perfectly aligned with the brand guidelines above.
`.trim();
}

/**
 * Default brand guidelines when extraction fails
 */
function getDefaultBrandGuidelines(): BrandGuidelines {
  return {
    typography: {
      headlineFont: 'Montserrat Bold',
      bodyFont: 'Open Sans Regular',
      h1Size: '48pt',
      h2Size: '36pt',
      h3Size: '24pt',
      bodySize: '16pt',
      captionSize: '12pt',
      headlineColor: '#FFFFFF',
      bodyColor: '#FFFFFF',
      accentTextColor: '#00a8e8',
      headlineWeight: '700 Bold',
      bodyWeight: '400 Regular',
      lineHeight: '1.5',
      letterSpacing: 'normal',
      headingCase: 'sentence',
      textAlignment: 'left',
    },
    colorPalette: {
      primary: '#1e3a5f',
      secondary: '#ff6b35',
      accent: '#00a8e8',
      tertiary: '#2dd4bf',
      backgrounds: ['#1a1a1a', '#2d2d2d', '#ffffff'],
      textOnDark: '#FFFFFF',
      textOnLight: '#1a1a1a',
      gradients: ['linear-gradient(135deg, #1e3a5f, #0d1b2a)'],
    },
    spacing: {
      slideMargins: '5% all sides',
      headerTopMargin: '8%',
      contentWidth: '90% centered',
      contentAlignment: 'left',
      elementGaps: '24px between sections',
      paragraphSpacing: '16px',
      listItemSpacing: '12px',
    },
    contentElements: {
      bulletStyle: '•',
      bulletColor: 'inherit',
      bulletIndent: '24px',
      statNumberStyle: 'large bold primary color, 48pt',
      statLabelStyle: 'small caps below, muted color',
      quoteStyle: 'left border accent color, italic',
      calloutStyle: 'rounded box, light background',
      dividerStyle: 'thin line',
      dividerColor: '#e5e7eb',
    },
    visualStyle: {
      cornerRadius: '8px rounded',
      shapeLanguage: 'geometric rectangles',
      shadows: 'subtle drop shadows',
      overlays: 'dark gradient overlay on images',
      imageStyle: 'rounded corners, subtle shadow',
      imageTreatment: 'none',
      iconStyle: 'outlined, monochrome',
      iconSize: '32px',
      chartStyle: 'flat design, brand colors',
      chartColors: ['#1e3a5f', '#ff6b35', '#00a8e8'],
      backgroundStyle: 'dark gradients',
    },
    layoutPatterns: {
      twoColumnSplit: '50/50',
      threeColumnGrid: 'equal columns with icon headers',
      heroLayout: 'centered text over full image',
      primaryContentZone: 'center-left, 60% width',
      secondaryContentZone: 'right sidebar, 35% width',
    },
    patterns: [
      'Clean, modern design language',
      'High contrast text on backgrounds',
      'Consistent visual hierarchy',
    ],
  };
}

/**
 * Default consistency rules when extraction fails
 */
function getDefaultConsistencyRules(): DeckConsistencyRules {
  return {
    titleSlide: {
      hasLogo: true,
      logoPosition: 'bottom-left',
      hasPageNumber: false,
      pageNumberPosition: 'none',
      headerPosition: 'center',
    },
    contentSlide: {
      headerPosition: 'top-left',
      headerStyle: 'Bold text on colored header bar',
      logoPosition: 'bottom-left',
      pageNumberPosition: 'bottom-right',
      pageNumberFormat: '1/10',
      footerLayout: 'Logo left, page number right',
    },
  };
}
