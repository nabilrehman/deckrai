

export interface BoundingBox {
  x: number; // top-left x, percentage
  y: number; // top-left y, percentage
  width: number;
  height: number;
}

export interface Slide {
  id: string; // Unique ID
  originalSrc: string; // Original image source URL, also the first item in history
  history: string[]; // History of image sources, the last item is the current version
  name: string;
  isInStyleLibrary?: boolean; // Flag to indicate if the slide is in the user's style library
  // Holds AI-generated variations and the prompt that created them for review/regeneration.
  pendingPersonalization?: {
    taskPrompt: string; // The original high-level prompt for this task, used for regeneration
    variations: string[]; // The base64 image strings
    variationPrompts: string[]; // The specific prompts used for each variation
  };
  // Cached text regions from Firestore for instant Edit Mode (from geminiService TextRegion interface)
  textRegions?: Array<{
    text: string;
    boundingBox: {
      xPercent: number;
      yPercent: number;
      widthPercent: number;
      heightPercent: number;
    };
  }>;
}

export interface StyleLibraryItem {
  id: string; // Corresponds to the slide ID
  src: string; // The image src of the slide when it was added
  name: string;
}

// Context for the "Apply to All" feature. Captures the entire successful workflow.
export interface LastSuccessfulEditContext {
  workflow: 'Generate' | 'Personalize' | 'Inpaint' | 'Remake' | 'Create New Slide';
  userIntentPrompt: string; // The user's original, high-level prompt.
  model: string;
  deepMode: boolean;
  styleReference?: StyleLibraryItem; // Crucial for replicating "Remake" workflows.
}


export interface DebugLog {
    title: string;
    content: string;
}

// Represents the entire state of a single AI generation run for the debugger.
export interface DebugSession {
    id: string;
    timestamp: string;
    status: 'Success' | 'Failed';
    workflow: 'Generate' | 'Personalize' | 'Inpaint' | 'Remake' | 'Deck Task' | 'Create New Slide';
    initialPrompt: string;
    initialImage?: string;
    finalImages: string[];
    logs: DebugLog[];
    error?: string;
    model: string;
    deepMode: boolean;
    styleReferenceImage?: string; // The image of the reference slide chosen by the Style Scout
}


export interface Template {
  id: string;
  name: string;
  previewSrc: string;
  pages: {
    name: string;
    src: string;
  }[];
}


// Deck AI Task Planning Types
export type EditSlideTask = {
  type: 'EDIT_SLIDE';
  slideId: string;
  slideName: string;
  detailed_prompt: string;
};

export type AddSlideTask = {
  type: 'ADD_SLIDE';
  newSlideName: string;
  insertAfterSlideId: string; // The ID of the slide after which this new slide should be inserted
  detailed_prompt: string;
};

export type DeckAiTask = EditSlideTask | AddSlideTask;

export interface DeckAiExecutionPlan {
    thought_process: string;
    tasks: DeckAiTask[];
}

export interface CompanyTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontStyle: string;
  visualStyle: string;
}


// ACTION TYPES for Personalization
export interface TextReplacementAction {
    type: 'TEXT_REPLACEMENT';
    originalText: string;
    newText: string;
    boundingBox: BoundingBox;
}

export interface ImageReplacementAction {
    type: 'IMAGE_REPLACEMENT';
    areaToReplace: string; // A description of the visual element to replace
    replacementPrompt: string; // A prompt for what to replace it with
    boundingBox: BoundingBox;
}

export type PersonalizationAction = TextReplacementAction | ImageReplacementAction;


// USER MANAGEMENT & PRICING TYPES
export type UserPlan = 'trial' | 'starter' | 'business' | 'enterprise';

// ============================================================================
// SUBSCRIPTION-BASED USAGE TRACKING
// ============================================================================

/**
 * Trial information for new users
 */
export interface TrialInfo {
  isActive: boolean;
  startDate: number; // Timestamp when trial started
  endDate: number; // Timestamp when trial expires
  daysRemaining: number; // Calculated field (can be derived from endDate)
}

// ============================================================================
// USER PROFILE TYPES
// ============================================================================

export interface UserUsage {
  slidesThisMonth: number;
  decksThisMonth: number;
  monthStart: number; // timestamp
  lastUpdated: number; // timestamp
}

export interface UserSubscription {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodEnd?: number; // timestamp
  cancelAtPeriodEnd?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  plan: UserPlan;
  trial?: TrialInfo; // Trial information (only for trial users)
  usage: UserUsage; // Slide/deck usage tracking
  subscription: UserSubscription;
  createdAt: number; // timestamp
  lastLoginAt: number; // timestamp
}

export interface SavedDeck {
  id: string;
  userId: string;
  name: string;
  slides: Slide[];
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  slideCount: number;
  thumbnailUrl?: string; // First slide thumbnail
}

// CHAT STORAGE TYPES
export interface ThinkingStep {
  id: string;
  title: string;
  content?: string;
  status: 'pending' | 'active' | 'completed';
  timestamp?: number;
  type?: 'thinking' | 'generating' | 'processing';
}

export interface StoredChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  // For assistant messages with slides (store Storage URLs, not base64)
  slideImages?: string[]; // Firebase Storage URLs
  slideData?: {
    id: string;
    name: string;
    storageUrl: string; // Firebase Storage URL
  }[];
  // For assistant messages with thinking steps
  thinkingSteps?: ThinkingStep[];
  // Generation metadata
  generationMetadata?: {
    company?: string;
    audience?: string;
    style?: string;
    slideCount?: number;
    duration?: string;
  };
}

export interface SavedChat {
  id: string;
  userId: string;
  title: string; // Auto-generated from first user message
  createdAt: number;
  updatedAt: number;
  lastMessage: string; // Preview text for chat list
  messageCount: number;
  // Link to generated deck (if any)
  generatedDeckId?: string;
}

// ============================================================================
// LANDING PAGE DEMO TYPES (from visualizer)
// ============================================================================

export enum AppState {
  IDLE = 'IDLE',
  TYPING_PROMPT = 'TYPING_PROMPT',
  ANALYZING_REQUEST = 'ANALYZING_REQUEST',
  REVIEWING_PLAN = 'REVIEWING_PLAN',
  EXECUTING_WORKFLOW = 'EXECUTING_WORKFLOW',
  COMPLETE = 'COMPLETE'
}

export enum WorkflowStep {
  RESEARCH = 'RESEARCH',
  ASSETS = 'ASSETS',
  CONTEXT = 'CONTEXT', // Scanning Org Library
  STRUCTURE = 'STRUCTURE',
  GENERATION = 'GENERATION'
}

export type ViewState = 'HOME' | 'DASHBOARD';

export interface BrandProfile {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  logoStyle: 'modern' | 'classic' | 'tech';
  keywords: string[];
}

export interface SlideContent {
  title: string;
  type: 'title' | 'architecture' | 'code' | 'bullet_points' | 'pricing' | 'impact' | 'security';
  content: string[];
  codeSnippet?: string;
  diagramNodes?: string[];
}

export interface DeckData {
  topic: string;
  targetAudience: string;
  slides: SlideContent[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'process';
}

// ============================================================================
// DEMO SHOTS VIDEO TYPES
// ============================================================================

/**
 * Represents an uploaded or linked video asset for demo analysis
 */
export interface VideoAsset {
  id: string;
  name: string;
  type: 'file' | 'url';
  mimeType: string;
  size?: number; // in bytes
  source: string; // base64 data URL for files, URL string for URLs
  duration?: number; // in seconds
  thumbnail?: string; // base64 thumbnail
}

/**
 * Represents a feature identified from a demo video
 */
export interface DemoFeature {
  timestamp: string; // "MM:SS" format
  timestampSeconds: number;
  featureName: string;
  description: string;
  problemSolved: string;
  sentiment: 'liked' | 'neutral' | 'dismissed';
  screenshot?: string; // base64 image extracted from video
}

/**
 * Result of analyzing a demo video
 */
export interface VideoAnalysisResult {
  features: DemoFeature[];
  summary: string;
  totalDuration: string;
  error?: string;
}
