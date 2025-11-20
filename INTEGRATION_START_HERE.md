# Master Agent Integration - START HERE

## What You Need to Know

You're integrating a **master AI agent** with the **existing chat interface** in Deckr.ai.

**Current State:** Frontend makes direct Gemini API calls (no backend integration)
**Goal:** Route all AI requests through backend master agent
**Status:** 85% ready - just need integration code

---

## Three Documents to Read

### 1. THIS FILE (You are here)
- Overview and orientation
- Key findings summary
- Where to start

### 2. INTEGRATION_QUICK_REFERENCE.md
- Start here for implementation
- Three implementation steps with code
- Testing checklist
- Common issues and solutions

### 3. MASTER_AGENT_INTEGRATION_ANALYSIS.md
- Complete detailed analysis
- All file paths with line numbers
- Architecture diagrams
- Data structures
- Reference material

---

## Key Finding: What's Missing

**The codebase is 85% ready. Missing pieces:**

1. ❌ Backend `/api/chat` endpoint (in server/index.ts)
2. ❌ Master agent `processMessage()` implementation (in server/agent.ts)
3. ❌ Frontend API service `services/chatApi.ts` (doesn't exist)

**Everything else is done:**
- ✅ Chat UI components (production-ready)
- ✅ All 9 tools (fully implemented)
- ✅ System prompt (600+ lines, comprehensive)
- ✅ Type definitions (well-structured)

---

## Where Everything Is

### Frontend Chat (Ready to Use)
```
components/ChatLandingView.tsx     Main chat interface (700 lines)
  └─ handleGenerate() [Line 518]   User message handler
components/ChatInterface.tsx       Display component (482 lines)
components/ThinkingSection.tsx     Shows AI reasoning
components/ActionSummary.tsx       Shows results
```

### Backend Skeleton (Needs Implementation)
```
server/index.ts                    Express app (51 lines)
  └─ /api/chat POST endpoint       NEEDS: Call processMessage()
server/agent.ts                    Master agent (665 lines)
  ├─ MASTER_AGENT_PROMPT          ✅ Already written (lines 1-600)
  ├─ processMessage()              ❌ STUB - needs Gemini integration
  └─ getAgentGenerationConfig()    ✅ Ready
server/tools/                      All 9 tools
  ├─ analyzeSlideTool.ts           ✅ Ready
  ├─ createSlideTool.ts            ✅ Ready
  ├─ minorEditSlideTool.ts         ✅ Ready
  ├─ redesignSlideTool.ts          ✅ Ready
  ├─ researchCompanyTool.ts        ✅ Ready
  ├─ analyzeBrandTool.ts           ✅ Ready
  ├─ fetchCompanyLogoTool.ts       ✅ Ready
  └─ matchReferencesTool.ts        ✅ Ready
```

### Missing (Create New)
```
services/chatApi.ts                ❌ API wrapper for frontend
  └─ callChatAPI()                 Function to call /api/chat
```

---

## Current Architecture (What's Broken)

```
Frontend (Vite, Port 3000)
├─ User types message
├─ ChatLandingView.handleGenerate()
├─ Calls geminiService.generateDeckExecutionPlan() ← DIRECT GEMINI CALL
├─ Gemini API ← Exposed to browser
└─ Display results

Backend (Express, Port 3001)
└─ Exists but NOT USED
```

**Problem:** 
- Frontend makes direct Gemini API calls
- API keys exposed to browser
- No backend logic or tool orchestration
- No server-side conversation management

---

## Target Architecture (After Integration)

```
Frontend (Vite, Port 3000)
├─ User types message
├─ ChatLandingView.handleGenerate()
├─ Calls callChatAPI() ← New service
└─ POST /api/chat (to backend)

Backend (Express, Port 3001)
├─ /api/chat endpoint
├─ Calls processMessage()
├─ Gemini API with function calling
├─ Tool execution (createSlideTool, etc.)
└─ Return results with thinking steps

Frontend displays results
└─ Shows thinking steps
└─ Shows tool execution
└─ Shows generated slides
```

**Benefits:**
- API keys secure in backend
- Server-side conversation management
- Tool orchestration through single agent
- Better error handling
- Scalable to multiple users

---

## Quick Start - 3 Steps

### Step 1: Create services/chatApi.ts (30 min)
Simple wrapper to call backend API:
```typescript
export async function callChatAPI(message, conversationHistory, userId) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ userId, message, conversationHistory })
  });
  return res.json();
}
```

### Step 2: Implement /api/chat (30 min)
In server/index.ts, replace the 501 error with:
```typescript
app.post('/api/chat', async (req, res) => {
  const { userId, message, conversationHistory } = req.body;
  const result = await processMessage(message, conversationHistory);
  res.json(result);
});
```

### Step 3: Implement processMessage() (2-3 hours)
In server/agent.ts, replace the stub with:
```typescript
export async function processMessage(userMessage, conversationHistory) {
  // Use Gemini API with function calling
  // Call appropriate tools based on intent
  // Return response with thinking steps
}
```

---

## What Does the Chat Interface Need?

The frontend chat expects responses in this format:

```typescript
{
  success: boolean;
  response: string;              // Main AI response text
  thinking?: {
    steps: [
      { id: '1', title: 'Analyzing...', status: 'completed', type: 'thinking' },
      { id: '2', title: 'Planning...', status: 'completed', type: 'generating' }
    ];
    duration: '2.3s';
  };
  toolCalls?: [
    { tool: 'createSlideTool', params: {...}, result: {...} }
  ];
}
```

The UI already knows how to:
- Display thinking steps beautifully
- Show tool execution progress
- Display generated slides in preview
- Handle action summaries
- Show conversation history

**Your job:** Just provide the data in the right format.

---

## File Navigation

### For Implementing Backend Integration
1. **INTEGRATION_QUICK_REFERENCE.md** - Code examples for each step
2. **MASTER_AGENT_INTEGRATION_ANALYSIS.md** - Detailed reference
3. **server/agent.ts** - System prompt and current implementation
4. **server/tools/** - Available tools to wire in

### For Understanding Frontend Chat
1. **components/ChatLandingView.tsx** - Line 518: handleGenerate()
2. **components/ChatInterface.tsx** - Message display logic
3. **components/ThinkingSection.tsx** - Thinking steps display
4. **types.ts** - ChatMessage and ThinkingStep interfaces

### For API Specifications
1. **MASTER_AGENT_INTEGRATION_ANALYSIS.md** - Data structures section
2. **server/types.ts** - Type definitions for tools and responses

---

## Key Insight: Tools are Already Built

All 9 tools are **fully implemented** in `server/tools/`. You don't need to:
- Write tool code (already done)
- Handle image processing (tools do it)
- Manage Gemini API for each tool (tools do it)

You only need to:
1. Call Gemini with the right tool definitions
2. Let Gemini decide which tools to use
3. Execute the tool calls
4. Return results

The tools handle all the complex logic internally.

---

## Timeline Estimate

- Phase 1 (services/chatApi.ts): 30 minutes
- Phase 2 (/api/chat endpoint): 30 minutes  
- Phase 3 (processMessage implementation): 2-3 hours
- Testing & debugging: 1-2 hours

**Total: 4-6 hours**

---

## Success Criteria

After integration, you should be able to:
- [ ] Type a message in chat
- [ ] Message goes to `/api/chat` endpoint
- [ ] Backend analyzes intent
- [ ] Appropriate tools are called
- [ ] Results return with thinking steps
- [ ] Chat UI displays thinking section
- [ ] Chat UI displays results
- [ ] Conversation history persists

---

## Common Gotchas

1. **API Keys:** Move to backend .env, don't expose to frontend
2. **Tool Definitions:** Must match Gemini function calling format
3. **Thinking Steps:** Must return with correct status values
4. **Conversation History:** Must pass as Array<{role, content}>
5. **CORS:** Already enabled in server (check it's correct)

See **INTEGRATION_QUICK_REFERENCE.md** for solutions.

---

## Need Help?

1. **Quick start:** Read INTEGRATION_QUICK_REFERENCE.md
2. **Detailed info:** Read MASTER_AGENT_INTEGRATION_ANALYSIS.md
3. **Code examples:** See INTEGRATION_QUICK_REFERENCE.md "Three Implementation Steps"
4. **Troubleshooting:** See INTEGRATION_QUICK_REFERENCE.md "Common Issues & Solutions"

---

## Next Actions

1. ✅ Read this file (you're done)
2. → Read INTEGRATION_QUICK_REFERENCE.md
3. → Create services/chatApi.ts (Phase 1)
4. → Implement /api/chat endpoint (Phase 2)
5. → Implement processMessage() (Phase 3)
6. → Test and debug
7. → Deploy

---

**You've got this. The hard work is already done. 85% of the codebase is ready.**

All three missing pieces are straightforward glue code. No complex logic needed.
