# Deckr.ai Enterprise Reference Matching Architecture

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE                                  │
│                     (React App - Designer Mode)                              │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DesignerModeGenerator.tsx                                 │
│                         (Main Orchestrator)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. User uploads 37-page PDF                                                │
│  2. PDF → Firebase Storage (parallel uploads)                               │
│  3. Metadata → Firestore                                                    │
│  4. User pastes content & clicks "Generate with AI"                         │
│  5. Modal appears: "Use Company Templates" vs "Let Deckr Go Crazy"          │
│  6. User selects "Use Company Templates"                                    │
└────────────────┬───────────────────────────────┬────────────────────────────┘
                 │                               │
                 ▼                               ▼
    ┌────────────────────────┐      ┌──────────────────────────┐
    │   Firebase Storage     │      │   Firebase Firestore     │
    │  (Reference Images)    │      │  (Reference Metadata)    │
    ├────────────────────────┤      ├──────────────────────────┤
    │ • 37 PNG images        │      │ • id: "page-1"           │
    │ • users/{uid}/         │      │ • name: "DA Mentor..."   │
    │   styleLibrary/        │      │ • src: "gs://..."        │
    │   page-1.png           │      │ • type: "image"          │
    │   page-2.png           │      │ • uploadedAt: timestamp  │
    │   ...                  │      │ • (37 documents)         │
    └────────────────────────┘      └──────────────────────────┘
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 1: MASTER PLANNING                              │
│                    (designerOrchestrator.ts)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Input: User's raw notes/content                                            │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────┐           │
│  │  Gemini 2.5 Pro (Thinking Mode)                              │           │
│  │  • Analyzes content                                           │           │
│  │  • Researches brand (company name, colors, typography)        │           │
│  │  • Creates deck structure                                     │           │
│  │  • Generates slide specifications (JSON)                      │           │
│  └──────────────────────────────────────────────────────────────┘           │
│                                                                              │
│  Output: slideSpecifications[] (8 slides)                                   │
│  [                                                                           │
│    {                                                                         │
│      slideNumber: 1,                                                         │
│      slideType: "title",                                                     │
│      headline: "Building Your Modern Lakehouse",                             │
│      content: "A Technical Deep-Dive...",                                    │
│      visualDescription: "...",                                               │
│      brandContext: "Google Cloud"                                            │
│    },                                                                        │
│    ... (7 more slides)                                                       │
│  ]                                                                           │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   PHASE 2: REFERENCE MATCHING                                │
│              (referenceMatchingEngine.ts)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Input:                                                                      │
│  • slideSpecifications[] (8 slides)                                          │
│  • styleLibrary[] (37 references from Firebase)                             │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │  Step 1: Quick Categorization (parallel)                    │            │
│  │  ┌──────────────────────────────────────────────────────┐   │            │
│  │  │  Gemini 2.5 Pro Vision (37 API calls)               │   │            │
│  │  │  • Analyzes each reference image                     │   │            │
│  │  │  • Categorizes: title | content | data-viz |         │   │            │
│  │  │    image-content | closing                           │   │            │
│  │  └──────────────────────────────────────────────────────┘   │            │
│  │                                                              │            │
│  │  Result: Reference descriptions                             │            │
│  │  "Reference 1: DA Mentor ... Page 1 (content)"              │            │
│  │  "Reference 2: DA Mentor ... Page 2 (title)"                │            │
│  │  ...                                                         │            │
│  └─────────────────────────────────────────────────────────────┘            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │  Step 2: Intelligent Matching (single API call)             │            │
│  │  ┌──────────────────────────────────────────────────────┐   │            │
│  │  │  Gemini 2.5 Pro                                      │   │            │
│  │  │  Matching Criteria:                                  │   │            │
│  │  │  • Content Type Match (40% weight)                   │   │            │
│  │  │  • Visual Hierarchy Match (30% weight)               │   │            │
│  │  │  • Brand Context Match (20% weight)                  │   │            │
│  │  │  • Layout Compatibility (10% weight)                 │   │            │
│  │  │                                                       │   │            │
│  │  │  Returns JSON with matches for all 8 slides          │   │            │
│  │  └──────────────────────────────────────────────────────┘   │            │
│  └─────────────────────────────────────────────────────────────┘            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │  Step 3: Name Cleaning & Validation                         │            │
│  │  • Gemini returns: "Page 11 (content).png"                  │            │
│  │  • Clean to: "Page 11"                                      │            │
│  │  • Find in styleLibrary by name match                       │            │
│  │  • Result: Found ✅                                          │            │
│  └─────────────────────────────────────────────────────────────┘            │
│                                                                              │
│  Output: matchMap                                                            │
│  Map {                                                                       │
│    1 => {                                                                    │
│      match: {                                                                │
│        slideNumber: 1,                                                       │
│        referenceSrc: "https://firebase.../page-11.png",                     │
│        referenceName: "DA Mentor ... Page 11",                               │
│        matchScore: 95,                                                       │
│        matchReason: "Clean single-column layout...",                         │
│        category: "content"                                                   │
│      },                                                                      │
│      blueprint: { ... } // From Phase 3                                     │
│    },                                                                        │
│    ... (7 more matches)                                                      │
│  }                                                                           │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  PHASE 3: DEEP REFERENCE ANALYSIS                            │
│                 (deepReferenceAnalyzer.ts)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Input: Matched reference image for each slide                              │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │  Gemini 2.5 Pro Vision (8 API calls - one per match)        │            │
│  │  Analyzes reference image in detail                         │            │
│  │                                                              │            │
│  │  Extracts Design Blueprint:                                 │            │
│  │  ┌──────────────────────────────────────────────────────┐   │            │
│  │  │ 1. Background                                        │   │            │
│  │  │    • type: "gradient"                                │   │            │
│  │  │    • colors: ["#1A73E8", "#4285F4"]                  │   │            │
│  │  │    • direction: "diagonal"                           │   │            │
│  │  │                                                       │   │            │
│  │  │ 2. Layout Grid                                       │   │            │
│  │  │    • columns: 12                                     │   │            │
│  │  │    • rows: 8                                         │   │            │
│  │  │    • gutter: "40px"                                  │   │            │
│  │  │                                                       │   │            │
│  │  │ 3. Visual Hierarchy                                  │   │            │
│  │  │    • primary: "headline" (70% visual weight)         │   │            │
│  │  │    • secondary: "subhead" (20%)                      │   │            │
│  │  │    • tertiary: "logo" (10%)                          │   │            │
│  │  │                                                       │   │            │
│  │  │ 4. Typography                                        │   │            │
│  │  │    • headline: "Google Sans, 72pt, #FFFFFF"          │   │            │
│  │  │    • body: "Google Sans, 24pt, #E8EAED"              │   │            │
│  │  │                                                       │   │            │
│  │  │ 5. Spacing                                           │   │            │
│  │  │    • verticalRhythm: "8px"                           │   │            │
│  │  │    • padding: { top: 120, sides: 160 }               │   │            │
│  │  │                                                       │   │            │
│  │  │ 6. Generation Strategy                               │   │            │
│  │  │    • strategy: "full-recreate"                       │   │            │
│  │  │    • reasoning: "Complex gradient + custom layout"   │   │            │
│  │  └──────────────────────────────────────────────────────┘   │            │
│  └─────────────────────────────────────────────────────────────┘            │
│                                                                              │
│  Output: blueprint attached to each match in matchMap                       │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 4: SLIDE GENERATION                                 │
│                      (geminiService.ts)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  For each slide (8 slides, sequential):                                     │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │  Slide 1: Build prompt from spec                            │            │
│  │  ┌──────────────────────────────────────────────────────┐   │            │
│  │  │  outlineParser.ts                                    │   │            │
│  │  │  • slideSpec (from Master Agent)                     │   │            │
│  │  │  • blueprint (from Deep Analyzer)                    │   │            │
│  │  │  • strategy ("full-recreate")                        │   │            │
│  │  │                                                       │   │            │
│  │  │  Builds detailed prompt:                             │   │            │
│  │  │  "Create a slide with:                               │   │            │
│  │  │   - Headline: 'Building Your Modern Lakehouse'       │   │            │
│  │  │   - Background: Diagonal gradient #1A73E8 → #4285F4  │   │            │
│  │  │   - Typography: Google Sans 72pt white headline      │   │            │
│  │  │   - Layout: Centered, 70% visual weight on headline  │   │            │
│  │  │   - Reference this image for style inspiration"      │   │            │
│  │  └──────────────────────────────────────────────────────┘   │            │
│  └─────────────────────────────────────────────────────────────┘            │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────┐            │
│  │  Generate with Gemini 2.5 Flash Image                       │            │
│  │  ┌──────────────────────────────────────────────────────┐   │            │
│  │  │  Input:                                              │   │            │
│  │  │  • Prompt (detailed instructions)                    │   │            │
│  │  │  • Reference image (from matchMap)                   │   │            │
│  │  │  • Strategy: "full-recreate"                         │   │            │
│  │  │                                                       │   │            │
│  │  │  Gemini's Decision:                                  │   │            │
│  │  │  • Analyzes reference image                          │   │            │
│  │  │  • Understands style, colors, layout                 │   │            │
│  │  │  • Creates NEW slide inspired by reference           │   │            │
│  │  │  • Applies new content from prompt                   │   │            │
│  │  │  • Maintains brand consistency                       │   │            │
│  │  │                                                       │   │            │
│  │  │  Output: PNG image (1920x1080)                       │   │            │
│  │  └──────────────────────────────────────────────────────┘   │            │
│  └─────────────────────────────────────────────────────────────┘            │
│                                                                              │
│  Repeat for slides 2-8...                                                   │
│                                                                              │
│  Final Output: 8 slides generated ✅                                         │
│  • 7 slides: full-recreate strategy                                         │
│  • 1 slide: input-modify strategy                                           │
│  • All match scores: 95-98%                                                 │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RESULT DELIVERY                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  • User sees 8 slides in editor                                             │
│  • Each slide maintains brand consistency from references                   │
│  • FloatingActionBubble appears with export options                         │
│  • Session log downloaded automatically                                     │
│  • browserLogger stores all events in localStorage                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Logging & Monitoring Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LOGGING SYSTEM                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │  Browser Console (Real-time tail -f)                     │               │
│  │  • All logs appear instantly                             │               │
│  │  • Color-coded by level (INFO/WARN/ERROR/DEBUG)          │               │
│  │  • Structured with timestamps                            │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │  localStorage (Persistent)                               │               │
│  │  • Last 1000 log entries                                 │               │
│  │  • Survives page reloads                                 │               │
│  │  • Cleared only manually                                 │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │  window.deckrLogs API                                    │               │
│  │  • printAll() - View all logs                            │               │
│  │  • download() - Export as .log file                      │               │
│  │  • clear() - Clear all logs                              │               │
│  │  • getAll() - Get logs programmatically                  │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────┐               │
│  │  Session Logger (Existing)                               │               │
│  │  • Downloads .md file after each generation              │               │
│  │  • Complete session report                               │               │
│  │  • Includes all specs, matches, and results              │               │
│  └──────────────────────────────────────────────────────────┘               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
USER                 FIREBASE              GEMINI API           BROWSER
 │                      │                      │                  │
 │ Upload PDF           │                      │                  │
 ├─────────────────────>│                      │                  │
 │                      │ Store 37 images      │                  │
 │                      │ Store metadata       │                  │
 │                      │                      │                  │
 │ Paste content        │                      │                  │
 │ Click "Generate"     │                      │                  │
 ├──────────────────────┼──────────────────────┼─────────────────>│
 │                      │                      │                  │ Show modal
 │                      │                      │                  │<─────────
 │ Select "Templates"   │                      │                  │
 ├──────────────────────┼──────────────────────┼─────────────────>│
 │                      │                      │                  │
 │                      │ Load references      │                  │
 │                      │<─────────────────────┼──────────────────│
 │                      │                      │                  │
 │                      │                      │ Master Planning  │
 │                      │                      │<─────────────────│
 │                      │                      │ (Gemini 2.5 Pro) │
 │                      │                      │                  │
 │                      │                      │ 8 slide specs    │
 │                      │                      ├─────────────────>│
 │                      │                      │                  │
 │                      │                      │ Categorize refs  │
 │                      │                      │<─────────────────│
 │                      │                      │ (37 API calls)   │
 │                      │                      │                  │
 │                      │                      │ Categories       │
 │                      │                      ├─────────────────>│
 │                      │                      │                  │
 │                      │                      │ Match slides     │
 │                      │                      │<─────────────────│
 │                      │                      │ (1 API call)     │
 │                      │                      │                  │
 │                      │                      │ Match results    │
 │                      │                      ├─────────────────>│
 │                      │                      │                  │
 │                      │                      │ Analyze refs     │
 │                      │                      │<─────────────────│
 │                      │                      │ (8 API calls)    │
 │                      │                      │                  │
 │                      │                      │ Blueprints       │
 │                      │                      ├─────────────────>│
 │                      │                      │                  │
 │                      │                      │ Generate slide 1 │
 │                      │                      │<─────────────────│
 │                      │                      │ (Gemini Flash)   │
 │                      │                      │                  │
 │                      │                      │ Slide 1 PNG      │
 │                      │                      ├─────────────────>│
 │                      │                      │                  │
 │                      │                      │ ... (slides 2-8) │
 │                      │                      │                  │
 │ View 8 slides        │                      │                  │
 │<─────────────────────┼──────────────────────┼──────────────────│
 │                      │                      │                  │
```

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Components Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DesignerModeGenerator.tsx (Main Orchestrator)                  │
│  ├─ GenerationModeSelector (Modal)                              │
│  ├─ FloatingActionBubble (Post-generation actions)              │
│  └─ SessionInspectorPanel (Debug panel)                         │
│                                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Services Layer                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  designerOrchestrator.ts                                        │
│  ├─ generateDesignerOutline() → Master Planning                 │
│  └─ Calls Gemini 2.5 Pro                                        │
│                                                                  │
│  referenceMatchingEngine.ts                                     │
│  ├─ quickCategorizeReference() → Categorize each reference      │
│  ├─ matchReferencesToSlides() → Match slides to references      │
│  └─ Calls Gemini 2.5 Pro                                        │
│                                                                  │
│  deepReferenceAnalyzer.ts                                       │
│  ├─ analyzeReferenceSlide() → Extract design blueprint          │
│  └─ Calls Gemini 2.5 Pro Vision                                 │
│                                                                  │
│  referenceStrategyDecider.ts                                    │
│  ├─ decideGenerationStrategy() → Modify vs Recreate             │
│  └─ Calls Gemini 2.5 Pro                                        │
│                                                                  │
│  outlineParser.ts                                               │
│  └─ buildPromptFromSpec() → Build detailed prompts              │
│                                                                  │
│  geminiService.ts                                               │
│  ├─ createSlideFromPrompt() → Generate slide image              │
│  └─ Calls Gemini 2.5 Flash Image                                │
│                                                                  │
│  firestoreService.ts                                            │
│  ├─ batchAddToStyleLibrary() → Upload references                │
│  └─ getStyleLibrary() → Load references                         │
│                                                                  │
│  sessionLogger.ts                                               │
│  └─ autoSaveSession() → Download session report                 │
│                                                                  │
│  browserLogger.ts (NEW)                                         │
│  ├─ info() / warn() / error() / debug()                         │
│  ├─ download() → Export logs                                    │
│  └─ Stores in localStorage                                      │
│                                                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Firebase Storage                                               │
│  └─ users/{uid}/styleLibrary/*.png                              │
│                                                                  │
│  Firebase Firestore                                             │
│  └─ users/{uid}/styleLibrary/{id}                               │
│                                                                  │
│  Google Gemini API                                              │
│  ├─ gemini-2.5-pro (Planning, Matching, Analysis)               │
│  └─ gemini-2.5-flash-image (Slide Generation)                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## API Call Sequence

```
Generation of 8-slide deck with 37 references:

1. Master Planning:
   └─ 1 × Gemini 2.5 Pro (thinking mode)
      Input: User notes
      Output: 8 slide specifications

2. Reference Categorization:
   └─ 37 × Gemini 2.5 Pro Vision (parallel)
      Input: Each reference image
      Output: Category (title/content/data-viz/image-content/closing)

3. Reference Matching:
   └─ 1 × Gemini 2.5 Pro
      Input: 8 slide specs + 37 categorized references
      Output: 8 matches with scores

4. Deep Analysis:
   └─ 8 × Gemini 2.5 Pro Vision (sequential)
      Input: Matched reference image
      Output: Design blueprint

5. Slide Generation:
   └─ 8 × Gemini 2.5 Flash Image (sequential)
      Input: Prompt + reference image + blueprint
      Output: Slide PNG

Total API Calls: 1 + 37 + 1 + 8 + 8 = 55 API calls
Total Time: ~4-5 minutes
Total Cost: ~$0.30-0.40 per deck
```

## Success Metrics (Your Production Run)

```
✅ PDF Upload: 37 pages → Firebase Storage + Firestore
✅ Master Planning: 8 slide specifications generated
✅ Categorization: 37 references categorized (some 503 errors, fell back to default)
✅ Matching: 8/8 slides matched (100% success rate)
✅ Match Quality: 95-98% scores (excellent)
✅ Strategies: 7 full-recreate, 1 input-modify
✅ Generation: 8 slides created in Template Mode
✅ Brand Consistency: Perfect (all used Google Cloud references)
```
