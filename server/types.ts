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

export interface CreateSlideParams {
  prompt: string;
  referenceSrc?: string; // Optional reference slide
  theme?: BrandTheme;
  logoSrc?: string;
  customImages?: string[];
}

export interface MinorEditSlideParams {
  slideSrc: string;
  editPrompt: string;
  maskSrc?: string; // For inpainting
}

export interface RedesignSlideParams {
  slideSrc: string;
  redesignPrompt: string;
  referenceSrc?: string;
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
// AGENT TYPES
// ============================================================================

export interface AgentResponse {
  success: boolean;
  response: string;
  sessionState?: DeckrSession;
  error?: string;
}
