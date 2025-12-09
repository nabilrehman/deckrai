

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

// ============================================================================
// DSR 1.0 - WORKSPACE & WIDGET ENGINE TYPES
// ============================================================================

export type WorkspaceStatus = 'draft' | 'published' | 'archived';
export type BlockType = 'deck' | 'video' | 'pdf' | 'embed' | 'map' | 'text';

export interface BaseBlock {
  id: string; // Unique block ID
  type: BlockType;
  title?: string; // Optional header for the block
  isVisible: boolean;
}

// 1. Existing Deck Widget
export interface DeckBlock extends BaseBlock {
  type: 'deck';
  deckId: string; // Reference to the saved deck
  startSlide?: number; // Optional starting slide
}

// 2. Video Widget (Loom/Mux)
export interface VideoBlock extends BaseBlock {
  type: 'video';
  source: 'url' | 'upload';
  url: string; // Youtube/Loom/Mux URL
  thumbnailUrl?: string;
}

// 3. PDF/Document Widget
export interface PDFBlock extends BaseBlock {
  type: 'pdf';
  storageUrl: string; // Firebase Storage URL
  fileName: string;
  allowDownload: boolean; // Security requirement
}

// 4. Universal Embed (Figma, Airtable)
export interface EmbedBlock extends BaseBlock {
  type: 'embed';
  url: string;
  provider: 'figma' | 'airtable' | 'pandadoc' | 'google_slides' | 'other';
  height?: number; // Custom height for iframe
}

// 5. Mutual Action Plan (MAP)
export interface MAPTask {
  id: string;
  title: string;
  assignedTo: 'buyer' | 'seller'; // Role-based assignment
  assigneeEmail?: string; // Specific email (optional)
  dueDate?: number;
  status: 'pending' | 'in_progress' | 'completed';
  completedBy?: string; // Email of completer
  completedAt?: number;
}

export interface MAPBlock extends BaseBlock {
  type: 'map';
  tasks: MAPTask[];
}

// 6. Rich Text Block
export interface TextBlock extends BaseBlock {
  type: 'text';
  content: string; // HTML or Markdown
}

export type WorkspaceBlock = DeckBlock | VideoBlock | PDFBlock | EmbedBlock | MAPBlock | TextBlock;

export interface Workspace {
  id: string; // "ws_..."
  ownerId: string; // Rep's UID
  templateId?: string; // If cloned from a master template
  title: string; // e.g., "Acme Corp Deal Room"
  slug?: string; // For friendly URLs (e.g., /room/acme-corp) -> maps to ID (optional for MVP)

  // Customization
  branding?: {
    logoUrl?: string; // Viewer's logo (CRM injected)
    primaryColor?: string;
    backgroundImageUrl?: string;
  };

  // Layout Engine
  blocks: WorkspaceBlock[]; // Ordered list of content blocks
  layout: 'single-column' | 'grid'; // Simplified layout for MVP

  // State
  status: WorkspaceStatus;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// DSR 1.0 - COLLABORATION & ANALYTICS TYPES
// ============================================================================

/**
 * Comment on a workspace or specific block
 */
export interface WorkspaceComment {
  id: string;
  workspaceId: string;
  blockId?: string; // Optional - if comment is on a specific block
  parentId?: string; // For threaded replies
  authorId: string;
  authorName: string;
  authorEmail: string;
  authorAvatar?: string;
  authorRole: 'buyer' | 'seller';
  content: string;
  mentions?: string[]; // Array of mentioned user emails
  createdAt: number;
  updatedAt?: number;
  isResolved?: boolean;
}

/**
 * Live presence indicator for real-time collaboration
 */
export interface WorkspacePresence {
  workspaceId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userAvatar?: string;
  userRole: 'buyer' | 'seller' | 'viewer';
  lastSeen: number; // Timestamp
  currentBlockId?: string; // Which block they're viewing
  isOnline: boolean;
}

/**
 * Activity event for workspace analytics and notifications
 */
export type ActivityType =
  | 'workspace_viewed'
  | 'workspace_shared'
  | 'block_viewed'
  | 'document_downloaded'
  | 'video_played'
  | 'video_completed'
  | 'map_task_completed'
  | 'comment_added'
  | 'proposal_signed'
  | 'stakeholder_added';

export interface WorkspaceActivity {
  id: string;
  workspaceId: string;
  type: ActivityType;
  actorId?: string; // User who performed action (may be anonymous)
  actorEmail?: string;
  actorName?: string;
  actorCompany?: string;
  metadata?: Record<string, any>; // Additional context (blockId, taskId, etc.)
  timestamp: number;
  ipAddress?: string; // For zombie lead detection
  userAgent?: string;
}

/**
 * Stakeholder identified through workspace engagement
 */
export interface WorkspaceStakeholder {
  id: string;
  workspaceId: string;
  email: string;
  name?: string;
  company?: string;
  jobTitle?: string;
  avatarUrl?: string;
  role: 'champion' | 'decision_maker' | 'influencer' | 'unknown';
  firstSeenAt: number;
  lastSeenAt: number;
  totalViews: number;
  totalTimeSpent: number; // In seconds
  engagementScore: number; // 0-100 calculated score
  viewedBlocks: string[]; // Array of block IDs they've viewed
}

/**
 * Notification for sellers about buyer activity
 */
export type NotificationType =
  | 'new_view'
  | 'return_visit'
  | 'stakeholder_discovered'
  | 'high_engagement'
  | 'document_download'
  | 'video_watch'
  | 'task_completed'
  | 'comment_mention'
  | 'proposal_signed'
  | 'zombie_reactivated';

export interface WorkspaceNotification {
  id: string;
  workspaceId: string;
  recipientId: string; // Seller's UID
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: number;
  link?: string; // Deep link to relevant content
}

/**
 * Slide-level analytics for tracking time spent per slide
 */
export interface SlideViewEvent {
  id: string;
  workspaceId: string;
  blockId: string; // The deck/document block
  slideIndex: number;
  viewerId?: string; // User ID if authenticated
  viewerEmail?: string;
  viewerName?: string;
  viewerCompany?: string;
  sessionId: string; // Unique per viewing session
  startTime: number; // When they started viewing
  endTime: number; // When they left
  durationMs: number; // Total time in milliseconds
  isFullscreen: boolean;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  timestamp: number;
}

export interface SlideAnalytics {
  slideIndex: number;
  thumbnailUrl?: string;
  totalViews: number;
  uniqueViewers: number;
  totalTimeSpentMs: number;
  avgTimeSpentMs: number;
  maxTimeSpentMs: number;
  completionRate: number; // Percentage who viewed this slide
}

export interface ContentEngagementAnalytics {
  blockId: string;
  blockType: 'deck' | 'pdf';
  contentName: string;
  totalSlides: number;
  totalViews: number;
  uniqueViewers: number;
  avgCompletionRate: number; // % of slides viewed on average
  totalTimeSpentMs: number;
  avgTimeSpentMs: number;
  slideAnalytics: SlideAnalytics[];
  hotspots: number[]; // Slide indices with highest engagement
  dropoffs: number[]; // Slide indices where viewers leave
  lastUpdated: number;
}
