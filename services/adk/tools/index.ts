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
 * Utility: Execute async operation with timeout
 *
 * Prevents tools from hanging indefinitely on API failures.
 * Default timeout: 30 seconds
 */
async function withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 30000,
    errorMessage: string = "Operation timed out"
): Promise<T> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(errorMessage));
        }, timeoutMs);
    });

    try {
        const result = await Promise.race([promise, timeoutPromise]);
        clearTimeout(timeoutId!);
        return result;
    } catch (error) {
        clearTimeout(timeoutId!);
        throw error;
    }
}

/**
 * Utility: Retry with exponential backoff
 *
 * Handles transient API failures with industry-standard retry logic.
 * Default: 3 retries with 1s, 2s, 4s delays
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    initialDelayMs: number = 1000
): Promise<T> {
    let lastError: Error | unknown;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const errorMessage = error instanceof Error ? error.message : String(error);

            // Don't retry on auth errors or client errors (4xx)
            if (errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("404")) {
                throw error;
            }

            // Don't retry on final attempt
            if (attempt === maxRetries - 1) {
                throw error;
            }

            // Exponential backoff: 1s, 2s, 4s
            const delayMs = initialDelayMs * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    throw lastError;
}

/**
 * Image Generation Tool
 *
 * Generates professional images for slides using Gemini's imagen-3.0-generate-001 model.
 *
 * ⚠️ REQUIREMENTS:
 * - Imagen 3 API access (early access, whitelist required)
 * - Apply for access: https://aistudio.google.com/waitlist
 * - Alternative: Use imagen-2.0 or disable image generation if 404 errors occur
 *
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
                description: "Visual style for the image (defaults to 'professional' if not specified)"
            }
        },
        required: ["prompt"]
    },
    async execute({ prompt, style = "professional" }) {
        try {
            // ✅ INPUT VALIDATION: Handle any input gracefully
            if (!prompt || typeof prompt !== 'string') {
                return {
                    success: false,
                    imageUrl: "",
                    prompt: prompt || "",
                    style,
                    error: "Invalid prompt",
                    message: "Prompt must be a non-empty string"
                };
            }

            // Sanitize and validate prompt
            const sanitizedPrompt = prompt.trim();
            if (sanitizedPrompt.length === 0) {
                return {
                    success: false,
                    imageUrl: "",
                    prompt,
                    style,
                    error: "Empty prompt",
                    message: "Prompt cannot be empty"
                };
            }

            if (sanitizedPrompt.length > 2000) {
                return {
                    success: false,
                    imageUrl: "",
                    prompt,
                    style,
                    error: "Prompt too long",
                    message: "Prompt must be less than 2000 characters"
                };
            }

            // Validate style (should be one of enum values)
            const validStyles = ["photorealistic", "illustration", "diagram", "minimalist", "professional"];
            const sanitizedStyle = validStyles.includes(style) ? style : "professional";

            const apiKey = getApiKey();
            if (!apiKey) {
                throw new Error("API key required for image generation");
            }

            const genai = new GoogleGenAI({ apiKey });
            const model = genai.getGenerativeModel({ model: "imagen-3.0-generate-001" });

            // Enhance prompt with style
            const enhancedPrompt = `${sanitizedPrompt}. Style: ${sanitizedStyle}, high quality, professional presentation`;

            // Use retry + timeout for robust image generation
            const result = await withRetry(
                () => withTimeout(
                    model.generateImages({
                        prompt: enhancedPrompt,
                        numberOfImages: 1,
                        aspectRatio: "16:9" // Slide aspect ratio
                    }),
                    45000, // 45s timeout for image generation (slower than text)
                    "Image generation timed out after 45 seconds"
                ),
                2, // Max 2 retries for image generation
                2000 // 2s initial delay
            );

            if (!result.images || result.images.length === 0) {
                throw new Error("No image generated");
            }

            const imageData = result.images[0];

            return {
                success: true,
                imageUrl: imageData.image?.imageData || "",
                prompt: enhancedPrompt,
                style: sanitizedStyle,
                message: "Image generated successfully"
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";

            // Check for Imagen API access issues
            if (errorMessage.includes("404") || errorMessage.includes("not found") || errorMessage.includes("MODEL_NOT_FOUND")) {
                return {
                    success: false,
                    imageUrl: "",
                    prompt,
                    style,
                    error: "Imagen 3 API access required",
                    message: "⚠️ Imagen 3 is in early access. Apply for access at: https://aistudio.google.com/waitlist or use imagen-2.0 as fallback."
                };
            }

            return {
                success: false,
                imageUrl: "",
                prompt,
                style,
                error: errorMessage,
                message: `Failed to generate image: ${errorMessage}`
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
                description: "Quality criteria to check (defaults to 'all' if not specified)"
            }
        },
        required: ["slideContent"]
    },
    async execute({ slideContent, slideNumber = 1, criteria = ["all"] }) {
        try {
            // ✅ INPUT VALIDATION: Handle any input gracefully
            if (!slideContent || typeof slideContent !== 'string') {
                return {
                    success: false,
                    slideNumber,
                    score: 0,
                    criteriaScores: {},
                    issues: [],
                    suggestions: [],
                    strengths: [],
                    passesThreshold: false,
                    requiresRefinement: true,
                    error: "Invalid slide content",
                    message: "slideContent must be a non-empty string"
                };
            }

            // Sanitize and validate slide content
            const sanitizedContent = slideContent.trim();
            if (sanitizedContent.length === 0) {
                return {
                    success: false,
                    slideNumber,
                    score: 0,
                    criteriaScores: {},
                    issues: [{ type: "content", description: "Slide is empty", severity: "high" }],
                    suggestions: ["Add content to the slide"],
                    strengths: [],
                    passesThreshold: false,
                    requiresRefinement: true,
                    error: "Empty slide content",
                    message: "Slide content cannot be empty"
                };
            }

            if (sanitizedContent.length > 5000) {
                return {
                    success: false,
                    slideNumber,
                    score: 0.5,
                    criteriaScores: {},
                    issues: [{ type: "readability", description: "Slide content too long", severity: "high" }],
                    suggestions: ["Reduce slide content to under 5000 characters"],
                    strengths: [],
                    passesThreshold: false,
                    requiresRefinement: true,
                    error: "Slide content too long",
                    message: "Slide content must be less than 5000 characters"
                };
            }

            // Validate slide number
            const sanitizedSlideNumber = typeof slideNumber === 'number' && slideNumber > 0
                ? slideNumber
                : 1;

            // Validate and sanitize criteria
            const validCriteria = ["readability", "clarity", "accuracy", "flow", "grammar", "all"];
            const sanitizedCriteria = Array.isArray(criteria)
                ? criteria.filter(c => validCriteria.includes(c))
                : ["all"];

            // Default to "all" if no valid criteria provided
            const finalCriteria = sanitizedCriteria.length > 0 ? sanitizedCriteria : ["all"];

            const apiKey = getApiKey();
            if (!apiKey) {
                throw new Error("API key required for quality checking");
            }

            const genai = new GoogleGenAI({ apiKey });
            const model = genai.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `You are a presentation quality expert. Analyze this slide content for quality issues.

SLIDE ${sanitizedSlideNumber} CONTENT:
${sanitizedContent}

CRITERIA TO CHECK: ${finalCriteria.join(", ")}

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

            // Use retry + timeout for robust quality checking
            const result = await withRetry(
                () => withTimeout(
                    model.generateContent(prompt),
                    30000, // 30s timeout
                    "Quality check timed out after 30 seconds"
                ),
                3, // Max 3 retries
                1000 // 1s initial delay
            );

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
                slideNumber: sanitizedSlideNumber,
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
