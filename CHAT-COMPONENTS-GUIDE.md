# Chat Components Guide

Comprehensive guide to all agentic chat interface components in Deckr.ai.

---

## Component Overview

### 1. **ChatLandingView** (`components/ChatLandingView.tsx`)

**Purpose:** Hero landing page with Gemini-inspired input box

**Features:**
- Auto-expanding textarea (grows with content up to 240px)
- Scrollbar appears at optimal timing (~6-7 lines)
- File upload button (left side)
- Model selector + circular submit button (right side)
- Magic Patterns gradient background (4 orbs with blur filters)
- Suggested prompts below input

**Usage:**
```tsx
<ChatLandingView
  onStartChat={(prompt, files) => {
    // Handle chat initialization
    setChatState({ active: true, initialPrompt: prompt, initialFiles: files });
  }}
/>
```

**Key Design Details:**
- Submit button: 40px circular with upward arrow
- Hover: +2% brightness (user-validated preference)
- Background: 4 gradient orbs with 60-80px blur filters
- Input: Auto-resize using scrollHeight

---

### 2. **ChatInterface** (`components/ChatInterface.tsx`)

**Purpose:** Main chat container for conversational flow

**Features:**
- Message list with user/assistant bubbles
- Streaming message support
- Inline components (theme preview, plan approval)
- Scroll to bottom on new messages
- Input box at bottom

**Usage:**
```tsx
<ChatInterface
  initialPrompt="Create a sales deck"
  initialFiles={[]}
  onComplete={(slides) => {
    // Handle generated slides
  }}
  onCancel={() => {
    // Handle cancel
  }}
/>
```

**Message Format:**
```typescript
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  component?: React.ReactNode; // For inline components
  thinking?: ThinkingSection;
  actions?: ActionSummary;
  timestamp: number;
}
```

---

### 3. **ThinkingSection** (`components/ThinkingSection.tsx`)

**Purpose:** Collapsible "Thought for Xs" section showing AI reasoning

**Features:**
- Expandable/collapsible with ▾ arrow
- Real-time progress steps
- Checkmarks (✓) for completed steps
- Loaders for active steps (context-aware)
- Pending steps shown as gray circles

**Usage:**
```tsx
<ThinkingSection
  steps={[
    { id: '1', title: 'Analyzing presentation goals', status: 'completed', type: 'thinking' },
    { id: '2', title: 'Planning slide structure', status: 'completed', type: 'thinking' },
    { id: '3', title: 'Generating slide 3/10', status: 'active', type: 'generating' }
  ]}
  duration="7s"
  defaultExpanded={false}
/>
```

**Step Types:**
- `'thinking'` → Uses **BrandedLoader** (sparkle + arc)
- `'generating'` → Uses **SlideGenerationLoader** (slide stack)
- `'processing'` → Uses **BrandedLoader** (default)

**Visual Behavior:**
```
🤖 Thought for 7s ▾
  ✓ Analyzing presentation goals
  ✓ Planning slide structure
  ⏳ Generating slide 3/10...  ← Active with slide stack loader
  ○ Adding final polish         ← Pending
```

---

### 4. **ActionSummary** (`components/ActionSummary.tsx`)

**Purpose:** Shows completed actions with file/slide changes

**Features:**
- Action header with icon
- List of modified items
- Diff counters (`+- 142`, `+98`, etc.)
- Checkmarks for completed items
- Hover effects

**Usage:**
```tsx
<ActionSummary
  label="Generated Slides"
  icon="sparkles"
  items={[
    { name: 'Title Slide', status: 'completed', changes: '+142' },
    { name: 'Problem Statement', status: 'completed', changes: '+98' },
    { name: 'Solution Overview', status: 'completed', changes: '+156' }
  ]}
/>
```

**Icon Options:**
- `'sparkles'` - Default, for AI-generated content
- `'check'` - For successful operations
- `'edit'` - For modifications
- `'file'` - For file operations

---

### 5. **BrandedLoader** (`components/BrandedLoader.tsx`)

**Purpose:** General-purpose AI loader with sparkle + rotating arc

**Features:**
- Indigo/purple gradient (brand colors)
- Rotating arc animation (1.2s)
- Pulsing sparkle icon
- Optional text label
- Inline or block display

**Usage:**
```tsx
<BrandedLoader size={20} text="Analyzing..." variant="inline" />
```

**Use Cases:**
- AI thinking/analyzing
- Plan generation
- Theme selection
- File processing
- General loading states

**Sizes:**
- Small: 16px
- Medium: 20-24px
- Large: 32px

---

### 6. **SlideGenerationLoader** (`components/SlideGenerationLoader.tsx`)

**Purpose:** Contextual loader for slide generation with stacked slides

**Features:**
- 3 slides layering/animating
- Golden sparkle (✨) on top-right
- Smooth fade-in animations
- Optional progress text

**Usage:**
```tsx
<SlideGenerationLoader
  size={24}
  currentSlide={3}
  totalSlides={10}
/>
// Displays: "Creating slide 3/10..."
```

**Use Cases:**
- Slide generation progress
- Deck building
- Adding new slides
- Batch slide operations

**Animation Flow:**
1. Back slide (faint) - fades in/out
2. Middle slide (medium) - slides up
3. Front slide (bright) - appears with scale
4. Sparkle (gold) - twinkles

---

## Loader Decision Matrix

| Context | Loader to Use | Reason |
|---------|--------------|--------|
| **Analyzing user input** | BrandedLoader | General AI thinking |
| **Planning deck structure** | BrandedLoader | Not slide-specific |
| **Detecting presentation vibe** | BrandedLoader | Analysis task |
| **Generating theme previews** | SlideGenerationLoader | Creating slides |
| **Generating slide 3/10** | SlideGenerationLoader | Contextual feedback |
| **Uploading files** | BrandedLoader | Generic processing |
| **Selecting best reference** | BrandedLoader | AI decision-making |
| **Building full deck** | SlideGenerationLoader | Creating multiple slides |

---

## Design System Integration

### Color Palette (from `styles/design-tokens.css`)

**Brand Colors:**
```css
--color-brand-500: #6366F1;  /* Primary indigo */
--color-brand-600: #4F46E5;  /* Hover state */
--color-purple-600: #9333EA; /* Accent */
```

**Loaders use:**
- BrandedLoader: `#6366F1` → `#A855F7` gradient
- SlideGenerationLoader: `#6366F1` → `#8B5CF6` gradient
- Sparkle accent: `#F59E0B` → `#F97316` (golden)

### Typography

**Font Stack:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Sizes Used in Chat:**
- Headers: 18px (semibold)
- Body text: 14px (regular)
- Labels: 13px (medium)
- Captions: 12px (regular)

### Spacing (4px base unit)

```css
--space-2: 0.5rem;   /* 8px - tight gaps */
--space-3: 0.75rem;  /* 12px - standard gaps */
--space-4: 1rem;     /* 16px - section spacing */
--space-6: 1.5rem;   /* 24px - large sections */
```

### Shadows

**Chat components use:**
```css
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);  /* Input boxes */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1); /* Cards */
--shadow-brand: 0 10px 30px -5px rgba(99, 102, 241, 0.2); /* Submit button */
```

### Border Radius

**Standardized radii:**
```css
--radius-md: 0.5rem;   /* 8px - Small cards */
--radius-lg: 0.75rem;  /* 12px - Medium cards */
--radius-xl: 1rem;     /* 16px - Large cards */
--radius-2xl: 1.5rem;  /* 24px - Input box */
--radius-full: 9999px; /* Circular - Submit button */
```

### Transitions

**All animations use:**
```css
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## Animation Principles

### 1. **Micro-interactions**
- Hover effects: 150-200ms
- Scale on hover: 1.08x (submit button)
- Lift on hover: translateY(-0.5px) for suggested prompts

### 2. **Loaders**
- Rotation: 1.2s linear infinite (BrandedLoader arc)
- Pulse: 1.2s ease-in-out infinite (sparkle)
- Fade: 1.5s ease-in-out infinite (slide stack)

### 3. **State Changes**
- Expand/collapse: 150ms ease
- Message appear: Fade in 200ms
- Scroll to bottom: Smooth scroll

---

## Best Practices

### 1. **Progressive Disclosure**
- Thinking section collapsed by default
- Expand only when user clicks
- Don't overwhelm with too much info

### 2. **Real-time Feedback**
- Update thinking steps as they happen
- Show current slide being generated (3/10)
- Change loader type based on context

### 3. **Contextual Clarity**
- Use SlideGenerationLoader when creating slides
- Use BrandedLoader for everything else
- Always show what's happening (text + loader)

### 4. **Error Handling**
- Show clear error messages in chat
- Offer retry options
- Maintain conversation context

### 5. **Accessibility**
- All interactive elements have clear focus states
- Loaders have descriptive text
- Color contrast meets WCAG AA (4.5:1 minimum)

---

## Code Examples

### Complete Chat Message with Thinking + Actions

```tsx
const exampleMessage: ChatMessage = {
  id: 'msg-123',
  role: 'assistant',
  content: "I've created a 10-slide product launch deck! Here's what I included...",
  timestamp: Date.now(),
  thinking: {
    steps: [
      {
        id: 'step-1',
        title: 'Analyzing presentation goals',
        content: 'User wants a product launch deck for investors...',
        status: 'completed',
        type: 'thinking'
      },
      {
        id: 'step-2',
        title: 'Planning slide structure',
        content: 'Starting with problem, solution, market...',
        status: 'completed',
        type: 'thinking'
      },
      {
        id: 'step-3',
        title: 'Generating slide 10/10',
        status: 'completed',
        type: 'generating'
      }
    ],
    duration: '12s'
  },
  actions: {
    label: 'Generated Slides',
    icon: 'sparkles',
    items: [
      { name: 'Title Slide', status: 'completed', changes: '+142' },
      { name: 'Problem Statement', status: 'completed', changes: '+98' },
      { name: 'Solution Overview', status: 'completed', changes: '+156' },
      // ... 7 more slides
    ]
  }
};
```

### Using Loaders in Custom Components

```tsx
// For general AI processing
const ThinkingIndicator = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <BrandedLoader size={16} variant="inline" />
    <span>AI is thinking...</span>
  </div>
);

// For slide generation
const GeneratingIndicator = ({ current, total }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <SlideGenerationLoader size={20} currentSlide={current} totalSlides={total} />
  </div>
);
```

---

## Future Enhancements

### Planned Features
1. **Streaming responses** - Token-by-token text streaming
2. **Inline editing** - Edit AI responses directly in chat
3. **Message reactions** - 👍 👎 for AI responses
4. **Conversation branching** - "Try this approach instead"
5. **Voice input** - Speak your presentation ideas
6. **Multi-modal** - Upload images, PDFs, URLs as context

### Under Consideration
- Dark mode support
- Custom theme selector
- Export conversation as PDF
- Share conversation via link
- Collaborative chat (multiple users)

---

## Component Dependencies

```
ChatLandingView
  └─ (no dependencies)

ChatInterface
  ├─ ThinkingSection
  │   ├─ BrandedLoader
  │   └─ SlideGenerationLoader
  ├─ ActionSummary
  └─ (other inline components)

ThinkingSection
  ├─ BrandedLoader
  └─ SlideGenerationLoader

ActionSummary
  └─ (no dependencies)

BrandedLoader
  └─ (no dependencies)

SlideGenerationLoader
  └─ (no dependencies)
```

---

## Testing Checklist

### ChatLandingView
- [ ] Textarea auto-expands smoothly
- [ ] Scrollbar appears at 240px height
- [ ] Submit button shows on input
- [ ] Submit button hover: +2% brightness
- [ ] Gradient background animates smoothly
- [ ] File upload works
- [ ] Model selector opens/closes
- [ ] Suggested prompts clickable

### ThinkingSection
- [ ] Collapses/expands smoothly
- [ ] Shows correct loader for step type
- [ ] Checkmarks appear for completed steps
- [ ] Duration calculates correctly
- [ ] Hover states work

### ActionSummary
- [ ] Items list correctly
- [ ] Diff counters display
- [ ] Icons match action type
- [ ] Hover effects smooth

### Loaders
- [ ] BrandedLoader rotates smoothly
- [ ] SlideGenerationLoader slides animate
- [ ] No janky animations
- [ ] Sizes scale correctly
- [ ] Colors match brand

---

## Performance Notes

- **Animations:** All CSS-based (no JS loops)
- **Re-renders:** Loaders are memoized
- **Scroll:** Uses native smooth scroll
- **Images:** Lazy-loaded in chat
- **Bundle size:** ~8KB for all chat components

---

## Support & Questions

For questions about these components:
1. Read this guide first
2. Check `CHAT-INTEGRATION-PLAN.md` for service integration
3. Review `design-tokens.css` for design system
4. See example usage in components

---

**Last Updated:** November 14, 2025
**Author:** Deckr.ai Design Team
**Version:** 1.0.0
