# Gemini 2.5 Pro Slide Deck Designer - Usage Guide
### How to Use the Universal Prompt Template

---

## Overview

This prompt template transforms Gemini 2.5 Pro into an expert slide deck designer, capable of creating comprehensive, designer-ready specifications with:
- Graphic designer-level detail
- Deep visual hierarchy planning
- Extensive brand research
- Complete architecture documentation
- Production-ready design systems

**Quality Standard:** Matches or exceeds professional design agency output (see SolarWinds reference example).

---

## Prerequisites

### Required:
- **Gemini 2.5 Pro API access** (Google AI Studio or Vertex AI)
- **API Key** configured in your environment
- **Python 3.7+** (if using the test runner script)
- **google-genai package** (install with `pip install google-genai`)

### Recommended:
- Familiarity with design terminology (grid, hierarchy, hex codes, etc.)
- Basic understanding of presentation design principles
- Access to design tools (PowerPoint, Keynote, Figma, etc.) for execution

---

## Quick Start

### Option 1: Use the Test Runner Script (Recommended)

1. **Set your API key:**
   ```bash
   export VITE_GEMINI_API_KEY="your-api-key-here"
   ```

2. **Run the test runner:**
   ```bash
   cd prompts
   python3 test-runner.py
   ```

3. **Select a test case or create your own**

4. **Review the generated output** in `prompts/test-results/`

5. **Score against the rubric** using `evaluation-rubric.md`

---

### Option 2: Manual API Usage

**Python:**
```python
from google import genai
from google.genai import types

# Initialize client
client = genai.Client(api_key="YOUR_API_KEY")

# Load prompt template
with open('prompts/gemini-slide-designer-prompt.md', 'r') as f:
    prompt_template = f.read()

# Fill in your project details
your_prompt = prompt_template + f"""

---

**Company Name:** YourCompany

**Content/Narrative:**
[Describe your presentation content here - what story are you telling?
What key messages? What data/examples do you have?]

**Target Audience:** [Who will see this? Internal team? Investors? Customers?]

**Presentation Goal:** [What should happen after they see this? Decision? Action? Understanding?]

**Desired Slide Count:** [Number or "optimize"]

---

Please create the complete slide deck specification following the methodology above.
"""

# Generate with thinking mode
response = client.models.generate_content(
    model="gemini-3-pro-preview",
    contents=your_prompt,
    config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_budget=16384,     # High budget for complex design reasoning
            include_thoughts=True       # See the model's design reasoning
        )
    )
)

# Extract output
for part in response.candidates[0].content.parts:
    if part.thought:
        print("=== DESIGN REASONING ===")
        print(part.text)
    else:
        print("=== SPECIFICATION ===")
        print(part.text)
```

**JavaScript/TypeScript:**
```javascript
import { genai } from '@google/generative-ai';

const client = new genai.Client({ apiKey: "YOUR_API_KEY" });

// Load prompt template
const promptTemplate = await fs.readFileSync('prompts/gemini-slide-designer-prompt.md', 'utf-8');

// Fill in your project
const yourPrompt = promptTemplate + `

---

**Company Name:** YourCompany
**Content/Narrative:** [Your content here]
**Target Audience:** [Your audience]
**Presentation Goal:** [Your goal]
**Desired Slide Count:** [Number]

---

Please create the complete slide deck specification following the methodology above.
`;

// Generate with thinking mode
const response = await client.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: yourPrompt,
    config: {
        thinkingConfig: {
            thinkingBudget: 16384,
            includeThoughts: true,
        },
    },
});

// Process response
response.candidates[0].content.parts.forEach(part => {
    if (part.thought) {
        console.log("=== DESIGN REASONING ===");
        console.log(part.text);
    } else {
        console.log("=== SPECIFICATION ===");
        console.log(part.text);
    }
});
```

---

## How to Fill in the Template

### 1. Company Name
**What to provide:**
- Exact company name as you want it referenced
- For subsidiaries: Include parent company context
- For fictional/new companies: State "fictional" or "new brand"

**Examples:**
- ✓ "SolarWinds"
- ✓ "Nike"
- ✓ "Acme Corp (fictional startup)"
- ✓ "AWS (Amazon Web Services)"
- ✗ "the company" (too vague)

---

### 2. Content/Narrative
**What to provide:**
- The complete story/message you want to tell
- Key data points, metrics, or examples
- Logical flow of topics
- Any specific slides you know you need

**Be specific and comprehensive.** The better the content description, the better the design specs.

**Good Example:**
```
Sales workflow presentation showing how I achieved 300% quota through:
1. Messaging - Using urgency, hooks, clear CTAs
2. Targeting - SWOSh renewals, focused account lists
3. Calling - 85% conversion rate, persona-based pivoting
4. Persistence - Triple-calling no-shows, custom follow-ups

Key metrics: 300% quota month 1, changed team's entire sequence,
they adopted my extra call approach.

Specific tactics to show:
- Email tracking for hot leads
- Different approaches for sysadmins vs CIOs
- Arriving 2 minutes early to build rapport
- Story from Germany client who opened up
```

**Bad Example:**
```
It's about our sales process and some numbers.
```

---

### 3. Target Audience
**What to provide:**
- Who will see this presentation?
- What's their role/level? (Executive? Technical? General?)
- What do they care about? (Data? Story? Strategy?)
- Internal or external?

**Examples:**
- ✓ "Venture capital investors (Series A stage)"
- ✓ "Internal sales team and sales managers"
- ✓ "Enterprise IT leaders, CTOs, Engineering managers"
- ✓ "Nike marketing executives, brand managers"
- ✗ "people" (too vague)

**Why it matters:** Changes visual hierarchy, detail level, tone.
- Investors want data-first
- Sales teams want inspiration + tactics
- Executives want high-level strategy
- Technical audiences want architecture details

---

### 4. Presentation Goal
**What to provide:**
- What should happen AFTER they see this?
- What decision needs to be made?
- What action should they take?
- What understanding should they gain?

**Examples:**
- ✓ "Secure $8M Series A funding"
- ✓ "Train other sales reps on successful methodology, inspire with results"
- ✓ "Get buy-in for athlete endorsement campaign"
- ✓ "Demonstrate Atlassian's value, inspire similar transformations"
- ✗ "inform them" (too vague)

**Why it matters:** Determines focal points and emphasis.
- "Inspire" → emotion-led, bold visuals
- "Get approval" → data-led, credibility focus
- "Train" → clarity-led, step-by-step focus

---

### 5. Desired Slide Count
**What to provide:**
- Specific number (e.g., "12 slides")
- Range (e.g., "10-12 slides")
- "optimize" (let the model decide)
- Context if you have constraints (e.g., "15 slides - standard VC pitch deck")

**Guidelines:**
- Investor pitch: 10-15 slides
- Sales presentation: 8-12 slides
- Training/educational: 15-25 slides
- Executive briefing: 5-8 slides
- Conference talk: 20-40 slides

**Tip:** More slides ≠ better. Less text per slide, more slides is often better than cramming text onto fewer slides.

---

## Thinking Budget Recommendations

The `thinking_budget` parameter controls how much the model "thinks" before responding.

### Recommended Settings by Complexity:

**16,384 tokens (Recommended Default):**
- ✓ Most design projects
- ✓ Standard presentations (8-15 slides)
- ✓ Balanced quality and cost
- ✓ Sufficient for brand research + architecture planning

**24,576 - 32,768 tokens (High):**
- ✓ Very complex decks (20+ slides)
- ✓ Critical presentations (investor pitches, board meetings)
- ✓ Multiple brand guidelines to analyze
- ✓ When quality is paramount over cost

**8,192 tokens (Low):**
- ✓ Simple decks (5-8 slides)
- ✓ Well-known brands with clear guidelines
- ✓ Budget-constrained projects
- ✓ Quick iterations

**-1 (Dynamic - Model Decides):**
- Let the model allocate thinking tokens based on complexity
- Less control but often efficient

### Cost Considerations:
- You are charged for thinking tokens
- Higher thinking budget = Higher cost BUT better quality
- Test with 16,384 first, adjust based on results

---

## Interpreting the Output

### Output Structure:

The model will generate a complete specification document with:

1. **Executive Summary** - What the deck achieves
2. **Brand Research Findings** - Colors, fonts, personality, sources
3. **Deck Architecture Overview** - Table showing all slides
4. **Detailed Slide Specifications** - Complete specs for each slide:
   - Visual hierarchy breakdown
   - Layout architecture
   - Color palette
   - Typography
   - Spacing measurements
   - Design rationale
5. **Comprehensive Design System** - Standalone reference guide
6. **Production Notes** - How to build it

### What to Look For:

**Quality Indicators:**
- ✓ All colors have exact hex codes (#F99D1C not "orange")
- ✓ All font weights are numbers (700 not "bold")
- ✓ All sizes have units (64px not "large")
- ✓ Every slide has visual hierarchy (PRIMARY/SECONDARY/TERTIARY)
- ✓ Design rationale explains WHY choices were made
- ✓ Brand research cites sources

**Red Flags:**
- ✗ Generic colors ("blue", "red")
- ✗ Vague measurements ("big", "small", "generous")
- ✗ Missing hierarchy breakdown
- ✗ No brand research sources
- ✗ Incomplete slides (last few slides are short)

---

## Using the Thinking Output

When `include_thoughts=True`, you'll see the model's reasoning process.

**What you'll see in thinking output:**
- Brand research strategy ("Searching for Atlassian brand guidelines...")
- Design decisions ("Using 65/35 split because primary visual needs dominance...")
- Hierarchy planning ("Eye should go to stat first, then supporting text...")
- Quality checks ("Verifying all hex codes are provided...")

**How to use it:**
1. **Understand decisions:** See WHY the model chose certain layouts/colors
2. **Debug issues:** If output is unexpected, thinking shows the reasoning
3. **Learn design:** Thinking reveals design principles in action
4. **Improve prompts:** If reasoning is off, adjust your input

**Example Thinking Output:**
```
I'm analyzing the company "Atlassian" to understand their brand...
Found Atlassian uses blue (#0052CC) as primary color...
For a success story deck, I should use:
- Data-first hierarchy (metrics dominate)
- Professional enterprise aesthetic
- Charts showing 40% improvement
Let me plan the slide architecture...
```

---

## Evaluating Output Quality

Use the provided `evaluation-rubric.md` to score output:

### 5 Dimensions (10 points each):
1. **Brand Research Quality** - Did it find accurate brand info?
2. **Visual Hierarchy Clarity** - Is hierarchy explicitly defined?
3. **Architecture Detail** - Are layouts precisely specified?
4. **Specifications Completeness** - Are all details provided?
5. **Design System Quality** - Is the design system comprehensive?

**Passing Score:** 45/50 (90%)

**How to evaluate:**
1. Review the output thoroughly
2. Check each dimension's criteria
3. Score based on the rubric guidelines
4. Total the scores
5. If < 45: Refine your input or the prompt, then retry

---

## Common Issues & Solutions

### Issue: Generic brand colors ("blue" instead of hex codes)

**Cause:** Model couldn't find brand guidelines or didn't prioritize specificity

**Solution:**
- Provide brand guidelines yourself if you have them
- Specify in your prompt: "Use Atlassian's official blue #0052CC"
- Increase thinking budget (more time to search)

---

### Issue: Incomplete slides (last few slides are short)

**Cause:** Model ran out of output tokens or lost detail focus

**Solution:**
- Request fewer slides initially
- Be more concise in content description
- Ask for "complete specifications for all slides, maintaining same detail level throughout"

---

### Issue: Visual hierarchy not defined for some slides

**Cause:** Prompt's hierarchy requirements didn't stick for all slides

**Solution:**
- Emphasize: "CRITICAL: Every single slide must have PRIMARY/SECONDARY/TERTIARY defined with percentages"
- Review thinking output to see where model skipped hierarchy

---

### Issue: Design feels generic, not brand-appropriate

**Cause:** Brand research was surface-level or model defaulted to generic style

**Solution:**
- Provide more brand context in your prompt
- Include brand personality descriptors ("bold", "playful", "minimalist")
- Reference competitor brands if new/unknown company

---

### Issue: Too text-heavy for slides

**Cause:** Content description was verbose; model translated it directly to slides

**Solution:**
- Specify: "Maximum 10 words per slide"
- Describe concepts/themes rather than full paragraphs
- Remind: "Visual-first design, minimal text"

---

### Issue: Thinking budget used up quickly

**Cause:** Complex request, insufficient budget

**Solution:**
- Increase thinking budget (try 24,576 or 32,768)
- Simplify request (fewer slides, simpler content)
- Break into multiple prompts (part 1: brand research + architecture, part 2: detailed specs)

---

## Best Practices

### ✓ DO:
- Provide comprehensive content description
- Specify exact audience and goal
- Use thinking mode (16,384+ budget)
- Review thinking output to understand reasoning
- Evaluate against rubric
- Iterate if score < 45

### ✗ DON'T:
- Provide vague content ("just make a sales deck")
- Skip audience/goal (model needs context)
- Use low thinking budget for complex decks
- Ignore rubric scoring (quality control matters)
- Accept generic output (hex codes matter!)

---

## Advanced Tips

### Tip 1: Multi-Stage Prompting for Very Complex Decks

For 20+ slide decks, break into stages:

**Stage 1: Brand Research & Architecture**
```
Focus only on:
1. Comprehensive brand research
2. Slide architecture planning (table format)
3. Design system documentation

DO NOT create detailed slide specs yet.
```

**Stage 2: Detailed Slide Specs (Batch 1)**
```
Using the brand research and architecture from Stage 1,
create detailed specifications for slides 1-10.

[Paste brand research and architecture from Stage 1]
```

**Stage 3: Detailed Slide Specs (Batch 2)**
```
Create detailed specifications for slides 11-20.
[Paste context]
```

---

### Tip 2: Provide Visual References

If you have reference images:
```
Visual inspiration: Please reference the aesthetic of [Company X]'s
recent rebrand (2024) - bold, minimal, data-forward design.

Or: "Similar style to Apple keynote presentations - lots of whitespace,
product-focused, minimal text."
```

---

### Tip 3: Specify Design Constraints

If you have requirements:
```
Design constraints:
- Must work in PowerPoint (no custom fonts that require licenses)
- Must be printable (CMYK colors)
- Must be accessible (WCAG AA contrast minimum)
- Maximum 10 words per slide
- No stock photos (illustrations only)
```

---

### Tip 4: Request Specific Slide Types

If you know you need certain formats:
```
Specific slides needed:
- Comparison slide (before/after split-screen)
- Timeline slide (5 milestones, left to right)
- Team slide (4 founders, card layout)
- Pricing slide (3-tier comparison table)
```

---

## Example: Complete Workflow

Here's a real end-to-end example:

1. **Define Your Project:**
   ```
   Company: TechFlow (B2B SaaS startup)
   Content: Product demo for enterprise prospects
   Audience: IT Directors and CIOs
   Goal: Book product demo meetings
   Slides: 8-10 slides
   ```

2. **Fill the Prompt Template:**
   - Load `gemini-slide-designer-prompt.md`
   - Add your project details at the end
   - Set thinking_budget=16384

3. **Run Generation:**
   ```bash
   python3 test-runner.py
   # Select custom option, paste your details
   ```

4. **Review Output:**
   - Check `test-results/yourproject_TIMESTAMP.md`
   - Review thinking output
   - Verify all hex codes present
   - Check hierarchy for all slides

5. **Evaluate:**
   - Score against rubric: 48/50 (passed!)
   - Minor gap: Slide 7 needs more whitespace detail

6. **Refine (if needed):**
   - If score < 45, adjust prompt and regenerate
   - Add emphasis on gaps: "Ensure whitespace percentages for ALL slides"

7. **Hand to Designer:**
   - Provide the complete specification document
   - Designer executes in PowerPoint/Keynote/Figma
   - Designer can work without asking clarifying questions

---

## Support & Iteration

### If output quality is consistently < 45:
1. Review test cases in `test-cases/` for good examples
2. Compare your prompt to test case prompts
3. Check thinking output for where model struggled
4. Consider prompt refinements (contact template maintainer)

### If you discover prompt improvements:
- Document what worked
- Share findings with team
- Consider contributing improvements

---

## Files Reference

```
prompts/
├── gemini-slide-designer-prompt.md    # Main prompt template
├── USAGE-GUIDE.md                     # This file
├── evaluation-rubric.md               # Scoring criteria
├── test-runner.py                     # Automated test script
├── test-cases/                        # Example test cases
│   ├── test-case-1-atlassian.md
│   ├── test-case-2-nike.md
│   └── test-case-3-startup.md
└── test-results/                      # Output directory
    └── [generated files]
```

---

## Frequently Asked Questions

**Q: How much does each generation cost?**
A: Gemini 2.5 Pro pricing varies. With thinking_budget=16384, expect ~20K-40K total tokens per complex deck. Check Google's current pricing.

**Q: Can I use this for non-business presentations?**
A: Yes! Works for academic, personal, educational, or any presentation type.

**Q: What if my company has no public brand guidelines?**
A: The prompt will make reasonable assumptions based on industry norms. You can also provide guidelines manually: "Our brand colors are: #1E88E5 (blue), #00C853 (green)..."

**Q: Can I modify the prompt template?**
A: Absolutely! The template is a starting point. Customize for your specific needs.

**Q: Does this work with other models?**
A: Template is optimized for Gemini 2.5 Pro's thinking mode. May work with other models but quality not guaranteed.

**Q: How long does generation take?**
A: Typically 1-3 minutes for 10-15 slide decks with thinking_budget=16384.

**Q: Can I generate just the design system without slide specs?**
A: Yes, modify the prompt to say: "Create only the comprehensive design system and brand research. Do not create slide specifications."

---

## Getting Help

**Documentation:**
- This guide: `USAGE-GUIDE.md`
- Rubric: `evaluation-rubric.md`
- Examples: `test-cases/`

**Common Issues:**
- Check "Common Issues & Solutions" section above
- Review thinking output for model's reasoning
- Compare to test case examples

---

## Version History

**v1.0** (Current)
- Initial release
- Enhanced visual hierarchy focus
- Gemini 2.5 Pro thinking mode integration
- Comprehensive evaluation rubric
- Test runner script

---

**Happy designing! 🎨**
