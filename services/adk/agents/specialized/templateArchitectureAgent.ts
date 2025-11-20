/**
 * Template Architecture Agent
 *
 * Handles requests like: "Create an architecture slide for microservices based on my template"
 *
 * This workflow demonstrates a more complex, multi-step process that involves
 * understanding content, loading a template, and merging them.
 *
 * Workflow (ADK SequentialAgent):
 * 1. Load Template: An agent to load and understand the design rules of a template.
 * 2. Generate Content: An agent to generate the core content for the architecture slide.
 * 3. Merge Content and Template: An agent that applies the template's style to the generated content.
 * 4. Quality Check: The standard quality reviewer to ensure the final slide is excellent.
 */

import { SequentialAgent, LlmAgent, Gemini } from '@google/genai/agents';
import { createQualityReviewerAgent } from './qualityReviewer.js';

function getApiKey(): string | undefined {
    if (typeof process !== 'undefined' && process.env) {
        return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    }
    return undefined;
}

/**
 * Creates the Template Architecture Agent workflow.
 */
export function createTemplateArchitectureAgent() {
    const apiKey = getApiKey();

    const templateLoader = new LlmAgent({
        name: "TemplateLoader",
        model: new Gemini({ model: "gemini-pro", apiKey: apiKey || "test-key" }),
        outputKey: "template_style",
        instruction: `You are a design expert. The user has provided a template in {template_reference}.
        Analyze its design rules (colors, fonts, layout, component styles).
        Output a JSON object describing the style guide.
        
        Example Output:
        {
          "backgroundColor": "#0A0A0A",
          "titleFont": { "family": "Inter", "size": "48px", "weight": "bold" },
          "bodyFont": { "family": "Inter", "size": "18px" },
          "palette": ["#7F56D9", "#FFFFFF", "#9E77ED"]
        }
        `,
    });

    const contentGenerator = new LlmAgent({
        name: "ArchitectureContentGenerator",
        model: new Gemini({ model: "gemini-pro", apiKey: apiKey || "test-key" }),
        outputKey: "slide_content",
        instruction: `You are a technical architect. Based on the user's request in {user_input},
        generate the content for an architecture diagram.
        Describe the components, connectors, and data flow.
        Output this as a structured JSON object.
        `,
    });

    const merger = new LlmAgent({
        name: "ContentTemplateMerger",
        model: new Gemini({ model: "gemini-pro", apiKey: apiKey || "test-key" }),
        outputKey: "slides", // This produces the final slide array
        instruction: `You are a presentation designer.
        You have been given a style guide in {template_style} and slide content in {slide_content}.
        Combine them to create a single, well-designed slide.
        The output must be a JSON array containing one slide object.
        `,
    });

    const qualityReviewer = createQualityReviewerAgent();

    return new SequentialAgent({
        name: "TemplateArchitectureAgent",
        description: "Generates a styled architecture slide based on a user-provided template.",
        subAgents: [
            templateLoader,
            contentGenerator,
            merger,
            qualityReviewer,
        ],
    });
}
