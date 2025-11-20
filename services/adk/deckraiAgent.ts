/**
 * DeckRAI Agent System - Main Entry Point
 *
 * This file initializes and exports the main DeckRAI agent, which is built
 * using the ADK's native coordinator pattern.
 *
 * The exported `getDeckRAIAgent` function returns a single, unified agent
 * that encapsulates the entire agentic system. The backend server will call
 * this function to get the agent and run it.
 */

import { LlmAgent } from '@google/genai/agents';
import { getCoordinatorAgent } from './coordinator.js';
import {
    createStandardAgent,
    createTemplateArchitectureAgent,
    createMultiSourceAgent,
} from './agents/specialized/index.js';

let deckRAIAgent: LlmAgent | null = null;

/**
 * Initializes and returns the main DeckRAI agent.
 * Uses a singleton pattern to avoid re-creating the agent on every request.
 *
 * @returns The main DeckRAI coordinator agent, configured with all its specialized sub-agents.
 */
export function getDeckRAIAgent(): LlmAgent {
    if (deckRAIAgent) {
        return deckRAIAgent;
    }

    const coordinator = getCoordinatorAgent();

    // In a real ADK runtime, you would register these agents with the
    // environment so the coordinator can transfer to them by name.
    // For this implementation, the coordinator's instruction prompt
    // is the key part that defines the logic. The actual transfer
    // would be handled by the runtime based on the coordinator's output.
    const standardAgent = createStandardAgent();
    const templateArchitectureAgent = createTemplateArchitectureAgent();
    const multiSourceAgent = createMultiSourceAgent();

    // The "root" agent for the system is the coordinator.
    deckRAIAgent = coordinator;

    // We can log the available agents for debugging purposes.
    console.log('✅ DeckRAI ADK Agent Initialized with Specialists:', [
        standardAgent.name,
        templateArchitectureAgent.name,
        multiSourceAgent.name,
        // Add other agent names here as they are created
    ]);

    return deckRAIAgent;
}

/**
 * Resets the singleton instance. Useful for testing.
 */
export function resetDeckRAIAgent() {
    deckRAIAgent = null;
}
