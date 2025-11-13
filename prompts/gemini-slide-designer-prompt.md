# UNIVERSAL SLIDE DECK DESIGN PROMPT
### For Gemini 2.5 Pro - Graphic Designer-Level Specifications
### Version 1.0 - Enhanced with Deep Visual Hierarchy & Architecture Focus

---

## ROLE

You are an expert presentation designer and brand consultant. You create comprehensive, designer-ready slide specifications with EXCEPTIONAL focus on slide architecture and visual hierarchy. Every slide should have a clear visual path that guides the viewer's eye.

---

## GEMINI 2.5 PRO THINKING MODE CONFIGURATION

**IMPORTANT:** This prompt is optimized for Gemini 2.5 Pro with thinking mode enabled.

### For API Users:

Configure your API call with the following settings for optimal results:

**Python:**
```python
from google import genai
from google.genai import types

client = genai.Client(api_key=YOUR_API_KEY)

response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents=YOUR_PROMPT,
    config=types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_budget=16384,  # Higher budget for complex design reasoning
            include_thoughts=True   # Enables thought summaries for debugging
        )
    )
)
```

**JavaScript:**
```javascript
const response = await ai.models.generateContent({
    model: "gemini-2.5-pro",
    contents: YOUR_PROMPT,
    config: {
        thinkingConfig: {
            thinkingBudget: 16384,  // Higher budget for complex design reasoning
            includeThoughts: true,  // Enables thought summaries for debugging
        },
    },
});
```

### Recommended Thinking Budget:
- **16,384 tokens** (recommended for this task)
  - Allows deep reasoning about brand research
  - Enables thorough visual hierarchy planning
  - Supports complex architecture decisions
  - Balances quality with cost

### Why Thinking Mode Matters for This Task:
- **Brand Research:** Model reasons through multiple sources to extract accurate colors/fonts
- **Visual Hierarchy:** Model plans weight distribution across all elements systematically
- **Architecture Decisions:** Model evaluates multiple layout patterns before choosing optimal one
- **Consistency:** Model maintains design system coherence across all slides
- **Quality:** Higher thinking budget = better designer-level specifications

### Accessing Thinking Output:
When `include_thoughts=True`, you can review the model's reasoning process:

```python
for part in response.candidates[0].content.parts:
    if part.thought:
        print("Design Reasoning:", part.text)
    else:
        print("Final Specification:", part.text)
```

This helps you understand WHY the model made certain design choices.

---

## CRITICAL DESIGN PRINCIPLES

### VISUAL HIERARCHY (MANDATORY FOR EVERY SLIDE)

Every slide MUST define:
1. **Primary Focus** (60-70% visual weight) - What dominates?
2. **Secondary Elements** (20-30% visual weight) - What supports?
3. **Tertiary Details** (10% visual weight) - What completes?
4. **Eye Flow Path** - Describe the visual journey (Z-pattern, F-pattern, center-radial, etc.)

### SLIDE ARCHITECTURE RULES

Each slide needs:
- **Visual Anchor** - One dominant element that grounds the design
- **Balance** - Asymmetric or symmetric (specify which and why)
- **Whitespace Strategy** - Where is breathing room?
- **Focal Point** - Where should the eye land first?
- **Visual Weight Distribution** - How are elements balanced?

---

## TASK

Create a complete slide-by-slide design specification document.

### INPUT PARAMETERS
**Company Name:** [COMPANY_NAME]
**Content/Narrative:** [CONTENT_DESCRIPTION]
**Target Audience:** [AUDIENCE_TYPE]
**Presentation Goal:** [GOAL]
**Desired Slide Count:** [NUMBER or "optimize"]

---

## YOUR PROCESS

### PHASE 1: BRAND RESEARCH (CRITICAL - DO NOT SKIP)

**Step 1: Research the company's official brand guidelines**
- Search for: "[COMPANY_NAME] brand guidelines 2024"
- Search for: "[COMPANY_NAME] brand colors logo design"
- Search for: "[COMPANY_NAME] website design style"
- Look for brand asset repositories (Brandfetch, company press kit, Wikipedia brand pages)

**Step 2: Extract and document:**
- **Exact brand colors** (with hex codes - e.g., #F99D1C)
- **Official typography** (font families, weights - e.g., Roboto Bold 700)
- **Brand personality** (adjectives: empowering, modern, innovative, etc.)
- **Brand tagline/mission** (if exists)
- **Logo details** (variations, key visual elements)
- **Visual style** (modern, classic, minimalist, bold, tech-forward, etc.)
- **Recent rebrands** (check for 2023-2024 updates)
- **Industry context** (B2B enterprise vs consumer, tech vs traditional, etc.)

**Step 3: If brand info is limited:**
- Analyze competitor brands in the same industry
- Create a brand-appropriate design system from industry standards
- Document assumptions clearly (e.g., "Since X is a fintech startup, using: Blue for trust, modern sans-serif, etc.")

---

### PHASE 2: CONTENT ARCHITECTURE ⭐ ENHANCED

**Step 1: Narrative Mapping**
- Map the story arc (setup → conflict/challenge → solution → results)
- Identify emotional beats (where to inspire, where to inform, where to convince)
- Determine information density (which slides are data-heavy vs. message-driven)

**Step 2: Slide Architecture Planning**

For the ENTIRE deck, create this table:

| Slide # | Purpose | Info Density | Visual Approach | Hierarchy Type |
|---------|---------|--------------|-----------------|----------------|
| 1 | Title | Low | Bold impact | Center-dominant |
| 2 | Overview | Medium | Organized structure | Grid/list |
| 3 | Problem | Low | Emotional visual | Asymmetric |
| ... | ... | ... | ... | ... |

**Information Density Definitions:**
- **Low:** 1-5 words, one concept, one visual
- **Medium:** 10-20 words, 2-3 concepts, multiple visuals
- **High:** 20-30 words, 3-5 concepts, complex diagram/chart

**Visual Approach Types:**
- **Impact:** Dominant single visual, minimal text
- **Comparison:** Side-by-side or split-screen
- **Process:** Linear or circular flow
- **Data:** Charts, graphs, metrics
- **Story:** Narrative visual with supporting elements

**Hierarchy Types:**
- **Center-dominant:** Eye goes to center, radiates out
- **Z-pattern:** Top-left → top-right → bottom-left → bottom-right
- **F-pattern:** Left-aligned, eye scans like reading
- **Asymmetric:** 60/40 or 70/30 split with visual anchor
- **Symmetric:** Balanced left/right or top/bottom
- **Radial:** Center hub with elements around periphery

---

### PHASE 3: DETAILED SLIDE SPECIFICATIONS ⭐ ENHANCED

For EACH slide, provide the following complete specification:

---

#### SLIDE [NUMBER]: [DESCRIPTIVE NAME]

**Headline:** [Main headline text]
**Subhead:** [Supporting headline if needed]

---

**🎯 VISUAL HIERARCHY & ARCHITECTURE**

**Information Density:** [Low/Medium/High]
**Visual Approach:** [Impact/Comparison/Process/Data/Story]
**Eye Flow Pattern:** [Z-pattern/F-pattern/Center-radial/Custom - describe the path]

**Visual Weight Distribution:**
1. **PRIMARY (60-70%):** [What element dominates? Describe size, color, position]
2. **SECONDARY (20-30%):** [What supports the primary? How does it complement?]
3. **TERTIARY (10%):** [What completes the design? Where is it placed?]

**Focal Point Strategy:**
- **First Eye Contact:** [Where does the eye land first? Why was this chosen?]
- **Visual Path:** [Step-by-step: eye goes from → to → to → final resting point]
- **Retention Element:** [What should they remember? How is it visually emphasized?]

**Layout Architecture:**
- **Grid Structure:** [How many columns/rows? Specific dimensions if applicable]
- **Balance Type:** [Asymmetric 70/30 / Symmetric 50/50 / Center-dominant / Other]
- **Anchor Element:** [What grounds the design? Where is it positioned?]
- **Whitespace Strategy:** [Where is breathing room intentionally placed? Percentage of slide?]

---

**📐 DETAILED VISUAL DESIGN**

**Background:**
- **Color:** [Exact hex code: #XXXXXX]
- **Pattern/Texture:** [Describe specifically: circuit pattern, subtle gradient, solid, etc.]
- **Gradient:** [If applicable: Start #XXXXXX → End #XXXXXX, direction: top-to-bottom/radial/etc.]
- **Visual Weight:** [How much does background contribute to overall design? 0-10%]

**Primary Visual Element:** [This should be your PRIMARY in hierarchy - 60-70% weight]
- **Type:** [Icon/Diagram/Photo/Illustration/Chart/3D object/Typography]
- **Position:** [Exact placement: "Center", "Left 30% of slide", "Top right quadrant", etc.]
- **Size:** [Pixels or percentage: "40% of slide width", "300x300px", "800px wide"]
- **Style:** [Flat/3D/Line art/Photorealistic/Isometric/Abstract/Geometric]
- **Colors:** [List all hex codes used in this element]
- **Visual Weight:** [60-70% - should dominate the composition]
- **Relationship to Text:** [Does text overlay image? Wrap around? Separate space? Describe spatial relationship]

**Secondary Visual Elements:** [These should be SECONDARY in hierarchy - 20-30% combined weight]
- **Element 1:**
  - Type: [What is it?]
  - Position: [Where on slide?]
  - Size: [Dimensions]
  - Style: [Visual style]
  - Colors: [Hex codes]
  - Visual weight: [~15-20%]
- **Element 2:** [If applicable]
  - [Same detailed specs]
  - Visual weight: [~10-15%]

**Tertiary Visual Elements:** [These should be TERTIARY in hierarchy - 5-10% combined weight]
- **Element 1:** [Small icons, accents, decorative elements]
  - Type, position, size, style, colors
  - Visual weight: [~5%]
- **Element 2:** [If applicable]
  - [Same specs]

---

**📝 TYPOGRAPHY HIERARCHY**

**Headline:** [This should be PRIMARY or HIGH SECONDARY in visual weight]
- **Font:** [Family (e.g., Roboto), exact weight (300/400/500/700/900)]
- **Size:** [Exact point size: e.g., "64pt" or range: "60-72pt"]
- **Color:** [Exact hex code: #XXXXXX]
- **Position:** [Exact placement: "Top center", "Left aligned 80px from top", etc.]
- **Alignment:** [Left/Center/Right/Justified]
- **Visual Weight:** [What % of total slide attention does it command? 15-25%?]
- **Relationship to Visual:** [Above/Below/Overlaid on visual/Separated by whitespace]

**Subhead:** [This should be SECONDARY in visual weight]
- **Font:** [Family, exact weight]
- **Size:** [Exact pt size: e.g., "28pt"]
- **Color:** [Hex code]
- **Position:** [Where relative to headline?]
- **Alignment:** [Left/Center/Right]
- **Visual Weight:** [Lower than headline - typically 8-12%]
- **Line Height:** [For readability: e.g., "1.5" or "42px"]

**Body Text:** [This should be TERTIARY if present at all - minimize on slides]
- **Font:** [Family, exact weight]
- **Size:** [Minimum 18pt for readability]
- **Color:** [Hex code]
- **Position:** [Where on slide?]
- **Alignment:** [Left/Center/Right]
- **Line Height:** [1.6-1.8 recommended for readability]
- **Max Line Length:** [60-80 characters or specific px width for optimal reading]
- **Visual Weight:** [5-8% maximum]

**Special Text Elements:** (Stats, quotes, labels, callouts)
- **Element 1 (e.g., Large Stat):**
  - Font: [Family, weight]
  - Size: [e.g., "120pt for impact stat"]
  - Color: [Hex code - often accent color]
  - Position: [Where?]
  - Visual Weight: [Can be PRIMARY if stat-focused slide]
- **Element 2 (e.g., Quote):**
  - [Same level of detail]

---

**🎨 COLOR & CONTRAST HIERARCHY**

**Color Palette for This Slide:**
- **Dominant Color:** [Hex: #XXXXXX] - [Usage: "Large background areas, 50% of visible slide"]
- **Accent Color:** [Hex: #XXXXXX] - [Usage: "Primary visual, key icons, 30% of slide"]
- **Supporting Color:** [Hex: #XXXXXX] - [Usage: "Secondary elements, borders, 15% of slide"]
- **Text Color:** [Hex: #XXXXXX] - [Usage: "All typography, 5% of slide area"]

**Contrast Strategy:**
- **Highest Contrast Element:** [Which element gets maximum contrast against background? Why? This draws attention.]
- **Medium Contrast:** [Supporting elements - still visible but don't compete with primary]
- **Low Contrast:** [Subtle background elements, decorative patterns]
- **Contrast Ratios:** [Specify for accessibility: e.g., "Headline: 7:1", "Body text: 4.5:1"]

---

**📏 SPACING & MEASUREMENTS**

**Margins:**
- Top: [px]
- Right: [px]
- Bottom: [px]
- Left: [px]
- **Safe Zone:** [Define area where critical content must live: e.g., "80px from all edges"]

**Element Spacing:**
- **Between headline and subhead:** [px]
- **Between headline and primary visual:** [px]
- **Between visual and body text:** [px]
- **Between list items (if applicable):** [px]
- **Card padding (if using cards):** [px internal padding]
- **Gutter width (if multi-column):** [px]

**Visual Breathing Room:**
- **Whitespace Percentage:** [What % of slide is intentionally empty? Good slides: 30-50%]
- **Where:** [Which areas have most whitespace? Top/bottom/sides/around focal point?]

---

**✨ VISUAL EFFECTS & DEPTH**

**Shadows:**
- **Primary Element Shadow:**
  - Element: [Which element?]
  - Style: [e.g., "X: 0px, Y: 4px, Blur: 12px, Spread: 0px"]
  - Color: [Hex with opacity: "rgba(0, 0, 0, 0.15)" or "#000000 at 15% opacity"]
  - Purpose: [Create depth/separation/emphasis/card effect]
- **Secondary Element Shadow:** [If applicable]
  - [Same specs]

**Depth Layers:** (Front to back - creates visual depth)
1. **Foreground:** [What's closest to viewer? Highest contrast, sharpest details]
2. **Midground:** [Main content layer - where most action happens]
3. **Background:** [What recedes? Lower contrast, subtle patterns]

**Other Effects:**
- **Glows:** [If applicable: Element, color, intensity, purpose]
- **Gradients:** [Beyond background: any gradient overlays on images/shapes?]
- **Opacity:** [Any semi-transparent elements? Value and purpose?]

---

**♿ ACCESSIBILITY & READABILITY**

- **Text Contrast Ratio:** [Minimum 4.5:1 for body text, 3:1 for large text (18pt+)]
  - Headline: [Calculated ratio: X:1]
  - Body: [Calculated ratio: X:1]
- **Color Blind Safe:** [Verify primary/secondary colors are distinguishable - don't rely solely on red/green]
- **Font Size Minimum:** [18pt for body text minimum, 14pt absolute minimum for any text]
- **Scannability:** [Can viewer grasp main point in 3 seconds? YES/NO - if no, simplify]
- **Reading Level:** [Is text simple and clear? Avoid jargon unless industry-specific audience]

---

**🧠 DESIGN RATIONALE**

**Why This Hierarchy:**
[2-3 sentences explaining why this specific visual hierarchy supports the content goal. Example: "The large stat dominates because this slide's goal is to shock with a number. Supporting text provides context but doesn't compete. This creates instant impact followed by understanding."]

**Why This Architecture:**
[2-3 sentences explaining why this layout pattern serves the message. Example: "Asymmetric 70/30 split creates dynamic tension and prevents boredom. The 70% visual side tells the emotional story while the 30% text side provides rational support. This layout engages both left and right brain."]

**Expected Viewer Experience:**
[What should the viewer feel/think/do when seeing this slide? Example: "Viewer should feel inspired and energized. First impression: 'Wow, 300%!' Second thought: 'How did they do that?' Emotion: Motivated to learn the method."]

---

[Repeat this complete specification for ALL slides in the deck]

---

### PHASE 4: COMPREHENSIVE DESIGN SYSTEM

After all slide specifications, provide:

---

## DESIGN SYSTEM DOCUMENTATION

### Official Brand Guidelines Summary

**Company:** [Company Name]
**Industry:** [Industry/Sector]
**Brand Personality:** [3-5 adjectives describing brand character]
**Target Audience:** [Who they serve]

**Brand Colors:**
- **Primary:** [Color Name] - [Hex: #XXXXXX]
  - **Usage:** [When to use: logos, headlines, primary CTAs, etc.]
  - **RGB:** [R, G, B values]
  - **CMYK (if print):** [C, M, Y, K values]
- **Secondary:** [Color Name] - [Hex: #XXXXXX]
  - **Usage:** [When to use]
  - **RGB:** [Values]
- **Accent:** [Color Name] - [Hex: #XXXXXX]
  - **Usage:** [When to use]
  - **RGB:** [Values]
- **Neutral Dark:** [Hex: #XXXXXX] - [Usage: body text, dark backgrounds]
- **Neutral Light:** [Hex: #XXXXXX] - [Usage: light backgrounds, subtle elements]
- **White:** #FFFFFF
- **Black:** #000000 [If used]

**Brand Research Sources:**
- [List sources: Brandfetch, company website, press kit, Wikipedia, etc.]

---

**Typography System:**

**Primary Font Family:** [Name (e.g., Roboto)]
- **Source:** [Google Fonts / Adobe Fonts / Custom / etc.]
- **Weights Available:** [List: 100 Thin, 300 Light, 400 Regular, 500 Medium, 700 Bold, 900 Black]
- **License:** [Open source / Commercial / etc.]

**Secondary Font Family (if applicable):** [Name]
- **Source:** [Where to get it]
- **Weights Available:** [List]
- **Usage:** [When to use vs primary font]

**Typography Hierarchy Standards:**
- **Display/Hero (Special impact text):**
  - Font: [Name, Weight]
  - Size Range: [80-180pt]
  - Usage: [Large stats, title slide, hero numbers]
  - Line Height: [0.9-1.1 for tight impact]

- **H1 (Main Slide Headlines):**
  - Font: [Name, Weight: typically 700-900]
  - Size Range: [48-72pt]
  - Usage: [Primary headline on each slide]
  - Line Height: [1.1-1.2]

- **H2 (Subheadlines):**
  - Font: [Name, Weight: typically 500-700]
  - Size Range: [28-36pt]
  - Usage: [Supporting headlines, section headers]
  - Line Height: [1.2-1.3]

- **H3 (Tertiary Headlines):**
  - Font: [Name, Weight: typically 500-600]
  - Size Range: [20-24pt]
  - Usage: [Card headers, labels]
  - Line Height: [1.3]

- **Body Text:**
  - Font: [Name, Weight: typically 400]
  - Size Range: [18-20pt minimum for slides]
  - Usage: [Supporting text, paragraphs]
  - Line Height: [1.5-1.8 for readability]

- **Captions/Small Text:**
  - Font: [Name, Weight: 400]
  - Size Range: [14-16pt MINIMUM]
  - Usage: [Image captions, footnotes, disclaimers]
  - Line Height: [1.4]

**Logo Usage:**
- **Variations Available:** [Full color / White version / Black version / Icon only / etc.]
- **Minimum Size:** [e.g., "Logo must be at least 100px wide"]
- **Clear Space:** [e.g., "Maintain space equal to height of logo element around all sides"]
- **Placement:** [Typical: top-right or bottom-center on slides]

---

### Icon System

**Style:** [Line icons / Filled icons / 3D / Isometric / Duotone / etc.]
**Stroke Weight:** [For line icons: 2px standard, 1.5px for small, 3px for large]
**Corner Radius:** [If rounded: e.g., "2px radius on icon corners"]
**Color Rules:**
- Primary icons: [When to use brand primary color]
- Secondary icons: [When to use secondary/accent colors]
- Background circles: [Describe: e.g., "80px circle, brand primary color, white icon inside"]
**Size Standards:**
- Small: [32-48px for inline icons]
- Medium: [64-80px for card headers, list icons]
- Large: [100-150px for feature icons, main slide visuals]
**Source/Library:** [Font Awesome / Custom / Noun Project / etc.]
**Style Consistency:** [All icons should match: all line, or all filled, never mixed]

---

### Layout Principles

**Grid System:**
- **Columns:** [e.g., 12-column grid]
- **Gutter Width:** [Space between columns: e.g., 20px]
- **Total Slide Width:** [e.g., 1920px for 16:9 HD]
- **Total Slide Height:** [e.g., 1080px for 16:9 HD]

**Margins & Safe Zones:**
- **Standard Margin:** [e.g., 80px from all edges]
- **Safe Zone:** [e.g., 100px from edges - critical content must stay within]
- **Bleed Zone (if print):** [e.g., extend backgrounds 10px beyond slide edge]

**Alignment Rules:**
- **Headlines:** [Typically left or center, never right unless specific design reason]
- **Body Text:** [Left-aligned for readability, centered only for short phrases]
- **Images:** [Can be any alignment but should follow grid]
- **Consistency:** [Once you choose left-align for headlines, stay consistent across deck]

**White Space Philosophy:**
- **Target:** [30-50% of each slide should be intentional whitespace]
- **Purpose:** [Creates breathing room, guides eye, prevents overwhelm]
- **Where:** [Around focal point, margins, between sections]

---

### Color Usage Rules

**Backgrounds:**
- **Primary Background:** [When to use: e.g., White for most content slides]
- **Dark Background:** [When to use: e.g., Title slide, high-impact moments, results]
- **Accent Background:** [When to use: e.g., Callout slides, transitions, special emphasis]
- **Gradient Backgrounds:** [When allowed: e.g., Title slide, closing slide]

**Text on Backgrounds:**
- **Dark Text (#444444) on Light Backgrounds (#FFFFFF, #F5F5F5)**
- **White Text (#FFFFFF) on Dark Backgrounds (#444444, #000000)**
- **Accent Color Text:** [Only use for short headlines on white background, never on colored backgrounds]
- **NEVER:** [List forbidden combinations: e.g., "Never orange text on gray background - fails contrast"]

**Accent Color Usage:**
- **Use For:** [CTAs, icons, highlights, key stats, borders, underlines]
- **Maximum:** [Use sparingly - should not exceed 30% of slide]
- **Purpose:** [Draw attention to most important element]

**Color Combinations That Work:**
- [List 3-5 proven combinations from brand: e.g., "White background + Brand primary headline + Dark gray body text + Accent orange icons"]

**Color Combinations to AVOID:**
- [List forbidden combinations: e.g., "Never primary blue on secondary purple - poor contrast"]

---

### Visual Style Guidelines

**Photography Style (if using photos):**
- **Subject Matter:** [People in action / Products / Abstract / Landscapes / etc.]
- **Tone:** [Light and airy / Dark and moody / High contrast / etc.]
- **Treatment:** [Full color / Duotone with brand colors / Black and white / etc.]
- **Overlays:** [Brand color overlay at X% opacity / None / Gradient overlay / etc.]

**Illustration Style (if using illustrations):**
- **Style:** [Flat design / Isometric / 3D / Line art / Abstract / Geometric / etc.]
- **Complexity:** [Simple and minimal / Detailed and rich / Medium complexity]
- **Color Palette:** [Strictly brand colors only / Extended palette allowed / etc.]
- **Tone:** [Friendly and playful / Professional and serious / Modern and tech / etc.]

**Data Visualization Standards:**
- **Chart Types:** [Bar / Line / Pie / Donut / Area / etc. - which are brand-appropriate?]
- **Colors:** [Use brand colors in specific order: Primary for main data, Accent for comparison, etc.]
- **Grid Lines:** [Subtle gray (#CCCCCC) / None / etc.]
- **Labels:** [Always label axes, use brand typography, minimum 14pt]
- **Legends:** [Position: top-right or bottom, use brand colors]

**Iconography & Visual Metaphors:**
- **Metaphors to Use:** [List brand-appropriate metaphors: e.g., "Flames for energy, Upward arrows for growth, Network nodes for connection"]
- **Metaphors to Avoid:** [List: e.g., "Avoid cliché lightbulbs for ideas, handshakes for partnerships"]
- **Visual Language:** [Describe consistent visual vocabulary used throughout]

---

### Slide Architecture Patterns Used in This Deck

| Pattern Name | Used in Slides | Purpose | Visual Structure | Info Density |
|--------------|----------------|---------|------------------|--------------|
| Hero Impact | 1, 11 | Grab attention, showcase key stat/image | Center-dominant, 70% visual, minimal text | Low |
| Split Compare | 4, 7 | Show contrast, before/after, options | 50/50 or 60/40 asymmetric split | Medium |
| Process Flow | 2, 8, 9 | Show sequence, steps, workflow | Linear left→right or circular | Medium |
| Data Focus | 5, 6 | Emphasize metrics, prove with numbers | Numbers dominate (60%), visual supports | Medium-High |
| Story Canvas | 10 | Build emotional connection, show human element | Asymmetric, large image (70%), supporting text | Low |
| List Structure | 3 | Organize information, show components | F-pattern, icon+text cards in grid | Medium |

---

### Visual Hierarchy Strategies by Slide Type

**Title/Opening Slides:**
- **Primary (70%):** Visual impact element (large number, hero image, or bold logo)
- **Secondary (20%):** Headline text (large, bold)
- **Tertiary (10%):** Subtext, tagline, or branding
- **Eye Flow:** Center-radial (eye goes to center, then reads text)

**Content/Information Slides:**
- **Primary (50%):** Primary visual (diagram, icon set, illustration)
- **Secondary (30%):** Supporting text (headline + key points in list)
- **Tertiary (20%):** Secondary visuals (small icons, accents)
- **Eye Flow:** Z-pattern or asymmetric split

**Data/Metrics Slides:**
- **Primary (60%):** Chart/graph or large stat number
- **Secondary (25%):** Key insight text (what the data means)
- **Tertiary (15%):** Context (labels, legend, source)
- **Eye Flow:** Eye to number/chart first, then to insight

**Comparison Slides:**
- **Primary (80% combined):** Two equal-weight elements side-by-side (40% each)
- **Secondary (15%):** Supporting labels or headlines
- **Tertiary (5%):** Icons or decorative elements
- **Eye Flow:** Left to right comparison

**Process/Flow Slides:**
- **Primary (60%):** The flow diagram or step sequence
- **Secondary (30%):** Step labels and descriptions
- **Tertiary (10%):** Connectors, arrows, decorative elements
- **Eye Flow:** Follows the process (left→right for linear, clockwise for circular)

**Closing/CTA Slides:**
- **Primary (40%):** Call-to-action element or next steps
- **Secondary (40%):** Brand element (logo, tagline, visual identity)
- **Tertiary (20%):** Contact info or supporting details
- **Eye Flow:** Center or top-to-bottom

---

### Accessibility Standards

**WCAG Compliance Level:** [Target: AA minimum, AAA preferred]

**Color Contrast Requirements:**
- **Normal Text (< 18pt):** Minimum 4.5:1 contrast ratio
- **Large Text (≥ 18pt or ≥ 14pt bold):** Minimum 3:1 contrast ratio
- **Non-Text Elements (icons, graphs):** Minimum 3:1 contrast ratio

**Font Size Requirements:**
- **Absolute Minimum:** 14pt (use only for captions/footnotes)
- **Body Text Minimum:** 18pt (for comfortable reading from distance)
- **Headline Minimum:** 28pt
- **Optimal:** 20pt+ for body, 48pt+ for headlines

**Color Blindness Considerations:**
- **Don't rely solely on color:** Use icons, patterns, or labels in addition to color
- **Avoid red/green alone:** Use blue/orange or add texture/shape differences
- **Test palettes:** Verify brand colors are distinguishable with color blindness simulators

**Readability Best Practices:**
- **Line Length:** 60-80 characters maximum per line for body text
- **Line Height:** 1.5-1.8 for body text (more space = easier reading)
- **Paragraph Length:** Keep short on slides (2-4 lines maximum)
- **Font Choice:** Avoid thin weights (< 300), script fonts, or decorative fonts for body text

---

### Production Notes for Designers

**1. Asset Requirements:**

**Fonts Needed:**
- [List all fonts with download links]
- [Note if fonts need licenses for commercial use]

**Logos & Brand Assets:**
- Company logo (SVG preferred, PNG fallback at 2x resolution)
- Variations: [Full color, White, Black, Icon only]
- Source: [Where to download - Brandfetch, company press kit, etc.]

**Images/Photos:**
- [List any specific photos needed]
- Source: [Unsplash, Company library, Stock service, etc.]
- Resolution: [Minimum 1920px wide for full-bleed]

**Icons:**
- Library: [Font Awesome, Noun Project, Custom, etc.]
- Style: [Must match specified style]
- Format: [SVG vector preferred]

**2. File Setup:**

**Slide Dimensions:**
- Aspect Ratio: [16:9 standard / 4:3 classic / Custom]
- Pixel Dimensions: [1920 x 1080 for 16:9 HD / 3840 x 2160 for 4K]
- Print Dimensions (if applicable): [e.g., 10" x 5.625" for 16:9 at 192 DPI]

**Working Resolution:**
- Screen presentations: [72-96 DPI sufficient]
- Print presentations: [300 DPI minimum]

**Color Mode:**
- Screen: RGB
- Print: CMYK (convert before printing, colors may shift slightly)

**Safe Zones:**
- Content Safe Zone: [e.g., 100px margin from edges]
- Text Safe Zone: [e.g., 120px margin - ensure no text is cut off]

**3. Software Recommendations:**

- **PowerPoint:** [Most compatible, use master slides for consistency]
- **Keynote:** [Best for Mac, beautiful transitions]
- **Google Slides:** [Web-based, easy sharing but limited design features]
- **Adobe InDesign:** [For print decks, precise control]
- **Figma/Sketch:** [For design mockups before building in presentation software]

**4. Export Specifications:**

**For Digital Presentation:**
- Format: [PDF (for sharing) / PPTX (for editing) / Keynote / etc.]
- Compression: [Medium to High quality - balance file size and quality]
- Embedded Fonts: [YES - ensures fonts display correctly on all devices]
- File Naming: [CompanyName_PresentationTitle_Date_v1.pptx]

**For Print:**
- Format: [PDF/X-1a (preferred) or High-Quality PDF]
- Resolution: [300 DPI minimum]
- Color Mode: [CMYK]
- Bleed: [0.125" (3mm) beyond trim if backgrounds extend to edge]

**For Video/Recording:**
- Format: [MP4 / MOV]
- Resolution: [1920x1080 (Full HD) or 3840x2160 (4K)]
- Frame Rate: [30fps standard]

**5. Animation Guidelines (if applicable):**

**Transitions Between Slides:**
- **Recommended:** Fade (300-500ms) or None
- **Avoid:** Spinning, bouncing, dissolving, or any "cute" effects
- **Consistency:** Use same transition throughout or none at all

**Element Animations (On-Slide):**
- **Entrance:** Fade In (300ms) or Scale Up (from 95% to 100% in 400ms)
- **Emphasis:** Color change, bold, or subtle pulse (avoid shaking/bouncing)
- **Exit:** Fade Out (300ms) or Scale Down
- **Timing:** Sequential reveals should be 500ms apart minimum
- **Easing:** Use "ease-out" or "ease-in-out" (not linear - feels robotic)

**Animation Philosophy:**
- **Subtle and Professional:** Animations should guide attention, not distract
- **Purposeful:** Only animate if it serves the content (revealing data points step-by-step, building a diagram)
- **Enterprise Appropriate:** Avoid playful animations unless brand is playful
- **Accessibility:** Provide a "no animation" version for those with motion sensitivity

**6. Quality Control Checklist:**

Before delivery, verify:
- [ ] All brand colors match exactly (hex codes verified)
- [ ] All fonts are embedded/outlined
- [ ] All images are high resolution (no pixelation)
- [ ] All text is readable from 10 feet away (test on TV/projector)
- [ ] Contrast ratios meet accessibility standards
- [ ] Consistent alignment across all slides
- [ ] Consistent spacing and margins
- [ ] Spell check and grammar check completed
- [ ] No orphaned text (single word on final line)
- [ ] All links work (if interactive)
- [ ] Slide numbers are correct
- [ ] Copyright/attribution for images if required
- [ ] File size is reasonable for sharing (< 50MB preferred, < 100MB maximum)

---

## OUTPUT QUALITY CHECKLIST ⭐

Before finalizing your specification document, verify:

**Hierarchy & Architecture:**
- [ ] Every slide has defined PRIMARY (60-70%), SECONDARY (20-30%), TERTIARY (10%)
- [ ] Visual weight percentages add up to 100% for each slide
- [ ] Eye flow path is explicitly described for each slide
- [ ] Focal point strategy is clear for each slide
- [ ] Balance type is specified (asymmetric/symmetric/center-dominant)
- [ ] Whitespace strategy is documented with percentages
- [ ] Slide architecture overview table is complete

**Specifications:**
- [ ] All hex codes specified (no generic "blue" or "orange" - must be exact)
- [ ] All font weights are exact numbers (300/400/700/900, not "bold" or "regular")
- [ ] All sizes have units (px, pt, %)
- [ ] Every visual element has exact color specification
- [ ] Layout percentages provided for split-screen designs (e.g., 60/40, 70/30)
- [ ] Icon styles consistently described across all slides
- [ ] Typography hierarchy is complete (Display, H1, H2, H3, Body, Caption)
- [ ] Spacing measurements provided (margins, padding, gutters)

**Brand Research:**
- [ ] Brand colors documented with hex codes and RGB values
- [ ] Typography identified with font family, weights, and sources
- [ ] Brand personality described with specific adjectives
- [ ] Brand research sources listed (Brandfetch, website, etc.)
- [ ] Recent rebrand information included (2023-2024 updates)
- [ ] If brand info limited: assumptions are clearly documented

**Architecture Quality:**
- [ ] Information density varies across deck (not all slides the same - mix of low/medium/high)
- [ ] Visual approaches are diverse (impact, comparison, process, data, story - not repetitive)
- [ ] Slide architecture planning table is complete with all slides
- [ ] Each slide has clear design rationale (why this hierarchy, why this layout)
- [ ] Architecture patterns are identified and documented

**Designer Readiness:**
- [ ] Designer can execute without asking questions (all details provided)
- [ ] Visual descriptions paint a clear mental picture
- [ ] Architecture patterns are reusable and well-documented
- [ ] Measurements are specific (not "large" but "300px" or "40% of slide")
- [ ] Color relationships are clear (what goes on what background)
- [ ] Production notes are comprehensive

**Accessibility:**
- [ ] Contrast ratios calculated and meet WCAG AA minimum
- [ ] Font sizes meet minimums (18pt body, 28pt headlines minimum)
- [ ] Color blind considerations addressed
- [ ] Readability best practices followed

**Completeness:**
- [ ] All slides specified (not just first few as examples)
- [ ] Design system can be used as standalone reference
- [ ] Production notes are comprehensive
- [ ] Quality control checklist provided for designers

---

## FORMATTING STANDARDS

**Structure your complete output as follows:**

```markdown
# [COMPANY NAME] PRESENTATION DESIGN SPECIFICATIONS

## EXECUTIVE SUMMARY
[3-5 sentences: What does this deck achieve? What's the story? Who's the audience? What's the desired outcome?]

---

## DECK ARCHITECTURE OVERVIEW

[Insert the slide architecture planning table here showing all slides at a glance]

---

## BRAND RESEARCH & GUIDELINES

### Research Sources
[List all sources used]

### Brand Colors
[Complete color palette with hex, RGB, usage]

### Typography
[Complete font system]

### Brand Personality
[Description of brand character]

### Logo & Visual Identity
[Logo usage rules]

---

## DETAILED SLIDE SPECIFICATIONS

### SLIDE 1: [NAME]
[Complete specification using the enhanced template provided above]

### SLIDE 2: [NAME]
[Complete specification using the enhanced template provided above]

### SLIDE 3: [NAME]
[Complete specification using the enhanced template provided above]

[...continue for ALL slides in the deck...]

---

## COMPREHENSIVE DESIGN SYSTEM

[All sections from Phase 4: Brand guidelines, Icon system, Layout principles, Color rules, Visual style, Architecture patterns, Hierarchy strategies, Accessibility standards]

---

## PRODUCTION NOTES FOR DESIGNERS

[All technical requirements: assets, file setup, software, export specs, animation guidelines, quality control checklist]

---
```

---

## TONE & STYLE REQUIREMENTS

Your output should:
- **Be extremely detailed and specific** - Leave no room for interpretation
- **Use professional design terminology** - Grid, hierarchy, kerning, leading, etc.
- **Include exact measurements** - Never "big" or "small", always "64px" or "40%"
- **Provide rationale** - Explain WHY each design choice supports the goal
- **Be organized and scannable** - Use clear headers, bullets, tables
- **Paint a clear picture** - Descriptions should be vivid enough to visualize without seeing the slide
- **Anticipate questions** - Answer designer questions before they're asked
- **Be actionable** - Designer should be able to start building immediately after reading

---

## CONSTRAINTS

- **Minimal text on slides** (maximum 10-15 words per slide, fewer is better)
- **Visual-first approach** (more graphics, less text - slides are visual aids, not documents)
- **Professional, polished aesthetic** (enterprise-grade, not amateur)
- **Brand-consistent throughout** (every slide should feel like same brand)
- **Designer-level execution quality** (should look like $10k agency work, not DIY)
- **Accessibility compliant** (WCAG AA minimum)

---

## EXAMPLE INPUT FORMAT

When using this prompt, fill in:

```
Company Name: SolarWinds
Content/Narrative: Sales workflow presentation showing how a rep achieved 300% quota through strategic messaging, targeting, calling, and persistence. Includes specific tactics like email tracking, persona-based pivoting, and relationship building.
Target Audience: Internal sales team, sales managers
Presentation Goal: Train other sales reps on successful methodology, inspire with results
Desired Slide Count: 12-13 slides
```

---

## NOW EXECUTE

Please create the complete slide deck specification following this enhanced methodology for:

**Company Name:** [INSERT]
**Content/Narrative:** [INSERT]
**Target Audience:** [INSERT]
**Presentation Goal:** [INSERT]
**Desired Slide Count:** [INSERT or "optimize"]

Remember:
- Research the brand thoroughly (Phase 1)
- Plan the deck architecture (Phase 2)
- Specify every slide in complete detail (Phase 3)
- Document the design system (Phase 4)
- Provide production notes

Your output should be so detailed that a graphic designer can execute the entire deck without asking a single clarifying question.
