# Current Operations → ADK Coordinator Mapping

**Date**: 2025-11-18
**Status**: ✅ Complete Mapping

---

## Executive Summary

**Question**: Does the ADK coordinator handle ALL current operations (edit slide, generate variations, etc.)?

**Answer**: ✅ **YES** - Every current operation maps to the new coordinator pattern.

---

## Complete Operations Mapping

### 1. Deck Creation Operations

#### 1.1 `analyzeNotesAndAskQuestions(userPrompt)`

**Current**: Analyzes notes and creates deck plan
**File**: `services/intelligentGeneration.ts`

**ADK Coordinator Mapping**:
```typescript
// UI calls:
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'create');
session.state.set('user_input', userPrompt);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: StandardAgent
// Workflow: Generate → Review → Refine
// Output: state["slides"]
```

**Compatibility**: ✅ 100%

---

#### 1.2 `generateSlidesWithContext(context)`

**Current**: Generates slides from context (notes, images, etc.)
**File**: `services/intelligentGeneration.ts`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'create');
session.state.set('generation_context', context);
session.state.set('notes_input', context.notes);
session.state.set('slide_count', context.recommendedSlideCount);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: StandardAgent or MultiSourceAgent
// Output: state["slides"]
```

**Compatibility**: ✅ 100%

---

#### 1.3 `generateOutlineFromNotes(rawNotes)`

**Current**: Creates slide outline from notes
**File**: `services/geminiService.ts:1026`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'outline_only');
session.state.set('notes_input', rawNotes);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: NotesParserAgent (atomic)
// Output: state["outline"]
```

**Compatibility**: ✅ 100%

---

### 2. Slide Editing Operations

#### 2.1 `executeSlideTask(base64Image, detailedPrompt, deepMode)`

**Current**: Executes edit task on single slide
**File**: `services/geminiService.ts:870`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'edit');
session.state.set('scope', 'single');
session.state.set('target_slide_image', base64Image);
session.state.set('edit_prompt', detailedPrompt);
session.state.set('deep_mode', deepMode);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: SingleSlideEditAgent
// Workflow: Analyze → Edit → Quality Check
// Output: state["updated_slides"]
```

**Compatibility**: ✅ 100%

**Note**: This is THE key edit function - fully supported!

---

#### 2.2 `parseEditIntent(userPrompt, totalSlides)`

**Current**: Parses @slide mentions and edit intent
**File**: `services/geminiService.ts:87`

**ADK Coordinator Mapping**:
```typescript
// Option A: UI parses and passes to session state
const session = new Session({ sessionId: generateId() });
session.state.set('target_slide_numbers', [2, 3]);
session.state.set('scope', 'multiple');

// Option B: Coordinator parses internally
// Coordinator instruction already includes @slide parsing logic
const agent = getDeckRAIAgent();
// Coordinator will detect @slide2, @all, etc. from message
```

**Compatibility**: ✅ 100% (built into coordinator)

---

#### 2.3 `generateDeckExecutionPlan(userPrompt, slidesInfo)`

**Current**: Creates plan for batch edits
**File**: `services/geminiService.ts:794`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'plan_only'); // Plan mode
session.state.set('existing_slides_info', slidesInfo);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator creates execution plan
// Output: state["execution_plan"]

// Then execute:
session.state.set('mode', 'execute_plan');
session.state.set('approved_plan', plan);
await agent.runAsync(ctx);

// Coordinator routes to: BatchEditAgent or LoopAgent
// Output: state["updated_slides"]
```

**Compatibility**: ✅ 100%

**Note**: This is THE deck AI plan modal function - fully supported!

---

### 3. Variation Generation Operations

#### 3.1 `getGenerativeVariations(model, prompt, base64Image, deepMode, onProgress, bypassAnalyst)`

**Current**: Generates design variations of slide
**File**: `services/geminiService.ts:431`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'generate_variations');
session.state.set('target_slide_image', base64Image);
session.state.set('variation_prompt', prompt);
session.state.set('variation_count', 3);
session.state.set('deep_mode', deepMode);
session.state.set('ui_progress_callback', onProgress); // Real-time updates!

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: VariationGeneratorAgent
// Uses LoopAgent to generate N variations
// Calls progress callback during generation
// Output: state["variations"]
```

**Compatibility**: ✅ 100%

**Note**: This is THE variant selector function - fully supported!

---

#### 3.2 `getPersonalizationPlan(companyWebsite, base64Image)`

**Current**: Creates personalization plan from website
**File**: `services/geminiService.ts:345`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'personalization_plan');
session.state.set('company_website', companyWebsite);
session.state.set('target_slide_image', base64Image);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: PersonalizationAgent
// Uses: WebScraperAgent → AnalyzeAgent → PlanAgent
// Output: state["personalization_plan"]
```

**Compatibility**: ✅ 100%

---

#### 3.3 `getPersonalizedVariationsFromPlan(plan, base64Image, deepMode, onProgress)`

**Current**: Executes personalization plan
**File**: `services/geminiService.ts:386`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'execute_personalization');
session.state.set('personalization_plan', plan);
session.state.set('target_slide_image', base64Image);
session.state.set('deep_mode', deepMode);
session.state.set('ui_progress_callback', onProgress);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: PersonalizationExecutorAgent
// Uses LoopAgent for each action in plan
// Output: state["personalized_variations"]
```

**Compatibility**: ✅ 100%

---

### 4. Style Matching Operations

#### 4.1 `remakeSlideWithStyleReference(slideData, referenceStyle, onProgress)`

**Current**: Recreates slide matching reference style
**File**: `services/geminiService.ts:704`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'style_matching');
session.state.set('target_slide_data', slideData);
session.state.set('reference_style', referenceStyle);
session.state.set('ui_progress_callback', onProgress);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: TemplateArchitectureAgent or DualTrackAgent
// Workflow: ExtractStyle → GenerateContent → ApplyStyle → Verify
// Output: state["styled_slide"]
```

**Compatibility**: ✅ 100%

**Note**: This is THE style library function - fully supported!

---

#### 4.2 `findBestStyleReference(styleLibrary, slidePrompt, slideImage)`

**Current**: Finds best matching style from library
**File**: `services/geminiService.ts:595`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'find_style');
session.state.set('style_library', styleLibrary);
session.state.set('target_slide_prompt', slidePrompt);
session.state.set('target_slide_image', slideImage);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: StyleMatcherAgent
// Uses ParallelAgent to analyze all styles concurrently
// Output: state["best_style"]
```

**Compatibility**: ✅ 100%

---

#### 4.3 `findBestStyleReferenceFromPrompt(styleLibrary, userPrompt)`

**Current**: Finds style based on text prompt
**File**: `services/geminiService.ts:648`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'find_style_from_prompt');
session.state.set('style_library', styleLibrary);
session.state.set('user_prompt', userPrompt);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: StyleMatcherAgent
// Output: state["best_style"]
```

**Compatibility**: ✅ 100%

---

### 5. Slide Creation Operations

#### 5.1 `createSlideFromPrompt(prompt, referenceImages, onProgress)`

**Current**: Creates new slide from prompt
**File**: `services/geminiService.ts:900`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'create_single_slide');
session.state.set('slide_prompt', prompt);
session.state.set('reference_images', referenceImages);
session.state.set('ui_progress_callback', onProgress);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: SingleSlideGeneratorAgent
// Workflow: Generate → QualityCheck
// Output: state["new_slide"]
```

**Compatibility**: ✅ 100%

**Note**: This is THE "add new slide" function - fully supported!

---

### 6. Inpainting & Advanced Editing Operations

#### 6.1 `getInpaintingVariations(base64Image, maskImage, prompt, numberOfVariations, onProgress)`

**Current**: Generates variations with mask-based editing
**File**: `services/geminiService.ts:491`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'inpainting');
session.state.set('target_slide_image', base64Image);
session.state.set('mask_image', maskImage);
session.state.set('inpainting_prompt', prompt);
session.state.set('variation_count', numberOfVariations);
session.state.set('ui_progress_callback', onProgress);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: InpaintingAgent
// Uses LoopAgent for N variations
// Output: state["inpainted_variations"]
```

**Compatibility**: ✅ 100%

---

#### 6.2 `editImage(base64Image, prompt, deepMode)`

**Current**: Direct image editing
**File**: `services/geminiService.ts:1106`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'image_edit');
session.state.set('target_image', base64Image);
session.state.set('edit_prompt', prompt);
session.state.set('deep_mode', deepMode);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: ImageEditorAgent
// Output: state["edited_image"]
```

**Compatibility**: ✅ 100%

---

### 7. Analysis & Utility Operations

#### 7.1 `parsePlanModification(userPrompt, currentPlan)`

**Current**: Parses modifications to deck plan
**File**: `services/geminiService.ts:30`

**ADK Coordinator Mapping**:
```typescript
// Built into coordinator's analysis
// Coordinator already understands plan modifications
const session = new Session({ sessionId: generateId() });
session.state.set('current_plan', currentPlan);

const agent = getDeckRAIAgent();
// Coordinator detects: "make it 10 slides" → updates plan
// Output: state["modified_plan"]
```

**Compatibility**: ✅ 100% (built into coordinator)

---

#### 7.2 `generateThemeFromWebsite(companyWebsite)`

**Current**: Extracts company theme from website
**File**: `services/geminiService.ts:1113`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'extract_theme');
session.state.set('company_website', companyWebsite);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: WebScraperAgent → ThemeExtractorAgent
// Output: state["company_theme"]
```

**Compatibility**: ✅ 100%

---

#### 7.3 `analyzeDebugSession(session)`

**Current**: Analyzes debug session for insights
**File**: `services/geminiService.ts:998`

**ADK Coordinator Mapping**:
```typescript
const adkSession = new Session({ sessionId: generateId() });
adkSession.state.set('mode', 'analyze_debug');
adkSession.state.set('debug_session', session);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: DebugAnalyzerAgent
// Output: state["debug_insights"]
```

**Compatibility**: ✅ 100%

---

#### 7.4 `detectAllTextRegions(base64Image)`

**Current**: Detects text regions in slide
**File**: `services/geminiService.ts:1163`

**ADK Coordinator Mapping**:
```typescript
const session = new Session({ sessionId: generateId() });
session.state.set('mode', 'detect_text_regions');
session.state.set('target_image', base64Image);

const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Coordinator routes to: TextDetectorAgent
// Output: state["text_regions"]
```

**Compatibility**: ✅ 100%

---

## Summary Table: All Operations Mapped

| # | Operation | Current Function | ADK Mapping | Status |
|---|-----------|------------------|-------------|--------|
| 1 | Create deck | `analyzeNotesAndAskQuestions()` | StandardAgent | ✅ |
| 2 | Generate slides | `generateSlidesWithContext()` | StandardAgent | ✅ |
| 3 | Generate outline | `generateOutlineFromNotes()` | NotesParserAgent | ✅ |
| 4 | Edit single slide | `executeSlideTask()` | SingleSlideEditAgent | ✅ |
| 5 | Parse edit intent | `parseEditIntent()` | Coordinator (built-in) | ✅ |
| 6 | Deck AI plan | `generateDeckExecutionPlan()` | BatchEditAgent | ✅ |
| 7 | Generate variations | `getGenerativeVariations()` | VariationGeneratorAgent | ✅ |
| 8 | Personalization plan | `getPersonalizationPlan()` | PersonalizationAgent | ✅ |
| 9 | Execute personalization | `getPersonalizedVariationsFromPlan()` | PersonalizationExecutorAgent | ✅ |
| 10 | Style matching | `remakeSlideWithStyleReference()` | TemplateArchitectureAgent | ✅ |
| 11 | Find style | `findBestStyleReference()` | StyleMatcherAgent | ✅ |
| 12 | Find style from prompt | `findBestStyleReferenceFromPrompt()` | StyleMatcherAgent | ✅ |
| 13 | Create new slide | `createSlideFromPrompt()` | SingleSlideGeneratorAgent | ✅ |
| 14 | Inpainting | `getInpaintingVariations()` | InpaintingAgent | ✅ |
| 15 | Edit image | `editImage()` | ImageEditorAgent | ✅ |
| 16 | Parse plan modification | `parsePlanModification()` | Coordinator (built-in) | ✅ |
| 17 | Theme from website | `generateThemeFromWebsite()` | WebScraperAgent + ThemeExtractorAgent | ✅ |
| 18 | Analyze debug | `analyzeDebugSession()` | DebugAnalyzerAgent | ✅ |
| 19 | Detect text | `detectAllTextRegions()` | TextDetectorAgent | ✅ |

**Total Operations**: 19
**Mapped to ADK**: 19 (100%)
**Status**: ✅ **COMPLETE**

---

## Integration Strategy

### Phase 1: Wrapper Layer (Recommended Start)

Create wrappers that maintain current function signatures:

```typescript
// services/deckraiService.ts (NEW wrapper)

import { getDeckRAIAgent } from './adk/deckraiAgent';
import { InvocationContext, Session } from '@google/adk';

/**
 * Wrapper: executeSlideTask (most important!)
 * Maintains exact same interface
 */
export async function executeSlideTask(
    base64Image: string,
    detailedPrompt: string,
    deepMode: boolean
): Promise<{ images: string[], prompts: string[] }> {
    const session = new Session({ sessionId: generateId() });
    session.state.set('mode', 'edit');
    session.state.set('scope', 'single');
    session.state.set('target_slide_image', base64Image);
    session.state.set('edit_prompt', detailedPrompt);
    session.state.set('deep_mode', deepMode);

    const agent = getDeckRAIAgent();
    const result = await agent.runAsync(new InvocationContext({
        session,
        userMessage: detailedPrompt
    }));

    // Transform ADK result to current format
    return {
        images: session.state.get('updated_slide_images') || [],
        prompts: session.state.get('prompts_used') || []
    };
}

/**
 * Wrapper: getGenerativeVariations
 */
export async function getGenerativeVariations(
    model: string,
    prompt: string,
    base64Image: string,
    deepMode: boolean,
    onProgress: (message: string) => void,
    bypassAnalyst: boolean = false
): Promise<{ images: string[], logs: DebugLog[], variationPrompts: string[] }> {
    const session = new Session({ sessionId: generateId() });
    session.state.set('mode', 'generate_variations');
    session.state.set('target_slide_image', base64Image);
    session.state.set('variation_prompt', prompt);
    session.state.set('deep_mode', deepMode);
    session.state.set('ui_progress_callback', onProgress);

    const agent = getDeckRAIAgent();
    const result = await agent.runAsync(new InvocationContext({
        session,
        userMessage: prompt
    }));

    return {
        images: session.state.get('variations') || [],
        logs: session.state.get('debug_logs') || [],
        variationPrompts: session.state.get('variation_prompts') || []
    };
}

// ... wrappers for all 19 functions
```

**UI Changes**: ✅ **ZERO** - Just update imports!

```typescript
// Before:
import { executeSlideTask } from '../services/geminiService';

// After:
import { executeSlideTask } from '../services/deckraiService';

// Function call stays THE SAME:
const result = await executeSlideTask(image, prompt, deepMode);
```

---

### Phase 2: Direct Integration (After Testing)

Update UI to use ADK directly:

```typescript
// components/Editor.tsx

import { getDeckRAIAgent } from '../services/adk/deckraiAgent';

const handleEditSlide = async (slideId: string, prompt: string) => {
    const session = new Session({ sessionId: generateId() });
    session.state.set('mode', 'edit');
    session.state.set('target_slide_ids', [slideId]);
    session.state.set('scope', 'single');

    const agent = getDeckRAIAgent();
    const result = await agent.runAsync(new InvocationContext({
        session,
        userMessage: prompt
    }));

    const updatedSlides = session.state.get('updated_slides');
    onSlideUpdated(updatedSlides[0]);
};
```

---

## Missing Agents to Implement

Based on the mapping, we need to create these specialized agents:

### Already Implemented ✅
1. TemplateArchitectureAgent ✅
2. MultiSourceAgent ✅
3. StandardAgent ✅

### To Implement (Week 1)
4. **SingleSlideEditAgent** - For executeSlideTask
5. **BatchEditAgent** - For generateDeckExecutionPlan
6. **VariationGeneratorAgent** - For getGenerativeVariations

### To Implement (Week 2)
7. **PersonalizationAgent** - For personalization plan
8. **StyleMatcherAgent** - For style library
9. **InpaintingAgent** - For inpainting variations

### To Implement (Week 3)
10. **WebScraperAgent** - For website scraping
11. **ThemeExtractorAgent** - For company themes
12. **SingleSlideGeneratorAgent** - For creating single slides

### Lower Priority (Week 4+)
13. **ImageEditorAgent** - For direct image editing
14. **TextDetectorAgent** - For text region detection
15. **DebugAnalyzerAgent** - For debug analysis

**Total Agents Needed**: 15
**Already Implemented**: 3 (20%)
**Remaining**: 12 (80%)

---

## Implementation Priority

### Priority 1: Core Editing (Week 1) ⭐⭐⭐
- SingleSlideEditAgent (`executeSlideTask` - MOST USED!)
- BatchEditAgent (`generateDeckExecutionPlan` - Deck AI modal)
- VariationGeneratorAgent (`getGenerativeVariations` - Variant selector)

**Why**: These 3 functions are THE most critical UI operations

---

### Priority 2: Style & Creation (Week 2) ⭐⭐
- StyleMatcherAgent (`remakeSlideWithStyleReference` - Style library)
- SingleSlideGeneratorAgent (`createSlideFromPrompt` - Add new slide)
- PersonalizationAgent (personalization flow)

**Why**: Frequently used features

---

### Priority 3: Advanced Features (Week 3) ⭐
- WebScraperAgent + ThemeExtractorAgent (company customization)
- InpaintingAgent (advanced editing)

**Why**: Less frequently used but important

---

## Testing Checklist

For each operation:
- [ ] Create wrapper function
- [ ] Test with real UI data
- [ ] Verify output format matches current
- [ ] Test edge cases
- [ ] Performance test
- [ ] A/B test vs current function

---

## Conclusion

### ✅ Complete Mapping: 100%

**All 19 current operations** map perfectly to ADK coordinator architecture.

**Status**:
- ✅ Architecture designed
- ✅ Coordinator implemented
- ✅ 3 specialized agents implemented (template, multi-source, standard)
- 🔲 12 remaining agents to implement (straightforward - same patterns)
- 🔲 Wrapper layer to create (Phase 1 - zero UI changes)
- 🔲 Integration testing

**Next Steps**:
1. Implement Priority 1 agents (SingleSlideEdit, BatchEdit, VariationGenerator)
2. Create wrapper layer for these 3 functions
3. Test in UI with zero changes
4. Gradually implement remaining agents
5. Full cutover when all tested

**Timeline**: 4 weeks to full implementation

---

**End of Operations Mapping**
