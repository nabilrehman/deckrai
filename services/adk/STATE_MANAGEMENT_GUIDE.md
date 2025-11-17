# ADK State Management Guide

## Based on Official Google ADK Documentation & Best Practices

This guide explains how to properly manage state in Google ADK agents, based on extensive research of official documentation and community best practices.

---

## ❌ WRONG Way: Direct State References

### What NOT to Do

```typescript
// ❌ WRONG: This DOES NOT work!
instruction: `
    Read the slides from state["slides"].
    Write your output to state["quality_report"].
`
```

**Why this fails:**
- **LLMs don't have direct access to session state**
- The LLM will literally see the text `state["slides"]` - not the actual data
- Source: Google ADK GitHub Discussion #2489
- Quote: *"LLMs don't have direct access to session states, so using state['key'] in instructions will not work"*

---

## ✅ CORRECT Way #1: Use {placeholder} Syntax

### Reading State in Instructions

```typescript
// ✅ CORRECT: Use {curly braces}
const agent = new LlmAgent({
    name: "MyAgent",
    instruction: `
        Review the slides provided below:
        {slides}

        Based on the quality report:
        {quality_report}

        Provide your analysis...
    `
});
```

**How it works:**
1. ADK automatically replaces `{slides}` with the value from `state["slides"]`
2. Replacement happens **before** sending to the LLM
3. LLM receives the actual slide data, not a placeholder

**Source:** https://google.github.io/adk-docs/sessions/state/
- Quote: *"To inject a value from session state in agent instructions, enclose the key within curly braces: {key}"*

### Real Example from Our Code

```typescript
instruction: `
The slides to review are in: {slides}

⚠️ CRITICAL: The {slides} placeholder will be replaced with actual data automatically.
`
```

---

## ✅ CORRECT Way #2: Use output_key Parameter

### Writing State from Agent Output

```typescript
// ✅ CORRECT: Automatic state saving
const slideGenerator = new LlmAgent({
    name: "SlideGenerator",
    output_key: "slides",  // ← Agent output auto-saved to state["slides"]
    instruction: `
        Generate 3 slides about AI.
        Output as JSON array: [...]
    `
});
```

**How it works:**
1. Agent generates its response
2. ADK automatically saves response to `state["slides"]`
3. Next agent can read it using `{slides}` placeholder

**Source:** Dev.to - Smarter ADK Prompts
- Quote: *"You can have an agent automatically save its output to the session state by using the output_key parameter"*

### Example: Complete State Flow

```typescript
// Step 1: Generate slides
const generator = new LlmAgent({
    output_key: "slides",  // Writes to state["slides"]
    instruction: "Generate slides..."
});

// Step 2: Review quality
const reviewer = new LlmAgent({
    output_key: "quality_report",  // Writes to state["quality_report"]
    instruction: `
        Review these slides: {slides}  // Reads from state["slides"]
        Output quality report...
    `
});

// Step 3: Refine
const refiner = new LlmAgent({
    output_key: "refined_slides",  // Writes to state["refined_slides"]
    instruction: `
        Original slides: {slides}
        Quality report: {quality_report}
        Generate refined versions...
    `
});
```

---

## ✅ CORRECT Way #3: Programmatic State Access in Tools/Callbacks

### Accessing State in Tool Functions

```typescript
const myTool = new FunctionTool({
    name: "my_tool",
    async execute(params, tool_context) {
        // ✅ CORRECT: Read state via context
        const currentSlides = tool_context.state["slides"];

        // ✅ CORRECT: Write state via context
        tool_context.state["processed_data"] = processedResult;

        return { success: true };
    }
});
```

**Source:** Google ADK State Documentation
- Quote: *"Tools can access session state via tool_context.state"*

### Accessing State in Callbacks

```typescript
const myCallback = async (callback_context) => {
    // ✅ CORRECT: Read state
    const report = callback_context.state["quality_report"];

    // ✅ CORRECT: Modify state
    callback_context.state["callback_result"] = newValue;
};
```

**Source:** Google ADK State Documentation
- Quote: *"Callbacks can access it via callback_context.state"*

---

## 🔄 State Flow in SequentialAgent

### How State Propagates Between Sub-Agents

```typescript
const workflow = new SequentialAgent({
    name: "MyWorkflow",
    sub_agents: [agent1, agent2, agent3]
});
```

**What happens:**
1. **Agent1** runs:
   - Has access to initial session state
   - Writes to state via `output_key` or tools
   - State changes are persisted

2. **Agent2** runs:
   - Automatically receives updated state from Agent1
   - Can read Agent1's output using `{placeholder}` syntax
   - Adds its own state changes

3. **Agent3** runs:
   - Receives state from Agent1 + Agent2
   - Can access all previous outputs

**Key Point:** State is **automatically shared** in SequentialAgent - no manual passing needed!

**Source:** Google ADK Sessions and State Documentation

---

## 📊 Complete Working Example

### Full Implementation with Proper State Management

```typescript
import { SequentialAgent, LlmAgent } from '@google/adk';

// Agent 1: Generate Content
const contentGenerator = new LlmAgent({
    name: "ContentGenerator",
    output_key: "raw_content",  // ✅ Writes to state["raw_content"]
    instruction: `
        Generate a blog post about {topic}.  // ✅ Reads from state["topic"]
        Output as JSON with title and body.
    `
});

// Agent 2: Review Quality
const qualityReviewer = new LlmAgent({
    name: "QualityReviewer",
    output_key: "quality_analysis",  // ✅ Writes to state["quality_analysis"]
    instruction: `
        Review this content: {raw_content}  // ✅ Reads Agent 1's output

        Provide quality score and suggestions.
        Output as JSON.
    `
});

// Agent 3: Refine Content
const contentRefiner = new LlmAgent({
    name: "ContentRefiner",
    output_key: "final_content",  // ✅ Writes to state["final_content"]
    instruction: `
        Original content: {raw_content}
        Quality analysis: {quality_analysis}

        Create an improved version based on feedback.
        Output as JSON.
    `
});

// Workflow: Automatic state propagation
const workflow = new SequentialAgent({
    name: "ContentCreationWorkflow",
    sub_agents: [
        contentGenerator,  // state["raw_content"] created
        qualityReviewer,   // reads {raw_content}, creates state["quality_analysis"]
        contentRefiner     // reads both, creates state["final_content"]
    ]
});
```

**Final State Structure:**
```json
{
    "topic": "AI in Healthcare",
    "raw_content": { "title": "...", "body": "..." },
    "quality_analysis": { "score": 0.85, "suggestions": [...] },
    "final_content": { "title": "...", "body": "..." }
}
```

---

## ⚠️ Common Pitfalls

### Pitfall #1: Direct State References in Instructions
```typescript
// ❌ WRONG
instruction: `Read from state["mykey"]`

// ✅ CORRECT
instruction: `Read from: {mykey}`
```

### Pitfall #2: Manually Modifying Session State
```typescript
// ❌ WRONG: Bypasses event tracking
const session = await session_service.get_session(userId, sessionId);
session.state["mykey"] = "value";  // ❌ Changes may be lost!

// ✅ CORRECT: Use context in tools/callbacks
tool_context.state["mykey"] = "value";

// ✅ CORRECT: Use output_key in agents
const agent = new LlmAgent({ output_key: "mykey", ... });
```

**Source:** Google ADK Session Documentation
- Quote: *"Avoid directly modifying state on a Session object retrieved from SessionService, as it bypasses ADK's event tracking and can lead to lost data"*

### Pitfall #3: Forgetting State Placeholders Replace Before LLM
```typescript
// ❌ MISCONCEPTION: LLM can execute code
instruction: `Calculate sum: state["numbers"].reduce((a,b) => a+b)`

// ✅ REALITY: Placeholder syntax only replaces values
instruction: `The numbers are: {numbers}. Calculate their sum.`
```

---

## 🧪 Testing State Management

### Verify State Propagation

```typescript
// In tests: Check state after each agent
for await (const event of runner.runAsync({...})) {
    if (event.actions?.stateDelta) {
        console.log('State updated:', event.actions.stateDelta);
    }
}

// After workflow: Verify final state
const session = await sessionService.getSession(userId, sessionId);
console.log('Final state:', session.state);
```

---

## 📚 Sources & References

### Official Documentation
1. **Google ADK State**: https://google.github.io/adk-docs/sessions/state/
2. **Google ADK Sessions**: https://google.github.io/adk-docs/sessions/
3. **Google ADK Context**: https://google.github.io/adk-docs/context/
4. **Sequential Agents**: https://google.github.io/adk-docs/agents/workflow-agents/sequential-agents/

### Community Resources
5. **Google ADK Masterclass Part 5**: Session and Memory Management
6. **Medium**: Sessions and State Management in Google ADK (Part 4)
7. **Dev.to**: Smarter ADK Prompts - Inject State Dynamically
8. **Google Cloud Blog**: Remember this - Agent state and memory with ADK

### GitHub Discussions
9. **Issue #1738**: LLMAgent loses context/state after tool execution
10. **Discussion #2489**: How Do Agents Access State Variables?

---

## 📋 Quick Reference Checklist

When implementing agents with state:

- [ ] Use `{placeholder}` syntax to **read** state in instructions
- [ ] Use `output_key` parameter to **write** state from agent output
- [ ] Use `context.state["key"]` to access state in **tools/callbacks**
- [ ] **Never** use `state["key"]` directly in LLM instructions
- [ ] Remember: SequentialAgent **automatically shares** state between sub-agents
- [ ] Test state propagation with console logs or debugging
- [ ] Document expected state structure in code comments

---

## 🎯 Summary: The Three Methods

| Method | Use Case | Syntax | Example |
|--------|----------|--------|---------|
| **{placeholder}** | Read state in LLM instructions | `{key}` | `instruction: "Review: {slides}"` |
| **output_key** | Write state from agent output | `output_key: "key"` | `output_key: "slides"` |
| **context.state** | Read/write in tools/callbacks | `context.state["key"]` | `tool_context.state["data"]` |

**Remember:** LLMs see **values**, not code. Use placeholders for state injection!

---

**Last Updated**: 2025-11-17
**Version**: 1.0
**Status**: Production Best Practices
