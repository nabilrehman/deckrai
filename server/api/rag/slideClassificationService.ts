/**
 * Slide Classification Service
 *
 * Uses Gemini Vision to classify slides with rich metadata:
 * - Sales stage, persona, content type
 * - Visual elements, layout, style
 * - Content hints (metrics, logos, screenshots, etc.)
 *
 * This metadata enables intelligent filtering in RAG search
 * and powers the ADK Slide Selector Agent.
 */

import { GoogleGenAI } from '@google/genai';

// Configuration
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('[SlideClassification] Warning: GEMINI_API_KEY not set');
}

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY || '' });

/**
 * Slide classification schema
 */
export interface SlideClassification {
  // Sales/business context
  salesStage: 'outreach' | 'qualification' | 'consideration' | 'decision' | 'post-sale' | 'general';
  persona: 'c-suite' | 'technical' | 'business' | 'practitioner' | 'general';
  contentType: 'title' | 'problem' | 'solution' | 'features' | 'benefits' | 'proof' | 'comparison' | 'pricing' | 'technical' | 'team' | 'cta' | 'agenda' | 'divider' | 'content';

  // Visual characteristics
  visualElements: Array<'screenshots' | 'charts' | 'icons' | 'photos' | 'diagrams' | 'illustrations' | 'tables' | 'text-heavy' | 'minimal-text'>;
  layout: 'title-centered' | 'title-left' | 'split-50-50' | 'split-30-70' | 'split-70-30' | 'grid-2x2' | 'grid-3-col' | 'grid-4-col' | 'timeline-horizontal' | 'timeline-vertical' | 'comparison' | 'full-bleed' | 'content-centered' | 'content-left';
  visualStyle: 'minimal' | 'corporate' | 'modern' | 'bold' | 'creative' | 'data-heavy' | 'professional';

  // Content hints (boolean flags for fast filtering)
  contentHints: {
    hasMetrics: boolean;      // Numbers, percentages, KPIs
    hasQuote: boolean;        // Testimonial or quote
    hasLogo: boolean;         // Company/customer logos
    hasProductUI: boolean;    // Screenshots of product/app
    hasPeople: boolean;       // Photos of people
    hasProcess: boolean;      // Step-by-step or flow
    hasBullets: boolean;      // Bullet point list
    hasCallToAction: boolean; // CTA button or next steps
  };

  // Quality indicators
  confidence: number;         // 0-1 confidence in classification
  dominantColors: string[];   // Top 3 hex colors
  textDensity: 'low' | 'medium' | 'high';

  // Optional extracted text (for search)
  extractedTitle?: string;
  extractedKeywords?: string[];
}

/**
 * Classification prompt for Gemini Vision
 */
const CLASSIFICATION_PROMPT = `Analyze this presentation slide image and classify it according to the following schema.

CLASSIFICATION CATEGORIES:

1. SALES STAGE (what stage of sales cycle is this slide for?):
   - outreach: Cold outreach, awareness
   - qualification: Discovery, needs assessment
   - consideration: Evaluation, comparison, ROI
   - decision: Proposal, pricing, close
   - post-sale: Onboarding, expansion, renewal
   - general: Not specific to any stage

2. PERSONA (who is the target audience?):
   - c-suite: CEO, CFO, CTO - executive level
   - technical: Engineers, developers, IT
   - business: Sales, marketing, ops managers
   - practitioner: End users, individual contributors
   - general: Mixed or general audience

3. CONTENT TYPE (what is the purpose of this slide?):
   - title: Title/cover slide
   - problem: Pain points, challenges
   - solution: How we solve it
   - features: Product capabilities
   - benefits: Value proposition, outcomes
   - proof: Case studies, testimonials, stats
   - comparison: Us vs them, before/after
   - pricing: Plans, packages
   - technical: Architecture, integrations
   - team: People, org structure
   - cta: Call to action, next steps
   - agenda: Table of contents, outline
   - divider: Section divider
   - content: General content slide

4. VISUAL ELEMENTS (what visual elements are present?):
   - screenshots: Product UI, app screenshots
   - charts: Bar, line, pie charts
   - icons: Icon-based content
   - photos: Photography of people/places
   - diagrams: Architecture, flowcharts
   - illustrations: Custom artwork
   - tables: Data tables
   - text-heavy: Mostly text
   - minimal-text: Few words, visual focus

5. LAYOUT (how is content organized?):
   - title-centered: Big centered headline
   - title-left: Left-aligned title
   - split-50-50: Two equal columns
   - split-30-70: Sidebar + main content
   - split-70-30: Main content + sidebar
   - grid-2x2: Four quadrants
   - grid-3-col: Three columns
   - grid-4-col: Four columns
   - timeline-horizontal: Horizontal process/timeline
   - timeline-vertical: Vertical process/steps
   - comparison: Side-by-side comparison
   - full-bleed: Edge-to-edge image/visual
   - content-centered: Centered content block
   - content-left: Left-aligned content

6. VISUAL STYLE:
   - minimal: Clean, lots of whitespace
   - corporate: Traditional professional
   - modern: Contemporary, tech-forward
   - bold: High contrast, impactful
   - creative: Artistic, unique
   - data-heavy: Dense information
   - professional: Standard business style

7. CONTENT HINTS (true/false for each):
   - hasMetrics: Contains numbers, percentages, KPIs
   - hasQuote: Contains testimonial or quote
   - hasLogo: Contains company/customer logos
   - hasProductUI: Contains product screenshots
   - hasPeople: Contains photos of people
   - hasProcess: Shows step-by-step or flow
   - hasBullets: Contains bullet point list
   - hasCallToAction: Has CTA button or next steps text

8. OTHER:
   - dominantColors: Top 3 hex colors from the slide
   - textDensity: low (few words), medium, high (lots of text)
   - extractedTitle: The main headline/title if visible
   - extractedKeywords: 3-5 key topic words

Return ONLY valid JSON in this exact format:
{
  "salesStage": "consideration",
  "persona": "c-suite",
  "contentType": "features",
  "visualElements": ["icons", "minimal-text"],
  "layout": "grid-3-col",
  "visualStyle": "modern",
  "contentHints": {
    "hasMetrics": false,
    "hasQuote": false,
    "hasLogo": true,
    "hasProductUI": false,
    "hasPeople": false,
    "hasProcess": false,
    "hasBullets": false,
    "hasCallToAction": false
  },
  "confidence": 0.85,
  "dominantColors": ["#1A73E8", "#FFFFFF", "#202124"],
  "textDensity": "low",
  "extractedTitle": "Key Features",
  "extractedKeywords": ["features", "product", "capabilities"]
}`;

/**
 * Classify a single slide using Gemini Vision
 */
export async function classifySlide(imageUrl: string): Promise<SlideClassification> {
  try {
    // Prepare image data
    let mimeType: string;
    let base64Data: string;

    if (imageUrl.startsWith('data:')) {
      // Already base64
      const match = imageUrl.match(/^data:(image\/\w+);base64,(.*)$/);
      if (!match) {
        throw new Error('Invalid base64 image data');
      }
      mimeType = match[1];
      base64Data = match[2];
    } else {
      // Fetch and convert to base64
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      base64Data = Buffer.from(arrayBuffer).toString('base64');
      mimeType = response.headers.get('content-type') || 'image/png';
    }

    // Call Gemini Vision using new API
    const result = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        { text: CLASSIFICATION_PROMPT },
      ],
    });

    const responseText = result.text;

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const classification = JSON.parse(jsonMatch[0]) as SlideClassification;

    // Validate and set defaults for any missing fields
    return validateClassification(classification);
  } catch (error) {
    console.error('[SlideClassification] Error classifying slide:', error);
    // Return default classification on error
    return getDefaultClassification();
  }
}

/**
 * Classify multiple slides in batch
 */
export async function classifySlides(imageUrls: string[]): Promise<SlideClassification[]> {
  // Process in batches of 3 to avoid rate limits
  const BATCH_SIZE = 3;
  const results: SlideClassification[] = [];

  console.log(`[SlideClassification] Classifying ${imageUrls.length} slides...`);

  for (let i = 0; i < imageUrls.length; i += BATCH_SIZE) {
    const batch = imageUrls.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(url => classifySlide(url))
    );
    results.push(...batchResults);

    // Progress logging
    console.log(`[SlideClassification] Progress: ${Math.min(i + BATCH_SIZE, imageUrls.length)}/${imageUrls.length}`);

    // Small delay between batches
    if (i + BATCH_SIZE < imageUrls.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`[SlideClassification] Classified ${results.length} slides`);
  return results;
}

/**
 * Validate classification and fill in defaults
 */
function validateClassification(classification: Partial<SlideClassification>): SlideClassification {
  return {
    salesStage: classification.salesStage || 'general',
    persona: classification.persona || 'general',
    contentType: classification.contentType || 'content',
    visualElements: classification.visualElements || ['text-heavy'],
    layout: classification.layout || 'content-left',
    visualStyle: classification.visualStyle || 'professional',
    contentHints: {
      hasMetrics: classification.contentHints?.hasMetrics || false,
      hasQuote: classification.contentHints?.hasQuote || false,
      hasLogo: classification.contentHints?.hasLogo || false,
      hasProductUI: classification.contentHints?.hasProductUI || false,
      hasPeople: classification.contentHints?.hasPeople || false,
      hasProcess: classification.contentHints?.hasProcess || false,
      hasBullets: classification.contentHints?.hasBullets || false,
      hasCallToAction: classification.contentHints?.hasCallToAction || false,
    },
    confidence: classification.confidence || 0.5,
    dominantColors: classification.dominantColors || ['#000000', '#FFFFFF', '#808080'],
    textDensity: classification.textDensity || 'medium',
    extractedTitle: classification.extractedTitle,
    extractedKeywords: classification.extractedKeywords || [],
  };
}

/**
 * Get default classification for error cases
 */
function getDefaultClassification(): SlideClassification {
  return {
    salesStage: 'general',
    persona: 'general',
    contentType: 'content',
    visualElements: ['text-heavy'],
    layout: 'content-left',
    visualStyle: 'professional',
    contentHints: {
      hasMetrics: false,
      hasQuote: false,
      hasLogo: false,
      hasProductUI: false,
      hasPeople: false,
      hasProcess: false,
      hasBullets: false,
      hasCallToAction: false,
    },
    confidence: 0,
    dominantColors: ['#000000', '#FFFFFF', '#808080'],
    textDensity: 'medium',
    extractedKeywords: [],
  };
}

/**
 * Get classification summary for logging
 */
export function getClassificationSummary(classification: SlideClassification): string {
  return `[${classification.contentType}/${classification.layout}] ${classification.visualStyle} | persona: ${classification.persona} | elements: ${classification.visualElements.join(', ')}`;
}
