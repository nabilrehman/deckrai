/**
 * Multi-Source Agent
 *
 * Handles requests like: "Create deck from notes + Salesforce + code"
 *
 * Workflow (ADK native):
 * 1. Parse all sources in PARALLEL (ParallelAgent)
 * 2. Synthesize content (LlmAgent)
 * 3. Generate deck (SequentialAgent)
 * 4. Quality check
 *
 * Demonstrates ADK's native ParallelAgent for concurrent processing.
 */

import { SequentialAgent, ParallelAgent, LlmAgent, Gemini } from '@google/adk';
import { qualityCheckerTool } from '../../tools';

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
 * Notes Parser Agent (runs in parallel)
 */
function createNotesParserAgent() {
    return new LlmAgent({
        name: "NotesParserAgent",
        model: new Gemini({
            model: "gemini-2.5-flash",
            apiKey: getApiKey()
        }),
        description: "Parses meeting notes and extracts key information",
        instruction: `You parse meeting notes and extract presentation-worthy content.

## Input
- state["notes_input"]: Raw notes text (from coordinator)

## Extract
1. **Key Decisions** - Important decisions made
2. **Action Items** - Tasks and owners
3. **Problem Statements** - Issues discussed
4. **Solutions** - Proposed solutions
5. **Stakeholders** - People involved
6. **Timeline** - Dates and deadlines
7. **Quotes** - Notable statements

## Output
Write to temp:notes_data as JSON:

{
    "source": "meeting_notes",
    "key_decisions": ["Decision 1", "Decision 2"],
    "action_items": [{"task": "...", "owner": "..."}],
    "problem_statements": ["Problem 1", "Problem 2"],
    "solutions": ["Solution 1", "Solution 2"],
    "stakeholders": ["Person 1", "Person 2"],
    "timeline": {"start": "...", "milestones": [...]},
    "notable_quotes": ["Quote 1"],
    "summary": "Brief summary of notes"
}

Extract everything relevant for a professional presentation.
`
    });
}

/**
 * Code Analyzer Agent (runs in parallel)
 */
function createCodeAnalyzerAgent() {
    return new LlmAgent({
        name: "CodeAnalyzerAgent",
        model: new Gemini({
            model: "gemini-2.5-pro", // Use Pro for code analysis
            apiKey: getApiKey()
        }),
        description: "Analyzes source code and extracts presentation insights",
        instruction: `You analyze source code and extract presentation-worthy insights.

## Input
- state["code_input"]: Source code (from coordinator)

## Analyze
1. **Architecture** - Overall structure (MVC, microservices, etc.)
2. **Tech Stack** - Technologies, frameworks, libraries
3. **Key Features** - Main functionalities
4. **Design Patterns** - Patterns used (Singleton, Factory, etc.)
5. **Code Quality** - Best practices observed
6. **Innovation** - Novel implementations
7. **Scalability** - Scaling approaches

## Output
Write to temp:code_data as JSON:

{
    "source": "source_code",
    "architecture": {
        "type": "microservices",
        "components": ["API Gateway", "User Service", ...]
    },
    "tech_stack": {
        "backend": ["Node.js", "Express"],
        "frontend": ["React", "TypeScript"],
        "database": ["PostgreSQL", "Redis"],
        "infrastructure": ["Docker", "Kubernetes"]
    },
    "key_features": [
        "Real-time collaboration",
        "AI-powered suggestions",
        "Advanced analytics"
    ],
    "design_patterns": ["Repository", "Factory", "Observer"],
    "code_highlights": [
        "95% test coverage",
        "Microservices architecture",
        "Event-driven design"
    ],
    "scalability": {
        "approach": "horizontal scaling",
        "capacity": "handles 100k concurrent users"
    }
}

Focus on presentation-worthy technical achievements.
`
    });
}

/**
 * Salesforce Data Agent (runs in parallel)
 */
function createSalesforceDataAgent() {
    return new LlmAgent({
        name: "SalesforceDataAgent",
        model: new Gemini({
            model: "gemini-2.5-flash",
            apiKey: getApiKey()
        }),
        description: "Fetches and processes Salesforce data",
        instruction: `You fetch and process Salesforce data for presentation.

## Input
- state["salesforce_query"]: What data to fetch (from coordinator)

## Fetch (simulated - replace with actual Salesforce API)
- Customer data
- Sales metrics
- Opportunities
- Account information
- Activity history

## Output
Write to temp:salesforce_data as JSON:

{
    "source": "salesforce",
    "customers": [
        {
            "name": "Acme Corp",
            "industry": "Technology",
            "revenue": "$5M",
            "status": "Active"
        }
    ],
    "sales_metrics": {
        "total_revenue": "$50M",
        "growth_rate": "25%",
        "top_products": ["Product A", "Product B"]
    },
    "opportunities": [
        {
            "name": "Enterprise Deal",
            "value": "$2M",
            "stage": "Negotiation",
            "close_date": "Q2 2025"
        }
    ],
    "insights": [
        "25% growth in enterprise segment",
        "High satisfaction scores (4.8/5)",
        "Strong pipeline for Q2"
    ]
}

Extract data that tells a compelling story.
`
    });
}

/**
 * Synthesis Agent
 *
 * Merges data from all sources into coherent presentation content
 */
function createSynthesisAgent() {
    return new LlmAgent({
        name: "SynthesisAgent",
        model: new Gemini({
            model: "gemini-2.5-pro", // Use Pro for synthesis
            apiKey: getApiKey()
        }),
        description: "Synthesizes data from multiple sources into presentation narrative",
        instruction: `You synthesize data from multiple sources into a coherent presentation.

## Input (from temp: namespace)
- temp:notes_data: Meeting notes insights
- temp:code_data: Code analysis insights
- temp:salesforce_data: Salesforce metrics

## Process
1. **Find Common Themes** - What story do the sources tell together?
2. **Identify Narrative** - Problem → Solution → Results
3. **Extract Key Messages** - 3-5 main points
4. **Structure Deck** - Logical flow of slides
5. **Resolve Conflicts** - Handle contradictions gracefully

## Output
Write to temp:synthesized_content as JSON:

{
    "narrative": {
        "problem": "Problem statement from notes",
        "solution": "Solution from code + notes",
        "results": "Results from Salesforce data"
    },
    "key_messages": [
        "Our innovative architecture enables 10x scalability",
        "Customer satisfaction increased 40% post-deployment",
        "Strong market opportunity with $50M pipeline"
    ],
    "deck_structure": [
        {
            "slide_number": 1,
            "title": "Problem & Opportunity",
            "content_sources": ["notes_data"],
            "key_points": ["Market need", "Customer pain points"]
        },
        {
            "slide_number": 2,
            "title": "Our Solution",
            "content_sources": ["code_data", "notes_data"],
            "key_points": ["Technical architecture", "Key features"]
        },
        {
            "slide_number": 3,
            "title": "Results & Traction",
            "content_sources": ["salesforce_data"],
            "key_points": ["Revenue growth", "Customer success"]
        }
    ],
    "data_mapping": {
        "slide_1": {
            "from_notes": ["problem_statements", "stakeholders"],
            "from_code": [],
            "from_salesforce": ["market_size"]
        }
    }
}

Create a compelling narrative that integrates all sources.
`
    });
}

/**
 * Deck Generator Agent
 *
 * Generates actual slides from synthesized content
 */
function createDeckGeneratorAgent() {
    return new LlmAgent({
        name: "DeckGeneratorAgent",
        model: new Gemini({
            model: "gemini-2.5-pro",
            apiKey: getApiKey()
        }),
        description: "Generates slides from synthesized multi-source content",
        instruction: `You generate professional slides from synthesized content.

## Input
- temp:synthesized_content: The merged narrative and structure
- temp:notes_data, temp:code_data, temp:salesforce_data: Original sources

## Process
For each slide in deck_structure:
1. Pull relevant data from sources
2. Create compelling title
3. Structure content (bullets, diagrams, etc.)
4. Add supporting details
5. Ensure visual balance

## Output
Write to state["slides"] as JSON array:

[
    {
        "slide_number": 1,
        "title": "Transforming Enterprise Collaboration",
        "subtitle": "Market Opportunity & Customer Needs",
        "content": {
            "type": "bullets",
            "items": [
                "Remote work increased 300% - need for real-time collaboration",
                "Existing tools lack AI-powered intelligence",
                "$5B market opportunity in enterprise software"
            ]
        },
        "data_sources": ["notes", "salesforce"],
        "visuals": {
            "suggested": "market_growth_chart"
        }
    },
    {
        "slide_number": 2,
        "title": "Our Solution: AI-Powered Platform",
        "subtitle": "Technical Architecture & Innovation",
        "content": {
            "type": "architecture_diagram",
            "components": ["API Gateway", "AI Engine", "Real-time Sync"],
            "highlights": [
                "Microservices architecture for 100k concurrent users",
                "Event-driven design for real-time collaboration",
                "95% test coverage for reliability"
            ]
        },
        "data_sources": ["code"],
        "visuals": {
            "suggested": "architecture_diagram"
        }
    }
]

Create slides that flow naturally and tell the integrated story.
`
    });
}

/**
 * Quality Check Agent
 */
function createMultiSourceQualityAgent() {
    return new LlmAgent({
        name: "MultiSourceQualityAgent",
        model: new Gemini({
            model: "gemini-2.5-flash",
            apiKey: getApiKey()
        }),
        description: "Validates multi-source deck quality",
        tools: [qualityCheckerTool],
        instruction: `You validate the multi-source deck.

## Special Checks for Multi-Source Content

1. **Source Integration** - All sources represented?
2. **Narrative Coherence** - Does story flow logically?
3. **Data Consistency** - No contradictions between sources?
4. **Balance** - Equal weight to each source (if appropriate)?
5. **Clarity** - Clear which data came from where?

## Output
Write to state["quality_report"] with multi-source specific checks.

If overall_score < 0.8, flag specific integration issues.
`
    });
}

/**
 * Create Multi-Source Agent Workflow
 *
 * Demonstrates ADK's ParallelAgent for concurrent source processing
 */
export function createMultiSourceAgent() {
    return new SequentialAgent({
        name: "MultiSourceAgent",
        description: "Creates decks from multiple sources (notes, code, Salesforce, etc.)",
        sub_agents: [
            // Step 1: Parse all sources in PARALLEL (ADK native!)
            new ParallelAgent({
                name: "SourceParsingParallel",
                description: "Parses all sources concurrently",
                sub_agents: [
                    createNotesParserAgent(),
                    createCodeAnalyzerAgent(),
                    createSalesforceDataAgent()
                ]
            }),

            // Step 2: Synthesize (after all sources parsed)
            createSynthesisAgent(),

            // Step 3: Generate deck
            createDeckGeneratorAgent(),

            // Step 4: Quality check
            createMultiSourceQualityAgent()
        ]
    });
}
