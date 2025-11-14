# Chat Interface Service Integration Plan

## Current Architecture Analysis

### Existing Generation Flow (SmartDeckGenerator)
1. **User Input** → Raw notes textarea
2. **Planning Agent** → `analyzeNotesAndAskQuestions()` creates generation plan
3. **Plan Approval** → User approves/edits via GenerationPlanProposal modal
4. **Theme Selection** → EnhancedThemePreviewSelector shows 3 sample slides
5. **Generation** → `generateSlidesWithContext()` creates all slides
6. **Post-Gen Actions** → FloatingActionBubble for "Add More Slides", etc.

### Service Layer
- `services/intelligentGeneration.ts` - Planning agent + context-aware generation
- `services/geminiService.ts` - Core AI API calls
- `services/vibeDetection.ts` - Detects presentation vibe, returns designer styles
- `services/referenceMatchingEngine.ts` - Enterprise reference matching

---

## New Chat-Based Flow

### User Journey
```
1. User lands on ChatLandingView (hero input)
   ↓
2. User types prompt OR uploads files
   ↓
3. ChatInterface appears with AI streaming response
   ↓
4. AI proposes generation plan (formatted in chat)
   ↓
5. User approves or asks for changes
   ↓
6. AI shows 3 theme preview slides (inline in chat)
   ↓
7. User picks theme
   ↓
8. AI generates slides with real-time progress updates
   ↓
9. Slides appear in side panel preview
   ↓
10. User can chat to refine: "Make slide 3 more bold", "Add a new slide about X"
```

### Key Differences from Current Flow
- **Conversational**: All steps happen via chat messages, not modals
- **Streaming**: AI responses stream in token-by-token (like Claude/ChatGPT)
- **Contextual**: AI remembers conversation history
- **Iterative**: User can refine slides via chat, not just toolbar buttons

---

## Integration Steps

### Phase 1: Wire Up Basic Chat Flow ✅ (Current)
- [x] ChatLandingView with hero input
- [x] ChatInterface container
- [x] Design tokens
- [ ] Connect `onStartChat` to trigger AI planning agent
- [ ] Display AI response in ChatInterface

### Phase 2: Planning Agent Integration
**Goal**: When user submits prompt, AI analyzes and proposes plan

**Implementation**:
```typescript
// In App.tsx or new ChatController component
const handleStartChat = async (prompt: string, files?: File[]) => {
  setChatState({ active: true, initialPrompt: prompt, initialFiles: files });

  // Add user message to chat
  addChatMessage({ role: 'user', content: prompt });

  // Show "AI is thinking..." indicator
  setIsAIThinking(true);

  try {
    // Call planning agent (existing service)
    const plan = await analyzeNotesAndAskQuestions(prompt, audience, goal, stylePreference);

    // Format plan as chat message
    const planMessage = formatPlanAsMarkdown(plan);
    addChatMessage({ role: 'assistant', content: planMessage });

    // Store plan for approval
    setPendingPlan(plan);

  } catch (error) {
    addChatMessage({ role: 'assistant', content: 'Sorry, I encountered an error analyzing your request.' });
  } finally {
    setIsAIThinking(false);
  }
};
```

**Chat Message Format**:
```markdown
# 📋 Presentation Plan

I'll create a **10-slide deck** for your product launch presentation:

## Slides Breakdown
1. **Title Slide**: "Introducing Product X"
2. **Problem Statement**: Market pain points
3. **Solution Overview**: How Product X solves it
...

## Audience & Style
- **Audience**: Investors
- **Tone**: Professional, data-driven
- **Vibe**: Corporate Elegance

Would you like me to proceed with this plan, or would you like to adjust anything?

[Approve Plan Button] [Edit Plan Button]
```

### Phase 3: Theme Preview Integration
**Goal**: After plan approval, show 3 theme previews inline in chat

**Implementation**:
```typescript
const handleApprovePlan = async () => {
  // Detect vibe
  const vibe = detectVibeFromNotes(rawNotes);
  const designerStyles = getDesignerStylesForVibe(vibe);

  // Generate 3 preview slides (existing service)
  const previews = await generateThemePreviews(designerStyles.slice(0, 3));

  // Add chat message with theme selector component
  addChatMessage({
    role: 'assistant',
    content: 'Here are 3 theme options for your deck:',
    component: <ThemePreviewInlineSelector
      previews={previews}
      onSelect={handleThemeSelect}
    />
  });
};
```

**Chat Display**:
```
AI: Here are 3 theme options for your deck:

[Theme 1: Modern Minimalist] [Theme 2: Bold Gradient] [Theme 3: Corporate]
[ Preview Image ]           [ Preview Image ]        [ Preview Image ]

Click to select your preferred theme.
```

### Phase 4: Generation with Progress
**Goal**: Stream generation progress to chat

**Implementation**:
```typescript
const handleGenerateSlides = async (themeId: string) => {
  setIsGenerating(true);

  addChatMessage({
    role: 'assistant',
    content: 'Great choice! Generating your slides now...'
  });

  // Create progress message that updates in real-time
  const progressMessageId = createProgressMessage();

  try {
    const slides = await generateSlidesWithContext(
      context,
      (progress) => {
        // Update progress message
        updateChatMessage(progressMessageId, {
          content: `Generating slide ${progress.current}/${progress.total}...`,
          progress: (progress.current / progress.total) * 100
        });
      }
    );

    // Replace progress with completion message
    updateChatMessage(progressMessageId, {
      content: `✅ Generated ${slides.length} slides! Check the preview panel on the right.`
    });

    // Load slides into editor
    onDeckUpload(slides);

  } catch (error) {
    updateChatMessage(progressMessageId, {
      content: `❌ Generation failed: ${error.message}`
    });
  }
};
```

**Chat Display**:
```
AI: Generating slide 7/10... ████████░░ 70%

[Real-time progress bar]
```

### Phase 5: Slide Preview Panel
**Goal**: Show generated slides in right-side panel while chat continues

**Layout**:
```
┌─────────────────┬──────────────────┐
│                 │                  │
│   Chat          │  Slide Preview   │
│   Interface     │  Panel           │
│                 │                  │
│  [Messages...]  │  [Slide 1 img]   │
│                 │  [Slide 2 img]   │
│  [Input box]    │  [Slide 3 img]   │
│                 │  ...             │
└─────────────────┴──────────────────┘
```

**Implementation**:
- Resize ChatInterface to 60% width
- Add SlidePreviewPanel component (40% width)
- Clicking slide in preview opens Editor modal for detailed editing

### Phase 6: Iterative Refinement
**Goal**: User can chat to refine slides

**Examples**:
```
User: "Make slide 3 more bold and use larger fonts"
AI: [Calls geminiService to regenerate slide 3]
    "✅ Updated slide 3 with bolder design and larger fonts"

User: "Add a new slide about our pricing tiers after slide 5"
AI: [Calls createSlideFromPrompt with context]
    "✅ Added new pricing slide after slide 5"

User: "Change the color scheme to blue and gold"
AI: [Batch updates all slides with new colors]
    "✅ Updated color scheme across all 10 slides"
```

---

## Technical Architecture

### New Components Needed
1. **ChatController.tsx** - Orchestrates chat flow + service calls
2. **ThemePreviewInlineSelector.tsx** - Inline theme picker in chat
3. **SlidePreviewPanel.tsx** - Right-side panel showing slides
4. **ProgressMessage.tsx** - Real-time progress indicator in chat
5. **PlanApprovalButtons.tsx** - Inline buttons for plan approval

### New Services Needed
1. **chatOrchestrator.ts** - Coordinates planning → preview → generation flow
2. **messageFormatter.ts** - Formats AI responses as markdown/components
3. **streamingService.ts** - Handles streaming AI responses (optional)

### State Management
```typescript
interface ChatState {
  messages: ChatMessage[];
  isAIThinking: boolean;
  pendingPlan: GenerationPlan | null;
  selectedTheme: string | null;
  generatedSlides: Slide[];
  conversationContext: ConversationContext;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  component?: React.ReactNode; // For inline components
  timestamp: number;
  progress?: number; // For progress messages
}

interface ConversationContext {
  rawNotes: string;
  audience: string;
  goal: string;
  vibe: PresentationVibe;
  plan: GenerationPlan;
  slides: Slide[];
}
```

---

## Existing Services to Reuse

### Planning Agent (✅ Ready)
```typescript
// services/intelligentGeneration.ts
analyzeNotesAndAskQuestions(
  rawNotes: string,
  audience?: string,
  goal?: string,
  stylePreference?: string
): Promise<GenerationPlan>
```

### Slide Generation (✅ Ready)
```typescript
// services/intelligentGeneration.ts
generateSlidesWithContext(
  context: GenerationContext,
  onProgress?: (progress) => void
): Promise<Slide[]>
```

### Vibe Detection (✅ Ready)
```typescript
// services/vibeDetection.ts
detectVibeFromNotes(notes: string): PresentationVibe
getDesignerStylesForVibe(vibe: PresentationVibe): DesignerStyle[]
```

### Single Slide Generation (✅ Ready)
```typescript
// services/geminiService.ts
createSlideFromPrompt(
  prompt: string,
  styleReference?: string,
  slideNumber?: number
): Promise<{ imageDataUrl: string; debugData: any }>
```

---

## Next Steps (Prioritized)

### Immediate (This Session)
1. ✅ Create this plan document
2. Create ChatController component
3. Wire up `onStartChat` to call planning agent
4. Display AI plan in ChatInterface
5. Add "Approve Plan" button inline in chat

### Short-term (Next Session)
6. Integrate theme preview inline selector
7. Wire up generation with progress updates
8. Create SlidePreviewPanel component
9. Test full flow end-to-end

### Medium-term (Future)
10. Add streaming AI responses (token-by-token)
11. Implement iterative refinement ("Make slide 3 bolder")
12. Add conversation history persistence
13. Add "Export to Slides" from chat

---

## Design Principles

1. **Conversational First**: Every interaction should feel like chatting with a designer
2. **Progressive Disclosure**: Don't overwhelm with options, reveal as needed
3. **Real-time Feedback**: Show progress, don't make user wait in silence
4. **Contextual Actions**: Buttons/options appear inline at the right moment
5. **Recoverable Errors**: If AI fails, explain clearly and offer retry
6. **Preserve Existing UX**: Editor toolbar, style library, etc. still work for power users

---

## Success Metrics

- **Time to First Slide**: < 60 seconds from landing to first generated slide
- **User Delight**: "Wow, this feels like magic"
- **Flexibility**: Can handle vague prompts ("make a sales deck") AND specific ("10 slides, blue theme, for investors")
- **Iteration Speed**: Refining slides via chat is faster than clicking through modals

---

## Questions to Resolve

1. Should we preserve SmartDeckGenerator as fallback, or fully replace with chat?
   - **Recommendation**: Keep as "Advanced Mode" for power users

2. Should chat interface be full-screen or split with slide preview from start?
   - **Recommendation**: Start full-screen, split when generation begins

3. How to handle file uploads (PDFs, reference slides) in chat?
   - **Recommendation**: Inline file preview in chat message, process automatically

4. Should we implement streaming (token-by-token) AI responses?
   - **Recommendation**: Phase 2 feature, start with complete responses

---

## Timeline Estimate

- **Phase 1-3** (Basic chat flow + planning + theme): 4-6 hours
- **Phase 4** (Generation with progress): 2-3 hours
- **Phase 5** (Slide preview panel): 2-3 hours
- **Phase 6** (Iterative refinement): 3-4 hours
- **Testing & Polish**: 2-3 hours

**Total**: ~15-20 hours of focused development

---

## Notes

- Preserve all existing services (no breaking changes)
- ChatInterface should be additive, not replace Editor
- Focus on UX quality over feature quantity
- Test with real user prompts, not just happy path
