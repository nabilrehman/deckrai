/**
 * Specialized Agents Index
 *
 * Exports all specialized workflow agents used by the coordinator.
 *
 * Each agent handles a specific request pattern using ADK native features:
 * - TemplateArchitectureAgent: Architecture slides from templates
 * - MultiSourceAgent: Decks from multiple sources (with ParallelAgent)
 * - StandardAgent: Simple create/edit requests
 *
 * Future agents to add:
 * - CustomizationAgent: Customer-specific deck customization
 * - MultiReferenceAgent: Creating from multiple reference decks
 * - DualTrackAgent: Content + style from different sources
 */

export { createTemplateArchitectureAgent } from './templateArchitectureAgent';
export { createMultiSourceAgent } from './multiSourceAgent';
export { createStandardAgent } from './standardAgent';

// Re-export for convenience
export * from './templateArchitectureAgent';
export * from './multiSourceAgent';
export * from './standardAgent';
