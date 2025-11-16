# GOOGLE ADK MIGRATION REPORT
## DeckRAI: Gemini API to Google ADK Migration Guide

**Version**: 1.0
**Date**: 2025-11-16
**Target Branch**: `feature/unified-editor-chat-design`
**Migration Type**: Gemini API (@google/genai) → Google Agent Development Kit (ADK)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [ADK Architecture Overview](#adk-architecture-overview)
4. [File-by-File Migration Instructions](#file-by-file-migration-instructions)
5. [ADK Agent Patterns Mapping](#adk-agent-patterns-mapping)
6. [Implementation Checklist](#implementation-checklist)
7. [Testing Strategy](#testing-strategy)
8. [Risk Mitigation](#risk-mitigation)

---

## Executive Summary

### Current State
- **Total LLM Calls**: 47+ across 11 files
- **Models Used**: 6 different Gemini models (2.5-pro, 2.5-flash, 2.5-flash-image, 2.0-flash-exp, 2.5-flash-lite, Imagen 4)
- **Primary Framework**: Direct `@google/genai` SDK calls
- **Architecture**: Multi-agent patterns (manual orchestration)
- **Special Features**: Google Search tool (3 uses), Image generation (responseModalities), Thinking budgets (up to 32768 tokens)

### Target State
- **Framework**: Google ADK (Agent Development Kit)
- **Agent Types**: LlmAgent, ParallelAgent, SequentialAgent
- **Orchestration**: ADK-native sub-agent hierarchy
- **Benefits**:
  - Native multi-agent support
  - Built-in state management
  - Better orchestration control
  - Improved parallelization
  - Standardized agent patterns

### Migration Complexity
- **Easy (20 calls)**: Simple text generation → Direct LlmAgent conversion
- **Medium (15 calls)**: Image generation → Requires LlmAgent + external image service
- **Hard (12 calls)**: Parallel orchestration → Requires ParallelAgent refactoring

---

## Current Architecture Analysis

### Architecture Pattern Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INPUT (Chat/Editor)                  │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                ┌─────────────────┴─────────────────┐
                │                                   │
        ┌───────▼─────────┐              ┌────────▼────────┐
        │  Chat Mode      │              │  Editor Mode    │
        │  (Smart AI)     │              │  (Edit/Inpaint) │
        └───────┬─────────┘              └────────┬────────┘
                │                                 │
        ┌───────▼─────────────────────────────────▼────────┐
        │         GEMINI SERVICE (Central Hub)             │
        │  - Intent Parsing (gemini-2.0-flash-exp)        │
        │  - Content Analysis (gemini-2.5-flash)          │
        │  - Strategic Planning (gemini-2.5-pro)          │
        │  - Image Generation (gemini-2.5-flash-image)    │
        └───────┬──────────────────────────────────────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
┌───▼──────┐ ┌─▼────────┐ ┌▼─────────────┐
│Designer  │ │Reference │ │Intelligent   │
│Orchestr. │ │Matching  │ │Generation    │
│(Parallel)│ │Engine    │ │(Q&A Flow)    │
└──────────┘ └──────────┘ └──────────────┘
```

### Key Service Files

| File | Lines | LLM Calls | Complexity |
|------|-------|-----------|------------|
| `geminiService.ts` | 1290 | 23 | High |
| `designerOrchestrator.ts` | 667 | 2-N (parallel) | Very High |
| `intelligentGeneration.ts` | 298 | 2 | Medium |
| `referenceMatchingEngine.ts` | 381 | 2 | Medium |
| `referenceStrategyDecider.ts` | 362 | 1 | Medium |
| `deepReferenceAnalyzer.ts` | 344 | 1 | Medium |
| `architectureSlideGenerator.ts` | 300 | 2 | Low |
| `titleSlideGenerator.ts` | 151 | 1 | Low |
| `designAssetGenerator.ts` | 186 | 1 | Low |
| `vibeDetection.ts` | ~150 | 1 | Low |
| `DesignerModeGenerator.tsx` | ~733 | 1 | Medium |

---

## ADK Architecture Overview

### ADK Core Concepts

```python
from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import google_search
```

### Agent Types

1. **LlmAgent**: Single LLM-powered agent with tools
   ```python
   agent = LlmAgent(
       name="my_agent",
       model="gemini-2.0-flash",  # or gemini-2.5-pro
       instruction="You are an expert...",
       tools=[google_search],
       sub_agents=[child_agent_1, child_agent_2]  # Hierarchical structure
   )
   ```

2. **ParallelAgent**: Executes sub-agents concurrently
   ```python
   parallel = ParallelAgent(
       name="parallel_processor",
       sub_agents=[agent1, agent2, agent3]  # All run simultaneously
   )
   ```

3. **SequentialAgent**: Executes sub-agents in order
   ```python
   sequential = SequentialAgent(
       name="pipeline",
       sub_agents=[step1, step2, step3]  # Run one after another
   )
   ```

### Key ADK Features for DeckRAI

1. **Sub-Agent Delegation**: Native coordinator pattern
2. **Parallel Execution**: Built-in ParallelAgent
3. **State Management**: InvocationContext with shared state
4. **Tool Integration**: Google Search tool
5. **Model Agnostic**: Support for Gemini 2.0/2.5 models

---

## File-by-File Migration Instructions

### File 1: `services/geminiService.ts` (1290 lines, 23 LLM calls)

**Migration Strategy**: Convert to ADK agent service with multiple specialized agents

#### Current Structure
```typescript
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// 23 different functions calling ai.models.generateContent()
```

#### Target ADK Structure
```python
# services/adk_agents/gemini_service_agents.py

from google.adk.agents import LlmAgent
from google.adk.tools import google_search

# Agent 1: Intent Parser
intent_parser = LlmAgent(
    name="IntentParser",
    model="gemini-2.0-flash",  # Was: gemini-2.0-flash-exp
    instruction="""You are an intent parser for a slide deck editing system.
    Analyze user's request and determine if this is an EDIT or CREATE request.""",
)

# Agent 2: Plan Modification Analyzer
plan_modifier = LlmAgent(
    name="PlanModifier",
    model="gemini-2.0-flash",
    instruction="""You are analyzing a user's request to modify a presentation plan.
    Extract changes to slide count, style, and audience.""",
)

# Agent 3: Design Analyst
design_analyst = LlmAgent(
    name="DesignAnalyst",
    model="gemini-2.5-flash",
    instruction="""You are a world-class AI agent acting as a "Design Analyst".
    Analyze a slide image and user's request to create a perfect, actionable prompt.""",
)

# Agent 4: QA Inspector (with sub-agent pattern)
qa_inspector = LlmAgent(
    name="QAInspector",
    model="gemini-2.5-flash",
    instruction="""You are a meticulous "Quality Assurance Inspector" AI.
    Check newly generated images for errors by comparing to original.""",
)

# Agent 5: Personalization Strategist (with Google Search)
personalization_strategist = LlmAgent(
    name="PersonalizationStrategist",
    model="gemini-2.5-pro",
    instruction="""You are a "Personalization Strategist" AI.
    Create a JSON object outlining actions to personalize a slide for a target company.""",
    tools=[google_search],  # Uses Google Search to research company
)

# Agent 6: Content Extraction Bot
content_extractor = LlmAgent(
    name="ContentExtractor",
    model="gemini-2.5-flash",
    instruction="""You are a "Content Extraction Bot" specializing in presentation slides.
    Extract slide content into structured JSON.""",
)

# Agent 7: Style Scout
style_scout = LlmAgent(
    name="StyleScout",
    model="gemini-2.5-pro",
    instruction="""You are a "Style Scout" AI agent, expert in presentation design.
    Find the single best style reference from a provided library.""",
)

# Agent 8: Master Presentation Strategist (with Google Search)
master_strategist = LlmAgent(
    name="MasterStrategist",
    model="gemini-2.5-pro",
    instruction="""You are a "Master Presentation Strategist" AI.
    Create a JSON execution plan to modify a slide deck.""",
    tools=[google_search],
)

# Agent 9: Presentation Content Strategist
content_strategist = LlmAgent(
    name="ContentStrategist",
    model="gemini-2.5-pro",
    instruction="""You are an expert "Presentation Content Strategist".
    Transform raw notes into a clear, concise slide deck outline.""",
)

# Agent 10: Prompt Enhancer
prompt_enhancer = LlmAgent(
    name="PromptEnhancer",
    model="gemini-2.5-pro",
    instruction="""You are a "Presentation Prompt Enhancer" AI.
    Enrich basic prompts to create high-quality, slide-worthy prompts.""",
)

# Agent 11: Brand Analyst (with Google Search)
brand_analyst = LlmAgent(
    name="BrandAnalyst",
    model="gemini-2.5-pro",
    instruction="""You are an expert "Brand Analyst" AI.
    Analyze company website to extract core visual branding elements.""",
    tools=[google_search],
)

# Agent 12: Text Detector
text_detector = LlmAgent(
    name="TextDetector",
    model="gemini-2.5-flash",
    instruction="""Analyze presentation slide image and identify text elements
    with their bounding boxes.""",
)
```

#### Line-by-Line Migration Map

| Function | Lines | Current Model | ADK Agent | Priority |
|----------|-------|--------------|-----------|----------|
| `parsePlanModification` | 30-85 | gemini-2.0-flash-exp | `plan_modifier` | High |
| `parseEditIntent` | 87-148 | gemini-2.0-flash-exp | `intent_parser` | High |
| `verifyImage` | 182-227 | gemini-2.5-flash | `qa_inspector` | Medium |
| `generateSingleImage` (Imagen) | 247-265 | imagen-4.0-generate-001 | **External Service** | Critical |
| `generateSingleImage` (Gemini) | 274-342 | gemini-2.5-flash-image | **External Service** | Critical |
| `getPersonalizationPlan` | 345-384 | gemini-2.5-pro + Search | `personalization_strategist` | High |
| `getPersonalizedVariationsFromPlan` | 386-428 | gemini-2.5-flash-image | **Image Service** + ADK orchestration | High |
| `getGenerativeVariations` (Analyst) | 448-451 | gemini-2.5-flash | `design_analyst` | High |
| `getGenerativeVariations` (Artist) | 467-468 | gemini-2.5-flash-image | **Image Service** | High |
| `getInpaintingVariations` | 491-538 | gemini-2.5-flash-image | **Image Service** | High |
| `extractContentAsJson` | 544-593 | gemini-2.5-flash | `content_extractor` | High |
| `findBestStyleReference` | 595-646 | gemini-2.5-pro | `style_scout` | Medium |
| `findBestStyleReferenceFromPrompt` | 648-702 | gemini-2.5-pro | `style_scout` | Medium |
| `remakeSlideWithStyleReference` | 704-787 | gemini-2.5-flash-image | **Image Service** + `content_extractor` + `style_scout` | High |
| `generateDeckExecutionPlan` | 794-868 | gemini-2.5-pro + Search | `master_strategist` | High |
| `executeSlideTask` | 870-898 | gemini-2.5-flash-image | **Image Service** | High |
| `createSlideFromPrompt` | 900-995 | gemini-2.5-flash-image | **Image Service** | Critical |
| `analyzeDebugSession` | 998-1020 | gemini-2.5-pro | `LlmAgent("DebugAnalyst")` | Low |
| `generateOutlineFromNotes` | 1026-1062 | gemini-2.5-pro | `content_strategist` | High |
| `enhanceOutlinePrompts` | 1065-1101 | gemini-2.5-pro | `prompt_enhancer` | Medium |
| `generateThemeFromWebsite` | 1113-1142 | gemini-2.5-pro + Search | `brand_analyst` | Medium |
| `detectAllTextRegions` | 1163-1230 | gemini-2.5-flash | `text_detector` | Medium |
| `detectClickedText` | 1232-1289 | gemini-2.5-flash | `text_detector` | Medium |

#### Critical Issue: Image Generation

**Problem**: ADK with Gemini models does NOT support `responseModalities: [Modality.IMAGE]`

**Current Image Generation Calls** (12 total):
1. `generateSingleImage` - Core image generation
2. `getPersonalizedVariationsFromPlan` - Personalization edits
3. `getGenerativeVariations` - Slide variations
4. `getInpaintingVariations` - Masked region edits
5. `remakeSlideWithStyleReference` - Style reference recreation
6. `executeSlideTask` - Deck task execution
7. `createSlideFromPrompt` - New slide creation
8. `titleSlideGenerator.ts` - Title slide edits
9. `designAssetGenerator.ts` - Asset generation

**Solution Options**:

**Option A: Keep Imagen/Gemini Image API Separate**
```python
# ADK for text/planning/analysis
# Direct @google/genai for image generation

# services/adk_agents/gemini_service_agents.py
# (All text-based agents here)

# services/image_generation_service.py
# (Keep existing @google/genai image generation)

# Orchestration in TypeScript:
async function createSlideWithADK(prompt, imageData) {
    // 1. Use ADK agent for prompt refinement
    const refinedPrompt = await adkDesignAnalyst.invoke(prompt);

    // 2. Use existing image generation
    const image = await generateSingleImage(model, imageData, refinedPrompt);

    return image;
}
```

**Option B: Integrate External Image Service**
```python
# Use Imagen via Vertex AI separately
from google.cloud import aiplatform

# Create LlmAgent that calls Imagen as a tool
imagen_tool = create_imagen_tool()  # Custom tool wrapper

artist_agent = LlmAgent(
    name="ArtistAgent",
    model="gemini-2.5-flash",
    tools=[imagen_tool],
    instruction="Generate image based on refined prompt using Imagen tool"
)
```

**Recommendation**: **Option A** - Keep image generation separate for now
- Lower migration risk
- Preserves existing quality
- Allows incremental ADK adoption
- Can refactor to Option B later

#### Migration Steps for `geminiService.ts`

1. **Create ADK Agent Definitions** (`services/adk_agents/gemini_service_agents.py`)
   - Define 12 specialized agents (see code above)
   - Set up proper instructions from existing prompts
   - Configure tools (google_search) where needed

2. **Create ADK Service Interface** (`services/adkService.ts`)
   ```typescript
   // TypeScript interface to Python ADK agents
   import { spawn } from 'child_process';

   export class ADKService {
       async invokeAgent(agentName: string, input: any): Promise<any> {
           // Call Python ADK agent via subprocess/API
           // Parse JSON response
           // Return to TypeScript
       }
   }
   ```

3. **Refactor Functions One-by-One**
   - Start with simple text-only functions
   - Replace `ai.models.generateContent()` with `adkService.invokeAgent()`
   - Test each function thoroughly
   - Keep image generation using existing code

4. **Update Tests**
   - Create ADK agent tests
   - Update integration tests
   - Verify all 23 functions work correctly

---

### File 2: `services/designerOrchestrator.ts` (667 lines, 2-N parallel LLM calls)

**Migration Strategy**: **Perfect fit for ParallelAgent pattern**

#### Current Architecture
```typescript
// Phase 1: Master Planning Agent (sequential)
const masterResponse = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: masterPrompt,
    config: {thinkingConfig: {thinkingBudget: 16384}}
});

// Phase 2: Parallel Slide Agents
const slidePromises = slideBriefs.map((brief, index) =>
    ai.models.generateContent({
        model: "gemini-2.5-pro",
        contents: slidePrompt,
        config: {thinkingConfig: {thinkingBudget: 8192}}
    })
);
const slideResults = await Promise.all(slidePromises);
```

#### Target ADK Architecture
```python
# services/adk_agents/designer_orchestrator_agents.py

from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent

# Master Planning Agent
master_planner = LlmAgent(
    name="MasterPlanner",
    model="gemini-2.5-pro",
    instruction="""You are a master presentation architect.
    Create the foundation for a presentation deck including:
    - Brand research (with color codes, typography)
    - Deck architecture (slide planning)
    - Design system (visual system)
    - Slide briefs (detailed specifications)""",
    output_key="master_plan"  # Store in state
)

# Function to create slide agents dynamically
def create_slide_agent(slide_number: int) -> LlmAgent:
    return LlmAgent(
        name=f"SlideAgent_{slide_number}",
        model="gemini-2.5-pro",
        instruction="""You are a specialist slide designer creating ONE detailed slide specification.
        Generate complete specification with visual hierarchy, architecture, and design rationale.""",
        output_key=f"slide_{slide_number}_spec"
    )

# Parallel Execution Pattern
def create_designer_orchestrator(slide_count: int):
    # Create N slide agents
    slide_agents = [create_slide_agent(i) for i in range(1, slide_count + 1)]

    # Parallel agent for simultaneous slide generation
    parallel_slide_generator = ParallelAgent(
        name="ParallelSlideGenerator",
        sub_agents=slide_agents
    )

    # Sequential workflow: Master → Parallel Slides
    designer_workflow = SequentialAgent(
        name="DesignerWorkflow",
        sub_agents=[
            master_planner,           # Step 1: Create master plan
            parallel_slide_generator  # Step 2: Generate all slides in parallel
        ]
    )

    return designer_workflow
```

#### Migration Steps

1. **Create Dynamic Agent Factory**
   ```python
   # services/adk_agents/designer_factory.py

   def create_designer_orchestrator(
       company_name: str,
       content: str,
       audience: str,
       goal: str,
       slide_count: int
   ) -> SequentialAgent:
       # Build master planner with context
       master_planner = LlmAgent(...)

       # Build N parallel slide agents
       slide_agents = [create_slide_agent(i) for i in range(slide_count)]

       # Compose workflow
       workflow = SequentialAgent(
           sub_agents=[master_planner, ParallelAgent(sub_agents=slide_agents)]
       )

       return workflow
   ```

2. **Replace TypeScript Orchestration**
   ```typescript
   // services/designerOrchestrator.ts - AFTER migration

   import { ADKService } from './adkService';

   export async function generateDesignerOutline(
       input: DesignerGenerationInput
   ): Promise<DesignerOutline> {
       const adkService = new ADKService();

       // Invoke ADK workflow
       const result = await adkService.invokeDesignerWorkflow({
           company_name: input.companyName,
           content: input.contentDescription,
           audience: input.audienceType,
           goal: input.presentationGoal,
           slide_count: input.slideCount
       });

       // Parse results from ADK state
       return parseDesignerOutline(result);
   }
   ```

3. **Handle Thinking Budgets**
   - **Current**: `thinkingConfig: {thinkingBudget: 16384}` for master, `8192` for slides
   - **ADK**: Configure via model parameters or agent config
   - **Research Needed**: Verify ADK support for thinking budgets

4. **Benefits of ADK Migration**
   - Native parallel execution (no manual Promise.all)
   - Built-in state management (pass master plan to slide agents)
   - Better error handling per agent
   - Progress tracking per slide agent
   - Easier to add review/critique agents later

---

### File 3: `services/intelligentGeneration.ts` (298 lines, 2 LLM calls)

**Migration Strategy**: Convert to ADK agents with highest thinking budget

#### Current Calls

1. **`analyzeNotesAndAskQuestions`** (Lines 27-124)
   - Model: `gemini-2.5-pro`
   - Thinking Budget: **32768** (maximum for best quality)
   - Purpose: Analyze notes and generate smart questions

2. **`generateSlidesWithContext`** (Lines 129-199)
   - Model: `gemini-2.5-pro`
   - Thinking Budget: **32768**
   - Purpose: Generate slide prompts with full context

#### Target ADK Agents

```python
# services/adk_agents/intelligent_generation_agents.py

# Agent 1: Intelligent Question Asker
question_generator = LlmAgent(
    name="IntelligentQuestionAsker",
    model="gemini-2.5-pro",
    instruction="""You are an Intelligent Presentation Assistant.
    Analyze user's notes and ask smart clarifying questions.

    Return JSON format:
    {
        "questions": [
            {"question": "...", "options": [...], "reasoning": "..."}
        ],
        "suggestions": {
            "recommendedSlideCount": X,
            "recommendedStyle": "...",
            "reasoning": "..."
        }
    }""",
    # TODO: Configure thinking budget (32768) if ADK supports
)

# Agent 2: Context-Aware Slide Generator
context_slide_generator = LlmAgent(
    name="ContextSlideGenerator",
    model="gemini-2.5-pro",
    instruction="""You are an expert Presentation Content Strategist.
    Transform raw notes into a professional slide deck outline.

    CRITICAL RULES:
    - Titles: 3-7 words
    - Bullets: 5-10 words
    - Max 30-50 words per slide
    - Return JSON array of slide prompts""",
    # TODO: Configure thinking budget (32768)
)
```

#### Migration Steps

1. **Verify ADK Thinking Budget Support**
   - Research if ADK supports extended thinking
   - If yes, configure per agent
   - If no, use model with highest capabilities

2. **Create Service Interface**
   ```typescript
   // services/intelligentGeneration.ts - AFTER migration

   export async function analyzeNotesAndAskQuestions(
       rawNotes: string
   ): Promise<QuestionAnalysis> {
       const adkService = new ADKService();

       const result = await adkService.invokeAgent(
           'IntelligentQuestionAsker',
           { raw_notes: rawNotes }
       );

       return parseQuestionAnalysis(result);
   }

   export async function generateSlidesWithContext(
       notes: string,
       audience: string,
       slideCount: number,
       style: string,
       tone: string
   ): Promise<string[]> {
       const adkService = new ADKService();

       const result = await adkService.invokeAgent(
           'ContextSlideGenerator',
           { notes, audience, slide_count: slideCount, style, tone }
       );

       return result.slide_prompts;
   }
   ```

3. **Test Quality**
   - Compare outputs before/after migration
   - Ensure 32768 token budget is preserved
   - Verify minimal text constraints work

---

### File 4: `services/referenceMatchingEngine.ts` (381 lines, 2 LLM calls)

**Migration Strategy**: Convert to specialized matching agents

#### Current Calls

1. **Intelligent Reference Matching** (Lines 168-171)
   - Model: `gemini-2.5-pro`
   - Purpose: Match slide specs to reference templates

2. **`quickCategorizeReference`** (Lines 259-313)
   - Model: `gemini-2.5-flash-lite`
   - Purpose: Quick categorization of reference slides

#### Target ADK Agents

```python
# services/adk_agents/reference_matching_agents.py

# Agent 1: Reference Matcher (Pro model for accuracy)
reference_matcher = LlmAgent(
    name="ReferenceMatcherPro",
    model="gemini-2.5-pro",
    instruction="""You are an expert presentation designer specializing in template matching.

    Analyze slide specifications and match them to reference templates based on:
    - Content type (40%): Data/process/concept/etc
    - Visual hierarchy (30%): Layout structure
    - Brand context (20%): Industry alignment
    - Layout (10%): Grid/flow pattern

    Return JSON with match scores and reasoning.""",
)

# Agent 2: Quick Categorizer (Lite model for speed)
quick_categorizer = LlmAgent(
    name="QuickCategorizer",
    model="gemini-2.5-flash",  # Note: -lite may not be available in ADK
    instruction="""Quickly categorize this reference slide into ONE category:
    - title
    - content
    - data-viz
    - image-content
    - closing

    Return only the category name.""",
)
```

#### Migration Notes

- **gemini-2.5-flash-lite**: May need to use `gemini-2.5-flash` if lite not available in ADK
- Match quality should be preserved
- Consider caching for repeated reference matching

---

### File 5: `services/referenceStrategyDecider.ts` (362 lines, 1 LLM call)

**Migration Strategy**: Single agent for strategy decision

#### Current Call

**`decideGenerationStrategy`** (Lines 147-263)
- Model: `gemini-2.5-pro`
- Purpose: Decide INPUT-MODIFY vs FULL-RECREATE strategy

#### Target ADK Agent

```python
# services/adk_agents/strategy_decider_agent.py

strategy_decider = LlmAgent(
    name="GenerationStrategyDecider",
    model="gemini-2.5-pro",
    instruction="""You are an AI image generation strategist.

    Analyze slide spec + blueprint + reference image to decide:
    - INPUT-MODIFY: Use reference as base, modify specific elements
    - FULL-RECREATE: Generate completely new image

    Decision factors:
    - Visual complexity ≥60 → INPUT-MODIFY
    - Layout compatibility ≥60 → INPUT-MODIFY
    - Content divergence ≤60 → INPUT-MODIFY

    Return JSON with strategy, confidence, reasoning, and analysis.""",
)
```

---

### File 6: `services/deepReferenceAnalyzer.ts` (344 lines, 1 LLM call)

**Migration Strategy**: Single agent for blueprint extraction

#### Current Call

**`analyzeReferenceSlide`** (Lines 166-225)
- Model: `gemini-2.5-pro`
- Purpose: Extract comprehensive design blueprint from reference

#### Target ADK Agent

```python
# services/adk_agents/reference_analyzer_agent.py

reference_analyzer = LlmAgent(
    name="DeepReferenceAnalyzer",
    model="gemini-2.5-pro",
    instruction="""You are an expert presentation designer analyzing reference slides.

    Extract comprehensive design blueprint:
    - Background (colors, complexity 1-5)
    - Content layout (structure)
    - Visual hierarchy (primary/secondary/tertiary)
    - Typography (fonts, sizes, weights)
    - Spacing (margins, padding)
    - Visual elements (icons, images, shapes)
    - Brand elements (logos, colors)
    - Generation strategy (prefer INPUT-MODIFY for complex backgrounds)

    Return detailed JSON blueprint.""",
)
```

---

### File 7: `services/architectureSlideGenerator.ts` (300 lines, 2 LLM calls)

**Migration Strategy**: Two simple agents for architecture detection/generation

#### Current Calls

1. **`detectArchitectureType`** (Lines 25-64)
   - Model: `gemini-2.0-flash-exp`
   - Purpose: Detect architecture pattern from prompt

2. **`generateArchitectureSlide`** (Lines 69-249)
   - Model: `gemini-2.0-flash-exp`
   - Purpose: Generate architecture slide specification

#### Target ADK Agents

```python
# services/adk_agents/architecture_agents.py

# Agent 1: Architecture Detector
architecture_detector = LlmAgent(
    name="ArchitectureDetector",
    model="gemini-2.0-flash",  # -exp may map to standard flash
    instruction="""You are an architecture expert. Identify architecture pattern from prompt.

    Patterns: microservices, event-driven, layered, mvc, client-server,
    peer-to-peer, serverless, pipeline, lambda, service-oriented,
    three-tier, distributed

    Return pattern name or "none".""",
)

# Agent 2: Architecture Slide Designer
architecture_designer = LlmAgent(
    name="ArchitectureSlideDesigner",
    model="gemini-2.0-flash",
    instruction="""You are a presentation designer specializing in technical architecture diagrams.

    Generate slide specification with:
    - Title
    - Layout approach
    - Components and relationships
    - Text content
    - Visual style guidelines
    - Design notes""",
)
```

---

### File 8: `services/titleSlideGenerator.ts` (151 lines, 1 LLM call)

**Migration Strategy**: Keep image generation, use ADK for text analysis if needed

#### Current Call

**`createTitleSlideFromTemplate`** (Lines 24-78)
- Model: `gemini-2.5-flash-image`
- Purpose: Edit template to change headline text

#### Migration Approach

**Keep existing implementation** - This is pure image editing
- No complex agent logic needed
- Direct image generation works fine
- Can integrate with ADK later if title text analysis needed

---

### File 9: `services/designAssetGenerator.ts` (186 lines, 1 LLM call)

**Migration Strategy**: Keep image generation

#### Current Call

**`generateDesignAsset`** (Lines 19-50)
- Model: `gemini-2.5-flash-image`
- Purpose: Generate custom design assets (blobs, icons)

#### Migration Approach

**Keep existing implementation** - Pure image generation
- No agent orchestration needed
- Works well as standalone service

---

### File 10: `components/DesignerModeGenerator.tsx` (733 lines, 1 LLM call)

**Migration Strategy**: Convert context extraction to ADK agent

#### Current Call

**`extractPresentationContext`** (Lines 133-293)
- Model: `gemini-2.5-flash`
- Thinking Budget: 8192
- Purpose: Extract presentation metadata from notes (LLM-based, not regex)

#### Target ADK Agent

```python
# services/adk_agents/context_extractor_agent.py

context_extractor = LlmAgent(
    name="PresentationContextExtractor",
    model="gemini-2.5-flash",
    instruction="""You are a presentation intelligence agent.
    Extract metadata and intent from raw notes (NOT using regex).

    Return JSON:
    {
        "myCompany": "...",
        "audienceCompany": "...",
        "audience": "...",
        "goal": "...",
        "presentationType": "..."
    }""",
    # TODO: Configure thinking budget (8192)
)
```

---

## ADK Agent Patterns Mapping

### Pattern 1: Simple Text Generation → LlmAgent

**Use Case**: Single LLM call with text input/output

**Before (Gemini API)**:
```typescript
const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt
});
const text = response.text.trim();
```

**After (ADK)**:
```python
agent = LlmAgent(
    name="MyAgent",
    model="gemini-2.5-pro",
    instruction="Your instructions here"
)

# Invoke via runner
runner = Runner(agent=agent, session_service=InMemorySessionService())
result = runner.run(user_input="User query")
```

**Affected Functions (20)**:
- `parsePlanModification`
- `parseEditIntent`
- `verifyImage` (text output)
- `extractContentAsJson`
- `findBestStyleReference`
- `findBestStyleReferenceFromPrompt`
- `analyzeDebugSession`
- `generateOutlineFromNotes`
- `enhanceOutlinePrompts`
- `generateThemeFromWebsite`
- `detectAllTextRegions`
- `detectClickedText`
- `getPersonalizationPlan` (text output)
- `generateDeckExecutionPlan`
- `analyzeNotesAndAskQuestions`
- `generateSlidesWithContext`
- `detectArchitectureType`
- `generateArchitectureSlide`
- `quickCategorizeReference`
- `extractPresentationContext`

---

### Pattern 2: Parallel Orchestration → ParallelAgent

**Use Case**: Multiple independent LLM calls that can run simultaneously

**Before (Gemini API)**:
```typescript
const promises = items.map(item =>
    ai.models.generateContent({model, contents: buildPrompt(item)})
);
const results = await Promise.all(promises);
```

**After (ADK)**:
```python
# Create multiple agents
agents = [
    LlmAgent(name=f"Agent_{i}", model="gemini-2.5-pro", instruction="...")
    for i in range(N)
]

# Parallel execution
parallel_workflow = ParallelAgent(
    name="ParallelWorkflow",
    sub_agents=agents
)

runner = Runner(agent=parallel_workflow, session_service=InMemorySessionService())
result = runner.run(user_input="Process all items")
```

**Affected Functions (2)**:
- `designerOrchestrator.ts` - Parallel slide agents (N agents, one per slide)
- `remakeSlideWithStyleReference` - 3 variations (can be parallel)

---

### Pattern 3: Sequential Pipeline → SequentialAgent

**Use Case**: Multi-step process where each step depends on previous

**Before (Gemini API)**:
```typescript
// Step 1: Analyst
const analystResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: analystPrompt
});
const refinedPrompt = analystResponse.text;

// Step 2: Artist (uses output from Step 1)
const artistResponse = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: refinedPrompt
});
```

**After (ADK)**:
```python
analyst_agent = LlmAgent(
    name="DesignAnalyst",
    model="gemini-2.5-flash",
    instruction="Refine user prompt into detailed visual plan",
    output_key="refined_prompt"  # Store in state
)

artist_agent = LlmAgent(
    name="Artist",
    model="gemini-2.5-flash",  # Note: Image gen needs special handling
    instruction="Generate image based on refined prompt"
)

pipeline = SequentialAgent(
    name="DesignPipeline",
    sub_agents=[analyst_agent, artist_agent]
)
```

**Affected Functions (1)**:
- `getGenerativeVariations` - Analyst → Artist pipeline

---

### Pattern 4: Coordinator with Sub-Agents → LlmAgent with sub_agents

**Use Case**: Master agent that delegates to specialized sub-agents

**Before (Manual Orchestration)**:
```typescript
// Master decides what to do
const masterPlan = await ai.models.generateContent({...});

// Then manually call appropriate sub-agent
if (masterPlan.action === 'personalize') {
    await getPersonalizationPlan();
} else if (masterPlan.action === 'redesign') {
    await remakeSlideWithStyleReference();
}
```

**After (ADK)**:
```python
# Define sub-agents
personalization_agent = LlmAgent(name="Personalizer", ...)
redesign_agent = LlmAgent(name="Redesigner", ...)

# Master coordinator
master_coordinator = LlmAgent(
    name="MasterCoordinator",
    model="gemini-2.5-pro",
    instruction="Decide which sub-agent to delegate to",
    sub_agents=[personalization_agent, redesign_agent]  # ADK handles routing
)
```

**Potential Use Cases**:
- `generateDeckExecutionPlan` (master) → `executeSlideTask` (worker)
- Chat mode routing to edit vs create

---

### Pattern 5: Self-Correction Loop → SequentialAgent with Conditional

**Use Case**: Generate → Verify → Re-generate if errors

**Before (Gemini API)**:
```typescript
// Generate
let response = await generateImage(prompt);

// Verify
const correction = await verifyImage(original, response, prompt);

// Re-generate if needed
if (correction) {
    response = await generateImage(correctedPrompt);
}
```

**After (ADK)**:
```python
# Option A: Loop Agent (if ADK supports)
verification_loop = LoopAgent(
    name="QALoop",
    sub_agents=[generate_agent, verify_agent],
    max_iterations=2,
    exit_condition=lambda state: state.get("verification") == "OK"
)

# Option B: Sequential with manual retry logic
# (Depends on ADK loop capabilities)
```

**Affected Functions (1)**:
- `generateSingleImage` in Deep Mode (lines 297-322)

---

### Pattern 6: Tool Integration → LlmAgent with tools

**Use Case**: Agent needs Google Search or other tools

**Before (Gemini API)**:
```typescript
const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: prompt,
    config: {
        tools: [{ googleSearch: {} }]
    }
});
```

**After (ADK)**:
```python
from google.adk.tools import google_search

agent = LlmAgent(
    name="ResearchAgent",
    model="gemini-2.5-pro",
    instruction="Research company and extract branding",
    tools=[google_search]  # ADK handles tool orchestration
)
```

**Affected Functions (3)**:
- `getPersonalizationPlan` - Research company website
- `generateDeckExecutionPlan` - Research for deck personalization
- `generateThemeFromWebsite` - Extract brand from website

---

## Implementation Checklist

### Phase 1: Foundation Setup (Week 1)

- [ ] **1.1 Install ADK Dependencies**
  ```bash
  # Python side
  pip install google-adk

  # TypeScript side (if ADK has TS support)
  # OR create Python microservice
  ```

- [ ] **1.2 Set Up ADK Service Architecture**
  - [ ] Create `services/adk_agents/` directory
  - [ ] Create base agent definitions file
  - [ ] Set up Python-TypeScript bridge (subprocess, HTTP API, or gRPC)

- [ ] **1.3 Create ADK Service Interface**
  - [ ] `services/adkService.ts` - TypeScript interface to Python ADK
  - [ ] Define message format (JSON)
  - [ ] Implement invoke methods

### Phase 2: Simple Agent Migration (Week 2)

- [ ] **2.1 Migrate Intent Parsers**
  - [ ] Create `intent_parser` agent (`parseEditIntent`)
  - [ ] Create `plan_modifier` agent (`parsePlanModification`)
  - [ ] Test against existing TypeScript tests
  - [ ] Compare outputs for quality

- [ ] **2.2 Migrate Content Agents**
  - [ ] Create `content_extractor` agent (`extractContentAsJson`)
  - [ ] Create `content_strategist` agent (`generateOutlineFromNotes`)
  - [ ] Create `prompt_enhancer` agent (`enhanceOutlinePrompts`)
  - [ ] Verify JSON parsing works correctly

- [ ] **2.3 Migrate Analysis Agents**
  - [ ] Create `qa_inspector` agent (`verifyImage`)
  - [ ] Create `design_analyst` agent (from `getGenerativeVariations`)
  - [ ] Create `debug_analyst` agent (`analyzeDebugSession`)

### Phase 3: Tool-Enabled Agents (Week 3)

- [ ] **3.1 Verify Google Search Tool**
  - [ ] Test google_search tool in ADK
  - [ ] Ensure API keys work
  - [ ] Test latency vs current implementation

- [ ] **3.2 Migrate Search-Enabled Agents**
  - [ ] Create `personalization_strategist` (uses google_search)
  - [ ] Create `master_strategist` (uses google_search)
  - [ ] Create `brand_analyst` (uses google_search)
  - [ ] Compare research quality

### Phase 4: Parallel Orchestration (Week 4)

- [ ] **4.1 Migrate Designer Orchestrator**
  - [ ] Create `master_planner` agent
  - [ ] Create dynamic `slide_agent` factory
  - [ ] Create `ParallelAgent` for slide generation
  - [ ] Create `SequentialAgent` workflow
  - [ ] Test with 5, 10, 15 slide decks
  - [ ] Measure performance vs current Promise.all

- [ ] **4.2 Verify Thinking Budgets**
  - [ ] Research ADK thinking budget support
  - [ ] Configure 32768 tokens for intelligent generation agents
  - [ ] Configure 16384 tokens for master planner
  - [ ] Configure 8192 tokens for slide agents
  - [ ] Test quality with different budgets

### Phase 5: Image Generation Strategy (Week 5)

- [ ] **5.1 Decide Image Generation Approach**
  - [ ] Evaluate Option A (Keep separate) vs Option B (Integrate)
  - [ ] If Option A: Document interface between ADK and image service
  - [ ] If Option B: Research Imagen integration with ADK tools

- [ ] **5.2 Create Image Service Wrapper**
  - [ ] Keep existing `generateSingleImage` function
  - [ ] Create ADK-compatible interface
  - [ ] Ensure compatibility with:
    - [ ] `generateSingleImage` (core)
    - [ ] `getPersonalizedVariationsFromPlan`
    - [ ] `getGenerativeVariations`
    - [ ] `getInpaintingVariations`
    - [ ] `remakeSlideWithStyleReference`
    - [ ] `executeSlideTask`
    - [ ] `createSlideFromPrompt`

### Phase 6: Reference Matching Agents (Week 6)

- [ ] **6.1 Migrate Matching Engines**
  - [ ] Create `reference_matcher` agent
  - [ ] Create `quick_categorizer` agent
  - [ ] Create `strategy_decider` agent
  - [ ] Create `reference_analyzer` agent
  - [ ] Test matching accuracy

- [ ] **6.2 Create Matching Workflows**
  - [ ] Build sequential workflow for reference pipeline
  - [ ] Integrate with existing TypeScript components

### Phase 7: Integration & Testing (Week 7)

- [ ] **7.1 End-to-End Integration**
  - [ ] Update `ChatLandingView.tsx` to use ADK agents
  - [ ] Update `DesignerModeGenerator.tsx` to use ADK agents
  - [ ] Update `SlideEditor.tsx` to use ADK agents
  - [ ] Test full chat mode flow
  - [ ] Test full designer mode flow
  - [ ] Test full edit mode flow

- [ ] **7.2 Performance Testing**
  - [ ] Measure latency vs current implementation
  - [ ] Test parallel agent speedup
  - [ ] Optimize any bottlenecks
  - [ ] Monitor token usage

- [ ] **7.3 Quality Assurance**
  - [ ] Compare outputs: ADK vs current for all 47 functions
  - [ ] User acceptance testing
  - [ ] Fix any quality regressions

### Phase 8: Cleanup & Documentation (Week 8)

- [ ] **8.1 Remove Old Code**
  - [ ] Archive old `geminiService.ts` functions
  - [ ] Remove redundant orchestration logic
  - [ ] Clean up dependencies

- [ ] **8.2 Documentation**
  - [ ] Document ADK agent architecture
  - [ ] Create ADK agent catalog
  - [ ] Update developer onboarding docs
  - [ ] Create troubleshooting guide

- [ ] **8.3 Deployment Preparation**
  - [ ] Create deployment scripts for Python ADK service
  - [ ] Set up environment variables
  - [ ] Configure logging and monitoring
  - [ ] Prepare rollback plan

---

## Testing Strategy

### Unit Testing

1. **Agent-Level Tests**
   ```python
   # tests/adk_agents/test_intent_parser.py

   def test_parse_edit_intent():
       agent = create_intent_parser()
       runner = Runner(agent=agent)

       result = runner.run("regenerate slide 2 with better design")

       assert result['isEditing'] == True
       assert result['slideNumbers'] == [2]
       assert result['scope'] == 'single'
   ```

2. **Workflow Tests**
   ```python
   # tests/adk_agents/test_designer_orchestrator.py

   def test_designer_workflow():
       workflow = create_designer_orchestrator(slide_count=5)
       runner = Runner(agent=workflow)

       result = runner.run({
           "company_name": "TestCo",
           "content": "AI product pitch",
           "slide_count": 5
       })

       assert len(result['slides']) == 5
       assert 'master_plan' in result
   ```

3. **Integration Tests**
   ```typescript
   // tests/services/adkService.test.ts

   test('parseEditIntent via ADK', async () => {
       const adkService = new ADKService();

       const intent = await adkService.invokeAgent(
           'IntentParser',
           { user_prompt: 'edit slide 3', total_slides: 10 }
       );

       expect(intent.isEditing).toBe(true);
       expect(intent.slideNumbers).toEqual([3]);
   });
   ```

### Performance Benchmarks

1. **Latency Comparison**
   - Current: Direct Gemini API call
   - ADK: Gemini via ADK framework
   - Expected overhead: 5-10% (agent orchestration)
   - Acceptable if < 20%

2. **Parallel Execution Speedup**
   - Test: 10 slide deck generation
   - Current: Promise.all (parallel promises)
   - ADK: ParallelAgent
   - Expected: Similar or better (ADK optimized)

3. **Token Usage**
   - Track total tokens consumed
   - Ensure thinking budgets are preserved
   - Monitor cost implications

### Quality Assurance

1. **Output Comparison**
   - Run same prompts through current and ADK
   - Compare JSON outputs field-by-field
   - Flag any significant differences

2. **A/B Testing**
   - Run 50% of requests through ADK
   - Collect user feedback
   - Monitor error rates

3. **Edge Case Testing**
   - Malformed inputs
   - Network failures
   - Timeout scenarios
   - Large slide counts (30 slides)

---

## Risk Mitigation

### Risk 1: Image Generation Incompatibility

**Risk**: ADK may not support `responseModalities: [Modality.IMAGE]`

**Mitigation**:
- **Strategy**: Keep image generation separate (Option A)
- **Timeline**: Decide in Phase 5 (Week 5)
- **Fallback**: Use current Gemini API for images, ADK for text only

### Risk 2: Thinking Budget Not Supported

**Risk**: ADK may not support extended thinking budgets

**Impact**: Lower quality strategic analysis (32768 token budget critical)

**Mitigation**:
- Research ADK capabilities early (Phase 1)
- If not supported, use highest capability model
- Consider custom model configuration
- Fallback: Keep strategic agents in current implementation

### Risk 3: Google Search Tool Differences

**Risk**: ADK's google_search tool may work differently than current implementation

**Impact**: Affects personalization, brand analysis, deck planning (3 functions)

**Mitigation**:
- Test google_search tool thoroughly in Phase 3
- Compare search results quality
- Document any API differences
- Create adapter if needed

### Risk 4: Performance Regression

**Risk**: ADK introduces latency overhead

**Impact**: Slower user experience

**Mitigation**:
- Benchmark early (Phase 7)
- Optimize agent communication (gRPC vs HTTP)
- Cache agent instances
- Parallel execution should compensate
- Set acceptable threshold (< 20% slower)

### Risk 5: Model Availability

**Risk**: Some models may not be available in ADK (e.g., `gemini-2.0-flash-exp`, `gemini-2.5-flash-lite`)

**Mitigation**:
- Map to closest available models:
  - `gemini-2.0-flash-exp` → `gemini-2.0-flash`
  - `gemini-2.5-flash-lite` → `gemini-2.5-flash`
- Test quality with model substitutions
- Document model mappings

### Risk 6: Complex Migration

**Risk**: 47 LLM calls across 11 files is complex to migrate

**Mitigation**:
- **Phased approach**: 8 weeks, incremental
- **Feature flags**: Toggle between old and new implementations
- **Rollback plan**: Keep old code until fully tested
- **Parallel running**: Run both systems temporarily for comparison

### Risk 7: Python-TypeScript Bridge

**Risk**: Communication between TypeScript and Python ADK may be unstable

**Mitigation**:
- Choose reliable bridge technology:
  - Option A: HTTP API (simple, slower)
  - Option B: gRPC (complex, faster)
  - Option C: Python subprocess (simplest)
- Error handling and retries
- Comprehensive logging
- Health checks

---

## Next Steps for Implementation

### Immediate Actions (Week 1)

1. **Research ADK Capabilities**
   - [ ] Verify thinking budget support
   - [ ] Test google_search tool
   - [ ] Check model availability
   - [ ] Test image generation options

2. **Set Up Development Environment**
   - [ ] Install ADK in Python environment
   - [ ] Create test ADK agent
   - [ ] Test Python-TypeScript communication
   - [ ] Validate JSON serialization

3. **Create Proof of Concept**
   - [ ] Migrate 1 simple function (`parseEditIntent`)
   - [ ] Test end-to-end flow
   - [ ] Measure latency
   - [ ] Compare output quality

4. **Architecture Decision**
   - [ ] Decide: HTTP API vs gRPC vs subprocess
   - [ ] Decide: Monolithic service vs microservices
   - [ ] Decide: Image generation strategy (Option A vs B)
   - [ ] Document decisions

5. **Get Stakeholder Approval**
   - [ ] Review this migration report
   - [ ] Approve 8-week timeline
   - [ ] Allocate resources
   - [ ] Set success metrics

---

## Appendix A: Model Mapping

| Current Model | ADK Model | Notes |
|--------------|-----------|-------|
| `gemini-2.5-pro` | `gemini-2.5-pro` | ✅ Direct mapping |
| `gemini-2.5-flash` | `gemini-2.5-flash` | ✅ Direct mapping |
| `gemini-2.5-flash-lite` | `gemini-2.5-flash` | ⚠️ May not exist, use flash |
| `gemini-2.5-flash-image` | **External Service** | ❌ Not supported in ADK text agents |
| `gemini-2.0-flash-exp` | `gemini-2.0-flash` | ⚠️ Experimental → Stable |
| `imagen-4.0-generate-001` | **External Service** | ❌ Separate Imagen API |

---

## Appendix B: Agent Catalog Summary

| Agent Name | Model | Purpose | Tools | Thinking Budget |
|-----------|-------|---------|-------|-----------------|
| IntentParser | gemini-2.0-flash | Detect edit vs create intent | - | - |
| PlanModifier | gemini-2.0-flash | Parse plan modification requests | - | - |
| DesignAnalyst | gemini-2.5-flash | Refine user prompts | - | - |
| QAInspector | gemini-2.5-flash | Verify image quality | - | - |
| PersonalizationStrategist | gemini-2.5-pro | Create personalization plan | google_search | - |
| ContentExtractor | gemini-2.5-flash | Extract slide content to JSON | - | - |
| StyleScout | gemini-2.5-pro | Match style references | - | - |
| MasterStrategist | gemini-2.5-pro | Create deck execution plan | google_search | - |
| ContentStrategist | gemini-2.5-pro | Generate outline from notes | - | 32768 |
| PromptEnhancer | gemini-2.5-pro | Enrich basic prompts | - | - |
| BrandAnalyst | gemini-2.5-pro | Extract brand from website | google_search | - |
| TextDetector | gemini-2.5-flash | Detect text regions | - | - |
| IntelligentQuestionAsker | gemini-2.5-pro | Generate smart questions | - | 32768 |
| ContextSlideGenerator | gemini-2.5-pro | Generate slides with context | - | 32768 |
| ReferenceMatcherPro | gemini-2.5-pro | Match specs to templates | - | - |
| QuickCategorizer | gemini-2.5-flash | Quick slide categorization | - | - |
| GenerationStrategyDecider | gemini-2.5-pro | Decide modify vs recreate | - | - |
| DeepReferenceAnalyzer | gemini-2.5-pro | Extract design blueprint | - | - |
| ArchitectureDetector | gemini-2.0-flash | Detect architecture pattern | - | - |
| ArchitectureSlideDesigner | gemini-2.0-flash | Design architecture slide | - | - |
| PresentationContextExtractor | gemini-2.5-flash | Extract presentation metadata | - | 8192 |
| MasterPlanner | gemini-2.5-pro | Create presentation foundation | - | 16384 |
| SlideAgent_N (dynamic) | gemini-2.5-pro | Generate individual slide spec | - | 8192 |

**Total**: 22 named agents + N dynamic slide agents

---

## Appendix C: Complete Function Migration Table

| File | Function | Lines | Current Model | ADK Agent | Image? | Priority |
|------|----------|-------|--------------|-----------|--------|----------|
| geminiService.ts | parsePlanModification | 30-85 | gemini-2.0-flash-exp | PlanModifier | No | High |
| geminiService.ts | parseEditIntent | 87-148 | gemini-2.0-flash-exp | IntentParser | No | High |
| geminiService.ts | verifyImage | 182-227 | gemini-2.5-flash | QAInspector | No | Medium |
| geminiService.ts | generateSingleImage | 247-342 | imagen/gemini-image | External | **Yes** | Critical |
| geminiService.ts | getPersonalizationPlan | 345-384 | gemini-2.5-pro | PersonalizationStrategist | No | High |
| geminiService.ts | getPersonalizedVariationsFromPlan | 386-428 | gemini-image | External + Orchestration | **Yes** | High |
| geminiService.ts | getGenerativeVariations | 431-488 | flash + image | DesignAnalyst + External | **Yes** | High |
| geminiService.ts | getInpaintingVariations | 491-538 | gemini-image | External | **Yes** | High |
| geminiService.ts | extractContentAsJson | 544-593 | gemini-2.5-flash | ContentExtractor | No | High |
| geminiService.ts | findBestStyleReference | 595-646 | gemini-2.5-pro | StyleScout | No | Medium |
| geminiService.ts | findBestStyleReferenceFromPrompt | 648-702 | gemini-2.5-pro | StyleScout | No | Medium |
| geminiService.ts | remakeSlideWithStyleReference | 704-787 | gemini-image | ContentExtractor + StyleScout + External | **Yes** | High |
| geminiService.ts | generateDeckExecutionPlan | 794-868 | gemini-2.5-pro | MasterStrategist | No | High |
| geminiService.ts | executeSlideTask | 870-898 | gemini-image | External | **Yes** | High |
| geminiService.ts | createSlideFromPrompt | 900-995 | gemini-image | External | **Yes** | Critical |
| geminiService.ts | analyzeDebugSession | 998-1020 | gemini-2.5-pro | DebugAnalyst | No | Low |
| geminiService.ts | generateOutlineFromNotes | 1026-1062 | gemini-2.5-pro | ContentStrategist | No | High |
| geminiService.ts | enhanceOutlinePrompts | 1065-1101 | gemini-2.5-pro | PromptEnhancer | No | Medium |
| geminiService.ts | generateThemeFromWebsite | 1113-1142 | gemini-2.5-pro | BrandAnalyst | No | Medium |
| geminiService.ts | detectAllTextRegions | 1163-1230 | gemini-2.5-flash | TextDetector | No | Medium |
| geminiService.ts | detectClickedText | 1232-1289 | gemini-2.5-flash | TextDetector | No | Medium |
| designerOrchestrator.ts | Master Planning Agent | 434-443 | gemini-2.5-pro | MasterPlanner | No | Critical |
| designerOrchestrator.ts | Parallel Slide Agents | 485-494 | gemini-2.5-pro | ParallelAgent(SlideAgent_1..N) | No | Critical |
| intelligentGeneration.ts | analyzeNotesAndAskQuestions | 27-124 | gemini-2.5-pro | IntelligentQuestionAsker | No | High |
| intelligentGeneration.ts | generateSlidesWithContext | 129-199 | gemini-2.5-pro | ContextSlideGenerator | No | High |
| titleSlideGenerator.ts | createTitleSlideFromTemplate | 24-78 | gemini-image | External | **Yes** | Low |
| designAssetGenerator.ts | generateDesignAsset | 19-50 | gemini-image | External | **Yes** | Low |
| architectureSlideGenerator.ts | detectArchitectureType | 25-64 | gemini-2.0-flash-exp | ArchitectureDetector | No | Low |
| architectureSlideGenerator.ts | generateArchitectureSlide | 69-249 | gemini-2.0-flash-exp | ArchitectureSlideDesigner | No | Low |
| referenceMatchingEngine.ts | Intelligent Reference Matching | 168-171 | gemini-2.5-pro | ReferenceMatcherPro | No | Medium |
| referenceMatchingEngine.ts | quickCategorizeReference | 259-313 | gemini-2.5-flash-lite | QuickCategorizer | No | Medium |
| referenceStrategyDecider.ts | decideGenerationStrategy | 147-263 | gemini-2.5-pro | GenerationStrategyDecider | No | Medium |
| deepReferenceAnalyzer.ts | analyzeReferenceSlide | 166-225 | gemini-2.5-pro | DeepReferenceAnalyzer | No | Medium |
| DesignerModeGenerator.tsx | extractPresentationContext | 133-293 | gemini-2.5-flash | PresentationContextExtractor | No | Medium |

**Summary**:
- **Total Functions**: 34
- **Text-based (ADK)**: 22
- **Image-based (External)**: 12
- **Critical Priority**: 4
- **High Priority**: 16
- **Medium Priority**: 12
- **Low Priority**: 2

---

## Conclusion

This migration report provides a complete, line-by-line roadmap for migrating DeckRAI from direct Gemini API calls to Google Agent Development Kit (ADK).

**Key Takeaways**:
1. **22 specialized ADK agents** will replace 34 function calls
2. **Image generation** stays separate (critical for quality)
3. **Parallel orchestration** gets native ADK support
4. **8-week phased migration** minimizes risk
5. **Quality preserved** through thorough testing

**Success Metrics**:
- ✅ All 47 LLM calls migrated
- ✅ Output quality maintained (≥95% similarity)
- ✅ Latency within 20% of current
- ✅ Parallel execution speedup demonstrated
- ✅ Zero production incidents

---

**Next Steps**: Review this report, approve timeline, and begin Phase 1 (Foundation Setup).
