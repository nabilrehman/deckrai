# ADK Conversion Plan
## V2.0 → V3.0: Google ADK Pattern Implementation

---

## 🎯 Current Status

**V2.0 Implementation:** ✅ Complete and validated
- Uses Python `ThreadPoolExecutor` for parallel execution
- 100% completion rate (10/10 slides)
- 181.26s generation time
- 9.01x speedup vs sequential

**Next Step:** Convert to Google ADK agents for proper observability and integration

---

## 📋 What Needs to Change

### Current Implementation (ThreadPoolExecutor):

```python
# prompts/parallel-orchestrator.py (lines 222-272)

def run_parallel_slide_agents(slide_briefs, brand_and_design, max_workers=5):
    """Phase 2: Run all slide agents in parallel"""
    print(f"Spawning {len(slide_briefs)} parallel agents...")

    results = []
    start_time = time.time()

    # Raw Python threading
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_slide = {
            executor.submit(
                run_slide_agent,
                brief['slide_number'],
                brief['brief'],
                brand_and_design
            ): brief['slide_number']
            for brief in slide_briefs
        }

        # Process as they complete
        for future in as_completed(future_to_slide):
            slide_num = future_to_slide[future]
            result = future.result()
            results.append(result)

    return results
```

**Issues with Current Approach:**
- ❌ No ADK observability
- ❌ No `session.state` management
- ❌ No integration with ADK ecosystem
- ❌ Manual error handling
- ❌ No event-based communication

---

### Target Implementation (Google ADK):

```python
# prompts/parallel-orchestrator-adk.py (NEW FILE)

from google.adk.agents import LlmAgent, ParallelAgent, SequentialAgent
from google.adk.runners import InMemoryRunner
from google.genai import types

# Phase 1: Master Planning Agent
master_agent = LlmAgent(
    name="MasterPlanner",
    model="gemini-2.5-pro",
    instruction=MASTER_PROMPT_TEMPLATE,
    input_keys=["company", "content", "audience", "goal", "slide_count"],
    output_key="master_plan",
    thinking_config=types.ThinkingConfig(
        thinking_budget=16384,
        include_thoughts=True
    )
)

# Phase 2: Dynamic Slide Agent Factory
def create_slide_agents(master_plan_output):
    """Dynamically create slide agents from master plan"""
    slide_briefs = parse_slide_briefs(master_plan_output)
    brand_and_design = extract_brand_and_design_system(master_plan_output)

    slide_agents = []
    for brief in slide_briefs:
        agent = LlmAgent(
            name=f"SlideAgent_{brief['slide_number']}",
            model="gemini-2.5-pro",
            instruction=SLIDE_AGENT_PROMPT_TEMPLATE,
            input_keys=["slide_brief", "brand_and_design"],
            output_key=f"slide_{brief['slide_number']}_spec",
            thinking_config=types.ThinkingConfig(
                thinking_budget=8192,
                include_thoughts=False
            )
        )
        slide_agents.append(agent)

    return slide_agents, brand_and_design

# Phase 2: Parallel Execution Agent
# Note: This needs special handling due to dynamic agent creation
parallel_slides_agent = ParallelAgent(
    name="ParallelSlideGenerator",
    sub_agents=[]  # Will be populated dynamically
)

# Phase 3: Root Sequential Agent
root_agent = SequentialAgent(
    name="CompleteDeckGenerator",
    sub_agents=[
        master_agent,
        # Custom logic to spawn parallel agents here
        # (ADK challenge: dynamic agent creation)
    ]
)

# Run the workflow
runner = InMemoryRunner(agent=root_agent)
result = runner.run(session_state={
    "company": "Atlassian",
    "content": content_description,
    "audience": audience_type,
    "goal": presentation_goal,
    "slide_count": 10
})
```

**Benefits of ADK Approach:**
- ✅ Proper `session.state` management
- ✅ Event-based communication (`Event`, `EventActions`)
- ✅ Built-in observability and logging
- ✅ Integration with ADK ecosystem
- ✅ Better error handling patterns
- ✅ Cleaner agent composition

---

## 🚧 Key Challenge: Dynamic Agent Creation

### The Problem:

ADK agents are typically defined **upfront** in the agent hierarchy:

```python
# ADK expects this:
root_agent = SequentialAgent(
    name="CompleteDeckGenerator",
    sub_agents=[agent1, agent2, agent3]  # Fixed at definition time
)
```

But our workflow requires **dynamic agent creation**:
1. Master agent runs first
2. Master agent outputs N slide briefs (N varies by input)
3. Need to create N slide agents on-the-fly
4. Run those N agents in parallel

### Possible Solutions:

#### **Option 1: Two-Stage Execution** (Recommended)

```python
# Stage 1: Run master agent
master_runner = InMemoryRunner(agent=master_agent)
master_result = master_runner.run(session_state={
    "company": company,
    "content": content,
    ...
})

# Stage 2: Create and run parallel agents dynamically
slide_agents, brand_and_design = create_slide_agents(
    master_result.final_output["master_plan"]
)

parallel_agent = ParallelAgent(
    name="ParallelSlideGen",
    sub_agents=slide_agents
)

parallel_runner = InMemoryRunner(agent=parallel_agent)
parallel_result = parallel_runner.run(session_state={
    "brand_and_design": brand_and_design,
    # Each slide agent gets its specific brief via session_state
})

# Stage 3: Aggregate results
final_document = assemble_final_document(
    master_result.final_output,
    parallel_result.final_output
)
```

**Pros:**
- ✅ Simple and straightforward
- ✅ Works with ADK's agent model
- ✅ Each stage is clearly defined

**Cons:**
- ❌ Not a single unified workflow
- ❌ Two separate runner instances

---

#### **Option 2: Custom Agent with ADK Integration**

```python
from google.adk.agents import Agent

class DynamicParallelDeckAgent(Agent):
    """Custom agent that spawns parallel sub-agents dynamically"""

    def __init__(self, name: str):
        super().__init__(name=name)
        self.master_agent = LlmAgent(...)

    def run(self, session_state):
        # Phase 1: Master planning
        master_result = self.master_agent.run(session_state)

        # Phase 2: Create slide agents dynamically
        slide_agents = self._create_slide_agents(master_result)

        # Phase 3: Run parallel execution
        parallel_agent = ParallelAgent(
            name="DynamicSlides",
            sub_agents=slide_agents
        )
        parallel_result = parallel_agent.run(session_state)

        # Phase 4: Aggregate
        return self._aggregate_results(master_result, parallel_result)

    def _create_slide_agents(self, master_result):
        # Parse briefs and create agents
        ...
```

**Pros:**
- ✅ Single unified agent
- ✅ Full ADK integration
- ✅ Clean interface

**Cons:**
- ❌ More complex implementation
- ❌ Need to understand ADK internals

---

#### **Option 3: Pre-Define Maximum Agents**

```python
# Create 50 slide agents upfront (max possible)
slide_agents = [
    LlmAgent(name=f"SlideAgent_{i}", ...)
    for i in range(1, 51)
]

# Use only the first N agents based on master plan
parallel_agent = ParallelAgent(
    name="ParallelSlideGen",
    sub_agents=slide_agents[:actual_slide_count]
)
```

**Pros:**
- ✅ Works with ADK's static model
- ✅ Simple to implement

**Cons:**
- ❌ Wasteful (creates unused agents)
- ❌ Fixed upper limit
- ❌ Not elegant

---

## 📝 Recommended Implementation Plan

### **Phase 1: Two-Stage ADK Implementation** (Recommended Start)

1. **Create `parallel-orchestrator-adk.py`**
   - Stage 1: Master agent with ADK
   - Stage 2: Parallel agents with ADK
   - Stage 3: Aggregation

2. **Reuse existing prompts**
   - `parallel-master-prompt.md` → Master agent instruction
   - `parallel-slide-agent-prompt.md` → Slide agent instruction

3. **Add `session.state` management**
   - Pass brand guidelines through state
   - Pass slide briefs through state

4. **Test with Atlassian case**
   - Verify output matches V2.0 quality
   - Compare performance
   - Validate ADK benefits

---

### **Phase 2: Custom Agent (If Needed)**

If two-stage approach proves limiting, implement custom `DynamicParallelDeckAgent`.

---

## 🔧 Implementation Details

### File Structure:

```
prompts/
├── parallel-orchestrator.py              # V2.0 (ThreadPoolExecutor) ✅
├── parallel-orchestrator-adk.py          # V3.0 (ADK) - NEW
├── parallel-master-prompt.md             # Reused
├── parallel-slide-agent-prompt.md        # Reused
└── adk-utils.py                          # Helper functions - NEW
```

### New File: `parallel-orchestrator-adk.py`

```python
#!/usr/bin/env python3
"""
V3.0: ADK-Based Parallel Slide Deck Generator
Uses Google ADK agents for proper observability and integration
"""

import os
from pathlib import Path
from google.adk.agents import LlmAgent, ParallelAgent
from google.adk.runners import InMemoryRunner
from google.genai import types

# Configuration
API_KEY = os.getenv("VITE_GEMINI_API_KEY")
PROMPTS_DIR = Path(__file__).parent

def load_prompt(filename):
    """Load a prompt template"""
    with open(PROMPTS_DIR / filename, 'r') as f:
        return f.read()

# Load prompt templates
MASTER_PROMPT = load_prompt('parallel-master-prompt.md')
SLIDE_PROMPT = load_prompt('parallel-slide-agent-prompt.md')

def create_master_agent():
    """Create the master planning agent"""
    return LlmAgent(
        name="MasterPlanner",
        model="gemini-2.5-pro",
        instruction=MASTER_PROMPT,
        input_keys=["company", "content", "audience", "goal", "slide_count"],
        output_key="master_plan",
        thinking_config=types.ThinkingConfig(
            thinking_budget=16384,
            include_thoughts=True
        )
    )

def create_slide_agent(slide_number, slide_brief, brand_and_design):
    """Create a single slide agent"""
    # Build instruction with context
    instruction = f"""
# SLIDE SPECIFICATION TASK

You are generating the specification for SLIDE {slide_number}.

---

{brand_and_design}

---

{slide_brief}

---

{SLIDE_PROMPT}
"""

    return LlmAgent(
        name=f"SlideAgent_{slide_number}",
        model="gemini-2.5-pro",
        instruction=instruction,
        input_keys=[],  # All context in instruction
        output_key=f"slide_{slide_number}_spec",
        thinking_config=types.ThinkingConfig(
            thinking_budget=8192,
            include_thoughts=False
        )
    )

def run_two_stage_generation(company, content, audience, goal, slide_count):
    """Run two-stage ADK generation"""

    print("\n" + "="*80)
    print("STAGE 1: MASTER PLANNING (ADK)")
    print("="*80 + "\n")

    # Stage 1: Master Planning
    master_agent = create_master_agent()
    master_runner = InMemoryRunner(agent=master_agent, api_key=API_KEY)

    master_result = master_runner.run(session_state={
        "company": company,
        "content": content,
        "audience": audience,
        "goal": goal,
        "slide_count": slide_count
    })

    master_output = master_result.final_output["master_plan"]
    print(f"✓ Master planning complete")
    print(f"  Output length: {len(master_output)} characters\n")

    # Parse output
    from parallel_orchestrator import (
        parse_slide_briefs,
        extract_brand_and_design_system
    )

    slide_briefs = parse_slide_briefs(master_output)
    brand_and_design = extract_brand_and_design_system(master_output)

    print("\n" + "="*80)
    print("STAGE 2: PARALLEL SLIDE GENERATION (ADK)")
    print("="*80 + "\n")

    # Stage 2: Create parallel agents
    slide_agents = [
        create_slide_agent(
            brief['slide_number'],
            brief['brief'],
            brand_and_design
        )
        for brief in slide_briefs
    ]

    parallel_agent = ParallelAgent(
        name="ParallelSlideGenerator",
        sub_agents=slide_agents
    )

    parallel_runner = InMemoryRunner(agent=parallel_agent, api_key=API_KEY)
    parallel_result = parallel_runner.run(session_state={})

    print(f"✓ All {len(slide_agents)} slides complete\n")

    # Stage 3: Aggregate
    print("\n" + "="*80)
    print("STAGE 3: AGGREGATION")
    print("="*80 + "\n")

    # Extract slide specs from result
    slide_results = []
    for i, brief in enumerate(slide_briefs):
        slide_num = brief['slide_number']
        spec_key = f"slide_{slide_num}_spec"
        slide_results.append({
            'slide_number': slide_num,
            'output': parallel_result.final_output.get(spec_key, ""),
            'success': True
        })

    from parallel_orchestrator import assemble_final_document
    final_doc = assemble_final_document(master_output, slide_results)

    print("✓ Final document assembled\n")

    return {
        'master_output': master_output,
        'slide_results': slide_results,
        'final_document': final_doc
    }

def main():
    """Main ADK orchestrator"""
    print("""
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║         ADK PARALLEL SLIDE DECK GENERATOR (V3.0)                         ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
    """)

    # Test with Atlassian case
    company = "Atlassian"
    content = """Agile transformation success story..."""
    audience = "Enterprise IT leaders, CTOs, Engineering managers"
    goal = "Demonstrate Atlassian's value through real customer success story"
    slide_count = 10

    result = run_two_stage_generation(
        company, content, audience, goal, slide_count
    )

    # Save results
    from parallel_orchestrator import save_results
    # ... save logic ...

    print("\n✅ ADK Generation Complete!")

if __name__ == "__main__":
    main()
```

---

## ✅ Benefits of ADK Conversion

### 1. **Observability**
- View agent execution traces
- Debug failed agents easily
- Monitor token usage per agent

### 2. **State Management**
- Proper `session.state` passing
- No manual context tracking
- Built-in state serialization

### 3. **Error Handling**
- ADK handles agent failures gracefully
- Retry logic built-in
- Better error messages

### 4. **Integration**
- Works with ADK tools ecosystem
- Compatible with ADK monitoring
- Easier to extend with new agents

### 5. **Code Clarity**
- Cleaner agent definitions
- Standard ADK patterns
- Better maintainability

---

## 📊 Expected Performance Comparison

| Metric | V2.0 ThreadPool | V3.0 ADK | Notes |
|--------|-----------------|----------|-------|
| **Time** | 181.26s | ~180-200s | Slight overhead from ADK |
| **Completion** | 100% | 100% | Same |
| **Code Lines** | ~525 | ~600 | More code but clearer |
| **Observability** | Manual | Built-in | ✅ ADK advantage |
| **State Mgmt** | Manual | Automatic | ✅ ADK advantage |
| **Error Handling** | Manual | Built-in | ✅ ADK advantage |

---

## 🎯 Success Criteria for V3.0

1. ✅ All 10 slides generate successfully
2. ✅ Output quality matches V2.0
3. ✅ ADK observability works (view traces)
4. ✅ session.state properly manages context
5. ✅ Code is cleaner and more maintainable

---

## 📅 Implementation Timeline

**Phase 1: Two-Stage ADK (Week 1)**
- Day 1: Create `parallel-orchestrator-adk.py`
- Day 2: Implement master agent stage
- Day 3: Implement parallel agent stage
- Day 4: Test with Atlassian case
- Day 5: Compare to V2.0 results

**Phase 2: Optimization (Week 2)**
- Evaluate if custom agent needed
- Optimize state passing
- Add better error handling
- Document ADK patterns used

**Phase 3: Production Ready (Week 3)**
- Test with Nike and CloudSync cases
- Performance tuning
- Documentation updates
- Deployment guide

---

## 🚀 Next Steps

1. **Review this plan** - Ensure approach makes sense
2. **Create `parallel-orchestrator-adk.py`** - Start implementation
3. **Test incrementally** - Master agent first, then parallel
4. **Compare to V2.0** - Validate no quality regression
5. **Document learnings** - Update docs with ADK patterns

---

## 📚 References

- [Google ADK Documentation](https://github.com/google/generative-ai-agent-developer-kit)
- [ADK Agent Patterns](https://github.com/google/generative-ai-agent-developer-kit/tree/main/examples)
- [ParallelAgent Example](https://github.com/google/generative-ai-agent-developer-kit/blob/main/examples/parallel_agent_example.py)

---

**Status:** Plan complete, ready for implementation
**Estimated Time:** 2-3 weeks for full V3.0 rollout
**Risk Level:** Low (V2.0 works, ADK is additive benefit)
