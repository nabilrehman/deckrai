# ADK MASTER AGENT ARCHITECTURE
## DeckRAI: Intent-Based Master Agent Orchestration

**Branch**: `feature/adk-migration-master-agent`
**Date**: 2025-11-16
**Architecture**: Master Agent → Intent Router → Specialized Sub-Agents

---

## 🎯 Architecture Overview

### Current Architecture (Main Branch)
```
User Input → ChatLandingView → Direct Service Calls
                              ├─ intelligentGeneration.ts
                              ├─ vibeDetection.ts
                              ├─ geminiService.ts (23 functions)
                              └─ firestoreService.ts
```

### Target ADK Architecture (Master Agent Orchestration)
```
User Input → Master Agent (Intent Classifier)
                    ↓
            ┌───────┴────────┐
            ↓                ↓
    Intent Router    State Manager
            ↓                ↓
    ┌───────┴────────────────┴─────┐
    ↓       ↓        ↓        ↓    ↓
[Create] [Edit] [Analyze] [Plan] [Image]
  Agent   Agent    Agent   Agent  Service
    ↓       ↓        ↓        ↓      ↓
Sub-Agents in Parallel/Sequential Workflows
```

---

## 🧠 Master Agent: The Orchestrator

### Role
The Master Agent is the **single entry point** for all user requests. It:
1. **Classifies** user intent (create, edit, analyze, plan, etc.)
2. **Routes** to appropriate specialized agent/workflow
3. **Manages** conversation state and context
4. **Coordinates** between multiple agents when needed
5. **Returns** unified responses to the UI

### Implementation

```typescript
// services/adk/masterAgent.ts

import { LlmAgent, SequentialAgent, ParallelAgent } from '@google/adk';
import { Runner, InMemorySessionService } from '@google/adk';

/**
 * Master Agent - Single entry point for all user intents
 */
export const masterAgent = new LlmAgent({
    name: "DeckRAIMasterAgent",
    model: "gemini-2.5-pro",
    instruction: `You are the Master Agent for DeckRAI, an AI presentation builder.

Your role is to:
1. Understand user intent from natural language
2. Classify the request into one of these categories:
   - CREATE_DECK: User wants to create a new presentation
   - EDIT_SLIDES: User wants to modify existing slides
   - ANALYZE_CONTENT: User wants analysis/questions about their content
   - PLAN_STRATEGY: User wants strategic planning for presentation
   - QUICK_QUESTION: User has a simple question

3. Extract key information:
   - Target slides (if editing: @slide2, @all, etc.)
   - Content/topic (what the presentation is about)
   - Requirements (audience, style, slide count, etc.)
   - Uploaded images/files

4. Return a structured JSON response:
{
    "intent": "CREATE_DECK" | "EDIT_SLIDES" | "ANALYZE_CONTENT" | "PLAN_STRATEGY" | "QUICK_QUESTION",
    "confidence": 0.0-1.0,
    "reasoning": "Why you classified it this way",
    "extracted_data": {
        "target_slides": ["slide_2", "slide_5"] or ["all"] or [],
        "topic": "AI product pitch",
        "requirements": {
            "audience": "investors",
            "style": "professional",
            "slide_count": 10
        },
        "has_images": true/false
    },
    "next_agent": "CreateDeckAgent" | "EditSlidesAgent" | "AnalyzeContentAgent" | "PlanStrategyAgent"
}

Examples:
User: "Create a 10-slide pitch deck about our AI product"
→ Intent: CREATE_DECK, next_agent: CreateDeckAgent

User: "@slide2 make it more professional"
→ Intent: EDIT_SLIDES, target_slides: ["slide_2"], next_agent: EditSlidesAgent

User: "What questions should I answer about this topic?"
→ Intent: ANALYZE_CONTENT, next_agent: AnalyzeContentAgent
`,
    description: "Master orchestrator that routes all user intents"
});
```

---

## 🔀 Intent Router: Workflow Delegation

### Intent Categories

| Intent | Description | Next Agent | Workflow Type |
|--------|-------------|-----------|---------------|
| `CREATE_DECK` | Create new presentation from scratch | CreateDeckAgent | Sequential → Parallel |
| `EDIT_SLIDES` | Modify existing slides | EditSlidesAgent | Sequential or Parallel |
| `ANALYZE_CONTENT` | Ask questions, get suggestions | AnalyzeContentAgent | Sequential |
| `PLAN_STRATEGY` | Strategic planning, deck architecture | PlanStrategyAgent | Sequential |
| `QUICK_QUESTION` | Simple Q&A | Master Agent (no delegation) | Single LLM |

### Router Implementation

```typescript
// services/adk/intentRouter.ts

import { masterAgent } from './masterAgent';
import { createDeckWorkflow } from './workflows/createDeckWorkflow';
import { editSlidesWorkflow } from './workflows/editSlidesWorkflow';
import { analyzeContentWorkflow } from './workflows/analyzeContentWorkflow';
import { planStrategyWorkflow } from './workflows/planStrategyWorkflow';

export class IntentRouter {
    private sessionService: InMemorySessionService;

    constructor() {
        this.sessionService = new InMemorySessionService();
    }

    async route(userInput: string, context: any): Promise<any> {
        // Step 1: Get intent from Master Agent
        const intent = await this.classifyIntent(userInput, context);

        console.log(`🎯 Intent classified: ${intent.intent} (confidence: ${intent.confidence})`);

        // Step 2: Route to appropriate workflow
        switch(intent.intent) {
            case 'CREATE_DECK':
                return await createDeckWorkflow.execute(intent.extracted_data, context);

            case 'EDIT_SLIDES':
                return await editSlidesWorkflow.execute(intent.extracted_data, context);

            case 'ANALYZE_CONTENT':
                return await analyzeContentWorkflow.execute(intent.extracted_data, context);

            case 'PLAN_STRATEGY':
                return await planStrategyWorkflow.execute(intent.extracted_data, context);

            case 'QUICK_QUESTION':
                // Master agent handles directly
                return await this.handleQuickQuestion(userInput);

            default:
                throw new Error(`Unknown intent: ${intent.intent}`);
        }
    }

    private async classifyIntent(userInput: string, context: any) {
        const runner = new Runner({
            agent: masterAgent,
            sessionService: this.sessionService
        });

        // Create session
        const session = await this.sessionService.createSession({
            appName: 'deckrai',
            userId: context.userId || 'anonymous',
            sessionId: `session_${Date.now()}`
        });

        // Run master agent
        const events = runner.run({
            userId: session.userId,
            sessionId: session.id,
            newMessage: {
                role: 'user',
                parts: [{ text: `Current context:\n${JSON.stringify(context, null, 2)}\n\nUser input: ${userInput}` }]
            }
        });

        // Extract intent JSON
        for await (const event of events) {
            if (event.isFinalResponse()) {
                const responseText = event.content.parts[0].text;
                const jsonMatch = responseText.match(/```json\s*(\{[\s\S]*?\})\s*```/)
                              || responseText.match(/(\{[\s\S]*\})/);

                if (jsonMatch) {
                    return JSON.parse(jsonMatch[1]);
                }
            }
        }

        throw new Error('Master agent failed to classify intent');
    }

    private async handleQuickQuestion(userInput: string) {
        // Simple Q&A - master agent responds directly
        const runner = new Runner({ agent: masterAgent, sessionService: this.sessionService });
        // ... implementation
    }
}
```

---

## 🏗️ Specialized Sub-Agents

### 1. CREATE_DECK Workflow

**Purpose**: Create a new presentation from scratch

**Agents Involved**:
1. `VibeDetector` - Detect presentation vibe/style
2. `ContentAnalyzer` - Analyze content and ask questions
3. `MasterPlanner` - Create deck architecture (uses Designer Orchestrator)
4. `ParallelSlideGenerator` - Generate all slides in parallel
5. `ImageGenerator` - Generate images (keeps Gemini API)

**Workflow**:
```typescript
// services/adk/workflows/createDeckWorkflow.ts

import { SequentialAgent, ParallelAgent, LlmAgent } from '@google/adk';

// Agent 1: Vibe Detector
const vibeDetector = new LlmAgent({
    name: "VibeDetector",
    model: "gemini-2.0-flash",
    instruction: `Analyze the user's content and detect the presentation vibe.
    Return JSON: { "vibe": "professional" | "creative" | "technical" | "minimal", "reasoning": "..." }`,
    output_key: "detected_vibe"
});

// Agent 2: Content Analyzer (asks questions)
const contentAnalyzer = new LlmAgent({
    name: "ContentAnalyzer",
    model: "gemini-2.5-pro",
    instruction: `Analyze content and generate smart questions to clarify requirements.
    Return JSON: { "questions": [...], "suggestions": {...} }`,
    output_key: "content_analysis"
});

// Agent 3: Master Planner (from Designer Orchestrator)
const masterPlanner = new LlmAgent({
    name: "MasterPlanner",
    model: "gemini-2.5-pro",
    instruction: `Create presentation foundation with:
    - Brand research
    - Deck architecture
    - Design system
    - Slide briefs`,
    output_key: "master_plan"
});

// Agent 4: Parallel Slide Generators (dynamic)
function createSlideAgents(slideCount: number) {
    return Array.from({ length: slideCount }, (_, i) =>
        new LlmAgent({
            name: `SlideAgent_${i + 1}`,
            model: "gemini-2.5-pro",
            instruction: `Generate detailed specification for slide ${i + 1}`,
            output_key: `slide_${i + 1}_spec`
        })
    );
}

// Complete workflow
export const createDeckWorkflow = new SequentialAgent({
    name: "CreateDeckWorkflow",
    sub_agents: [
        vibeDetector,
        contentAnalyzer,
        // Conditional: If user answers questions, continue
        masterPlanner,
        // Dynamic parallel slide generation
        // (created at runtime based on slide count)
    ],
    description: "End-to-end deck creation workflow"
});

export class CreateDeckWorkflow {
    async execute(extractedData: any, context: any) {
        const slideCount = extractedData.requirements?.slide_count || 10;

        // Create dynamic workflow
        const slideAgents = createSlideAgents(slideCount);
        const parallelSlideGen = new ParallelAgent({
            name: "ParallelSlideGeneration",
            sub_agents: slideAgents
        });

        const workflow = new SequentialAgent({
            name: "CreateDeckWorkflow",
            sub_agents: [
                vibeDetector,
                contentAnalyzer,
                masterPlanner,
                parallelSlideGen
            ]
        });

        // Execute workflow
        const runner = new Runner({ agent: workflow });
        const events = runner.run({
            userId: context.userId,
            sessionId: context.sessionId,
            newMessage: {
                role: 'user',
                parts: [{ text: JSON.stringify(extractedData) }]
            }
        });

        // Collect results
        const results = { slides: [], thinking: [] };
        for await (const event of events) {
            if (event.content) {
                // Process event...
                results.thinking.push({
                    agent: event.agentName,
                    message: event.content.parts[0].text
                });
            }
        }

        // Image generation (separate - Gemini API)
        for (const slideSpec of results.slides) {
            const image = await generateSlideImage(slideSpec);
            slideSpec.image = image;
        }

        return results;
    }
}
```

### 2. EDIT_SLIDES Workflow

**Purpose**: Modify existing slides based on user requests

**Agents Involved**:
1. `SlideTargetParser` - Parse which slides to edit (@slide2, @all, etc.)
2. `EditStrategyPlanner` - Determine edit strategy
3. `ParallelSlideEditor` - Edit multiple slides in parallel
4. `ImageEditor` - Apply image edits (keeps Gemini API)

**Workflow**:
```typescript
// services/adk/workflows/editSlidesWorkflow.ts

import { SequentialAgent, ParallelAgent, LlmAgent } from '@google/adk';

// Agent 1: Slide Target Parser
const slideTargetParser = new LlmAgent({
    name: "SlideTargetParser",
    model: "gemini-2.0-flash",
    instruction: `Parse which slides to edit from user input.

    Examples:
    - "@slide2" → { target_slides: ["slide_2"] }
    - "@all" → { target_slides: ["all"] }
    - "slide 2 and 5" → { target_slides: ["slide_2", "slide_5"] }

    Return JSON: { "target_slides": [...], "edit_action": "..." }`,
    output_key: "target_slides"
});

// Agent 2: Edit Strategy Planner
const editStrategyPlanner = new LlmAgent({
    name: "EditStrategyPlanner",
    model: "gemini-2.5-pro",
    instruction: `Create detailed edit plan for each target slide.

    Return JSON: {
        "tasks": [
            {
                "slide_id": "slide_2",
                "edit_type": "text" | "layout" | "style" | "content",
                "detailed_prompt": "Specific instructions for the editor agent"
            }
        ]
    }`,
    output_key: "edit_plan"
});

// Agent 3: Parallel Slide Editors (dynamic)
function createEditorAgents(editPlan: any) {
    return editPlan.tasks.map((task: any) =>
        new LlmAgent({
            name: `SlideEditor_${task.slide_id}`,
            model: "gemini-2.5-flash",
            instruction: `Edit ${task.slide_id} with these instructions: ${task.detailed_prompt}`,
            output_key: `edited_${task.slide_id}`
        })
    );
}

export class EditSlidesWorkflow {
    async execute(extractedData: any, context: any) {
        // Step 1: Parse targets
        const targets = await this.parseTargets(extractedData, context);

        // Step 2: Create edit plan
        const editPlan = await this.createEditPlan(targets, extractedData);

        // Step 3: Execute edits in parallel
        const editorAgents = createEditorAgents(editPlan);
        const parallelEditors = new ParallelAgent({
            name: "ParallelSlideEditors",
            sub_agents: editorAgents
        });

        const workflow = new SequentialAgent({
            name: "EditSlidesWorkflow",
            sub_agents: [
                slideTargetParser,
                editStrategyPlanner,
                parallelEditors
            ]
        });

        const runner = new Runner({ agent: workflow });
        const events = runner.run({ /*...*/ });

        // Collect edited slides
        const editedSlides = [];
        for await (const event of events) {
            if (event.output_key && event.output_key.startsWith('edited_')) {
                editedSlides.push(event.content);
            }
        }

        // Apply image edits (Gemini API)
        for (const slide of editedSlides) {
            if (slide.needsImageEdit) {
                slide.image = await editSlideImage(slide);
            }
        }

        return editedSlides;
    }
}
```

### 3. ANALYZE_CONTENT Workflow

**Purpose**: Analyze user's content and ask clarifying questions

**Agents Involved**:
1. `ContentAnalyzer` - Analyze content structure
2. `QuestionGenerator` - Generate smart questions
3. `SuggestionMaker` - Provide recommendations

**Workflow**:
```typescript
// services/adk/workflows/analyzeContentWorkflow.ts

const contentAnalyzer = new LlmAgent({
    name: "ContentAnalyzer",
    model: "gemini-2.5-pro",
    instruction: `Analyze user's content and extract key themes, topics, and structure.

    Return JSON: {
        "key_themes": [...],
        "topics": [...],
        "structure": "brainstorm" | "structured" | "fragments",
        "completeness": 0.0-1.0
    }`,
    output_key: "content_analysis"
});

const questionGenerator = new LlmAgent({
    name: "QuestionGenerator",
    model: "gemini-2.5-pro",
    instruction: `Generate smart clarifying questions based on content analysis.

    Return JSON: {
        "questions": [
            {
                "question": "Who is your target audience?",
                "options": ["Investors", "Customers", "Technical team", "General public"],
                "reasoning": "This helps tailor the message and tone"
            }
        ]
    }`,
    output_key: "questions"
});

const suggestionMaker = new LlmAgent({
    name: "SuggestionMaker",
    model: "gemini-2.5-pro",
    instruction: `Provide actionable suggestions for the presentation.

    Return JSON: {
        "suggested_slide_count": 10,
        "suggested_style": "professional",
        "recommended_sections": ["Introduction", "Problem", "Solution", ...],
        "reasoning": "..."
    }`,
    output_key: "suggestions"
});

export const analyzeContentWorkflow = new SequentialAgent({
    name: "AnalyzeContentWorkflow",
    sub_agents: [
        contentAnalyzer,
        questionGenerator,
        suggestionMaker
    ],
    description: "Analyzes content and provides questions/suggestions"
});
```

### 4. PLAN_STRATEGY Workflow

**Purpose**: Strategic presentation planning and architecture

**Agents Involved**:
1. `GoalAnalyzer` - Understand presentation goal
2. `AudienceAnalyzer` - Analyze target audience
3. `StructurePlanner` - Plan optimal structure
4. `BrandResearcher` - Research company branding (with google_search)

**Workflow**:
```typescript
// services/adk/workflows/planStrategyWorkflow.ts

import { google_search } from '@google/adk/tools';

const goalAnalyzer = new LlmAgent({
    name: "GoalAnalyzer",
    model: "gemini-2.5-pro",
    instruction: `Analyze presentation goal and classify it.

    Goals: inform, persuade, educate, inspire, sell

    Return JSON: { "goal": "...", "reasoning": "...", "success_metrics": [...] }`,
    output_key: "goal_analysis"
});

const audienceAnalyzer = new LlmAgent({
    name: "AudienceAnalyzer",
    model: "gemini-2.5-pro",
    instruction: `Analyze target audience and their needs.

    Return JSON: {
        "audience_type": "technical" | "executive" | "general",
        "pain_points": [...],
        "communication_style": "data-driven" | "storytelling" | "visual",
        "attention_span": "short" | "medium" | "long"
    }`,
    output_key: "audience_analysis"
});

const brandResearcher = new LlmAgent({
    name: "BrandResearcher",
    model: "gemini-2.5-pro",
    instruction: `Research company branding using web search.

    Find:
    - Brand colors (hex codes)
    - Typography/fonts
    - Visual style
    - Key messaging

    Return JSON with brand guidelines.`,
    tools: [google_search],  // Uses Google Search
    output_key: "brand_research"
});

const structurePlanner = new LlmAgent({
    name: "StructurePlanner",
    model: "gemini-2.5-pro",
    instruction: `Plan optimal presentation structure based on goal and audience.

    Return JSON: {
        "recommended_structure": [...],
        "slide_count": 10,
        "flow": "linear" | "modular" | "narrative",
        "emphasis": "data" | "visuals" | "text"
    }`,
    output_key: "structure_plan"
});

export const planStrategyWorkflow = new SequentialAgent({
    name: "PlanStrategyWorkflow",
    sub_agents: [
        goalAnalyzer,
        audienceAnalyzer,
        brandResearcher,  // Uses google_search
        structurePlanner
    ],
    description: "Strategic planning for presentation"
});
```

---

## 🖼️ Image Generation Service (Separate)

**Why Separate**: ADK doesn't support image generation - keep using Gemini API

```typescript
// services/imageGenerationService.ts

import { GoogleGenAI, Modality } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

export class ImageGenerationService {
    /**
     * Generate slide image from specification
     */
    async generateSlideImage(slideSpec: any, styleReference?: string): Promise<string> {
        const parts = [];

        // Add style reference if provided
        if (styleReference) {
            parts.push(this.fileToGenerativePart(styleReference));
        }

        // Add prompt
        parts.push({
            text: `Generate a professional presentation slide with:
            Title: ${slideSpec.title}
            Content: ${slideSpec.content}
            Visual Style: ${slideSpec.visualStyle}

            Make it 16:9 aspect ratio.`
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: { responseModalities: [Modality.IMAGE] }
        });

        const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
        if (!imagePart) throw new Error('No image generated');

        const mimeType = imagePart.inlineData.mimeType;
        const imageData = imagePart.inlineData.data;

        return `data:${mimeType};base64,${imageData}`;
    }

    /**
     * Edit existing slide image
     */
    async editSlideImage(originalImage: string, editPrompt: string): Promise<string> {
        const originalPart = this.fileToGenerativePart(originalImage);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    originalPart,
                    { text: editPrompt }
                ]
            },
            config: { responseModalities: [Modality.IMAGE] }
        });

        const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
        if (!imagePart) throw new Error('No image generated');

        const mimeType = imagePart.inlineData.mimeType;
        const imageData = imagePart.inlineData.data;

        return `data:${mimeType};base64,${imageData}`;
    }

    private fileToGenerativePart(base64Data: string) {
        const match = base64Data.match(/^data:(image\/\w+);base64,(.*)$/);
        if (!match) throw new Error("Invalid base64 image data");

        return {
            inlineData: {
                data: match[2],
                mimeType: match[1]
            }
        };
    }
}
```

---

## 🔄 Complete Request Flow

### Example 1: Create Deck Request

```
User: "Create a 10-slide pitch deck about our AI product for investors"
    ↓
┌─────────────────────────────────────────┐
│ Master Agent (Intent Classifier)       │
│ → Intent: CREATE_DECK                  │
│ → Confidence: 0.95                     │
│ → Next: CreateDeckWorkflow             │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Intent Router                           │
│ → Route to: createDeckWorkflow.execute()│
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ CreateDeckWorkflow (Sequential)         │
│                                         │
│ Step 1: VibeDetector                   │
│   → Output: {"vibe": "professional"}   │
│                                         │
│ Step 2: ContentAnalyzer                │
│   → Output: Questions about audience   │
│   → [WAIT for user answers]            │
│                                         │
│ Step 3: MasterPlanner                  │
│   → Output: Brand research + architecture│
│                                         │
│ Step 4: ParallelSlideGenerator (10 agents)│
│   ├─ SlideAgent_1                      │
│   ├─ SlideAgent_2                      │
│   ├─ ... (all run in parallel)        │
│   └─ SlideAgent_10                     │
│   → Output: 10 slide specifications    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ ImageGenerationService (Gemini API)    │
│ → Generate images for all 10 slides    │
│ → Cost: 10 × $0.039 = $0.39           │
└─────────────────────────────────────────┘
    ↓
Return: Complete deck with 10 slides
```

### Example 2: Edit Slides Request

```
User: "@slide2 @slide5 make them more professional"
    ↓
┌─────────────────────────────────────────┐
│ Master Agent (Intent Classifier)       │
│ → Intent: EDIT_SLIDES                  │
│ → Target: ["slide_2", "slide_5"]      │
│ → Next: EditSlidesWorkflow             │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ EditSlidesWorkflow (Sequential)         │
│                                         │
│ Step 1: SlideTargetParser              │
│   → Output: ["slide_2", "slide_5"]    │
│                                         │
│ Step 2: EditStrategyPlanner            │
│   → Output: Edit tasks for each slide │
│                                         │
│ Step 3: ParallelSlideEditors (2 agents)│
│   ├─ SlideEditor_slide_2               │
│   └─ SlideEditor_slide_5               │
│   → Output: 2 edited specifications    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ ImageGenerationService (Gemini API)    │
│ → Edit images for 2 slides             │
│ → Cost: 2 × $0.039 = $0.078           │
└─────────────────────────────────────────┘
    ↓
Return: 2 updated slides
```

---

## 📁 Project Structure

```
/services/
├── adk/
│   ├── masterAgent.ts           # Master orchestrator
│   ├── intentRouter.ts          # Routes intents to workflows
│   │
│   ├── agents/
│   │   ├── vibeDetector.ts      # Detects presentation vibe
│   │   ├── contentAnalyzer.ts   # Analyzes content
│   │   ├── questionGenerator.ts # Generates questions
│   │   ├── slideTargetParser.ts # Parses @mentions
│   │   ├── editPlanner.ts       # Plans edit strategy
│   │   ├── masterPlanner.ts     # Creates deck architecture
│   │   └── ...                  # 20+ specialized agents
│   │
│   ├── workflows/
│   │   ├── createDeckWorkflow.ts    # Create new deck
│   │   ├── editSlidesWorkflow.ts    # Edit existing slides
│   │   ├── analyzeContentWorkflow.ts# Ask questions
│   │   └── planStrategyWorkflow.ts  # Strategic planning
│   │
│   └── utils/
│       ├── sessionManager.ts    # Session management
│       └── stateManager.ts      # State persistence
│
├── imageGenerationService.ts   # Image gen (Gemini API)
├── firestoreService.ts          # Firebase storage
└── ...
```

---

## 🚀 Migration Plan: Step-by-Step

### Phase 1: Foundation (Days 1-2)
- [ ] Install `@google/adk` (TypeScript ADK v0.1.2)
- [ ] Create `masterAgent.ts`
- [ ] Create `intentRouter.ts`
- [ ] Test intent classification
- [ ] Document web searches for ADK API verification

### Phase 2: Create Workflow (Days 3-5)
- [ ] Implement `VibeDetector` agent
- [ ] Implement `ContentAnalyzer` agent
- [ ] Implement `MasterPlanner` agent
- [ ] Implement `ParallelSlideGenerator`
- [ ] Wire up `CreateDeckWorkflow`
- [ ] Test end-to-end deck creation
- [ ] Keep image generation on Gemini API

### Phase 3: Edit Workflow (Days 6-8)
- [ ] Implement `SlideTargetParser` agent
- [ ] Implement `EditStrategyPlanner` agent
- [ ] Implement `ParallelSlideEditors`
- [ ] Wire up `EditSlidesWorkflow`
- [ ] Test slide editing
- [ ] Test @mentions parsing

### Phase 4: Analysis & Planning (Days 9-10)
- [ ] Implement `AnalyzeContentWorkflow`
- [ ] Implement `PlanStrategyWorkflow`
- [ ] Add `google_search` tool to `BrandResearcher`
- [ ] Test workflows

### Phase 5: Integration (Days 11-12)
- [ ] Update `ChatLandingView.tsx` to use IntentRouter
- [ ] Test all flows end-to-end
- [ ] Compare quality vs current implementation
- [ ] Performance testing

### Phase 6: Deployment (Days 13-14)
- [ ] Deploy to Vertex AI Agent Engine
- [ ] Set up monitoring
- [ ] Create rollback plan
- [ ] Documentation

---

## 🧪 Testing Strategy

### Test as You Go

After each agent implementation:

```typescript
// Example: Test VibeDetector
import { vibeDetector } from './agents/vibeDetector';
import { Runner, InMemorySessionService } from '@google/adk';

describe('VibeDetector Agent', () => {
    it('should detect professional vibe for investor pitch', async () => {
        const sessionService = new InMemorySessionService();
        const session = await sessionService.createSession({
            appName: 'deckrai-test',
            userId: 'test-user',
            sessionId: 'test-session'
        });

        const runner = new Runner({
            agent: vibeDetector,
            sessionService
        });

        const events = runner.run({
            userId: 'test-user',
            sessionId: session.id,
            newMessage: {
                role: 'user',
                parts: [{ text: 'Create a pitch deck for investors about our AI product' }]
            }
        });

        let result;
        for await (const event of events) {
            if (event.isFinalResponse()) {
                result = JSON.parse(event.content.parts[0].text);
            }
        }

        expect(result.vibe).toBe('professional');
        expect(result.reasoning).toContain('investor');
    });
});
```

### Web Documentation Search

Before implementing each agent, search ADK docs:

```bash
# Search for specific ADK features
- "Google ADK LlmAgent API reference"
- "Google ADK ParallelAgent sub_agents"
- "Google ADK google_search tool integration"
- "Google ADK session management async"
- "Google ADK Runner event handling"
```

---

## 📊 Success Metrics

| Metric | Target | How to Measure |
|--------|--------|---------------|
| Intent Classification Accuracy | >90% | Test 100 user inputs, compare classification |
| Response Time | <5s for create, <2s for edit | Timer in IntentRouter |
| Parallel Speedup | 5-10x for 10 slides | Compare vs sequential |
| Image Quality | ≥95% match current | Side-by-side comparison |
| Cost | Similar or lower | Track API calls, tokens |

---

## 🎯 Next Steps

1. **Install TypeScript ADK**
2. **Create Master Agent** (start testing intent classification)
3. **Implement first workflow** (CreateDeckWorkflow)
4. **Test, measure, iterate**
5. **Document findings** as we go

This architecture provides a **future-proof, scalable, intent-based** system that can easily:
- Add new intents (e.g., "EXPORT_TO_PDF", "COLLABORATE")
- Add new agents (e.g., "AccessibilityChecker", "BrandCompliance")
- Support multi-turn conversations with state
- Scale to handle complex workflows

---

**Ready to start implementation!** 🚀
