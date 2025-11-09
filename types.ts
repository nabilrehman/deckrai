

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
export type UserPlan = 'free' | 'pro' | 'enterprise';

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
  usage: UserUsage;
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

export const PLAN_LIMITS: Record<UserPlan, { slidesPerMonth: number; decksPerMonth: number }> = {
  free: { slidesPerMonth: 10, decksPerMonth: 3 },
  pro: { slidesPerMonth: 100, decksPerMonth: 50 },
  enterprise: { slidesPerMonth: 500, decksPerMonth: 200 }
};
