/**
 * Specialized Agents Index
 *
 * This file serves as a central export point for all specialized workflow agents.
 * This makes it easy for the main coordinator agent to discover and use them.
 */

export { createStandardAgent } from './standardAgent.js';
export { createTemplateArchitectureAgent } from './templateArchitectureAgent.js';
export { createMultiSourceAgent } from './multiSourceAgent.js';
