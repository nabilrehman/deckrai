# Master Agent Integration Analysis - Deckr.ai

## Executive Summary

The Deckr.ai codebase has a **Vite-based React frontend** and a **separate Express backend** (server/). The master agent in `server/agent.ts` is currently a **stub** with no actual implementation. The chat interface expects to integrate with backend services but currently calls **client-side Gemini services directly**.

**Key Finding:** There is **NO current API integration** between the frontend chat and the server agent. The frontend needs to be modified to call the backend `/api/chat` endpoint instead of making direct Gemini API calls.

---

## File Structure Overview

### Current Architecture
```
deckr.ai-fina/
├── components/               # React UI components
│   ├── ChatLandingView.tsx   # Main chat interface (700+ lines)
│   ├── ChatInterface.tsx      # Chat message display (482 lines)
│   ├── RightChatPanel.tsx    # Sidebar chat panel
│   ├── ChatController.tsx    # Chat orchestration
│   └── ... (other UI components)
│
├── services/                 # Client-side services
│   ├── geminiService.ts      # Direct Gemini API calls
│   ├── intelligentGeneration.ts
│   ├── brandResearch.ts
│   ├── referenceMatchingEngine.ts
│   └── ... (other services)
│
├── server/                   # Express backend (SEPARATE PROCESS)
│   ├── agent.ts             # Master agent (STUB - needs implementation)
│   ├── index.ts             # Express app with /api/chat endpoint (NOT IMPLEMENTED)
│   ├── types.ts             # Type definitions
│   ├── tools/               # Tool implementations
│   │   ├── analyzeSlideTool
│   │   ├── createSlideTool
│   │   ├── minorEditSlideTool
│   │   ├── redesignSlideTool
│   │   ├── researchCompanyTool
│   │   ├── analyzeBrandTool
│   │   ├── fetchCompanyLogoTool
│   │   └── matchReferencesTool
│   └── agents/              # Coordinator agent
│
├── vite.config.ts           # Vite config (Vite + React)
└── tsconfig.json
```

### Key Insight: Two Separate Processes
- **Frontend (Vite):** Runs on port 3000, makes direct Gemini API calls via services
- **Backend (Express):** Runs on port 3001, has `/api/chat` endpoint but NOT YET IMPLEMENTED
- **Current state:** Frontend does NOT call backend - completely client-side

---

## Current Chat Flow (Client-Side Only)

### ChatLandingView.tsx - Main Entry Point

**File:** `/Users/nabilrehman/Downloads/deckr.ai-fina/components/ChatLandingView.tsx` (700+ lines)

**State Management:**
```typescript
const [chatActive, setChatActive] = useState(false);           // Is chat visible?
const [messages, setMessages] = useState<ChatMessage[]>([]);  // Message history
const [isProcessing, setIsProcessing] = useState(false);      // Is AI working?
const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]); // Progress steps

// Chat message format
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  thinking?: {
    steps: ThinkingStep[];
    duration: string;
  };
  actions?: { label, icon, items };
  component?: React.ReactNode;       // Inline components (buttons, etc.)
  slidePreview?: Slide[];            // Generated slides
}
```

**Main Handler: `handleGenerate()` (Line 518)**

```typescript
const handleGenerate = useCallback(async (mentionedSlideIds?: string[]) => {
  const userPrompt = inputValue.trim();
  setInputValue('');
  setChatActive(true);
  
  // 1. Add user message
  addMessage({ role: 'user', content: userPrompt });
  
  // 2. Check if files uploaded
  if (uploadedDeckSlides.length > 0 || uploadedAssets.length > 0) {
    // ... Call generateDeckExecutionPlan directly (CLIENT-SIDE)
    const plan = await generateDeckExecutionPlan(
      extendedPrompt,
      allUploadedFiles.map(s => ({ id: s.id, name: s.name, src: s.originalSrc }))
    );
    
    // 3. Add AI response with plan
    addMessage({
      role: 'assistant',
      content: 'I've analyzed your request...',
      thinking: { steps: thinkingSteps, duration },
      component: <PlanApprovalButtons />
    });
  }
}, [inputValue, ...]);
```

**Flow Diagram:**
```
User Types Message
        ↓
ChatLandingView.handleGenerate()
        ↓
Add user message to state
        ↓
Check if files uploaded?
        ├─ YES → Call geminiService.generateDeckExecutionPlan() directly
        └─ NO  → Show thinking steps, add assistant message
        ↓
User clicks "Approve Plan"
        ↓
executeCustomizationPlan() → Call createSlideFromPrompt() directly
        ↓
Update slides, add success message
```

---

## Backend Infrastructure

### Server/index.ts - Express App (Stub)

**File:** `/Users/nabilrehman/Downloads/deckr.ai-fina/server/index.ts` (51 lines)

**Current State:**
```typescript
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check - WORKS
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'deckr-adk-server',
    agent: 'DeckrCoordinatorAgent',
    version: '1.0.0-alpha'
  });
});

// Chat endpoint - NOT IMPLEMENTED
app.post('/api/chat', async (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Chat endpoint not yet implemented. Phase 2-6 in progress.'
  });
});

// GET handler for info
app.get('/api/chat', (req, res) => {
  res.json({
    message: 'Deckr ADK Chat Endpoint',
    usage: 'Send POST request with JSON body: { "userId": "...", "message": "..." }',
    status: 'Phase 1 Complete ✓',
    implementation: 'Phase 2-6 in progress'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🤖 Deckr ADK Server running on port ${PORT}`));
```

### Server/agent.ts - Master Agent (Stub)

**File:** `/Users/nabilrehman/Downloads/deckr.ai-fina/server/agent.ts` (665 lines)

**Structure:**
- **Lines 1-600:** Comprehensive system prompt (MASTER_AGENT_PROMPT)
  - Defines agent personality, capabilities, use cases
  - Documents all 9 tools and when to use them
  - Includes workflow examples and best practices
  
- **Lines 625-631:** `getAgentGenerationConfig()` - Configuration function
  
- **Lines 636-665:** `processMessage()` - STUB IMPLEMENTATION
```typescript
export async function processMessage(
  userMessage: string,
  conversationHistory: Array<{role: string; content: string}> = []
) {
  try {
    // TODO: Implement actual agent conversation with tool calling
    return {
      success: true,
      response: 'Agent integration coming soon! Tools are ready.',
      thinking: {
        steps: [
          { id: '1', title: 'Understanding request', status: 'completed', type: 'thinking' },
          { id: '2', title: 'Planning approach', status: 'completed', type: 'thinking' },
        ],
        duration: '2s'
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
```

**Key Issue:** This function returns a hardcoded response. It doesn't:
- Actually call the Gemini API
- Use the tools
- Process conversation history
- Implement the MASTER_AGENT_PROMPT

---

## Available Tools (Ready to Use)

All tools are implemented and ready in `server/tools/`:

1. **analyzeSlideTool** - Review slides for quality, identify issues
2. **analyzeDeckTool** - Analyze entire decks for structure and flow
3. **createSlideTool** - Generate new slides from descriptions
4. **minorEditSlideTool** - Make small changes to existing slides (inpainting + instruction modes)
5. **redesignSlideTool** - Complete slide redesigns (generates 3 variations)
6. **researchCompanyTool** - Research companies, industries, challenges
7. **analyzeBrandTool** - Extract brand guidelines (colors, fonts, style)
8. **fetchCompanyLogoTool** - Find company logos
9. **matchReferencesTool** - Match slides to reference templates (AI-powered)

**Example Tool File:** `server/tools/createSlide.ts`
```typescript
export async function createSlideTool(
  slideDescription: string,
  referenceImageBase64?: string,
  additionalImages?: ImageInput[]
): Promise<{
  success: boolean;
  images: string[];
  description: string;
  designDetails: any;
}> {
  // Implementation uses Gemini 2.5 Flash for image generation
  // Supports multiple reference images
  // Returns base64 image data
}
```

---

## Integration Points - Where to Connect Master Agent

### 1. Backend `/api/chat` Endpoint (Priority 1)

**File:** `server/index.ts` (line 25)

**Current:**
```typescript
app.post('/api/chat', async (req, res) => {
  res.status(501).json({ success: false, error: 'Not implemented' });
});
```

**Needed Implementation:**
```typescript
app.post('/api/chat', async (req, res) => {
  const { userId, message, conversationHistory } = req.body;
  
  try {
    // Call master agent
    const result = await processMessage(message, conversationHistory);
    
    return res.json({
      success: result.success,
      response: result.response,
      thinking: result.thinking,
      toolCalls: result.toolCalls  // What tools were called?
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### 2. Master Agent `processMessage()` Function (Priority 1)

**File:** `server/agent.ts` (line 636)

**Current:**
```typescript
export async function processMessage(userMessage: string, conversationHistory = []) {
  // TODO: Implement actual agent conversation with tool calling
  return { success: true, response: 'Agent integration coming soon!' };
}
```

**Needed:**
- Integrate with Gemini API using tool calling
- Use system prompt (MASTER_AGENT_PROMPT)
- Call appropriate tools based on intent
- Stream tool execution progress
- Build conversation history context

### 3. Frontend - Replace Direct Gemini Calls with Backend API

**Files to Modify:**

A. **ChatLandingView.tsx (Line 518 - handleGenerate)**
```typescript
// CURRENT (direct Gemini call)
const plan = await generateDeckExecutionPlan(
  extendedPrompt,
  allUploadedFiles.map(...)
);

// NEEDED (backend API call)
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: user?.uid,
    message: userPrompt,
    conversationHistory: messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  })
});

const { response, thinking } = await response.json();
```

B. **Services to create new service/chatApi.ts:**
```typescript
// New service for backend API calls
export async function chatWithAgent(
  userMessage: string,
  conversationHistory: ChatMessage[],
  userId?: string
): Promise<{
  response: string;
  thinking?: { steps: ThinkingStep[]; duration: string };
  toolCalls?: Array<{ tool: string; params: any; result: any }>;
  slides?: Slide[];
}> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      message: userMessage,
      conversationHistory: conversationHistory.map(m => ({
        role: m.role,
        content: m.content
      }))
    })
  });
  
  if (!res.ok) throw new Error('API error');
  return res.json();
}
```

---

## Message Flow - Current vs. Needed

### Current Flow (Client-Side Only)
```
User Input
    ↓
ChatLandingView.handleGenerate()
    ↓
Call geminiService.generateDeckExecutionPlan() directly
    ↓
Call geminiService.createSlideFromPrompt() directly
    ↓
Display results
```

### Needed Flow (With Backend Agent)
```
User Input
    ↓
ChatLandingView.handleGenerate()
    ↓
Call POST /api/chat with message + history
    ↓
Backend processMessage() analyzes intent
    ↓
Backend calls appropriate tools (analyzeSlideTool, createSlideTool, etc.)
    ↓
Backend returns response + tool results
    ↓
Display results with thinking steps
```

---

## Data Structures

### ChatMessage Interface
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  
  // Optional thinking section (shows AI reasoning)
  thinking?: {
    steps: ThinkingStep[];  // [{'Understanding request', 'active'}, ...]
    duration: string;        // "2.3s"
  };
  
  // Optional action summary (shows what was generated)
  actions?: {
    label: string;
    icon: 'sparkles' | 'check' | 'edit' | 'file';
    items: ActionItem[];
  };
  
  // Optional inline component (buttons, plan display, etc.)
  component?: React.ReactNode;
  
  // Optional slide preview
  slidePreview?: Slide[];
}
```

### ThinkingStep Interface
```typescript
interface ThinkingStep {
  id: string;
  title: string;           // "Analyzing request..."
  content?: string;         // Optional detailed explanation
  status: 'pending' | 'active' | 'completed';
  type?: 'thinking' | 'generating' | 'processing';
  timestamp?: number;
}
```

### API Request/Response
```typescript
// Request to /api/chat
{
  userId: string;
  message: string;
  conversationHistory: Array<{ role: string; content: string }>;
}

// Response from /api/chat
{
  success: boolean;
  response: string;
  thinking?: {
    steps: ThinkingStep[];
    duration: string;
  };
  toolCalls?: Array<{
    tool: string;
    params: any;
    result: any;
  }>;
  slides?: Slide[];
}
```

---

## Existing Services Using Gemini Directly

These services currently call Gemini API directly and need refactoring to use backend agent:

1. **geminiService.ts**
   - `createSlideFromPrompt()` - Should use backend's createSlideTool
   - `generateDeckExecutionPlan()` - Should use backend's master agent
   - `findBestStyleReferenceFromPrompt()` - Could use backend research tools

2. **intelligentGeneration.ts**
   - `analyzeNotesAndAskQuestions()` - Master agent's intent detection
   - `generateSlidesWithContext()` - Should use backend's createSlideTool

3. **brandResearch.ts**
   - `researchBrandAndCreateTheme()` - Should use backend's researchCompanyTool + analyzeBrandTool

4. **referenceMatchingEngine.ts**
   - Should use backend's matchReferencesTool

**Pattern for Refactoring:**
```typescript
// BEFORE (direct Gemini call in services)
export async function createSlideFromPrompt(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
  const model = ai.generativeModel({ model: 'gemini-2.5-flash' });
  // Direct API call...
}

// AFTER (through backend agent)
export async function createSlideFromPrompt(prompt: string) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      message: `Create a slide: ${prompt}`,
      // Let backend agent call the tool
    })
  });
  return response.json();
}
```

---

## Three-Phase Integration Plan

### Phase 1: Implement Backend `/api/chat` Endpoint
- Create endpoint that calls `processMessage()`
- Return thinking steps and tool call results
- Test with curl/Postman

### Phase 2: Implement Master Agent's `processMessage()` Function
- Use Gemini API with function calling
- Build tool definitions from available tools
- Call appropriate tools based on user intent
- Stream progress updates

### Phase 3: Refactor Frontend to Use Backend API
- Replace direct geminiService calls with `/api/chat` calls
- Update ChatLandingView.handleGenerate() to call backend
- Create services/chatApi.ts wrapper
- Update message display to show tool execution

---

## Key Observations

### What's Already Done Well
- ✅ Chat UI components are production-ready (ChatLandingView, ChatInterface)
- ✅ Message format supports thinking steps, action summaries, inline components
- ✅ All 9 tools are fully implemented and tested
- ✅ Comprehensive system prompt exists for agent
- ✅ Firebase integration for chat history storage
- ✅ TypeScript types well-defined for all components

### What's Missing
- ❌ Backend `/api/chat` endpoint implementation
- ❌ Master agent's `processMessage()` function (just a stub)
- ❌ Gemini API integration in backend (tool calling, conversation)
- ❌ Frontend API client (services/chatApi.ts)
- ❌ Communication between frontend and backend

### Current Limitation
The app currently makes **direct Gemini calls from the browser** (client-side), which means:
- API keys exposed to frontend
- Larger bundle size
- No server-side logic or tool orchestration
- No conversation persistence on backend

---

## Recommended Integration Approach

**Architecture After Integration:**
```
Frontend (Vite Port 3000)
├── ChatLandingView.tsx
│   └── Call POST /api/chat
│
Backend (Express Port 3001)
├── /api/chat
│   └── Call processMessage(userMessage, history)
│       └── Use Gemini with function calling
│           ├── Call analyzeSlideTool
│           ├── Call createSlideTool
│           └── Call other tools as needed
└── /health (for monitoring)
```

**Benefits:**
- No API keys in frontend code
- Server-side conversation management
- Tool orchestration through single agent
- Better error handling and logging
- Scalable to multiple users

---

## Summary Table

| Component | Location | Status | Purpose |
|-----------|----------|--------|---------|
| Chat UI | components/ChatLandingView.tsx | ✅ Ready | Main chat interface |
| Message Display | components/ChatInterface.tsx | ✅ Ready | Render chat history |
| Backend Server | server/index.ts | ❌ Stub | Express app |
| Master Agent | server/agent.ts | ❌ Stub | Orchestrate tools |
| Tools | server/tools/ | ✅ Ready | Vision + research |
| API Client | services/chatApi.ts | ❌ Missing | Frontend API calls |
| Thinking UI | components/ThinkingSection.tsx | ✅ Ready | Show AI reasoning |
| Action Summary | components/ActionSummary.tsx | ✅ Ready | Show results |

