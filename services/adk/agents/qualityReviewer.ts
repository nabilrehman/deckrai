/**
 * Quality Reviewer Agent
 *
 * Implements Andrew Ng's "Reflection" agentic pattern by reviewing
 * generated slides and providing quality feedback.
 *
 * This agent:
 * - Checks slide quality using the qualityCheckerTool
 * - Identifies issues (readability, clarity, accuracy, flow, grammar)
 * - Provides actionable suggestions for improvement
 * - Determines if slides need refinement
 */

import { LlmAgent, Gemini } from '@google/adk';
import { qualityCheckerTool } from '../tools';

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
 * Quality Reviewer Agent
 *
 * Reviews all generated slides and provides quality assessment
 */
export function createQualityReviewerAgent() {
    return new LlmAgent({
        name: "QualityReviewerAgent",
        model: new Gemini({
            model: "gemini-2.5-pro", // Use Pro for thorough quality analysis
            apiKey: getApiKey()
        }),
        description: "Reviews generated slides for quality issues and suggests improvements (Reflection Pattern)",
        tools: [qualityCheckerTool],
        instruction: `You are a presentation quality expert implementing the Reflection pattern.

## Your Role
Review ALL generated slides for quality and provide detailed feedback.

## Your Tools
- check_slide_quality: Analyzes slide content for quality issues

## Process

1. **Read Generated Slides** from state["slides"]
   - This is an array of slides from the generation step

2. **Review Each Slide** using check_slide_quality tool
   - Check all criteria: readability, clarity, accuracy, flow, grammar
   - Note issues and strengths

3. **Analyze Overall Quality**
   - Check transitions between slides
   - Verify consistent terminology
   - Ensure narrative flow
   - Check for duplication

4. **Output Quality Report** to state["quality_report"]

Required JSON format:
{
    "overall_score": <average of all slide scores>,
    "slide_scores": [0.85, 0.92, 0.78, ...],
    "critical_issues": [
        {
            "slide": 2,
            "issue": "Vague bullet points lack specific details",
            "severity": "high",
            "suggestion": "Add concrete examples or statistics"
        }
    ],
    "suggestions": [
        {
            "slide": 1,
            "improvement": "Add transition sentence to slide 2"
        }
    ],
    "strengths": [
        "Clear logical flow from intro to conclusion",
        "Consistent professional tone throughout"
    ],
    "requires_refinement": <true if overall_score < 0.8>,
    "slides_to_refine": [2, 5, 7]  // Slides with score < 0.75
}

## Quality Scoring Guide
- 0.9-1.0: Excellent, publication-ready
- 0.8-0.89: Good, minor improvements
- 0.7-0.79: Acceptable, several improvements needed
- Below 0.7: Needs significant revision

## Important
- Be thorough but constructive
- Focus on actionable feedback
- Identify both strengths and weaknesses
- Consider the full presentation narrative, not just individual slides

Your review helps ensure high-quality presentations!
`
    });
}

/**
 * Refinement Agent
 *
 * Takes quality feedback and improves slides
 */
export function createRefinementAgent() {
    return new LlmAgent({
        name: "RefinementAgent",
        model: new Gemini({
            model: "gemini-2.5-pro",
            apiKey: getApiKey()
        }),
        description: "Refines slides based on quality review feedback",
        tools: [],
        instruction: `You refine slides based on quality review feedback.

## Your Role
Improve slides that scored below 0.75 in quality review.

## Input from State
- state["slides"]: Original slides
- state["quality_report"]: Quality feedback with issues and suggestions
- state["quality_report"]["slides_to_refine"]: Which slides need work

## Process

1. Read quality_report to understand issues

2. For each slide in slides_to_refine:
   a) Read original slide content
   b) Read specific issues for that slide
   c) Apply improvements while maintaining:
      - Original intent and key messages
      - Consistent style and tone
      - Appropriate detail level
   d) Enhance based on suggestions

3. Output refined slides to state["refined_slides"]

## Refinement Guidelines
- **Clarity**: Make vague points specific
- **Readability**: Simplify complex sentences
- **Flow**: Add transitions between ideas
- **Grammar**: Fix any errors
- **Accuracy**: Verify facts remain correct

## Output Format
Write updated slides to state["refined_slides"] with same structure:
[
    {
        "slide_number": 1,
        "title": "...",
        "content": {...},
        "refinement_notes": "What was improved"
    }
]

Only refine slides that need it - don't change good ones!
`
    });
}
