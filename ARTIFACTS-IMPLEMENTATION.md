# Artifacts Panel Implementation

Modern Claude/Gemini-style artifacts panel for Deckr.ai, enabling conversational slide editing and real-time preview.

## 📋 Overview

The Artifacts system adds a persistent side panel that displays generated slides in real-time, allowing users to:
- View slides as they're generated
- Edit slides conversationally through chat
- Switch between different view modes (Grid, Filmstrip, Presenter)
- Resize the split-screen layout
- Export to PDF or open in classic editor

## 🎨 Design Principles

**Aligned with Deckr.ai Design System:**
- Uses design tokens from `styles/design-tokens.css`
- Gemini-style conversational UX
- Purple brand color (#6366F1)
- Pill-shaped buttons with 20px border radius
- SlideGenerationLoader for generating slides
- Clean, professional aesthetic (not "classic SaaS")

**Inspired by:**
- ✅ Claude Artifacts (side panel, persistent workspace)
- ✅ ChatGPT Canvas (split-screen editing)
- ✅ Gemini Canvas (embedded blocks, theme selection)
- ✅ Figma Slides (view mode controls)
- ✅ Canva (filmstrip navigation)

## 📁 New Components

### 1. `ArtifactsPanel.tsx` (Main Component)

**Purpose:** Display slides in 3 different view modes

**Features:**
- **Grid View**: Overview of all slides in a responsive grid
- **Filmstrip View**: PowerPoint-style left sidebar with large preview
- **Presenter View**: Horizontal filmstrip with large current slide

**Props:**
```typescript
interface ArtifactsPanelProps {
  slides: Slide[];
  onSlideClick?: (slide: Slide) => void;
  onSlideEdit?: (slide: Slide) => void;
  onSlideDuplicate?: (slide: Slide) => void;
  onSlideDelete?: (slide: Slide) => void;
  onOpenInEditor?: () => void;
  onDownloadPDF?: () => void;
}
```

**View Mode Controls:**
- Grid icon (4 squares) - Best for overview
- Filmstrip icon (sidebar + canvas) - Best for editing
- Presenter icon (slides strip) - Best for flow review

**Slide Card Features:**
- 16:9 aspect ratio preview
- Hover actions (edit, delete)
- Generating state with SlideGenerationLoader
- Selected state (blue border)
- Timestamp ("Updated 2m ago")

### 2. `ChatWithArtifacts.tsx` (Layout Wrapper)

**Purpose:** Split-screen layout combining chat + artifacts

**Features:**
- Resizable split (30%-70% range)
- Default 60/40 ratio (artifacts/chat)
- Smooth resize with visual feedback
- Collapses to full-screen chat when no slides
- Floating "Show Slides" button when artifacts hidden

**State Management:**
```typescript
const [showArtifacts, setShowArtifacts] = useState(false);
const [artifactSlides, setArtifactSlides] = useState<Slide[]>([]);
const [splitRatio, setSplitRatio] = useState(60); // %
```

**Resize Handle:**
- 4px wide
- Hover: purple tint (rgba(99, 102, 241, 0.2))
- Visual indicator at center during resize
- Prevents text selection while dragging

## 🔄 Integration Points

### ChatLandingView Updates Needed

```typescript
interface ChatLandingViewProps {
  user: any;
  onSignOut: () => void;

  // New props for artifacts
  onSlidesGenerated?: (slides: Slide[]) => void;
  onSlideUpdate?: (slideId: string, updates: Partial<Slide>) => void;
  onAddSlide?: (newSlide: Slide) => void;
  artifactSlides?: Slide[];
}
```

### App.tsx Integration

Replace current routing logic:

```typescript
// OLD: Direct ChatLandingView
<ChatLandingView styleLibrary={styleLibrary} onDeckGenerated={...} />

// NEW: ChatWithArtifacts wrapper
<ChatWithArtifacts user={user} onSignOut={handleSignOut} />
```

## 🎯 User Workflows

### Workflow 1: Generate Slides with Artifacts

1. **User enters prompt** in ChatLandingView
   ```
   "Create a 5-slide pitch deck for a SaaS startup"
   ```

2. **AI generates slides** (shown in chat with ThinkingSection)
   - Step 1: Analyzing prompt
   - Step 2: Planning structure
   - Step 3: Generating slide 1/5 (SlideGenerationLoader)
   - Step 4: Generating slide 2/5...

3. **Artifacts panel appears** automatically
   - Slides appear in real-time as they generate
   - Grid view by default
   - Each slide shows generating state → complete state

4. **User explores slides**
   - Switch to Filmstrip view for large preview
   - Click slides to select
   - Hover for quick actions (edit, delete)

### Workflow 2: Edit Slide Conversationally

1. **User types in chat:**
   ```
   "Make slide 3 title bigger and change the color to blue"
   ```

2. **AI responds:**
   - ThinkingSection: "Updating slide 3..."
   - Artifacts panel: Slide 3 shows generating state
   - Real-time update: Slide 3 thumbnail refreshes

3. **Chat confirmation:**
   ```
   AI: "I've increased the title size to 48pt and changed
   the color to #3B82F6 (blue) on slide 3."
   ```

### Workflow 3: Add New Slide

1. **User types:**
   ```
   "Add a new slide about pricing after slide 4"
   ```

2. **AI generates new slide:**
   - Appears in artifacts grid at position 5
   - All subsequent slides renumber automatically
   - New slide shows generating state

3. **Artifacts updates:**
   - Grid re-flows to show new slide
   - Selected slide highlights in blue
   - Scroll automatically to new slide position

### Workflow 4: Export or Open Editor

1. **User clicks "Download PDF"**
   - All slides rendered to PDF
   - Download starts automatically

2. **User clicks "Open in Editor"**
   - Transitions to classic Editor view
   - All slides preserved
   - Full editing capabilities available

## 🎨 Visual Design Details

### Color System

```css
/* Brand Colors */
--color-brand-500: #6366F1;  /* Primary */
--color-brand-600: #4F46E5;  /* Hover */

/* Shadows */
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-brand: 0 10px 30px -5px rgba(99, 102, 241, 0.2);

/* Border Radius */
--radius-md: 0.5rem;    /* 8px - Cards */
--radius-lg: 0.75rem;   /* 12px - Slide cards */
--radius-xl: 1rem;      /* 16px - Large cards */
```

### Slide Card States

```typescript
// Default
border: '1px solid rgba(0, 0, 0, 0.06)'
boxShadow: 'var(--shadow-sm)'

// Hover
transform: 'translateY(-2px)'
boxShadow: 'var(--shadow-md)'

// Selected
border: '2px solid #6366F1'

// Generating
boxShadow: 'var(--shadow-brand)' // Purple glow
```

### Typography

```css
/* Sizes */
--text-xs: 0.75rem;    /* 12px - Metadata */
--text-sm: 0.875rem;   /* 14px - Slide titles */
--text-base: 1rem;     /* 16px - Body */
--text-lg: 1.125rem;   /* 18px - Panel header */

/* Weights */
--font-medium: 500;    /* Labels */
--font-semibold: 600;  /* Headers */
```

## 🔧 Implementation Status

### ✅ Completed
- [x] ArtifactsPanel component with 3 view modes
- [x] SlideCard component with hover states
- [x] ChatWithArtifacts split-screen layout
- [x] Resizable divider with visual feedback
- [x] View mode switcher (Grid/Filmstrip/Presenter)
- [x] Design tokens integration
- [x] SlideGenerationLoader for generating state

### 🚧 In Progress
- [ ] Update ChatLandingView props
- [ ] Conversational editing logic
- [ ] App.tsx routing integration
- [ ] PDF export functionality
- [ ] Transition to classic editor

### 📋 Todo
- [ ] Drag-and-drop slide reordering
- [ ] Keyboard navigation (arrow keys)
- [ ] Slide search/filter
- [ ] Collaborative editing (multi-user)
- [ ] Version history
- [ ] Comments on slides

## 📐 Layout Specifications

### Split-Screen Ratios

```
Default: 40% Chat | 60% Artifacts
  ┌──────────┬─────────────────┐
  │          │                 │
  │   Chat   │    Artifacts    │
  │          │                 │
  └──────────┴─────────────────┘

Minimum: 30% Chat | 70% Artifacts
Maximum: 70% Chat | 30% Artifacts
```

### Grid View Layout

```css
display: grid;
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
gap: var(--space-4); /* 16px */
```

**Responsive:**
- 1920px+ : 4 columns
- 1440px  : 3 columns
- 1024px  : 2 columns
- 768px   : 2 columns
- 640px   : 1 column

### Filmstrip View Layout

```
┌────┬──────────────────────┐
│ 1  │                      │
├────┤   Selected Slide     │
│ 2  │   (Large Preview)    │
├────┤                      │
│ 3  │                      │
├────┼──────────────────────┤
│ 4  │  Title Input         │
├────┼──────────────────────┤
│... │  [Edit] [Dup] [Del]  │
└────┴──────────────────────┘
 20%         80%
```

### Presenter View Layout

```
┌─────────────────────────────────┐
│                                 │
│     Current Slide (Large)       │
│                                 │
├─────────────────────────────────┤
│ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ │
│ │1 │ │2 │ │3 │ │4 │ │5 │ │6 │ │
│ └──┘ └──┘ └─•┘ └──┘ └──┘ └──┘ │
└─────────────────────────────────┘
    Horizontal Filmstrip (120px)
```

## 🚀 Future Enhancements

### Phase 1: Core Functionality
- Conversational editing with AI
- PDF export
- Slide reordering (drag-drop)

### Phase 2: Advanced Features
- Real-time collaboration
- Comments and annotations
- Version history with restore
- Slide templates library

### Phase 3: Enterprise Features
- Team workspaces
- Brand guidelines enforcement
- Analytics and insights
- API for integrations

## 📝 Code Quality

### Design Patterns Used
- **Component Composition**: SlideCard, GridView, FilmstripView
- **State Lifting**: Slides managed in ChatWithArtifacts
- **Event Delegation**: Click handlers passed as props
- **Conditional Rendering**: View modes, generating states

### Accessibility
- **Keyboard Navigation**: Tab through slides, Enter to select
- **ARIA Labels**: Descriptive labels for screen readers
- **Focus States**: Clear outlines on interactive elements
- **Color Contrast**: WCAG AA compliant (4.5:1 minimum)

### Performance
- **Lazy Loading**: Images load on scroll
- **Virtualization**: (Future) Only render visible slides
- **Memoization**: Prevent unnecessary re-renders
- **Optimistic Updates**: UI updates before API confirms

## 📚 Related Documentation

- `claude.md` - Design system and chat components
- `styles/design-tokens.css` - Color palette and spacing
- `components/ThinkingSection.tsx` - AI reasoning display
- `components/SlideGenerationLoader.tsx` - Loading animation

---

**Last Updated:** 2025-11-15
**Status:** In Development
**Branch:** `feature/artifacts-panel`
