# Deckr.ai Product Deck - Visual Design Specification

**Deck Purpose:** Product showcase deck for sales teams (not investor pitch)
**Inspiration:** Stripe, Notion, Linear, Figma product decks
**Slide Count:** 12 slides
**Aspect Ratio:** 16:9 (1920×1080px)

---

## 🎨 Brand Design System

### Color Palette
```
PRIMARY COLORS:
- Deckr Indigo:     #6366F1  (Primary brand color)
- Deep Indigo:      #4F46E5  (Hover states, depth)
- Deckr Purple:     #9333EA  (Accent, highlights)
- Gradient:         linear-gradient(135deg, #6366F1, #9333EA)

NEUTRALS:
- Charcoal:         #1F2937  (Headings, body text)
- Slate:            #64748B  (Subtext, captions)
- Light Gray:       #F1F5F9  (Backgrounds, dividers)
- Pure White:       #FFFFFF  (Canvas, cards)

SEMANTIC COLORS:
- Success Green:    #10B981  (Checkmarks, positive metrics)
- Warning Amber:    #F59E0B  (Highlights, call-outs)
- Error Red:        #EF4444  (Problems, before states)
```

### Typography
```
FONT FAMILY:
- Primary: Inter (Clean, modern, tech-forward)
- Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI"

FONT SIZES:
- Hero Headline:    72pt / 96px  (Bold, 700)
- Section Title:    48pt / 64px  (Semibold, 600)
- Slide Headline:   36pt / 48px  (Semibold, 600)
- Subheadline:      24pt / 32px  (Medium, 500)
- Body Large:       18pt / 24px  (Regular, 400)
- Body:             16pt / 21px  (Regular, 400)
- Caption:          14pt / 19px  (Regular, 400)
- Tiny:             12pt / 16px  (Medium, 500)

LINE HEIGHT:
- Headlines: 1.1 (tight, impactful)
- Body: 1.5 (readable, spacious)
- Captions: 1.4 (balanced)
```

### Layout Grid
```
CANVAS: 1920×1080px (16:9)

MARGINS:
- Left/Right: 120px
- Top/Bottom: 80px
- Safe Zone: 1680×920px (content area)

GRID SYSTEM:
- 12-column grid
- Gutter: 40px
- Column width: 100px
```

---

## SLIDE 1: HERO / TITLE SLIDE

### Visual Concept
**Inspiration:** Stripe Atlas hero, Linear launch deck
**Mood:** Bold, confident, tech-forward

### Layout Description
```
BACKGROUND:
- Base: Pure White (#FFFFFF)
- Gradient Overlay:
  - Position: Bottom-right corner
  - Size: 800×800px circular gradient
  - Colors: Deckr Indigo (#6366F1) at 0%, fading to transparent at 100%
  - Opacity: 8% (subtle, not overwhelming)
  - Effect: Creates depth without dominating

MAIN CONTENT (Centered Vertically & Horizontally):

1. LOGO
   - Position: Top-left corner
   - Size: 160×40px
   - File: Deckr.ai wordmark (Indigo gradient)
   - Y-Position: 80px from top

2. HEADLINE
   - Text: "Sales Decks That Close Deals"
   - Font: Inter Bold, 96px
   - Color: #1F2937 (Charcoal)
   - Position: Centered, Y: 420px
   - Letter Spacing: -2px (tight, modern)
   - Max Width: 1200px

3. SUBHEADLINE
   - Text: "AI-powered presentations in 8 minutes, not 8 hours"
   - Font: Inter Medium, 32px
   - Color: #64748B (Slate)
   - Position: Centered, 60px below headline
   - Letter Spacing: -0.5px

4. STATS ROW (Horizontal, Centered)
   - Position: 100px below subheadline
   - Layout: 3 stats in a row, equal spacing (300px apart)
   - Each Stat:
     - Number: Inter Bold, 48px, Gradient text (#6366F1 → #9333EA)
     - Label: Inter Regular, 16px, #64748B

   Stats Content:
   LEFT:   "35×"          MIDDLE:  "300%"         RIGHT:  "8 min"
           "Faster"               "Quota"                 "Per Deck"

BOTTOM DECORATION:
- Element: Floating screenshot preview
- Position: Bottom-right, X: 1200px, Y: 780px
- Content: Miniature screenshot of Deckr.ai interface
- Size: 480×270px (16:9 scaled)
- Shadow: 0 30px 60px rgba(99, 102, 241, 0.15)
- Border Radius: 12px
- Opacity: 90% (subtle, not main focus)
```

### Design Notes for Designer
- Keep background mostly white with subtle gradient accent
- Headline should be the hero - largest, boldest element
- Stats should use gradient text to draw eye
- Screenshot preview is decorative - don't let it dominate
- Overall feel: Clean, spacious, modern (like Stripe)

---

## SLIDE 2: THE PROBLEM

### Visual Concept
**Inspiration:** Notion "Before Notion" slide, Linear problem statement
**Mood:** Empathetic, relatable pain point

### Layout Description
```
BACKGROUND:
- Full slide: Light Gray (#F1F5F9)
- Creates visual separation from hero slide

HEADER:
1. EYEBROW TEXT
   - Text: "THE PROBLEM"
   - Font: Inter Medium, 14px, all caps
   - Color: #9333EA (Purple)
   - Letter Spacing: 1.5px (spaced out caps)
   - Position: Top-left, X: 120px, Y: 120px

2. HEADLINE
   - Text: "Sales Reps Spend 5+ Hours Per Deck"
   - Font: Inter Semibold, 64px
   - Color: #1F2937 (Charcoal)
   - Position: Below eyebrow, Y: 180px
   - Max Width: 1200px

3. SUBHEAD
   - Text: "While their quota clock keeps ticking"
   - Font: Inter Regular, 24px
   - Color: #64748B (Slate)
   - Position: Below headline, Y: 280px

MAIN CONTENT (3-Column Pain Point Grid):
- Position: Y: 400px
- Layout: 3 equal columns, 40px gutters
- Each Column Width: 440px

COLUMN 1 - TIME BANKRUPTCY:
  Icon: Clock emoji (⏰) or simple clock icon
  - Size: 48×48px
  - Color: Error Red (#EF4444)
  - Position: Top of column

  Stat:
  - Number: "5-7 hours"
  - Font: Inter Bold, 36px
  - Color: #EF4444 (Error Red - emphasizes pain)

  Label:
  - Text: "per custom deck"
  - Font: Inter Regular, 16px
  - Color: #64748B
  - Margin Top: 8px

  Description:
  - Text: "2 hours finding brand assets, 2 hours creating layouts, 1 hour on revisions"
  - Font: Inter Regular, 15px
  - Color: #64748B
  - Line Height: 1.5
  - Margin Top: 16px

COLUMN 2 - QUALITY CRISIS:
  Icon: Warning triangle icon
  - Size: 48×48px
  - Color: Warning Amber (#F59E0B)

  Stat:
  - Number: "12-18%"
  - Font: Inter Bold, 36px
  - Color: #F59E0B (Warning Amber)

  Label:
  - Text: "average win rate"
  - Font: Inter Regular, 16px
  - Color: #64748B

  Description:
  - Text: "Generic templates don't match prospect's brand. Off-brand = no trust"
  - Font: Inter Regular, 15px
  - Color: #64748B
  - Line Height: 1.5

COLUMN 3 - COST IMPACT:
  Icon: Money bag emoji (💰) or dollar icon
  - Size: 48×48px
  - Color: Error Red (#EF4444)

  Stat:
  - Number: "$18,750"
  - Font: Inter Bold, 36px
  - Color: #EF4444

  Label:
  - Text: "per rep, per quarter"
  - Font: Inter Regular, 16px
  - Color: #64748B

  Description:
  - Text: "Designer costs or lost selling time. Either way, you're bleeding money"
  - Font: Inter Regular, 15px
  - Color: #64748B
  - Line Height: 1.5

BOTTOM QUOTE (Optional, adds weight):
- Position: Bottom-center, Y: 920px
- Layout: Centered quote box
- Background: White, subtle shadow
- Padding: 24px 40px
- Border Radius: 12px

Quote Text:
  - Text: "I spend more time making decks than actually selling"
  - Font: Inter Medium, 18px, Italic
  - Color: #1F2937

Attribution:
  - Text: "— Enterprise AE, Series C SaaS"
  - Font: Inter Regular, 14px
  - Color: #64748B
  - Margin Top: 8px
```

### Design Notes for Designer
- Use Error Red (#EF4444) strategically to emphasize pain
- Icons should be simple, not illustrated (flat, mono-color)
- Light gray background creates visual break from white slides
- Quote adds human element - use if space allows
- Keep alignment strict - everything on grid

---

## SLIDE 3: THE SOLUTION (DECKR.AI INTRO)

### Visual Concept
**Inspiration:** Figma "What is Figma" slide, Linear product intro
**Mood:** Confident, modern, "here's the answer"

### Layout Description
```
BACKGROUND:
- Gradient: Diagonal 135deg, #6366F1 (top-left) → #9333EA (bottom-right)
- Full bleed, no margins
- Text: All white for contrast

CONTENT (Centered Vertically):

1. EYEBROW
   - Text: "INTRODUCING"
   - Font: Inter Medium, 14px, all caps
   - Color: rgba(255, 255, 255, 0.7) (70% white)
   - Letter Spacing: 2px
   - Position: Centered, Y: 360px

2. LOGO LOCKUP
   - Position: Centered, Y: 420px
   - Layout: Logo + Wordmark horizontal
   - Deckr.ai Logo: 80×80px (white version)
   - Wordmark: Inter Bold, 72px, White
   - Spacing: 24px between logo and text

3. TAGLINE
   - Text: "AI-Powered Sales Decks"
   - Font: Inter Medium, 36px
   - Color: rgba(255, 255, 255, 0.9) (90% white)
   - Position: Centered, 60px below logo
   - Letter Spacing: -0.5px

4. VALUE PROP (Single Line)
   - Text: "Upload your prospect's template → Get pixel-perfect slides in 8 minutes"
   - Font: Inter Regular, 24px
   - Color: rgba(255, 255, 255, 0.8) (80% white)
   - Position: Centered, 40px below tagline
   - Max Width: 1200px

BOTTOM ELEMENT (Product Teaser):
- Position: Bottom-center, Y: 840px
- Layout: Simple workflow diagram (3 steps)
- Background: rgba(255, 255, 255, 0.1) (10% white overlay)
- Backdrop Blur: 20px (frosted glass effect)
- Padding: 32px 60px
- Border Radius: 16px
- Border: 1px solid rgba(255, 255, 255, 0.2)

Workflow Steps (Horizontal):
  STEP 1:
    Icon: Upload arrow (white)
    Text: "Upload PDF"
    Font: Inter Medium, 16px, White

  STEP 2 (Arrow between):
    Icon: → (white, 24px)

  STEP 3:
    Icon: Magic wand/sparkle (white)
    Text: "AI Generates"
    Font: Inter Medium, 16px, White

  STEP 4 (Arrow):
    Icon: → (white, 24px)

  STEP 5:
    Icon: Checkmark (white)
    Text: "Perfect Match"
    Font: Inter Medium, 16px, White
```

### Design Notes for Designer
- This slide is a "palate cleanser" - full brand gradient
- White text on gradient - ensure readability (90%+ opacity)
- Frosted glass effect on workflow - subtle, modern
- Don't add extra elements - keep it minimal and bold
- This is the "moment of reveal" - let gradient do the work

---

## SLIDE 4: HOW IT WORKS (3-STEP VISUAL)

### Visual Concept
**Inspiration:** Stripe "How Stripe Works", Notion process diagrams
**Mood:** Clear, simple, educational

### Layout Description
```
BACKGROUND:
- Pure White (#FFFFFF)

HEADER:
1. EYEBROW
   - Text: "HOW IT WORKS"
   - Font: Inter Medium, 14px, all caps
   - Color: #9333EA (Purple)
   - Position: X: 120px, Y: 100px

2. HEADLINE
   - Text: "From Prospect Name to Perfect Deck"
   - Font: Inter Semibold, 56px
   - Color: #1F2937
   - Position: Below eyebrow, Y: 140px

MAIN CONTENT (3-Step Vertical Timeline):
- Layout: Vertical timeline with left-aligned steps
- Position: Starts at Y: 300px
- Step Spacing: 200px vertical

TIMELINE VISUAL:
- Vertical line: 4px wide, #E5E7EB (light gray)
- Position: X: 280px (left third of slide)
- Height: 600px
- Connects all 3 steps

STEP 1:
  Circle Node (on timeline):
  - Size: 64×64px
  - Position: X: 248px (centered on line), Y: 300px
  - Background: White
  - Border: 4px solid #6366F1 (Indigo)
  - Number Inside: "1"
    - Font: Inter Bold, 28px
    - Color: #6366F1

  Content Box (Right of timeline):
  - Position: X: 360px, Y: 270px
  - Max Width: 1200px

  Label:
  - Text: "STEP 1 · UPLOAD"
  - Font: Inter Medium, 14px, all caps
  - Color: #6366F1
  - Letter Spacing: 1px

  Headline:
  - Text: "Upload Company Template"
  - Font: Inter Semibold, 32px
  - Color: #1F2937
  - Margin Top: 8px

  Description:
  - Text: "Drop in your prospect's 50-page slide deck (PDF). Deckr.ai extracts every slide as a reference template."
  - Font: Inter Regular, 18px
  - Color: #64748B
  - Line Height: 1.6
  - Margin Top: 12px

  Visual Element:
  - Position: Right side, X: 1400px, Y: 260px
  - Content: Simplified illustration of PDF upload
  - Style: Line art, purple (#9333EA) strokes
  - Size: 320×180px

STEP 2:
  Circle Node:
  - Position: Y: 500px
  - Border Color: #9333EA (Purple)
  - Number: "2", Color: #9333EA

  Content Box:
  - Position: X: 360px, Y: 470px

  Label:
  - Text: "STEP 2 · AI MATCH"
  - Color: #9333EA

  Headline:
  - Text: "AI Matches Your Content"
  - Font: Inter Semibold, 32px
  - Color: #1F2937

  Description:
  - Text: "Gemini analyzes layout, hierarchy, and spacing. Matches each slide to the perfect reference design."
  - Font: Inter Regular, 18px
  - Color: #64748B

  Visual Element:
  - Position: X: 1400px, Y: 460px
  - Content: Grid of 4 mini slides with AI matching lines
  - Style: Line art, indigo/purple
  - Size: 320×180px

STEP 3:
  Circle Node:
  - Position: Y: 700px
  - Border Color: #10B981 (Success Green)
  - Number: "3", Color: #10B981

  Content Box:
  - Position: X: 360px, Y: 670px

  Label:
  - Text: "STEP 3 · GENERATE"
  - Color: #10B981

  Headline:
  - Text: "Get Pixel-Perfect Slides"
  - Font: Inter Semibold, 32px
  - Color: #1F2937

  Description:
  - Text: "Deckr.ai generates slides that look like they came from the company's design team. 95% match accuracy."
  - Font: Inter Regular, 18px
  - Color: #64748B

  Visual Element:
  - Position: X: 1400px, Y: 660px
  - Content: Before/After comparison (subtle)
  - Style: Mini screenshots
  - Size: 320×180px
```

### Design Notes for Designer
- Timeline creates visual flow (top to bottom)
- Use different colors per step to show progression
- Illustrations should be simple line art, not photo-realistic
- Right-side visuals are supporting - don't dominate
- This slide is about clarity - keep it clean

---

## SLIDE 5: FEATURE SHOWCASE #1 - BRAND INTELLIGENCE

### Visual Concept
**Inspiration:** Linear feature slides, Stripe product details
**Mood:** Technical, precise, "look how smart this is"

### Layout Description
```
BACKGROUND:
- White with subtle gray section on right

LAYOUT: Split Screen (60% Left / 40% Right)

LEFT SIDE (Feature Description):
1. ICON
   - Element: 🎨 or abstract brand icon
   - Size: 56×56px
   - Background: Light purple gradient circle (100×100px)
   - Position: X: 120px, Y: 120px

2. FEATURE NAME
   - Text: "Brand Intelligence"
   - Font: Inter Semibold, 48px
   - Color: #1F2937
   - Position: Below icon, Y: 260px

3. DESCRIPTION
   - Text: "Automatically extracts exact brand colors, fonts, and logos from any company website"
   - Font: Inter Regular, 24px
   - Color: #64748B
   - Line Height: 1.6
   - Position: Y: 340px
   - Max Width: 700px

4. STATS GRID (2×2):
   - Position: Y: 480px
   - Layout: 2 rows, 2 columns
   - Gap: 40px horizontal, 60px vertical

   STAT 1 (Top-Left):
   - Number: "65 sec"
   - Font: Inter Bold, 36px, Gradient (#6366F1 → #9333EA)
   - Label: "Brand research time"
   - Font: Inter Regular, 16px, #64748B

   STAT 2 (Top-Right):
   - Number: "95%"
   - Font: Inter Bold, 36px, Gradient
   - Label: "Color accuracy"

   STAT 3 (Bottom-Left):
   - Number: "Exact"
   - Font: Inter Bold, 36px, Gradient
   - Label: "Hex codes (#0052CC)"

   STAT 4 (Bottom-Right):
   - Number: "Official"
   - Font: Inter Bold, 36px, Gradient
   - Label: "Logos (SVG quality)"

5. CAPABILITIES LIST
   - Position: Y: 740px
   - Layout: Vertical checklist
   - Gap: 16px between items

   Each Item:
   - Icon: Checkmark (Success Green, 20×20px)
   - Text: "Extracts brand guidelines from website"
         "Identifies proprietary fonts"
         "Downloads official logos (not stock)"
   - Font: Inter Regular, 18px, #1F2937
   - Spacing: 12px between icon and text

RIGHT SIDE (Visual Demo):
- Background: #F1F5F9 (Light Gray) - creates visual separation
- Position: Starts at X: 1152px (60% of 1920)
- Full height

DEMO VISUALIZATION:
- Position: Centered in right column
- Content: Brand extraction mockup

Top Section (Website Preview):
  - Mini browser window mockup
  - URL bar: "atlassian.com"
  - Size: 420×240px
  - Shadow: Subtle

AI Extraction Lines (Animated feel):
  - Dotted/dashed lines from website to color swatches
  - Lines: 2px, #9333EA (Purple), 50% opacity
  - Should feel like "scanning" effect

Bottom Section (Extracted Brand):
  - Card with white background
  - Border Radius: 12px
  - Padding: 24px
  - Size: 420×300px
  - Shadow: 0 10px 30px rgba(0,0,0,0.08)

  Contents:
  - Heading: "Extracted Brand"
    Font: Inter Semibold, 18px, #1F2937

  - Color Swatches (Horizontal row):
    Swatch 1: #0052CC (Atlassian Blue)
    Swatch 2: #253858 (Deep Blue)
    Swatch 3: #6554C0 (Purple)
    Each: 60×60px, rounded corners (8px)
    Below each: Hex code in mono font

  - Font Display:
    Text: "Charlie Sans" (large sample)
    Font: Inter Bold, 24px (representing the font)

  - Logo:
    Atlassian logo (simplified)
    Size: 120×32px
```

### Design Notes for Designer
- Split screen creates "feature + proof" layout
- Left side: What it does (text)
- Right side: How it looks (visual)
- Use actual brand examples (Atlassian) for credibility
- Extraction lines show the AI "magic"
- Keep right side clean - it's a demo, not the hero

---

## SLIDE 6: FEATURE SHOWCASE #2 - REFERENCE MATCHING

### Visual Concept
**Inspiration:** Figma Auto Layout demos, Notion database views
**Mood:** Intelligent, precise, "this is the secret sauce"

### Layout Description
```
BACKGROUND:
- Inverse of previous slide (now right side is description)

LAYOUT: Split Screen (40% Left / 60% Right)

LEFT SIDE (Visual Demo):
- Background: #F1F5F9 (Light Gray)
- Position: 0 to X: 768px (40% of 1920)

BEFORE/AFTER COMPARISON:
- Position: Centered vertically
- Total Size: 660×800px

Top Label:
- Text: "UPLOADED TEMPLATE"
- Font: Inter Medium, 12px, all caps
- Color: #64748B
- Letter Spacing: 1px
- Position: Top of visual area

Reference Slide Preview:
- Size: 640×360px (16:9)
- Content: Screenshot of prospect's slide
- Border: 2px solid #E5E7EB
- Border Radius: 8px
- Shadow: 0 4px 12px rgba(0,0,0,0.06)

Matching Arrow:
- Position: Between slides
- Style: Thick arrow, 40px height
- Color: Gradient (#6366F1 → #9333EA)
- Label: "AI MATCHES 95%"
  Font: Inter Bold, 14px, White
  Inside arrow

Bottom Label:
- Text: "DECKR.AI GENERATED"
- Font: Inter Medium, 12px, all caps
- Color: #10B981 (Success Green)

Generated Slide Preview:
- Size: 640×360px
- Content: Deckr.ai slide that matches reference
- Border: 2px solid #10B981 (Success Green)
- Border Radius: 8px
- Shadow: 0 8px 24px rgba(16, 185, 129, 0.15)

RIGHT SIDE (Feature Description):
1. ICON
   - Element: 🎯 or target icon
   - Size: 56×56px
   - Background: Light indigo gradient circle
   - Position: X: 900px, Y: 120px

2. FEATURE NAME
   - Text: "Enterprise Reference Matching"
   - Font: Inter Semibold, 48px
   - Color: #1F2937
   - Position: Y: 260px

3. DESCRIPTION
   - Text: "Upload prospect's template → AI mimics their exact design language"
   - Font: Inter Regular, 24px
   - Color: #64748B
   - Position: Y: 340px
   - Max Width: 900px

4. HOW IT WORKS (Process Steps):
   - Position: Y: 460px
   - Layout: Vertical, numbered list
   - Gap: 32px between steps

   STEP 1:
   - Number: "1" (Circle, 32×32px, Indigo background, White text)
   - Text: "AI analyzes layout hierarchy (PRIMARY 70%, SECONDARY 20%, TERTIARY 10%)"
   - Font: Inter Regular, 18px
   - Color: #1F2937

   STEP 2:
   - Number: "2"
   - Text: "Extracts design blueprint (background, spacing, typography, colors)"

   STEP 3:
   - Number: "3"
   - Text: "Generates new slide that mimics reference design (95-98% match)"

5. RESULT METRIC (Large):
   - Position: Y: 740px
   - Background: Gradient (#6366F1 → #9333EA)
   - Padding: 32px 48px
   - Border Radius: 16px
   - Width: Fit content

   Number:
   - Text: "95-98%"
   - Font: Inter Bold, 56px
   - Color: White
   - Line Height: 1

   Label:
   - Text: "Quality Match Score"
   - Font: Inter Medium, 18px
   - Color: rgba(255,255,255,0.9)
   - Margin Top: 8px

6. PROOF POINT
   - Position: Y: 920px
   - Text: "Slides indistinguishable from company template"
   - Font: Inter Medium, 20px, Italic
   - Color: #9333EA (Purple)
```

### Design Notes for Designer
- Swap layout from previous slide (visual left, text right)
- Before/after comparison is the hero - make it prominent
- Green border on "after" slide shows success
- Matching arrow with percentage creates "wow" moment
- Use real slide examples (blurred if needed for confidentiality)

---

## SLIDE 7: THE RESULTS (Customer Success Story)

### Visual Concept
**Inspiration:** Stripe customer stories, Linear testimonial slides
**Mood:** Proof, credibility, "this actually works"

### Layout Description
```
BACKGROUND:
- White top half
- Light gray (#F1F5F9) bottom half
- Diagonal split at 35% from top

TOP SECTION (White Background):
1. EYEBROW
   - Text: "REAL RESULTS"
   - Font: Inter Medium, 14px, all caps
   - Color: #10B981 (Success Green)
   - Position: X: 120px, Y: 100px

2. HEADLINE
   - Text: "How Sarah Hit 300% Quota in Month 1"
   - Font: Inter Semibold, 56px
   - Color: #1F2937
   - Position: Y: 140px
   - Max Width: 1400px

3. CUSTOMER INFO
   - Position: Y: 240px

   Photo:
   - Size: 80×80px
   - Border Radius: 50% (circle)
   - Border: 4px solid #6366F1
   - Position: Left-aligned

   Text (Right of photo):
   - Name: "Sarah Chen"
     Font: Inter Semibold, 24px, #1F2937
   - Title: "Enterprise AE, SolarWinds"
     Font: Inter Regular, 18px, #64748B
   - Spacing: 20px left of photo

MIDDLE SECTION (Metrics Grid):
- Position: Y: 380px
- Layout: 3 columns, equal width
- Background: White cards elevated above split
- Each Card:
  - Size: 520×280px
  - Background: White
  - Border Radius: 16px
  - Shadow: 0 20px 40px rgba(0,0,0,0.08)
  - Padding: 48px

CARD 1 (BEFORE):
  Label:
  - Text: "BEFORE DECKR.AI"
  - Font: Inter Medium, 12px, all caps
  - Color: #EF4444 (Error Red)
  - Letter Spacing: 1px

  Metric:
  - Number: "85%"
  - Font: Inter Bold, 64px
  - Color: #EF4444

  Description:
  - Text: "Quota attainment"
  - Font: Inter Regular, 18px
  - Color: #64748B

  Sub-metrics:
  - Text: "5 hours per deck"
         "12% win rate"
  - Font: Inter Regular, 16px
  - Color: #9CA3AF
  - Line Height: 1.8

CARD 2 (AFTER - HERO):
  Label:
  - Text: "AFTER DECKR.AI"
  - Font: Inter Medium, 12px, all caps
  - Color: #10B981 (Success Green)

  Metric:
  - Number: "300%"
  - Font: Inter Bold, 72px (larger than others)
  - Color: Gradient (#6366F1 → #9333EA)
  - Text Shadow: 0 4px 12px rgba(99,102,241,0.2)

  Description:
  - Text: "Quota attainment"
  - Font: Inter Semibold, 18px (bolder)
  - Color: #1F2937

  Sub-metrics:
  - Text: "8 minutes per deck"
         "35% win rate"
  - Font: Inter Medium, 16px (bolder than Card 1)
  - Color: #10B981

CARD 3 (IMPACT):
  Label:
  - Text: "TOTAL IMPACT"
  - Font: Inter Medium, 12px, all caps
  - Color: #9333EA (Purple)

  Metric:
  - Number: "50+"
  - Font: Inter Bold, 64px
  - Color: #9333EA

  Description:
  - Text: "Custom decks created"
  - Font: Inter Regular, 18px
  - Color: #64748B

  Sub-metrics:
  - Text: "10× more volume"
         "$2M pipeline"
  - Font: Inter Regular, 16px
  - Color: #9CA3AF

BOTTOM SECTION (Quote):
- Position: Y: 820px
- Background: Light Gray (#F1F5F9)
- Layout: Centered

Quote Card:
- Background: White
- Max Width: 1200px
- Padding: 40px 60px
- Border Radius: 12px
- Border Left: 6px solid #6366F1 (accent)
- Shadow: 0 4px 12px rgba(0,0,0,0.04)

Quote Text:
- Text: "I used to spend entire Mondays making decks. Now I create custom presentations in minutes and spend my time actually selling. Deckr.ai doesn't just save time—it's given me my week back."
- Font: Inter Medium, 22px
- Color: #1F2937
- Line Height: 1.6
- Font Style: Italic
```

### Design Notes for Designer
- Middle cards are the hero - make them pop with shadow
- Card 2 (300%) should be visually dominant (larger text, gradient)
- Use gradient text only on the success metric
- Quote adds human voice - keep it readable
- Diagonal background split adds visual interest without distraction

---

## SLIDE 8: THE ROI (Calculator Visualization)

### Visual Concept
**Inspiration:** Stripe pricing calculators, Notion cost comparison
**Mood:** Data-driven, quantifiable, "show me the money"

### Layout Description
```
BACKGROUND:
- Pure White

HEADER:
1. EYEBROW
   - Text: "THE ROI"
   - Font: Inter Medium, 14px, all caps
   - Color: #10B981 (Success Green)
   - Position: X: 120px, Y: 100px

2. HEADLINE
   - Text: "Save $121,000 Per Rep Per Quarter"
   - Font: Inter Semibold, 64px
   - Color: #1F2937
   - Position: Y: 140px

3. SUBHEAD
   - Text: "Time saved = revenue gained"
   - Font: Inter Regular, 24px
   - Color: #64748B
   - Position: Y: 240px

MAIN VISUAL (Comparison Table):
- Position: Y: 340px
- Layout: 2-column comparison table
- Width: 1680px (full content width)

TABLE STRUCTURE:

HEADER ROW:
- Height: 80px
- Background: Light Gray (#F1F5F9)
- Border Radius: 12px 12px 0 0

Column Headers:
  LEFT COLUMN:
  - Text: "Traditional Process"
  - Icon: ❌ (red X, 32px)
  - Font: Inter Semibold, 24px
  - Color: #EF4444 (Error Red)

  RIGHT COLUMN:
  - Text: "With Deckr.ai"
  - Icon: ✅ (green check, 32px)
  - Font: Inter Semibold, 24px
  - Color: #10B981 (Success Green)

CONTENT ROWS (6 rows, alternating white/light gray):
- Row Height: 100px
- Padding: 24px 40px
- Font: Inter Regular, 20px

ROW 1 - TIME PER DECK:
  Left: "5-7 hours" (Red #EF4444, Bold)
  Right: "8 minutes" (Green #10B981, Bold)

ROW 2 - COST PER DECK:
  Left: "$375 (designer)" (Red)
  Right: "$0.50 (AI)" (Green)

ROW 3 - DECKS PER QUARTER:
  Left: "10 decks (max capacity)"
  Right: "50 decks (unlimited)"

ROW 4 - TOTAL COST:
  Left: "$18,750/quarter" (Red, Large Bold 28px)
  Right: "$25/quarter" (Green, Large Bold 28px)

ROW 5 - TIME SAVED:
  Left: "—"
  Right: "+242 hours selling time" (Green, Bold)

ROW 6 - REVENUE IMPACT:
  Left: "—"
  Right: "$121,000 additional revenue" (Gradient, Bold 32px)

VISUAL ACCENT (Right Side):
- Position: X: 1500px, Y: 340px
- Size: 300×600px
- Content: Simplified bar chart
- Style: Modern, minimal

Bar Chart:
  X-Axis: "Traditional" | "Deckr.ai"
  Y-Axis: Cost (dollar amounts)

  Bar 1 (Traditional):
  - Height: 400px (tall, bad)
  - Color: #EF4444 (Error Red)
  - Value Label: "$18,750"

  Bar 2 (Deckr.ai):
  - Height: 20px (tiny, good)
  - Color: #10B981 (Success Green)
  - Value Label: "$25"

  Gap between bars creates dramatic visual difference
```

### Design Notes for Designer
- Table should feel clean and scannable
- Use color strategically (red = bad, green = good)
- Bar chart on right reinforces the cost gap visually
- Bottom row (revenue impact) is the kicker - make it pop
- Keep alignment strict - this is data, not design

---

## SLIDE 9: COMPETITIVE ADVANTAGE

### Visual Concept
**Inspiration:** Linear "Why Linear", Stripe positioning
**Mood:** Confident, differentiated, "here's why we win"

### Layout Description
```
BACKGROUND:
- White

HEADER:
1. EYEBROW
   - Text: "COMPETITIVE ADVANTAGE"
   - Font: Inter Medium, 14px, all caps
   - Color: #9333EA (Purple)
   - Position: X: 120px, Y: 100px

2. HEADLINE
   - Text: "The Only Platform With Full Brand Intelligence"
   - Font: Inter Semibold, 56px
   - Color: #1F2937
   - Position: Y: 140px
   - Max Width: 1400px

COMPARISON GRID:
- Position: Y: 300px
- Layout: Table format (5 rows × 4 columns)
- Column Widths: 420px | 420px | 420px | 420px

HEADER ROW:
- Height: 100px
- Background: Gradient (#6366F1 → #9333EA)
- Border Radius: 12px 12px 0 0

Headers (White text):
  Column 1: "FEATURE"
  Column 2: "Deckr.ai"
  Column 3: "Gamma"
  Column 4: "Beautiful.ai"

ROW 1 - AUTO BRAND EXTRACTION:
  Feature: "Auto brand extraction"
  Deckr.ai: ✅ (Green, 32px)
  Gamma: ❌ (Red, 32px)
  Beautiful.ai: ❌

ROW 2 - EXACT HEX CODES:
  Feature: "Exact hex codes (#0052CC)"
  Deckr.ai: ✅
  Gamma: ❌ (Generic palettes only)
  Beautiful.ai: ❌

ROW 3 - OFFICIAL LOGOS:
  Feature: "Official logos (SVG)"
  Deckr.ai: ✅
  Gamma: ❌ (Stock library)
  Beautiful.ai: ❌

ROW 4 - REFERENCE MATCHING:
  Feature: "Enterprise reference matching"
  Deckr.ai: ✅ (95% accuracy)
  Gamma: ❌
  Beautiful.ai: ❌

ROW 5 - QA LOOP:
  Feature: "Quality assurance loop"
  Deckr.ai: ✅ (99% text accuracy)
  Gamma: ❌ (85% accuracy)
  Beautiful.ai: ❌

STYLING:
- Alternating row backgrounds: White / Light Gray (#F9FAFB)
- Border: 1px solid #E5E7EB between cells
- Padding: 24px per cell
- Font: Inter Regular, 18px
- Feature column: Medium weight, #1F2937
- Checkmarks: 32×32px, #10B981
- X marks: 32×32px, #EF4444

BOTTOM CALLOUT BOX:
- Position: Y: 820px
- Width: 1680px
- Background: Light purple (#F5F3FF)
- Border: 2px solid #9333EA
- Border Radius: 12px
- Padding: 32px 48px

Text:
- Heading: "Patent-Pending Technology"
  Font: Inter Semibold, 24px, #9333EA
- Body: "Our brand intelligence engine is the only AI system that automatically extracts and applies exact brand guidelines from public websites."
  Font: Inter Regular, 18px, #1F2937
  Line Height: 1.6
```

### Design Notes for Designer
- Table should be crisp and easy to scan
- Use green/red for quick visual parsing
- Deckr.ai column should stand out (all green checks)
- Competitor columns show gaps (more red X's)
- Bottom callout reinforces moat

---

## SLIDE 10: PRICING (Simple, Transparent)

### Visual Concept
**Inspiration:** Linear pricing, Stripe pricing grid
**Mood:** Transparent, simple, "no gotchas"

### Layout Description
```
BACKGROUND:
- White

HEADER:
1. EYEBROW
   - Text: "PRICING"
   - Font: Inter Medium, 14px, all caps
   - Color: #9333EA (Purple)
   - Position: Centered, Y: 100px

2. HEADLINE
   - Text: "Simple, Transparent Pricing"
   - Font: Inter Semibold, 56px
   - Color: #1F2937
   - Position: Centered, Y: 140px

3. SUBHEAD
   - Text: "Start free, scale as you grow"
   - Font: Inter Regular, 24px
   - Color: #64748B
   - Position: Centered, Y: 230px

PRICING CARDS (3 Plans):
- Position: Y: 340px
- Layout: 3 equal columns, 60px gutters
- Each Card: 480×600px

CARD 1 - FREE:
  Background: White
  Border: 2px solid #E5E7EB
  Border Radius: 16px
  Padding: 40px

  Plan Name:
  - Text: "Free"
  - Font: Inter Semibold, 28px
  - Color: #1F2937

  Price:
  - Text: "$0"
  - Font: Inter Bold, 56px
  - Color: #1F2937
  - Suffix: "/month"
    Font: Inter Regular, 24px, #64748B

  Description:
  - Text: "Perfect for trying out"
  - Font: Inter Regular, 16px
  - Color: #64748B

  Features List (Vertical):
  - Margin Top: 32px
  - Each item:
    • Icon: Checkmark (16px, #64748B)
    • Text: "10 slides/month"
           "3 decks/month"
           "Basic templates"
           "Watermarked slides"
    • Font: Inter Regular, 16px
    • Color: #1F2937
    • Line Height: 2.0 (spacious)

  Button:
  - Position: Bottom of card
  - Text: "Start Free"
  - Style: Secondary (outline)
  - Border: 2px solid #E5E7EB
  - Color: #1F2937
  - Padding: 16px 32px
  - Border Radius: 8px

CARD 2 - PRO (FEATURED):
  Background: White
  Border: 4px solid Gradient (#6366F1 → #9333EA)
  Border Radius: 16px
  Padding: 40px
  Shadow: 0 20px 40px rgba(99,102,241,0.15)
  Position: Scale 1.05 (slightly larger, elevated)

  Badge (Top-right corner):
  - Text: "MOST POPULAR"
  - Background: Gradient (#6366F1 → #9333EA)
  - Color: White
  - Font: Inter Bold, 12px
  - Padding: 8px 16px
  - Border Radius: 6px
  - Position: Absolute, Top: -16px, Right: 40px

  Plan Name:
  - Text: "Pro"
  - Font: Inter Semibold, 28px
  - Color: #1F2937

  Price:
  - Text: "$49"
  - Font: Inter Bold, 64px (larger)
  - Color: Gradient (#6366F1 → #9333EA)
  - Suffix: "/month"

  Description:
  - Text: "For serious sellers"
  - Font: Inter Medium, 16px
  - Color: #6366F1

  Features List:
  - All green checkmarks (#10B981)
  - Text: "100 slides/month"
         "50 decks/month"
         "Full brand research"
         "Reference matching"
         "No watermarks"
         "Priority support"

  Button:
  - Text: "Start Pro Trial"
  - Style: Primary (filled)
  - Background: Gradient (#6366F1 → #9333EA)
  - Color: White
  - Padding: 18px 40px (larger)
  - Border Radius: 8px
  - Shadow: 0 10px 20px rgba(99,102,241,0.2)

CARD 3 - ENTERPRISE:
  Background: White
  Border: 2px solid #E5E7EB
  Border Radius: 16px
  Padding: 40px

  Plan Name:
  - Text: "Enterprise"
  - Font: Inter Semibold, 28px
  - Color: #1F2937

  Price:
  - Text: "Custom"
  - Font: Inter Bold, 56px
  - Color: #1F2937

  Description:
  - Text: "For teams & agencies"
  - Font: Inter Regular, 16px
  - Color: #64748B

  Features List:
  - Checkmarks: Purple (#9333EA)
  - Text: "Unlimited slides"
         "Unlimited decks"
         "Team collaboration"
         "API access"
         "White-label option"
         "Dedicated support"

  Button:
  - Text: "Contact Sales"
  - Style: Secondary
  - Border: 2px solid #9333EA
  - Color: #9333EA
  - Padding: 16px 32px
  - Border Radius: 8px

BOTTOM NOTE:
- Position: Y: 1000px
- Text: "All plans include QA loop, text accuracy checks, and unlimited brand research"
- Font: Inter Regular, 14px
- Color: #9CA3AF
- Alignment: Centered
```

### Design Notes for Designer
- Pro card is the hero - make it stand out (gradient border, shadow, badge)
- Use gradient text only on Pro pricing
- Keep feature lists aligned vertically
- Buttons should match plan personality (free = subtle, pro = bold, enterprise = custom)
- Simple, clean, no tricks

---

## SLIDE 11: CALL TO ACTION

### Visual Concept
**Inspiration:** Linear CTA slides, Stripe "Get Started"
**Mood:** Energetic, actionable, "let's do this"

### Layout Description
```
BACKGROUND:
- Gradient: Diagonal 135deg, #6366F1 → #9333EA
- Full bleed
- Text: All white

CONTENT (Centered Vertically & Horizontally):

1. HEADLINE
   - Text: "Start Creating Perfect Decks Today"
   - Font: Inter Bold, 72px
   - Color: White
   - Position: Centered, Y: 360px
   - Letter Spacing: -1.5px
   - Text Shadow: 0 4px 12px rgba(0,0,0,0.1)

2. SUBHEADLINE
   - Text: "Join 10,000+ sales reps who've reclaimed their time"
   - Font: Inter Medium, 28px
   - Color: rgba(255,255,255,0.9)
   - Position: Centered, 48px below headline
   - Letter Spacing: -0.5px

3. CTA BUTTONS (Horizontal Row):
   - Position: Centered, 80px below subheadline
   - Layout: 2 buttons, 32px gap

   PRIMARY BUTTON:
   - Text: "Start Free Trial"
   - Background: White
   - Color: #6366F1 (Indigo)
   - Font: Inter Semibold, 20px
   - Padding: 24px 48px
   - Border Radius: 12px
   - Shadow: 0 12px 24px rgba(0,0,0,0.15)
   - Hover Effect: Scale 1.05

   SECONDARY BUTTON:
   - Text: "Watch Demo"
   - Background: rgba(255,255,255,0.15)
   - Backdrop Blur: 20px (frosted glass)
   - Border: 2px solid rgba(255,255,255,0.3)
   - Color: White
   - Font: Inter Medium, 20px
   - Padding: 24px 48px
   - Border Radius: 12px

4. TRUST INDICATORS (Below Buttons):
   - Position: Centered, 60px below buttons
   - Layout: Horizontal row of 3 items
   - Spacing: 60px between items

   INDICATOR 1:
   - Icon: ⭐⭐⭐⭐⭐ (5 stars, white)
   - Text: "4.9/5 from 500+ reviews"
   - Font: Inter Regular, 16px
   - Color: rgba(255,255,255,0.8)

   INDICATOR 2:
   - Icon: ✅ (white)
   - Text: "No credit card required"
   - Font: Inter Regular, 16px
   - Color: rgba(255,255,255,0.8)

   INDICATOR 3:
   - Icon: ⚡ (white)
   - Text: "Setup in 60 seconds"
   - Font: Inter Regular, 16px
   - Color: rgba(255,255,255,0.8)

5. FLOATING ELEMENTS (Decorative):
   - Position: Scattered around content
   - Style: Subtle, translucent shapes

   Element 1 (Top-left):
   - Shape: Circle, 200×200px
   - Position: X: 200px, Y: 120px
   - Background: rgba(255,255,255,0.08)
   - Blur: 60px

   Element 2 (Bottom-right):
   - Shape: Circle, 300×300px
   - Position: X: 1500px, Y: 700px
   - Background: rgba(255,255,255,0.06)
   - Blur: 80px

   These create depth without distraction
```

### Design Notes for Designer
- This is the "money slide" - make CTAs prominent
- White button on gradient = high contrast, can't miss it
- Frosted glass secondary button = modern, premium feel
- Trust indicators remove friction ("no credit card" = safe to try)
- Floating circles add depth, keep subtle

---

## SLIDE 12: THANK YOU / CONTACT

### Visual Concept
**Inspiration:** Linear ending slides, Stripe contact cards
**Mood:** Professional, approachable, "let's talk"

### Layout Description
```
BACKGROUND:
- White

CONTENT (Centered):

1. MAIN MESSAGE
   - Text: "Let's Create Something Amazing"
   - Font: Inter Semibold, 64px
   - Color: #1F2937
   - Position: Centered, Y: 340px
   - Letter Spacing: -1px

2. SUBTEXT
   - Text: "Ready to transform your sales deck workflow?"
   - Font: Inter Regular, 24px
   - Color: #64748B
   - Position: Centered, 40px below main message

3. CONTACT CARD:
   - Position: Centered, Y: 560px
   - Background: White
   - Border: 2px solid #E5E7EB
   - Border Radius: 16px
   - Padding: 48px 60px
   - Shadow: 0 10px 30px rgba(0,0,0,0.06)
   - Width: 800px

   Logo:
   - Deckr.ai logo (gradient version)
   - Size: 180×48px
   - Position: Top of card

   Contact Info (Vertical List):
   - Margin Top: 32px
   - Line Height: 2.4

   Email:
   - Icon: 📧 (24px)
   - Text: "hello@deckrai.com"
   - Font: Inter Medium, 20px
   - Color: #6366F1 (clickable color)

   Website:
   - Icon: 🌐 (24px)
   - Text: "www.deckrai.com"
   - Font: Inter Medium, 20px
   - Color: #6366F1

   Demo Link:
   - Icon: 🎬 (24px)
   - Text: "Book a demo → deckrai.com/demo"
   - Font: Inter Medium, 20px
   - Color: #9333EA

4. SOCIAL ICONS (Bottom):
   - Position: Y: 880px
   - Layout: Horizontal row
   - Spacing: 24px between icons
   - Alignment: Centered

   Icons: LinkedIn | Twitter | Product Hunt
   - Size: 40×40px each
   - Style: Line icons (not filled)
   - Color: #64748B
   - Hover: #6366F1

5. FOOTER TEXT:
   - Position: Y: 1000px
   - Text: "Made with ♥ by the Deckr.ai team"
   - Font: Inter Regular, 14px
   - Color: #9CA3AF
   - Alignment: Centered
```

### Design Notes for Designer
- Keep it simple and clean
- Contact card should feel inviting, not salesy
- Links should look clickable (indigo color)
- Social icons are optional - only if relevant
- This is goodbye slide - leave good impression

---

## GENERAL DESIGN GUIDELINES

### Animation & Transitions (If Presenting Digitally)
```
SLIDE TRANSITIONS:
- Default: Fade (300ms)
- Section breaks: Zoom out slightly (400ms)

ON-SLIDE ANIMATIONS (Subtle):
- Headlines: Fade up from bottom (600ms, ease-out)
- Stats: Count up from 0 (1200ms, ease-in-out)
- Icons: Scale in (400ms, bounce effect)
- Cards: Fade + slide up (500ms, ease-out, stagger 100ms)

HOVER EFFECTS (Interactive decks):
- Buttons: Scale 1.05, shadow intensifies
- Links: Underline appears
- Cards: Lift (translateY -4px), shadow grows
```

### Export Specifications
```
FILE FORMAT:
- PDF (for print/static)
- PPTX (for editing)
- Figma (for handoff)

RESOLUTION:
- 1920×1080px (16:9)
- 2× for Retina displays (3840×2160px)

FONTS TO EMBED:
- Inter Regular
- Inter Medium
- Inter Semibold
- Inter Bold

COLOR PROFILES:
- sRGB for digital
- CMYK for print (if needed)
```

### Accessibility
```
CONTRAST RATIOS (WCAG AA):
- Headline on white: 12:1 (Charcoal #1F2937)
- Body on white: 7:1 (Slate #64748B)
- White on gradient: 4.5:1 minimum

ALT TEXT (For screen readers):
- All icons should have descriptive labels
- Charts need data table alternatives

FONT SIZES:
- Minimum body text: 16px (readable from 10 feet away)
- Minimum caption: 14px
```

---

## INSPIRATION REFERENCES

### Design Systems to Study
1. **Stripe** - Clean typography, generous whitespace
2. **Linear** - Bold gradients, sharp UI elements
3. **Notion** - Friendly, approachable, clear hierarchy
4. **Figma** - Colorful accents, component-based thinking

### Key Takeaways from Best Product Decks
- **Less is more**: One idea per slide
- **Show, don't tell**: Visuals > text
- **Hierarchy matters**: Guide the eye with size/color
- **Consistency**: Maintain grid, colors, fonts
- **Breathing room**: Don't fill every pixel

---

**This specification is ready for a designer to execute. Each slide has exact measurements, colors, and layout details.**

**Total Pages:** 12 slides
**Design Time Estimate:** 12-16 hours for a skilled designer
**File Size Target:** Under 15MB for easy sharing

---

*Document Version: 1.0*
*Created: November 19, 2025*
*For: Deckr.ai Product Deck*
