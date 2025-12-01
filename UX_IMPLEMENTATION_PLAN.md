# UX Implementation Plan: Multi-Output Content Creation System
## 2025 UX Design Principles Applied to Deckr.ai

**Document Version:** 1.0
**Date:** November 23, 2025
**Status:** Ready for Implementation

---

## Executive Summary

This plan transforms Deckr.ai from a deck-focused tool into an intuitive multi-output content creation platform that guides users to create:
- Sales decks (5-15 slides)
- One-pagers (visual slides)
- LinkedIn carousels (4-6 slides, 4:5 aspect)
- Brochures (multi-page PDF)
- Follow-up documents
- Case studies
- Posters and infographics

**Key Strategy:** Apply 2025 UX principles (AI proactivity, progressive disclosure, user control) to eliminate the need for manual output type selection while maintaining user agency.

---

## 1. Core UX Principles (2025)

### Principle 1: AI Proactivity
**Definition:** Predict user needs before they ask, based on context clues

**Application:**
- Auto-detect intent from natural language (already implemented)
- Suggest follow-up actions after generation
- Offer complementary formats ("You made a deck, want a one-pager summary?")
- Learn from conversation history

### Principle 2: Progressive Disclosure
**Definition:** Reveal complexity gradually, show advanced features only when needed

**Application:**
- Start with 4-6 starter prompt chips
- Hide full capability list behind "See all output types" accordion
- Show contextual hints inline (not upfront tutorials)
- Expand options after first successful generation

### Principle 3: User Control & Transparency
**Definition:** Let users confirm, undo, or override AI decisions

**Application:**
- Show detected intent with confidence score
- Allow quick corrections ("Actually, I meant a brochure")
- Provide undo/redo for edits
- Explain what each output type does

### Principle 4: Context is Gold
**Definition:** Remember conversation history and file uploads to inform suggestions

**Application:**
- After PDF upload: "Edit this for your Nike meeting tomorrow?"
- After deck generation: "Create a one-pager summary?"
- After one-pager: "Need a LinkedIn carousel version?"

---

## 2. Upload → Edit Workflow (Sales Enablement Focus)

### Problem Statement
Sales teams often need to:
1. Upload existing deck (quarterly pitch)
2. Customize for specific customer/meeting
3. Generate follow-up assets (one-pager, case study)

### Recommended Flow: Two-Step Conversational Prompt

#### Step 1: Upload Detection
```
User uploads "Q4_Sales_Deck.pdf"

System shows:
┌─────────────────────────────────────────────────┐
│ ✓ Uploaded Q4_Sales_Deck.pdf (24 slides)       │
│                                                 │
│ What would you like to do?                     │
│                                                 │
│ [Customize for meeting] [Extract one-pager]    │
│ [Create follow-up doc]  [Build case study]     │
└─────────────────────────────────────────────────┘
```

#### Step 2: Context Collection
```
User clicks "Customize for meeting"

System prompts:
┌─────────────────────────────────────────────────┐
│ Tell me about this meeting:                    │
│                                                 │
│ Customer/Company: [Nike                      ] │
│ Meeting type: [Discovery] [Pitch] [Follow-up] │
│ Key focus: [Describe what to emphasize...   ] │
│                                                 │
│             [Generate Custom Deck]              │
└─────────────────────────────────────────────────┘
```

#### Alternative: Smart Single-Step Prompt
```
User types: "Edit this deck for my Nike discovery meeting next week"

System:
1. Detects REFINE_DOCUMENT intent
2. Extracts context: customer=Nike, type=discovery
3. Auto-generates without extra prompts
4. Shows: "Customized for Nike discovery meeting ✨"
```

---

## 3. Starter Prompts Strategy

### Goal
Guide users to discover all output types without overwhelming them

### Implementation: 4-6 Rotating Chips + Accordion

```
┌──────────────────────────────────────────────────┐
│  What would you like to create?                  │
│                                                   │
│  [📊 Sales deck for Q1 review]                   │
│  [📄 One-pager for product launch]               │
│  [📱 LinkedIn carousel about AI trends]          │
│  [📑 Case study from recent win]                 │
│                                                   │
│  ▼ See all output types (6 more)                 │
└──────────────────────────────────────────────────┘
```

### Expanded Accordion Content
```
┌──────────────────────────────────────────────────┐
│  ▲ All Output Types                              │
│                                                   │
│  📊 Presentations                                │
│     • Sales deck (5-15 slides)                   │
│     • Pitch deck                                 │
│     • Training presentation                      │
│                                                   │
│  📄 One-Pagers                                   │
│     • Visual slide (16:9)                        │
│     • Poster (11:17)                             │
│     • Infographic (9:16)                         │
│                                                   │
│  📱 Social Media                                 │
│     • LinkedIn carousel (4-6 slides)             │
│                                                   │
│  📑 Documents                                    │
│     • Follow-up memo                             │
│     • Case study                                 │
│     • Sales brochure (multi-page PDF)            │
│                                                   │
│  ✏️  Edit & Refine                               │
│     • Customize existing deck                    │
│     • Update slides for new customer             │
└──────────────────────────────────────────────────┘
```

### Example Starter Prompts

**Sales Focused:**
- "Create a 10-slide pitch deck for our Q1 product launch"
- "One-pager summarizing our value proposition"
- "Follow-up email with case study attachment"
- "Customize our master deck for Nike meeting"

**Multi-Purpose:**
- "LinkedIn carousel: 5 tips for remote work"
- "Training deck: Onboarding new sales reps"
- "Infographic: Our company's 2024 achievements"
- "Brochure: Product catalog for trade show"

---

## 4. Contextual Hints System

### When to Show Hints

#### After File Upload
```
User uploads PDF

Show inline hint:
┌─────────────────────────────────────────────────┐
│ 💡 Tip: You can customize this deck for a      │
│    specific customer or extract key slides     │
│    into a one-pager                             │
└─────────────────────────────────────────────────┘
```

#### After First Generation
```
User generates deck

Show post-generation actions:
┌─────────────────────────────────────────────────┐
│ ✨ Your deck is ready! What's next?            │
│                                                 │
│ [📄 Create one-pager summary]                  │
│ [📱 Make LinkedIn carousel version]            │
│ [✏️  Edit specific slides]                     │
│ [💾 Save to library]                           │
└─────────────────────────────────────────────────┘
```

#### On Empty State (First Visit)
```
┌─────────────────────────────────────────────────┐
│ Welcome to Deckr.ai ✨                         │
│                                                 │
│ Create AI-powered presentations, one-pagers,   │
│ LinkedIn carousels, and sales documents.       │
│                                                 │
│ Try:                                            │
│ • "Create a 10-slide sales deck about..."      │
│ • "One-pager for product launch"               │
│ • Upload existing deck → Customize for meeting │
└─────────────────────────────────────────────────┘
```

---

## 5. Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal:** Guide users to discover output types

**Components to Build:**
1. `components/StarterPrompts.tsx`
   - 4-6 rotating example prompts
   - Click to auto-fill input
   - Categorized by use case (sales, marketing, training)

2. `components/CapabilitiesAccordion.tsx`
   - Expandable "See all output types" section
   - Grouped by category
   - Shows example use cases for each type

3. Update empty state copy in `ChatLandingView.tsx`
   - More descriptive welcome message
   - Clearer value proposition

**Success Metrics:**
- 60%+ users click on starter prompts
- 20%+ users expand capabilities accordion
- Reduced "What can this do?" questions

### Phase 2: Smart Contextual Hints (Week 2)
**Goal:** Proactive guidance based on user actions

**Components to Build:**
1. `components/ContextualHints.tsx`
   - Post-upload suggestions
   - Post-generation "What's next?" prompts
   - Inline tips (dismissible)

2. Update `ChatLandingView.tsx` logic
   - Detect PDF uploads → show customization options
   - After deck generation → suggest one-pager
   - After one-pager → suggest carousel

**Success Metrics:**
- 40%+ users take suggested follow-up actions
- Increased multi-format usage per session

### Phase 3: Upload → Edit Workflow (Week 3)
**Goal:** Streamline sales enablement use case

**Components to Build:**
1. `components/PostUploadActions.tsx`
   - Quick action chips after file upload
   - "Customize for meeting" flow
   - "Extract one-pager" flow
   - "Create follow-up doc" flow

2. Update intent detection
   - Add context extraction from prompts like "edit for Nike meeting"
   - Auto-fill customer/meeting type parameters

**Success Metrics:**
- 50%+ users who upload PDFs use editing features
- Reduced steps to customize existing decks

### Phase 4: Refinement (Week 4)
**Goal:** Polish and personalize

**Enhancements:**
1. Smart prompt suggestions based on user history
2. Template gallery integration with progressive disclosure
3. Keyboard shortcuts for power users
4. A/B test different starter prompt sets

---

## 6. Component Specifications

### Component 1: StarterPrompts.tsx

```typescript
interface StarterPrompt {
  id: string;
  category: 'sales' | 'marketing' | 'training' | 'social';
  text: string;
  icon: string;
  expectedIntent: UserIntentType;
}

const STARTER_PROMPTS: StarterPrompt[] = [
  {
    id: 'sales-deck',
    category: 'sales',
    text: 'Create a 10-slide pitch deck for Q1 product launch',
    icon: '📊',
    expectedIntent: 'CREATE_DECK'
  },
  {
    id: 'one-pager',
    category: 'sales',
    text: 'One-pager summarizing our value proposition',
    icon: '📄',
    expectedIntent: 'CREATE_ONE_PAGER'
  },
  {
    id: 'linkedin-carousel',
    category: 'social',
    text: 'LinkedIn carousel: 5 tips for remote work',
    icon: '📱',
    expectedIntent: 'CREATE_LINKEDIN_CAROUSEL'
  },
  {
    id: 'case-study',
    category: 'sales',
    text: 'Case study from our recent customer win',
    icon: '📑',
    expectedIntent: 'CREATE_DOCUMENT'
  }
];
```

**Props:**
```typescript
interface StarterPromptsProps {
  onPromptClick: (prompt: string) => void;
  maxVisible?: number; // Default: 4
}
```

### Component 2: CapabilitiesAccordion.tsx

```typescript
interface OutputCapability {
  category: string;
  icon: string;
  types: {
    name: string;
    description: string;
    example: string;
    intentType: UserIntentType;
  }[];
}

const CAPABILITIES: OutputCapability[] = [
  {
    category: 'Presentations',
    icon: '📊',
    types: [
      {
        name: 'Sales Deck',
        description: '5-15 slides for pitches and reviews',
        example: 'Q1 product launch deck with 10 slides',
        intentType: 'CREATE_DECK'
      },
      // ... more types
    ]
  },
  // ... more categories
];
```

### Component 3: PostGenerationActions.tsx

```typescript
interface PostGenerationActionsProps {
  generatedType: UserIntentType;
  onActionClick: (action: string, prompt: string) => void;
}

// Show smart follow-up actions based on what was just generated
const getFollowUpActions = (type: UserIntentType): Action[] => {
  switch (type) {
    case 'CREATE_DECK':
      return [
        { label: 'Create one-pager summary', prompt: 'Create a one-pager summarizing this deck' },
        { label: 'LinkedIn carousel version', prompt: 'Convert key slides to LinkedIn carousel' },
        { label: 'Edit specific slides', prompt: 'I want to edit slide 3' }
      ];
    case 'CREATE_ONE_PAGER':
      return [
        { label: 'Expand to full deck', prompt: 'Expand this into a 10-slide presentation' },
        { label: 'LinkedIn post', prompt: 'Create LinkedIn carousel from this' }
      ];
    // ... more mappings
  }
};
```

### Component 4: ContextualHints.tsx

```typescript
interface ContextualHint {
  id: string;
  trigger: 'upload' | 'first-generation' | 'empty-state';
  message: string;
  actions?: { label: string; prompt: string }[];
  dismissible: boolean;
}

// Show hints based on user state
const getRelevantHint = (
  hasUploaded: boolean,
  hasGenerated: boolean,
  uploadedFileType?: string
): ContextualHint | null => {
  if (hasUploaded && uploadedFileType === 'pdf') {
    return {
      id: 'post-upload-pdf',
      trigger: 'upload',
      message: 'You can customize this deck for a specific customer or extract key slides',
      actions: [
        { label: 'Customize for meeting', prompt: 'Customize this for ' },
        { label: 'Extract one-pager', prompt: 'Create a one-pager from key slides' }
      ],
      dismissible: true
    };
  }
  // ... more conditions
};
```

---

## 7. Constant Definitions

### File: `constants/starterPrompts.ts`

```typescript
export const STARTER_PROMPTS_SALES = [
  'Create a 10-slide pitch deck for Q1 product launch',
  'One-pager summarizing our value proposition for enterprise clients',
  'Customize our master deck for Nike discovery meeting',
  'Case study highlighting our recent Fortune 500 win'
];

export const STARTER_PROMPTS_MARKETING = [
  'LinkedIn carousel: 5 reasons to choose our platform',
  'Infographic showing our 2024 company achievements',
  'Brochure for upcoming trade show with product catalog'
];

export const STARTER_PROMPTS_TRAINING = [
  'Onboarding deck for new sales reps (15 slides)',
  'Training presentation on our new product features'
];

export const POST_GENERATION_SUGGESTIONS = {
  CREATE_DECK: [
    'Create a one-pager summary',
    'Convert to LinkedIn carousel',
    'Generate speaker notes',
    'Extract key slides'
  ],
  CREATE_ONE_PAGER: [
    'Expand to full deck',
    'Create LinkedIn post',
    'Generate PDF brochure',
    'Make variations for different audiences'
  ],
  CREATE_LINKEDIN_CAROUSEL: [
    'Create matching Instagram carousel',
    'Expand to full presentation',
    'Generate LinkedIn post copy'
  ]
};
```

---

## 8. Integration Points

### Update: `components/ChatLandingView.tsx`

**Line ~200: Add starter prompts section**
```typescript
{messages.length === 0 && !onePagerResult && !slidesGenerated && (
  <>
    <StarterPrompts onPromptClick={(prompt) => setInput(prompt)} />
    <CapabilitiesAccordion />
  </>
)}
```

**Line ~500: Add post-generation actions**
```typescript
{(onePagerResult || slidesGenerated) && (
  <PostGenerationActions
    generatedType={lastDetectedIntent}
    onActionClick={(action, prompt) => {
      setInput(prompt);
      handleSendMessage();
    }}
  />
)}
```

**Line ~700: Add contextual hints**
```typescript
{currentAttachedImages.length > 0 && (
  <ContextualHints
    trigger="upload"
    uploadedFileType={detectFileType(currentAttachedImages[0])}
    onActionClick={(prompt) => setInput(prompt)}
  />
)}
```

---

## 9. A/B Testing Plan

### Test 1: Starter Prompt Set
- **Variant A:** 4 sales-focused prompts
- **Variant B:** 2 sales + 2 marketing prompts
- **Metric:** Click-through rate, intent distribution

### Test 2: Accordion Position
- **Variant A:** Accordion below starter prompts (current plan)
- **Variant B:** Accordion as modal on "See all" click
- **Metric:** Expansion rate, user confusion

### Test 3: Post-Generation Suggestions
- **Variant A:** 3 suggestions (current plan)
- **Variant B:** 5 suggestions
- **Metric:** Follow-up action rate, decision paralysis

---

## 10. Success Metrics

### Adoption Metrics (Week 1-2)
- 60%+ users interact with starter prompts
- 20%+ users explore capabilities accordion
- 50% reduction in "What can I create?" messages

### Engagement Metrics (Week 3-4)
- 40%+ users take post-generation follow-up actions
- 2.5+ average outputs per session (up from 1.2)
- 30%+ users create multiple output types in one session

### Sales Enablement Metrics (Week 4+)
- 50%+ PDF uploads result in customization
- 3.2+ average edits per uploaded deck
- 25%+ users generate complementary formats (deck → one-pager)

### Retention Metrics (Month 1-2)
- 15% increase in weekly active users
- 20% increase in session duration
- 35% increase in multi-format creators

---

## 11. Competitor Benchmarking

### Gamma.ai
**What they do well:**
- AI-first onboarding ("Tell me what you want to create")
- Smart template suggestions based on topic
- One-click format switching (deck → doc → webpage)

**What we can do better:**
- More granular output types (they only have deck/doc/webpage)
- Reference image style matching (they don't have this)
- Sales-specific workflows (meeting customization)

### Beautiful.ai
**What they do well:**
- Template gallery with search/filter
- Real-time design suggestions
- Team collaboration features

**What we can do better:**
- AI-powered intent detection (they require manual selection)
- Multi-format generation from one prompt
- Faster generation (our Gemini 3.0 is faster than their rendering)

### Pitch
**What they do well:**
- Beautiful templates
- Collaboration tools
- Version history

**What we can do better:**
- AI content generation (they focus on design only)
- One-pager and carousel support
- Reference image style transfer

### Tome.app
**What they do well:**
- AI storytelling (narrative flow)
- Embedded content (videos, prototypes)
- Mobile-responsive outputs

**What we can do better:**
- Faster generation
- More output formats
- Sales-specific features (meeting customization)

---

## 12. Risk Mitigation

### Risk 1: Feature Overwhelm
**Mitigation:** Progressive disclosure - hide advanced features until user shows interest

### Risk 2: Incorrect Intent Detection
**Mitigation:** Show detected intent with confidence score, allow quick corrections

### Risk 3: User Expects Chat, Gets Creation
**Mitigation:** Clear welcome message explaining this is a creation tool, not a chatbot

### Risk 4: Too Many Starter Prompts
**Mitigation:** Rotate prompts, personalize based on user history after 3+ sessions

### Risk 5: Upload Confusion
**Mitigation:** Clear visual feedback, contextual suggestions immediately after upload

---

## 13. Future Enhancements (Post-MVP)

### Personalization Engine
- Learn user's industry/role from first 3 sessions
- Customize starter prompts accordingly
- Remember preferred output formats

### Smart Templates
- Auto-suggest templates based on detected intent
- "Users who created sales decks also used these templates"

### Multi-Step Workflows
- "Create deck → Generate one-pager → Draft follow-up email" all in one flow

### Voice Input
- "Hey Deckr, create a 10-slide deck about AI in healthcare"

### Real-Time Collaboration
- Multiple users editing same presentation
- Comment threads on specific slides

---

## 14. Implementation Checklist

### Week 1: Foundation
- [ ] Create `components/StarterPrompts.tsx`
- [ ] Create `components/CapabilitiesAccordion.tsx`
- [ ] Create `constants/starterPrompts.ts`
- [ ] Update `ChatLandingView.tsx` empty state
- [ ] Add starter prompts section
- [ ] Add capabilities accordion
- [ ] Write unit tests for new components
- [ ] Design review and polish

### Week 2: Contextual Hints
- [ ] Create `components/ContextualHints.tsx`
- [ ] Create `components/PostGenerationActions.tsx`
- [ ] Update post-generation UI in `ChatLandingView.tsx`
- [ ] Add hint triggering logic
- [ ] Add dismissible hint state management
- [ ] Write integration tests
- [ ] User testing session (5 users)

### Week 3: Upload → Edit Workflow
- [ ] Create `components/PostUploadActions.tsx`
- [ ] Update file upload handler with contextual suggestions
- [ ] Enhance intent detection for meeting customization
- [ ] Add "Customize for meeting" quick action
- [ ] Add "Extract one-pager" quick action
- [ ] Write E2E tests for upload workflows
- [ ] Sales team pilot (10 users)

### Week 4: Refinement
- [ ] A/B test different starter prompt sets
- [ ] Gather user feedback and iterate
- [ ] Polish animations and transitions
- [ ] Add keyboard shortcuts
- [ ] Performance optimization
- [ ] Analytics instrumentation
- [ ] Launch to all users

---

## 15. Conclusion

This plan transforms Deckr.ai from a deck-focused tool into a comprehensive content creation platform by:

1. **Eliminating friction:** No more manual output type selection
2. **Guiding discovery:** Progressive disclosure of capabilities
3. **Being proactive:** Smart suggestions based on context
4. **Empowering users:** Clear control over AI decisions
5. **Optimizing for sales:** Upload → customize workflows

By following 2025 UX best practices and learning from competitors, we create an intuitive, AI-first experience that makes multi-format content creation feel effortless.

**Next Steps:**
1. Review and approve this plan
2. Create Figma mockups for new components
3. Begin Week 1 implementation
4. Schedule user testing sessions

---

**Document Prepared By:** Claude (AI UX Strategist)
**Based On:** 10 web searches on 2025 UX design forums, competitor analysis, and sales enablement best practices
**Review Status:** ✅ Ready for stakeholder approval
