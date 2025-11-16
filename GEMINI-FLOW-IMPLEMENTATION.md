# Gemini Flow Implementation Plan

**Goal:** Transform ChatLandingView to work exactly like Gemini - input box slides down and chat appears on same page.

---

## Current vs Desired Behavior

### ❌ Current (Wrong)
```
User types prompt → presses Enter
  ↓
App.tsx switches to ChatController (new view)
  ↓
Entire landing page disappears
  ↓
Chat appears in separate interface
```

### ✅ Desired (Gemini Pattern)
```
User types prompt → presses Enter
  ↓
Input box animates down to bottom (shrinks)
  ↓
User message appears at top-right
  ↓
AI response appears below
  ↓
Input stays at bottom for follow-up
  ↓
All on same page!
```

---

## Implementation Steps

### Step 1: Update ChatLandingView Props
**File:** `components/ChatLandingView.tsx` (lines 1-7)

```typescript
// BEFORE:
interface ChatLandingViewProps {
  onStartChat: (initialPrompt: string, files?: File[]) => void;
}

// AFTER:
import { StyleLibraryItem, Slide } from '../types';
import ChatInterface from './ChatInterface';
import ThinkingSection, { ThinkingStep } from './ThinkingSection';
import ActionSummary, { ActionItem } from './ActionSummary';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  thinking?: {
    steps: ThinkingStep[];
    duration: string;
  };
  actions?: {
    label: string;
    icon: 'sparkles' | 'check' | 'edit' | 'file';
    items: ActionItem[];
  };
}

interface ChatLandingViewProps {
  styleLibrary: StyleLibraryItem[];
  onDeckGenerated: (slides: Slide[]) => void;
}
```

---

### Step 2: Add Chat State
**File:** `components/ChatLandingView.tsx` (after line 14)

```typescript
const ChatLandingView: React.FC<ChatLandingViewProps> = ({
  styleLibrary,
  onDeckGenerated
}) => {
  // Existing state...
  const [inputValue, setInputValue] = useState('');
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Gemini 2.0 Flash');

  // NEW: Chat state
  const [chatActive, setChatActive] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
```

---

### Step 3: Update handleGenerate
**File:** `components/ChatLandingView.tsx` (lines 40-45)

```typescript
// BEFORE:
const handleGenerate = () => {
  if (inputValue.trim()) {
    onStartChat(inputValue.trim());
    setInputValue('');
  }
};

// AFTER:
const handleGenerate = async () => {
  if (!inputValue.trim()) return;

  const userPrompt = inputValue.trim();
  setInputValue('');

  // Activate chat mode (input slides down)
  setChatActive(true);

  // Add user message
  const userMessage: ChatMessage = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: userPrompt,
    timestamp: Date.now()
  };
  setMessages([userMessage]);

  // Start AI processing (copy logic from ChatController.tsx)
  setIsProcessing(true);

  try {
    // TODO: Copy the entire handleUserPrompt logic from ChatController
    // This includes:
    // - detectVibeFromNotes()
    // - analyzeNotesAndAskQuestions()
    // - Creating plan
    // - Generating slides
  } catch (error) {
    // Handle error
  } finally {
    setIsProcessing(false);
  }
};
```

---

### Step 4: Update JSX Layout
**File:** `components/ChatLandingView.tsx` (lines 92-end)

Change from:
```typescript
return (
  <div className="w-full h-full flex items-center justify-center">
    {/* Background */}
    {/* Hero Content */}
    {/* Large centered input */}
  </div>
);
```

To:
```typescript
return (
  <div className="w-full h-full flex flex-col" style={{
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Background (always visible) */}
    <div style={{ /* existing background styles */ }}>
      {/* gradient meshes */}
    </div>

    {/* Content Layer */}
    <div style={{
      position: 'relative',
      zIndex: 1,
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.3s ease'
    }}>

      {/* Header: Greeting or Messages */}
      {!chatActive ? (
        // BEFORE CHAT: Large greeting + suggested prompts
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 style={{
            fontSize: '48px',
            fontWeight: '400',
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '48px'
          }}>
            Hello, Nabil
          </h1>

          {/* Suggested prompts */}
          <div className="flex gap-3 mb-12">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handlePromptClick(prompt)}
                style={{
                  padding: '12px 20px',
                  background: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  borderRadius: '12px',
                  fontSize: '14px',
                  color: '#6366F1',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
        // AFTER CHAT: Messages area
        <div className="flex-1 overflow-y-auto px-8 py-8" style={{
          maxWidth: '900px',
          margin: '0 auto',
          width: '100%'
        }}>
          {messages.map((message) => (
            <div key={message.id} className="mb-8">
              {message.role === 'user' && (
                <div className="flex justify-end">
                  <div style={{
                    padding: '16px 20px',
                    background: '#F3F4F6',
                    borderRadius: '20px',
                    maxWidth: '80%',
                    fontSize: '16px',
                    color: '#1F2937'
                  }}>
                    {message.content}
                  </div>
                </div>
              )}

              {message.role === 'assistant' && (
                <div className="flex items-start gap-4">
                  {/* AI Avatar */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>

                  {/* Message Content */}
                  <div style={{ flex: 1 }}>
                    {message.thinking && (
                      <ThinkingSection
                        steps={message.thinking.steps}
                        duration={message.thinking.duration}
                      />
                    )}

                    <div style={{
                      fontSize: '16px',
                      color: '#1F2937',
                      lineHeight: '1.6',
                      marginTop: message.thinking ? '12px' : '0'
                    }}>
                      {message.content}
                    </div>

                    {message.actions && (
                      <div style={{ marginTop: '12px' }}>
                        <ActionSummary
                          label={message.actions.label}
                          icon={message.actions.icon}
                          items={message.actions.items}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-3">
              {/* Loading indicator */}
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span style={{ fontSize: '14px', color: '#6B7280' }}>Thinking...</span>
            </div>
          )}
        </div>
      )}

      {/* Input Box - Slides down when chat active */}
      <div style={{
        padding: chatActive ? '16px 24px' : '0 96px 96px', // Less padding when at bottom
        transition: 'all 0.3s ease',
        maxWidth: chatActive ? '100%' : '800px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* EXISTING INPUT BOX CODE (lines 200-500) */}
        {/* Just wrap it in this positioning div */}
      </div>
    </div>
  </div>
);
```

---

### Step 5: Copy ChatController Logic
**File:** `components/ChatLandingView.tsx`

Copy these functions from `ChatController.tsx`:
- `addMessage()` - Add messages to state
- `addThinkingStep()` - Add thinking steps
- `updateThinkingStep()` - Update step status
- `handleUserPrompt()` - Process user input (vibe detection → analysis → plan → slides)
- `handleFileUpload()` - Process uploaded files
- `handleGenerateSlides()` - Generate slides with AI

---

## Visual Transformation

### Animation Sequence

```
STATE 1: Landing (chatActive = false)
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│            Hello, Nabil                 │
│                                         │
│    [Suggested prompts...]               │
│                                         │
│                                         │
│     ┌──────────────────────┐            │  ← Large centered
│     │  [Input box]         │            │
│     │  + | icons | submit  │            │
│     └──────────────────────┘            │
│                                         │
└─────────────────────────────────────────┘

STATE 2: Chat Active (chatActive = true)
┌─────────────────────────────────────────┐
│  "Create a sales deck"         (U)      │  ← User message top-right
│                                         │
│  (AI) I'll create a 5-slide deck...     │  ← AI response with avatar
│       [ThinkingSection]                 │
│       [ActionSummary]                   │
│                                         │
│  ─────────────────────────────────────  │
│  ┌──────────────────────────────────┐  │  ← Small, bottom
│  │  Ask for changes...              │  │
│  │  + | icons | submit              │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Transition Timing

```css
/* Input box position */
transition: padding 0.3s ease;

/* When chatActive changes: */
- padding: '0 96px 96px' → '16px 24px' (moves up and shrinks)
- maxWidth: '800px' → '100%'
```

---

## Implementation Checklist

- [ ] Update imports and interfaces
- [ ] Add chat state variables
- [ ] Copy ChatController helper functions
- [ ] Update `handleGenerate()` to activate chat
- [ ] Update `handleFileUpload()` to activate chat
- [ ] Restructure JSX layout (hero vs messages)
- [ ] Add conditional rendering based on `chatActive`
- [ ] Test text prompt flow
- [ ] Test file upload flow
- [ ] Test follow-up messages
- [ ] Verify smooth animations

---

## Files to Modify

1. **`components/ChatLandingView.tsx`** - Main implementation (all changes here)
2. **`App.tsx`** - Already updated (passes styleLibrary, onDeckGenerated)
3. **`components/ChatController.tsx`** - Can be deleted after migration (optional)

---

**Estimated Time:** 2-3 hours
**Complexity:** Medium-High (large file refactor)
**Risk:** Low (can test incrementally)
