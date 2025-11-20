/**
 * Quality Reviewer Agent & Refinement Agent
 *
 * Implements Andrew Ng's "Reflection" agentic pattern by reviewing
 * generated slides and then refining them based on the feedback.
 */

import { LlmAgent, Gemini } from '@google/genai/agents';
import { qualityCheckerTool } from '../tools/index.js';

function getApiKey(): string | undefined {
    if (typeof process !== 'undefined' && process.env) {
        return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    }
    return undefined;
}

/**
 * Creates a Quality Reviewer Agent.
 * This agent reviews slides using the qualityCheckerTool and provides a structured report.
 */
export function createQualityReviewerAgent() {
    const apiKey = getApiKey();
    return new LlmAgent({
        name: "QualityReviewerAgent",
        model: new Gemini({ model: "gemini-pro", apiKey: apiKey || "test-key" }),
        tools: [qualityCheckerTool],
        outputKey: "quality_report",
        instruction: `You are a presentation quality expert.
        Your task is to review a set of generated slides and provide a quality report.
        The slides are available in the session state via the {slides} placeholder.
        For each slide, use the check_slide_quality tool.
        Synthesize the results into a final JSON report with an overall score, a list of critical issues, and a boolean 'requires_refinement' flag.
        The flag should be true if the overall score is below 0.8.
        
        Example Input (from state):
        {
          "slides": [
            { "title": "Introduction", "content": "..." },
            { "title": "Market Size", "content": "..." }
          ]
        }

        Example Output (to be saved in state["quality_report"]):
        {
          "overall_score": 0.78,
          "slide_scores": { "slide_1": 0.9, "slide_2": 0.65 },
          "critical_issues": ["Slide 2 lacks a clear data source."],
          "suggestions": ["Add a source citation to the market size chart on Slide 2."],
          "requires_refinement": true
        }
        `,
    });
}

/**
 * Creates a Refinement Agent.
 * This agent takes a quality report and refines the slides to address the issues.
 */
export function createRefinementAgent() {
    const apiKey = getApiKey();
    return new LlmAgent({
        name: "RefinementAgent",
        model: new Gemini({ model: "gemini-pro", apiKey: apiKey || "test-key" }),
        outputKey: "slides", // Overwrites the original slides with the refined version
        instruction: `You are a slide refinement expert.
        Your task is to improve a set of slides based on a quality report.
        The original slides are in {slides} and the quality report is in {quality_report}.
        Address all the 'critical_issues' and 'suggestions' from the report.
        Output the full, refined set of slides in the exact same JSON format as the input.
        Do not change the number of slides.
        `,
    });
}
