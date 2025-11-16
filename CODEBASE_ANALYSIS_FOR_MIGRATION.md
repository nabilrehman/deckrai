# DeckRAI Codebase - Complete Analysis for Gemini to Claude Migration

## EXECUTIVE SUMMARY

This is a comprehensive presentation generation and editing platform powered by Google Gemini API. The codebase uses:
- **Gemini 2.5 Pro/Flash** for all AI interactions
- **Firebase** (Firestore + Storage) for data persistence and chat storage
- **React + TypeScript** for the frontend
- **Parallel agent architecture** for orchestrated slide generation

**Total AI interaction points: 30+** across service files
**Total Gemini API calls: 40+** identified in the codebase

---

## 1. LLM API CALLS - COMPLETE MAPPING

### 1.1 Gemini API Integration Pattern

**File:** `/home/user/deckrai/services/geminiService.ts` (1289 lines)

```typescript
import { GoogleGenAI, Modality } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
```

**Models Used:**
1. **gemini-2.5-pro** - Strategic planning, execution plans, brand research
2. **gemini-2.5-flash** - Quick content analysis, intent parsing, verification
3. **gemini-2.5-flash-image** - Image generation, editing, inpainting
4. **imagen-4.0-generate-001** - High-quality image generation (alternative)

### 1.2 AI Interaction Points - Complete List

#### A. INTENT PARSING (Agentic AI)
**Function:** `parseEditIntent()` (lines 87-148)
- **Purpose:** Determine if user is editing or creating
- **Model:** gemini-2.0-flash-exp (non-streaming)
- **Input:** User prompt + total slides count
- **Output:** EditIntent JSON {isEditing, slideNumbers[], action, scope}
- **Pattern:** JSON extraction from AI response with fallback

**Function:** `parsePlanModification()` (lines 30-85)
- **Purpose:** Parse user requests to modify generation plan
- **Model:** gemini-2.0-flash-exp
- **Input:** Current plan + user modification request
- **Output:** PlanModification JSON with optional fields

#### B. IMAGE GENERATION & EDITING (Non-Streaming)
**Function:** `generateSingleImage()` (lines 230-343)
- **Purpose:** Generate or edit slide images
- **Models:** gemini-2.5-flash-image OR imagen-4.0-generate-001
- **Flow:**
  1. Analyst brief (gemini-2.5-flash) → Refined prompt
  2. Artist generates (gemini-2.5-flash-image or Imagen)
  3. QA verification if deepMode enabled
  4. Self-correction loop if verification fails
- **Response:** `{image: base64, finalPrompt: string}`
- **API Call Pattern:**
  ```typescript
  const response = await ai.models.generateContent({
    model, 
    contents: { parts }, 
    config: { responseModalities: [Modality.IMAGE] }
  });
  ```

**Function:** `getGenerativeVariations()` (lines 431-488)
- **Purpose:** Generate slide variations with design analyst
- **Design Analyst:** gemini-2.5-flash analyzes slide + user request
- **Artist:** Generates variations based on refined prompt
- **Returns:** 1 variation (saves budget)

**Function:** `getInpaintingVariations()` (lines 491-538)
- **Purpose:** Inpaint within masked region
- **Inputs:** Original image + mask (both base64)
- **Mask Pattern:** Passes maskImage as part of image array
- **Returns:** Inpainted image with logs

#### C. PERSONALIZATION WORKFLOW
**Function:** `getPersonalizationPlan()` (lines 345-384)
- **Purpose:** Analyze slide + website to identify personalization opportunities
- **Model:** gemini-2.5-pro (with Google Search tool)
- **Input:** Company website URL + slide image
- **Output:** JSON with text_replacements[] and image_replacements[]
- **Tools Used:** googleSearch: {} for web research
- **Bounding Box:** Returns normalized coordinates (0.0-1.0)

**Function:** `getPersonalizedVariationsFromPlan()` (lines 386-428)
- **Purpose:** Execute personalization plan
- **Artist Prompt:** Multi-line instructions for text/image replacements
- **Returns:** 1 variation with complete logs

#### D. STYLE REFERENCE & REMAKE
**Function:** `findBestStyleReference()` (lines 595-646)
- **Purpose:** Match slide to best style reference from library
- **Model:** gemini-2.5-pro (multi-turn conversation)
- **Process:**
  1. Analyze target slide structure
  2. Compare with reference library
  3. Return single best match name
- **Response:** Image-based matching, returns library item

**Function:** `findBestStyleReferenceFromPrompt()` (lines 648-702)
- **Purpose:** Find style reference based on text prompt
- **Model:** gemini-2.5-pro
- **Input:** User's prompt + style library images
- **Output:** Best matching StyleLibraryItem

**Function:** `remakeSlideWithStyleReference()` (lines 704-787)
- **Purpose:** Remake slide using style reference
- **Process:**
  1. Extract content as JSON blueprint
  2. Find best style reference
  3. Generate 3 artist variations
- **Returns:** {images[], logs[], variationPrompts[], bestReferenceSrc}

#### E. TEXT REGION DETECTION
**Function:** `detectAllTextRegions()` (lines 1163-1230)
- **Purpose:** Batch detect all text on slide
- **Model:** gemini-2.5-flash
- **Output:** Array of TextRegion with bounding boxes
- **Format:** Returns normalized coordinates (0-100%)

**Function:** `detectClickedText()` (lines 1232-1289)
- **Purpose:** Detect text at clicked coordinates
- **Model:** gemini-2.5-flash
- **Input:** Pixel coordinates converted to percentage
- **Output:** TextRegion or null

#### F. DECK-LEVEL PLANNING
**Function:** `generateDeckExecutionPlan()` (lines 794-868)
- **Purpose:** Create execution plan for deck modifications
- **Model:** gemini-2.5-pro (with Google Search)
- **Input:** User prompt + slide list metadata
- **Output:** DeckAiExecutionPlan with tasks[]
- **Task Types:** EDIT_SLIDE | ADD_SLIDE
- **JSON Parsing:** Handles camelCase and snake_case

**Function:** `executeSlideTask()` (lines 870-898)
- **Purpose:** Execute single slide edit task
- **Process:** Generates 3 artist variations for user choice
- **Returns:** {images[], prompts[]}

**Function:** `createSlideFromPrompt()` (lines 900-995)
- **Purpose:** Create brand new slide from scratch
- **Inputs:**
  - referenceSlideImage (optional)
  - detailedPrompt (required)
  - theme (optional CompanyTheme)
  - logoImage (optional - for reference only)
  - customImage (optional - to include)
- **Logo Handling:** CRITICAL - "Do NOT attempt to draw or recreate"
- **Process:** 1 generation attempt to save cost
- **Returns:** {images[], prompts[], logs[]}

#### G. CONTENT & OUTLINE GENERATION
**Function:** `generateOutlineFromNotes()` (lines 1026-1062)
- **Purpose:** Transform raw notes into slide outline
- **Model:** gemini-2.5-pro
- **Constraints:** MAX 30 slides (hard limit with slice)
- **Output:** Array of strings (slide prompts)

**Function:** `enhanceOutlinePrompts()` (lines 1065-1101)
- **Purpose:** Enrich basic slide titles into detailed prompts
- **Model:** gemini-2.5-pro
- **Output:** Enhanced array matching input length
- **Fallback:** Returns original prompts if parsing fails

#### H. VERIFICATION & QUALITY ASSURANCE
**Function:** `verifyImage()` (lines 182-227)
- **Purpose:** QA check on generated image
- **Role:** "Quality Assurance Inspector"
- **Model:** gemini-2.5-flash
- **Inputs:** Original image + generated image + prompt
- **Output:** "OK" or correction feedback
- **Self-Correction:** Triggers if corrections needed

#### I. THEME GENERATION
**Function:** `generateThemeFromWebsite()` (lines 1113-1142)
- **Purpose:** Extract brand theme from company website
- **Model:** gemini-2.5-pro (with Google Search)
- **Output:** CompanyTheme {primaryColor, secondaryColor, accentColor, fontStyle, visualStyle}

#### J. DEBUG ANALYSIS
**Function:** `analyzeDebugSession()` (lines 998-1020)
- **Purpose:** Analyze failed generation session
- **Model:** gemini-2.5-pro
- **Input:** DebugSession JSON
- **Output:** Root cause analysis in Markdown

### 1.3 API Call Summary Table

| Function | Model | Type | Streaming | Thinking |
|----------|-------|------|-----------|----------|
| parseEditIntent | gemini-2.0-flash-exp | Text | No | No |
| generateSingleImage | gemini-2.5-flash-image | Image | No | No |
| getPersonalizationPlan | gemini-2.5-pro | Text+Image | No | No |
| findBestStyleReference | gemini-2.5-pro | Text+Image | No | No |
| generateDeckExecutionPlan | gemini-2.5-pro | Text | No | No |
| generateOutlineFromNotes | gemini-2.5-pro | Text | No | No |
| detectAllTextRegions | gemini-2.5-flash | Image | No | No |

**Note:** No streaming used. All calls are blocking await patterns.

---

## 2. CHAT MODE ARCHITECTURE

### 2.1 Chat Components Map

**File Structure:**
```
components/
├── ChatInterface.tsx (482 lines) - Message display and input
├── ChatLandingView.tsx (2127 lines) - Main chat orchestrator
├── ChatController.tsx (408 lines) - Chat state management
├── ChatInputWithMentions.tsx (442 lines) - Input with @mentions
├── ChatWithArtifacts.tsx (379 lines) - Alternative chat UI
├── RightChatPanel.tsx (324 lines) - Side panel chat
├── AnchoredChatBubble.tsx (533 lines) - Floating chat UI
├── ChatExample.tsx (253 lines) - Example conversations
```

### 2.2 Message Flow in ChatLandingView

**File:** `/home/user/deckrai/components/ChatLandingView.tsx` (2127 lines)

```
User Input
    ↓
[ChatInputWithMentions] → Detects @mentions + images
    ↓
[analyzeNotesAndAskQuestions] → AI clarification
    ↓
[detectVibeFromNotes] → Presentation vibe detection
    ↓
[generateSlidesWithContext] → AI generation with context
    ↓
[saveChat] → Firebase storage (if authenticated)
    ↓
[Display Variants] → VariantSelector component
```

### 2.3 Chat Message Structure

**Type Definition:**
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  thinking?: { steps: ThinkingStep[]; duration: string };
  actions?: { label: string; icon: string; items: ActionItem[] };
  component?: React.ReactNode;
  slidePreview?: Slide[]; // Inline slide preview
  beforeSlides?: Slide[]; // Before/after comparison
  showComparison?: boolean;
  undoAction?: () => void;
  mentionedSlides?: string[]; // @slide references
  attachedImages?: string[]; // Uploaded images
}
```

### 2.4 Firebase Chat Storage Integration

**File:** `/home/user/deckrai/services/firestoreService.ts` (807 lines)

**Collection Structure:**
```
users/{uid}/chats/{chatId}
  ├── metadata (SavedChat)
  │   ├── title
  │   ├── createdAt
  │   ├── updatedAt
  │   ├── lastMessage
  │   ├── messageCount
  │   └── generatedDeckId (optional)
  └── messages/{messageId}
      ├── id
      ├── role
      ├── content
      ├── timestamp
      ├── slideImages[] (Firebase Storage URLs)
      ├── slideData[] (id, name, storageUrl)
      └── thinkingSteps[] (analysis steps)
```

**Key Functions:**
- `saveChat(userId, chatId, messages, title, generatedDeckId)` - Save entire chat
- `getUserChats(userId)` - List all user chats
- `getChat(userId, chatId)` - Retrieve chat with all messages
- `uploadChatSlideImages(userId, chatId, messageId, images)` - Upload base64 to Storage

**Image Storage Pattern:**
- Base64 images → Blob conversion
- Upload to: `chats/{userId}/{chatId}/{messageId}/slide_{index}.png`
- Return Firebase Storage URLs (not base64)

### 2.5 Chat Features

**@Mentions System:**
- Detects `@slide{number}` or `@slide {name}`
- Links to specific slides in current deck
- Used for targeted edits

**Thinking Steps Visualization:**
```typescript
interface ThinkingStep {
  id: string;
  title: string;
  content?: string;
  status: 'pending' | 'active' | 'completed';
  timestamp?: number;
  type?: 'thinking' | 'generating' | 'processing';
}
```

**Action Summary:**
- Shows what AI will do (EDIT_SLIDE, ADD_SLIDE, etc.)
- Undo functionality with context preservation

---

## 3. EDIT MODE ARCHITECTURE

### 3.1 Edit Components

**File:** `/home/user/deckrai/components/SlideEditor.tsx` (2099 lines)

**Editing Tabs:**
1. **Edit Tab** - General slide editing
2. **Personalize Tab** - Company personalization
3. **Inpaint Tab** - Mask and edit regions
4. **Redesign Tab** - Style reference remake

### 3.2 Edit Workflow

```
SlideEditor Component
    ├─ [Edit] → getGenerativeVariations()
    │   ├─ Design Analyst (gemini-2.5-flash)
    │   └─ Artist (gemini-2.5-flash-image)
    │
    ├─ [Personalize] → Company-specific edits
    │   ├─ getPersonalizationPlan() - Analyze website
    │   └─ getPersonalizedVariationsFromPlan() - Execute plan
    │
    ├─ [Inpaint] → Masked region editing
    │   ├─ Canvas mask drawing
    │   └─ getInpaintingVariations() - Fill masked area
    │
    └─ [Redesign] → Style reference matching
        ├─ findBestStyleReference() - Match style
        └─ remakeSlideWithStyleReference() - Generate 3 variations
```

### 3.3 Inpainting Feature

**Implementation:**
- Canvas-based mask creation
- Brush size: configurable (default 40px)
- Mask format: base64 image with inversion
- API Pattern: Passes [original, mask] as imageParts

**Code:**
```typescript
const maskImagePart = fileToGenerativePart(base64Mask);
const inpaintingPrompt = `**Task: Inpainting**
Perform the following instruction ONLY within the masked area...`;

await generateSingleImage(
  'gemini-2.5-flash-image',
  [originalImagePart, maskImagePart], // Both images
  inpaintingPrompt,
  deepMode
);
```

### 3.4 Slide Variants Management

**VariantSelector Component:**
- Displays 1-3 generated variations
- User selects preferred version
- Selected version becomes slide history

**History Pattern:**
```typescript
interface Slide {
  id: string;
  originalSrc: string; // First version
  history: string[]; // All versions (last = current)
  name: string;
  pendingPersonalization?: {
    taskPrompt: string;
    variations: string[]; // Base64 for review
    variationPrompts: string[];
  };
}
```

### 3.5 "Apply to All" Feature

**Context Capture:**
```typescript
interface LastSuccessfulEditContext {
  workflow: 'Generate' | 'Personalize' | 'Inpaint' | 'Remake' | 'Create New Slide';
  userIntentPrompt: string;
  model: string;
  deepMode: boolean;
  styleReference?: StyleLibraryItem;
}
```

**Replication:** User can apply same edit to other slides

---

## 4. DESIGNER MODE & PARALLEL AGENTS

### 4.1 Designer Mode Generator

**File:** `/home/user/deckrai/components/DesignerModeGenerator.tsx` (1431 lines)

**Purpose:** AI-powered deck generation from raw notes/PDF

### 4.2 Parallel Orchestrator Architecture

**File:** `/home/user/deckrai/services/designerOrchestrator.ts` (666 lines)

**Flow:**
```
Phase 1: Master Planning Agent
  ├─ Input: Company + Content + Audience + Goal + SlideCount
  ├─ Model: gemini-2.5-pro (thinking: 16384 tokens)
  ├─ Output: Brand Research + Deck Architecture + Design System + Slide Briefs
  └─ Time: Single call (large thinking budget)

Phase 2: Parallel Slide Agents
  ├─ Input: Each slide brief + Brand/Design context
  ├─ Model: gemini-2.5-pro (thinking: 8192 tokens per slide)
  ├─ Process: ALL slides generated in PARALLEL
  ├─ Output: Detailed slide specifications (JSON + Markdown)
  └─ Speedup: N-fold parallelization

Phase 3: Assembly
  ├─ Combine: Master output + all slide outputs
  ├─ Parse: Extract JSON specifications
  └─ Output: Complete slide deck structure
```

**API Calls:**
```typescript
// Master Agent
const masterResponse = await ai.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: masterPrompt,
  config: {
    thinkingConfig: { thinkingBudget: 16384, includeThoughts: false }
  }
});

// Parallel Slide Agents
const slidePromises = slideBriefs.map(brief => 
  ai.models.generateContent({
    model: 'gemini-2.5-pro',
    contents: slidePrompt,
    config: { thinkingConfig: { thinkingBudget: 8192 } }
  })
);
const slideResults = await Promise.all(slidePromises);
```

### 4.3 Master Prompt Architecture

**Master Prompt Template Structure:**

1. **EXECUTIVE SUMMARY** - High-level strategy
2. **BRAND RESEARCH** - Company branding analysis
   - Sources with citations
   - Colors with hex/RGB codes
   - Typography details
   - Brand personality
3. **DECK ARCHITECTURE** - Slide-by-slide plan
   - Table with 6 columns (Slide #, Title, Purpose, Info Density, Visual Approach, Hierarchy Type)
4. **DESIGN SYSTEM** - Visual system definition
   - Color palette
   - Typography hierarchy
5. **SLIDE BRIEFS** - Detailed brief for each slide
   - Content requirements
   - Visual requirements
   - Hierarchy direction
   - Layout guidance
   - Color palette
   - Design rationale

### 4.4 Slide Agent Prompt

**Output Template:**
- Markdown specifications for each slide
- JSON block at END with all slide data
- Each slide includes:
  - headline, subhead, content
  - infoDensity, visualApproach, eyeFlowPattern
  - visualHierarchy (primary/secondary/tertiary %)
  - backgroundColor, textColors
  - typography details
  - designRationale

**Critical Constraint:**
- ONE JSON block at end containing ALL slides
- NOT separate JSON blocks per slide

### 4.5 Thinking Budgets Used

| Agent | Thinking Budget | Purpose |
|-------|-----------------|---------|
| Master Planning | 16384 tokens | Complete deck strategy |
| Slide Specification (per slide) | 8192 tokens | Detailed design specs |
| Intelligent Generation | 32768 tokens | Context analysis & planning |

---

## 5. SERVICES & PROMPTS - COMPLETE INVENTORY

### 5.1 All Service Files (20 total)

**Core AI Services:**
1. `geminiService.ts` (1289 lines) - All Gemini API calls
2. `designerOrchestrator.ts` (666 lines) - Parallel agent orchestration
3. `intelligentGeneration.ts` (297 lines) - Context-aware generation

**Supporting Services:**
4. `vibeDetection.ts` (288 lines) - Presentation vibe analysis
5. `titleSlideGenerator.ts` (150 lines) - Title slide creation
6. `designAssetGenerator.ts` (185 lines) - Asset generation
7. `deepReferenceAnalyzer.ts` (343 lines) - Reference matching analysis
8. `referenceMatchingEngine.ts` (380 lines) - Reference image matching
9. `referenceStrategyDecider.ts` (361 lines) - Reference strategy selection
10. `architectureSlideGenerator.ts` (299 lines) - Architecture diagram generation
11. `outlineParser.ts` (622 lines) - Parse outline specifications
12. `audienceTemplates.ts` (283 lines) - Audience-specific templates
13. `styleTemplates.ts` (274 lines) - Style templates

**Data Persistence:**
14. `firestoreService.ts` (807 lines) - Firebase operations
15. `firebaseService.ts` (0 lines) - (Empty/unused)
16. `authService.ts` (52 lines) - Auth operations
17. `googleSlidesService.ts` (383 lines) - Google Slides export

**Logging & Session:**
18. `sessionLogger.ts` (191 lines) - Session persistence
19. `browserLogger.ts` (143 lines) - Browser logging
20. `fileLogger.ts` (83 lines) - File logging

### 5.2 Prompt Files (6337 lines total)

**Core Prompts:**
- `parallel-master-prompt.md` (294 lines) - Master planning prompt
- `parallel-slide-agent-prompt.md` (285 lines) - Slide specification
- `parallel-review-agent-prompt.md` (367 lines) - Review agent

**Reference Prompts:**
- `gemini-slide-designer-prompt.md` - Designer prompt (in code)

**Documentation:**
- `PARALLEL-ARCHITECTURE.md` (337 lines)
- `UNIVERSALITY-ANALYSIS.md` (590 lines)
- `ADK-CONVERSION-PLAN.md` (613 lines)
- `ANALYSIS-REPORT.md` (881 lines)
- And 13 more documentation files

### 5.3 Type Definitions (574 lines)

**Main Types File:** `/home/user/deckrai/types.ts`
- Slide, StyleLibraryItem, Template
- DeckAiExecutionPlan, EditSlideTask, AddSlideTask
- DebugLog, DebugSession
- User Profile, UserUsage, SavedChat, StoredChatMessage
- PersonalizationAction (TextReplacement, ImageReplacement)
- CompanyTheme, BoundingBox

**Designer Types:** `/home/user/deckrai/types/designerMode.ts` (159 lines)
- DesignerGenerationInput
- BrandResearch, BrandColor, BrandTypography
- SlideArchitecture, SlideSpecification, DesignSystem
- PythonOrchestratorResult, DesignerGenerationProgress

**Reference Matching Types:** `/home/user/deckrai/types/referenceMatching.ts` (415 lines)
- MatchWithBlueprint, StrategyDecision
- Reference matching data structures

---

## 6. KEY ARCHITECTURAL PATTERNS

### 6.1 Component Hierarchy

```
App.tsx
├─ AuthContext
├─ Header
├─ Editor (Main editing interface)
│  ├─ SlidePreviewList
│  ├─ SlideEditor (Active slide view)
│  │  ├─ VariantSelector
│  │  ├─ PersonalizationReviewModal
│  │  ├─ AnchoredChatBubble
│  │  └─ RightChatPanel
│  ├─ DeckAiPlanModal
│  └─ ChatInterface
│
├─ ChatLandingView (New deck generation)
│  ├─ ChatInterface
│  ├─ ModeSelectionCards
│  ├─ PlanDisplay
│  ├─ SlidePreviewInline
│  └─ ChatInputWithMentions
│
├─ DesignerModeGenerator (PDF/file upload)
│  ├─ FloatingActionBubble
│  ├─ SessionInspectorPanel
│  └─ DeckAiPlanModal
│
└─ Additional Panels
   ├─ StyleLibraryPanel
   ├─ DeckLibrary
   ├─ PresentationView
   └─ SaveDeckModal
```

### 6.2 State Management Patterns

**No Redux/Zustand** - Uses React hooks with local state

**State Lifting Pattern:**
```typescript
// App.tsx manages global state
const [slides, setSlides] = useState<Slide[]>([]);
const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
const [styleLibrary, setStyleLibrary] = useState<StyleLibraryItem[]>([]);

// Passed down as props to children
<Editor 
  slides={slides}
  activeSlideId={activeSlideId}
  onNewSlideVersion={...}
/>
```

**Context API:**
- AuthContext - User authentication
- No other contexts (too simple for Redux)

### 6.3 API Service Architecture

**Pattern: Service → Component → Callback**

```typescript
// Service returns {images, logs, prompts}
const {images, logs, variationPrompts} = await getGenerativeVariations(
  model, prompt, base64Image, deepMode, onProgress
);

// Component selects variant
const [selectedVariant, setSelectedVariant] = useState(images[0]);

// Update slide
onNewSlideVersion(slideId, selectedVariant);
```

**Progress Callback Pattern:**
```typescript
const onProgress = (message: string) => {
  setProgressSteps(prev => [...prev, {text: message, status: 'in-progress'}]);
};

await generateSingleImage(model, imageParts, prompt, deepMode, logs, onProgress);
```

### 6.4 Error Handling

**Pattern: Try-Catch with User Messages**

```typescript
try {
  const result = await ai.models.generateContent({...});
  // Process result
} catch (error: any) {
  console.error('🚨 API ERROR:', error);
  setError(error.message || "An unknown error occurred");
  // Could retry or show user-friendly message
}
```

**JSON Parsing with Fallback:**
```typescript
const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/) ||
                 jsonText.match(/(\{[\s\S]*\})/);

if (!jsonMatch) {
  console.error('Failed to parse:', responseText);
  return defaultFallbackValue;
}

try {
  return JSON.parse(jsonMatch[1]);
} catch (e) {
  console.error('Parse error:', e);
  return defaultFallbackValue;
}
```

**API Error Detection:**
```typescript
if (!candidate || !candidate.content?.parts || 
    candidate.content.parts.length === 0) {
  throw new Error(`No image was generated. Reason: ${candidate?.finishReason}`);
}
```

### 6.5 Image Data Flow

**Base64 Handling:**
```typescript
// Pattern: data:image/png;base64,{base64_string}
const fileToGenerativePart = (base64Data: string) => {
  const match = base64Data.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!match) throw new Error("Invalid base64 image");
  return {
    inlineData: {
      data: match[2],
      mimeType: match[1]
    }
  };
};
```

**Canvas Laundering (Normalizing Images):**
```typescript
const launderImageSrc = (src: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = src;
  });
};
```

**Storage Pattern:**
- Development: Base64 in memory
- Saved Decks: Upload to Firebase Storage, use URLs
- Chat Storage: Upload to Firebase Storage, store URLs

### 6.6 Database Persistence Pattern

**Firestore Collections:**
```
/decks/{deckId}
  ├─ name, slides[], createdAt, updatedAt, slideCount, thumbnailUrl
  └─ Firebase Storage: decks/{userId}/{deckId}/{slideId}/{version}.png

/users/{uid}/profile
  ├─ email, displayName, plan, usage, subscription

/users/{uid}/chats/{chatId}
  ├─ title, createdAt, updatedAt, lastMessage, messageCount
  └─ /messages/{messageId}
     ├─ role, content, timestamp, slideImages[], thinkingSteps[]

/styleLibrary/{userId}/{id}
  ├─ name, src (Storage URL)
```

**Optimization: Batch writes**
```typescript
const batch = writeBatch(db);
messagesWithStorageUrls.forEach(message => {
  batch.set(doc(...), message);
});
await batch.commit();
```

### 6.7 Request/Response Pattern

**Non-Streaming Calls Only:**
```typescript
// All Gemini calls await completion
const response = await ai.models.generateContent({
  model: 'gemini-2.5-pro',
  contents: prompt
});

// Extract text
const text = response.candidates[0].content.parts
  .map(p => p.text)
  .join('\n');
```

**No WebSocket/SSE streaming** - All responses are blocking awaits

---

## 7. CRITICAL MIGRATION CONSIDERATIONS

### 7.1 API Feature Mapping

| Gemini Feature | Anthropic Equivalent | Notes |
|----------------|----------------------|-------|
| `generateContent()` | `messages.create()` | Same blocking pattern |
| `generateImages()` | N/A | Use for Imagen only |
| `Modality.IMAGE` | Model vision capability | Claude 3.5 Sonnet supports vision |
| `googleSearch` tool | Web search integration | Requires Claude tool use |
| `thinkingConfig` | Extended thinking | May require different budget |
| Image inlining | base64/URL vision | Standard Claude vision format |

### 7.2 Breaking Changes

1. **Image Generation:** Gemini generates images, Claude does not
   - Need alternative: DALL-E, Imagen, or Stable Diffusion API
   - Current code assumes AI generates slide images

2. **Google Search Tool:** Used in personalization + theme generation
   - Anthropic Web Search may have different format

3. **Multi-turn Conversations:** Designer mode uses complex prompting
   - May need refactoring for Claude message format

### 7.3 Preserved Patterns

1. **JSON Parsing:** All responses are parsed JSON - compatible
2. **Service Architecture:** Can wrap Claude API same way
3. **Component Flow:** Doesn't care about LLM backend
4. **Data Structures:** All same, just swap API provider

### 7.4 Testing Strategy

1. **Unit test:** Each geminiService.ts function
2. **Integration test:** Chat → Firestore → Display
3. **E2E test:** New deck generation → Save → Edit
4. **Regression test:** Same prompts produce similar quality

---

## 8. DATA FLOW DIAGRAMS

### 8.1 Chat Mode Data Flow

```
User Input
    ↓
[ChatLandingView.tsx]
    ├─ analyzeNotesAndAskQuestions()
    │  └─ geminiService: analyzeNotesAndAskQuestions()
    │     └─ Model: gemini-2.5-pro (thinking: 32768)
    │
    ├─ detectVibeFromNotes()
    │  └─ vibeDetection.ts: Categorize presentation style
    │
    └─ generateSlidesWithContext()
       └─ geminiService: generateOutlineFromNotes()
          └─ Model: gemini-2.5-pro
    ↓
[VariantSelector] - Display slide options
    ↓
[User selects variant]
    ↓
[Convert ChatMessage to StoredChatMessage]
    ↓
[firestoreService.uploadChatSlideImages()]
    ├─ Convert base64 → Blob
    ├─ Upload to Firebase Storage
    └─ Get download URLs
    ↓
[firestoreService.saveChat()]
    ├─ Save chat metadata to Firestore
    └─ Save all messages with Storage URLs
```

### 8.2 Edit Mode Data Flow

```
[SlideEditor.tsx] - User clicks "Edit"
    ↓
[User enters prompt + selects model]
    ↓
[Switch on activeTab]
    ├─ edit → getGenerativeVariations()
    ├─ personalize → getPersonalizationPlan() + execute()
    ├─ inpaint → drawMask() + getInpaintingVariations()
    └─ redesign → remakeSlideWithStyleReference()
    ↓
[Generate API Call]
    ├─ Design Analyst (if applicable)
    │  └─ Refine user prompt
    ├─ Artist (main generation)
    │  └─ Generate variation
    └─ QA Verification (if deepMode)
       └─ Compare original vs generated
    ↓
[Generate Corrections Loop]
    ├─ If QA feedback found
    ├─ Re-generate with corrections
    └─ Return corrected image
    ↓
[VariantSelector] - Show 1-3 variations
    ↓
[User selects variant]
    ↓
[onNewSlideVersion(slideId, imageData)]
    ├─ Update slide.history
    ├─ Update slide.originalSrc if new
    └─ Trigger re-render
```

### 8.3 Designer Mode Data Flow

```
[DesignerModeGenerator.tsx] - User uploads PDF or enters notes
    ↓
[extractPresentationContext()] - AI analyzes input
    └─ Model: gemini-2.5-flash (quick extraction)
    ↓
[generateDesignerOutline()]
    ├─ Phase 1: Master Planning Agent
    │  ├─ Model: gemini-2.5-pro (thinking: 16384)
    │  ├─ Outputs: Brand + Architecture + Design System
    │  └─ Time: ~1 call
    │
    ├─ Phase 2: Parallel Slide Agents
    │  ├─ For each slide brief:
    │  │  └─ Model: gemini-2.5-pro (thinking: 8192)
    │  ├─ All slides in parallel
    │  └─ Time: ~Max(all slide times)
    │
    └─ Phase 3: Assembly
       ├─ Parse master output
       ├─ Parse all slide outputs
       └─ Generate Slide objects
    ↓
[DeckAiPlanModal] - Show generated structure
    ↓
[User reviews & confirms]
    ↓
[referenceMatchingEngine.matchReferencesToSlides()]
    └─ Match generated slides to uploaded references
    ↓
[decideGenerationStrategy()]
    └─ Decide how to generate each slide
    ↓
[createSlideFromPrompt()] - Generate actual slide images
    ├─ For each slide in parallel
    └─ Model: gemini-2.5-flash-image
    ↓
[Assembled Deck → App State → Editor]
```

### 8.4 Firebase Storage Architecture

```
Firebase Storage
├─ decks/{userId}/{deckId}/
│  ├─ {slideId}/
│  │  ├─ original.png
│  │  ├─ history_0.png
│  │  ├─ history_1.png
│  │  └─ variation_0.png (pending personalization)
│  └─ {slideId2}/
│     └─ ...
│
├─ chats/{userId}/{chatId}/
│  ├─ {messageId}/
│  │  ├─ slide_0.png
│  │  ├─ slide_1.png
│  │  └─ ...
│  └─ {messageId2}/
│     └─ ...
│
└─ styleLibrary/{userId}/
   ├─ {itemId}.png
   └─ {itemId2}.png
```

---

## 9. METRICS & STATISTICS

### 9.1 Code Metrics

| Metric | Count |
|--------|-------|
| Total TypeScript Files | ~85 |
| Total Components | 63 |
| Total Service Files | 20 |
| Total Lines of Code | ~25,000+ |
| Gemini API Imports | 22 |
| AI Function Exports | 30+ |
| Firebase Operations | 40+ |

### 9.2 AI Interaction Metrics

| Metric | Count |
|--------|-------|
| Unique Gemini Models | 4 |
| Service Functions Calling Gemini | 20+ |
| JSON Parsing Operations | 15+ |
| Thinking Budget Usage | 57,344 tokens max |
| Image Generation Functions | 8 |
| Prompts (system + user) | 50+ |

### 9.3 Database Metrics

| Collection | Documents | Size |
|------------|-----------|------|
| /users | Per auth user | Profile data |
| /decks | Per user | ~100KB per deck |
| /users/{uid}/chats | Per user | Varies |
| /users/{uid}/chats/{id}/messages | Per chat | ~50KB per message |
| /styleLibrary | Per user | ~500KB per item |

---

## 10. CONFIGURATION

### 10.1 Environment Variables

**File:** `.env.example`
```
VITE_GEMINI_API_KEY=your_api_key_here
```

### 10.2 Firebase Config

**File:** `/config/firebase.ts`
```typescript
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
```

### 10.3 Model Selection

**Available Models (configurable in UI):**
- Gemini 2.0 Flash (default) - Fast responses
- Gemini 2.5 Flash - Standard generation
- Gemini 2.5 Pro - High quality planning
- Imagen 4.0 - Alternative image generation

---

## 11. NEXT STEPS FOR CLAUDE MIGRATION

1. **Create Claude API wrapper** in `services/claudeService.ts`
2. **Map each geminiService function** to Claude equivalent
3. **Handle image generation separately** (use external API)
4. **Refactor prompt format** for Claude message protocol
5. **Update type definitions** if needed
6. **Test each migration point** before replacing
7. **Keep Gemini** as fallback during transition
8. **Update Firebase** rules if Claude has different payload sizes
9. **Performance test** response times
10. **Update documentation** with new integration

