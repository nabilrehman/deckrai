

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
export type UserPlan = 'free' | 'startup' | 'business' | 'enterprise' | 'enterprise-plus';

export interface UserUsage {
  slidesThisMonth: number;
  decksThisMonth: number;
  monthStart: number; // timestamp
  lastUpdated: number; // timestamp
}

// NEW: Credit Balance
export interface CreditBalance {
  totalCredits: number;          // Current available credits
  usedCreditsLifetime: number;   // Total credits consumed (all-time)
  usedCreditsThisMonth: number;  // Credits used this billing period
  lastCreditPurchase?: number;   // Timestamp of last purchase
  lastUpdated: number;           // Timestamp
}

// NEW: Credit Transaction Log
export interface CreditTransaction {
  id: string;
  organizationId?: string;       // If part of an organization
  userId: string;
  type: 'purchase' | 'consumption' | 'refund' | 'bonus' | 'subscription_renewal' | 'rollover';
  amount: number;                // Positive for purchase, negative for consumption
  balanceAfter: number;          // Balance after this transaction
  description: string;           // e.g., "Created slide 'Introduction'"
  metadata?: {
    slideId?: string;
    deckId?: string;
    action?: 'create' | 'edit' | 'regenerate';
    memberEmail?: string;        // For org tracking
    invoiceId?: string;          // For enterprise billing
    packageId?: string;          // Which credit pack was purchased
  };
  timestamp: number;
}

// NEW: Credit Package Definition
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;                 // USD
  pricePerCredit: number;        // Calculated for display
  bonus?: number;                // Extra credits (e.g., "Buy 100, get 10 free")
  popular?: boolean;
  bestFor?: string;
  neverExpires: boolean;
}

// NEW: Subscription Plan Definition
export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'free' | 'subscription' | 'custom';
  monthlyCredits: number | 'custom';
  price: number | 'custom';
  pricePerCredit?: number;
  description?: string;
  features: string[];
  limits: {
    creditsPerMonth: number | 'custom';
    teamMembers: number | 'unlimited';
    decksPerMonth: number | 'unlimited';
    storageGB: number | 'unlimited';
    rolloverCredits?: number;    // Unused credits that carry over
  };
  overage?: {
    enabled: boolean;
    costPerCredit: number;
    description: string;
  };
  popular?: boolean;
  badge?: string;
  contactSales?: boolean;
}

export interface UserSubscription {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'none';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart?: number;   // timestamp
  currentPeriodEnd?: number;     // timestamp
  cancelAtPeriodEnd?: boolean;
  trialEndsAt?: number;          // timestamp
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  plan: UserPlan;
  credits: CreditBalance;        // NEW: Replaces usage tracking
  organizationId?: string;       // NEW: Link to organization (if member)
  subscription: UserSubscription;
  createdAt: number; // timestamp
  lastLoginAt: number; // timestamp

  // DEPRECATED: Keep for migration purposes
  usage?: UserUsage;
}

// NEW: Organization/Team Management
export interface TeamMember {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member' | 'viewer';
  addedAt: number;
  lastActive?: number;
  creditsUsed: number;           // Track individual member usage
}

export interface Organization {
  id: string;
  name: string;
  plan: UserPlan;
  ownerId: string;               // Primary admin
  members: TeamMember[];

  // Shared credit pool
  credits: {
    totalCredits: number;
    monthlyAllocation: number;   // Credits allocated per billing period
    rolloverCredits: number;     // Unused credits from previous month
    usedThisMonth: number;
    lastReset: number;           // Monthly reset timestamp
    lastUpdated: number;
  };

  // Subscription details
  subscription: {
    status: 'active' | 'trialing' | 'past_due' | 'canceled';
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
    cancelAtPeriodEnd?: boolean;
    trialEndsAt?: number;
  };

  // Enterprise settings
  settings: {
    brandingEnabled: boolean;
    customLogo?: string;
    customColors?: {
      primary: string;
      secondary: string;
    };
    ssoEnabled: boolean;
    ssoProvider?: 'google' | 'microsoft' | 'saml';
    apiEnabled: boolean;
    apiKeys?: string[];
    webhookUrl?: string;
    allowExternalSharing: boolean;
    requireApprovalForExport: boolean;
  };

  // Usage analytics
  analytics: {
    totalSlidesCreated: number;
    totalDecksCreated: number;
    mostActiveMembers: string[]; // UIDs
    averageSlidesPerWeek: number;
  };

  // Billing
  billing: {
    billingEmail: string;
    paymentMethod: 'card' | 'invoice';
    invoiceDetails?: {
      companyName: string;
      taxId?: string;
      address: string;
      purchaseOrderRequired: boolean;
    };
  };

  createdAt: number;
  updatedAt: number;
}

export interface SavedDeck {
  id: string;
  userId: string;
  organizationId?: string;       // NEW: Link to organization if shared
  name: string;
  slides: Slide[];
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  slideCount: number;
  thumbnailUrl?: string; // First slide thumbnail
}

// DEPRECATED: Old monthly limits (keep for backward compatibility)
export const PLAN_LIMITS: Record<UserPlan, { slidesPerMonth: number; decksPerMonth: number }> = {
  free: { slidesPerMonth: 10, decksPerMonth: 3 },
  startup: { slidesPerMonth: 100, decksPerMonth: 50 },
  business: { slidesPerMonth: 300, decksPerMonth: 100 },
  enterprise: { slidesPerMonth: 1000, decksPerMonth: 500 },
  'enterprise-plus': { slidesPerMonth: 9999, decksPerMonth: 9999 }
};
