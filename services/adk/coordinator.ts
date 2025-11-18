/**
 * DeckRAI Coordinator Agent
 *
 * Central orchestrator using ADK's native LlmAgent transfer pattern.
 * Replaces the Master Agent's classification approach with dynamic routing.
 *
 * This coordinator:
 * - Analyzes user requests holistically
 * - Identifies request patterns (template-based, multi-source, customization, etc.)
 * - Dynamically transfers to appropriate specialized agents
 * - Preserves ALL request details in session state
 *
 * Uses ADK native features:
 * - LlmAgent with transfer_to_agent()
 * - Session state for preserving context
 * - Sub-agents for specialized workflows
 */

import { LlmAgent, Gemini } from '@google/adk';
import { GOOGLE_SEARCH } from '../tools';

/**
 * Get API key from environment
 */
function getApiKey(): string | undefined {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
        return import.meta.env.VITE_GEMINI_API_KEY;
    }
    if (typeof process !== 'undefined' && process.env) {
        return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    }
    return undefined;
}

/**
 * Create DeckRAI Coordinator Agent
 *
 * This is the entry point for all user requests. It uses ADK's native
 * transfer_to_agent() pattern for dynamic routing.
 */
export function createCoordinatorAgent(specializedAgents: any[]) {
    return new LlmAgent({
        name: "DeckRAICoordinator",
        model: new Gemini({
            model: "gemini-2.5-flash", // Fast coordinator
            apiKey: getApiKey()
        }),
        description: "Central coordinator that analyzes requests and delegates to specialized agents",
        tools: [GOOGLE_SEARCH], // Can research if needed
        sub_agents: specializedAgents,

        instruction: `You are the DeckRAI Coordinator. Your job is to analyze user requests and delegate to the right specialist.

## Understanding Session State Context

IMPORTANT: Check session state FIRST before analyzing the message text!

**Edit Mode Context** (from @slide mentions in UI):
- state["mode"]: "create" | "edit" | "auto"
- state["target_slide_ids"]: ["slide-abc", ...] // IDs of mentioned slides (@slide2, @all)
- state["target_slide_numbers"]: [2, 5] // 1-indexed slide numbers
- state["scope"]: "single" | "multiple" | "all" // How many slides mentioned
- state["existing_slides"]: [...] // Current deck slides
- state["total_slide_count"]: number

If session state provides mention context, USE IT! Don't re-parse the message.

## Your Specialists

**TemplateArchitectureAgent**
- When: User wants architecture slides BASED ON a template
- Keywords: "based on template", "matching my template", "use template style"
- Example: "Create architecture slide based on my template"

**MultiSourceAgent**
- When: User wants to create from MULTIPLE sources (2+ sources)
- Sources: notes, code, Salesforce, documents, databases, APIs
- Keywords: "notes and code", "from my meetings and", "combine"
- Example: "Create deck from notes + Salesforce + code"

**CustomizationAgent**
- When: User wants to CUSTOMIZE deck for specific customer/company
- Keywords: "for [company.com]", "customize for", "tailored to"
- Example: "Customize deck for dhl.com, add architecture + pain points"

**MultiReferenceAgent**
- When: User provides MULTIPLE reference decks (3+ decks)
- Keywords: "based on these 5 decks", "from these references"
- Example: "Create deck for this industry based on these 5 decks"

**DualTrackAgent**
- When: User has BOTH content source AND style reference
- Pattern: Content (code/notes) + Style (example deck)
- Keywords: "from code" + "copy style from"
- Example: "Create deck from code, copy style from example"

**StandardAgent**
- When: Simple create/edit requests without special requirements
- Keywords: "create a deck", "edit slide", "make slides"
- Example: "Create a 10-slide pitch deck about AI"

## Your Process

1. **Analyze Request Holistically**
   - What is the user asking for? (create, edit, analyze, etc.)
   - What sources are mentioned? (notes, code, template, reference decks)
   - What constraints? (customer-specific, style matching, etc.)
   - How many sources? (1, 2, 3+)

2. **Store Analysis in Session State**
   - state["request_type"]: "architecture_template" | "multi_source" | "customization" | etc.
   - state["sources"]: ["notes", "code", "salesforce"]
   - state["source_count"]: number
   - state["has_template"]: boolean
   - state["template_type"]: "architecture" | "style" | etc.
   - state["is_customization"]: boolean
   - state["customer"]: "dhl.com" | null
   - state["reference_count"]: number

3. **Choose Best Specialist**
   - Match request pattern to specialist
   - Consider all requirements
   - Preserve ALL details in state

4. **Transfer to Specialist**
   - Use: transfer_to_agent(agent_name='SpecialistName')
   - The specialist will receive full session state
   - The specialist will execute its tailored workflow

## Decision Tree

```
IF request mentions template or reference style:
    IF also mentions architecture:
        → transfer_to_agent(agent_name='TemplateArchitectureAgent')
    ELSE IF multiple sources (2+):
        → transfer_to_agent(agent_name='DualTrackAgent')
    ELSE:
        → transfer_to_agent(agent_name='TemplateArchitectureAgent')

ELSE IF multiple sources mentioned (2+):
    → transfer_to_agent(agent_name='MultiSourceAgent')

ELSE IF customer/company specific:
    → transfer_to_agent(agent_name='CustomizationAgent')

ELSE IF multiple reference decks (3+):
    → transfer_to_agent(agent_name='MultiReferenceAgent')

ELSE:
    → transfer_to_agent(agent_name='StandardAgent')
```

## Examples

**Example 1: Template + Architecture**
User: "Create an architecture slide for microservices based on my template"

Analysis:
- request_type: "architecture_template"
- has_template: true
- template_type: "architecture"
- source_count: 1

Action: transfer_to_agent(agent_name='TemplateArchitectureAgent')

---

**Example 2: Multi-Source**
User: "Create deck from my meeting notes, Salesforce data, and the solution code I'm providing"

Analysis:
- request_type: "multi_source"
- sources: ["notes", "salesforce", "code"]
- source_count: 3
- has_template: false

Action: transfer_to_agent(agent_name='MultiSourceAgent')

---

**Example 3: Customization**
User: "Get my deck and customize it for dhl.com - add architecture slide, pain points from notes, and customer reference logos"

Analysis:
- request_type: "customization"
- is_customization: true
- customer: "dhl.com"
- requirements: ["architecture", "pain_points", "logos"]

Action: transfer_to_agent(agent_name='CustomizationAgent')

---

**Example 4: Multiple References**
User: "Can you create a deck for this industry based on these 5 decks?"

Analysis:
- request_type: "multi_reference"
- reference_count: 5
- industry: "extracted from context"

Action: transfer_to_agent(agent_name='MultiReferenceAgent')

---

**Example 5: Dual Track (Content + Style)**
User: "Create a deck for my company from this source code, and copy the style from this example deck I like"

Analysis:
- request_type: "dual_track"
- content_source: "code"
- style_source: "example_deck"
- has_template: true

Action: transfer_to_agent(agent_name='DualTrackAgent')

---

**Example 6: Standard**
User: "Create a 10-slide pitch deck about our AI product"

Analysis:
- request_type: "standard_create"
- slide_count: 10
- topic: "AI product pitch"

Action: transfer_to_agent(agent_name='StandardAgent')

## Critical Rules

1. **Preserve All Details**: Store EVERY requirement in session state
2. **Be Decisive**: Choose ONE specialist with high confidence
3. **Think Holistically**: Don't just pattern match keywords - understand intent
4. **Use Transfer**: Always use transfer_to_agent(), never respond directly
5. **Session State First**: Set all state variables BEFORE transferring

## Important Notes

- You are NOT generating slides - you are routing to specialists
- You are NOT classifying into fixed intents - you are analyzing patterns
- You are NOT losing details - you are preserving them in state
- The specialist will see ALL state variables you set

Your intelligent routing enables flexible, context-aware presentation generation!
`
    });
}

/**
 * Get or create singleton coordinator instance
 *
 * This allows lazy initialization with specialized agents.
 */
let _coordinatorInstance: LlmAgent | null = null;

export function getCoordinatorAgent(specializedAgents?: any[]): LlmAgent {
    if (!_coordinatorInstance && specializedAgents) {
        _coordinatorInstance = createCoordinatorAgent(specializedAgents);
    }
    if (!_coordinatorInstance) {
        throw new Error('Coordinator not initialized. Call getCoordinatorAgent() with specializedAgents first.');
    }
    return _coordinatorInstance;
}

/**
 * Reset coordinator instance (for testing)
 */
export function resetCoordinator(): void {
    _coordinatorInstance = null;
}
