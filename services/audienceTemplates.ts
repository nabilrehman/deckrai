/**
 * Audience Templates for Context-Aware Slide Generation
 * Knowing the audience helps AI tailor content, tone, and style
 */

export interface AudienceTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  recommendedStyles: ('executive' | 'visual' | 'data' | 'technical')[];
  contentGuidelines: {
    toneDescription: string;
    focusAreas: string[];
    avoidTopics: string[];
    keyMessaging: string;
  };
  promptModifier: string;
}

export const AUDIENCE_TEMPLATES: Record<string, AudienceTemplate> = {
  internal_team: {
    id: 'internal_team',
    name: 'Internal Team',
    description: 'Your colleagues, internal stakeholders',
    icon: '👥',
    recommendedStyles: ['executive', 'data', 'technical'],

    contentGuidelines: {
      toneDescription: 'Collaborative and straightforward',
      focusAreas: ['Progress updates', 'Action items', 'Blockers', 'Next steps'],
      avoidTopics: ['Basic company info', 'Over-explanation of internal processes'],
      keyMessaging: 'Focus on what matters to the team and actionable next steps'
    },

    promptModifier: `
**Audience: Internal Team Members**
- They already know company context and background
- Focus on updates, progress, and next actions
- Be direct and skip unnecessary explanations
- Include specific action items and owners
- Highlight blockers and decisions needed
- Use internal terminology freely
- Show progress metrics and timelines
`
  },

  executives: {
    id: 'executives',
    name: 'Executives / Leadership',
    description: 'C-suite, board members, senior management',
    icon: '👔',
    recommendedStyles: ['executive', 'data'],

    contentGuidelines: {
      toneDescription: 'Concise and strategic',
      focusAreas: ['ROI', 'Strategic impact', 'Key metrics', 'Risks', 'Recommendations'],
      avoidTopics: ['Technical details', 'Operational minutiae'],
      keyMessaging: 'Lead with conclusions, support with data, end with clear asks'
    },

    promptModifier: `
**Audience: Executive Leadership**
- Time is extremely limited - be concise
- Lead with conclusions and recommendations
- Show business impact and ROI
- Include strategic implications
- Present clear decision points
- Use metrics that matter to the business
- Avoid technical jargon unless critical
- Each slide should answer "So what?" and "What's the ask?"
`
  },

  customers: {
    id: 'customers',
    name: 'Customers / Clients',
    description: 'External customers, existing or prospective',
    icon: '🎯',
    recommendedStyles: ['visual', 'executive'],

    contentGuidelines: {
      toneDescription: 'Professional yet approachable',
      focusAreas: ['Their problems', 'Your solutions', 'Value prop', 'Success stories', 'Next steps'],
      avoidTopics: ['Internal processes', 'Competitive details', 'Pricing (unless sales)'],
      keyMessaging: 'Focus on their needs and your unique value'
    },

    promptModifier: `
**Audience: Customers / Clients**
- Focus on THEIR pain points and needs
- Show how you solve their problems
- Use customer-centric language
- Include social proof and testimonials
- Be clear about benefits, not just features
- Build trust and credibility
- Make the next step obvious and easy
- Avoid internal jargon or processes
`
  },

  sales_prospects: {
    id: 'sales_prospects',
    name: 'Sales / Prospects',
    description: 'Potential customers, sales presentations',
    icon: '💼',
    recommendedStyles: ['visual', 'executive'],

    contentGuidelines: {
      toneDescription: 'Persuasive and compelling',
      focusAreas: ['Problem/solution fit', 'Differentiation', 'ROI', 'Social proof', 'CTA'],
      avoidTopics: ['Too much technical detail', 'Long-winded explanations'],
      keyMessaging: 'Tell a story, address objections, make compelling case'
    },

    promptModifier: `
**Audience: Sales Prospects**
- Start with a hook that gets attention
- Clearly articulate the problem they face
- Position your solution as the answer
- Differentiate from competitors
- Show ROI and business case
- Include testimonials and case studies
- Address common objections proactively
- End with a strong, clear call-to-action
- Create urgency without being pushy
`
  },

  investors: {
    id: 'investors',
    name: 'Investors',
    description: 'VCs, angel investors, fundraising',
    icon: '💰',
    recommendedStyles: ['executive', 'data'],

    contentGuidelines: {
      toneDescription: 'Confident and data-driven',
      focusAreas: ['Market opportunity', 'Traction', 'Team', 'Business model', 'Ask'],
      avoidTopics: ['Excessive product details', 'Unvalidated claims'],
      keyMessaging: 'Show huge opportunity, prove execution, demonstrate momentum'
    },

    promptModifier: `
**Audience: Investors**
- Start with the big opportunity (TAM)
- Show unique insight or unfair advantage
- Demonstrate traction and momentum
- Highlight strong team credentials
- Show clear path to profitability
- Be realistic about risks
- Include financial projections
- End with specific ask and use of funds
- Show you understand the market deeply
`
  },

  conference_audience: {
    id: 'conference_audience',
    name: 'Conference / Public',
    description: 'Large audience, keynote, conference talk',
    icon: '🎤',
    recommendedStyles: ['visual', 'executive'],

    contentGuidelines: {
      toneDescription: 'Engaging and inspirational',
      focusAreas: ['Big ideas', 'Storytelling', 'Visuals', 'Takeaways', 'Call to action'],
      avoidTopics: ['Too much text', 'Detailed data', 'Sales pitches'],
      keyMessaging: 'Inspire, educate, entertain - give them something to remember'
    },

    promptModifier: `
**Audience: Conference / Public Speaking**
- Open with a compelling hook or story
- One idea per slide (large, readable text)
- Use powerful visuals and minimal text
- Tell stories to illustrate points
- Make it memorable and quotable
- Engage emotions as well as logic
- End with inspiring call-to-action
- Design for large screens viewed from far away
- Keep pace energetic and dynamic
`
  },

  educational: {
    id: 'educational',
    name: 'Educational / Training',
    description: 'Students, trainees, workshop attendees',
    icon: '📚',
    recommendedStyles: ['technical', 'data', 'executive'],

    contentGuidelines: {
      toneDescription: 'Clear and instructive',
      focusAreas: ['Learning objectives', 'Step-by-step', 'Examples', 'Practice', 'Resources'],
      avoidTopics: ['Assumptions of prior knowledge', 'Sales or marketing'],
      keyMessaging: 'Teach clearly, build understanding progressively, enable practice'
    },

    promptModifier: `
**Audience: Educational / Training**
- State clear learning objectives upfront
- Build concepts progressively (simple to complex)
- Include plenty of examples and diagrams
- Use analogies to explain complex ideas
- Add practice exercises or discussion points
- Summarize key takeaways frequently
- Provide resources for further learning
- Check for understanding throughout
- Make it interactive where possible
`
  },

  partners: {
    id: 'partners',
    name: 'Partners / Vendors',
    description: 'Business partners, strategic alliances',
    icon: '🤝',
    recommendedStyles: ['executive', 'data'],

    contentGuidelines: {
      toneDescription: 'Collaborative and strategic',
      focusAreas: ['Mutual benefits', 'Alignment', 'Joint opportunities', 'Action plan'],
      avoidTopics: ['Competitive positioning', 'Confidential data'],
      keyMessaging: 'Focus on win-win and shared success'
    },

    promptModifier: `
**Audience: Business Partners**
- Emphasize mutual benefits and win-win outcomes
- Show strategic alignment and shared goals
- Highlight complementary strengths
- Include joint opportunity analysis
- Be transparent about expectations
- Focus on collaboration and trust-building
- Present clear partnership model
- End with concrete next steps for collaboration
`
  }
};

/**
 * Get audience template by ID
 */
export const getAudienceTemplate = (audienceId: string): AudienceTemplate => {
  return AUDIENCE_TEMPLATES[audienceId] || AUDIENCE_TEMPLATES.internal_team;
};

/**
 * Get recommended styles for an audience
 */
export const getRecommendedStyles = (audienceId: string): string[] => {
  const audience = getAudienceTemplate(audienceId);
  return audience.recommendedStyles;
};

/**
 * Combine audience context with style prompt
 */
export const generateContextualPrompt = (
  baseContent: string,
  audienceId: string,
  styleId: string
): string => {
  const audience = getAudienceTemplate(audienceId);

  return `${audience.promptModifier}

**Content Focus:**
${audience.contentGuidelines.focusAreas.map(area => `- ${area}`).join('\n')}

**Tone:**
${audience.contentGuidelines.toneDescription}

**Key Messaging:**
${audience.contentGuidelines.keyMessaging}

---

Now generate slides based on this content:
${baseContent}
`;
};
