# Planning Agent vs Master Agent - Clear Explanation

**Your Question**: "I thought our master agent prompt does that?"

Let me show you the critical difference with a real example.

---

## Example Request

**User says**: "Create an architecture slide for microservices based on my template"

---

## What Master Agent Does NOW (Classification)

### Master Agent Output:
```json
{
  "intent": "CREATE_DECK",
  "confidence": 0.95,
  "reasoning": "User wants to create slides",
  "extracted_data": {
    "topic": "microservices architecture",
    "requirements": {
      "slide_count": 1
    }
  },
  "next_agent": "CreateDeckAgent"
}
```

### What Happens Next:
```
Master Agent → Routes to "CreateDeckAgent" → Done
```

### Problems:
1. ❌ Lost "based on my template" requirement
2. ❌ Lost "architecture slide" specificity
3. ❌ Routes to generic CreateDeckAgent
4. ❌ No plan for: Load template → Generate architecture → Match to template

**Result**: Creates a generic slide, ignores template

---

## What Planning Agent Would Do (Planning)

### Planning Agent Output:
```json
{
  "request_type": "template_based_architecture_generation",
  "understanding": {
    "what": "Create 1 architecture slide",
    "type": "microservices",
    "constraint": "must match user's template style"
  },
  "execution_plan": {
    "steps": [
      {
        "step": 1,
        "name": "load_template",
        "service": "referenceSlideLoader",
        "input": "user's template file",
        "output": "template_design_blueprint"
      },
      {
        "step": 2,
        "name": "generate_architecture_content",
        "service": "architectureSlideGenerator",
        "input": {
          "type": "microservices",
          "scenario": "from user context"
        },
        "output": "architecture_content"
      },
      {
        "step": 3,
        "name": "match_to_template",
        "service": "slideMatcherTool",
        "input": {
          "content": "architecture_content",
          "template": "template_design_blueprint"
        },
        "output": "final_slide"
      }
    ],
    "dependencies": "step2 needs step1 complete, step3 needs both"
  }
}
```

### What Happens Next:
```
Planning Agent
  → Creates 3-step execution plan
  → Step 1: Load template → Get design blueprint
  → Step 2: Generate architecture content
  → Step 3: Apply template style to content
  → Final slide matches template!
```

**Result**: Creates architecture slide that matches template style

---

## The Key Difference

| Aspect | Master Agent (Classifier) | Planning Agent (Planner) |
|--------|--------------------------|-------------------------|
| **Thinks** | "What bucket does this fit in?" | "What steps are needed?" |
| **Output** | Intent label + next agent | Detailed execution plan |
| **Detail Level** | High-level category | Step-by-step instructions |
| **Flexibility** | 5 fixed categories | Unlimited request types |
| **Information Loss** | High (loses specifics) | None (preserves all details) |

### In Code Terms:

**Master Agent**:
```typescript
// Simplified pseudocode
function masterAgent(request) {
  if (request.includes("create")) return "CREATE_DECK";
  if (request.includes("edit")) return "EDIT_SLIDES";
  // ... only 5 options
}
```

**Planning Agent**:
```typescript
// Simplified pseudocode
function planningAgent(request) {
  const understanding = deepUnderstand(request);
  const requiredServices = identifyServices(understanding);
  const executionSteps = createPlan(requiredServices);
  return {
    steps: executionSteps,
    dependencies: calculateDependencies(steps),
    expectedOutput: determineOutput(steps)
  };
}
```

---

## #2: Dynamic Workflow Composer - Simple Explanation

**Problem**: Right now, workflows are hardcoded in `.ts` files

### Current Hardcoded Workflow:
```typescript
// File: simpleReflectionDemo.ts
const workflow = new SequentialAgent({
  subAgents: [
    slideGenerator,    // Step 1 - ALWAYS this
    qualityReviewer,   // Step 2 - ALWAYS this
    refinementAgent    // Step 3 - ALWAYS this
  ]
});
```

**This workflow is FIXED - it's always these 3 steps, in this order.**

### What if user asks for something different?

**Example 1**: "Create from template"
- Needs: LoadTemplate → Generate → Match
- Current workflow: Can't do this! It's hardcoded to Generate → Review → Refine

**Example 2**: "Create from code + notes"
- Needs: ParseCode → ParseNotes → Merge → Generate
- Current workflow: Can't do this! Only knows 1 input source

**Example 3**: "Customize for dhl.com"
- Needs: ScrapeWebsite → LoadDeck → AddContent
- Current workflow: Can't do this! Not even close

---

### Dynamic Workflow Composer Solution:

```typescript
// This doesn't exist yet - we need to build it
class DynamicWorkflowComposer {

  // Takes a plan from Planning Agent
  // Builds a workflow AT RUNTIME
  compose(plan: ExecutionPlan): Workflow {

    // Example 1: Plan says "load template → generate → match"
    // Composer creates: new SequentialAgent([templateLoader, generator, matcher])

    // Example 2: Plan says "parse code + parse notes in parallel → merge"
    // Composer creates: new ParallelAgent([codeParser, noteParser]) → new MergeAgent()

    // Example 3: Plan says "if template exists, use it, else generate"
    // Composer creates: new ConditionalAgent(hasTemplate, useTemplate, generateNew)

    const agents = plan.steps.map(step => {
      return findService(step.service); // Get the actual service
    });

    if (plan.has_parallel_tracks) {
      return new ParallelAgent(agents);
    } else {
      return new SequentialAgent(agents);
    }
  }
}
```

### Concrete Example:

**User**: "Create architecture slide from my template"

**Planning Agent creates plan**:
```json
{
  "steps": [
    {"service": "templateLoader"},
    {"service": "architectureGenerator"},
    {"service": "templateMatcher"}
  ]
}
```

**Dynamic Workflow Composer builds workflow**:
```typescript
// AT RUNTIME, it creates:
const workflow = new SequentialAgent({
  subAgents: [
    services.get("templateLoader"),           // Found in registry
    services.get("architectureGenerator"),    // Found in registry
    services.get("templateMatcher")           // Found in registry
  ]
});

// Then executes it!
await workflow.execute(userRequest);
```

**Key Point**: The workflow is built ON-THE-FLY based on the request, not hardcoded!

---

## #3: Service Registry - Simple Explanation

**Problem**: Services are manually imported and hardcoded

### Current Situation:

```typescript
// In each workflow file, you manually import:
import { architectureSlideGenerator } from '../services/architectureSlideGenerator';
import { intelligentGeneration } from '../services/intelligentGeneration';
// ... have to know which files to import

// Then manually wire them:
const agent = new LlmAgent({
  name: "MyAgent",
  instruction: "call architectureSlideGenerator somehow..."
});
```

**This is MANUAL WIRING - you have to know what exists and import it yourself.**

### Service Registry Solution:

```typescript
// At startup, register ALL your services in one place
class ServiceRegistry {
  private services = new Map<string, Service>();

  register(name: string, service: Service) {
    this.services.set(name, service);
  }

  get(name: string): Service {
    return this.services.get(name);
  }

  findByCapability(capability: string): Service[] {
    return this.services.filter(s => s.can_handle(capability));
  }
}

// At app startup, register everything:
const registry = new ServiceRegistry();
registry.register("architecture_generator", architectureSlideGenerator);
registry.register("note_parser", intelligentGeneration.parseNotes);
registry.register("template_loader", referenceMatchingEngine.loadReference);
registry.register("slide_matcher", referenceMatchingEngine.matchSlides);
// ... register all services once
```

### How It's Used:

**Without Registry (Current)**:
```typescript
// You have to manually know and import
import { architectureSlideGenerator } from '../services/architectureSlideGenerator';

// Use it directly
const result = architectureSlideGenerator.generate(type, components);
```

**With Registry**:
```typescript
// Planning Agent says: "I need architecture_generator service"
const plan = {
  steps: [
    { service: "architecture_generator", input: {...} }
  ]
};

// Dynamic Workflow Composer looks it up:
const service = registry.get("architecture_generator");

// And uses it:
const result = await service.execute(input);
```

### Why This Matters:

**Example**: User asks "Create from code + template"

**Planning Agent creates plan**:
```json
{
  "steps": [
    {"service": "code_analyzer"},
    {"service": "template_loader"},
    {"service": "content_merger"}
  ]
}
```

**Dynamic Workflow Composer**:
```typescript
// Looks up each service by name
const codeAnalyzer = registry.get("code_analyzer");
const templateLoader = registry.get("template_loader");
const contentMerger = registry.get("content_merger");

// Builds workflow
const workflow = new SequentialAgent([
  codeAnalyzer,
  templateLoader,
  contentMerger
]);

// Executes!
```

**Without Registry**: You'd have to manually import these services in advance, and you can't build workflows dynamically.

---

## Putting It All Together

### Current System (Static):

```
User: "Create architecture slide from template"
  ↓
Master Agent: "This is CREATE_DECK"
  ↓
CreateDeckAgent (hardcoded workflow):
  Generate → Review → Refine (wrong workflow!)
  ↓
Result: Generic slide, template ignored ❌
```

---

### With Planning Agent + Dynamic Composer + Registry:

```
User: "Create architecture slide from template"
  ↓
Planning Agent:
  "Need 3 steps: load_template → generate_architecture → match_to_template"
  ↓
Dynamic Workflow Composer:
  registry.get("template_loader")
  registry.get("architecture_generator")
  registry.get("template_matcher")

  Creates: new SequentialAgent([loader, generator, matcher])
  ↓
Executes workflow:
  Step 1: Load template → design blueprint
  Step 2: Generate architecture content
  Step 3: Match content to template style
  ↓
Result: Architecture slide matching template style ✅
```

---

## Real-World Analogy

### Current System (Master Agent):

**Like a receptionist with 5 buttons**:
- Button 1: "CREATE" - sends everyone to creation department
- Button 2: "EDIT" - sends everyone to editing department
- Button 3-5: Other departments

**Problem**: Everyone goes to the same department regardless of their specific needs!

### New System (Planning Agent):

**Like a smart concierge**:
- Understands your exact needs
- Creates a custom plan: "First go to Department A, then B, then C"
- Hands you a map with step-by-step instructions
- You follow the plan and get exactly what you need

---

## Summary

### #1: Planning Agent
- **What**: Replaces Master Agent's classification
- **Does**: Creates detailed execution plans
- **Why**: Master Agent loses details by putting everything into 5 boxes

### #2: Dynamic Workflow Composer
- **What**: Builds workflows at runtime (not hardcoded .ts files)
- **Does**: Takes a plan → creates SequentialAgent/ParallelAgent/etc.
- **Why**: Current workflows are fixed, can't adapt to different requests

### #3: Service Registry
- **What**: Central catalog of all services
- **Does**: Lets you look up services by name: `registry.get("service_name")`
- **Why**: Can't build dynamic workflows without dynamic service lookup

---

## Next Step

Should I design the actual implementation of these 3 components?

1. **Planning Agent** - The intelligent planner (replaces Master Agent)
2. **Dynamic Workflow Composer** - Builds workflows from plans
3. **Service Registry** - Makes your existing services discoverable

All three work together to make the system flexible!
