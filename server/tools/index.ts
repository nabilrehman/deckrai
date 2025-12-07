/**
 * Deckr ADK Tools
 * Atomic tools for slide generation and editing
 *
 * Architecture:
 * - Each tool wraps existing services (lift & shift)
 * - Single-purpose, well-documented, type-safe
 * - ADK-compliant schemas for LLM understanding
 *
 * Tool Organization:
 * 1. Vision & Analysis (Phase 2) ✅
 * 2. Slide Generation & Editing (Phase 3) ✅
 * 3. Research & Brand (Phase 4) - In Progress
 * 4. Infrastructure (Phase 5)
 */

// ============================================================================
// Phase 2: Vision & Analysis Tools ✅ COMPLETE
// ============================================================================

import { analyzeSlideTool } from './analyzeSlide';
import { analyzeDeckTool } from './analyzeDeck';

export { analyzeSlideTool, analyzeDeckTool };

// ============================================================================
// Phase 3: Slide Generation & Editing Tools ✅ COMPLETE
// ============================================================================

import { createSlideTool } from './createSlide';
import { minorEditSlideTool } from './minorEditSlide';
import { redesignSlideTool } from './redesignSlide';

export { createSlideTool, minorEditSlideTool, redesignSlideTool };

// ============================================================================
// Phase 4: Research & Brand Tools
// ============================================================================

import { fetchCompanyLogoTool } from './fetchCompanyLogo';

export { fetchCompanyLogoTool };

// TODO: researchCompanyTool - Google Search + Gemini synthesis
// TODO: analyzeBrandTool - wraps generateThemeFromWebsite
// TODO: extractPainPointsTool - NLP extraction from notes

export const researchCompanyTool = null;
export const analyzeBrandTool = null;
export const extractPainPointsTool = null;

// ============================================================================
// Phase 5: Infrastructure Tools (TODO)
// ============================================================================

// TODO: uploadFileTool - PDF extraction, Firebase Storage upload

export const uploadFileTool = null;

// ============================================================================
// All Tools Array (for ADK agent)
// ============================================================================

export const allTools = [
  // Vision & Analysis
  analyzeSlideTool,
  analyzeDeckTool,
  // Slide Generation & Editing
  createSlideTool,
  minorEditSlideTool,
  redesignSlideTool,
  // Research & Brand
  fetchCompanyLogoTool,
  // Note: researchCompanyTool, analyzeBrandTool, extractPainPointsTool are TODO
  // Note: uploadFileTool is TODO
].filter(Boolean); // Filter out any null tools

/**
 * Tool Implementation Guidelines:
 *
 * 1. Each tool should use ADK's tool creation pattern
 * 2. Clear name and description for LLM understanding
 * 3. Well-defined parameter schemas
 * 4. Wrap existing service functions (preserve all logic)
 * 5. Return structured outputs
 * 6. Handle errors gracefully
 *
 * Example structure:
 *
 * export const exampleTool = createTool({
 *   name: 'exampleTool',
 *   description: 'Clear description of what this tool does',
 *   parameters: {
 *     type: 'object',
 *     properties: {
 *       param1: { type: 'string', description: '...' }
 *     },
 *     required: ['param1']
 *   },
 *   execute: async (params) => {
 *     // Wrap existing service function
 *     const result = await existingServiceFunction(params);
 *     return result;
 *   }
 * });
 */
