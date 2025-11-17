/**
 * Improved Reflection Demo Workflow
 *
 * IMPROVEMENTS BASED ON RESEARCH:
 * - Uses {placeholder} syntax to inject state into instructions
 * - Uses output_key to automatically save agent outputs
 * - Explicit state flow between agents
 * - Follows Google ADK best practices
 *
 * State Flow:
 * 1. SlideGenerator writes to state via output_key='slides'
 * 2. QualityReviewer reads {slides}, writes via output_key='quality_report'
 * 3. RefinementAgent reads {quality_report}, writes via output_key='refined_slides'
 */

import { SequentialAgent, LlmAgent, Gemini } from '@google/adk';
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
 * IMPROVED: Slide Generator with output_key
 */
function createImprovedSlideGenerator(topic: string) {
    return new LlmAgent({
        name: "ImprovedSlideGenerator",
        model: new Gemini({
            model: "gemini-2.5-flash",
            apiKey: getApiKey()
        }),
        description: "Generates 3 slides and saves to state['slides']",
        output_key: "slides",  // ✅ AUTO-SAVE: Output goes to state["slides"]
        instruction: `Generate 3 professional slides about "${topic}".

Output a JSON array with this structure:
[
    {
        "slide_number": 1,
        "title": "Introduction to ${topic}",
        "content": {
            "bullets": ["Point 1 with details", "Point 2 with examples", "Point 3 with insights"]
        }
    },
    {
        "slide_number": 2,
        "title": "Key Aspects of ${topic}",
        "content": {
            "bullets": ["Aspect 1 explained", "Aspect 2 with context", "Aspect 3 with implications"]
        }
    },
    {
        "slide_number": 3,
        "title": "Conclusion and Next Steps",
        "content": {
            "bullets": ["Summary of key points", "Actionable takeaways", "Future considerations"]
        }
    }
]

IMPORTANT:
- Make bullet points specific and detailed (not vague)
- Include concrete examples where relevant
- Maintain professional tone throughout
- Ensure logical flow between slides

Output ONLY the JSON array, no other text.
`
    });
}

/**
 * IMPROVED: Quality Reviewer with state injection
 */
function createImprovedQualityReviewer() {
    return new LlmAgent({
        name: "ImprovedQualityReviewer",
        model: new Gemini({
            model: "gemini-2.5-pro",
            apiKey: getApiKey()
        }),
        description: "Reviews slides using quality checker tool",
        tools: [qualityCheckerTool],
        output_key: "quality_report",  // ✅ AUTO-SAVE: Output goes to state["quality_report"]
        instruction: `You are a presentation quality expert implementing the Reflection pattern.

## INPUT FROM STATE
The slides to review are in: {slides}

⚠️ CRITICAL: The {slides} placeholder will be replaced with the actual slide content automatically.
Do NOT write "state['slides']" - use the placeholder syntax {slides}.

## YOUR TOOLS
- check_slide_quality: Analyzes slide content for quality issues

## PROCESS

1. **Parse the slide data** from {slides}
   - It contains an array of 3 slides
   - Each slide has: slide_number, title, content

2. **Review EACH slide** using check_slide_quality tool
   - For each slide, call: check_slide_quality({
       slideContent: "<title and content as text>",
       slideNumber: <number>,
       criteria: ["all"]
     })
   - Record the score and feedback for each

3. **Analyze Overall Quality**
   - Calculate average score across all slides
   - Identify critical issues (score < 0.75)
   - Check for narrative flow between slides
   - Verify consistent terminology

4. **Output Quality Report** as JSON

Required output format:
{
    "overall_score": <average of all slide scores>,
    "slide_scores": [<score1>, <score2>, <score3>],
    "critical_issues": [
        {
            "slide": <number>,
            "issue": "<description>",
            "severity": "high|medium|low",
            "suggestion": "<specific improvement>"
        }
    ],
    "suggestions": [
        {
            "slide": <number>,
            "improvement": "<actionable suggestion>"
        }
    ],
    "strengths": [
        "<what works well 1>",
        "<what works well 2>"
    ],
    "requires_refinement": <true if overall_score < 0.8>,
    "slides_to_refine": [<slide numbers with score < 0.75>]
}

## Quality Scoring Guide
- 0.9-1.0: Excellent, publication-ready
- 0.8-0.89: Good, minor improvements needed
- 0.7-0.79: Acceptable, several improvements needed
- Below 0.7: Needs significant revision

Output ONLY the JSON object, no other text.
`
    });
}

/**
 * IMPROVED: Refinement Agent with state injection
 */
function createImprovedRefinementAgent() {
    return new LlmAgent({
        name: "ImprovedRefinementAgent",
        model: new Gemini({
            model: "gemini-2.5-pro",
            apiKey: getApiKey()
        }),
        description: "Refines slides based on quality feedback",
        output_key: "refined_slides",  // ✅ AUTO-SAVE: Output goes to state["refined_slides"]
        instruction: `You refine slides based on quality review feedback.

## INPUT FROM STATE
- Original slides: {slides}
- Quality report: {quality_report}

⚠️ CRITICAL: Use {placeholder} syntax to access state.
These will be replaced with actual data automatically.

## YOUR TASK

1. **Read the quality report**
   - Check {quality_report} for overall_score
   - If overall_score >= 0.8: No refinement needed, return original slides
   - If overall_score < 0.8: Proceed with refinement

2. **Identify slides needing work**
   - Look at {quality_report}.slides_to_refine
   - Read {quality_report}.critical_issues for specific problems

3. **Refine problematic slides**
   For each slide in slides_to_refine:
   - Read the original slide from {slides}
   - Apply improvements based on {quality_report}.suggestions
   - Fix issues mentioned in {quality_report}.critical_issues
   - Maintain: original intent, consistent tone, appropriate detail level

4. **Preserve good slides**
   - Don't change slides that scored >= 0.75
   - Keep what works well (see {quality_report}.strengths)

## OUTPUT FORMAT

Return ALL slides (both refined and unchanged) as a JSON array:
[
    {
        "slide_number": 1,
        "title": "...",
        "content": {...},
        "was_refined": true|false,
        "refinement_notes": "What was improved (if refined)"
    },
    // ... all slides
]

## Refinement Guidelines
- **Clarity**: Make vague points specific
- **Readability**: Simplify complex sentences
- **Flow**: Add transitions between ideas
- **Grammar**: Fix any errors
- **Accuracy**: Ensure facts are correct

Output ONLY the JSON array, no other text.
`
    });
}

/**
 * Create the IMPROVED reflection demo workflow
 *
 * KEY IMPROVEMENTS:
 * - Uses output_key for automatic state saving
 * - Uses {placeholder} syntax to inject state into instructions
 * - Clear state flow documentation
 * - Agents know exactly where to read/write data
 */
export function createImprovedReflectionWorkflow(topic: string = "Artificial Intelligence") {
    const slideGenerator = createImprovedSlideGenerator(topic);
    const qualityReviewer = createImprovedQualityReviewer();
    const refinementAgent = createImprovedRefinementAgent();

    return new SequentialAgent({
        name: "ImprovedReflectionWorkflow",
        description: "Demonstrates reflection pattern with proper state management: Generate → Review → Refine",
        sub_agents: [
            slideGenerator,      // Writes to state["slides"] via output_key
            qualityReviewer,     // Reads {slides}, writes to state["quality_report"]
            refinementAgent      // Reads {slides} and {quality_report}, writes to state["refined_slides"]
        ]
    });
}

/**
 * STATE FLOW DIAGRAM
 *
 * Step 1: SlideGenerator
 *   Input: (none)
 *   Output: state["slides"] = [slide1, slide2, slide3]
 *   ↓
 * Step 2: QualityReviewer
 *   Input: {slides} ← automatically injected from state["slides"]
 *   Tools: qualityCheckerTool (calls Gemini API)
 *   Output: state["quality_report"] = {overall_score, issues, suggestions, ...}
 *   ↓
 * Step 3: RefinementAgent
 *   Input: {slides}, {quality_report} ← both injected from state
 *   Output: state["refined_slides"] = [refined_slide1, ...]
 *   ↓
 * Final Result:
 *   state = {
 *     "slides": [...],           // Original
 *     "quality_report": {...},   // Analysis
 *     "refined_slides": [...]    // Improved
 *   }
 */
