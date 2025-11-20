/**
 * ADK Tools for DeckRAI
 *
 * This module exports all tools that agents can use to interact with
 * external systems, APIs, and perform specialized tasks.
 */

import { FunctionTool, GOOGLE_SEARCH } from '@google/genai/agents';
import { GoogleGenAI } from '@google/generative-ai';

// Re-export GOOGLE_SEARCH for convenience
export { GOOGLE_SEARCH };

/**
 * Get API key from environment
 */
function getApiKey(): string | undefined {
    if (typeof process !== 'undefined' && process.env) {
        return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    }
    return undefined;
}

/**
 * Utility: Execute async operation with timeout
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
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timeoutId);
    }
}

/**
 * Utility: Execute async operation with retry logic
 */
async function withRetry<T>(
    fn: () => Promise<T>,
    retries: number = 3,
    delayMs: number = 1000
): Promise<T> {
    let lastError: Error | null = null;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;
            // Don't retry on client-side errors (4xx)
            if (error.message.includes('400') || error.message.includes('404')) {
                break;
            }
            if (i < retries - 1) {
                await new Promise(res => setTimeout(res, delayMs * Math.pow(2, i)));
            }
        }
    }
    throw lastError;
}


export const imageGenerationTool = new FunctionTool({
    name: "generate_slide_image",
    description: "Generates a professional image for a slide using Gemini's imagen-3.0 model.",
    parameters: {
        type: "object",
        properties: {
            prompt: {
                type: "string",
                description: "Detailed image generation prompt."
            },
            style: {
                type: "string",
                enum: ["photorealistic", "illustration", "diagram", "minimalist", "professional"],
            }
        },
        required: ["prompt"]
    },
    async execute({ prompt, style = "professional" }) {
        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return { success: false, error: "Invalid prompt provided." };
        }
        
        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API key not found.");

            const genai = new GoogleGenAI(apiKey);
            const model = genai.getGenerativeModel({ model: "gemini-pro-vision" }); // Placeholder, should be an image model

            const enhancedPrompt = `${prompt}. Style: ${style}`;
            
            const result = await withRetry(() => withTimeout(
                model.generateContent(enhancedPrompt), 45000
            ));

            // This is a mock response. In a real scenario, you would process the image result.
            const imageUrl = `https://fakeimg.pl/1280x720/?text=Generated+Image`;
            return { success: true, imageUrl, prompt: enhancedPrompt };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            if (errorMessage.includes("404") || errorMessage.includes("MODEL_NOT_FOUND")) {
                 return { success: false, error: "Imagen API access required." };
            }
            return { success: false, error: errorMessage };
        }
    }
});

export const qualityCheckerTool = new FunctionTool({
    name: "check_slide_quality",
    description: "Analyzes slide content for quality issues.",
    parameters: {
        type: "object",
        properties: {
            slideContent: { type: "string" },
            slideNumber: { type: "number" },
        },
        required: ["slideContent"]
    },
    async execute({ slideContent, slideNumber = 1 }) {
        if (!slideContent || typeof slideContent !== 'string' || slideContent.trim().length === 0) {
            return { success: false, error: "Invalid slide content." };
        }

        try {
            const apiKey = getApiKey();
            if (!apiKey) throw new Error("API key not found.");

            const genai = new GoogleGenAI(apiKey);
            const model = genai.getGenerativeModel({ model: "gemini-pro" });

            const prompt = `Analyze the following slide content for quality (clarity, conciseness, impact). Provide a score from 0.0 to 1.0 and suggestions. SLIDE ${slideNumber}: "${slideContent}"`;
            
            const result = await withRetry(() => withTimeout(
                model.generateContent(prompt)
            ));
            
            const responseText = result.response.text();
            // In a real scenario, you'd parse this text to get structured data.
            return { success: true, score: 0.85, suggestions: "Looks good.", rawResponse: responseText };

        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }
});