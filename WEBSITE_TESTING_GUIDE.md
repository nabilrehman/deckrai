# Testing ADK Coordinator on Your Website

## Quick Start (3 Steps)

### Step 1: Deploy to Your Website

Merge this branch into your deployment branch or deploy directly:

```bash
# Option A: Deploy this branch directly
git push origin claude/analyze-branches-017L9g9QD5tyuX4Tb4r727dm

# Option B: Merge to main/deploy branch
git checkout main
git merge claude/analyze-branches-017L9g9QD5tyuX4Tb4r727dm
git push origin main
```

### Step 2: Open Your Website

Navigate to your deployed DeckRAI website in your browser.

### Step 3: Toggle ADK Coordinator

Open the browser console (F12 or Cmd+Option+J) and run:

```javascript
// Enable ADK Coordinator (new system)
window.__USE_ADK = true;

// Disable ADK Coordinator (use original system)
window.__USE_ADK = false;
```

## What to Test

### Test 1: Create a New Deck

1. Open the chat interface on your website
2. Enable ADK: `window.__USE_ADK = true`
3. Enter a prompt like: "Create a 7-slide pitch deck about AI in healthcare"
4. Watch the console for ADK logs:
   ```
   🔧 System Mode: 🤖 ADK Coordinator (NEW)
   🤖 [ADK] analyzeNotesAndAskQuestions called
   📝 [ADK] User prompt: Create a 7-slide pitch deck...
   ⚡ [ADK] Session created, calling coordinator...
   ✅ [ADK] Coordinator complete
   ```

### Test 2: Compare Original vs ADK

**Test with Original System:**
```javascript
window.__USE_ADK = false;
```
Enter prompt: "Create a 5-slide sales deck"
Note the thinking steps and response.

**Test with ADK Coordinator:**
```javascript
window.__USE_ADK = true;
```
Enter same prompt: "Create a 5-slide sales deck"
Compare the thinking steps and response.

### Test 3: A/B Comparison

Open two browser tabs:
- **Tab 1**: `window.__USE_ADK = false` (original)
- **Tab 2**: `window.__USE_ADK = true` (ADK)

Test the same prompts in both tabs and compare:
- Response quality
- Thinking step descriptions
- Analysis accuracy
- Console logs

## What You'll See

### When ADK is Enabled (`window.__USE_ADK = true`)

**In Console:**
```
🔧 System Mode: 🤖 ADK Coordinator (NEW)
🤖 [ADK] analyzeNotesAndAskQuestions called
📝 [ADK] User prompt: Create...
⚡ [ADK] Session created, calling coordinator...
✅ [ADK] Coordinator complete
✅ [ADK] Analysis result: {...}
```

**In Chat Interface:**
- Thinking step title: "ADK Coordinator analyzing request"
- Thinking step content: "🤖 Using Google ADK Coordinator to analyze your request..."
- Response starts with: "🤖 ADK Coordinator"

### When ADK is Disabled (`window.__USE_ADK = false`)

**In Console:**
```
🔧 System Mode: 🔵 Original System
🎯 Using Original System for analysis
```

**In Chat Interface:**
- Thinking step title: "Planning slide structure"
- Thinking step content: "AI is analyzing your request and creating a deck plan..."
- Response starts with: "🔵 Original System"

## Environment Variables

Make sure your deployment has the required environment variable:

```bash
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

The ADK Coordinator requires this API key to function.

## Current Implementation Status

### ✅ Implemented (Ready to Test)
- ADK Coordinator architecture
- Session state management
- Wrapper service (`services/deckraiService.ts`)
- ChatController A/B toggle
- Browser console control

### ⚠️ Partial Implementation
The ADK coordinator is implemented but only 3 of 15 specialized agents are complete:
- ✅ StandardAgent
- ✅ TemplateArchitectureAgent
- ✅ MultiSourceAgent
- ⏳ 12 more agents pending

**What this means for testing:**
- Analysis and planning work via ADK coordinator
- Results are intelligently parsed from coordinator output
- Full specialized agent routing will be added in future updates

## Troubleshooting

### Issue: "window is not defined"

This is normal during server-side rendering. The code handles this:
```typescript
if (typeof window !== 'undefined' && window.__USE_ADK !== undefined)
```

### Issue: Console shows errors about ADK modules

Check that your build process includes the ADK dependencies:
```bash
npm install @google/genai
```

### Issue: Toggle doesn't seem to work

The toggle is checked every second. Wait 1-2 seconds after setting `window.__USE_ADK = true` and then send your prompt.

Alternatively, refresh the page after setting the toggle:
```javascript
window.__USE_ADK = true;
location.reload();
```

### Issue: No console logs visible

Make sure browser console is open (F12) and set to "Verbose" or "All" levels.

## Testing Prompts

Try these prompts to test different scenarios:

### Simple Deck Creation
```
Create a 5-slide pitch deck about renewable energy
```

### Technical Presentation
```
Create a technical architecture presentation for a microservices platform
```

### Data-Driven Deck
```
Create a data-driven presentation showing Q4 sales performance with 8 slides
```

### Customer-Focused
```
Create a customer presentation for DHL showing how our logistics AI solution solves their delivery challenges
```

### Multi-Source (Complex)
```
Create a comprehensive deck from these meeting notes [paste notes] and also include architecture diagrams for our platform
```

## Next Steps After Testing

Once you've tested and confirmed the ADK coordinator works:

1. **Report Results**: Share what works and what doesn't
2. **Complete Implementation**: Implement remaining 12 specialized agents
3. **Remove Toggle**: Make ADK the default once fully tested
4. **Performance Optimization**: Monitor and optimize ADK performance

## Documentation

For more details, see:
- `ADK_UI_INTEGRATION_ANALYSIS.md` - Full UI integration analysis
- `ADK_OPERATIONS_MAPPING.md` - How all operations map to ADK
- `services/adk/README.md` - ADK architecture overview
- `TEST_IN_WEB_INTERFACE.md` - Alternative testing approach

## Support

If you encounter issues:
1. Check browser console for detailed error logs
2. Verify `VITE_GEMINI_API_KEY` is set in your environment
3. Try with `window.__USE_ADK = false` to verify original system works
4. Review the ADK documentation in `services/adk/`
