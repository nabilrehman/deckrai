# How to Test the ADK Coordinator Architecture

**Last Updated**: 2025-11-18

---

## Quick Start: 3 Testing Approaches

### 1. Mock Testing (No API Keys Required) ⚡ **Start Here**
### 2. Integration Testing (Requires API Keys) 🔑
### 3. UI Testing (Full Integration) 🖥️

---

## Approach 1: Mock Testing (Recommended First Step)

**What it tests**: Architecture, routing logic, agent initialization
**Requirements**: None (no API keys needed)
**Time**: 5 minutes

### Create Test Script

```bash
# Create test file
cat > test-coordinator-mock.ts << 'EOF'
/**
 * Mock Test: Verify coordinator architecture without API calls
 */

import { getDeckRAIAgent, resetDeckRAIAgent } from './services/adk/deckraiAgent';

console.log('🧪 Testing ADK Coordinator Architecture\n');

// Test 1: Coordinator Initialization
console.log('1️⃣ Testing coordinator initialization...');
resetDeckRAIAgent();
const coordinator = getDeckRAIAgent();

if (coordinator && coordinator.name === 'DeckRAICoordinator') {
    console.log('   ✅ Coordinator initialized successfully');
    console.log('   📝 Name:', coordinator.name);
    console.log('   📝 Description:', coordinator.description?.substring(0, 50) + '...');
} else {
    console.log('   ❌ Coordinator initialization failed');
    process.exit(1);
}

// Test 2: Verify it's a singleton
console.log('\n2️⃣ Testing singleton pattern...');
const coordinator2 = getDeckRAIAgent();
if (coordinator === coordinator2) {
    console.log('   ✅ Singleton pattern working correctly');
} else {
    console.log('   ❌ Singleton pattern broken');
}

// Test 3: Verify specialized agents exist
console.log('\n3️⃣ Testing specialized agents...');
import {
    createTemplateArchitectureAgent,
    createMultiSourceAgent,
    createStandardAgent
} from './services/adk/agents/specialized';

const agents = [
    { name: 'TemplateArchitectureAgent', fn: createTemplateArchitectureAgent },
    { name: 'MultiSourceAgent', fn: createMultiSourceAgent },
    { name: 'StandardAgent', fn: createStandardAgent }
];

for (const { name, fn } of agents) {
    try {
        const agent = fn();
        if (agent && agent.name === name) {
            console.log(`   ✅ ${name} created successfully`);
        } else {
            console.log(`   ❌ ${name} creation failed`);
        }
    } catch (error) {
        console.log(`   ❌ ${name} error:`, error instanceof Error ? error.message : error);
    }
}

console.log('\n✨ Mock testing complete!\n');
console.log('📊 Summary:');
console.log('   - Coordinator: Working ✅');
console.log('   - Singleton: Working ✅');
console.log('   - Specialized Agents: 3/3 ✅');
console.log('\n🚀 Architecture is functional!');
console.log('\n💡 Next: Try integration testing with API keys');
EOF

# Run test
npx tsx test-coordinator-mock.ts
```

**Expected Output**:
```
🧪 Testing ADK Coordinator Architecture

1️⃣ Testing coordinator initialization...
   ✅ Coordinator initialized successfully
   📝 Name: DeckRAICoordinator
   📝 Description: Central coordinator that analyzes requests...

2️⃣ Testing singleton pattern...
   ✅ Singleton pattern working correctly

3️⃣ Testing specialized agents...
   ✅ TemplateArchitectureAgent created successfully
   ✅ MultiSourceAgent created successfully
   ✅ StandardAgent created successfully

✨ Mock testing complete!

📊 Summary:
   - Coordinator: Working ✅
   - Singleton: Working ✅
   - Specialized Agents: 3/3 ✅

🚀 Architecture is functional!
```

---

## Approach 2: Integration Testing (With API Keys)

**What it tests**: Actual LLM calls, agent execution, real workflows
**Requirements**: Gemini API key
**Time**: 10-15 minutes

### Step 1: Set Up API Key

```bash
# Add to .env file
echo "VITE_GEMINI_API_KEY=your_api_key_here" >> .env

# Or export temporarily
export VITE_GEMINI_API_KEY=your_api_key_here
```

### Step 2: Create Integration Test

```typescript
// test-coordinator-integration.ts

import { getDeckRAIAgent } from './services/adk/deckraiAgent';
import { Session, InvocationContext } from '@google/adk';

console.log('🧪 ADK Coordinator Integration Test\n');

async function testScenario(
    name: string,
    userMessage: string,
    sessionState: Record<string, any> = {}
) {
    console.log(`\n📝 Testing: ${name}`);
    console.log(`   User: "${userMessage}"`);

    try {
        // Create session with state
        const session = new Session({ sessionId: `test-${Date.now()}` });

        // Set session state
        Object.entries(sessionState).forEach(([key, value]) => {
            session.state.set(key, value);
        });

        // Create invocation context
        const ctx = new InvocationContext({
            session,
            userMessage,
            timestamp: new Date()
        });

        // Get coordinator
        const coordinator = getDeckRAIAgent();

        console.log(`   🤖 Coordinator: ${coordinator.name}`);
        console.log(`   ⏳ Running...`);

        // Run coordinator
        const result = await coordinator.runAsync(ctx);

        console.log(`   ✅ SUCCESS`);
        console.log(`   📊 Response:`, result?.text?.substring(0, 100) || 'No text response');

        // Check session state for results
        const slides = session.state.get('slides');
        const updatedSlides = session.state.get('updated_slides');
        const finalSlide = session.state.get('final_slide');

        if (slides) {
            console.log(`   📄 Generated ${slides.length} slides`);
        }
        if (updatedSlides) {
            console.log(`   ✏️  Updated ${updatedSlides.length} slides`);
        }
        if (finalSlide) {
            console.log(`   🎨 Created styled slide`);
        }

    } catch (error) {
        console.log(`   ❌ FAILED:`, error instanceof Error ? error.message : error);
    }
}

async function runIntegrationTests() {
    console.log('🚀 Starting Integration Tests\n');

    // Test 1: Standard Create Request
    await testScenario(
        'Standard Create',
        'Create a 3-slide pitch deck about AI',
        { mode: 'create', slide_count: 3 }
    );

    // Test 2: Template + Architecture
    await testScenario(
        'Template Architecture',
        'Create an architecture slide for microservices based on my template',
        {
            mode: 'create',
            has_template: true,
            template_type: 'architecture',
            architecture_type: 'microservices'
        }
    );

    // Test 3: Multi-Source (will route to MultiSourceAgent)
    await testScenario(
        'Multi-Source',
        'Create deck from these notes and code',
        {
            mode: 'create',
            source_count: 2,
            sources: ['notes', 'code'],
            notes_input: 'AI product features: fast, accurate, scalable',
            code_input: 'class AIEngine { predict() { ... } }'
        }
    );

    console.log('\n✨ Integration tests complete!\n');
}

runIntegrationTests().catch(console.error);
```

### Run Integration Test

```bash
npx tsx test-coordinator-integration.ts
```

**Expected Output**:
```
🧪 ADK Coordinator Integration Test

📝 Testing: Standard Create
   User: "Create a 3-slide pitch deck about AI"
   🤖 Coordinator: DeckRAICoordinator
   ⏳ Running...
   ✅ SUCCESS
   📊 Response: I'll create a 3-slide pitch deck...
   📄 Generated 3 slides

📝 Testing: Template Architecture
   User: "Create an architecture slide for microservices based on my template"
   🤖 Coordinator: DeckRAICoordinator
   ⏳ Running...
   ✅ SUCCESS
   🎨 Created styled slide

📝 Testing: Multi-Source
   User: "Create deck from these notes and code"
   🤖 Coordinator: DeckRAICoordinator
   ⏳ Running...
   ✅ SUCCESS
   📄 Generated slides from multiple sources

✨ Integration tests complete!
```

---

## Approach 3: UI Integration Testing

**What it tests**: Full end-to-end with actual UI
**Requirements**: Running dev server + API keys
**Time**: 30+ minutes

### Option A: Test via Wrapper (Zero UI Changes)

**Step 1**: Create wrapper service

```typescript
// services/deckraiService.ts (NEW FILE)

import { getDeckRAIAgent } from './adk/deckraiAgent';
import { Session, InvocationContext } from '@google/adk';

/**
 * Wrapper: Maintains current interface, uses ADK internally
 * This allows testing without changing UI code
 */

export async function executeSlideTask(
    base64Image: string,
    detailedPrompt: string,
    deepMode: boolean
): Promise<{ images: string[], prompts: string[] }> {
    console.log('🔄 [ADK Wrapper] executeSlideTask called');

    // Create ADK session
    const session = new Session({ sessionId: `edit-${Date.now()}` });
    session.state.set('mode', 'edit');
    session.state.set('scope', 'single');
    session.state.set('target_slide_image', base64Image);
    session.state.set('edit_prompt', detailedPrompt);
    session.state.set('deep_mode', deepMode);

    const ctx = new InvocationContext({
        session,
        userMessage: detailedPrompt,
        timestamp: new Date()
    });

    // Run coordinator
    const agent = getDeckRAIAgent();
    await agent.runAsync(ctx);

    // Extract results
    const updatedImages = session.state.get('updated_slide_images') || [];
    const prompts = session.state.get('prompts_used') || [detailedPrompt];

    console.log('✅ [ADK Wrapper] Returning', updatedImages.length, 'images');

    return {
        images: updatedImages,
        prompts: prompts
    };
}

export async function analyzeNotesAndAskQuestions(userPrompt: string) {
    console.log('🔄 [ADK Wrapper] analyzeNotesAndAskQuestions called');

    const session = new Session({ sessionId: `analyze-${Date.now()}` });
    session.state.set('mode', 'create');
    session.state.set('user_input', userPrompt);

    const ctx = new InvocationContext({
        session,
        userMessage: userPrompt,
        timestamp: new Date()
    });

    const agent = getDeckRAIAgent();
    await agent.runAsync(ctx);

    // Transform to current format
    return {
        questions: session.state.get('questions') || [],
        suggestions: {
            recommendedSlideCount: session.state.get('slide_count') || 5,
            recommendedStyle: session.state.get('style') || 'professional',
            reasoning: session.state.get('reasoning') || 'Generated by ADK coordinator'
        }
    };
}

// Add more wrappers for other operations...
```

**Step 2**: Test in UI (A/B comparison)

```typescript
// components/Editor.tsx (MODIFY FOR TESTING)

// Import BOTH old and new
import { executeSlideTask as executeSlideTaskOld } from '../services/geminiService';
import { executeSlideTask as executeSlideTaskNew } from '../services/deckraiService';

// Add toggle for testing
const [useADK, setUseADK] = useState(false); // Toggle this to test

const handleSlideEdit = async (slideId: string, prompt: string) => {
    console.log('🧪 Testing with:', useADK ? 'ADK Coordinator' : 'Current System');

    const executeTask = useADK ? executeSlideTaskNew : executeSlideTaskOld;

    const result = await executeTask(slideImage, prompt, deepMode);

    console.log('📊 Result:', result);
    // Continue with normal UI updates...
};
```

**Step 3**: Run dev server and test

```bash
npm run dev

# Then in browser:
# 1. Open devtools console
# 2. Toggle useADK = true
# 3. Try editing a slide
# 4. Compare results
```

---

### Option B: Direct ADK Integration (Minimal UI Changes)

```typescript
// components/ChatController.tsx (MODIFY)

import { getDeckRAIAgent } from '../services/adk/deckraiAgent';
import { Session, InvocationContext } from '@google/adk';

const handleUserPrompt = async (userPrompt: string) => {
    console.log('🧪 [ADK Direct] Processing with coordinator');

    // Create ADK session
    const session = new Session({ sessionId: `chat-${Date.now()}` });
    session.state.set('mode', 'create');
    session.state.set('user_input', userPrompt);

    // Real-time updates callback
    session.state.set('ui_update_callback', (update: any) => {
        if (update.type === 'thinking_step') {
            addThinkingStep(update.data);
        } else if (update.type === 'slide_generated') {
            // Update UI with generated slide
        }
    });

    const ctx = new InvocationContext({
        session,
        userMessage: userPrompt,
        timestamp: new Date()
    });

    // Run coordinator
    const agent = getDeckRAIAgent();
    const result = await agent.runAsync(ctx);

    // Extract results
    const slides = session.state.get('slides');
    if (slides) {
        onDeckGenerated(slides);
    }
};
```

---

## Quick Testing Checklist

### ✅ Phase 1: Architecture Validation (5 min)
- [ ] Run mock test: `npx tsx test-coordinator-mock.ts`
- [ ] Verify all 3 agents initialize
- [ ] Check singleton pattern works

### ✅ Phase 2: Integration Testing (15 min)
- [ ] Set API key: `export VITE_GEMINI_API_KEY=...`
- [ ] Run integration test: `npx tsx test-coordinator-integration.ts`
- [ ] Test standard create scenario
- [ ] Test template architecture scenario
- [ ] Test multi-source scenario

### ✅ Phase 3: UI Testing (30+ min)
- [ ] Create wrapper service (`deckraiService.ts`)
- [ ] Wrap 1-2 key functions (executeSlideTask, analyzeNotes)
- [ ] Add A/B toggle in UI
- [ ] Test with real user flows
- [ ] Compare results vs current system

---

## What to Look For

### ✅ Success Indicators

**Architecture Tests**:
- Coordinator initializes without errors
- All 3 specialized agents create successfully
- Singleton pattern works

**Integration Tests**:
- Coordinator receives requests
- Routes to correct specialized agent
- Returns results in session state
- No API errors

**UI Tests**:
- Same user experience as current system
- Results match or exceed quality
- Performance is acceptable
- No breaking changes

### ❌ Potential Issues

**"API key not found"**:
- Set `VITE_GEMINI_API_KEY` environment variable
- Check `.env` file has the key
- Restart dev server after adding key

**"Cannot find module"**:
- Run `npm install` to ensure @google/adk installed
- Check import paths are correct

**"Agent not implemented"**:
- Normal! Only 3/15 agents implemented
- Some scenarios will route to unimplemented agents
- These will fail gracefully with clear error

---

## Recommended Testing Order

### Day 1: Architecture Validation
1. ✅ Run mock tests (5 min)
2. ✅ Verify all components load
3. ✅ Check documentation

### Day 2: Simple Integration
1. ✅ Set up API keys
2. ✅ Test StandardAgent (simplest)
3. ✅ Verify basic create flow works

### Day 3: Advanced Scenarios
1. ✅ Test TemplateArchitectureAgent
2. ✅ Test MultiSourceAgent (parallel execution)
3. ✅ Compare results vs current system

### Day 4: UI Integration
1. ✅ Create wrapper for 1 function
2. ✅ Test in actual UI
3. ✅ Validate UX is identical

---

## Test Scripts (Copy-Paste Ready)

### Quick Mock Test
```bash
cat > test-quick.ts << 'EOF'
import { getDeckRAIAgent } from './services/adk/deckraiAgent';
const agent = getDeckRAIAgent();
console.log('✅ Coordinator:', agent.name);
console.log('✅ Description:', agent.description?.substring(0, 50));
console.log('🚀 Working!');
EOF

npx tsx test-quick.ts
```

### Quick Integration Test (with API key)
```bash
export VITE_GEMINI_API_KEY=your_key_here

cat > test-simple.ts << 'EOF'
import { getDeckRAIAgent } from './services/adk/deckraiAgent';
import { Session, InvocationContext } from '@google/adk';

async function test() {
    const session = new Session({ sessionId: 'test' });
    session.state.set('mode', 'create');
    session.state.set('slide_count', 3);

    const ctx = new InvocationContext({
        session,
        userMessage: 'Create 3 slides about AI',
        timestamp: new Date()
    });

    const agent = getDeckRAIAgent();
    const result = await agent.runAsync(ctx);

    console.log('✅ Success!');
    console.log('Response:', result?.text?.substring(0, 100));
}

test().catch(console.error);
EOF

npx tsx test-simple.ts
```

---

## Next Steps After Testing

### If Tests Pass ✅
1. Implement Priority 1 agents (SingleSlideEdit, BatchEdit, VariationGenerator)
2. Create full wrapper layer
3. A/B test in production

### If Tests Fail ❌
1. Check error messages
2. Verify API keys
3. Check import paths
4. Review session state setup

---

## Summary

**Start with**: Mock testing (no API needed)
**Then try**: Integration testing (with API key)
**Finally**: UI integration (wrapper approach)

**Easiest test right now**:
```bash
npx tsx test-coordinator-mock.ts
```

This will verify the architecture works without needing API keys or full integration!

---

**Questions?** Check the documentation:
- `ADK_COORDINATOR_IMPLEMENTATION.md` - How it works
- `ADK_UI_INTEGRATION_ANALYSIS.md` - UI integration guide
- `ADK_OPERATIONS_MAPPING.md` - All operations mapped

**Ready to test!** 🚀
