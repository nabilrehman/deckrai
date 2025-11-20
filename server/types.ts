/**
 * Type Definitions for Deckr ADK Server
 * Centralized types for tools, agent, and session management
 */

// ============================================================================
// SLIDE TYPES
// ============================================================================

export interface SlideInfo {
  id: string;
  name: string;
  src?: string; // base64 data URL or Firebase Storage URL
}

export interface SlideAnalysis {
  slideNumber: number;
  category: 'title' | 'problem' | 'solution' | 'features' | 'benefits' | 'usecases' | 'pricing' | 'cta' | 'other';
  textDensity: 'low' | 'medium' | 'high';
  visualElements: string[];
  colorScheme: string[];
  layout: 'centered' | 'left-aligned' | 'grid' | 'two-column' | 'image-heavy';

  // Quality Assessment
  qualityScore: number; // 1-10 scale
  status: 'excellent' | 'good' | 'needs-improvement' | 'poor';
  issues: Array<{
    type: 'too-much-text' | 'too-little-text' | 'poor-contrast' | 'cluttered' | 'bland' | 'off-brand' | 'unclear-message';
    severity: 'critical' | 'important' | 'minor';
    description: string;
    recommendation: string;
  }>;

  // Actionable Feedback
  strengths: string[]; // What's working well
  improvements: string[]; // Specific improvements to make
  suggestions: string[]; // General suggestions
}

export interface DeckAnalysis {
  slideCount: number;
  slides: SlideAnalysis[];
  overallTheme: string;
  deckFlow: string; // Narrative flow description
  missingSlides?: string[]; // Suggested additions
  recommendations: string[];
}

// ============================================================================
// BRAND & COMPANY TYPES
// ============================================================================

export interface BrandTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontStyle: string;
  visualStyle: string;
  sources: string[];
}

export interface CompanyResearch {
  company: {
    name: string;
    industry: string;
    size: string;
    description: string;
  };
  industryContext: {
    sector: string;
    competitors: string[];
    trends: string[];
  };
  challenges: Array<{
    challenge: string;
    description: string;
    relevance: string;
  }>;
  relevantUseCases: Array<{
    useCase: string;
    description: string;
    applicability: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  decisionMakers: {
    primaryAudience: string;
    concerns: string[];
  };
  customizationRecommendations: string[];
}

export interface CompanyLogo {
  companyName: string;
  logoBase64: string;
  logoUrl?: string;
  format: 'png' | 'jpg' | 'svg';
}

// ============================================================================
// TOOL PARAMETER TYPES
// ============================================================================

export interface AnalyzeSlideParams {
  slideSrc: string; // base64 data URL
  slideNumber: number;
  analysisGoal: 'quick' | 'full' | 'content-only' | 'visual-only';
}

export interface AnalyzeDeckParams {
  slides: { id: string; name: string; src: string }[];
  analysisGoal: 'structure' | 'full' | 'recommendations';
}

export interface ImageInput {
  image: string; // base64 data URL
  label: string; // Description/label for this image (e.g., "Reference slide for style", "Company logo", "Product screenshot")
  purpose: 'reference' | 'logo' | 'custom'; // Image purpose
}

export interface CreateSlideParams {
  detailedPrompt: string;
  deepMode: boolean;
  theme?: BrandTheme | null;
  images?: ImageInput[]; // Optional: Array of images (reference slides, logos, custom images). Can pass any number of images.
}

export interface MinorEditSlideParams {
  prompt: string; // Edit instruction
  base64Image: string; // Original slide image (base64 data URL)
  base64Mask?: string; // Optional: Mask highlighting area to edit (base64 data URL). If provided, only masked region is edited (inpainting). If not provided, entire slide can be edited based on instruction.
  additionalImages?: Array<{ image: string; label: string }>; // Optional: Additional reference images (e.g., logos to add, style references). Can pass any number of images.
  deepMode: boolean;
}

export interface RedesignSlideParams {
  base64Image: string; // Slide to redesign (base64 data URL)
  detailedPrompt: string; // Redesign instruction
  additionalImages?: Array<{ image: string; label: string }>; // Optional: Additional reference images for style inspiration. Can pass any number of images.
  deepMode: boolean;
}

export interface ResearchCompanyParams {
  companyWebsite: string;
  researchGoal: 'usecases' | 'challenges' | 'industry' | 'full';
}

export interface AnalyzeBrandParams {
  companyWebsite: string;
}

export interface FetchCompanyLogoParams {
  companyWebsite: string;
  size: 'small' | 'medium' | 'large';
}

export interface ExtractPainPointsParams {
  notes: string;
}

export interface UploadFileParams {
  file: string; // base64 or blob
  fileType: 'pdf' | 'image' | 'logo';
}

// ============================================================================
// TOOL RESULT DATA TYPES
// ============================================================================

export interface CreateSlideResult {
  images: string[]; // Generated slide variations (base64 data URLs)
  prompts: string[]; // Final prompts used for each variation
}

export interface MinorEditSlideResult {
  images: string[]; // Edited slide variations (base64 data URLs)
  variationPrompts: string[]; // Final prompts used for each variation
}

export interface RedesignSlideResult {
  images: string[]; // Redesigned slide variations (base64 data URLs)
  prompts: string[]; // Final prompts used for each variation
}

// ============================================================================
// SESSION TYPES
// ============================================================================

export interface DeckrSession {
  userId: string;
  currentDeck?: {
    id: string;
    name: string;
    slides: SlideInfo[];
    createdAt: number;
  };
  styleLibrary: Array<{
    id: string;
    name: string;
    src: string;
    type: 'image' | 'pdf';
  }>;
  notes?: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  lastActivity: number;
}

// ============================================================================
// TOOL RESULT TYPES
// ============================================================================

export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    executionTime: number;
    model?: string;
    tokensUsed?: number;
  };
}

// ============================================================================
// REFERENCE MATCHING TOOL TYPES
// ============================================================================

/**
 * Slide specification (compatible with both designer modes)
 */
export interface SlideSpecification {
  slideNumber: number;
  slideType?: string;
  title?: string;
  headline: string;
  subhead?: string;
  content?: string;
  visualDescription?: string;
  dataVisualization?: string;
  brandContext?: string;
}

/**
 * Style library item (reference slide)
 */
export interface StyleLibraryItem {
  name: string;
  src: string; // Firebase Storage URL or data URL
  id?: string;
  createdAt?: number;
}

/**
 * Parameters for matchSlidesToReferences tool
 */
export interface MatchReferencesParams {
  slideSpecifications: SlideSpecification[];
  styleLibraryItems: StyleLibraryItem[];
}

/**
 * Reference match result with statistics
 */
export interface MatchReferencesResult {
  matches: Array<{
    slideNumber: number;
    referenceName: string;
    referenceSrc: string;
    matchScore: number;
    matchReason: string;
    category?: string;
    blueprint?: any; // DeepDesignBlueprint - full blueprint from deep analyzer
  }>;
  statistics: {
    totalSlides: number;
    totalReferences: number;
    matchedSlides: number;
    unmatchedSlides: number[];
    averageMatchScore: number;
    byCategory: { [category: string]: number };
    byReference: { [referenceName: string]: number };
  };
}

// ============================================================================
// AGENT TYPES
// ============================================================================

export interface AgentResponse {
  success: boolean;
  response: string;
  sessionState?: DeckrSession;
  error?: string;
}
