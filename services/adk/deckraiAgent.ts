/**
 * DeckRAI Agent System
 *
 * Main entry point for the ADK-based agent architecture.
 *
 * Architecture:
 * - Coordinator Agent: Analyzes requests and routes dynamically (LlmAgent with transfer)
 * - Specialized Agents: Handle specific patterns (SequentialAgent, ParallelAgent, CustomAgent)
 * - Atomic Agents: Reusable operations (LlmAgent)
 *
 * This replaces the Master Agent classification approach with ADK's native
 * coordinator pattern for flexible, context-aware request handling.
 *
 * Usage:
 * ```typescript
 * import { getDeckRAIAgent } from './services/adk/deckraiAgent';
 *
 * const agent = getDeckRAIAgent();
 * const result = await agent.runAsync(invocationContext);
 * ```
 */

import { LlmAgent } from '@google/adk';
import { getCoordinatorAgent } from './coordinator';
import {
    createTemplateArchitectureAgent,
    createMultiSourceAgent,
    createStandardAgent
} from './agents/specialized';

/**
 * Initialize all specialized agents
 */
function initializeSpecializedAgents() {
    return [
        createTemplateArchitectureAgent(),
        createMultiSourceAgent(),
        createStandardAgent(),
        // Future agents:
        // createCustomizationAgent(),
        // createMultiReferenceAgent(),
        // createDualTrackAgent(),
    ];
}

/**
 * Global DeckRAI agent instance
 */
let _deckRAIAgentInstance: LlmAgent | null = null;

/**
 * Get or create the DeckRAI Agent System
 *
 * This is the main entry point for all DeckRAI requests.
 * Returns a coordinator agent initialized with all specialized agents.
 *
 * @returns LlmAgent coordinator with full agent hierarchy
 */
export function getDeckRAIAgent(): LlmAgent {
    if (!_deckRAIAgentInstance) {
        const specializedAgents = initializeSpecializedAgents();
        _deckRAIAgentInstance = getCoordinatorAgent(specializedAgents);
    }
    return _deckRAIAgentInstance;
}

/**
 * Reset the DeckRAI agent instance (for testing)
 */
export function resetDeckRAIAgent(): void {
    _deckRAIAgentInstance = null;
}

/**
 * Export individual components for advanced usage
 */
export {
    getCoordinatorAgent,
    createTemplateArchitectureAgent,
    createMultiSourceAgent,
    createStandardAgent
};
