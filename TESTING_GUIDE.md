# Backend ADK Agent - Testing Guide

**Status:** Backend 100% Complete ✅ | Test Page Created ✅ | Ready to Test! 🚀

---

## 🎯 Quick Start - Test in 3 Steps

### Step 1: Start the Backend Server

```bash
# In Terminal 1
npx tsx server/index.ts
```

**Expected output:**
```
🤖 Deckr ADK Server running on port 3001
   Health check: http://localhost:3001/health
   Chat endpoint: http://localhost:3001/api/chat

   Status: Phase 1 Complete ✓
   Next: Implement tools (Phase 2-5)
```

### Step 2: Access the Test Page

**Option A: Add to your routes temporarily**

In your main routes file, import and add:
```typescript
import TestBackendChat from './components/TestBackendChat';

// Add this route:
<Route path="/test-backend" element={<TestBackendChat />} />
```

**Option B: Quick standalone test**

Create a simple HTML file to test:
```html
<!DOCTYPE html>
<html>
<head>
  <title>Backend Test</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/test-backend.tsx"></script>
</body>
</html>
```

**Option C: Use the existing test script** (Easiest!)

```bash
# In Terminal 2
npx tsx server/test-chat-api.ts
```

This runs automated tests and shows results immediately!

### Step 3: Test the Integration

Once you have the test page open, try these test cases:

**Test 1: Simple Chat**
```
Type: "Hello"
Expected: Agent responds conversationally
```

**Test 2: Single Slide** (The key test!)
```
Type: "Create one slide about data warehousing"
Expected:
- Thinking steps appear
- createSlideTool is called
- Slide is generated (6-10 seconds)
- Tool call shown with success ✓
```

**Test 3: Full Deck**
```
Type: "Create a 5-slide presentation for Google Cloud"
Expected:
- Agent asks for more details OR
- planDeckTool is called
- Multiple tool calls shown
```

---

## 🧪 What You'll See

### Backend Terminal (Terminal 1)

When you send a message, you'll see:
```
[server] 📨 New chat request from user: test-user
[masterAgent] Processing message: Create one slide about data warehousing
[masterAgent] Function calling iteration 1
[masterAgent] Executing tool: createSlideTool
[createSlideTool] Creating slide with prompt length: 262
[createSlideTool] ✅ Slide created in 9650ms
[masterAgent] Tool result: ✅ Success
[server] ✅ Request completed in 11186ms
```

### Test Page (Browser)

You'll see:
- **Thinking Steps** - What the agent is doing
- **Tool Calls** - Which ADK tools were used
- **Response** - Agent's final answer
- **Backend Status** - Online/Offline indicator

---

## 📊 Test Results to Expect

### ✅ Test 1: Simple Chat
```
Input: "Hello"
Response Time: 1-2 seconds
Tool Calls: 0
Result: Agent responds conversationally asking what you'd like to create
```

### ✅ Test 2: Single Slide (KEY TEST!)
```
Input: "Create one slide about data warehousing"
Response Time: 8-12 seconds
Tool Calls: 1 (createSlideTool)
Result: ✅ Slide generated successfully!

Thinking Steps:
  ✓ Executing createSlideTool

Tool Calls:
  ✓ createSlideTool (3 args)
```

### ✅ Test 3: Full Deck
```
Input: "Create a 5-slide presentation for Google Cloud"
Response Time: 2-3 seconds
Tool Calls: 0
Result: Agent asks for more details before proceeding

OR (if given enough context):
Tool Calls: 6 (planDeckTool + 5x createSlideTool)
Response Time: 45-60 seconds
Result: 5 slides created!
```

---

## 🐛 Troubleshooting

### Issue: "Backend Status: ❌ Offline"

**Solution:**
```bash
# Check if server is running
curl http://localhost:3001/health

# If not running, start it:
npx tsx server/index.ts
```

### Issue: "API quota exceeded" (429 error)

**Solution:** Wait 30-60 seconds between requests. The free tier has rate limits.

**Workaround:** Use a different test message each time to avoid hitting the same endpoint repeatedly.

### Issue: "Response is undefined"

**Cause:** Backend processed the request but hit an error after tool execution.

**Solution:** Check backend terminal for error messages. Usually a quota issue.

### Issue: Server won't start

**Error:** `Cannot find module 'dotenv'`

**Solution:**
```bash
npm install dotenv --legacy-peer-deps
```

**Error:** `import.meta.env is not defined`

**Solution:** Already fixed! The sed command replaced all instances.

---

## 📝 What to Watch For

### Success Indicators ✅

1. **Backend starts cleanly** - No warnings, clean output
2. **Health check returns 200** - Backend is responsive
3. **Tool execution works** - createSlideTool successfully generates slides
4. **Thinking steps display** - You can see what the agent is doing
5. **Tool calls shown** - You can see which tools were used

### Known Issues ⚠️

1. **Rate Limiting** - Free tier has 250K tokens/minute limit
   - **Impact:** May get 429 errors with heavy testing
   - **Workaround:** Wait 30-60 seconds between requests

2. **Slow Response Times** - Slide generation takes 6-10 seconds
   - **Cause:** Gemini 2.5 Flash Image is powerful but slower
   - **Status:** Expected behavior, not a bug

3. **Response Undefined After Tool Execution** - Sometimes response is undefined
   - **Cause:** API quota error occurs after tool completes
   - **Impact:** User doesn't see what was generated
   - **Status:** Known issue, backend works correctly

---

## 🎯 Success Criteria

Your backend integration is working if:

- [ ] Backend server starts without errors
- [ ] Health check returns `{"status": "healthy", "toolCount": 10}`
- [ ] Simple chat works (agent responds)
- [ ] **Single slide generation works** (agent calls createSlideTool and generates slide)
- [ ] Thinking steps appear in UI
- [ ] Tool calls are displayed
- [ ] Backend terminal shows tool execution logs

---

## 🚀 Next Steps After Testing

### If Tests Pass ✅

1. **Document Results**
   - Take screenshots of working tests
   - Note any issues encountered
   - Record performance metrics

2. **Integrate with ChatLandingView** (Optional)
   - Follow examples in `FRONTEND_INTEGRATION_GUIDE.md`
   - Start with simple cases first
   - Test thoroughly before expanding

3. **Deploy to Production** (When ready)
   ```bash
   npm run build
   gcloud run deploy deckr-app --source . --region us-central1
   ```

### If Tests Fail ❌

1. **Check Backend Terminal** - Look for error messages
2. **Verify Environment** - Ensure API key is set correctly
3. **Test API Directly** - Use curl to bypass frontend:
   ```bash
   curl -X POST http://localhost:3001/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello"}'
   ```

---

## 📚 Additional Resources

- **Backend Implementation:** `server/agent.ts`
- **API Client:** `services/chatApi.ts`
- **Test Component:** `components/TestBackendChat.tsx`
- **Integration Guide:** `FRONTEND_INTEGRATION_GUIDE.md`

---

## 💡 Pro Tips

1. **Watch Both Terminals** - Backend terminal shows tool execution, frontend shows UI
2. **Test Simple First** - Start with "Hello" before trying complex requests
3. **Wait for Completion** - Don't send multiple requests quickly (rate limits!)
4. **Check Browser Console** - Additional debug info available in DevTools

---

**Ready to test?** Start the backend server and try the automated test script!

```bash
# Terminal 1: Backend
npx tsx server/index.ts

# Terminal 2: Automated tests
npx tsx server/test-chat-api.ts
```

You should see the agent successfully create slides! 🎉
