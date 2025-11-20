# Master Agent Integration - Quick Reference

## At a Glance

**Current State:** Frontend makes direct Gemini API calls (no backend integration)
**Goal:** Route all AI requests through backend master agent via `/api/chat` endpoint
**Status:** Backend skeleton ready, implementation needed

---

## Key Files to Know

### Frontend Chat Components
- **ChatLandingView.tsx** (Line 518) - Main message handler `handleGenerate()`
  - User types message → adds to chat → calls Gemini directly
  - NEEDS: Replace geminiService calls with `/api/chat` calls
  
- **ChatInterface.tsx** - Display component for messages
  - Shows thinking steps, action summaries, slide previews
  - Status: Ready to use, no changes needed

### Backend Files
- **server/index.ts** - Express app with `/api/chat` endpoint (NOT IMPLEMENTED)
  - Status: Skeleton only, returns 501 error
  - NEEDS: Call `processMessage()` from agent.ts

- **server/agent.ts** - Master agent orchestrator
  - Line 636: `processMessage()` is a stub returning hardcoded response
  - Line 1-600: Comprehensive system prompt (ready to use)
  - NEEDS: Implement Gemini API integration with function calling

- **server/tools/** - All 9 tools are fully implemented
  - Status: Ready to use immediately
  - Examples: createSlideTool, analyzeSlideTool, researchCompanyTool, etc.

### Missing Files
- **services/chatApi.ts** - Wrapper for `/api/chat` calls
  - NEEDS: Create new file to centralize backend API communication

---

## Three Implementation Steps

### Step 1: Create Frontend API Service
**File:** Create `services/chatApi.ts`

```typescript
export async function callChatAPI(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userId?: string
) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, message, conversationHistory })
  });
  
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  return response.json();
}
```

### Step 2: Implement Backend `/api/chat` Endpoint
**File:** `server/index.ts` (replace line 25)

```typescript
app.post('/api/chat', async (req, res) => {
  const { userId, message, conversationHistory } = req.body;
  
  try {
    const result = await processMessage(message, conversationHistory);
    res.json({
      success: result.success,
      response: result.response,
      thinking: result.thinking,
      toolCalls: result.toolCalls
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

### Step 3: Implement Master Agent
**File:** `server/agent.ts` (replace lines 636-665)

```typescript
export async function processMessage(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = []
) {
  const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
  const model = ai.generativeModel({
    model: 'gemini-2.0-flash-exp',
    tools: buildToolDefinitions(),  // Tools from server/tools/
    systemPrompt: MASTER_AGENT_PROMPT  // Already defined in file
  });

  const messages = [...conversationHistory, { role: 'user', content: userMessage }];
  
  // Stream response and handle tool calls
  const response = await model.generateContent({
    contents: messages
  });
  
  // Parse tool calls and execute them
  // Return response with thinking steps and results
}
```

---

## Current Message Handler (ChatLandingView.tsx, Line 518)

```typescript
const handleGenerate = useCallback(async (mentionedSlideIds?: string[]) => {
  const userPrompt = inputValue.trim();
  
  // 1. Add user message to chat
  addMessage({ role: 'user', content: userPrompt });
  
  // 2. Check if files uploaded
  if (uploadedDeckSlides.length > 0) {
    // CURRENT: Direct Gemini call
    const plan = await generateDeckExecutionPlan(
      userPrompt,
      allUploadedFiles.map(...)
    );
    
    // NEEDED: Backend call
    const { response, thinking } = await callChatAPI(
      userPrompt,
      messages.map(m => ({ role: m.role, content: m.content })),
      user?.uid
    );
    
    // Add response to chat
    addMessage({
      role: 'assistant',
      content: response,
      thinking: thinking
    });
  }
}, [inputValue, ...]);
```

**Changes Needed:**
1. Import `callChatAPI` from services/chatApi.ts
2. Replace `generateDeckExecutionPlan()` call with `callChatAPI()`
3. Format response into ChatMessage format with thinking steps

---

## Data Flow After Integration

### Current (Direct Gemini)
```
User input
  ↓
ChatLandingView.handleGenerate()
  ↓
geminiService.generateDeckExecutionPlan()
  ↓
Direct Gemini API call in browser
  ↓
Return results
```

### After Integration (Backend Agent)
```
User input
  ↓
ChatLandingView.handleGenerate()
  ↓
callChatAPI() → POST /api/chat
  ↓
server/index.ts → processMessage()
  ↓
server/agent.ts → Gemini with function calling
  ↓
Tools execution (createSlideTool, analyzeSlideTool, etc.)
  ↓
Return results with thinking steps
```

---

## Testing Checklist

- [ ] Backend server runs on port 3001
- [ ] `/health` endpoint returns 200 OK
- [ ] `/api/chat` POST endpoint receives requests
- [ ] Master agent identifies user intent correctly
- [ ] Appropriate tools are called based on intent
- [ ] Frontend receives response with thinking steps
- [ ] Chat UI displays thinking section properly
- [ ] Slides are displayed in preview
- [ ] Conversation history persists

---

## Environment Setup

### Frontend (Vite)
```bash
npm install
npm run dev  # Runs on http://localhost:3000
```

### Backend (Express)
```bash
# Make sure VITE_GEMINI_API_KEY is set in .env
node server/index.ts  # Runs on http://localhost:3001
# OR
npm run dev:server    # If script is configured
```

**API Key Setup:**
- Frontend: Uses `process.env.VITE_GEMINI_API_KEY`
- Backend: Same key (passed via env vars)
- Keep key in `.env` (gitignored), not in code

---

## Helper Functions Already Available

### Frontend
- `addMessage()` - Add message to chat state
- `updateThinkingStep()` - Update progress step status
- `addThinkingStep()` - Add new progress step
- `launderImageSrc()` - Clean image data URLs

### Backend
- `allTools` - All tool definitions (server/tools/index.ts)
- `MASTER_AGENT_PROMPT` - System prompt for agent
- `getAgentGenerationConfig()` - Agent configuration
- Tool functions: `createSlideTool()`, `analyzeSlideTool()`, etc.

---

## Common Issues & Solutions

### Issue: Frontend can't reach backend API
**Solution:** Make sure backend is running on port 3001 and CORS is enabled
```typescript
app.use(cors());  // Already in server/index.ts
```

### Issue: Tools aren't being called
**Solution:** Build correct tool definitions in `processMessage()`
```typescript
const toolDefinitions = allTools.map(tool => ({
  name: tool.name,
  description: tool.description,
  inputSchema: tool.schema
}));
```

### Issue: Thinking steps not showing
**Solution:** Include thinking array in response
```typescript
res.json({
  response: "...",
  thinking: {
    steps: [
      { id: '1', title: 'Analyzing...', status: 'completed' }
    ],
    duration: "2.3s"
  }
});
```

### Issue: API keys exposed in frontend
**Solution:** Don't use API keys in frontend - all API calls go through backend
```typescript
// ❌ BAD (in frontend)
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

// ✅ GOOD (in backend)
const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });
// Frontend just calls POST /api/chat
```

---

## References

- **Full Analysis:** MASTER_AGENT_INTEGRATION_ANALYSIS.md
- **Chat Components Guide:** CHAT-COMPONENTS-GUIDE.md (from CLAUDE.md)
- **Master Agent Prompt:** server/agent.ts lines 1-600
- **Available Tools:** server/tools/ directory
- **Type Definitions:** server/types.ts

---

## Next Steps

1. Read full analysis: `MASTER_AGENT_INTEGRATION_ANALYSIS.md`
2. Create `services/chatApi.ts` (Step 1)
3. Implement `/api/chat` endpoint (Step 2)
4. Implement `processMessage()` function (Step 3)
5. Update `ChatLandingView.tsx` to use new API (Step 4)
6. Test end-to-end message flow
7. Deploy to Cloud Run

**Estimated Time:** 4-6 hours for full integration
**Difficulty:** Medium (API glue code, no complex logic needed)
**Risk Level:** Low (tools are already tested)

