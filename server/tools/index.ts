/**
 * Deckr ADK Tools
 * 10 atomic tools for slide generation and editing
 *
 * Architecture:
 * - Each tool wraps existing services (lift & shift)
 * - Single-purpose, well-documented, type-safe
 * - ADK-compliant schemas for LLM understanding
 *
 * Tool Organization:
 * 1. Vision & Analysis (Phase 2) ✅
 * 2. Slide Generation & Editing (Phase 3)
 * 3. Research & Brand (Phase 4)
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
// Phase 4: Research & Brand Tools ✅ COMPLETE
// ============================================================================

import { researchCompanyTool } from './researchCompany';
import { analyzeBrandTool } from './analyzeBrand';
// import { fetchCompanyLogoTool } from './fetchLogo'; // ⏸️ DISABLED: Incomplete implementation

export { researchCompanyTool, analyzeBrandTool };

// ============================================================================
// Phase 5: Reference Matching Tools ✅ COMPLETE
// ============================================================================

import { matchSlidesToReferencesTool } from './matchReferences';

export { matchSlidesToReferencesTool };

// ============================================================================
// Phase 6: Planning Tools ✅ COMPLETE
// ============================================================================

import { planDeckTool } from './planDeck';

export { planDeckTool };

// ============================================================================
// Tool Registry for ADK Agent
// ============================================================================

/**
 * Complete list of all available tools
 */
export const allTools = [
  // Planning
  planDeckTool,

  // Analysis
  analyzeSlideTool,
  analyzeDeckTool,

  // Slide Generation & Editing
  createSlideTool,
  minorEditSlideTool,
  redesignSlideTool,

  // Research & Brand
  researchCompanyTool,
  analyzeBrandTool,
  // fetchCompanyLogoTool, // ⏸️ DISABLED: Incomplete implementation

  // Reference Matching
  matchSlidesToReferencesTool,
] as const;

/**
 * Tool categories for organized access
 */
export const toolCategories = {
  planning: [planDeckTool],
  analysis: [analyzeSlideTool, analyzeDeckTool],
  slideEditing: [createSlideTool, minorEditSlideTool, redesignSlideTool],
  research: [researchCompanyTool, analyzeBrandTool], // fetchCompanyLogoTool disabled
  referenceMatching: [matchSlidesToReferencesTool],
} as const;

/**
 * Get tool by name
 */
export function getToolByName(name: string) {
  return allTools.find(tool => tool.name === name);
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: keyof typeof toolCategories) {
  return toolCategories[category];
}
