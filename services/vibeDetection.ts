/**
 * Content-Aware Vibe Detection
 * Analyzes notes to detect the presentation context and suggest appropriate designer styles
 */

export type PresentationVibe = 'startup' | 'corporate' | 'creative' | 'technical' | 'educational' | 'sales';

export interface DesignerStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  colorScheme: string;
  aesthetic: string;
  keywords: string[];
}

/**
 * Designer style sets for different vibes
 */
export const DESIGNER_STYLES: Record<PresentationVibe, DesignerStyle[]> = {
  startup: [
    {
      id: 'bold-startup',
      name: 'Bold Startup',
      description: 'Purple gradients, modern, energetic, tech-forward',
      icon: '🚀',
      colorScheme: 'Purple/Blue gradients, vibrant accents',
      aesthetic: 'Modern, energetic, innovative, bold typography, dynamic layouts',
      keywords: ['gradient', 'modern', 'bold', 'vibrant', 'tech', 'innovative', 'dynamic'],
    },
    {
      id: 'tech-minimalist',
      name: 'Tech Minimalist',
      description: 'Black/white, clean lines, sleek, sophisticated',
      icon: '💎',
      colorScheme: 'Monochrome with accent colors, clean palette',
      aesthetic: 'Minimalist, sophisticated, high-end tech, simple icons, lots of whitespace',
      keywords: ['minimal', 'clean', 'sophisticated', 'monochrome', 'sleek', 'modern', 'tech'],
    },
    {
      id: 'energetic-pitch',
      name: 'Energetic Pitch',
      description: 'Bright colors, bold, attention-grabbing, dynamic',
      icon: '⚡',
      colorScheme: 'Bright oranges, blues, energetic palette',
      aesthetic: 'High energy, bold colors, action-oriented, engaging visuals, dynamic movement',
      keywords: ['energetic', 'bright', 'bold', 'dynamic', 'vibrant', 'action', 'engaging'],
    },
  ],

  corporate: [
    {
      id: 'executive-clean',
      name: 'Executive Clean',
      description: 'Minimal, professional, trustworthy, charts',
      icon: '📊',
      colorScheme: 'Navy, gray, white, professional palette',
      aesthetic: 'Clean, minimal, corporate professional, structured layouts, data visualization',
      keywords: ['professional', 'clean', 'minimal', 'corporate', 'trustworthy', 'structured'],
    },
    {
      id: 'modern-corporate',
      name: 'Modern Corporate',
      description: 'Polished, contemporary, refined, balanced',
      icon: '💼',
      colorScheme: 'Blue/gray tones, subtle gradients',
      aesthetic: 'Contemporary corporate, polished, refined, balanced layouts, professional imagery',
      keywords: ['modern', 'polished', 'corporate', 'refined', 'balanced', 'contemporary'],
    },
    {
      id: 'data-analytics',
      name: 'Data Analytics',
      description: 'Chart-focused, structured, metrics-driven',
      icon: '📈',
      colorScheme: 'Blue/teal data visualization palette',
      aesthetic: 'Grid-based, chart-heavy, analytical, structured, clear data presentation',
      keywords: ['data', 'charts', 'analytics', 'structured', 'metrics', 'visualization'],
    },
  ],

  creative: [
    {
      id: 'bold-creative',
      name: 'Bold Creative',
      description: 'Colorful, playful, unique, artistic',
      icon: '🎨',
      colorScheme: 'Vibrant multicolor, playful palette',
      aesthetic: 'Creative, artistic, colorful, unique layouts, playful typography, asymmetric design',
      keywords: ['creative', 'colorful', 'playful', 'artistic', 'unique', 'vibrant'],
    },
    {
      id: 'elegant-design',
      name: 'Elegant Design',
      description: 'Sophisticated, artistic, balanced, refined',
      icon: '✨',
      colorScheme: 'Muted pastels, sophisticated tones',
      aesthetic: 'Elegant, sophisticated, artistic, balanced compositions, refined typography',
      keywords: ['elegant', 'sophisticated', 'artistic', 'balanced', 'refined', 'design'],
    },
    {
      id: 'vibrant-energy',
      name: 'Vibrant Energy',
      description: 'Bright, fun, engaging, eye-catching',
      icon: '🌈',
      colorScheme: 'Rainbow spectrum, energetic colors',
      aesthetic: 'Fun, engaging, vibrant, eye-catching, energetic, creative freedom',
      keywords: ['vibrant', 'fun', 'engaging', 'bright', 'energetic', 'creative'],
    },
  ],

  technical: [
    {
      id: 'tech-diagrams',
      name: 'Tech Diagrams',
      description: 'Flowcharts, architecture, detailed, structured',
      icon: '⚙️',
      colorScheme: 'Blue/gray technical palette',
      aesthetic: 'Technical, diagram-heavy, structured, clear hierarchies, detailed annotations',
      keywords: ['technical', 'diagrams', 'flowcharts', 'architecture', 'structured', 'detailed'],
    },
    {
      id: 'modern-tech',
      name: 'Modern Tech',
      description: 'Sleek, futuristic, innovative, high-tech',
      icon: '🔬',
      colorScheme: 'Dark mode with neon accents',
      aesthetic: 'Futuristic, high-tech, innovative, modern interfaces, sleek design',
      keywords: ['modern', 'tech', 'futuristic', 'innovative', 'sleek', 'high-tech'],
    },
    {
      id: 'developer-focused',
      name: 'Developer Focused',
      description: 'Code snippets, dark theme, developer-friendly',
      icon: '💻',
      colorScheme: 'Dark backgrounds, syntax highlighting',
      aesthetic: 'Developer-centric, code-focused, dark themes, monospace fonts, technical depth',
      keywords: ['developer', 'code', 'dark', 'technical', 'programming', 'detailed'],
    },
  ],

  educational: [
    {
      id: 'clear-learning',
      name: 'Clear Learning',
      description: 'Simple, step-by-step, easy to follow',
      icon: '📚',
      colorScheme: 'Friendly blues, greens, warm tones',
      aesthetic: 'Clear, educational, progressive, easy-to-follow, supportive, friendly',
      keywords: ['educational', 'clear', 'simple', 'learning', 'friendly', 'progressive'],
    },
    {
      id: 'engaging-education',
      name: 'Engaging Education',
      description: 'Interactive, visual, examples-driven',
      icon: '🎓',
      colorScheme: 'Warm, inviting, educational palette',
      aesthetic: 'Engaging, interactive, visual examples, approachable, supportive learning',
      keywords: ['engaging', 'interactive', 'visual', 'examples', 'approachable', 'learning'],
    },
    {
      id: 'professional-training',
      name: 'Professional Training',
      description: 'Structured, comprehensive, detailed',
      icon: '📖',
      colorScheme: 'Professional educational tones',
      aesthetic: 'Structured, comprehensive, detailed, professional, clear progression',
      keywords: ['professional', 'training', 'structured', 'comprehensive', 'detailed'],
    },
  ],

  sales: [
    {
      id: 'persuasive-pitch',
      name: 'Persuasive Pitch',
      description: 'Compelling, benefit-focused, ROI-driven',
      icon: '💼',
      colorScheme: 'Trust-building blues, success greens',
      aesthetic: 'Persuasive, benefit-focused, social proof, ROI emphasis, compelling visuals',
      keywords: ['persuasive', 'compelling', 'benefits', 'ROI', 'sales', 'trust'],
    },
    {
      id: 'visual-selling',
      name: 'Visual Selling',
      description: 'Product-focused, demo-heavy, visual proof',
      icon: '🎯',
      colorScheme: 'Product-highlighting colors',
      aesthetic: 'Visual product focus, demo screenshots, before/after, visual proof points',
      keywords: ['visual', 'product', 'demo', 'proof', 'showcase', 'selling'],
    },
    {
      id: 'professional-sales',
      name: 'Professional Sales',
      description: 'Trustworthy, polished, credible, refined',
      icon: '🤝',
      colorScheme: 'Professional trust-building palette',
      aesthetic: 'Professional, trustworthy, polished, credible, refined sales presentation',
      keywords: ['professional', 'trustworthy', 'polished', 'credible', 'sales', 'refined'],
    },
  ],
};

/**
 * Detect presentation vibe from notes content
 */
export function detectVibeFromNotes(notes: string): PresentationVibe {
  const lowerNotes = notes.toLowerCase();

  // Startup indicators
  const startupKeywords = ['startup', 'pitch', 'investor', 'vc', 'funding', 'series a', 'series b', 'seed round', 'raise', 'valuation', 'disrupting', 'innovative'];
  const startupScore = startupKeywords.filter(kw => lowerNotes.includes(kw)).length;

  // Corporate indicators
  const corporateKeywords = ['quarterly', 'executive', 'board', 'stakeholder', 'qbr', 'kpi', 'metrics', 'performance review', 'annual', 'corporate'];
  const corporateScore = corporateKeywords.filter(kw => lowerNotes.includes(kw)).length;

  // Creative indicators
  const creativeKeywords = ['design', 'creative', 'brand', 'campaign', 'marketing', 'storytelling', 'visual identity', 'creative brief', 'art', 'aesthetic'];
  const creativeScore = creativeKeywords.filter(kw => lowerNotes.includes(kw)).length;

  // Technical indicators
  const technicalKeywords = ['technical', 'architecture', 'engineering', 'code', 'api', 'infrastructure', 'system design', 'database', 'algorithm', 'developer'];
  const technicalScore = technicalKeywords.filter(kw => lowerNotes.includes(kw)).length;

  // Educational indicators
  const educationalKeywords = ['training', 'learning', 'education', 'onboarding', 'workshop', 'tutorial', 'course', 'teach', 'lesson', 'student'];
  const educationalScore = educationalKeywords.filter(kw => lowerNotes.includes(kw)).length;

  // Sales indicators
  const salesKeywords = ['sales', 'prospect', 'demo', 'product pitch', 'roi', 'customer', 'client', 'solution', 'value proposition', 'competitive advantage'];
  const salesScore = salesKeywords.filter(kw => lowerNotes.includes(kw)).length;

  // Find highest scoring vibe
  const scores = {
    startup: startupScore,
    corporate: corporateScore,
    creative: creativeScore,
    technical: technicalScore,
    educational: educationalScore,
    sales: salesScore,
  };

  const maxScore = Math.max(...Object.values(scores));

  // If no clear winner, default to startup (most flexible)
  if (maxScore === 0) return 'startup';

  // Return vibe with highest score
  const detectedVibe = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0] as PresentationVibe;
  return detectedVibe || 'startup';
}

/**
 * Get designer styles for detected vibe
 */
export function getDesignerStylesForVibe(vibe: PresentationVibe): DesignerStyle[] {
  return DESIGNER_STYLES[vibe];
}

/**
 * Get designer style by ID
 */
export function getDesignerStyleById(styleId: string): DesignerStyle | null {
  for (const styles of Object.values(DESIGNER_STYLES)) {
    const found = styles.find(s => s.id === styleId);
    if (found) return found;
  }
  return null;
}

/**
 * Generate style-specific prompt modifier
 */
export function generateStylePromptModifier(style: DesignerStyle): string {
  return `
VISUAL DESIGN REQUIREMENTS:
Style: ${style.name}
Aesthetic: ${style.aesthetic}
Color Scheme: ${style.colorScheme}

IMPORTANT DESIGN RULES:
- Match this exact visual style and aesthetic
- Use the specified color scheme consistently
- Apply ${style.keywords.join(', ')} design principles
- Maintain visual consistency across all elements
- Create a cohesive, professional appearance that embodies the ${style.name} style
`;
}
