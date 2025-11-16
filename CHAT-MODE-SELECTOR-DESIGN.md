# Chat Interface Mode Selector - Design Proposal

## Current Designer Mode Flow (DesignerModeGenerator.tsx)

### Mode Selection Modal
When user has uploaded company references (style library), they see a modal with 2 options:

1. **"Use Company Templates"** (Template Mode)
   - AI matches content to uploaded references
   - Maintains exact brand style
   - Perfect brand consistency
   - Icon: Layout/grid icon
   - Color: Purple gradient

2. **"Let Deckr Go Crazy"** (Crazy Mode)
   - AI researches brand from scratch
   - Creates fresh designs
   - Maximum creative freedom
   - Icon: Lightning bolt
   - Color: Orange/pink gradient

### When Modal Appears
- User clicks "Generate" button
- System checks if `styleLibrary.length > 0`
- If yes → show mode selector modal
- If no → skip directly to crazy mode (no references available)

---

## Design Challenge: Integrating into Chat Interface

### Problem
In Gemini-style chat flow:
1. User types prompt → presses Enter
2. AI analyzes → creates plan → shows approval buttons
3. User approves → slides generate

**Where does mode selection fit?**

---

## Design Option 1: Mode Selection BEFORE Plan (Recommended)

### Flow
```
User: "Create a sales deck for enterprise clients"
  ↓
[AI thinks: Analyzing presentation context...]
  ↓
AI checks: Does user have styleLibrary?
  ↓
IF YES:
  AI: "I found 37 reference slides in your library! How would you like me to use them?"

  [Inline Mode Selector Cards - appears in chat]
  ┌─────────────────────────┐  ┌─────────────────────────┐
  │ 🎨 Use Company Templates│  │ ⚡ Let Deckr Go Crazy   │
  │                         │  │                         │
  │ Match slides to your    │  │ Research brand and      │
  │ uploaded references     │  │ create fresh designs    │
  │                         │  │                         │
  │ [Select Template Mode]  │  │ [Select Crazy Mode]     │
  └─────────────────────────┘  └─────────────────────────┘

  ↓ (User clicks one)

AI: "Got it! Creating 10-slide deck using template mode..."
  [ThinkingSection: Matching references, analyzing content...]

  ↓

AI: "Here's my plan: [shows plan]"
  [Generate Slides] [Edit Plan]

ELSE (no styleLibrary):
  AI: "Here's my plan: [shows plan]"
  [Generate Slides] [Edit Plan]
```

### Implementation Details

**In ChatLandingView.tsx handleGenerate():**

```typescript
const handleGenerate = async () => {
  const userPrompt = inputValue.trim();
  setChatActive(true);

  // Add user message
  addMessage({ role: 'user', content: userPrompt });

  // Step 1: Check for style library
  const hasStyleLibrary = styleLibrary && styleLibrary.length > 0;

  // Step 2: If has library, ask for mode selection
  if (hasStyleLibrary) {
    addMessage({
      role: 'assistant',
      content: `I found ${styleLibrary.length} reference slides in your library! How would you like me to use them?`,
      component: <ModeSelectionCards
        onSelectMode={(mode) => continueWithMode(mode, userPrompt)}
        referenceCount={styleLibrary.length}
      />
    });
    return; // Wait for mode selection
  }

  // Step 3: No library → proceed directly
  continueWithMode('crazy', userPrompt);
};

const continueWithMode = async (mode: 'template' | 'crazy', userPrompt: string) => {
  // Start AI processing...
  // detectVibeFromNotes()
  // analyzeNotesAndAskQuestions()
  // Show plan with approval buttons
  // etc...
};
```

**New Component: ModeSelectionCards.tsx**

```tsx
interface ModeSelectionCardsProps {
  onSelectMode: (mode: 'template' | 'crazy') => void;
  referenceCount: number;
}

const ModeSelectionCards: React.FC<ModeSelectionCardsProps> = ({
  onSelectMode,
  referenceCount
}) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '16px'
  }}>
    {/* Template Mode Card */}
    <button onClick={() => onSelectMode('template')} style={{
      background: 'linear-gradient(135deg, #F3F4FF 0%, #E8EAFF 100%)',
      border: '2px solid #C7D2FE',
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎨</div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#4F46E5', marginBottom: '8px' }}>
        Use Company Templates
      </div>
      <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.5' }}>
        AI matches your content to {referenceCount} uploaded references. Perfect brand consistency.
      </div>
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#4F46E5', fontWeight: '500' }}>
        ✓ Exact brand match
      </div>
    </button>

    {/* Crazy Mode Card */}
    <button onClick={() => onSelectMode('crazy')} style={{
      background: 'linear-gradient(135deg, #FFF4ED 0%, #FFE4E6 100%)',
      border: '2px solid #FED7AA',
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'left',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚡</div>
      <div style={{ fontSize: '16px', fontWeight: '600', color: '#EA580C', marginBottom: '8px' }}>
        Let Deckr Go Crazy
      </div>
      <div style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.5' }}>
        AI researches your brand and creates fresh designs from scratch. Maximum creativity.
      </div>
      <div style={{ marginTop: '12px', fontSize: '12px', color: '#EA580C', fontWeight: '500' }}>
        ✨ Fresh creative designs
      </div>
    </button>
  </div>
);
```

### User Experience

**Scenario 1: User WITH style library**
```
User: "Create a technical presentation for SolarWinds"
  ↓
AI: "I found 37 reference slides in your library! How would you like me to use them?"
  [Shows 2 cards side by side]
  ↓
User: [Clicks "Use Company Templates"]
  ↓
AI: "Got it! Matching your content to uploaded references..."
  [ThinkingSection expands with steps]
  ↓
AI: "Here's my plan: 10-slide technical deck..."
  [Generate Slides] [Edit Plan]
```

**Scenario 2: User WITHOUT style library**
```
User: "Create a sales deck"
  ↓
AI: "Here's my plan: 8-slide sales deck..."
  [Generate Slides] [Edit Plan]
  (No mode selection - goes straight to crazy mode)
```

---

## Design Option 2: Mode Selection AFTER Plan

### Flow
```
User: "Create a sales deck"
  ↓
AI analyzes → creates plan
  ↓
AI: "Here's my plan: 10-slide deck with professional style..."

  IF has styleLibrary:
    [Generate with Templates] [Generate Fresh Designs] [Edit Plan]
  ELSE:
    [Generate Slides] [Edit Plan]
```

**Pros:**
- Less interruption in flow
- User sees plan first, then decides how to generate

**Cons:**
- Mode selection feels like an afterthought
- Doesn't leverage template matching DURING planning
- Less clear what "templates vs fresh" means without context

---

## Design Option 3: Smart Default with Toggle

### Flow
```
User: "Create a sales deck"
  ↓
AI analyzes → creates plan
  ↓
AI: "Here's my plan: 10-slide deck..."

IF has styleLibrary:
  [Generate Slides (Using Templates)]  [Switch to Crazy Mode]
  ↓
  User can click "Switch to Crazy Mode" to toggle

ELSE:
  [Generate Slides]
```

**Pros:**
- One-click generation (template mode as default)
- Option to switch without interrupting

**Cons:**
- Template mode as default might not be what user wants
- Less discoverable

---

## Recommendation: Option 1 (Mode Selection BEFORE Plan)

### Why?
1. **Clear decision point** - User knows exactly what they're choosing
2. **Leverages context early** - AI can plan differently based on mode
3. **Matches existing flow** - Similar to DesignerModeGenerator modal
4. **Educational** - Explains what each mode does inline
5. **Visual hierarchy** - Cards are more engaging than buttons

### Visual Design

**Mode Selection Cards in Chat:**

```
┌────────────────────────────────────────────────────────────┐
│ AI Avatar  I found 37 reference slides in your library!   │
│            How would you like me to use them?              │
│                                                            │
│            ┌─────────────────┐  ┌─────────────────┐       │
│            │ 🎨              │  │ ⚡              │       │
│            │ Use Company     │  │ Let Deckr Go   │       │
│            │ Templates       │  │ Crazy          │       │
│            │                 │  │                 │       │
│            │ Match to 37     │  │ Fresh designs   │       │
│            │ references      │  │ from scratch    │       │
│            │                 │  │                 │       │
│            │ ✓ Brand match  │  │ ✨ Creative     │       │
│            └─────────────────┘  └─────────────────┘       │
└────────────────────────────────────────────────────────────┘
```

### Animation
- Cards fade in with slight stagger (left first, then right)
- Hover: Slight scale up (1.02x) + shadow
- Click: Scale down (0.98x) → fade out → show thinking section

---

## Implementation Checklist

- [ ] Create `ModeSelectionCards.tsx` component
- [ ] Update `handleGenerate()` to check for `styleLibrary`
- [ ] Add `continueWithMode(mode, prompt)` function
- [ ] Store selected mode in state: `const [generationMode, setGenerationMode] = useState<'template' | 'crazy' | null>(null)`
- [ ] Pass mode to `handleGenerateSlides(plan, mode)`
- [ ] Update slide generation to use references when `mode === 'template'`
- [ ] Add mode indicator in ThinkingSection (e.g., "Using template mode - matching references...")
- [ ] Test with/without style library
- [ ] Add analytics tracking for mode selection

---

## Alternative: Conversational Approach (Future Enhancement)

Instead of cards, AI could ask conversationally:

```
AI: "I found 37 reference slides in your library. Would you like me to:
     A) Match your content to these references for brand consistency
     B) Create fresh designs from scratch"

User: "Let's use the references"

AI: "Perfect! Matching your content to uploaded templates..."
```

**Pros:** More natural, feels like conversation
**Cons:** Requires natural language understanding, slower than clicking cards

---

## Conclusion

**Recommended approach:** Option 1 with inline mode selection cards BEFORE plan generation.

This provides:
- Clear user choice
- Visual engagement
- Maintains Gemini chat flow
- Educational (explains what each mode does)
- Fast (one click to select)

Next steps: Implement `ModeSelectionCards` component and integrate into `ChatLandingView.tsx`.
