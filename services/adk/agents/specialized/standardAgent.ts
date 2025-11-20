/**
 * Standard Agent
 *
 * Handles simple, standard requests like: "Create a 10-slide pitch deck about AI"
 *
 * This workflow implements the full Reflection pattern for high-quality output.
 *
 * Workflow (ADK SequentialAgent):
 * 1. Generate initial slides (SimpleSlideGenerator)
 * 2. Review quality of the generated slides (QualityReviewerAgent)
 * 3. Refine the slides if necessary (RefinementAgent)
 */

import { SequentialAgent, LlmAgent, Gemini } from '@google/genai/agents';
import { createQualityReviewerAgent, createRefinementAgent } from './qualityReviewer.js';

function getApiKey(): string | undefined {
    if (typeof process !== 'undefined' && process.env) {
        return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    }
    return undefined;
}

/**
 * Creates a simple slide generator agent.
 * This is the first step in the standard workflow.
 */
function createSimpleSlideGenerator() {
    const apiKey = getApiKey();
    return new LlmAgent({
        name: "SimpleSlideGenerator",
        model: new Gemini({ model: "gemini-pro", apiKey: apiKey || "test-key" }),
        outputKey: "slides",
        instruction: `You are a presentation creator.
        Based on the user's request in {user_input}, generate a set of slides.
        The output must be a JSON array of slide objects, each with a "title" and "content".
        
        Example Output:
        [
          { "title": "The Future of AI", "content": "Exploring the impact of Artificial Intelligence..." },
          { "title": "Key Trends", "content": "1. Generative Models\n2. Explainable AI..." }
        ]
        `,
    });
}


/**
 * Creates the Standard Agent workflow.
 */
export function createStandardAgent() {
    const slideGenerator = createSimpleSlideGenerator();
    const qualityReviewer = createQualityReviewerAgent();
    const refinementAgent = createRefinementAgent();

    return new SequentialAgent({
        name: "StandardAgent",
        description: "Handles standard requests for creating presentations with a quality-check and refinement loop.",
        subAgents: [
            slideGenerator,
            qualityReviewer,
            refinementAgent,
        ],
    });
}
