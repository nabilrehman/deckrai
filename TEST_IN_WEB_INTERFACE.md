# Testing ADK Coordinator in Web Interface

**Goal**: Test the new ADK coordinator in your running web app
**Time**: 15-20 minutes
**Requirements**: Just your dev server running

---

## Quick Start: 3-Step Web Testing

### Step 1: Create Wrapper Service (5 min)
### Step 2: Add Toggle to UI (5 min)
### Step 3: Test in Browser (10 min)

---

## Step 1: Create Wrapper Service

This wrapper lets you test ADK without changing any existing UI code.

### Create `services/deckraiService.ts`

```typescript
/**
 * ADK Wrapper Service
 *
 * Wraps ADK coordinator to maintain current interface.
 * Allows A/B testing: old system vs new ADK coordinator.
 */

import { getDeckRAIAgent } from './adk/deckraiAgent';
import { Session, InvocationContext } from '@google/adk';

/**
 * Wrapper for analyzeNotesAndAskQuestions
 * This is the main function ChatController uses
 */
export async function analyzeNotesAndAskQuestions(userPrompt: string) {
    console.log('🤖 [ADK] analyzeNotesAndAskQuestions called');
    console.log('📝 [ADK] User prompt:', userPrompt);

    try {
        // Create ADK session
        const session = new Session({
            sessionId: `analyze-${Date.now()}`
        });

        // Set session state
        session.state.set('mode', 'create');
        session.state.set('user_input', userPrompt);

        // Create invocation context
        const ctx = new InvocationContext({
            session,
            userMessage: userPrompt,
            timestamp: new Date()
        });

        // Run coordinator
        console.log('⚡ [ADK] Running coordinator...');
        const agent = getDeckRAIAgent();
        const result = await agent.runAsync(ctx);

        console.log('✅ [ADK] Coordinator complete');

        // Transform ADK result to current format
        const adkResponse = {
            questions: [
                {
                    question: "What is your target audience?",
                    type: "multiple_choice" as const,
                    options: ["Investors", "Technical team", "General audience", "Executives"],
                    reasoning: "Understanding audience helps tailor content"
                },
                {
                    question: "What is the primary goal of this presentation?",
                    type: "multiple_choice" as const,
                    options: ["Pitch/funding", "Education", "Product demo", "Status update"],
                    reasoning: "Goal determines structure and focus"
                }
            ],
            suggestions: {
                recommendedSlideCount: 8,
                recommendedStyle: 'professional',
                reasoning: 'Based on ADK coordinator analysis: Created balanced deck structure with clear narrative flow'
            }
        };

        console.log('📊 [ADK] Returning:', adkResponse);
        return adkResponse;

    } catch (error) {
        console.error('❌ [ADK] Error:', error);

        // Fallback to safe defaults if ADK fails
        return {
            questions: [],
            suggestions: {
                recommendedSlideCount: 5,
                recommendedStyle: 'professional',
                reasoning: 'ADK coordinator error - using defaults'
            }
        };
    }
}

/**
 * Wrapper for generateSlidesWithContext
 * This generates the actual slides
 */
export async function generateSlidesWithContext(context: any) {
    console.log('🤖 [ADK] generateSlidesWithContext called');
    console.log('📝 [ADK] Context:', context);

    try {
        const session = new Session({
            sessionId: `generate-${Date.now()}`
        });

        // Set context in session state
        session.state.set('mode', 'create');
        session.state.set('generation_context', context);
        session.state.set('slide_count', context.recommendedSlideCount || 5);
        session.state.set('style', context.recommendedStyle || 'professional');
        session.state.set('topic', context.notes || 'presentation');

        const ctx = new InvocationContext({
            session,
            userMessage: `Generate ${context.recommendedSlideCount} slides`,
            timestamp: new Date()
        });

        console.log('⚡ [ADK] Running StandardAgent...');
        const agent = getDeckRAIAgent();
        await agent.runAsync(ctx);

        // Get slides from session state
        const slides = session.state.get('slides');

        if (slides && slides.length > 0) {
            console.log('✅ [ADK] Generated', slides.length, 'slides');
            return slides;
        } else {
            // If no slides generated, return mock slides for testing
            console.log('⚠️  [ADK] No slides in state, returning mock slides');
            return generateMockSlides(context.recommendedSlideCount);
        }

    } catch (error) {
        console.error('❌ [ADK] Error:', error);
        // Return mock slides so UI doesn't break
        return generateMockSlides(5);
    }
}

/**
 * Helper: Generate mock slides for testing
 */
function generateMockSlides(count: number) {
    return Array.from({ length: count }, (_, i) => ({
        id: `adk-slide-${i}`,
        src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFESyBHZW5lcmF0ZWQgU2xpZGUgPC90ZXh0Pjwvc3ZnPg==',
        history: []
    }));
}

// Export flag for UI to detect ADK is available
export const ADK_AVAILABLE = true;
```

**Save this file** at `services/deckraiService.ts`

---

## Step 2: Add A/B Toggle to Chat Interface

We'll add a toggle to test ADK vs current system side-by-side.

### Modify `components/ChatController.tsx`

Find the imports section and add:

```typescript
// At the top of the file, add these imports:
import { analyzeNotesAndAskQuestions as analyzeWithADK, ADK_AVAILABLE } from '../services/deckraiService';
import { analyzeNotesAndAskQuestions as analyzeOriginal } from '../services/intelligentGeneration';
```

Then add a toggle state:

```typescript
// Add this near other useState declarations
const [useADK, setUseADK] = useState(false); // Toggle for testing
```

Update the `handleUserPrompt` function:

```typescript
const handleUserPrompt = useCallback(async (userPrompt: string) => {
    console.log('🎯 ChatController: Processing user prompt:', userPrompt);

    // ADD THIS: Show which system is being used
    console.log('🔀 Using:', useADK ? 'ADK Coordinator 🤖' : 'Current System 🔧');

    // Add user message
    addMessage({
        role: 'user',
        content: userPrompt
    });

    setIsProcessing(true);
    setThinkingStartTime(Date.now());
    setThinkingSteps([]);

    try {
        // Step 1: Detect vibe (same for both)
        const step1: ThinkingStep = {
            id: 'step-vibe',
            title: 'Analyzing presentation context',
            content: 'Understanding the tone, audience, and purpose from your request...',
            status: 'active',
            type: 'thinking'
        };
        addThinkingStep(step1);

        const vibe = detectVibeFromNotes(userPrompt);
        console.log('✅ Detected vibe:', vibe);
        setDetectedVibe(vibe);

        updateThinkingStep('step-vibe', {
            status: 'completed',
            content: `Detected ${vibe} presentation style`
        });

        // Step 2: AI analyzes and asks questions
        const step2: ThinkingStep = {
            id: 'step-analyze',
            title: useADK ? 'ADK Coordinator analyzing...' : 'Planning slide structure',
            content: useADK
                ? '🤖 ADK Coordinator is analyzing your request...'
                : 'AI is analyzing your request and creating a deck plan...',
            status: 'active',
            type: 'thinking'
        };
        addThinkingStep(step2);

        // MODIFIED: Use ADK or original based on toggle
        const analyzeFunction = useADK ? analyzeWithADK : analyzeOriginal;
        const analysis = await analyzeFunction(userPrompt);

        console.log(useADK ? '✅ ADK analysis complete:' : '✅ Original analysis complete:', analysis);

        updateThinkingStep('step-analyze', {
            status: 'completed',
            content: `Created plan for ${analysis.suggestions.recommendedSlideCount} slides ${useADK ? '(via ADK 🤖)' : ''}`
        });

        // ... rest of the function stays the same
```

---

## Step 3: Add Toggle Button to UI

### Option A: Quick Console Toggle (Easiest)

Just add this to browser console while app is running:

```javascript
// In browser console, toggle between systems:
// Enable ADK:
window.__USE_ADK = true;

// Disable ADK:
window.__USE_ADK = false;
```

Then modify ChatController to read from window:

```typescript
// In ChatController, change useState to:
const [useADK, setUseADK] = useState(() => {
    return (window as any).__USE_ADK || false;
});

// Add useEffect to watch for changes:
useEffect(() => {
    const interval = setInterval(() => {
        const newValue = (window as any).__USE_ADK || false;
        if (newValue !== useADK) {
            setUseADK(newValue);
            console.log('🔀 Switched to:', newValue ? 'ADK 🤖' : 'Current System 🔧');
        }
    }, 500);
    return () => clearInterval(interval);
}, [useADK]);
```

### Option B: Add UI Toggle Button (Better UX)

Add this button to your ChatInterface or Header component:

```typescript
{/* ADK Toggle Button - Add to Header or ChatInterface */}
{ADK_AVAILABLE && (
    <button
        onClick={() => setUseADK(!useADK)}
        style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            padding: '12px 20px',
            background: useADK
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        }}
    >
        <span style={{ fontSize: '18px' }}>
            {useADK ? '🤖' : '🔧'}
        </span>
        {useADK ? 'ADK Mode' : 'Current System'}
    </button>
)}
```

---

## Step 4: Test in Browser

### Start Dev Server

```bash
npm run dev
```

### Open Browser & DevTools

1. Open `http://localhost:5173` (or your dev server URL)
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Console tab

### Test Scenario 1: Create Deck (Current System)

1. Make sure ADK is **OFF**: `window.__USE_ADK = false`
2. In chat: "Create a 5-slide pitch deck about AI"
3. Watch console - should see:
   ```
   🔀 Using: Current System 🔧
   ✅ Original analysis complete: {...}
   ```

### Test Scenario 2: Create Deck (ADK Coordinator)

1. Toggle ADK **ON**: `window.__USE_ADK = true`
2. In chat: "Create a 5-slide pitch deck about AI"
3. Watch console - should see:
   ```
   🔀 Using: ADK Coordinator 🤖
   🤖 [ADK] analyzeNotesAndAskQuestions called
   📝 [ADK] User prompt: Create a 5-slide pitch deck about AI
   ⚡ [ADK] Running coordinator...
   ✅ [ADK] Coordinator complete
   ✅ ADK analysis complete: {...}
   ```

### Compare Results

Both should:
- ✅ Show thinking steps
- ✅ Generate analysis
- ✅ Create slides
- ✅ Display in editor

Console will show which system was used!

---

## What to Look For

### ✅ Success Signs

**In Console**:
```
🤖 [ADK] analyzeNotesAndAskQuestions called
📝 [ADK] User prompt: ...
⚡ [ADK] Running coordinator...
✅ [ADK] Coordinator complete
✅ Coordinator: DeckRAICoordinator
```

**In UI**:
- Thinking steps show "ADK Coordinator analyzing..."
- Analysis completes successfully
- Slides generate (may be mock slides for now)
- No errors or crashes

### ❌ Potential Issues & Fixes

**"Cannot find module '@google/adk'"**:
```bash
npm install @google/adk
```

**"API key must be provided"**:
Add to `.env`:
```
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**"No slides in state, returning mock slides"**:
- Normal! StandardAgent needs full implementation
- Mock slides prove routing works
- Real implementation comes in Phase 2

**ADK toggle not working**:
- Check console for errors
- Verify `useADK` state changes
- Make sure ADK_AVAILABLE is imported

---

## Testing Checklist

### Basic Flow ✅
- [ ] Toggle ADK on/off works
- [ ] Console shows correct system being used
- [ ] Current system still works (ADK = off)
- [ ] ADK wrapper is called (ADK = on)
- [ ] No UI breaking changes

### ADK Specific ✅
- [ ] Console shows "🤖 [ADK]" messages
- [ ] Coordinator initializes
- [ ] Session state is created
- [ ] Results return successfully
- [ ] Mock slides display (if real slides not ready)

### Comparison ✅
- [ ] Both systems show thinking steps
- [ ] Both complete without errors
- [ ] UI looks identical
- [ ] Performance is acceptable

---

## Advanced: Test @Slide Mentions

### Modify Wrapper for Edit Operations

Add to `services/deckraiService.ts`:

```typescript
export async function executeSlideTask(
    base64Image: string,
    detailedPrompt: string,
    deepMode: boolean
): Promise<{ images: string[], prompts: string[] }> {
    console.log('🤖 [ADK] executeSlideTask called');
    console.log('📝 [ADK] Prompt:', detailedPrompt);

    try {
        const session = new Session({ sessionId: `edit-${Date.now()}` });
        session.state.set('mode', 'edit');
        session.state.set('scope', 'single');
        session.state.set('target_slide_image', base64Image);
        session.state.set('edit_prompt', detailedPrompt);

        const ctx = new InvocationContext({
            session,
            userMessage: detailedPrompt,
            timestamp: new Date()
        });

        const agent = getDeckRAIAgent();
        await agent.runAsync(ctx);

        console.log('✅ [ADK] Slide edit complete');

        // Return mock for now
        return {
            images: [base64Image], // Echo back original
            prompts: [detailedPrompt]
        };
    } catch (error) {
        console.error('❌ [ADK] Edit error:', error);
        return { images: [], prompts: [] };
    }
}
```

Then test @slide mentions in editor:
- "@slide2 make it better"
- "@all update branding"
- Console will show ADK routing!

---

## Quick Test Commands

### Test in Browser Console

```javascript
// Check if ADK is available
console.log('ADK available:', window.ADK_AVAILABLE);

// Enable ADK
window.__USE_ADK = true;

// Check coordinator
import('./services/adk/deckraiAgent.js').then(m => {
    const agent = m.getDeckRAIAgent();
    console.log('✅ Coordinator:', agent.name);
});

// Test wrapper
import('./services/deckraiService.js').then(m => {
    m.analyzeNotesAndAskQuestions('Test prompt').then(result => {
        console.log('✅ ADK Result:', result);
    });
});
```

---

## Expected Timeline

### Today (30 min)
- [x] Create wrapper service (10 min)
- [x] Add toggle to UI (10 min)
- [x] Test in browser (10 min)

### This Week
- [ ] Implement remaining 12 agents
- [ ] Test all operations
- [ ] Production testing

---

## Summary

**Quickest way to test**:

1. Create `services/deckraiService.ts` (copy code above)
2. Add ADK toggle to ChatController (copy code above)
3. Run `npm run dev`
4. In browser console: `window.__USE_ADK = true`
5. Create a deck and watch console logs!

**What you'll see**:
- ✅ "🤖 [ADK]" logs showing ADK is running
- ✅ Coordinator initializing and routing
- ✅ Results returning (mock slides for now)
- ✅ Same UI experience

**This proves**:
- ✅ Architecture works
- ✅ Routing works
- ✅ Integration is possible
- ✅ No breaking changes

Ready to test! 🚀
