/**
 * Template Architecture Agent
 *
 * Handles requests like: "Create architecture slide based on my template"
 *
 * Workflow (ADK SequentialAgent):
 * 1. Load template → extract design blueprint
 * 2. Generate architecture content
 * 3. Match content to template style
 * 4. Quality check
 *
 * Uses ADK native features:
 * - SequentialAgent for step-by-step workflow
 * - Session state (temp: namespace) for data flow
 * - LlmAgent for intelligent operations
 */

import { SequentialAgent, LlmAgent, Gemini } from '@google/adk';
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
 * Step 1: Load Template Agent
 *
 * Loads user's template and extracts design blueprint
 */
function createLoadTemplateAgent() {
    return new LlmAgent({
        name: "LoadTemplateAgent",
        model: new Gemini({
            model: "gemini-2.5-flash",
            apiKey: getApiKey()
        }),
        description: "Loads template and extracts design blueprint",
        instruction: `You extract design patterns from the user's template.

## Input
- User's template (from state["user_template"] or uploaded file)

## Analysis
Extract and store in session state:

1. **Layout Structure** → temp:template_layout
   - Slide dimensions
   - Text box positions
   - Image placements
   - Element alignment

2. **Color Scheme** → temp:template_colors
   - Primary colors
   - Secondary colors
   - Accent colors
   - Background colors

3. **Typography** → temp:template_fonts
   - Title font (family, size, weight)
   - Body font (family, size, weight)
   - Emphasis styles

4. **Visual Style** → temp:template_style
   - Professional/Modern/Minimal/etc.
   - Use of graphics (diagrams, icons, photos)
   - White space usage
   - Visual hierarchy

5. **Content Patterns** → temp:template_patterns
   - Bullet point style
   - Heading structure
   - Content density
   - Slide transitions

## Output
Write comprehensive template blueprint to temp:template_blueprint as JSON:

{
    "layout": {...},
    "colors": {...},
    "typography": {...},
    "style": "professional",
    "patterns": {...}
}

This blueprint guides content generation and matching.
`
    });
}

/**
 * Step 2: Generate Architecture Content Agent
 *
 * Generates architecture content based on user's scenario
 */
function createGenerateArchitectureAgent() {
    return new LlmAgent({
        name: "GenerateArchitectureAgent",
        model: new Gemini({
            model: "gemini-2.5-pro", // Use Pro for architecture generation
            apiKey: getApiKey()
        }),
        description: "Generates architecture content for the specified scenario",
        instruction: `You generate architecture slide content.

## Input
- state["architecture_type"]: Type of architecture (microservices, serverless, etc.)
- state["scenario"]: Specific scenario/use case
- state["components"]: Components to include (from coordinator analysis)

## Process
Create architecture content with:

1. **Title** - Clear, descriptive architecture title
2. **Components** - Key architectural components
3. **Connections** - How components interact
4. **Flow** - Data/control flow
5. **Annotations** - Key technical details

## Output Format
Write to temp:architecture_content as JSON:

{
    "title": "Microservices Architecture for E-Commerce Platform",
    "components": [
        {
            "name": "API Gateway",
            "type": "entry_point",
            "description": "Routes requests to services",
            "connections": ["User Service", "Product Service", "Order Service"]
        },
        {
            "name": "User Service",
            "type": "microservice",
            "description": "Handles user authentication and profiles",
            "connections": ["User Database"]
        }
    ],
    "layers": ["Presentation", "Business Logic", "Data"],
    "key_features": [
        "Independent scaling per service",
        "Event-driven communication",
        "Resilient failure handling"
    ],
    "annotations": {
        "security": "OAuth 2.0 + JWT",
        "communication": "REST + Event Bus",
        "deployment": "Kubernetes"
    }
}

Keep it clear, professional, and technically accurate.
`
    });
}

/**
 * Step 3: Match to Template Agent
 *
 * Applies template style to generated architecture content
 */
function createMatchToTemplateAgent() {
    return new LlmAgent({
        name: "MatchToTemplateAgent",
        model: new Gemini({
            model: "gemini-2.5-flash",
            apiKey: getApiKey()
        }),
        description: "Applies template style to architecture content",
        instruction: `You apply template styling to architecture content.

## Input
- temp:template_blueprint: Design blueprint from template
- temp:architecture_content: Generated architecture content

## Process
Transform architecture content to match template style:

1. **Layout Matching**
   - Position components according to template layout
   - Apply template spacing and alignment
   - Use template dimensions

2. **Visual Matching**
   - Apply template color scheme to components
   - Use template typography for titles/text
   - Match visual hierarchy

3. **Style Matching**
   - Match professional/modern/minimal style
   - Use template's graphic style (boxes, arrows, etc.)
   - Match content density

4. **Preserve Content**
   - Keep all architecture information
   - Maintain technical accuracy
   - Preserve relationships and flows

## Output Format
Write to temp:styled_architecture_slide as JSON:

{
    "title": "Architecture Title (with template fonts)",
    "layout": {
        "template_based": true,
        "components": [
            {
                "name": "API Gateway",
                "position": {x: 100, y: 100},
                "size": {w: 200, h: 80},
                "color": "#template_primary_color",
                "font": "template_title_font"
            }
        ]
    },
    "style": {
        "applied_template": "template_name",
        "color_scheme": "from_template",
        "typography": "from_template"
    }
}

The result should look like it belongs to the template!
`
    });
}

/**
 * Step 4: Quality Check Agent
 *
 * Validates the final slide
 */
function createQualityCheckAgent() {
    return new LlmAgent({
        name: "QualityCheckAgent",
        model: new Gemini({
            model: "gemini-2.5-flash",
            apiKey: getApiKey()
        }),
        description: "Validates template-matched architecture slide quality",
        tools: [qualityCheckerTool],
        instruction: `You validate the final architecture slide.

## Input
- temp:styled_architecture_slide: The template-matched architecture slide

## Quality Checks

1. **Content Quality**
   - Architecture is technically accurate
   - All components are included
   - Relationships are clear
   - Flow is logical

2. **Template Matching**
   - Colors match template
   - Fonts match template
   - Layout matches template
   - Style is consistent

3. **Readability**
   - Not too dense
   - Clear labels
   - Proper spacing
   - Good contrast

## Output
Write to state["final_slide"] and state["quality_check"]:

{
    "slide": {...},
    "quality": {
        "score": 0.92,
        "content_accuracy": 0.95,
        "template_matching": 0.90,
        "readability": 0.91,
        "issues": [],
        "strengths": ["Matches template perfectly", "Clear architecture"]
    }
}

If score < 0.75, flag for refinement.
`
    });
}

/**
 * Create Template Architecture Agent Workflow
 *
 * ADK SequentialAgent that orchestrates the 4-step workflow
 */
export function createTemplateArchitectureAgent() {
    return new SequentialAgent({
        name: "TemplateArchitectureAgent",
        description: "Creates architecture slides based on user templates",
        sub_agents: [
            createLoadTemplateAgent(),
            createGenerateArchitectureAgent(),
            createMatchToTemplateAgent(),
            createQualityCheckAgent()
        ]
    });
}
