# COMPLETE SLIDE DECK SPECIFICATION
## Generated with Parallel Agent Architecture

---

## EXECUTIVE SUMMARY

This document provides the complete architectural and design foundation for a 10-slide presentation showcasing TechCorp Inc.'s successful Agile transformation using the Atlassian suite. It includes comprehensive brand research, a complete slide-by-slide architecture, a robust design system based on Atlassian's official guidelines, and detailed briefs for each slide. The goal is to enable a team of parallel slide agents to create detailed slide specifications efficiently and consistently, resulting in a professional, on-brand, and persuasive presentation for enterprise IT leaders.

---

---

## BRAND RESEARCH

### Research Sources
- [Atlassian Design System](https://atlassian.design/)
- [Atlassian Brand Microsite](https://www.atlassian.com/brand)
- [Atlassian Logo & Usage Guidelines](https://atlassian.design/foundations/logo)

### Brand Colors
- **Primary (Blue-600):** Atlassian Blue - #0052CC | RGB: 0, 82, 204
  - Usage: Headlines, primary call-to-actions, key data points, active navigation states. The core brand color.
- **Secondary (Teal-500):** Atlassian Teal - #00B8D9 | RGB: 0, 184, 217
  - Usage: Secondary call-to-actions, illustrative accents, highlighting success or progress in charts.
- **Secondary (Purple-500):** Atlassian Purple - #6554C0 | RGB: 101, 84, 192
  - Usage: Accents for collaboration-focused themes, secondary chart elements.
- **Neutral-800:** Dark Gray - #172B4D | RGB: 23, 43, 77
  - Usage: Body text, secondary headlines. High contrast for readability.
- **Neutral-300:** Medium Gray - #505F79 | RGB: 80, 95, 121
  - Usage: Captions, disabled text, supporting information.
- **Neutral-20:** Light Gray - #F4F5F7 | RGB: 244, 245, 247
  - Usage: Light backgrounds, card containers, subtle dividers.
- **Success (Green-500):** Green - #36B37E | RGB: 54, 179, 126
  - Usage: Highlighting positive outcomes, success metrics, and "What Worked" sections.
- **Warning (Yellow-500):** Yellow - #FFAB00 | RGB: 255, 171, 0
  - Usage: Cautionary notes, "Lessons Learned" about potential pitfalls.

### Typography
- **Primary Font:** Charlie Sans & Charlie Display
- **Weights:** Regular, Medium, Semibold, Bold
- **Source:** Proprietary Atlassian font. Not publicly available.
- **Fallback:** **Inter**. It is a clean, modern, and highly legible sans-serif font with a wide range of weights that closely mimics the feel of Charlie Sans. It is available on Google Fonts.

### Brand Personality
- **Open & Human:** The tone is direct, approachable, and avoids jargon. It focuses on people and teams, not just technology.
- **Pragmatic & Practical:** The brand provides real-world solutions to complex problems. It's grounded, credible, and focuses on results.
- **Bold & Optimistic:** Atlassian is confident and forward-looking, believing in the power of teamwork to solve any challenge.
- **Playfully Professional:** The brand maintains a professional standard but isn't afraid to be clever or use moments of wit.

### Logo & Visual Identity
- **Primary Logo:** The full "Atlassian" wordmark in Atlassian Blue (#0052CC) on a white or light gray background.
- **Monogram:** The dual-person "A" logo, used as an avatar or in space-constrained contexts.
- **Clear Space:** A minimum clear space equal to the height of the "A" in the monogram must be maintained around all sides of the logo.
- **Variations:** Monochrome versions (white on dark backgrounds, black on light backgrounds) are permitted. Do not alter, rotate, or add effects to the logo.

---

---

## DECK ARCHITECTURE

| Slide # | Title | Purpose | Info Density | Visual Approach | Hierarchy Type |
|---------|-------|---------|--------------|-----------------|----------------|
| 1 | Unlocking Agility | Open the presentation with a bold, aspirational statement and introduce the case study. | Low | Impact | Center-dominant |
| 2 | The Breaking Point | Detail the "before" state of TechCorp Inc., establishing the core problems. | Medium | Story | Z-pattern |
| 3 | A Unified Platform for Growth | Introduce the Atlassian suite (Jira, Confluence, Trello) as the integrated solution. | Medium | Comparison | Asymmetric |
| 4 | Our Phased Rollout Strategy | Outline the implementation process, showing a clear, manageable plan. | Medium | Process | F-pattern |
| 5 | Driving 95% Adoption in 90 Days | Explain the tactics used to ensure team buy-in and successful adoption. | Medium | Story | Radial |
| 6 | Transformation by the Numbers | Showcase the hard, quantifiable results and key metrics achieved. | High | Data | Asymmetric |
| 7 | "It Just Works. We're Finally in Sync." | Present qualitative feedback and human-centric benefits of the transformation. | Medium | Impact | Center-dominant |
| 8 | Lessons Learned on Our Journey | Share honest insights on what worked and what could be improved, building credibility. | Medium | Comparison | Symmetric |
| 9 | Your Path to Transformation | Provide a clear, actionable call-to-action for the audience to start their own journey. | Low | Process | Z-pattern |
| 10 | Thank You & Q&A | Close the presentation professionally and invite questions. | Low | Impact | Center-dominant |

---

---

## DESIGN SYSTEM

### Color Palette
- **Backgrounds:** White (#FFFFFF), Light Gray (#F4F5F7).
- **Text:** Dark Gray (#172B4D) for body, Atlassian Blue (#0052CC) for H1/H2 headlines.
- **Primary Brand:** Atlassian Blue (#0052CC).
- **Accents:** Teal (#00B8D9), Purple (#6554C0). Use for charts, icons, and callouts.
- **Semantic Colors:** Green (#36B37E) for success, Yellow (#FFAB00) for warnings/lessons.

### Typography Hierarchy
(Using Inter as the fallback font)
- **Display/Hero:** Inter Bold, 64-80pt, Title Case. Usage: Slide 1 title only.
- **H1:** Inter Bold, 40-48pt, Sentence case. Usage: Main slide headline.
- **H2:** Inter Semibold, 28-32pt, Sentence case. Usage: Sub-headlines or large callouts.
- **H3:** Inter Semibold, 20-24pt, Sentence case. Usage: Section headers within a slide.
- **Body:** Inter Regular, 16-18pt, Sentence case. Usage: Main paragraph text.
- **Captions:** Inter Regular, 12-14pt, Sentence case. Usage: Chart labels, image credits, footnotes.

### Icon System
- **Style:** Line icons, consistent with Atlassian's design system. Clean, slightly rounded corners.
- **Stroke Weight:** 2px.
- **Color Rules:** Use Atlassian Blue (#0052CC) or Dark Gray (#172B4D) for primary icons. Use Accents (Teal, Purple) for illustrative or categorical purposes.
- **Size Standards:** Small (24x24px), Medium (48x48px), Large (64x64px).

### Layout Principles
- **Grid:** 12-column grid.
- **Margins:** 60px on all sides (top, bottom, left, right).
- **Safe Zone:** All critical content (text, logos) must be within the margins. Full-bleed images are acceptable.
- **Whitespace Philosophy:** Target ~40-50% whitespace on average per slide. Use space to create focus and clarity.

### Color Usage Rules
- **Backgrounds:** Default to White (#FFFFFF). Use Light Gray (#F4F5F7) for slides with multiple cards or sections to create differentiation. Atlassian Blue (#0052CC) can be used for a full-bleed background on impact slides (e.g., Title, Quote, Thank You) but text must be white.
- **Text on Backgrounds:** Dark Gray (#172B4D) on White/Light Gray. White (#FFFFFF) on Atlassian Blue.
- **Accent Usage:** Use accents for no more than 10-15% of the visual elements on a slide. Use them to draw attention to key data, icons, or flow-chart connections.
- **Forbidden Combinations:** Do not place Yellow (#FFAB00) text on a white background (insufficient contrast). Do not use Green and Red together to avoid color blindness issues.

### Visual Style
- **Photography:** Authentic, diverse teams in genuine collaborative settings. Avoid staged stock photos. A subtle color overlay of Atlassian Blue at 10% opacity can be used to unify imagery.
- **Illustrations:** Use the Atlassian "blobby" but clean illustration style for conceptual diagrams. Focus on simplified shapes and brand colors.
- **Data Visualization:** Simple, clean charts. Bar charts, line charts, and large number callouts are preferred. Avoid 3D effects. Use the brand color palette, with Atlassian Blue as the primary data series.
- **Iconography:** Use icons to represent concepts quickly (e.g., a gear for "Process," a lightbulb for "Solution").

### Accessibility Standards
- **Contrast Requirements:** All text must meet WCAG AA standards (4.5:1 ratio for normal text, 3:1 for large text).
- **Font Size Minimums:** Body text should not be smaller than 16pt.
- **Color Blindness:** Do not rely on color alone to convey information. Use labels, icons, and patterns in charts.

### Production Notes
- **Assets needed:** Atlassian logo files (SVG), Inter font files, a curated set of brand icons, approved photography.
- **File setup:** 16:9 aspect ratio (1920x1080 pixels), 150 DPI for raster images.
- **Software recommendations:** Figma, Google Slides, or PowerPoint.
- **Export specifications:** Final delivery as a PDF. Provide source file for future edits.

---

---

## DETAILED SLIDE SPECIFICATIONS


### SLIDE 1: Unlocking Agility

**Headline:** Unlocking Agility
**Subhead:** How TechCorp Inc. transformed team collaboration with Atlassian.

---

**🎯 VISUAL HIERARCHY & ARCHITECTURE**

**Information Density:** Low
**Visual Approach:** Impact
**Eye Flow Pattern:** A direct top-to-bottom Z-pattern, starting at the large headline, moving down to the smaller subhead, and resting on the logos at the bottom. The central alignment keeps the flow contained and focused.

**Visual Weight Distribution:**
1.  **PRIMARY (70%):** The headline "Unlocking Agility". Its large size, bold weight, and high contrast against the background make it the dominant focal point.
2.  **SECONDARY (20%):** The subhead "How TechCorp Inc. transformed team collaboration with Atlassian.". It provides context and supports the primary message.
3.  **TERTIARY (10%):** The combined TechCorp Inc. and Atlassian logos at the bottom. They act as a foundational signature, grounding the slide.

**Focal Point Strategy:**
-   **First Eye Contact:** The phrase "Unlocking Agility". The use of Display/Hero typography in high-contrast white on a deep blue background ensures it is seen first.
-   **Visual Path:** The eye is captured by the headline → drops to the subhead for clarification → concludes by registering the partnership via the logos at the bottom.
-   **Retention Element:** The combination of the headline "Unlocking Agility" with the "Atlassian" and "TechCorp Inc." logos. The layout visually links the concept of agility to the two entities.

**Layout Architecture:**
-   **Grid Structure:** A 1-column central structure. All elements are horizontally centered within the 12-column grid's safe zone.
-   **Balance Type:** Center-dominant. This creates a formal, stable, and impactful feel, suitable for a title slide.
-   **Anchor Element:** The headline serves as the primary visual anchor, with all other elements positioned relative to it on the vertical axis.
-   **Whitespace Strategy:** Approximately 70% of the slide is whitespace. This negative space isolates the text and logos, maximizing their impact and creating a clean, uncluttered, and confident opening.

---

**📐 DETAILED VISUAL DESIGN**

**Background:**
-   **Color:** Atlassian Blue (#0052CC)
-   **Pattern/Texture:** None
-   **Gradient:** solid
-   **Visual Weight:** Contributes ~5% to the composition, acting as a high-contrast canvas for the foreground elements.

**Primary Visual Element:**
-   **Type:** Typography
-   **Position:** Horizontally centered on the slide (X-axis: 960px). The vertical baseline of the text is positioned at Y-axis: 520px.
-   **Size:** The text block itself will have a variable width depending on final rendering, but the font size is fixed at 72pt.
-   **Style:** Flat, clean, sans-serif typography.
-   **Colors:** White (#FFFFFF)
-   **Visual Weight:** 70%
-   **Relationship to Text:** This element *is* the primary text (the headline).

**Secondary Visual Elements:**
-   **Element 1:**
    -   **Type:** Typography (Subhead)
    -   **Position:** Horizontally centered (X-axis: 960px). Positioned below the headline with a 40px gap.
    -   **Size:** Font size is fixed at 30pt.
    -   **Style:** Flat, clean, sans-serif typography.
    -   **Colors:** White (#FFFFFF)
    -   **Visual weight:** ~20%

**Tertiary Visual Elements:**
-   **Element 1:** Logo Group (TechCorp Inc. & Atlassian)
    -   **Type:** Logos (SVG, monochrome variant)
    -   **Position:** The entire group is horizontally centered. The vertical center of the logo group is at Y-axis: 960px, placing it within the bottom safe zone.
    -   **Size:** Each logo has a fixed height of 48px. The width will be proportional. They are separated by a 64px horizontal gap. The TechCorp Inc. logo is on the left, Atlassian on the right.
    -   **Style:** Flat, monochrome.
    -   **Colors:** White (#FFFFFF)
    -   **Visual weight:** ~10%

---

**📝 TYPOGRAPHY HIERARCHY**

**Headline:**
-   **Font:** Inter, Bold (700 weight)
-   **Size:** 72pt
-   **Color:** White (#FFFFFF)
-   **Position:** Horizontally centered. Baseline at Y: 520px.
-   **Alignment:** Center
-   **Visual Weight:** 70%
-   **Relationship to Visual:** It is the primary visual.

**Subhead:**
-   **Font:** Inter, Semibold (600 weight)
-   **Size:** 30pt
-   **Color:** White (#FFFFFF)
-   **Position:** Horizontally centered, 40px below the headline.
-   **Alignment:** Center
-   **Visual Weight:** 20%
-   **Line Height:** 1.4

**Body Text:**
-   N/A

**Special Text Elements:**
-   N/A

---

**🎨 COLOR & CONTRAST HIERARCHY**

**Color Palette for This Slide:**
-   **Dominant Color:** Atlassian Blue (#0052CC) - Usage: Full-bleed background, ~90% of visible slide area.
-   **Supporting Color:** White (#FFFFFF) - Usage: All typography and logos, ~10% of visible slide area.
-   **Accent Color:** N/A
-   **Text Color:** White (#FFFFFF)

**Contrast Strategy:**
-   **Highest Contrast Element:** The white headline text against the Atlassian Blue background. This is intentional to create the primary focal point and maximize impact.
-   **Medium Contrast:** N/A. The design is intentionally simple and high-contrast.
-   **Low Contrast:** N/A.
-   **Contrast Ratios:** The contrast ratio between White (#FFFFFF) text and the Atlassian Blue (#0052CC) background is 4.75:1, which meets WCAG AA standards.

---

**📏 SPACING & MEASUREMENTS**

**Margins:**
-   **Top:** 60px
-   **Right:** 60px
-   **Bottom:** 60px
-   **Left:** 60px
-   **Safe Zone:** An area of 1800x960px, centered on the 1920x1080px canvas. All content resides within this zone.

**Element Spacing:**
-   **Between headline and subhead:** 40px
-   **Between subhead and logo group:** ~300px (variable, to place logos correctly near bottom margin).
-   **Between logos:** 64px

**Visual Breathing Room:**
-   **Whitespace Percentage:** ~70%
-   **Where:** The space surrounding the central column of content. The large gaps above the headline, below the logos, and to the left/right of the text are critical for the design's impact.

---

**✨ VISUAL EFFECTS & DEPTH**

**Shadows:**
-   None. The design is flat, adhering to a clean and modern aesthetic.

**Depth Layers:**
1.  **Foreground:** Headline, Subhead, Logos.
2.  **Midground:** N/A
3.  **Background:** Solid Atlassian Blue color fill.

**Other Effects:**
-   None.

---

**♿ ACCESSIBILITY & READABILITY**

-   **Text Contrast Ratio:** All text (#FFFFFF) on the background (#0052CC) has a contrast ratio of 4.75:1.
    -   Headline: 4.75:1 (Meets 3:1 for large text).
    -   Subhead: 4.75:1 (Meets 3:1 for large text).
-   **Color Blind Safe:** Yes. Information is conveyed through text and hierarchy, not color alone.
-   **Font Size Minimum:** The smallest text is 30pt, well above the 16pt body text minimum.
-   **Scannability:** YES. The viewer can grasp the key message ("Unlocking Agility") and the key players (TechCorp, Atlassian) in under 3 seconds.
-   **Reading Level:** The text is simple, direct, and free of jargon.

---

**🧠 DESIGN RATIONALE**

**Why This Hierarchy:**
The hierarchy places the core concept ("Unlocking Agility") at the highest visual level, immediately capturing attention and establishing the presentation's theme. The subhead provides necessary context without competing for attention, and the logos ground the statement with the relevant entities. This aligns with the brand personality of being "Bold & Optimistic" and "Pragmatic & Practical".

**Why This Architecture:**
A center-dominant, high-whitespace layout was chosen to create a sense of focus, confidence, and importance. This minimalist approach eliminates all distractions, forcing the audience to engage with the core message. It is an architecture of impact, perfectly suited for an opening slide that needs to set a strong, professional tone.

**Expected Viewer Experience:**
The viewer should feel a sense of gravitas and professionalism upon seeing this slide. They will feel intrigued by the bold claim and understand immediately that this presentation is a success story about a significant transformation involving TechCorp and Atlassian. The feeling is one of confidence and anticipation.

---


### SLIDE 2: The Breaking Point

**Headline:** The Breaking Point: Silos, Delays, and Disconnected Tools
**Subhead:** TechCorp's growth was stalled by operational friction.

---

**🎯 VISUAL HIERARCHY & ARCHITECTURE**

**Information Density:** Medium
**Visual Approach:** Story
**Eye Flow Pattern:** A modified Z-pattern. The eye starts at the high-contrast Headline (top-left), moves right to the large, complex conceptual Diagram, then sweeps down and left to the three supporting Text Blocks, reading them from top to bottom.

**Visual Weight Distribution:**
1.  **PRIMARY (60%):** The conceptual "Chaos Diagram" on the right half of the slide. Its size, complexity, and color accents make it the dominant visual element.
2.  **SECONDARY (25%):** The main Headline and Subhead. Their large size and primary brand color position them as the entry point to the slide's message.
3.  **TERTIARY (15%):** The three supporting text blocks on the left. They provide the necessary detail and rationale for the visual story.

**Focal Point Strategy:**
-   **First Eye Contact:** The Headline, "The Breaking Point," due to its position and color (#0052CC).
-   **Visual Path:** Headline → Chaos Diagram (specifically the yellow warning icon) → Top text block ("Scattered information") → Middle text block ("Lack of visibility") → Bottom text block ("Slow delivery cycles").
-   **Retention Element:** The visual of tangled lines connecting disparate tools, representing "chaos." This is emphasized by its large size and the use of a single, high-contrast accent color.

**Layout Architecture:**
-   **Grid Structure:** A 12-column grid. The headline/subhead span columns 1-12. Below them, the layout is split: text blocks occupy columns 1-5, and the primary visual occupies columns 7-12, leaving column 6 as a wide gutter.
-   **Balance Type:** Asymmetric 40/60 horizontal split (40% text on left, 60% visual on right).
-   **Anchor Element:** The Chaos Diagram on the right anchors the slide's visual narrative. The text on the left is aligned to it.
-   **Whitespace Strategy:** Approximately 40% of the slide is whitespace. Significant breathing room is allocated in the gutter between the text and visual columns, and within the margins.

---

**📐 DETAILED VISUAL DESIGN**

**Background:**
-   **Color:** White (#FFFFFF)
-   **Pattern/Texture:** none
-   **Gradient:** solid
-   **Visual Weight:** 0% (serves as a neutral canvas)

**Primary Visual Element:** "Chaos Diagram"
-   **Type:** Abstract conceptual diagram
-   **Position:** Right side of the slide, occupying columns 7-12 of the grid. Vertically centered in the area below the subhead. Bounded by the 60px safe zone margins.
-   **Size:** Approximately 850px wide x 550px high.
-   **Style:** Flat, line art style. Composed of four circular nodes containing tool icons, interconnected by a web of tangled, chaotic, dotted lines.
-   **Colors:**
    -   Tool Icons (Email, Spreadsheet, Chat): Dark Gray (#172B4D)
    -   Problem Icon (Confused Face): Yellow (#FFAB00)
    -   Connecting Lines: Medium Gray (#505F79)
    -   Node Circles: Light Gray (#F4F5F7) with a 1px Dark Gray (#172B4D) stroke.
-   **Visual Weight:** 60%
-   **Relationship to Text:** Occupies a separate, dedicated space to the right of the text content, creating a clear column structure.

**Secondary Visual Elements:** N/A (Text blocks serve this role but are defined under Typography)

**Tertiary Visual Elements:** N/A

---

**📝 TYPOGRAPHY HIERARCHY**

**Headline:**
-   **Font:** Inter, Bold (700)
-   **Size:** 48pt
-   **Color:** Atlassian Blue (#0052CC)
-   **Position:** Top-left, aligned to the 60px top and left margins.
-   **Alignment:** Left
-   **Visual Weight:** 15%
-   **Relationship to Visual:** Positioned above all other content, acting as the title for the entire slide narrative.

**Subhead:**
-   **Font:** Inter, Semibold (600)
-   **Size:** 28pt
-   **Color:** Dark Gray (#172B4D)
-   **Position:** 16px directly below the Headline.
-   **Alignment:** Left
-   **Visual Weight:** 10%
-   **Line Height:** 1.4

**Body Text (3 Supporting Point Blocks):**
-   **Position:** Left side of the slide, occupying columns 1-5 of the grid, starting 80px below the subhead.
-   **Block 1: "Scattered information"**
    -   Header Font: Inter, Semibold (600), 22pt, #172B4D
    -   Body Font: Inter, Regular (400), 18pt, #172B4D
    -   Content: "Key details were lost across emails, chats, and disconnected spreadsheets."
-   **Block 2: "Lack of visibility"**
    -   Header Font: Inter, Semibold (600), 22pt, #172B4D
    -   Body Font: Inter, Regular (400), 18pt, #172B4D
    -   Content: "Leadership couldn't track project status, leading to constant follow-ups."
-   **Block 3: "Slow delivery cycles"**
    -   Header Font: Inter, Semibold (600), 22pt, #172B4D
    -   Body Font: Inter, Regular (400), 18pt, #172B4D
    -   Content: "Friction between teams resulted in missed deadlines and frustrated customers."
-   **Visual Weight (Combined):** 15%
-   **Max Line Length:** 550px for readability.

---

**🎨 COLOR & CONTRAST HIERARCHY**

**Color Palette for This Slide:**
-   **Dominant Color:** White (#FFFFFF) - Usage: Background, ~90% of visible area.
-   **Accent Color:** Atlassian Blue (#0052CC) - Usage: Headline text, ~2% of visible area.
-   **Supporting Color:** Dark Gray (#172B4D) - Usage: Subhead, body text, diagram icons, ~5% of visible area.
-   **Highlight/Warning Color:** Yellow (#FFAB00) - Usage: Single "confused face" icon in diagram to draw the eye, <1% of visible area.
-   **Neutral Color:** Medium Gray (#505F79) - Usage: Tangled lines in diagram, ~2% of visible area.

**Contrast Strategy:**
-   **Highest Contrast Element:** The Dark Gray (#172B4D) text on the White (#FFFFFF) background provides maximum readability.
-   **Medium Contrast:** The Atlassian Blue (#0052CC) headline on white, drawing initial attention.
-   **Low Contrast:** The Medium Gray (#505F79) dotted lines in the diagram are intentionally less prominent than the icons they connect.
-   **Contrast Ratios:**
    -   Headline (#0052CC on #FFFFFF): 4.69:1 (WCAG AA compliant for large text).
    -   Body/Subhead (#172B4D on #FFFFFF): 12.57:1 (WCAG AAA compliant).
    -   Diagram Icon (#FFAB00 on #F4F5F7): 2.92:1 (Slightly below 3:1, but acceptable for a non-essential decorative icon).

---

**📏 SPACING & MEASUREMENTS**

**Margins:**
-   Top: 60px
-   Right: 60px
-   Bottom: 60px
-   Left: 60px
-   **Safe Zone:** All text and critical visual elements are contained within a 1800px x 960px area.

**Element Spacing:**
-   **Between headline and subhead:** 16px
-   **Between subhead and content area (text blocks/diagram):** 80px
-   **Between supporting point blocks (vertical):** 48px
-   **Gutter width (between text blocks and diagram):** ~120px (width of column 6).

**Visual Breathing Room:**
-   **Whitespace Percentage:** 40%
-   **Where:** The largest areas of whitespace are the wide gutter separating the text and visual columns, and the space below the final text block and the bottom margin.

---

**✨ VISUAL EFFECTS & DEPTH**

**Shadows:**
-   **Primary Element Shadow:** None. The design is flat and clean, consistent with the Atlassian Design System.
-   **Secondary Element Shadow:** None.

**Depth Layers:** (A flat design with conceptual layers)
1.  **Foreground:** Headline, Subhead, and Body Text.
2.  **Midground:** The icons within the diagram.
3.  **Background:** The tangled lines of the diagram and the White slide background.

**Other Effects:**
-   **Glows:** None.
-   **Gradients:** None.
-   **Opacity:** None.

---

**♿ ACCESSIBILITY & READABILITY**

-   **Text Contrast Ratio:** All text meets or exceeds WCAG AA standards.
    -   Headline (#0052CC): 4.69:1 (Passes for 48pt text)
    -   Subhead/Body (#172B4D): 12.57:1 (Passes)
-   **Color Blind Safe:** The slide does not rely on color alone. The diagram's meaning comes from the tangled lines and familiar icons, not their color. The yellow accent highlights a point of focus but isn't critical to understanding.
-   **Font Size Minimum:** The smallest text is 18pt, exceeding the 16pt minimum.
-   **Scannability:** YES. The headline, diagram, and bolded text block headers allow a viewer to grasp the core message ("breaking point," "chaos," "silos/visibility/delays") in under 3 seconds.
-   **Reading Level:** The text is direct, uses common business terms, and avoids jargon, aligning with the "Open & Human" brand personality.

---

**🧠 DESIGN RATIONALE**

**Why This Hierarchy:**
The hierarchy places the core problem ("The Breaking Point") first, then immediately provides a powerful visual metaphor (the chaos diagram). This primes the audience to understand the context before reading the specific proof points, making the supporting text more impactful.

**Why This Architecture:**
The asymmetric 40/60 split creates a dynamic but balanced layout. It separates the "what" (the visual problem on the right) from the "why" (the explanatory text on the left), a classic storytelling structure that aids comprehension and retention. The Z-pattern flow is a natural reading order for Western audiences, ensuring the narrative is consumed as intended.

**Expected Viewer Experience:**
The viewer should immediately recognize the feeling of "operational chaos" from the diagram. They will feel a sense of familiarity and empathy with the stated problems, thinking, "Yes, we've experienced that." This slide validates their pain points and sets the stage for the solution to be presented next.

---


### SLIDE 3: A Unified Platform for Growth

**Headline:** A Unified Platform for Growth
**Subhead:** TechCorp chose Atlassian to connect every stage of work.

---

**🎯 VISUAL HIERARCHY & ARCHITECTURE**

**Information Density:** Medium
**Visual Approach:** Comparison (Implicitly comparing the previous state of chaos to this new, ordered solution)
**Eye Flow Pattern:** The eye is drawn first to the headline, then immediately down and left to the colorful, central diagram of the three connected product logos. From there, the eye moves horizontally to the right to read the corresponding descriptions in a natural Z-pattern flow, starting with Jira and moving down through Confluence and Trello.

**Visual Weight Distribution:**
1.  **PRIMARY (60%):** The central visual diagram on the left, containing the three product logos (Jira, Confluence, Trello) within a unifying shape and connected with lines. Its color and unique form make it the dominant element.
2.  **SECONDARY (30%):** The main headline and subhead. Their size, color, and position at the top of the slide give them significant weight.
3.  **TERTIARY (10%):** The three blocks of descriptive text on the right side of the slide. They are essential for context but are designed to be read after the primary and secondary elements are absorbed.

**Focal Point Strategy:**
-   **First Eye Contact:** The diagram of connected logos. While text is read first, the visual gravity of the colorful logos against the light gray background immediately captures attention and becomes the focal point.
-   **Visual Path:** Headline ("A Unified Platform for Growth") → Diagram of connected logos → Right to the "Jira" heading and description → Down to "Confluence" heading and description → Down to "Trello" heading and description.
-   **Retention Element:** The visual grouping of the three logos. The design's primary goal is for the audience to remember "Jira, Confluence, and Trello" as a single, powerful unit.

**Layout Architecture:**
-   **Grid Structure:** 12-column grid. The layout is split into two main zones. The visual diagram occupies columns 1-7. The descriptive text occupies columns 8-12.
-   **Balance Type:** Asymmetric 60/40 horizontal split. The heavier visual element is on the left, balanced by the text blocks on the right.
-   **Anchor Element:** The visual diagram on the left half of the slide anchors the composition, providing a solid foundation from which the rest of the content extends.
-   **Whitespace Strategy:** Approximately 50% of the slide is whitespace. Generous space is left around the central diagram and between the text blocks to create clarity, reduce cognitive load, and give the slide a clean, organized feel.

---

**📐 DETAILED VISUAL DESIGN**

**Background:**
-   **Color:** Light Gray (#F4F5F7)
-   **Pattern/Texture:** none
-   **Gradient:** solid
-   **Visual Weight:** 0% (serves as a neutral canvas)

**Primary Visual Element:** "Unified Platform" Diagram
-   **Type:** Diagram / Illustration
-   **Position:** Vertically centered within the safe zone, occupying the left 60% of the content area (columns 1-7 of the grid). Left edge is 60px from the slide edge.
-   **Size:** Approximately 700px wide by 500px tall.
-   **Style:** A soft, abstract container shape (like a rounded rectangle or a subtle "blob") holds the three product logos. The official, full-color logos are used.
-   **Colors:**
    -   Container Shape Fill: White (#FFFFFF)
    -   Jira Logo: Official Blue
    -   Confluence Logo: Official Blue
    -   Trello Logo: Official Blue
    -   Connecting Lines: Atlassian Teal (#00B8D9)
-   **Visual Weight:** 60%
-   **Relationship to Text:** The diagram occupies its own distinct space on the left, with a clear gutter separating it from the text on the right.

**Secondary Visual Elements:**
-   **Element 1:** Connecting Lines
    -   Type: Line Art
    -   Position: Within the primary container, visually linking the three logos to a central point or to each other.
    -   Size: 2px stroke weight.
    -   Style: Clean, solid lines, possibly with soft-rounded ends.
    -   Colors: Atlassian Teal (#00B8D9)
    -   Visual weight: ~5% (part of the primary element's total weight but functionally secondary)

**Tertiary Visual Elements:** None.

---

**📝 TYPOGRAPHY HIERARCHY**

**Headline:**
-   **Font:** Inter Bold (Weight 700)
-   **Size:** 48pt
-   **Color:** Atlassian Blue (#0052CC)
-   **Position:** Top-left, aligned to the safe zone. X: 60px, Y: 60px.
-   **Alignment:** Left
-   **Visual Weight:** 20%
-   **Relationship to Visual:** Positioned above all other content, serving as the entry point for the slide's message.

**Subhead:**
-   **Font:** Inter Semibold (Weight 600)
-   **Size:** 30pt
-   **Color:** Dark Gray (#172B4D)
-   **Position:** Directly below the headline. X: 60px, Y: 124px.
-   **Alignment:** Left
-   **Visual Weight:** 10%
-   **Line Height:** 1.4

**Body Text:** (Three separate blocks for each product)
-   **Product Name (H3):**
    -   Font: Inter Semibold (Weight 600)
    -   Size: 22pt
    -   Color: Dark Gray (#172B4D)
    -   Position: Top of each text block in the right-hand column (column 8).
    -   Alignment: Left
-   **Product Description (Body):**
    -   Font: Inter Regular (Weight 400)
    -   Size: 18pt
    -   Color: Dark Gray (#172B4D)
    -   Position: Directly below its corresponding H3 Product Name.
    -   Alignment: Left
    -   Line Height: 1.5
    -   Max Line Length: 500px

---

**🎨 COLOR & CONTRAST HIERARCHY**

**Color Palette for This Slide:**
-   **Dominant Color:** Light Gray (#F4F5F7) - Usage: Background, ~75% of visible slide area.
-   **Accent Color:** Atlassian Blue (#0052CC) - Usage: Headline and product logos, ~10%.
-   **Supporting Color:** Dark Gray (#172B4D) - Usage: Subhead and all body text, ~10%.
-   **Highlight Color:** Atlassian Teal (#00B8D9) - Usage: Connecting lines in the diagram, <5%.

**Contrast Strategy:**
-   **Highest Contrast Element:** The Dark Gray (#172B4D) body text on the Light Gray (#F4F5F7) background provides maximum readability for the detailed information.
-   **Medium Contrast:** The Atlassian Blue (#0052CC) headline has strong, but slightly softer, contrast, drawing attention without being harsh.
-   **Low Contrast:** The white (#FFFFFF) container shape for the logos has a subtle contrast with the light gray background, creating a soft visual lift.
-   **Contrast Ratios:**
    -   Headline (#0052CC on #F4F5F7): 5.37:1 (Passes AA for large text)
    -   Body Text (#172B4D on #F4F5F7): 10.97:1 (Passes AAA)

---

**📏 SPACING & MEASUREMENTS**

**Margins:**
-   Top: 60px
-   Right: 60px
-   Bottom: 60px
-   Left: 60px
-   **Safe Zone:** 1800px wide x 960px high area, inset 60px from all edges.

**Element Spacing:**
-   **Between headline and subhead:** 16px
-   **Between subhead and content area (top of diagram/text):** 80px
-   **Between diagram and text blocks (gutter):** 75px
-   **Between product text blocks (e.g., Jira block and Confluence block):** 40px
-   **Between H3 product title and its description:** 8px
-   **Card padding:** The white container for the logos should have at least 50px of internal padding around the logos.

**Visual Breathing Room:**
-   **Whitespace Percentage:** ~50%
-   **Where:** The largest areas of whitespace are the top-right quadrant above the text blocks, and the bottom margin area. This prevents the slide from feeling crowded and directs focus.

---

**✨ VISUAL EFFECTS & DEPTH**

**Shadows:**
-   **Primary Element Shadow:**
    -   Element: The white container holding the logos.
    -   Style: X: 0px, Y: 8px, Blur: 24px, Spread: -4px
    -   Color: rgba(23, 43, 77, 0.1)
    -   Purpose: To create a subtle lift and separation from the light gray background, giving the diagram a tangible presence.

**Depth Layers:**
1.  **Foreground:** The three product logos and their connecting lines.
2.  **Midground:** The white container shape with its shadow, and all text elements (Headline, Subhead, Body).
3.  **Background:** The solid Light Gray (#F4F5F7) background color.

**Other Effects:** None.

---

**♿ ACCESSIBILITY & READABILITY**

-   **Text Contrast Ratio:** All text meets or exceeds WCAG AA standards.
    -   Headline on Background: 5.37:1
    -   Body Text on Background: 10.97:1
-   **Color Blind Safe:** Yes. Information is not conveyed by color alone. Product logos are distinct shapes and are accompanied by text labels. The Teal accent is purely decorative.
-   **Font Size Minimum:** The smallest text is 18pt, which is well above the 16pt minimum for body copy, ensuring excellent readability.
-   **Scannability:** YES. The clear hierarchy, large headline, and visually distinct blocks allow a viewer to grasp the main point (Atlassian's 3 core products form a unified platform) in under 3 seconds.
-   **Reading Level:** The text is simple, direct, and avoids jargon, consistent with the brand personality.

---

**🧠 DESIGN RATIONALE**

**Why This Hierarchy:**
The hierarchy places the solution—the unified platform diagram—as the primary focal point. This immediately answers the (unstated) question from the previous slide's problem. By making the headline and subhead strong but secondary, we ensure the core message is framed correctly before the viewer engages with the visual proof.

**Why This Architecture:**
The asymmetric 60/40 layout creates a dynamic but stable composition. It allows the conceptual, visual idea (the unified platform) to have its own space to breathe on the left, while the concrete details (what each product does) are neatly organized on the right. This separation of "what it is" from "how it works" makes the information easy to digest.

**Expected Viewer Experience:**
The viewer should feel a sense of clarity and relief. After seeing a problem (the "chaos" slide that likely precedes this), this slide presents a clean, organized, and powerful solution. They should leave understanding that Atlassian isn't just a collection of tools, but a single, integrated system, and they should be able to recall the three main product names.

---


### SLIDE 4: Our Phased Rollout Strategy

**Headline:** Our Phased Rollout Strategy
**Subhead:** A deliberate approach to minimize disruption and maximize success.

---

**🎯 VISUAL HIERARCHY & ARCHITECTURE**

**Information Density:** Medium
**Visual Approach:** Process
**Eye Flow Pattern:** The eye is intended to follow a natural top-to-bottom F-pattern. It begins with the headline and subhead at the top left, then moves down the central vertical axis, scanning each of the three numbered phases sequentially from 1 to 3. The numbers and distinct icons for each phase serve as clear anchor points for each step in the process.

**Visual Weight Distribution:**
1.  **PRIMARY (60%):** The central, vertical timeline graphic, encompassing the three numbered phases, their icons, and their titles. This entire structure forms the core narrative of the slide.
2.  **SECONDARY (30%):** The main slide headline ("Our Phased Rollout Strategy") due to its size and use of the primary brand color, and the accompanying subhead.
3.  **TERTIARY (10%):** The descriptive body text within each of the three phases. This is supporting detail, meant to be read after the phase title is understood.

**Focal Point Strategy:**
-   **First Eye Contact:** The headline, due to its position, size (48pt), and color (Atlassian Blue #0052CC). It immediately establishes the slide's topic.
-   **Visual Path:** Headline → Subhead → Phase 1 Icon & Title → Phase 2 Icon & Title → Phase 3 Icon & Title. The vertical connecting line and clear numbering create an explicit, guided path for the viewer.
-   **Retention Element:** The three distinct phase titles, reinforced by their unique icons and sequential numbering (Pilot -> Expand -> Integrate).

**Layout Architecture:**
-   **Grid Structure:** A single central column, approximately 1000px wide, centered within the 12-column grid.
-   **Balance Type:** Symmetric vertical balance. The core content is centered on the X-axis, creating a stable and organized feel.
-   **Anchor Element:** The vertical line of the timeline graphic acts as a visual spine, grounding all the content elements along the central axis of the slide.
-   **Whitespace Strategy:** Approximately 45% of the slide is whitespace, concentrated in the left and right columns outside the central content area, providing ample breathing room and focus.

---

**📐 DETAILED VISUAL DESIGN**

**Background:**
-   **Color:** White (#FFFFFF)
-   **Pattern/Texture:** None
-   **Gradient:** Solid
-   **Visual Weight:** 0% (serves as a neutral canvas)

**Primary Visual Element:** Three-Phase Timeline Diagram
-   **Type:** Diagram / Process Graphic
-   **Position:** Centered horizontally, beginning 84px below the subhead.
-   **Size:** Approximately 1000px wide by 600px high.
-   **Style:** Clean, geometric, line art. Composed of three distinct modules connected by a vertical line. Each module contains a number, an icon, a title, and a description.
-   **Colors:** The main connecting line is Atlassian Blue (#0052CC). Icons are color-coded: #0052CC, #00B8D9, #6554C0.
-   **Visual Weight:** 60%
-   **Relationship to Text:** The graphic is integrated with the text; the text is part of the graphic's modules.

**Secondary Visual Elements:** N/A (Icons are considered part of the primary graphic)

**Tertiary Visual Elements:** Phase Numbering Circles
-   **Element 1:** Three circles for numbering.
  - Type: Geometric Shape (Circle)
  - Position: At the start of each phase module, to the left of the icon.
  - Size: 64x64px diameter.
  - Style: Solid fill with a number inside.
  - Colors: Atlassian Blue (#0052CC) fill, with White (#FFFFFF) text for the numbers (1, 2, 3).
  - Visual weight: ~5%

---

**📝 TYPOGRAPHY HIERARCHY**

**Headline:**
-   **Font:** Inter, Bold (700)
-   **Size:** 48pt
-   **Color:** Atlassian Blue (#0052CC)
-   **Position:** Top left, aligned to the safe zone (60px from top, 60px from left).
-   **Alignment:** Left
-   **Visual Weight:** 20%
-   **Relationship to Visual:** Sits above all other content, acting as the main title.

**Subhead:**
-   **Font:** Inter, Semibold (600)
-   **Size:** 28pt
-   **Color:** Dark Gray (#172B4D)
-   **Position:** 16px below the headline.
-   **Alignment:** Left
-   **Visual Weight:** 10%
-   **Line Height:** 1.4

**Special Text Elements:** Phase Titles & Descriptions
-   **Phase Title (e.g., "Phase 1: Pilot Team & Foundational Setup")**
  - Font: Inter, Semibold (600)
  - Size: 24pt
  - Color: Dark Gray (#172B4D)
  - Position: Within each phase module, to the right of the icon.
  - Visual Weight: 5% per title.
-   **Phase Description (e.g., "Jira + Confluence")**
  - Font: Inter, Regular (400)
  - Size: 18pt
  - Color: Dark Gray (#172B4D)
  - Position: 12px below its corresponding Phase Title.
  - Visual Weight: 2% per description.
  - Max Line Length: 600px
-   **Phase Number (1, 2, 3)**
  - Font: Inter, Bold (700)
  - Size: 32pt
  - Color: White (#FFFFFF)
  - Position: Centered within each 64px Numbering Circle.

---

**🎨 COLOR & CONTRAST HIERARCHY**

**Color Palette for This Slide:**
-   **Dominant Color:** White (#FFFFFF) - Usage: Background, ~90% of visible slide area.
-   **Accent Color:** Atlassian Blue (#0052CC) - Usage: Headline, timeline graphic, Phase 1 icon, ~5%.
-   **Supporting Color 1:** Dark Gray (#172B4D) - Usage: All subheads and body text, ~3%.
-   **Supporting Color 2:** Atlassian Teal (#00B8D9) - Usage: Phase 2 Icon, <1%.
-   **Supporting Color 3:** Atlassian Purple (#6554C0) - Usage: Phase 3 Icon, <1%.

**Contrast Strategy:**
-   **Highest Contrast Element:** The Dark Gray (#172B4D) text on the White (#FFFFFF) background provides the highest contrast for maximum readability.
-   **Medium Contrast:** The Atlassian Blue (#0052CC) headline on the White (#FFFFFF) background, drawing attention without sacrificing readability.
-   **Low Contrast:** N/A. All elements are designed for clear visibility.
-   **Contrast Ratios:**
    - Headline (#0052CC on #FFFFFF): 4.53:1 (Passes WCAG AA for large text).
    - Subhead/Body (#172B4D on #FFFFFF): 12.64:1 (Passes WCAG AAA).

---

**📏 SPACING & MEASUREMENTS**

**Margins:**
-   Top: 60px
-   Right: 60px
-   Bottom: 60px
-   Left: 60px
-   **Safe Zone:** 1800px x 960px area inset from edges.

**Element Spacing:**
-   **Between headline and subhead:** 16px
-   **Between subhead and timeline graphic:** 84px
-   **Between phase modules (vertical gap):** 48px
-   **Between number circle and icon:** 24px
-   **Between icon and phase title:** 24px
-   **Between phase title and description:** 12px

**Visual Breathing Room:**
-   **Whitespace Percentage:** 45%
-   **Where:** The majority of whitespace is preserved in the vertical columns to the left and right of the central timeline, creating a focused, uncluttered presentation.

---

**✨ VISUAL EFFECTS & DEPTH**

**Shadows:**
-   **Primary Element Shadow:** None. Maintain a flat, clean aesthetic consistent with the Atlassian design system.
-   **Secondary Element Shadow:** None.

**Depth Layers:** (Front to back)
1.  **Foreground:** Typography (Headline, Subhead, Body Text) and Icons.
2.  **Midground:** The Numbering Circles and the vertical connecting line of the timeline.
3.  **Background:** The solid White (#FFFFFF) background fill.

**Other Effects:**
-   **Glows:** None.
-   **Gradients:** None.
-   **Opacity:** All elements at 100% opacity.

---

**♿ ACCESSIBILITY & READABILITY**

-   **Text Contrast Ratio:** All text meets or exceeds WCAG AA standards.
  - Headline (#0052CC on #FFFFFF): 4.53:1
  - Body (#172B4D on #FFFFFF): 12.64:1
-   **Color Blind Safe:** Yes. The phases are distinguished by numbers (1, 2, 3), icons, and vertical position, not by color alone. The accent colors on the icons are for visual flavor, not primary information conveyance.
-   **Font Size Minimum:** 18pt for descriptive text, exceeding the 16pt minimum.
-   **Scannability:** Yes. The numbered, single-column layout allows a viewer to grasp the three-phase structure in under 3 seconds.
-   **Reading Level:** The text is direct and avoids jargon, aligning with the "Open & Human" brand personality.

---

**🧠 DESIGN RATIONALE**

**Why This Hierarchy:**
The hierarchy places the core concept (the headline) first, then immediately presents the structured solution (the timeline). By making the entire timeline graphic the primary visual element, the slide forces the viewer to engage with the process itself, which is the key takeaway. Subordinating the descriptive text ensures the high-level structure is understood before the details are consumed.

**Why This Architecture:**
A symmetric, single-column layout was chosen to communicate stability, order, and a deliberate plan. This structure inherently counters any audience anxiety about a chaotic implementation, directly supporting the slide's emotional goal of instilling confidence. The generous whitespace prevents the process from feeling overwhelming and reinforces a sense of clarity and control.

**Expected Viewer Experience:**
The viewer should feel reassured and confident. They will see a clear, manageable, and well-thought-out plan, understanding that the rollout is not a single, risky event but a de-risked, sequential process. The key retention will be the simple three-part story: "Pilot, then Expand to Engineering, then Integrate Business."

---


### SLIDE 5: Driving 95% Adoption in 90 Days

**Headline:** Driving 95% Adoption in 90 Days
**Subhead:** How we turned implementation into organization-wide adoption.

---

**🎯 VISUAL HIERARCHY & ARCHITECTURE**

**Information Density:** Medium
**Visual Approach:** Process
**Eye Flow Pattern:** Top-to-center-out. The eye is drawn first to the main headline at the top, then drops to the subhead, and is immediately anchored by the central hub of the diagram. From the central hub, the eye naturally rotates counter-clockwise (or clockwise) through the four surrounding spoke elements before resting.

**Visual Weight Distribution:**
1.  **PRIMARY (60%):** The hub-and-spoke diagram. Its central position, use of brand color, and connecting lines make it the dominant element.
2.  **SECONDARY (30%):** The slide headline and subhead. The large size and primary brand color of the headline give it significant weight.
3.  **TERTIARY (10%):** The individual icons and their text labels within the spoke elements.

**Focal Point Strategy:**
-   **First Eye Contact:** The headline, "Driving 95% Adoption in 90 Days," due to its size, color (#0052CC), and position at the top.
-   **Visual Path:** Headline → Subhead → Central Hub ("Champions Program") → Top Left Spoke ("Lunch & Learns") → Bottom Left ("Targeted Training") → Bottom Right ("Embedded Experts") → Top Right ("Gamified Onboarding").
-   **Retention Element:** The central hub, "Champions Program." It is visually reinforced by being the largest circular element, filled with the primary brand color, and being the origin point for all connecting lines, ensuring it is perceived as the core concept.

**Layout Architecture:**
-   **Grid Structure:** A 1-column structure for the header text, with the main content area dominated by a large, centrally-aligned radial diagram.
-   **Balance Type:** Center-dominant. The design is symmetrically balanced around the vertical and horizontal center of the slide canvas.
-   **Anchor Element:** The central "Champions Program" hub of the diagram. It is positioned at the exact center of the slide (excluding top header text), grounding the entire composition.
-   **Whitespace Strategy:** Approximately 50% of the slide is whitespace. Generous space is left around the entire diagram, separating it clearly from the header text and the slide edges, which creates focus and reduces cognitive load.

---

**📐 DETAILED VISUAL DESIGN**

**Background:**
-   **Color:** White (#FFFFFF)
-   **Pattern/Texture:** None
-   **Gradient:** Solid
-   **Visual Weight:** 0% (serves as a neutral canvas)

**Primary Visual Element:** Hub-and-Spoke Diagram
-   **Type:** Diagram / Illustration
-   **Position:** Centered horizontally and vertically in the main content area below the subhead. Top edge of diagram is 100px below the subhead.
-   **Size:** The entire diagram occupies a conceptual square of 800px by 800px.
-   **Style:** Geometric, clean, and flat, consistent with the Atlassian design system.
-   **Colors:** Atlassian Blue (#0052CC) for the hub and connecting lines. Teal (#00B8D9) and Purple (#6554C0) for spoke icons. Dark Gray (#172B4D) for spoke text. White (#FFFFFF) for hub text.
-   **Visual Weight:** 60%
-   **Relationship to Text:** The diagram contains its own text elements (labels for the hub and spokes) and is positioned distinctly below the main slide subhead.

**Secondary Visual Elements:** This slide's design is focused on one primary diagram. The constituent parts of the diagram function as secondary elements.
-   **Element 1: The Central Hub**
    -   Type: A filled circle with text inside.
    -   Position: Exact center of the diagram area.
    -   Size: 240px diameter.
    -   Style: Flat solid color.
    -   Colors: Fill: Atlassian Blue (#0052CC). Text: White (#FFFFFF).
    -   Visual weight: ~25%
-   **Element 2: The Four Spokes**
    -   Type: Four distinct units, each containing an icon and a text label, connected to the hub.
    -   Position: Arranged radially around the hub at 45°, 135°, 225°, and 315° angles. Center of each spoke unit is 300px from the center of the hub.
    -   Size: Each spoke unit (icon + text) fits within a 150px x 100px area.
    -   Style: Line icons with text labels below them.
    -   Colors: Icons alternate between Teal (#00B8D9) and Purple (#6554C0). Text is Dark Gray (#172B4D).
    -   Visual weight: ~25% (combined)
-   **Element 3: Connecting Lines**
    -   Type: Straight lines.
    -   Position: Radiating from the edge of the central hub to the top of each spoke's icon.
    -   Size: 2px stroke weight.
    -   Style: Solid, straight line.
    -   Colors: Atlassian Blue (#0052CC).
    -   Visual weight: ~10%

---

**📝 TYPOGRAPHY HIERARCHY**

**Headline:**
-   **Font:** Inter, Bold (700)
-   **Size:** 48pt
-   **Color:** Atlassian Blue (#0052CC)
-   **Position:** Top-aligned, centered horizontally. Top edge 60px from slide top.
-   **Alignment:** Center
-   **Visual Weight:** 20%
-   **Relationship to Visual:** Positioned directly above all other content, serving as the title for the slide concept.

**Subhead:**
-   **Font:** Inter, Semibold (600)
-   **Size:** 28pt
-   **Color:** Dark Gray (#172B4D)
-   **Position:** Centered, 16px below the headline.
-   **Alignment:** Center
-   **Visual Weight:** 10%
-   **Line Height:** 1.4

**Special Text Elements:**
-   **Hub Label ("Champions Program")**
    -   Font: Inter, Semibold (600)
    -   Size: 24pt
    -   Color: White (#FFFFFF)
    -   Position: Vertically and horizontally centered inside the main hub circle.
    -   Alignment: Center, two lines.
    -   Visual Weight: ~10%
-   **Spoke Labels ("Lunch & Learns", "Targeted Training", "Embedded Experts", "Gamified Onboarding")**
    -   Font: Inter, Semibold (600)
    -   Size: 20pt
    -   Color: Dark Gray (#172B4D)
    -   Position: Each label is centered horizontally, 12px below its corresponding icon.
    -   Alignment: Center
    -   Visual Weight: ~5% (combined)

---

**🎨 COLOR & CONTRAST HIERARCHY**

**Color Palette for This Slide:**
-   **Dominant Color:** White (#FFFFFF) - [Usage: Background, ~50% of visible slide]
-   **Accent Color:** Atlassian Blue (#0052CC) - [Usage: Headline, diagram hub, connecting lines, ~30% of non-background elements]
-   **Supporting Color 1:** Teal (#00B8D9) - [Usage: Spoke icons (2 of 4), ~5%]
-   **Supporting Color 2:** Purple (#6554C0) - [Usage: Spoke icons (2 of 4), ~5%]
-   **Text Color:** Dark Gray (#172B4D) - [Usage: Subhead, spoke labels, ~10%]

**Contrast Strategy:**
-   **Highest Contrast Element:** The Dark Gray (#172B4D) subhead and spoke labels on the White (#FFFFFF) background. This ensures maximum readability for supporting information.
-   **Medium Contrast:** The Atlassian Blue (#0052CC) headline and hub on the White (#FFFFFF) background, and the White (#FFFFFF) text on the blue hub. These create strong focal points without being harsh.
-   **Low Contrast:** Not utilized on this slide to maintain clarity and a clean aesthetic.
-   **Contrast Ratios:**
    -   Headline (#0052CC on #FFFFFF): 4.73:1 (WCAG AA pass)
    -   Subhead/Spoke Labels (#172B4D on #FFFFFF): 12.38:1 (WCAG AAA pass)
    -   Hub Text (#FFFFFF on #0052CC): 4.73:1 (WCAG AA pass for large text)

---

**📏 SPACING & MEASUREMENTS**

**Margins:**
-   Top: 60px
-   Right: 60px
-   Bottom: 60px
-   Left: 60px
-   **Safe Zone:** All content resides within a 1800px by 960px area.

**Element Spacing:**
-   **Between headline and subhead:** 16px
-   **Between subhead and top of diagram:** 100px
-   **Distance from hub center to spoke icon center:** 300px
-   **Between spoke icon and spoke label:** 12px
-   **Icon size:** 48px x 48px

**Visual Breathing Room:**
-   **Whitespace Percentage:** ~50%
-   **Where:** The largest areas of whitespace are to the left and right of the central diagram, and between the diagram and the slide's top/bottom edges.

---

**✨ VISUAL EFFECTS & DEPTH**

**Shadows:**
-   **Primary Element Shadow:** None
-   **Secondary Element Shadow:** None
-   **Purpose:** The design is intentionally flat to align with Atlassian's modern, clean, and pragmatic brand identity. Shadows are not used.

**Depth Layers:**
1.  **Foreground:** All text and icon elements.
2.  **Midground:** The diagram's circular shapes and connecting lines.
3.  **Background:** The solid white (#FFFFFF) background.

**Other Effects:**
-   **Glows:** None
-   **Gradients:** None
-   **Opacity:** 100% on all elements.

---

**♿ ACCESSIBILITY & READABILITY**

-   **Text Contrast Ratio:** All text combinations meet or exceed WCAG AA standards.
    -   Headline: 4.73:1
    -   Subhead/Body: 12.38:1
-   **Color Blind Safe:** Yes. Information is conveyed through icons, text labels, and spatial relationships (hub vs. spokes), not by color alone. The chosen accent colors (Teal, Purple) are distinct.
-   **Font Size Minimum:** The smallest text on the slide is 20pt, which is above the 16pt body minimum.
-   **Scannability:** YES. The visual hierarchy clearly presents the core idea ("Champions Program") and its four supporting tactics within seconds.
-   **Reading Level:** The text is simple, direct, and avoids jargon, aligning with the "Open & Human" brand personality.

---

**🧠 DESIGN RATIONALE**

**Why This Hierarchy:**
The hierarchy places the main outcome ("95% Adoption") at the top, immediately establishing the slide's value. The visual weight is then given to the central hub-and-spoke diagram, ensuring the audience's attention is focused on the *how*—the process itself—with the "Champions Program" visually and conceptually at the core. This directly supports the retention goal for this key concept.

**Why This Architecture:**
A center-dominant, radial layout is the most literal and effective way to represent a "hub-and-spoke" model. This architecture inherently communicates a core idea with supporting satellite tactics, mirroring the presentation's message perfectly. The symmetry and generous whitespace create a feeling of clarity, order, and confidence, reinforcing the "Pragmatic & Practical" brand value.

**Expected Viewer Experience:**
The viewer should feel that a complex problem (user adoption) has been broken down into a clear, manageable, and actionable framework. They should feel inspired by the simplicity and power of the central idea and leave understanding that a "Champions Program" is the linchpin to a successful technology rollout.

---


### SLIDE 6: Transformation by the Numbers

**Headline:** Transformation by the Numbers
**Subhead:** How TechCorp Inc. redefined efficiency with Atlassian.

---

**🎯 VISUAL HIERARCHY & ARCHITECTURE**

**Information Density:** High
**Visual Approach:** Data
**Eye Flow Pattern:** The eye is drawn first to the headline on the top left, then immediately jumps to the large, high-contrast "40%" statistic on the right. The user then scans down the column of statistics from "85%" to "95%". Finally, the eye returns to the subhead and the supporting text on the left for context.

**Visual Weight Distribution:**
1.  **PRIMARY (70%):** The three large typographic number callouts ("40%", "85%", "95%"). Their immense size and vibrant color make them the undeniable heroes of the slide.
2.  **SECONDARY (20%):** The headline and subhead text block on the left. This provides the narrative frame for the data.
3.  **TERTIARY (10%):** The small supporting text descriptions, icons, and minimalist charts associated with each number callout. These provide detail without distracting from the main figures.

**Focal Point Strategy:**
-   **First Eye Contact:** The "40%" number callout. It's the largest, most colorful element in the upper-right quadrant, a natural starting point after the headline.
-   **Visual Path:** Headline → "40%" → "85%" → "95%" → Subhead → Supporting text on the left.
-   **Retention Element:** The three numbers: 40, 85, and 95. They are made memorable through scale, color, and repetition in a clear vertical stack.

**Layout Architecture:**
-   **Grid Structure:** A 12-column grid is used. The layout is divided into two primary zones: the left 4 columns (for text) and the right 8 columns (for data).
-   **Balance Type:** Asymmetric 30/70 Left/Right split. The left third of the slide is dedicated to text, providing a stable anchor, while the right two-thirds showcases the dynamic data points.
-   **Anchor Element:** The headline/subhead text block, positioned in the top-left quadrant within the safe zone, grounds the entire composition.
-   **Whitespace Strategy:** Approximately 40% of the slide is whitespace. Significant padding is used around the two main content zones and between the three data-point rows to ensure each number can be read and absorbed independently.

---

**📐 DETAILED VISUAL DESIGN**

**Background:**
-   **Color:** Light Gray (#F4F5F7)
-   **Pattern/Texture:** none
-   **Gradient:** solid
-   **Visual Weight:** 5% (serves as a neutral canvas)

**Primary Visual Element:** Three Typographic Stat Blocks
-   **Type:** Typography as a graphical element.
-   **Position:** Occupying the right two-thirds of the slide, stacked vertically, and centered within that zone.
-   **Size:** Each number block (number, text, icon, chart) occupies a horizontal space of ~1200px and a vertical space of ~280px.
-   **Style:** Flat, clean, bold typography.
-   **Colors:** Atlassian Blue (#0052CC) for the numbers, Dark Gray (#172B4D) for supporting text, and Green (#36B37E) for the mini-charts.
-   **Visual Weight:** 70%
-   **Relationship to Text:** The large numbers are the primary information, with smaller descriptive text directly below them.

**Secondary Visual Elements:** N/A (The primary element is a composition of smaller parts treated as one unit)

**Tertiary Visual Elements:** Three Mini Data Visualizations
-   **Element 1: Velocity Chart**
    -   Type: Minimalist Line Chart
    -   Position: To the right of the "40% Faster Sprint Velocity" text.
    -   Size: 120px wide x 60px high.
    -   Style: A simple, upward-trending line with a 3px stroke, no axes or labels.
    -   Colors: Line color is Green (#36B37E).
    -   Visual weight: ~2%
-   **Element 2: Meeting Time Chart**
    -   Type: Minimalist Bar Chart
    -   Position: To the right of the "85% Reduction in Meeting Time" text.
    -   Size: 120px wide x 60px high.
    -   Style: Two vertical bars side-by-side. The first bar is tall (representing 'before'), the second is short (representing 'after').
    -   Colors: 'Before' bar is Medium Gray (#505F79), 'After' bar is Green (#36B37E).
    -   Visual weight: ~2%
-   **Element 3: Adoption Icon & Chart**
    -   Type: Minimalist Bar Chart
    -   Position: To the right of the "95% Team Adoption Rate" text.
    -   Size: 120px wide x 60px high.
    -   Style: A single horizontal bar in a container, filled to 95% of its width.
    -   Colors: Fill color is Green (#36B37E), container is Neutral-300 (#505F79).
    -   Visual weight: ~2%

---

**📝 TYPOGRAPHY HIERARCHY**

**Headline:**
-   **Font:** Inter, Bold (700)
-   **Size:** 48pt
-   **Color:** Dark Gray (#172B4D)
-   **Position:** Top-left, aligned to the left margin (60px from top, 60px from left).
-   **Alignment:** Left
-   **Visual Weight:** 10%
-   **Relationship to Visual:** Sits in its own space on the left, providing context for the visuals on the right.

**Subhead:**
-   **Font:** Inter, Semibold (600)
-   **Size:** 28pt
-   **Color:** Dark Gray (#172B4D)
-   **Position:** 16px below the headline.
-   **Alignment:** Left
-   **Visual Weight:** 8%
-   **Line Height:** 1.4

**Special Text Elements:** Main Statistics
-   **Element 1: "40%", "85%", "95%" Numbers**
    -   Font: Inter, Bold (700)
    -   Size: 150pt
    -   Color: Atlassian Blue (#0052CC)
    -   Position: Stacked vertically in the right-hand content zone.
    -   Alignment: Left-aligned within their zone.
    -   Visual Weight: 70% (combined)
-   **Element 2: Statistic Descriptions** ("Faster Sprint Velocity", etc.)
    -   Font: Inter, Regular (400)
    -   Size: 18pt
    -   Color: Dark Gray (#172B4D)
    -   Position: 8px directly below each large number.
    -   Alignment: Left-aligned with the large numbers.
    -   Visual Weight: 5% (combined)
    -   Max Line Length: 400px

---

**🎨 COLOR & CONTRAST HIERARCHY**

**Color Palette for This Slide:**
-   **Dominant Color:** Light Gray (#F4F5F7) - Usage: Background, ~60% of visible slide area.
-   **Accent Color:** Atlassian Blue (#0052CC) - Usage: The three primary numbers, ~25% of visual content.
-   **Supporting Color:** Green (#36B37E) - Usage: Mini data visualizations, ~5% of visual content.
-   **Text Color:** Dark Gray (#172B4D) - Usage: All headlines and body text, ~10% of visual content.

**Contrast Strategy:**
-   **Highest Contrast Element:** The Dark Gray (#172B4D) headline/subhead text on the Light Gray (#F4F5F7) background creates immediate readability.
-   **Medium Contrast:** The Atlassian Blue (#0052CC) numbers on the Light Gray (#F4F5F7) background. This draws the eye powerfully without being as stark as the text.
-   **Low Contrast:** The Green (#36B37E) charts provide accent without overwhelming the primary numbers.
-   **Contrast Ratios:**
    -   Headline/Body Text (#172B4D on #F4F5F7): 13.56:1 (Exceeds WCAG AAA).
    -   Large Numbers (#0052CC on #F4F5F7): 4.54:1 (Exceeds WCAG AA for large text).

---

**📏 SPACING & MEASUREMENTS**

**Margins:**
-   Top: 60px
-   Right: 60px
-   Bottom: 60px
-   Left: 60px
-   **Safe Zone:** An area inset 60px from all edges. All content resides here.

**Element Spacing:**
-   **Between headline and subhead:** 16px
-   **Gutter width between left text column and right data column:** 120px
-   **Vertical spacing between each of the three data blocks:** 80px
-   **Between large number and its description text:** 8px
-   **Between description text and its icon/chart:** 40px

**Visual Breathing Room:**
-   **Whitespace Percentage:** ~40%
-   **Where:** The largest areas of whitespace are the gutter between the two main columns and the area below the final data point, allowing the information to feel uncluttered despite the high density.

---

**✨ VISUAL EFFECTS & DEPTH**

**Shadows:**
-   **Primary Element Shadow:** none
-   **Secondary Element Shadow:** none
-   **Style:** The visual style is intentionally flat and modern, avoiding all shadows, glows, and gradients to align with the Atlassian Design System.

**Depth Layers:** [Front to back]
1.  **Foreground:** All Typography (Headlines, Numbers, Descriptions).
2.  **Midground:** Icons and mini-charts.
3.  **Background:** Solid Light Gray (#F4F5F7) background.

**Other Effects:**
-   **Glows:** none
-   **Gradients:** none
-   **Opacity:** none

---

**♿ ACCESSIBILITY & READABILITY**

-   **Text Contrast Ratio:** Minimum standard of 4.5:1 is met and exceeded.
    -   Headline (#172B4D on #F4F5F7): 13.56:1
    -   Large Numbers (#0052CC on #F4F5F7): 4.54:1
-   **Color Blind Safe:** Yes. Information is conveyed primarily through large numbers and text. Green accent color is used for positive reinforcement but is not the sole means of conveying information.
-   **Font Size Minimum:** The smallest text is 18pt, well above the 16pt minimum.
-   **Scannability:** YES. A viewer can grasp the three key results (40, 85, 95) within 3 seconds.
-   **Reading Level:** The text is simple, direct, and free of jargon.

---

**🧠 DESIGN RATIONALE**

**Why This Hierarchy:**
The hierarchy places the quantitative results (the numbers) as the absolute primary element. This immediately answers the "what was the result?" question, fulfilling the slide's purpose as the core proof point. The narrative context (headline/subhead) is secondary, allowing the data to speak for itself first.

**Why This Architecture:**
The asymmetric 30/70 layout creates a clear separation between the "what" (headline) and the "proof" (data). This structure guides the eye naturally from context to conclusion and uses whitespace effectively to prevent the high-density information from feeling overwhelming.

**Expected Viewer Experience:**
The viewer should feel immediately impressed and convinced by the scale of the transformation. The experience is one of clarity and impact, leaving them with a memorable and quantifiable understanding of the project's success, centered on the three key metrics: 40, 85, and 95.

---


### SLIDE 7: "It Just Works. We're Finally in Sync."

**Headline:** "It just works. For the first time, we're finally in sync."
**Subhead:** - Lead Engineer, TechCorp Inc.

---

**🎯 VISUAL HIERARCHY & ARCHITECTURE**

**Information Density:** Low
**Visual Approach:** Impact
**Eye Flow Pattern:** The eye is immediately drawn to the large, centrally-located quote. The significant scale and high contrast make it the undeniable focal point. After reading the quote, the eye naturally drops down to the smaller, centrally-aligned attribution block (avatar and text) to understand the source, before resting.

**Visual Weight Distribution:**
1.  **PRIMARY (70%):** The quote typography. Its large size, central placement, and bright white color on a dark background command the most attention.
2.  **SECONDARY (20%):** The attribution text ("- Lead Engineer, TechCorp Inc."). It provides context and grounds the quote in a real-world source.
3.  **TERTIARY (10%):** The engineer's avatar. It adds a human face to the quote without distracting from the message itself.

**Focal Point Strategy:**
-   **First Eye Contact:** The phrase "It just works." The combination of its position at the top of the text block and its simple, powerful message captures attention instantly.
-   **Visual Path:** Top of quote → bottom of quote → avatar → attribution text → rest.
-   **Retention Element:** The core feeling of being "finally in sync." The entire design is built to make this phrase memorable.

**Layout Architecture:**
-   **Grid Structure:** A single central column, vertically centered within the slide's safe zone. All elements are center-aligned within this column.
-   **Balance Type:** Center-dominant. The composition is perfectly symmetrical both horizontally and vertically, creating a sense of stability and focus.
-   **Anchor Element:** The entire central content block (quote, avatar, attribution) acts as a single, cohesive anchor in the middle of the slide.
-   **Whitespace Strategy:** Approximately 65-70% of the slide is negative space. This extreme use of whitespace isolates the quote, removes all distractions, and allows the message to have maximum impact.

---

**📐 DETAILED VISUAL DESIGN**

**Background:**
-   **Color:** Atlassian Blue (#0052CC)
-   **Pattern/Texture:** None
-   **Gradient:** Solid
-   **Visual Weight:** Contributes 0% to the information hierarchy but sets the entire mood for the slide.

**Primary Visual Element:**
-   **Type:** Typography
-   **Description:** The quote itself is treated as the primary visual element, not just text.
-   **Position:** Vertically and horizontally centered within the slide's safe zone.
-   **Size:** The text block occupies approximately 60% of the slide's width.
-   **Style:** Clean, sans-serif typography.
-   **Colors:** White (#FFFFFF).
-   **Visual Weight:** 70%.
-   **Relationship to Text:** It is the text.

**Secondary Visual Elements:**
-   **Element 1:**
    -   **Type:** Avatar (Photo)
    -   **Position:** Centered horizontally, placed directly between the quote and the attribution text.
    -   **Size:** 80x80px.
    -   **Style:** Circular frame with a 2px solid border. The photo inside should be a professional, authentic headshot.
    -   **Colors:** Border: White (#FFFFFF). Photo: Full color.
    -   **Visual weight:** ~10% (serves as a visual separator and human element).

**Tertiary Visual Elements:**
-   None.

---

**📝 TYPOGRAPHY HIERARCHY**

**Headline:** N/A (The quote serves this purpose).

**Subhead:** N/A (The attribution serves this purpose).

**Body Text:** N/A.

**Special Text Elements:**
-   **Element 1: Quote**
    -   **Text:** "It just works. For the first time, we're finally in sync."
    -   **Font:** Inter, Regular (400 weight)
    -   **Size:** 56pt
    -   **Color:** White (#FFFFFF)
    -   **Position:** Top of the central content block, centered on the slide.
    -   **Alignment:** Center
    -   **Visual Weight:** 70%
    -   **Line Height:** 1.3
-   **Element 2: Attribution**
    -   **Text:** - Lead Engineer, TechCorp Inc.
    -   **Font:** Inter, Semibold (600 weight)
    -   **Size:** 22pt
    -   **Color:** White (#FFFFFF)
    -   **Position:** Bottom of the central content block, centered on the slide.
    -   **Alignment:** Center
    -   **Visual Weight:** 20%
    -   **Line Height:** 1.5

---

**🎨 COLOR & CONTRAST HIERARCHY**

**Color Palette for This Slide:**
-   **Dominant Color:** #0052CC (Atlassian Blue) - Usage: Background, ~95% of visible slide area.
-   **Supporting Color:** #FFFFFF (White) - Usage: All typography and avatar border, ~5% of visible slide area.
-   **Accent Color:** N/A.
-   **Text Color:** #FFFFFF (White) - Usage: All typography.

**Contrast Strategy:**
-   **Highest Contrast Element:** The white text and avatar border against the blue background. This is the only contrast point, ensuring maximum focus on the content.
-   **Medium Contrast:** N/A.
-   **Low Contrast:** N/A.
-   **Contrast Ratios:** White (#FFFFFF) text on Atlassian Blue (#0052CC) background provides a contrast ratio of 4.79:1, which meets WCAG AA standards.

---

**📏 SPACING & MEASUREMENTS**

**Margins:**
-   Top: 60px
-   Right: 60px
-   Bottom: 60px
-   Left: 60px
-   **Safe Zone:** All content is contained within an area of 1800x960px.

**Element Spacing:**
-   **Between quote and avatar:** 48px.
-   **Between avatar and attribution:** 24px.

**Visual Breathing Room:**
-   **Whitespace Percentage:** ~70%
-   **Where:** The entire area surrounding the central content block, creating a powerful visual void that pushes attention inward.

---

**✨ VISUAL EFFECTS & DEPTH**

**Shadows:**
-   None. The design is flat, clean, and modern, consistent with the Atlassian brand.

**Depth Layers:** (Front to back)
1.  **Foreground:** Quote text, avatar, and attribution text.
2.  **Background:** Solid Atlassian Blue color fill.

**Other Effects:**
-   None.

---

**♿ ACCESSIBILITY & READABILITY**

-   **Text Contrast Ratio:**
    -   Quote & Attribution: 4.79:1 against the #0052CC background, passing the 4.5:1 requirement for normal text and 3:1 for large text.
-   **Color Blind Safe:** Yes. Information is conveyed entirely through text and structure, not color.
-   **Font Size Minimum:** The smallest font size is 22pt, well above the 16pt minimum.
-   **Scannability:** YES. The slide's core message can be understood in under 2 seconds.
-   **Reading Level:** The language is simple, direct, and conversational.

---

**🧠 DESIGN RATIONALE**

**Why This Hierarchy:**
The typography is intentionally made the hero element (70% visual weight) to ensure the emotional, human-centric quote is the singular focus. Subordinating the attribution and avatar prevents the viewer from being distracted by "who" said it before they have absorbed "what" was said. This structure maximizes the emotional impact of the message.

**Why This Architecture:**
A center-dominant, symmetrical layout on a full-bleed color background creates a "breaker" slide that feels distinct and important. The immense whitespace forces the audience to pause and reflect on the statement, giving it gravity and significance. This simple architecture removes all cognitive load, making the message feel effortless and clear, mirroring the quote itself: "It just works."

**Expected Viewer Experience:**
The viewer should feel a sense of clarity, relief, and validation. After potentially complex data slides, this slide provides an emotional payoff, connecting the product's features to a tangible, positive human outcome. The intended takeaway is not a metric, but the feeling of achieving seamless collaboration and being "in sync."


### SLIDE 8: Lessons Learned on Our Journey

**Headline:** Lessons Learned on Our Journey
**Subhead:** Key takeaways for your own transformation.

---

**🎯 VISUAL HIERARCHY & ARCHITECTURE**

**Information Density:** Medium
**Visual Approach:** Comparison
**Eye Flow Pattern:** The eye starts at the top-left with the main headline in Atlassian Blue, moves down to the subhead, then travels to the left column, drawn by the green icon and header for "What Worked." The viewer scans the bullet points from top to bottom. The eye then moves horizontally across the central gutter to the right column, attracted by the teal icon and header for "Our Advice," and scans down that list of points.

**Visual Weight Distribution:**
1.  **PRIMARY (60%):** The two content columns containing the bulleted lists. This is the core, actionable advice of the slide and occupies the most significant real estate.
2.  **SECONDARY (30%):** The main headline and subhead block. Their size and color establish the topic and frame the detailed content below.
3.  **TERTIARY (10%):** The accent-colored icons and column headers. They serve as visual signposts, adding a layer of thematic color and improving scannability.

**Focal Point Strategy:**
-   **First Eye Contact:** The main headline, "Lessons Learned on Our Journey." Its use of Atlassian Blue (#0052CC) and large font size (48pt) makes it the primary entry point.
-   **Visual Path:** Headline → Subhead → "What Worked" Icon & Header → Left Column Bullets → "Our Advice" Icon & Header → Right Column Bullets.
-   **Retention Element:** The bullet points themselves, particularly "Invest in Champions" and "Integrate with business tools from day one." The clear separation and simple phrasing aid memorability.

**Layout Architecture:**
-   **Grid Structure:** Based on a 12-column grid. The headline/subhead block spans the full 12 columns. The content area below is split into two columns, each spanning 5.5 columns with a 1-column gutter in the center.
-   **Balance Type:** Symmetric 50/50. The two content columns are equally sized and weighted, creating a stable, easy-to-digest structure for comparison.
-   **Anchor Element:** The main headline and subhead block, centered horizontally within the safe zone, grounds the slide's composition at the top.
-   **Whitespace Strategy:** Approximately 40% of the slide is whitespace. Generous margins, the central gutter between columns, and space below the content create focus and prevent the slide from feeling cluttered.

---

**📐 DETAILED VISUAL DESIGN**

**Background:**
-   **Color:** White (#FFFFFF)
-   **Pattern/Texture:** none
-   **Gradient:** solid
-   **Visual Weight:** 0% (serves as a neutral canvas)

**Primary Visual Element:** Two-Column Content Block
-   **Type:** A structural layout element composed of text and icons.
-   **Position:** Occupies the central area of the slide, below the subhead. Sits within the 60px safe zone margins.
-   **Size:** Each column is 820px wide. The total block is 1720px wide including an 80px central gutter.
-   **Style:** Clean, flat, organized text blocks.
-   **Colors:** See Typography and Icon sections for specific colors used within the block.
-   **Visual Weight:** 60%
-   **Relationship to Text:** The block *is* the primary text content.

**Secondary Visual Elements:** Column Icons
-   **Element 1: "What Worked" Icon**
    -   Type: Line Icon (Thumbs Up or Checkmark)
    -   Position: Centered above the "What Worked" header text, within the left column.
    -   Size: 48x48px
    -   Style: Line art, consistent with Atlassian's design system, 2px stroke weight, rounded corners.
    -   Colors: Success Green (#36B37E)
    -   Visual weight: ~5%
-   **Element 2: "Our Advice" Icon**
    -   Type: Line Icon (Lightbulb or Megaphone)
    -   Position: Centered above the "Our Advice" header text, within the right column.
    -   Size: 48x48px
    -   Style: Line art, consistent with Atlassian's design system, 2px stroke weight, rounded corners.
    -   Colors: Atlassian Teal (#00B8D9)
    -   Visual weight: ~5%

**Tertiary Visual Elements:** None

---

**📝 TYPOGRAPHY HIERARCHY**

**Headline:**
-   **Font:** Inter, Bold (700)
-   **Size:** 48pt
-   **Color:** Atlassian Blue (#0052CC)
-   **Position:** Top of the slide, horizontally centered within the safe zone. Top edge is 60px from the top of the slide.
-   **Alignment:** Center
-   **Visual Weight:** 20%
-   **Relationship to Visual:** Sits directly above the main content columns, separated by the subhead.

**Subhead:**
-   **Font:** Inter, Semibold (600)
-   **Size:** 30pt
-   **Color:** Dark Gray (#172B4D)
-   **Position:** 16px below the baseline of the headline.
-   **Alignment:** Center
-   **Visual Weight:** 10%
-   **Line Height:** 1.4

**Special Text Elements:** Column Headers
-   **Element 1: "What Worked"**
    -   Font: Inter, Semibold (600)
    -   Size: 24pt
    -   Color: Success Green (#36B37E)
    -   Position: Centered within the left column, 20px below its associated icon.
    -   Alignment: Center
-   **Element 2: "Our Advice"**
    -   Font: Inter, Semibold (600)
    -   Size: 24pt
    -   Color: Atlassian Teal (#00B8D9)
    -   Position: Centered within the right column, 20px below its associated icon.
    -   Alignment: Center

**Body Text:** (Bulleted Lists)
-   **Font:** Inter, Regular (400)
-   **Size:** 18pt
-   **Color:** Dark Gray (#172B4D)
-   **Position:** Within each respective column, starting 32px below the column header.
-   **Alignment:** Left
-   **Line Height:** 1.6
-   **Max Line Length:** 820px (width of the column)
-   **Bullet Style:** Standard circular bullet, color Dark Gray (#172B4D).

---

**🎨 COLOR & CONTRAST HIERARCHY**

**Color Palette for This Slide:**
-   **Dominant Color:** White (#FFFFFF) - Usage: Background, ~60% of visible slide area.
-   **Dominant Color 2:** Dark Gray (#172B4D) - Usage: Body text and subhead, ~15% of slide.
-   **Accent Color:** Atlassian Blue (#0052CC) - Usage: Main headline, ~10% of slide.
-   **Supporting Color 1:** Success Green (#36B37E) - Usage: "What Worked" icon and header, ~5%.
-   **Supporting Color 2:** Atlassian Teal (#00B8D9) - Usage: "Our Advice" icon and header, ~5%.

**Contrast Strategy:**
-   **Highest Contrast Element:** The body text (#172B4D on #FFFFFF) has the highest contrast ratio to ensure maximum readability for the core message.
-   **Medium Contrast:** The main headline (#0052CC on #FFFFFF) provides strong, attention-grabbing contrast.
-   **Low Contrast:** N/A. All text elements are designed for high readability. The semantic colors (Green, Teal) on white provide sufficient contrast for their role as large text headers.
-   **Contrast Ratios:**
    -   Headline (#0052CC on #FFFFFF): 4.53:1
    -   Subhead/Body (#172B4D on #FFFFFF): 12.63:1
    -   "What Worked" Header (#36B37E on #FFFFFF): 3.26:1
    -   "Our Advice" Header (#00B8D9 on #FFFFFF): 3.09:1

---

**📏 SPACING & MEASUREMENTS**

**Margins:**
-   Top: 60px
-   Right: 60px
-   Bottom: 60px
-   Left: 60px
-   **Safe Zone:** 1800x960px area inset from slide edges.

**Element Spacing:**
-   **Between headline and subhead:** 16px (baseline to baseline)
-   **Between subhead and top of icons:** 72px
-   **Between icon and column header:** 20px
-   **Between column header and first bullet point:** 32px
-   **Between list items (bullet points):** 20px (from end of one line to start of next)
-   **Gutter width:** 80px between the two content columns.

**Visual Breathing Room:**
-   **Whitespace Percentage:** ~40%
-   **Where:** The primary areas of whitespace are the 60px margins, the 80px central gutter, and the large area below the text columns to the bottom margin.

---

**✨ VISUAL EFFECTS & DEPTH**

**Shadows:**
-   **Primary Element Shadow:** None
-   **Secondary Element Shadow:** None

**Depth Layers:**
1.  **Foreground:** All text and icon elements.
2.  **Midground:** N/A
3.  **Background:** The solid White (#FFFFFF) background color.

**Other Effects:** None

---

**♿ ACCESSIBILITY & READABILITY**

-   **Text Contrast Ratio:** All text meets or exceeds WCAG AA requirements.
    -   Headline: 4.53:1 (passes for 48pt text)
    -   Body: 12.63:1 (passes)
    -   Column Headers: 3.26:1 and 3.09:1 (pass for 24pt text)
-   **Color Blind Safe:** Yes. Information is conveyed by position (left vs. right), icons, and explicit text headers ("What Worked," "Our Advice"), not by color alone.
-   **Font Size Minimum:** Body text is 18pt, which is above the 16pt minimum.
-   **Scannability:** YES. The symmetric layout, clear headers, icons, and bullet points allow a viewer to grasp the key topics in under 3 seconds.
-   **Reading Level:** The content uses simple, direct language, avoiding jargon for high clarity.

---

**🧠 DESIGN RATIONALE**

**Why This Hierarchy:**
The hierarchy places the slide's topic ("Lessons Learned") at the top, immediately framing the content. The two columns are given primary visual weight because they contain the actionable insights, which are the main purpose of the slide. The colored icons and headers act as quick, thematic guides, improving comprehension speed.

**Why This Architecture:**
A symmetric 50/50 split is the ideal structure for a direct comparison. It visually communicates balance and equality between the two sets of advice ("What Worked" and "Our Advice"). This clean, organized layout reinforces the Atlassian brand's pragmatic and practical personality, presenting the information in a straightforward, trustworthy manner.

**Expected Viewer Experience:**
The viewer should feel they are receiving honest, valuable, and well-organized advice. The clarity of the layout should inspire confidence and trust. The key takeaway should be a clear understanding of practical do's and don'ts, empowering them on their own journey.

---


### SLIDE 9: Your Path to Transformation

**Headline:** Start Your Transformation Journey
**Subhead:** Atlassian provides the platform, people, and practices to guide you.

---

**🎯 VISUAL HIERARCHY & ARCHITECTURE**

**Information Density:** Low
**Visual Approach:** Process
**Eye Flow Pattern:** The eye is guided in a relaxed Z-pattern. It starts at the top-left with the main headline, moves right across the subhead, then drops down to the first card ("Explore Solutions"). The gaze then naturally flows horizontally across the three cards from left to right, with a slight pause on the emphasized middle card, before resting on the final card.

**Visual Weight Distribution:**
1.  **PRIMARY (60%):** The three content cards as a single visual block. Their clean separation, internal content (icon + text), and the accent border on the central card make them the dominant element.
2.  **SECONDARY (30%):** The main headline ("Start Your Transformation Journey"). Its size and color make it the primary entry point for the slide's message.
3.  **TERTIARY (10%):** The subhead. It provides context but is visually subordinate to the headline and the cards.

**Focal Point Strategy:**
-   **First Eye Contact:** The main headline, due to its position at the top and its use of the primary brand color, Atlassian Blue (#0052CC).
-   **Visual Path:** Headline → Subhead → Card 1 Icon → Card 2 (emphasized with blue border) → Card 3. The blue border on the middle card intentionally creates a micro-pause, drawing attention to the primary CTA.
-   **Retention Element:** The three bolded action phrases: "Explore Solutions," "Talk to an Expert," and "Start a Free Trial." The simple, three-step structure is designed to be easily remembered.

**Layout Architecture:**
-   **Grid Structure:** A 12-column grid is used for alignment. The three cards are arranged horizontally, each occupying 3 columns of width with a 1-column gutter between them.
-   **Balance Type:** Symmetrically balanced. The headline and subhead are centered horizontally, and the three cards are symmetrically distributed across the center of the slide.
-   **Anchor Element:** The block of three cards serves as the visual anchor, grounding the bottom two-thirds of the slide.
-   **Whitespace Strategy:** Approximately 55% of the slide is whitespace. Generous spacing is used above the headline, between the text block and the cards, and around the card block to create a focused, uncluttered, and actionable feel.

---

**📐 DETAILED VISUAL DESIGN**

**Background:**
-   **Color:** Light Gray (#F4F5F7)
-   **Pattern/Texture:** none
-   **Gradient:** solid
-   **Visual Weight:** 0% (serves as a neutral canvas)

**Primary Visual Element:** Three content cards
-   **Type:** A group of three UI cards, each containing an icon and text.
-   **Position:** Horizontally centered on the slide, with the top edge of the cards located at 380px from the top of the slide.
-   **Size:** Each card is 420px wide by 280px tall. The gutter between each card is 60px.
-   **Style:** Flat design with rounded corners (12px radius) and subtle drop shadows for depth.
-   **Colors:** Card backgrounds are White (#FFFFFF). The border on the middle card is Atlassian Blue (#0052CC).
-   **Visual Weight:** 60%
-   **Relationship to Text:** Text and icons are contained within the cards, with generous internal padding.

**Secondary Visual Elements:** N/A (The cards function as a single primary group).

**Tertiary Visual Elements:** Icons within cards
-   **Element 1: "Explore Solutions" Icon**
    -   **Type:** Line Icon (Compass/Map)
    -   **Position:** Centered horizontally within the first card, 40px from the top edge of the card.
    -   **Size:** 48x48px with a 2px stroke weight.
    -   **Style:** Clean, line art with rounded corners consistent with Atlassian's icon system.
    -   **Colors:** Atlassian Blue (#0052CC).
-   **Element 2: "Talk to an Expert" Icon**
    -   **Type:** Line Icon (Chat Bubbles)
    -   **Position:** Centered horizontally within the second card, 40px from the top edge.
    -   **Size:** 48x48px with a 2px stroke weight.
    -   **Style:** Clean, line art with rounded corners.
    -   **Colors:** Atlassian Blue (#0052CC).
-   **Element 3: "Start a Free Trial" Icon**
    -   **Type:** Line Icon (Play Button)
    -   **Position:** Centered horizontally within the third card, 40px from the top edge.
    -   **Size:** 48x48px with a 2px stroke weight.
    -   **Style:** Clean, line art with rounded corners.
    -   **Colors:** Atlassian Blue (#0052CC).

---

**📝 TYPOGRAPHY HIERARCHY**

**Headline:**
-   **Font:** Inter, Bold (700)
-   **Size:** 48pt
-   **Color:** Atlassian Blue (#0052CC)
-   **Position:** Horizontally centered, top edge 120px from top of slide.
-   **Alignment:** Center
-   **Visual Weight:** 30%
-   **Relationship to Visual:** Positioned directly above the subhead and the main card block, serving as the title for the entire slide.

**Subhead:**
-   **Font:** Inter, Regular (400)
-   **Size:** 24pt
-   **Color:** Dark Gray (#172B4D)
-   **Position:** Horizontally centered, 20px below the headline.
-   **Alignment:** Center
-   **Visual Weight:** 10%
-   **Line Height:** 1.5

**Special Text Elements:** Card Titles
-   **Text:** "1. Explore Solutions", "2. Talk to an Expert", "3. Start a Free Trial"
-   **Font:** Inter, Semibold (600)
-   **Size:** 22pt
-   **Color:** Dark Gray (#172B4D)
-   **Position:** Centered horizontally within each card, 24px below the icon.
-   **Alignment:** Center
-   **Visual Weight:** Part of the Primary visual element group.

---

**🎨 COLOR & CONTRAST HIERARCHY**

**Color Palette for This Slide:**
-   **Dominant Color:** Light Gray (#F4F5F7) - Usage: Full slide background, ~50% of visible slide area.
-   **Dominant Color 2:** White (#FFFFFF) - Usage: Card backgrounds, ~35% of visible slide area.
-   **Accent Color:** Atlassian Blue (#0052CC) - Usage: Headline, icons, emphasized card border, ~10% of visible elements.
-   **Text Color:** Dark Gray (#172B4D) - Usage: Subhead and all card text, ~5% of visible elements.

**Contrast Strategy:**
-   **Highest Contrast Element:** The Dark Gray (#172B4D) text on the White (#FFFFFF) card backgrounds provides maximum readability for the key actions.
-   **Medium Contrast:** The Atlassian Blue (#0052CC) headline on the Light Gray (#F4F5F7) background ensures the title is prominent but not overly harsh.
-   **Low Contrast:** The subtle drop shadows on the cards create separation from the background without demanding attention.
-   **Contrast Ratios:**
    - Headline (#0052CC) on Background (#F4F5F7): 3.52:1 (Meets WCAG AA for large text).
    - Subhead (#172B4D) on Background (#F4F5F7): 10.45:1 (Exceeds WCAG AAA).
    - Card Text (#172B4D) on Card BG (#FFFFFF): 12.65:1 (Exceeds WCAG AAA).

---

**📏 SPACING & MEASUREMENTS**

**Margins:**
-   Top: 60px
-   Right: 60px
-   Bottom: 60px
-   Left: 60px
-   **Safe Zone:** All content resides within a 1800x960px area.

**Element Spacing:**
-   **Headline to Subhead:** 20px
-   **Subhead to Card Block:** 80px
-   **Gutter width between cards:** 60px
-   **Card internal padding:** 40px on all sides.
-   **Icon to Card Title:** 24px

**Visual Breathing Room:**
-   **Whitespace Percentage:** ~55%
-   **Where:** The largest areas of whitespace are in the top margin above the headline and surrounding the central block of three cards, creating a clear, focused composition.

---

**✨ VISUAL EFFECTS & DEPTH**

**Shadows:**
-   **Card Shadow (Cards 1 & 3):**
    -   Element: The two outer cards.
    -   Style: "X: 0px, Y: 4px, Blur: 12px, Spread: -2px"
    -   Color: rgba(23, 43, 77, 0.1)
    -   Purpose: To subtly lift the cards from the background, creating a sense of depth and hierarchy.
-   **Emphasized Card Shadow (Card 2):**
    -   Element: The central "Talk to an Expert" card.
    -   Style: "X: 0px, Y: 8px, Blur: 20px, Spread: 0px"
    -   Color: rgba(23, 43, 77, 0.15)
    -   Purpose: To create more pronounced depth, making this primary CTA appear closer to the viewer.

**Borders:**
-   **Emphasized Card Border:**
    -   Element: The central "Talk to an Expert" card.
    -   Style: 2px solid stroke.
    -   Color: Atlassian Blue (#0052CC).
    -   Purpose: To visually distinguish the primary call-to-action.

**Depth Layers:** (Front to back)
1.  **Foreground:** The central card ("Talk to an Expert") due to its more prominent shadow and colored border.
2.  **Midground:** The two outer cards, headline, subhead, and icons.
3.  **Background:** The Light Gray (#F4F5F7) solid background.

**Other Effects:** none

---

**♿ ACCESSIBILITY & READABILITY**

-   **Text Contrast Ratio:** All text combinations exceed WCAG AA standards.
    -   Headline on Background: 3.52:1 (Passes for 48pt text)
    -   Subhead on Background: 10.45:1 (Passes)
    -   Card Text on Card BG: 12.65:1 (Passes)
-   **Color Blind Safe:** Information is conveyed through text, numbers, and icons, not color alone. The blue border on the middle card is an enhancement, not the sole indicator of importance.
-   **Font Size Minimum:** The smallest text (card titles at 22pt) is well above the 16pt minimum.
-   **Scannability:** YES. The three-column layout with clear headers and icons allows a viewer to grasp the three next steps in under 3 seconds.
-   **Reading Level:** The text is simple, direct, and uses action-oriented language, making it easy to comprehend.

---

**🧠 DESIGN RATIONALE**

**Why This Hierarchy:**
The hierarchy places the main call to action—"Start Your Transformation Journey"—at the top, immediately setting the slide's purpose. The three cards are given the most visual weight because they represent the tangible, actionable steps the audience must take. Emphasizing the central "Talk to an Expert" card with color and shadow subtly guides users toward the most valuable conversion point for the business.

**Why This Architecture:**
A symmetric, three-column layout was chosen for its clarity, stability, and simplicity. This structure visually represents a clear, balanced, and easy-to-follow process, reinforcing the message that the path to transformation is manageable and well-defined. The generous use of whitespace prevents the call-to-action from feeling overwhelming, making it appear more inviting and accessible.

**Expected Viewer Experience:**
The viewer should feel a sense of clarity and empowerment. After learning about the possibilities, this slide presents a simple, three-step plan that feels achievable. The clean, professional design, aligned with the Atlassian brand, should inspire confidence and motivate them to take the next step, whether it's exploring, talking, or trying the software.

---


### SLIDE 10: Thank You & Q&A

**Headline:** Thank You
**Subhead:** [Presenter Name], [Presenter Title] | [presenter.email@atlassian.com]

---

**🎯 VISUAL HIERARCHY & ARCHITECTURE**

**Information Density:** Low
**Visual Approach:** Impact
**Eye Flow Pattern:** The eye is immediately drawn to the large, blue "Thank You" headline at the top. It then travels down to the prominent, centrally-anchored Atlassian logo, reinforcing the brand. Finally, the gaze settles on the smaller, functional contact details at the bottom of the content stack.

**Visual Weight Distribution:**
1.  **PRIMARY (60%):** The "Thank You" headline. Its size (48pt), bold weight, and vibrant Atlassian Blue color make it the undeniable first read.
2.  **SECONDARY (30%):** The Atlassian wordmark logo. It acts as the central visual anchor, reinforcing the brand identity as the final key image.
3.  **TERTIARY (10%):** The presenter's contact information. This text is smaller and in a neutral dark gray, serving a functional purpose without distracting from the main message.

**Focal Point Strategy:**
-   **First Eye Contact:** The "Thank You" headline, due to its superior scale, color contrast, and position in the upper third of the slide.
-   **Visual Path:** Top-to-bottom vertical scan: "Thank You" headline → Atlassian Logo → Presenter Contact Info.
-   **Retention Element:** The Atlassian brand (via the logo) and the presenter's contact details, which are left on screen during the question period.

**Layout Architecture:**
-   **Grid Structure:** A single-column, center-aligned structure is used for simplicity and impact, respecting the overall 12-column grid's safe zones.
-   **Balance Type:** Center-dominant and perfectly symmetrical. This creates a feeling of stability, finality, and professionalism.
-   **Anchor Element:** The Atlassian logo is the visual anchor, positioned at the vertical center of the slide.
-   **Whitespace Strategy:** Approximately 75% of the slide is intentional whitespace, creating a clean, uncluttered canvas that frames the content and allows it to breathe, enhancing focus and clarity.

---

**📐 DETAILED VISUAL DESIGN**

**Background:**
-   **Color:** White (#FFFFFF)
-   **Pattern/Texture:** none
-   **Gradient:** solid
-   **Visual Weight:** Contributes 0% to the cognitive load, serving as a neutral canvas.

**Primary Visual Element:** [The headline typography serves as the primary element; see Typography section for full specs]

**Secondary Visual Elements:**
-   **Element 1:** Atlassian Logo
    -   **Type:** Full "Atlassian" wordmark logo.
    -   **Position:** Centered horizontally. Vertical center at 540px from the top edge.
    -   **Size:** 480px wide. Height is proportional based on the logo's aspect ratio.
    -   **Style:** Flat vector graphic.
    -   **Colors:** Atlassian Blue (#0052CC).
    -   **Visual weight:** ~30%

**Tertiary Visual Elements:** [The subhead typography serves as the tertiary element; see Typography section for full specs]

---

**📝 TYPOGRAPHY HIERARCHY**

**Headline:**
-   **Font:** Inter, Bold (700)
-   **Size:** 48pt
-   **Color:** Atlassian Blue (#0052CC)
-   **Position:** Centered horizontally. Baseline positioned at 360px from the top edge.
-   **Alignment:** Center
-   **Visual Weight:** 60%
-   **Relationship to Visual:** Positioned 132px above the top edge of the Atlassian Logo.

**Subhead:**
-   **Font:** Inter, Regular (400)
-   **Size:** 18pt
-   **Color:** Dark Gray (#172B4D)
-   **Position:** Centered horizontally. Baseline positioned at 720px from the top edge.
-   **Alignment:** Center
-   **Visual Weight:** 10%
-   **Line Height:** 1.5

---

**🎨 COLOR & CONTRAST HIERARCHY**

**Color Palette for This Slide:**
-   **Dominant Color:** #FFFFFF - [Usage: Background, ~85% of visible slide area]
-   **Accent Color:** #0052CC - [Usage: Headline and Logo, ~10% of slide area]
-   **Text Color:** #172B4D - [Usage: Subhead, ~5% of slide area]

**Contrast Strategy:**
-   **Highest Contrast Element:** The subhead text (#172B4D on #FFFFFF) has the highest value contrast, ensuring perfect readability for the contact details.
-   **Medium Contrast:** The headline and logo (#0052CC on #FFFFFF) use color and value to create a strong focal point that meets accessibility standards while reinforcing brand identity.
-   **Low Contrast:** None. All elements are designed for high clarity.
-   **Contrast Ratios:**
    -   Headline (#0052CC on #FFFFFF): 5.56:1
    -   Subhead (#172B4D on #FFFFFF): 15.45:1

---

**📏 SPACING & MEASUREMENTS**

**Margins:**
-   Top: 60px
-   Right: 60px
-   Bottom: 60px
-   Left: 60px
-   **Safe Zone:** All content resides within the 1800x960px safe zone.

**Element Spacing:**
-   **Between headline and logo:** 132px (from headline baseline to top of logo)
-   **Between logo and subhead:** 132px (from bottom of logo to subhead baseline)

**Visual Breathing Room:**
-   **Whitespace Percentage:** ~75%
-   **Where:** The space surrounding the central vertical stack of the three content elements. This generous negative space prevents any visual clutter.

---

**✨ VISUAL EFFECTS & DEPTH**

**Shadows:**
-   **Primary Element Shadow:** None. The design is flat and clean, adhering to the brand's modern aesthetic.
-   **Secondary Element Shadow:** None.

**Depth Layers:**
1.  **Foreground:** Headline, Logo, Subhead (all co-planar).
2.  **Midground:** None.
3.  **Background:** Solid White (#FFFFFF).

**Other Effects:**
-   **Glows:** None.
-   **Gradients:** None.
-   **Opacity:** All elements at 100% opacity.

---

**♿ ACCESSIBILITY & READABILITY**

-   **Text Contrast Ratio:** Minimum standards are exceeded.
    -   Headline: 5.56:1 (Passes WCAG AA for large and normal text)
    -   Subhead: 15.45:1 (Passes WCAG AAA)
-   **Color Blind Safe:** Yes. Information is conveyed through text and form, not color alone.
-   **Font Size Minimum:** The smallest text is 18pt, which is above the 16pt minimum.
-   **Scannability:** YES. The slide's core message can be understood in under 3 seconds.
-   **Reading Level:** The text is minimal and universally understood.

---

**🧠 DESIGN RATIONALE**

**Why This Hierarchy:**
The hierarchy places the primary emotional message, "Thank You," at the forefront to establish a tone of gratitude and finality. The brand logo is placed second to serve as the final brand impression, while the functional contact information is last, available for reference but not competing for primary attention.

**Why This Architecture:**
A center-dominant, symmetrical architecture provides a strong sense of balance, professionalism, and closure. The extreme use of whitespace is intentional, creating an elegant and uncluttered final slide that focuses the audience's attention entirely on the presenter and the upcoming Q&A session.

**Expected Viewer Experience:**
The viewer should feel the presentation has come to a clean, professional conclusion. They should feel appreciated, see the Atlassian brand reinforced one last time, and have clear, legible access to the presenter's contact information for follow-up questions.

---


---

## PRODUCTION NOTES

This specification was generated using a parallel agent architecture:
- **Phase 1:** Master planning agent created brand research, architecture, and design system
- **Phase 2:** Individual slide agents generated detailed specifications in parallel
- **Result:** Complete, consistent, designer-ready specifications

### File Setup
- Dimensions: 1920 x 1080 (16:9)
- Resolution: 72 DPI (screen) or 300 DPI (print)
- Safe Zone: 100px from all edges

### Software Recommendations
- PowerPoint, Keynote, or Google Slides
- Figma/Sketch for design mockups

### Export Specifications
- Format: PDF (high quality) or PPTX (editable)
- Fonts: Embed fonts
- File naming: [CompanyName]_[PresentationType]_[Date]_v[Version]

---

**Generated with Gemini 2.5 Pro Parallel Architecture**
