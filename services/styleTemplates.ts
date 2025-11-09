/**
 * Style Templates for Different Presentation Types
 * Each style has unique prompting strategy and visual characteristics
 */

export interface StyleTemplate {
  id: 'executive' | 'visual' | 'data' | 'technical';
  name: string;
  description: string;
  bestFor: string[];
  characteristics: string[];
  systemPrompt: string;
  slideLayoutPreferences: {
    titleSlideStyle: string;
    contentSlideStyle: string;
    imageRatio: 'high' | 'medium' | 'low';
    textDensity: 'minimal' | 'moderate' | 'detailed';
    chartPreference: boolean;
    iconUsage: boolean;
  };
}

export const STYLE_TEMPLATES: Record<string, StyleTemplate> = {
  executive: {
    id: 'executive',
    name: 'Executive Brief',
    description: 'Clean, minimal, and to-the-point',
    bestFor: ['Board meetings', 'Quick updates', 'Executive summaries'],
    characteristics: ['More text', 'Concise bullets', 'Professional', 'Data-focused'],

    systemPrompt: `You are creating an EXECUTIVE BRIEF presentation. This style is for busy executives who want information quickly and clearly.

**Visual Style:**
- Clean, minimal layouts with plenty of white space
- Professional corporate aesthetic
- Muted color palette (navy, gray, white)
- Sans-serif fonts, clear hierarchy
- Text-focused with supporting data visualizations

**Content Approach:**
- Concise, bullet-point format
- Each slide should have 3-5 key points maximum
- Lead with the conclusion or key takeaway
- Use data to support claims
- Focus on "what it means" not just "what it is"

**Slide Types to Include:**
- Title slide: Clean, professional, company-focused
- Executive summary: Key findings on one slide
- Data slides: Simple charts with clear labels
- Recommendation slides: Clear action items
- Next steps: Timeline with milestones

**Tone:**
- Professional and authoritative
- Direct and action-oriented
- No fluff or unnecessary detail

When generating each slide, describe:
1. A clear, impactful title (max 5-7 words)
2. 3-5 concise bullet points or key data points
3. Any supporting chart/graph (if needed)
4. Professional layout with minimal visual elements`,

    slideLayoutPreferences: {
      titleSlideStyle: 'clean professional title with company logo area, minimal graphics',
      contentSlideStyle: 'text-heavy with clear bullet points, simple data visualizations',
      imageRatio: 'low',
      textDensity: 'moderate',
      chartPreference: true,
      iconUsage: false
    }
  },

  visual: {
    id: 'visual',
    name: 'Visual Story',
    description: 'Engaging, bold, and image-driven',
    bestFor: ['Sales pitches', 'Conferences', 'Product launches', 'Storytelling'],
    characteristics: ['Visual heavy', 'Less text', 'Engaging', 'Emotional'],

    systemPrompt: `You are creating a VISUAL STORYTELLING presentation. This style captures attention and tells a compelling narrative through imagery.

**Visual Style:**
- Bold, eye-catching designs
- Large, high-quality images as backgrounds or focal points
- Vibrant color palette with gradients
- Minimal text - let images do the talking
- Modern, contemporary aesthetic

**Content Approach:**
- One key idea per slide
- Short, punchy headlines (3-5 words)
- 1-2 supporting sentences maximum
- Use metaphors and analogies
- Tell a story with a beginning, middle, end
- Evoke emotion and connection

**Slide Types to Include:**
- Title slide: Hero image with bold, inspiring headline
- Problem slide: Dramatic visual showing the pain point
- Solution slide: Uplifting visual with transformation
- Feature slides: One feature per slide with supporting imagery
- Customer story: Real photos, quotes, testimonials
- Vision slide: Aspirational future state

**Tone:**
- Inspirational and motivating
- Human-centered and relatable
- Confident and bold

When generating each slide, describe:
1. A powerful, concise headline (3-5 words)
2. One core message (1 sentence)
3. Detailed image description: mood, composition, style, colors
4. Minimal supporting text
5. Visual metaphors or symbolic imagery`,

    slideLayoutPreferences: {
      titleSlideStyle: 'full-bleed hero image with bold overlaid text',
      contentSlideStyle: 'large visuals with minimal overlay text',
      imageRatio: 'high',
      textDensity: 'minimal',
      chartPreference: false,
      iconUsage: true
    }
  },

  data: {
    id: 'data',
    name: 'Data-Driven',
    description: 'Chart-heavy, analytical, and detailed',
    bestFor: ['Analytics reviews', 'Research findings', 'Performance reports', 'Technical analysis'],
    characteristics: ['Charts & graphs', 'Detailed data', 'Analytical', 'Comprehensive'],

    systemPrompt: `You are creating a DATA-DRIVEN presentation. This style is for analytical audiences who want to see the numbers and understand the methodology.

**Visual Style:**
- Chart and graph focused
- Clear data visualizations (bar charts, line graphs, pie charts)
- Grid-based layouts
- Professional color coding for data
- Multiple data points per slide acceptable

**Content Approach:**
- Lead with insights, then show the data
- Use various chart types appropriately
- Include data labels, legends, and sources
- Show trends, comparisons, and correlations
- Be comprehensive but organized
- Include methodology notes when relevant

**Slide Types to Include:**
- Title slide: Professional with key metrics preview
- Overview dashboard: Multiple KPIs at a glance
- Trend analysis: Line graphs showing change over time
- Comparison slides: Side-by-side bar charts
- Breakdown slides: Pie charts or tree maps
- Correlation slides: Scatter plots or heat maps
- Summary slide: Key metrics with takeaways

**Tone:**
- Objective and analytical
- Precise and detailed
- Evidence-based

When generating each slide, describe:
1. Clear, descriptive title stating the insight
2. Chart type and data structure
3. Key data points and values
4. Color coding scheme
5. Axis labels and legends
6. 2-3 bullet point takeaways from the data`,

    slideLayoutPreferences: {
      titleSlideStyle: 'professional title with key metrics preview',
      contentSlideStyle: 'multiple charts and data visualizations',
      imageRatio: 'medium',
      textDensity: 'detailed',
      chartPreference: true,
      iconUsage: false
    }
  },

  technical: {
    id: 'technical',
    name: 'Technical Deep-Dive',
    description: 'Detailed, diagram-heavy, comprehensive',
    bestFor: ['Technical reviews', 'Architecture presentations', 'Workshops', 'Training'],
    characteristics: ['Diagrams', 'Detailed explanations', 'Technical depth', 'Comprehensive'],

    systemPrompt: `You are creating a TECHNICAL DEEP-DIVE presentation. This style is for technical audiences who want depth and detail.

**Visual Style:**
- Architecture diagrams and flowcharts
- Technical illustrations
- Code snippets or pseudo-code where relevant
- System diagrams with clear connections
- Hierarchical layouts

**Content Approach:**
- Provide technical depth and detail
- Show system relationships and dependencies
- Include both high-level and detailed views
- Use technical terminology appropriately
- Show "how it works" not just "what it does"
- Include pros/cons, trade-offs

**Slide Types to Include:**
- Title slide: Technical context and scope
- Architecture overview: High-level system diagram
- Component breakdowns: Detailed views of each part
- Data flow diagrams: How information moves
- Sequence diagrams: Step-by-step processes
- Technical specifications: Detailed parameters
- Implementation details: How to build/use it

**Tone:**
- Technical and precise
- Thorough and comprehensive
- Educational

When generating each slide, describe:
1. Technical title with specific component/concept
2. Diagram type: flowchart, architecture, sequence, etc.
3. Components and their relationships
4. Technical details and specifications
5. 3-5 supporting bullet points
6. Code examples or technical notes if relevant`,

    slideLayoutPreferences: {
      titleSlideStyle: 'technical header with system context',
      contentSlideStyle: 'diagrams with detailed annotations and explanations',
      imageRatio: 'medium',
      textDensity: 'detailed',
      chartPreference: true,
      iconUsage: true
    }
  }
};

/**
 * Get style template by ID
 */
export const getStyleTemplate = (styleId: string): StyleTemplate => {
  return STYLE_TEMPLATES[styleId] || STYLE_TEMPLATES.executive;
};

/**
 * Generate style-specific slide prompt
 */
export const generateStylePrompt = (
  baseContent: string,
  styleId: string,
  slideNumber: number,
  totalSlides: number
): string => {
  const style = getStyleTemplate(styleId);

  return `${style.systemPrompt}

**Your Task:**
Generate slide ${slideNumber} of ${totalSlides} based on this content:

${baseContent}

**Requirements:**
- Follow the ${style.name} visual style strictly
- Text density: ${style.slideLayoutPreferences.textDensity}
- Image ratio: ${style.slideLayoutPreferences.imageRatio}
- ${style.slideLayoutPreferences.chartPreference ? 'Include data visualizations where appropriate' : 'Focus on imagery and minimal text'}

Provide a detailed slide description that a designer AI can use to create this slide.`;
};
