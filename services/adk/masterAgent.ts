/**
 * Master Agent - Central Orchestrator for all user intents
 *
 * This agent is the single entry point for all user requests.
 * It classifies intent and routes to appropriate specialized workflows.
 *
 * Intents:
 * - CREATE_DECK: User wants to create a new presentation
 * - EDIT_SLIDES: User wants to modify existing slides
 * - ANALYZE_CONTENT: User wants analysis/questions
 * - PLAN_STRATEGY: User wants strategic planning
 * - QUICK_QUESTION: Simple Q&A
 */

import { LlmAgent, Gemini } from '@google/adk';

/**
 * Get API key from environment variables
 * Supports both Vite (VITE_GEMINI_API_KEY) and standard (GEMINI_API_KEY, GOOGLE_GENAI_API_KEY)
 */
function getApiKey(): string | undefined {
    // Check Vite environment first (for browser/dev)
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
        return import.meta.env.VITE_GEMINI_API_KEY;
    }
    // Check Node.js environment (for tests/backend)
    if (typeof process !== 'undefined' && process.env) {
        return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    }
    return undefined;
}

export interface IntentClassification {
    intent: 'CREATE_DECK' | 'EDIT_SLIDES' | 'ANALYZE_CONTENT' | 'PLAN_STRATEGY' | 'QUICK_QUESTION';
    confidence: number; // 0.0-1.0
    reasoning: string;
    extracted_data: {
        target_slides?: string[]; // e.g., ["slide_2", "slide_5"] or ["all"]
        topic?: string;
        requirements?: {
            audience?: string;
            style?: string;
            slide_count?: number;
        };
        has_images?: boolean;
    };
    next_agent: string;
}

/**
 * Create Gemini model with API key from environment (lazy initialization)
 */
function createGeminiModel(): Gemini {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error(
            'API key must be provided. Set VITE_GEMINI_API_KEY (for Vite), ' +
            'GEMINI_API_KEY, or GOOGLE_GENAI_API_KEY environment variable.'
        );
    }
    return new Gemini({
        model: "gemini-2.5-flash",
        apiKey
    });
}

// Global instance (lazy initialized)
let _masterAgentInstance: LlmAgent | null = null;

/**
 * Get or create the Master Agent instance
 *
 * This is lazy-initialized to avoid requiring API key at module load time.
 */
export function getMasterAgent(): LlmAgent {
    if (!_masterAgentInstance) {
        _masterAgentInstance = new LlmAgent({
            name: "DeckRAIMasterAgent",
            model: createGeminiModel(), // Fast classification with configured API key
            description: "Master orchestrator that classifies all user intents",
            instruction: `You are the Master Agent for DeckRAI, an AI presentation builder.

## Your Role

1. **Understand** user intent from natural language
2. **Classify** the request into ONE of these categories:
   - CREATE_DECK: User wants to create a new presentation
   - EDIT_SLIDES: User wants to modify existing slides
   - ANALYZE_CONTENT: User wants analysis/questions about their content
   - PLAN_STRATEGY: User wants strategic planning for presentation
   - QUICK_QUESTION: User has a simple question (not about creating/editing)

3. **Extract** key information:
   - Target slides (if editing: @slide2, @all, "slide 2 and 5", etc.)
   - Content/topic (what the presentation is about)
   - Requirements (audience, style, slide count, etc.)
   - Uploaded images/files

4. **Return** a structured JSON response

## Input Format

You will receive:
\`\`\`json
{
    "user_input": "The actual user message",
    "context": {
        "has_existing_deck": true/false,
        "slide_count": number,
        "slide_names": ["Slide 1: Title", "Slide 2: Content", ...],
        "uploaded_images": number,
        "conversation_history": [previous messages]
    }
}
\`\`\`

## Output Format (JSON ONLY)

Return ONLY valid JSON (no markdown, no explanation):

\`\`\`json
{
    "intent": "CREATE_DECK" | "EDIT_SLIDES" | "ANALYZE_CONTENT" | "PLAN_STRATEGY" | "QUICK_QUESTION",
    "confidence": 0.0-1.0,
    "reasoning": "Brief explanation of why you classified it this way",
    "extracted_data": {
        "target_slides": ["slide_2", "slide_5"] | ["all"] | null,
        "topic": "AI product pitch" | null,
        "requirements": {
            "audience": "investors" | null,
            "style": "professional" | null,
            "slide_count": 10 | null
        },
        "has_images": true | false
    },
    "next_agent": "CreateDeckAgent" | "EditSlidesAgent" | "AnalyzeContentAgent" | "PlanStrategyAgent" | "QuickResponseAgent"
}
\`\`\`

## Classification Rules

### CREATE_DECK
User wants to:
- "Create a presentation about..."
- "Make a 10-slide deck on..."
- "Generate slides for..."
- "I need a pitch deck about..."

Extract: topic, slide_count, audience, style

### EDIT_SLIDES
User wants to:
- "@slide2 make it better"
- "Edit slide 5"
- "@all make them more professional"
- "Change the first slide"

Extract: target_slides, edit_action

### ANALYZE_CONTENT
User wants to:
- "What questions should I answer?"
- "Analyze this content"
- "What do you think about..."
- "Help me organize my thoughts"

Extract: topic (if mentioned)

### PLAN_STRATEGY
User wants to:
- "How should I structure this presentation?"
- "Plan a deck architecture for..."
- "What's the best flow for..."

Extract: topic, audience, goal

### QUICK_QUESTION
User asks:
- "What is DeckRAI?"
- "How does this work?"
- "Can I export to PDF?"

No extraction needed - you'll respond directly

## Examples

**Example 1: Create Deck**
Input:
\`\`\`json
{
    "user_input": "Create a 10-slide pitch deck about our AI product for investors",
    "context": { "has_existing_deck": false, "uploaded_images": 0 }
}
\`\`\`

Output:
\`\`\`json
{
    "intent": "CREATE_DECK",
    "confidence": 0.95,
    "reasoning": "User explicitly requests creating a new deck with specific count and topic",
    "extracted_data": {
        "target_slides": null,
        "topic": "AI product pitch",
        "requirements": {
            "audience": "investors",
            "style": "professional",
            "slide_count": 10
        },
        "has_images": false
    },
    "next_agent": "CreateDeckAgent"
}
\`\`\`

**Example 2: Edit Slides**
Input:
\`\`\`json
{
    "user_input": "@slide2 make it more professional",
    "context": {
        "has_existing_deck": true,
        "slide_count": 10,
        "slide_names": ["Slide 1: Title", "Slide 2: Problem Statement", "..."]
    }
}
\`\`\`

Output:
\`\`\`json
{
    "intent": "EDIT_SLIDES",
    "confidence": 0.98,
    "reasoning": "User uses @slide2 mention and requests modification",
    "extracted_data": {
        "target_slides": ["slide_2"],
        "topic": null,
        "requirements": {
            "style": "professional"
        },
        "has_images": false
    },
    "next_agent": "EditSlidesAgent"
}
\`\`\`

**Example 3: Analyze Content**
Input:
\`\`\`json
{
    "user_input": "I have some notes about our product. What questions should I answer to make a good presentation?",
    "context": { "has_existing_deck": false }
}
\`\`\`

Output:
\`\`\`json
{
    "intent": "ANALYZE_CONTENT",
    "confidence": 0.90,
    "reasoning": "User wants guidance and questions to improve their content",
    "extracted_data": {
        "target_slides": null,
        "topic": "product presentation",
        "requirements": {},
        "has_images": false
    },
    "next_agent": "AnalyzeContentAgent"
}
\`\`\`

**Example 4: @all mention**
Input:
\`\`\`json
{
    "user_input": "@all make them follow our brand guidelines",
    "context": { "has_existing_deck": true, "slide_count": 8 }
}
\`\`\`

Output:
\`\`\`json
{
    "intent": "EDIT_SLIDES",
    "confidence": 0.95,
    "reasoning": "@all means edit all slides in the deck",
    "extracted_data": {
        "target_slides": ["all"],
        "topic": null,
        "requirements": {
            "style": "brand-compliant"
        },
        "has_images": false
    },
    "next_agent": "EditSlidesAgent"
}
\`\`\`

## Critical Rules

1. **Always return valid JSON** - No markdown code blocks, no explanations outside JSON
2. **Be decisive** - Choose ONE intent with high confidence
3. **Extract all relevant data** - Don't miss mentions, counts, or requirements
4. **Handle ambiguity** - If unclear, ask for clarification (QUICK_QUESTION)
5. **Recognize patterns** - "@slideX", "@all", "slides X and Y", "first/last slide"

## Confidence Guidelines

- 0.95-1.0: Very clear intent with explicit keywords
- 0.80-0.94: Clear intent but may need minor inference
- 0.60-0.79: Intent requires interpretation
- Below 0.60: Ambiguous - respond with clarifying question

Begin classification!`,
        });
    }
    return _masterAgentInstance;
}

/**
 * Legacy export for backwards compatibility
 * @deprecated Use getMasterAgent() instead
 */
export const masterAgent = {
    get instance() {
        return getMasterAgent();
    }
};

/**
 * Parse user input and context into Master Agent format
 */
export function prepareInputForMasterAgent(
    userInput: string,
    context: {
        hasExistingDeck?: boolean;
        slideCount?: number;
        slideNames?: string[];
        uploadedImages?: number;
        conversationHistory?: Array<{role: string; content: string}>;
    }
): string {
    return JSON.stringify({
        user_input: userInput,
        context: {
            has_existing_deck: context.hasExistingDeck || false,
            slide_count: context.slideCount || 0,
            slide_names: context.slideNames || [],
            uploaded_images: context.uploadedImages || 0,
            conversation_history: context.conversationHistory || []
        }
    }, null, 2);
}

/**
 * Parse Master Agent response to IntentClassification
 */
export function parseMasterAgentResponse(responseText: string): IntentClassification {
    // Remove markdown code blocks if present
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
                   || responseText.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
        throw new Error(`Master Agent returned invalid JSON: ${responseText}`);
    }

    try {
        const parsed = JSON.parse(jsonMatch[1]) as IntentClassification;

        // Validate required fields
        if (!parsed.intent || !parsed.confidence || !parsed.next_agent) {
            throw new Error('Missing required fields in intent classification');
        }

        return parsed;
    } catch (error) {
        console.error('Failed to parse master agent response:', error);
        throw new Error(`Invalid intent classification format: ${responseText}`);
    }
}
