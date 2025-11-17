/**
 * Simple Reflection Demo Workflow
 *
 * Demonstrates the Reflection pattern with:
 * 1. Generate simple slide content
 * 2. Review quality with QualityReviewer
 * 3. Refine if needed
 *
 * This is a minimal example to test the reflection pattern.
 */

import { SequentialAgent, LlmAgent, Gemini } from '@google/adk';
import { createQualityReviewerAgent, createRefinementAgent } from '../agents/qualityReviewer';

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
 * Simple slide generator for testing
 */
function createSimpleSlideGenerator(topic: string) {
    return new LlmAgent({
        name: "SimpleSlideGenerator",
        model: new Gemini({
            model: "gemini-2.5-flash",
            apiKey: getApiKey()
        }),
        description: "Generates 3 simple slides for testing",
        tools: [],
        instruction: `Generate 3 simple slides about "${topic}".

Output JSON to state["slides"]:
[
    {
        "slide_number": 1,
        "title": "Introduction to ${topic}",
        "content": {
            "bullets": ["Point 1", "Point 2", "Point 3"]
        }
    },
    {
        "slide_number": 2,
        "title": "Key Aspects of ${topic}",
        "content": {
            "bullets": ["Aspect 1", "Aspect 2", "Aspect 3"]
        }
    },
    {
        "slide_number": 3,
        "title": "Conclusion",
        "content": {
            "bullets": ["Summary point 1", "Summary point 2", "Next steps"]
        }
    }
]

Keep it simple and professional.
`
    });
}

/**
 * Create the reflection demo workflow
 */
export function createReflectionDemoWorkflow(topic: string = "Artificial Intelligence") {
    const slideGenerator = createSimpleSlideGenerator(topic);
    const qualityReviewer = createQualityReviewerAgent();
    const refinementAgent = createRefinementAgent();

    return new SequentialAgent({
        name: "ReflectionDemoWorkflow",
        description: "Demonstrates reflection pattern: Generate → Review → Refine",
        sub_agents: [
            slideGenerator,      // Step 1: Generate slides
            qualityReviewer,     // Step 2: Review quality (Reflection!)
            refinementAgent      // Step 3: Refine if needed
        ]
    });
}
