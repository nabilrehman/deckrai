/**
 * Designer Mode Types
 * TypeScript types for the parallel agent slide designer system
 */

// Input parameters for designer generation
export interface DesignerGenerationInput {
  company: string;
  content: string;
  audience: string;
  goal: string;
  slideCount: number;
}

// Brand color definition
export interface BrandColor {
  name: string;
  hex: string;
  rgb: { r: number; g: number; b: number };
  usage: string;
}

// Typography definition
export interface BrandTypography {
  primaryFont: string;
  fallbackFont?: string;
  weights: string[];
  source: string;
}

// Brand research output
export interface BrandResearch {
  sources: string[];
  colors: BrandColor[];
  typography: BrandTypography;
  personality: string;
  logo?: {
    usage: string;
    variations: string[];
    clearSpace: string;
  };
}

// Slide architecture entry
export interface SlideArchitecture {
  slideNumber: number;
  title: string;
  purpose: string;
  infoDensity: 'Low' | 'Medium' | 'High';
  visualApproach: 'Impact' | 'Comparison' | 'Process' | 'Data' | 'Story';
  hierarchyType: string;
}

// Visual hierarchy for a slide
export interface VisualHierarchy {
  primary: { percentage: number; description: string };
  secondary: { percentage: number; description: string };
  tertiary: { percentage: number; description: string };
}

// Complete slide specification
export interface SlideSpecification {
  slideNumber: number;
  title: string;
  headline: string;
  subhead?: string;
  content?: string; // Body text, bullet points, scenarios, or any content for the slide
  visualHierarchy: VisualHierarchy;
  infoDensity: 'Low' | 'Medium' | 'High';
  visualApproach: string;
  eyeFlowPattern: string;
  backgroundColor: string;
  textColors: {
    headline: string;
    body: string;
    accent?: string;
  };
  typography: {
    headline: { font: string; size: string; weight: string; color: string };
    subhead?: { font: string; size: string; weight: string; color: string };
    body?: { font: string; size: string; weight: string; color: string };
  };
  spacing?: {
    margins: string;
    whitespace: string;
  };
  designRationale?: string;
}

// Design system
export interface DesignSystem {
  colorPalette: {
    backgrounds: string[];
    text: string[];
    primary: string;
    accents: string[];
  };
  typographyHierarchy: {
    display?: { font: string; size: string; weight: string; usage: string };
    h1: { font: string; size: string; weight: string; usage: string };
    h2: { font: string; size: string; weight: string; usage: string };
    h3?: { font: string; size: string; weight: string; usage: string };
    body: { font: string; size: string; weight: string; usage: string };
    captions?: { font: string; size: string; weight: string; usage: string };
  };
  iconSystem?: {
    style: string;
    strokeWeight: string;
    colors: string[];
  };
}

// Complete designer outline output
export interface DesignerOutline {
  executiveSummary?: string;
  brandResearch: BrandResearch;
  deckArchitecture: SlideArchitecture[];
  designSystem: DesignSystem;
  slideSpecifications: SlideSpecification[];
  productionNotes?: string;
}

// Generation progress tracking
export interface DesignerGenerationProgress {
  phase: 'planning' | 'parallel' | 'aggregating' | 'complete' | 'error';
  message: string;
  currentSlide?: number;
  totalSlides?: number;
  timeElapsed?: number;
}

// Result from Python orchestrator
export interface PythonOrchestratorResult {
  success: boolean;
  outline?: DesignerOutline;
  rawOutput?: string;
  metadata?: {
    masterPlanningTime: number;
    totalSlides: number;
    successfulSlides: number;
    failedSlides: number;
    totalGenerationTime: number;
    parallelSpeedup: string;
  };
  error?: string;
}

// Slide generation task for batching
export interface SlideGenerationTask {
  slideNumber: number;
  spec: SlideSpecification;
  prompt: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
}
