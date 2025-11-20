/**
 * Multi-Source Agent
 *
 * Handles requests that require processing multiple sources of information in parallel,
 * such as: "Create a deck from my meeting notes, a PDF, and a website."
 *
 * This workflow is a prime example of ADK's native capabilities, using a
 * ParallelAgent to process inputs concurrently, followed by a SequentialAgent
 * to synthesize the results and generate the final deck.
 *
 * Workflow (ADK native):
 * 1. Parallel Processing (ParallelAgent):
 *    - Parse Meeting Notes (LlmAgent)
 *    - Parse PDF Content (LlmAgent with a document loading tool)
 *    - Scrape Website (LlmAgent with GOOGLE_SEARCH tool)
 * 2. Synthesize & Generate (SequentialAgent):
 *    - Synthesize all parsed content into a coherent narrative.
 *    - Generate the final slide deck from the synthesized content.
 *    - Perform a quality check.
 */

import { SequentialAgent, ParallelAgent, LlmAgent, Gemini } from '@google/genai/agents';
import { createQualityReviewerAgent } from './qualityReviewer.js';
import { GOOGLE_SEARCH } from '../../tools/index.js';

function getApiKey(): string | undefined {
    if (typeof process !== 'undefined' && process.env) {
        return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    }
    return undefined;
}

/**
 * Creates the Multi-Source Agent workflow.
 */
export function createMultiSourceAgent() {
    const apiKey = getApiKey();

    // Define the agents that will run in parallel
    const noteParser = new LlmAgent({
        name: "NoteParser",
        model: new Gemini({ model: "gemini-pro", apiKey: apiKey || "test-key" }),
        outputKey: "parsed_notes",
        instruction: "You are an expert at summarizing meeting notes. Extract the key topics, decisions, and action items from the notes provided in {meeting_notes}.",
    });

    const pdfParser = new LlmAgent({
        name: "PdfParser",
        model: new Gemini({ model: "gemini-pro", apiKey: apiKey || "test-key" }),
        outputKey: "parsed_pdf",
        // In a real implementation, this would use a document loading tool.
        instruction: "You are an expert at analyzing documents. Summarize the key findings from the document content provided in {pdf_content}.",
    });

    const webScraper = new LlmAgent({
        name: "WebScraper",
        model: new Gemini({ model: "gemini-pro", apiKey: apiKey || "test-key" }),
        tools: [GOOGLE_SEARCH],
        outputKey: "scraped_web_content",
        instruction: "You are a web research analyst. Use the google_search tool to find and summarize information from the website URL provided in {website_url}.",
    });

    // Create the ParallelAgent to run the parsers concurrently
    const parallelProcessor = new ParallelAgent({
        name: "ParallelSourceProcessor",
        subAgents: [noteParser, pdfParser, webScraper],
    });

    // Define the agents that will run sequentially after parallel processing
    const synthesizer = new LlmAgent({
        name: "ContentSynthesizer",
        model: new Gemini({ model: "gemini-pro", apiKey: apiKey || "test-key" }),
        outputKey: "synthesized_content",
        instruction: `You are a content strategist.
        You have been given summaries from three sources:
        1. Meeting Notes: {parsed_notes}
        2. PDF Document: {parsed_pdf}
        3. Website Content: {scraped_web_content}

        Synthesize these into a single, coherent narrative or outline for a presentation.
        `,
    });

    const deckGenerator = new LlmAgent({
        name: "MultiSourceDeckGenerator",
        model: new Gemini({ model: "gemini-pro", apiKey: apiKey || "test-key" }),
        outputKey: "slides",
        instruction: "Based on the {synthesized_content}, create a full presentation deck. The output must be a JSON array of slide objects.",
    });

    const qualityReviewer = createQualityReviewerAgent();

    // Combine the parallel and sequential agents into a final workflow
    return new SequentialAgent({
        name: "MultiSourceAgent",
        description: "Creates a presentation from multiple sources (notes, PDFs, websites) by processing them in parallel.",
        subAgents: [
            parallelProcessor,
            synthesizer,
            deckGenerator,
            qualityReviewer,
        ],
    });
}
