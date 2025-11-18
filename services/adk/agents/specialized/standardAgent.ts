/**
 * Standard Agent
 *
 * Handles simple requests like: "Create a 10-slide pitch deck about AI"
 *
 * Workflow (ADK SequentialAgent):
 * 1. Generate slides
 * 2. Review quality (Reflection pattern)
 * 3. Refine if needed
 *
 * This is the standard workflow for straightforward create/edit requests.
 */

import { SequentialAgent, LlmAgent, Gemini } from '@google/adk';
import { createQualityReviewerAgent, createRefinementAgent } from '../qualityReviewer';

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
 * Standard Slide Generator
 *
 * Generates slides based on topic, slide count, audience, etc.
 */
function createStandardSlideGenerator() {
    return new LlmAgent({
        name: "StandardSlideGenerator",
        model: new Gemini({
            model: "gemini-2.5-pro", // Use Pro for high-quality generation
            apiKey: getApiKey()
        }),
        description: "Generates professional slides for standard create requests",
        instruction: `You generate professional presentation slides.

## Input from Session State
- state["topic"]: Presentation topic (e.g., "AI product pitch")
- state["slide_count"]: Number of slides (e.g., 10)
- state["audience"]: Target audience (e.g., "investors", "technical", "general")
- state["style"]: Presentation style (e.g., "professional", "creative", "minimal")
- state["requirements"]: Additional requirements

## Standard Deck Structure

For a pitch deck (investors):
1. Problem/Opportunity
2. Solution
3. Product/Demo
4. Market Size
5. Business Model
6. Traction/Metrics
7. Competition
8. Team
9. Financials
10. Ask/Next Steps

For a technical presentation:
1. Overview
2. Problem Statement
3. Technical Approach
4. Architecture
5. Implementation
6. Results/Performance
7. Learnings
8. Next Steps

For a general presentation:
1. Title/Introduction
2. Agenda
3. Main Topics (3-5 slides)
4. Deep Dives (2-3 slides)
5. Conclusion
6. Q&A

## Slide Generation Guidelines

**Title Slide**:
- Compelling title
- Subtitle with context
- Date/presenter info

**Content Slides**:
- Clear, descriptive titles
- 3-5 bullet points per slide
- Concise language (max 10 words per bullet)
- One key message per slide
- Professional tone

**Visual Slides**:
- Architecture diagrams for technical topics
- Charts/graphs for data
- Process flows for workflows
- Icons/graphics where appropriate

**Conclusion Slide**:
- Summarize key messages
- Clear call-to-action
- Next steps

## Output Format
Write to state["slides"] as JSON array:

[
    {
        "slide_number": 1,
        "title": "Revolutionizing Enterprise AI",
        "subtitle": "Pitch Deck - Q1 2025",
        "content": {
            "type": "title_slide",
            "presenter": "from_context",
            "company": "from_context"
        },
        "notes": "Opening slide - establish credibility"
    },
    {
        "slide_number": 2,
        "title": "The Problem We're Solving",
        "content": {
            "type": "bullets",
            "items": [
                "Enterprises struggle with AI implementation - 70% of projects fail",
                "Existing tools require deep ML expertise",
                "$10B wasted annually on failed AI initiatives"
            ]
        },
        "visuals": {
            "type": "problem_illustration",
            "description": "Show enterprise pain points"
        },
        "notes": "Establish problem urgency"
    },
    {
        "slide_number": 3,
        "title": "Our Solution: No-Code AI Platform",
        "content": {
            "type": "bullets_with_visual",
            "items": [
                "Drag-and-drop AI model builder",
                "Pre-trained models for common use cases",
                "Production deployment in minutes, not months"
            ]
        },
        "visuals": {
            "type": "product_screenshot",
            "description": "Platform interface"
        },
        "notes": "Position as simple, accessible solution"
    }
]

## Quality Standards

- **Clarity**: Every slide has one clear message
- **Consistency**: Uniform style and tone throughout
- **Conciseness**: No walls of text - use bullets
- **Completeness**: Cover all required topics
- **Credibility**: Include relevant data/metrics

Generate ${state["slide_count"]} slides that tell a compelling story!
`
    });
}

/**
 * Create Standard Agent Workflow
 *
 * Uses the proven Generate → Review → Refine pattern (Reflection)
 */
export function createStandardAgent() {
    return new SequentialAgent({
        name: "StandardAgent",
        description: "Standard workflow for simple create/edit requests",
        sub_agents: [
            createStandardSlideGenerator(),  // Generate
            createQualityReviewerAgent(),    // Review (Reflection!)
            createRefinementAgent()          // Refine
        ]
    });
}
