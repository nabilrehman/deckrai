/**
 * ADK Tools for DeckRAI
 *
 * This module exports all tools that agents can use to interact with
 * external systems, APIs, and perform specialized tasks.
 */

import { FunctionTool, GOOGLE_SEARCH } from '@google/adk';
import { GoogleGenAI } from '@google/genai';

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
 * Image Generation Tool
 *
 * Generates professional images for slides using Gemini's imagen-3.0-generate-001 model.
 * This wraps the existing generateSingleImage functionality as an ADK tool.
 */
export const imageGenerationTool = new FunctionTool({
    name: "generate_slide_image",
    description: "Generates a professional image for a slide using Gemini imagen-3.0. Use this when a slide needs visual support like diagrams, illustrations, or conceptual imagery.",
    parameters: {
        type: "object",
        properties: {
            prompt: {
                type: "string",
                description: "Detailed image generation prompt describing the desired image. Be specific about style, content, and mood."
            },
            style: {
                type: "string",
                enum: ["photorealistic", "illustration", "diagram", "minimalist", "professional"],
                description: "Visual style for the image. Default: professional",
                default: "professional"
            }
        },
        required: ["prompt"]
    },
    async execute({ prompt, style = "professional" }) {
        try {
            const apiKey = getApiKey();
            if (!apiKey) {
                throw new Error("API key required for image generation");
            }

            const genai = new GoogleGenAI({ apiKey });
            const model = genai.getGenerativeModel({ model: "imagen-3.0-generate-001" });

            // Enhance prompt with style
            const enhancedPrompt = `${prompt}. Style: ${style}, high quality, professional presentation`;

            const result = await model.generateImages({
                prompt: enhancedPrompt,
                numberOfImages: 1,
                aspectRatio: "16:9" // Slide aspect ratio
            });

            if (!result.images || result.images.length === 0) {
                throw new Error("No image generated");
            }

            const imageData = result.images[0];

            return {
                success: true,
                imageUrl: imageData.image?.imageData || "",
                prompt: enhancedPrompt,
                style,
                message: "Image generated successfully"
            };
        } catch (error) {
            return {
                success: false,
                imageUrl: "",
                prompt,
                style,
                error: error instanceof Error ? error.message : "Unknown error",
                message: `Failed to generate image: ${error instanceof Error ? error.message : "Unknown error"}`
            };
        }
    }
});

/**
 * Quality Checker Tool
 *
 * Analyzes slide content for quality issues including readability, clarity,
 * accuracy, flow, and grammar. Returns a quality score and actionable suggestions.
 */
export const qualityCheckerTool = new FunctionTool({
    name: "check_slide_quality",
    description: "Analyzes slide content for quality issues (readability, clarity, accuracy, flow, grammar). Returns a score from 0-1 and detailed feedback.",
    parameters: {
        type: "object",
        properties: {
            slideContent: {
                type: "string",
                description: "The slide content to analyze (title and body text)"
            },
            slideNumber: {
                type: "number",
                description: "The slide number (for context in multi-slide analysis)"
            },
            criteria: {
                type: "array",
                items: {
                    type: "string",
                    enum: ["readability", "clarity", "accuracy", "flow", "grammar", "all"]
                },
                description: "Quality criteria to check. Default: all",
                default: ["all"]
            }
        },
        required: ["slideContent"]
    },
    async execute({ slideContent, slideNumber = 1, criteria = ["all"] }) {
        try {
            const apiKey = getApiKey();
            if (!apiKey) {
                throw new Error("API key required for quality checking");
            }

            const genai = new GoogleGenAI({ apiKey });
            const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `You are a presentation quality expert. Analyze this slide content for quality issues.

SLIDE ${slideNumber} CONTENT:
${slideContent}

CRITERIA TO CHECK: ${criteria.join(", ")}

Analyze and provide a JSON response (ONLY JSON, no markdown):
{
    "overall_score": <number 0.0-1.0>,
    "criteria_scores": {
        "readability": <number 0.0-1.0>,
        "clarity": <number 0.0-1.0>,
        "accuracy": <number 0.0-1.0>,
        "flow": <number 0.0-1.0>,
        "grammar": <number 0.0-1.0>
    },
    "issues": [
        {"type": "readability|clarity|accuracy|flow|grammar", "description": "...", "severity": "high|medium|low"}
    ],
    "suggestions": ["Specific actionable improvement 1", "Specific actionable improvement 2"],
    "strengths": ["What works well 1", "What works well 2"]
}

Scoring guide:
- 0.9-1.0: Excellent, publication-ready
- 0.8-0.89: Good, minor improvements needed
- 0.7-0.79: Acceptable, several improvements needed
- Below 0.7: Needs significant revision`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            // Parse JSON response (handle markdown code blocks)
            const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
                || responseText.match(/(\{[\s\S]*\})/);

            if (!jsonMatch) {
                throw new Error("Invalid response format from quality checker");
            }

            const analysis = JSON.parse(jsonMatch[1]);

            return {
                success: true,
                slideNumber,
                score: analysis.overall_score,
                criteriaScores: analysis.criteria_scores,
                issues: analysis.issues || [],
                suggestions: analysis.suggestions || [],
                strengths: analysis.strengths || [],
                passesThreshold: analysis.overall_score >= 0.75,
                requiresRefinement: analysis.overall_score < 0.8,
                message: analysis.overall_score >= 0.8
                    ? "Slide quality is good"
                    : "Slide needs improvement"
            };
        } catch (error) {
            return {
                success: false,
                slideNumber,
                score: 0.5,
                criteriaScores: {},
                issues: [],
                suggestions: [],
                strengths: [],
                passesThreshold: false,
                requiresRefinement: true,
                error: error instanceof Error ? error.message : "Unknown error",
                message: `Failed to check quality: ${error instanceof Error ? error.message : "Unknown error"}`
            };
        }
    }
});

/**
 * Export all available tools
 */
export const DeckRAITools = {
    // Built-in ADK tools
    builtIn: {
        GOOGLE_SEARCH
    },

    // Custom tools
    custom: {
        imageGenerationTool,
        qualityCheckerTool
    }
};

// Export individual tools for convenience
export { GOOGLE_SEARCH };
