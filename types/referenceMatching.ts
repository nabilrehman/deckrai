/**
 * Type definitions for Enterprise Reference Matching System
 *
 * This system provides intelligent slide-to-reference matching with deep
 * design blueprint extraction and strategic generation decisions.
 */

// ============================================================================
// REFERENCE MATCHING
// ============================================================================

/**
 * Result of matching a slide specification to a reference image
 */
export interface ReferenceMatch {
  /** Slide number (1-indexed) */
  slideNumber: number;

  /** Firebase Storage URL or data URL of the matched reference */
  referenceSrc: string;

  /** User-provided name of the reference file */
  referenceName: string;

  /** Confidence score 0-100 indicating match quality */
  matchScore: number;

  /** Detailed explanation of why this reference was selected */
  matchReason: string;

  /** Category of the slide (e.g., "title", "content", "data-viz", "closing") */
  category?: string;
}

// ============================================================================
// DEEP DESIGN BLUEPRINT
// ============================================================================

/**
 * Background design analysis
 */
export interface BackgroundDesign {
  /** Type of background */
  type: 'solid' | 'gradient' | 'image' | 'pattern' | 'hybrid';

  /** Hex color codes used in the background */
  colors: string[];

  /** Detailed description of the background */
  description: string;

  /** Technical description of how to recreate it */
  technique: string;

  /** Complexity rating 1-5 (5 = very complex, better to preserve) */
  complexity?: number;
}

/**
 * Individual positioned element within a layout
 */
export interface LayoutElement {
  /** Type of element */
  type: 'headline' | 'body' | 'image' | 'icon' | 'chart' | 'logo' | 'shape' | 'other';

  /** Position as percentage or pixels */
  position: {
    x: string;
    y: string;
    width: string;
    height: string;
  };

  /** Size description */
  size: string;

  /** Purpose of this element */
  purpose: string;

  /** Alignment (left, center, right, justify) */
  alignment?: string;
}

/**
 * Content layout structure
 */
export interface ContentLayout {
  /** High-level structure description */
  structure: string;

  /** Grid system (e.g., "12-column", "golden ratio", "thirds") */
  gridSystem: string;

  /** Margins in pixels or percentages */
  margins: {
    top: string;
    bottom: string;
    left: string;
    right: string;
  };

  /** Key positioned elements */
  keyElements: LayoutElement[];

  /** Percentage of whitespace (helps determine density) */
  whitespacePercentage?: number;
}

/**
 * Visual hierarchy analysis
 */
export interface VisualHierarchy {
  /** Primary focal point description */
  primaryFocus: string;

  /** Secondary elements that support the primary */
  secondaryElements: string[];

  /** Tertiary supporting elements */
  tertiaryElements: string[];

  /** How the eye flows through the slide (Z-pattern, F-pattern, etc.) */
  flowPattern: string;

  /** Contrast ratios for accessibility */
  contrastRatios?: {
    primaryToBackground: number;
    secondaryToBackground: number;
  };
}

/**
 * Typography treatment for a specific text type
 */
export interface TypographyTreatment {
  /** Font family name */
  font: string;

  /** Font size (in pt or px) */
  size: string;

  /** Hex color code */
  color: string;

  /** Line height / letter spacing */
  spacing: string;

  /** Position on slide */
  position: string;

  /** Special treatments (bold, italic, shadow, outline, etc.) */
  treatment: string;

  /** Font weight (100-900) */
  weight?: number;

  /** Text alignment */
  alignment?: string;
}

/**
 * Typography system
 */
export interface Typography {
  /** Headline/title typography */
  headline: TypographyTreatment;

  /** Body text typography */
  body: TypographyTreatment;

  /** Code/monospace typography (for technical slides) */
  code?: TypographyTreatment;

  /** Caption/footnote typography */
  caption?: TypographyTreatment;
}

/**
 * Spacing and rhythm
 */
export interface Spacing {
  /** Vertical spacing between elements */
  verticalRhythm: string;

  /** Horizontal padding between elements */
  horizontalPadding: string;

  /** Gaps between grouped elements */
  elementGaps: string;

  /** Baseline grid size (if applicable) */
  baselineGrid?: string;
}

/**
 * Visual elements (non-text)
 */
export interface VisualElements {
  /** Icon style and usage */
  icons: string;

  /** Shapes used in the design */
  shapes: string;

  /** Image treatment (rounded corners, shadows, etc.) */
  images: string;

  /** Chart/data visualization style */
  charts: string;

  /** Decorative elements */
  decorative?: string;
}

/**
 * Brand elements
 */
export interface BrandElements {
  /** Logo position and size */
  logo: string;

  /** Brand colors used (hex codes) */
  colors: string[];

  /** Brand patterns or textures */
  patterns: string;

  /** Brand-specific design motifs */
  motifs?: string;
}

/**
 * Generation strategy details
 */
export interface GenerationStrategyDetails {
  /** Approach to take */
  approach: 'recreate' | 'build-on-top';

  /** Detailed reasoning for this choice */
  reasoning: string;

  /** Specific multi-paragraph instructions for Imagen */
  specificInstructions: string;

  /** Confidence in this strategy (0-100) */
  confidence?: number;
}

/**
 * Complete deep design blueprint extracted from a reference slide
 */
export interface DeepDesignBlueprint {
  /** Background analysis */
  background: BackgroundDesign;

  /** Content layout structure */
  contentLayout: ContentLayout;

  /** Visual hierarchy */
  visualHierarchy: VisualHierarchy;

  /** Typography system */
  typography: Typography;

  /** Spacing and rhythm */
  spacing: Spacing;

  /** Visual elements */
  visualElements: VisualElements;

  /** Brand elements */
  brandElements: BrandElements;

  /** Generation strategy */
  generationStrategy: GenerationStrategyDetails;
}

// ============================================================================
// GENERATION STRATEGY DECISION
// ============================================================================

/**
 * Type of generation strategy
 *
 * INPUT-MODIFY: Use reference as base image, apply modifications via inpainting
 * FULL-RECREATE: Generate from scratch using blueprint as detailed instructions
 */
export type GenerationStrategy = 'input-modify' | 'full-recreate';

/**
 * Region to mask for inpainting (INPUT-MODIFY mode)
 */
export interface MaskRegion {
  /** Type of content in this region */
  type: 'text' | 'image' | 'chart' | 'icon' | 'shape' | 'background';

  /** Position and size (normalized 0-1 or pixel values) */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  /** What needs to change in this region */
  changeDescription: string;

  /** Priority (higher = more important to change) */
  priority: number;
}

/**
 * Elements to preserve in INPUT-MODIFY mode
 */
export interface PreservedElement {
  /** Type of element */
  type: string;

  /** Why it should be preserved */
  reason: string;

  /** Position (optional) */
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Elements to change in INPUT-MODIFY mode
 */
export interface ChangedElement {
  /** Type of element */
  type: string;

  /** What change is needed */
  changeDescription: string;

  /** How complex is this change (1-5) */
  complexity: number;
}

/**
 * Strategy decision result
 */
export interface StrategyDecision {
  /** Chosen strategy */
  strategy: GenerationStrategy;

  /** Confidence score 0-100 */
  confidence: number;

  /** Detailed reasoning for this decision */
  reasoning: string;

  /** Modification complexity (only for INPUT-MODIFY) */
  modificationComplexity?: 'simple' | 'moderate' | 'complex';

  /** Regions to mask for inpainting (only for INPUT-MODIFY) */
  maskRegions?: MaskRegion[];

  /** Elements to preserve (only for INPUT-MODIFY) */
  preservedElements?: PreservedElement[];

  /** Elements to change (only for INPUT-MODIFY) */
  changedElements?: ChangedElement[];

  /** Layout compatibility score 0-100 */
  layoutCompatibility?: number;

  /** Visual complexity of reference 0-100 (higher = more complex) */
  visualComplexity?: number;

  /** Content divergence 0-100 (higher = more different from reference) */
  contentDivergence?: number;
}

// ============================================================================
// COMBINED RESULTS
// ============================================================================

/**
 * Complete matching result for a slide including match and blueprint
 */
export interface MatchWithBlueprint {
  /** The reference match */
  match: ReferenceMatch;

  /** Deep design blueprint extracted from the reference */
  blueprint: DeepDesignBlueprint;

  /** Strategy decision for generation */
  strategy?: StrategyDecision;
}

/**
 * Summary of all available references for Master Agent context
 */
export interface ReferenceSummary {
  /** Total number of references */
  totalReferences: number;

  /** References by category */
  byCategory: {
    [category: string]: number;
  };

  /** Brief description of available references */
  description: string;

  /** Reference image URLs */
  referenceUrls?: string[];
}
