# DeckRAI ADK Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DeckRAI Application                                │
│                                                                              │
│  ┌────────────────────┐         ┌─────────────────────┐                    │
│  │  React Frontend    │────────▶│  Firebase Backend   │                    │
│  │  - ChatInterface   │         │  - Authentication   │                    │
│  │  - SlideEditor     │         │  - Firestore DB     │                    │
│  └────────────────────┘         └─────────────────────┘                    │
│           │                                                                  │
│           │ User Input                                                       │
│           ▼                                                                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                       ADK Agent System                                │  │
│  │                                                                        │  │
│  │  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │  │
│  │  ┃                      MASTER AGENT                              ┃  │  │
│  │  ┃                   (Intent Classifier)                          ┃  │  │
│  │  ┃                                                                 ┃  │  │
│  │  ┃  Model: Gemini 2.5 Flash                                       ┃  │  │
│  │  ┃  Purpose: Analyze input → Classify intent → Route to workflow  ┃  │  │
│  │  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │  │
│  │                                │                                        │  │
│  │                                │ Intent Classification                  │  │
│  │                                ▼                                        │  │
│  │         ┌──────────────────────────────────────────────┐              │  │
│  │         │         INTENT ROUTER                         │              │  │
│  │         │  Routes to appropriate workflow agent         │              │  │
│  │         └──────────────────────────────────────────────┘              │  │
│  │                                │                                        │  │
│  │         ┌──────────┬───────────┼───────────┬──────────┐               │  │
│  │         │          │           │           │          │               │  │
│  │         ▼          ▼           ▼           ▼          ▼               │  │
│  │    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌─────────┐          │  │
│  │    │CREATE_ │ │EDIT_   │ │ANALYZE_│ │PLAN_   │ │QUICK_   │          │  │
│  │    │DECK    │ │SLIDES  │ │CONTENT │ │STRATEGY│ │QUESTION │          │  │
│  │    └────────┘ └────────┘ └────────┘ └────────┘ └─────────┘          │  │
│  │                                                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│           │                                                                  │
│           │ Generated Content                                                │
│           ▼                                                                  │
│  ┌────────────────────┐                                                     │
│  │   Slide Renderer   │                                                     │
│  └────────────────────┘                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Intent Flow Detail

```
User Message
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ prepareInputForMasterAgent()                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ {                                                            │ │
│ │   "user_input": "Create a pitch deck...",                   │ │
│ │   "context": {                                              │ │
│ │     "has_existing_deck": false,                             │ │
│ │     "slide_count": 0,                                       │ │
│ │     "conversation_history": [...]                           │ │
│ │   }                                                          │ │
│ │ }                                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────────┐
│ Master Agent (LlmAgent)                                          │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ Gemini 2.5 Flash analyzes input and context                  │ │
│ │ - Understands natural language intent                        │ │
│ │ - Extracts structured data (topic, requirements, targets)    │ │
│ │ - Assigns confidence score                                   │ │
│ │ - Determines next agent                                      │ │
│ └──────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│ parseMasterAgentResponse()                                       │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ {                                                            │ │
│ │   "intent": "CREATE_DECK",                                  │ │
│ │   "confidence": 0.95,                                       │ │
│ │   "reasoning": "User wants new presentation...",            │ │
│ │   "extracted_data": {                                       │ │
│ │     "topic": "AI product",                                  │ │
│ │     "requirements": {                                       │ │
│ │       "slide_count": 10,                                    │ │
│ │       "audience": "investors"                               │ │
│ │     }                                                        │ │
│ │   },                                                         │ │
│ │   "next_agent": "CreateDeckAgent"                           │ │
│ │ }                                                            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
     │
     ▼
Intent Router → Workflow Agent
```

## Workflow 1: CREATE_DECK

```
┌────────────────────────────────────────────────────────────────────────┐
│                         CREATE_DECK WORKFLOW                            │
│                       (SequentialAgent Pattern)                         │
└────────────────────────────────────────────────────────────────────────┘

Input: { topic, requirements: { audience, slide_count, style } }

     ▼
┌─────────────────────────┐
│  1. Vibe Detector       │  ──▶  Analyze topic emotional tone
│     (LlmAgent)          │       Output: { vibe, keywords }
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  2. Content Analyzer    │  ──▶  Extract key themes and structure
│     (LlmAgent)          │       Output: { themes, flow, priorities }
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  3. Master Planner      │  ──▶  Create slide-by-slide outline
│     (LlmAgent)          │       Output: { slides: [...], transitions }
└─────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Parallel Slide Generator                                 │
│     (ParallelAgent - Generates all slides concurrently)      │
│  ┌──────────────┐ ┌──────────────┐      ┌──────────────┐   │
│  │ Slide 1 Gen  │ │ Slide 2 Gen  │ ...  │ Slide N Gen  │   │
│  │ (LlmAgent)   │ │ (LlmAgent)   │      │ (LlmAgent)   │   │
│  └──────────────┘ └──────────────┘      └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
Final Output: Complete presentation with N slides
```

## Workflow 2: EDIT_SLIDES

```
┌────────────────────────────────────────────────────────────────────────┐
│                         EDIT_SLIDES WORKFLOW                            │
│                       (ParallelAgent Pattern)                           │
└────────────────────────────────────────────────────────────────────────┘

Input: { target_slides: ["slide_2", "slide_5"], instructions }

     ▼
┌─────────────────────────┐
│  1. Slide Target Parser │  ──▶  Parse @slide2, @all, "slide 2 and 5"
│     (LlmAgent)          │       Output: { slide_ids: [...] }
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  2. Edit Strategy Plan  │  ──▶  Determine edit approach per slide
│     (LlmAgent)          │       Output: { strategies: {...} }
└─────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Parallel Slide Editors                                   │
│     (ParallelAgent - Edits all target slides concurrently)   │
│  ┌──────────────┐ ┌──────────────┐      ┌──────────────┐   │
│  │ Edit Slide 2 │ │ Edit Slide 5 │ ...  │ Edit Slide N │   │
│  │ (LlmAgent)   │ │ (LlmAgent)   │      │ (LlmAgent)   │   │
│  └──────────────┘ └──────────────┘      └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
Final Output: Updated slides with changes applied
```

## Workflow 3: ANALYZE_CONTENT

```
┌────────────────────────────────────────────────────────────────────────┐
│                       ANALYZE_CONTENT WORKFLOW                          │
│                       (SequentialAgent Pattern)                         │
└────────────────────────────────────────────────────────────────────────┘

Input: { content_notes, context }

     ▼
┌─────────────────────────┐
│  1. Content Analyzer    │  ──▶  Extract themes, gaps, strengths
│     (LlmAgent)          │       Output: { analysis: {...} }
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  2. Question Generator  │  ──▶  Generate clarifying questions
│     (LlmAgent)          │       Output: { questions: [...] }
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  3. Suggestion Maker    │  ──▶  Provide improvement recommendations
│     (LlmAgent)          │       Output: { suggestions: [...] }
└─────────────────────────┘
     │
     ▼
Final Output: { analysis, questions, suggestions }
```

## Workflow 4: PLAN_STRATEGY

```
┌────────────────────────────────────────────────────────────────────────┐
│                       PLAN_STRATEGY WORKFLOW                            │
│                       (SequentialAgent Pattern)                         │
└────────────────────────────────────────────────────────────────────────┘

Input: { topic, audience, goals }

     ▼
┌─────────────────────────┐
│  1. Goal Analyzer       │  ──▶  Understand presentation objectives
│     (LlmAgent)          │       Output: { goals: [...] }
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  2. Audience Analyzer   │  ──▶  Profile target audience
│     (LlmAgent)          │       Output: { audience_profile: {...} }
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  3. Brand Researcher    │  ──▶  Research topic and best practices
│     (LlmAgent + Tools)  │       Output: { research: {...} }
└─────────────────────────┘
     │
     ▼
┌─────────────────────────┐
│  4. Structure Planner   │  ──▶  Design optimal presentation structure
│     (LlmAgent)          │       Output: { structure: {...} }
└─────────────────────────┘
     │
     ▼
Final Output: Complete strategic plan with structure
```

## Workflow 5: QUICK_QUESTION

```
┌────────────────────────────────────────────────────────────────────────┐
│                       QUICK_QUESTION WORKFLOW                           │
│                         (Single LlmAgent)                               │
└────────────────────────────────────────────────────────────────────────┘

Input: { question }

     ▼
┌─────────────────────────┐
│  QA Agent               │  ──▶  Direct answer using context
│  (LlmAgent)             │       Output: { answer: "..." }
└─────────────────────────┘
     │
     ▼
Final Output: Direct text answer
```

## ADK Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ADK Core Components                              │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│     Runner           │  Orchestrates agent execution
│  ┌────────────────┐  │
│  │ runAsync()     │──┼──▶ Async generator of events
│  └────────────────┘  │
└──────────────────────┘
         │
         │ manages
         ▼
┌──────────────────────┐
│  SessionService      │  Stores conversation history
│  ┌────────────────┐  │
│  │ createSession()│  │
│  │ getSession()   │  │
│  │ saveEvent()    │  │
│  └────────────────┘  │
└──────────────────────┘
         │
         │ stores
         ▼
┌──────────────────────┐
│     Session          │  Contains conversation state
│  ┌────────────────┐  │
│  │ userId         │  │
│  │ sessionId      │  │
│  │ events: [...]  │  │
│  │ state: {...}   │  │
│  └────────────────┘  │
└──────────────────────┘

┌──────────────────────┐
│   LlmAgent           │  Single-model agent
│  ┌────────────────┐  │
│  │ name           │  │
│  │ model          │──┼──▶ Gemini instance
│  │ instruction    │  │
│  │ tools: [...]   │  │
│  └────────────────┘  │
└──────────────────────┘

┌──────────────────────┐
│  SequentialAgent     │  Run agents in order
│  ┌────────────────┐  │
│  │ sub_agents: [] │──┼──▶ [Agent1, Agent2, ...]
│  └────────────────┘  │
│         │            │
│    Agent1 → Agent2   │
└──────────────────────┘

┌──────────────────────┐
│  ParallelAgent       │  Run agents concurrently
│  ┌────────────────┐  │
│  │ sub_agents: [] │──┼──▶ [Agent1, Agent2, ...]
│  └────────────────┘  │
│         │            │
│    Agent1 │ Agent2   │
│           ▽          │
└──────────────────────┘

┌──────────────────────┐
│      Gemini          │  Google's LLM integration
│  ┌────────────────┐  │
│  │ model          │──┼──▶ "gemini-2.5-flash"
│  │ apiKey         │  │
│  │ generateContent│  │
│  └────────────────┘  │
└──────────────────────┘
```

## Data Flow: Complete Example

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Complete Request Flow Example                         │
│              User: "Create a 5-slide deck about AI ethics"              │
└─────────────────────────────────────────────────────────────────────────┘

1. React Frontend
   │
   ├─▶ User types message in ChatInterface
   │
   └─▶ Calls: runMasterAgent(userInput, context)

2. Master Agent Preparation
   │
   ├─▶ prepareInputForMasterAgent() creates JSON:
   │   {
   │     "user_input": "Create a 5-slide deck about AI ethics",
   │     "context": {
   │       "has_existing_deck": false,
   │       "slide_count": 0,
   │       "conversation_history": []
   │     }
   │   }
   │
   └─▶ Pass to Runner.runAsync()

3. Master Agent Execution
   │
   ├─▶ Runner sends to Gemini 2.5 Flash via LlmAgent
   │
   ├─▶ Gemini analyzes input using instruction prompt
   │
   └─▶ Returns JSON response:
       {
         "intent": "CREATE_DECK",
         "confidence": 0.98,
         "reasoning": "Clear request to create new presentation",
         "extracted_data": {
           "topic": "AI ethics",
           "requirements": {
             "slide_count": 5,
             "audience": "general",
             "style": "professional"
           }
         },
         "next_agent": "CreateDeckAgent"
       }

4. Intent Router
   │
   ├─▶ parseMasterAgentResponse() extracts classification
   │
   ├─▶ Routes to CREATE_DECK workflow
   │
   └─▶ Initializes CreateDeckWorkflow(extracted_data)

5. CREATE_DECK Workflow (SequentialAgent)
   │
   ├─▶ Step 1: VibeDetector
   │   Input:  { topic: "AI ethics" }
   │   Output: { vibe: "thoughtful", tone: "balanced", keywords: [...] }
   │
   ├─▶ Step 2: ContentAnalyzer
   │   Input:  { topic, vibe }
   │   Output: { themes: ["Privacy", "Bias", "Transparency", ...] }
   │
   ├─▶ Step 3: MasterPlanner
   │   Input:  { topic, themes, slide_count: 5 }
   │   Output: {
   │     slides: [
   │       { title: "AI Ethics Overview", content: [...] },
   │       { title: "Privacy Concerns", content: [...] },
   │       { title: "Algorithmic Bias", content: [...] },
   │       { title: "Transparency & Trust", content: [...] },
   │       { title: "Future Considerations", content: [...] }
   │     ]
   │   }
   │
   └─▶ Step 4: ParallelSlideGenerator (ParallelAgent)
       ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
       │ Generate     │ │ Generate     │ │ Generate     │
       │ Slide 1      │ │ Slide 2      │ │ Slide 3-5    │
       │ (LlmAgent)   │ │ (LlmAgent)   │ │ (LlmAgent)   │
       └──────────────┘ └──────────────┘ └──────────────┘
             │                 │                 │
             └─────────────────┴─────────────────┘
                           │
                           ▼
                  Complete Presentation

6. Return to Frontend
   │
   ├─▶ Workflow outputs complete slide data
   │
   ├─▶ Frontend updates SlideEditor state
   │
   ├─▶ Slides rendered in UI
   │
   └─▶ User sees final presentation
```

## Hybrid Architecture: ADK + Direct Gemini

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Hybrid Architecture                              │
│           (Some features use ADK, others use direct Gemini)             │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│           ADK-Powered Features           │
│  (Multi-agent orchestration needed)      │
├──────────────────────────────────────────┤
│  ✓ Intent Classification                 │
│  ✓ Deck Creation Workflow                │
│  ✓ Multi-Slide Editing                   │
│  ✓ Content Analysis                      │
│  ✓ Strategic Planning                    │
│  ✓ Complex Q&A with Tools                │
└──────────────────────────────────────────┘
                    │
                    │ Uses
                    ▼
          ┌──────────────────┐
          │   ADK Agents     │
          │   + Workflows    │
          └──────────────────┘

┌──────────────────────────────────────────┐
│      Direct Gemini API Features          │
│  (Single-call operations)                │
├──────────────────────────────────────────┤
│  ✓ Image Generation (12 functions)       │
│    - generateSingleImage()               │
│    - generateSlideImages()               │
│    - generateTitleSlideImages()          │
│    - etc.                                │
│                                          │
│  ✓ Simple Text Operations                │
│    - Quick translations                  │
│    - Format conversions                  │
│    - Single-shot generations             │
└──────────────────────────────────────────┘
                    │
                    │ Uses
                    ▼
          ┌──────────────────┐
          │  Gemini API      │
          │  (Direct calls)  │
          └──────────────────┘

Why Hybrid?
━━━━━━━━━━
• ADK doesn't support imagen-3.0 models yet
• Some operations don't benefit from multi-agent orchestration
• Gradual migration allows testing ADK incrementally
• Best of both worlds: orchestration where needed, simplicity where possible
```

## Session & State Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Session Management Flow                             │
└─────────────────────────────────────────────────────────────────────────┘

User starts conversation
     │
     ▼
┌──────────────────────────────────────┐
│  sessionService.createSession()      │
│  {                                   │
│    userId: "user-123",               │
│    sessionId: "session-abc",         │
│    appName: "DeckRAI"                │
│  }                                   │
└──────────────────────────────────────┘
     │
     │ Creates
     ▼
┌──────────────────────────────────────┐
│         Session Object               │
│  {                                   │
│    id: "session-abc",                │
│    userId: "user-123",               │
│    events: [],                       │
│    state: {},                        │
│    createdAt: timestamp              │
│  }                                   │
└──────────────────────────────────────┘
     │
     │ User sends message
     ▼
┌──────────────────────────────────────┐
│  runner.runAsync({                   │
│    userId,                           │
│    sessionId,                        │
│    newMessage: { ... },              │
│    stateDelta: { ... }               │
│  })                                  │
└──────────────────────────────────────┘
     │
     │ Yields events
     ▼
┌──────────────────────────────────────┐
│  for await (const event of ...)     │
│  {                                   │
│    invocationId: "...",              │
│    author: "user" | "agent",         │
│    content: { ... },                 │
│    actions: { ... }                  │
│  }                                   │
└──────────────────────────────────────┘
     │
     │ Automatically saved to session
     ▼
┌──────────────────────────────────────┐
│  Session.events.push(event)          │
│  {                                   │
│    events: [                         │
│      { author: "user", ... },        │
│      { author: "agent", ... },       │
│      ...                             │
│    ]                                 │
│  }                                   │
└──────────────────────────────────────┘
     │
     │ Next message uses full history
     ▼
Agent has complete conversation context
```

## API Key Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      API Key Configuration Flow                          │
└─────────────────────────────────────────────────────────────────────────┘

Application starts
     │
     ▼
┌────────────────────────────────────────┐
│  User calls getMasterAgent()           │
└────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│  getApiKey() checks in order:          │
│                                        │
│  1. import.meta.env.VITE_GEMINI_API_KEY│  ─── Vite (browser/dev)
│     └─▶ Found? Return it              │
│                                        │
│  2. process.env.GEMINI_API_KEY         │  ─── Node.js
│     └─▶ Found? Return it              │
│                                        │
│  3. process.env.GOOGLE_GENAI_API_KEY   │  ─── ADK standard
│     └─▶ Found? Return it              │
│                                        │
│  4. return undefined                   │  ─── No key found
└────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│  createGeminiModel()                   │
│                                        │
│  if (!apiKey) {                        │
│    throw Error("API key required...")  │
│  }                                     │
│                                        │
│  return new Gemini({                   │
│    model: "gemini-2.5-flash",          │
│    apiKey                              │
│  })                                    │
└────────────────────────────────────────┘
     │
     ▼
┌────────────────────────────────────────┐
│  new LlmAgent({                        │
│    name: "DeckRAIMasterAgent",         │
│    model: geminiModel,  ◀──────────────┼─── Configured with API key
│    instruction: "..."                  │
│  })                                    │
└────────────────────────────────────────┘
```

---

**Legend**:
- `┌─┐ └─┘` = Containers/Components
- `┏━┓ ┗━┛` = Critical components (Master Agent)
- `─▶ ──▶` = Data flow
- `│ ▼` = Sequential flow
- `│ ▽` = Parallel flow

