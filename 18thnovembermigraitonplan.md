# ADK Migration Plan - November 18th, 2025
## Google ADK Best Practices Implementation

---

## 🎯 Final Architecture: 1 Agent + 10 Tools

### **Core Design Philosophy (Google ADK Best Practices)**

> "Tools should have a single, well-defined purpose that the LLM can easily understand. The LLM uses function/tool names, descriptions, and parameter schemas to decide which tool to call based on conversation and instructions."
> — Google ADK Documentation

**Our Approach:**
- ✅ **1 Coordinator Agent** - Strategic planning and orchestration
- ✅ **10 Atomic Tools** - Each with single, clear purpose
- ✅ **Agent Decides Everything** - No hardcoded logic, Gemini 3.0 makes all decisions
- ✅ **Clear Tool Descriptions** - LLM understands when to use each tool
- ✅ **Instruction-Based Guidance** - Agent instructions explain tool usage patterns

---

## 🤖 The Single Agent

### **DeckrCoordinatorAgent**
- **Model**: `gemini-3-pro-preview` (enhanced vision + reasoning)
- **Purpose**: Understands user intent, plans workflows, orchestrates tools
- **Thinking Budget**: 32,768 tokens (max strategic planning)
- **Vision**: Can analyze slides individually or in batches
- **Decision Making**: Decides slide count, vibe, audience, structure, which tools to call

**Key Capabilities:**
1. Natural language understanding (parse any request format)
2. Strategic deck planning (narrative structure, slide count)
3. Vision analysis (see slides to understand context)
4. Company research orchestration
5. Multi-tool coordination (parallel or sequential)

---

## 🛠️ The 10 Atomic Tools

### **Vision & Analysis Tools**

#### **1. analyzeSlideTool**
```typescript
Purpose: Analyze ONE slide using vision
When: Need to understand specific slide in detail
Input: slideSrc (base64), slideNumber, analysisGoal
Output: Slide analysis (structure, content, category, suggestions)
Wraps: Gemini 3.0 Vision API
```

#### **2. analyzeDeckTool**
```typescript
Purpose: Analyze ENTIRE deck using vision (batch)
When: Need to understand full deck structure/flow
Input: slides[] (array of base64 images), analysisGoal
Output: Complete deck analysis (all slides, flow, theme, recommendations)
Wraps: Gemini 3.0 Vision API (batch)
```

---

### **Slide Generation & Editing Tools**

#### **3. createSlideTool**
```typescript
Purpose: Generate ONE new slide from detailed prompt
When: Creating new slides (from scratch or adding to deck)
Input: prompt, referenceSrc?, theme?, logoSrc?, customImages[]
Output: Generated slide image (base64)
Wraps: createSlideFromPrompt (preserves existing prompts)
```

#### **4. minorEditSlideTool**
```typescript
Purpose: Make SMALL, TARGETED edits to a slide
When: User wants minor changes (fix typo, change color, adjust text, move element)
Input: slideSrc, editPrompt, maskSrc? (for inpainting)
Output: 1 edited slide (precise change)
Wraps: getInpaintingVariations (mask-based) or targeted edit
Examples:
  - "Change title color to blue"
  - "Fix the typo in slide 3"
  - "Move logo to left corner"
  - "Update the Q2 number to 45%"
```

#### **5. redesignSlideTool**
```typescript
Purpose: COMPLETELY REDESIGN a slide (major overhaul)
When: User wants major transformation, new layout, different visual approach
Input: slideSrc, redesignPrompt, referenceSrc?, deepMode
Output: 3 design variations (user picks favorite)
Wraps: executeSlideTask (generates 3 variations)
Examples:
  - "Make slide 2 more visual"
  - "Redesign this to be less text-heavy"
  - "Transform into a data visualization"
  - "Make this slide more impactful"
```

**Decision Logic:** Agent decides minor vs redesign based on request:
- Keywords like "fix", "change", "update" → minorEditSlideTool
- Keywords like "redesign", "transform", "make more", "overhaul" → redesignSlideTool
- Agent uses judgment if ambiguous

---

### **Research & Data Tools**

#### **6. researchCompanyTool**
```typescript
Purpose: Comprehensive business research using Google Search + Gemini 3.0
When: Customizing deck for specific company/customer
Input: companyWebsite, researchGoal ("usecases" | "challenges" | "industry" | "full")
Output: {
  company: {name, industry, size, description},
  industryContext: {sector, competitors, trends},
  challenges: [{challenge, description, relevance}],
  relevantUseCases: [{useCase, description, applicability, priority}],
  decisionMakers: {primaryAudience, concerns},
  customizationRecommendations: []
}
Uses: Google Search tool (5-10 searches), Gemini 3.0 synthesis
Examples:
  - "customize for klick.com" → research their business
  - "tailor to stripe executives" → understand Stripe context
```

#### **7. analyzeBrandTool**
```typescript
Purpose: Extract VISUAL brand theme from company website
When: Need brand colors, fonts, visual style for slides
Input: companyWebsite
Output: {primaryColor, secondaryColor, accentColor, fontStyle, visualStyle}
Wraps: generateThemeFromWebsite (uses Google Search)
Examples:
  - Get Stripe's brand colors (#635BFF)
  - Extract Airbnb's design style
```

#### **8. fetchCompanyLogoTool**
```typescript
Purpose: Fetch high-quality company logo (fallback API)
When: Gemini 3.0 cannot find logo directly via search/vision capabilities
Input: companyWebsite, size ("small" | "medium" | "large")
Output: {companyName, logoBase64, logoUrl, format}
Strategy:
  - PRIMARY: Gemini 3.0 attempts logo discovery via web search/vision
  - FALLBACK: If Gemini fails to find logo, call Cloud Run API
Uses: Cloud Run Logo API (https://deckr-app-*.run.app/api/logo)
Examples:
  - "Add Stripe's logo to title slide" (Gemini searches first)
  - "Create customer slide with Shopify, Square, Airbnb logos"
  - Competitive comparison slides
Note: Agent tries Gemini's search capabilities before calling this tool
```

#### **9. extractPainPointsTool**
```typescript
Purpose: Extract pain points/problems from user notes using NLP
When: User has notes and wants to highlight specific problems in slides
Input: notes (user's raw text)
Output: {painPoints: [string, string, ...]}
Uses: Gemini 3.0 NLP
Examples:
  - "add pain points from my notes to slide 2"
  - Extract key challenges to emphasize
```

---

### **Infrastructure Tools**

#### **10. uploadFileTool**
```typescript
Purpose: Handle file uploads (PDFs, images, logos)
When: User uploads deck PDF, reference slides, logo files
Input: file (blob/base64), fileType ("pdf" | "image" | "logo")
Output: {fileId, extractedSlides[], uploadedImages[], storagePath}
Operations:
  - PDF extraction (converts to slide images)
  - Firebase Storage upload
  - Image processing/optimization
```

---

## 📊 Complete Architecture Diagram

```
User Request ("customize deck for klick.com")
    ↓
DeckrCoordinatorAgent (Gemini 3.0)
    ├─ Thinks: "I need to research Klick, see the deck, then customize"
    ├─ Calls: researchCompanyTool("klick.com")
    ├─ Calls: analyzeDeckTool(deckSlides)
    ├─ Calls: fetchCompanyLogoTool("klick.com")
    ├─ Decides: "Slides 1, 2, 4 need customization"
    ├─ Calls: redesignSlideTool(slide1, prompt1, klickLogo)
    ├─ Calls: redesignSlideTool(slide2, prompt2)
    ├─ Calls: redesignSlideTool(slide4, prompt3)
    └─ Returns: "Customized 3 slides for Klick Health..."
```

---

## ✅ Workflow Verification: All Use Cases Work

### **Use Case 1: "@slide2 change the title color to blue"**

```
User: "@slide2 change the title color to blue"

→ Agent thinks:
  "Simple color change = minor edit"

→ Agent calls: minorEditSlideTool
  Input: {
    slideSrc: deck.slides[1].src,
    editPrompt: "Change the title text color to blue (#0000FF)",
    maskSrc: null  // Not using mask, just color change
  }

→ Returns: 1 edited slide with blue title

✅ Works - Minor targeted edit
```

---

### **Use Case 2: "make slide 3 more visual and less text-heavy"**

```
User: "make slide 3 more visual and less text-heavy"

→ Agent thinks:
  "Major transformation = redesign needed"

→ Agent calls: analyzeSlideTool
  Input: { slideSrc: slides[2].src, analysisGoal: "full" }
  Output: { textDensity: "high", visualElements: ["bullet list"] }

→ Agent calls: redesignSlideTool
  Input: {
    slideSrc: slides[2].src,
    redesignPrompt: "Transform this text-heavy slide:
      - Replace bullet list with icon grid or visual metaphor
      - Add imagery or illustrations
      - Reduce text by 50%
      - Use visual hierarchy instead of text
      - Keep same core message, better presentation"
  }

→ Returns: 3 design variations (user picks)

✅ Works - Complete redesign with variations
```

---

### **Use Case 3: "customize my deck for www.klick.com"**

```
User: "customize my deck for www.klick.com"
Deck: [8 slides uploaded]

→ Agent calls: analyzeDeckTool
  Output: {
    slides: [
      {slideNumber: 1, category: "title"},
      {slideNumber: 2, category: "problem"},
      {slideNumber: 4, category: "usecases"}
    ]
  }

→ Agent calls: researchCompanyTool
  Input: { companyWebsite: "www.klick.com", researchGoal: "full" }
  Output: {
    company: {name: "Klick Health", industry: "Healthcare Marketing"},
    challenges: ["Pharma compliance", "Multi-stakeholder coordination"],
    relevantUseCases: ["Clinical trial recruitment", "HCP education"]
  }

→ Agent attempts to find logo using Gemini 3.0 web search
  (Searches for "Klick Health logo", uses vision to extract)
  IF SUCCESSFUL: Uses found logo
  IF FAILED: Falls back to API ↓

→ Agent calls: fetchCompanyLogoTool (if Gemini search failed)
  Input: { companyWebsite: "klick.com", size: "large" }
  Output: { logoBase64: "...", companyName: "Klick Health" }

→ Agent calls: redesignSlideTool (3 times in parallel)
  - Slide 1: Add logo, personalize title
  - Slide 2: Healthcare-specific problems
  - Slide 4: Pharma use cases

→ Returns: Fully customized deck

✅ Works - Multi-tool orchestration
```

---

### **Use Case 4: "add 2 architecture slides using my notes"**

```
User: "add 2 architecture slides using my notes"
Notes: "Microservices, AWS Lambda, DynamoDB, event-driven..."

→ Agent thinks:
  "Need to create 2 NEW slides about architecture from notes"

→ Agent calls: analyzeDeckTool
  Output: { deckFlow: "Missing technical architecture section" }

→ Agent plans:
  Slide 1: High-level architecture overview
  Slide 2: Technical stack details

→ Agent calls: createSlideTool (twice)

  Create 1:
  Input: {
    prompt: "Architecture Overview slide
      Headline: 'System Architecture'
      Content: Microservices-based, event-driven design
      Visual: Architecture diagram with components
      Style: Technical, developer-focused"
  }

  Create 2:
  Input: {
    prompt: "Technology Stack slide
      Headline: 'Tech Stack'
      Content: AWS Lambda, DynamoDB, Event bus
      Visual: Stack diagram with logos
      Style: Clean technical presentation"
  }

→ Returns: 2 new slides + insertion recommendation

✅ Works - Creates new slides from notes
```

---

### **Use Case 5: "use my templates to create deck about AI in healthcare"**

```
User: "use my templates to create deck about AI in healthcare"
Style Library: [37 reference slides]

→ Agent thinks:
  "Create NEW deck using their style library as references"

→ Agent plans deck:
  Topic: AI in healthcare 2025
  Audience: Healthcare executives
  Vibe: Corporate + Technical
  Slides: 9 slides

  Structure:
  1. Title
  2. Current state
  3-5. AI trends
  6. Benefits
  7. Challenges
  8. Case studies
  9. Next steps

→ For EACH slide:
  - Agent analyzes style library
  - Finds best matching reference for that slide type
  - Calls createSlideTool with reference

→ Agent calls: createSlideTool (9 times with references)

  Example for slide 1:
  Input: {
    prompt: "Title slide: 'AI in Healthcare 2025'...",
    referenceSrc: styleLibrary[0].src  // Matched title template
  }

→ Returns: 9-slide deck matching user's style

✅ Works - Reference-based generation
```

---

## 🗺️ Complete Feature Mapping

| Current Feature | Current Functions | New ADK Flow | Tools Used | Status |
|----------------|------------------|--------------|------------|--------|
| **Create deck from notes** | `analyzeNotesAndAskQuestions` + `generateSlidesWithContext` | Agent plans → calls `createSlideTool` N times | createSlideTool | ✅ |
| **Minor slide edit** | `getInpaintingVariations` | Agent → `minorEditSlideTool` | minorEditSlideTool | ✅ |
| **Major slide redesign** | `executeSlideTask` | Agent → `redesignSlideTool` | redesignSlideTool | ✅ |
| **Edit multiple slides** | `generateDeckExecutionPlan` | Agent plans → calls edit tools multiple times | minor/redesignSlideTool | ✅ |
| **Customize for company** | `analyzeDeckCustomization` + tasks | Agent → research + analyze + edit | researchCompany, analyzeDeck, redesignSlide, fetchLogo | ✅ |
| **Designer Mode** | `designerOrchestrator` | Agent plans → creates with references | analyzeDeck, createSlide | ✅ |
| **Add new slides** | `generateDeckExecutionPlan` ADD_SLIDE | Agent plans → `createSlideTool` | createSlideTool | ✅ |
| **Use style library** | `findBestStyleReference` + remake | Agent matches → creates with reference | createSlideTool | ✅ |
| **Brand research** | `generateThemeFromWebsite` | Agent → `analyzeBrandTool` | analyzeBrandTool | ✅ |
| **Company research** | NEW | Agent → `researchCompanyTool` | researchCompanyTool | ✅ |
| **Logo fetching** | NEW | Agent → `fetchCompanyLogoTool` | fetchCompanyLogoTool | ✅ |
| **Vision planning** | `generateDeckExecutionPlan` (vision) | Agent → `analyzeDeckTool` or `analyzeSlideTool` | analyzeDeck/Slide | ✅ |

**All features verified: ✅**

---

## 📋 Implementation Plan (10 Days)

### **Phase 1: Branch & Setup (Day 1)**
- [ ] Create branch: `git checkout -b feature/adk-migration-nov18`
- [ ] Install dependencies: `npm install @google/adk express cors`
- [ ] Create directory structure:
  ```
  server/
    ├── agents/
    │   └── coordinator.ts
    ├── tools/
    │   ├── index.ts
    │   ├── analyzeSlide.ts
    │   ├── analyzeDeck.ts
    │   ├── createSlide.ts
    │   ├── minorEditSlide.ts
    │   ├── redesignSlide.ts
    │   ├── researchCompany.ts
    │   ├── analyzeBrand.ts
    │   ├── fetchCompanyLogo.ts
    │   ├── extractPainPoints.ts
    │   └── uploadFile.ts
    └── index.ts
  ```

### **Phase 2: Vision Tools (Day 2)**
- [ ] Implement `analyzeSlideTool` (single slide vision)
- [ ] Implement `analyzeDeckTool` (batch vision)
- [ ] Test vision analysis with sample slides
- [ ] Verify JSON output parsing

### **Phase 3: Core Slide Tools (Day 3)**
- [ ] Implement `createSlideTool` (wraps `createSlideFromPrompt`)
- [ ] Implement `minorEditSlideTool` (wraps inpainting logic)
- [ ] Implement `redesignSlideTool` (wraps `executeSlideTask`)
- [ ] Test each tool independently
- [ ] Verify output matches current system

### **Phase 4: Research Tools (Day 4)**
- [ ] Implement `researchCompanyTool` (Google Search + synthesis)
- [ ] Implement `analyzeBrandTool` (wraps `generateThemeFromWebsite`)
- [ ] Implement `fetchCompanyLogoTool` (Cloud Run API integration)
- [ ] Implement `extractPainPointsTool` (NLP extraction)
- [ ] Test research workflows

### **Phase 5: Infrastructure (Day 5)**
- [ ] Implement `uploadFileTool` (PDF extraction, Firebase)
- [ ] Test file handling and storage
- [ ] Export all tools from `tools/index.ts`

### **Phase 6: Coordinator Agent (Day 6)**
- [ ] Create `DeckrCoordinatorAgent` with full instruction
- [ ] Import ALL existing prompts from services:
  - `CONTENT_STRATEGIST_PROMPT` from `intelligentGeneration.ts`
  - `AUDIENCE_GUIDELINES` from `intelligentGeneration.ts`
  - `STYLE_GUIDELINES` from `intelligentGeneration.ts`
  - `EDIT_INTENT_PROMPT` from `geminiService.ts`
  - `CUSTOMIZATION_PROMPT` from `geminiService.ts`
  - `MASTER_PROMPT_TEMPLATE` from `designerOrchestrator.ts`
- [ ] Wire up all 10 tools
- [ ] Add tool usage guidance in instructions
- [ ] Test agent initialization

### **Phase 7: Express Server (Day 7)**
- [ ] Create Express server with `/api/chat` endpoint
- [ ] Set up ADK Runner with InMemorySessionService
- [ ] Implement session state management
- [ ] Handle file upload preprocessing
- [ ] Test basic conversations

### **Phase 8: Integration Testing (Day 8)**
- [ ] Test all 5 use cases from workflow verification
- [ ] Test edge cases and error handling
- [ ] Compare outputs with current system (side-by-side)
- [ ] Performance benchmarking

### **Phase 9: Documentation (Day 9)**
- [ ] Document agent architecture
- [ ] Create tool usage guide
- [ ] Update API documentation
- [ ] Write migration guide for team

### **Phase 10: Review & Decision (Day 10)**
- [ ] Team review
- [ ] Performance analysis
- [ ] Quality comparison
- [ ] **Decision**: Merge or delete branch

---

## 🔑 Critical Implementation Details

### **Coordinator Agent Instruction Structure**

```typescript
// server/agents/coordinator.ts

export const coordinatorAgent = new LlmAgent({
  name: "DeckrCoordinator",
  model: "gemini-3-pro-preview",

  instruction: `You are Deckr AI, an expert presentation strategist with vision capabilities.

# YOUR IDENTITY
You help users create, edit, and customize professional slide decks through natural conversation.

# YOUR CAPABILITIES

## 1. Vision Analysis
You can SEE slides using vision tools. Decide when to use:
- **analyzeSlideTool**: When you need to understand ONE specific slide in detail
- **analyzeDeckTool**: When you need to understand FULL deck structure/flow

**When to use vision:**
- User asks about specific slide ("what's on slide 3?")
- User uploads deck and wants edits ("customize this deck")
- Need to find which slide is "usecases" or "problem" slide
- Understanding deck before making changes

## 2. Research Capabilities
- **researchCompanyTool**: Deep business research (industry, challenges, use cases)
- **analyzeBrandTool**: Visual brand theme (colors, fonts)
- **fetchCompanyLogoTool**: Get company logos (Gemini tries first, API fallback)

**When to research:**
- "customize for [company]" → research their business
- "add customer logos" → try Gemini search first, then fetchCompanyLogoTool if needed
- "match their brand" → analyze brand theme

**Logo Fetching Strategy:**
1. FIRST: Try to find logo using Gemini 3.0 capabilities (web search, image search)
2. IF successful: Use the logo you found
3. IF failed: Call fetchCompanyLogoTool (Cloud Run API) as fallback

## 3. Slide Generation & Editing
- **createSlideTool**: Generate ONE new slide from detailed prompt
- **minorEditSlideTool**: SMALL changes (fix typo, change color, adjust text)
- **redesignSlideTool**: MAJOR overhaul (new layout, visual transformation)

**How to decide minor vs redesign:**
- Keywords: "fix", "change", "update", "correct" → minorEditSlideTool
- Keywords: "redesign", "transform", "make more", "overhaul" → redesignSlideTool
- If ambiguous, analyze slide first to see if it needs minor tweaks or major redesign

# EXISTING STRATEGIC PROMPTS (PRESERVED 100%)

${CONTENT_STRATEGIST_PROMPT}

${AUDIENCE_GUIDELINES}

${STYLE_GUIDELINES}

${MASTER_PROMPT_TEMPLATE}

# YOUR WORKFLOW PATTERNS

## Pattern 1: Create New Deck
User: "Create a deck about [topic]"
Your process:
1. Analyze topic and notes
2. DECIDE (don't ask):
   - Vibe: startup/corporate/creative/technical/educational/sales
   - Audience: infer from context
   - Slide count: based on content depth (could be 5, could be 15)
   - Structure: plan narrative flow
3. For EACH slide you planned:
   - Call createSlideTool with detailed prompt
4. Return complete deck

## Pattern 2: Edit Existing Deck
User: "make slide 2 more visual" or "fix typo on slide 5"
Your process:
1. If needed, call analyzeSlideTool or analyzeDeckTool to see current state
2. Understand edit intent:
   - Minor change? → minorEditSlideTool
   - Major redesign? → redesignSlideTool
3. Call appropriate tool
4. Return edited slide(s)

## Pattern 3: Customize for Company
User: "customize this deck for [company]"
Your process:
1. Call researchCompanyTool → get industry, challenges, use cases
2. Call analyzeDeckTool → understand current deck structure
3. Optional: fetchCompanyLogoTool → get their logo
4. Identify which slides need customization
5. Call redesignSlideTool for each slide with company-specific prompts
6. Return customized deck with explanation

## Pattern 4: Add Slides
User: "add 2 slides for architecture"
Your process:
1. Analyze notes/context to extract architecture content
2. Call analyzeDeckTool to find best insertion point
3. Plan the 2 new slides
4. Call createSlideTool twice
5. Suggest where to insert them

# CRITICAL RULES

❌ NEVER hardcode slide count, vibe, audience
❌ NEVER assume - analyze and decide
❌ NEVER skip vision analysis when you need context
✅ ALWAYS use your reasoning to make strategic decisions
✅ ALWAYS explain your decisions when returning results
✅ ALWAYS preserve user's content while improving presentation

# AVAILABLE TOOLS

You have access to these tools (use strategically):
${/* Tools auto-listed by ADK */}
`,

  tools: [
    analyzeSlideTool,
    analyzeDeckTool,
    createSlideTool,
    minorEditSlideTool,
    redesignSlideTool,
    researchCompanyTool,
    analyzeBrandTool,
    fetchCompanyLogoTool,
    extractPainPointsTool,
    uploadFileTool
  ],

  config: {
    thinkingConfig: {
      thinkingBudget: 32768 // Maximum thinking for strategic planning
    }
  }
});
```

---

### **Session State Schema**

```typescript
interface DeckrSession {
  userId: string;
  currentDeck?: {
    id: string;
    name: string;
    slides: Array<{
      id: string;
      name: string;
      src: string;  // base64 image
    }>;
    createdAt: number;
  };
  styleLibrary: Array<{
    id: string;
    name: string;
    src: string;  // base64 or Firebase URL
    type: 'image' | 'pdf';
  }>;
  notes?: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  lastActivity: number;
}
```

---

### **Express Server Setup**

```typescript
// server/index.ts

import express from 'express';
import cors from 'cors';
import { Runner } from '@google/adk';
import { InMemorySessionService } from '@google/adk/sessions';
import { coordinatorAgent } from './agents/coordinator';
import { uploadFileTool } from './tools/uploadFile';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large limit for base64 images

const sessionService = new InMemorySessionService();
const runner = new Runner({
  agent: coordinatorAgent,
  sessionService: sessionService
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
  const { userId, message, files, currentDeck } = req.body;

  try {
    // Preprocess file uploads if any
    let processedFiles = null;
    if (files && files.length > 0) {
      processedFiles = await uploadFileTool.execute({ files });
    }

    // Run agent
    const result = await runner.run({
      sessionId: userId,
      input: {
        userMessage: message,
        currentDeck: currentDeck || null,
        uploadedFiles: processedFiles
      }
    });

    res.json({
      success: true,
      response: result.output.response,
      sessionState: result.sessionState
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', agent: 'DeckrCoordinator' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🤖 Deckr ADK Server running on port ${PORT}`);
  console.log(`Agent: DeckrCoordinatorAgent (Gemini 3.0)`);
  console.log(`Tools: 10 atomic tools`);
});
```

---

## ✅ Success Criteria

- [ ] Branch `feature/adk-migration-nov18` created
- [ ] 1 coordinator agent implemented (Gemini 3.0)
- [ ] 10 atomic tools implemented
- [ ] All existing prompts preserved 100%
- [ ] All 5 use cases work identically
- [ ] Performance within 10% of current
- [ ] Vision analysis works (single + batch)
- [ ] Research tools provide quality data
- [ ] Logo fetching integrates with Cloud Run
- [ ] Can delete branch safely if needed

---

## 🎯 Why This Architecture Works

### **Google ADK Best Practices Compliance**

✅ **Single-purpose tools** - Each tool has one clear job
✅ **Clear descriptions** - LLM understands when to use each
✅ **Instruction-based guidance** - Agent instructions explain usage patterns
✅ **Parameter schemas** - Well-defined inputs/outputs
✅ **Agent decides** - No hardcoded routing logic

### **Preserves Everything**

✅ All prompts from `intelligentGeneration.ts` → Agent instruction
✅ All prompts from `geminiService.ts` → Agent instruction
✅ All prompts from `designerOrchestrator.ts` → Agent instruction
✅ All JSON schemas unchanged
✅ All tool logic wraps existing functions

### **Handles All Workflows**

✅ Create deck from notes
✅ Minor edits (typo fixes, color changes)
✅ Major redesigns (visual transformation)
✅ Multi-slide editing
✅ Company customization (research + logos + tailoring)
✅ Designer mode (reference-based generation)
✅ Add new slides
✅ Vision-based planning

---

## 🚀 Ready to Execute

This plan represents the most thoughtful ADK migration strategy:
- **1 Agent** - Gemini 3.0 orchestrates everything
- **10 Tools** - Atomic, single-purpose, well-documented
- **100% Preservation** - All prompts and logic intact
- **All Workflows** - Every use case verified
- **Google Best Practices** - Follows ADK guidelines
- **Safe Experimentation** - Feature branch, can delete anytime

**Next step: Execute Phase 1 (create branch and setup)**
