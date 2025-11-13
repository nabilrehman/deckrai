# Deckr.ai Development & Deployment Guide

## ⚠️ Critical Design Patterns & Anti-Patterns

### 🚫 Don't Use Regex/Patterns for Natural Language Extraction
**Problem:** Regex and pattern matching are brittle and fail on natural language
- ❌ Using regex to extract company names, user intent, or contextual data
- ❌ Regex cannot handle synonyms, context, or language variations
- ❌ Maintenance nightmare - adding more patterns makes code unmaintainable

**Real Example from Designer Mode:**
```typescript
// ❌ BAD: Failed to detect "Atlassian" from "Atlassian case study"
const extractCompanyName = (notes: string): string => {
  const patterns = [
    /\b([A-Z][a-z]+)\s+case study/i,
    /(?:for|about|at)\s+([A-Z][a-z]+)/,
    // ... 10 more brittle patterns that still miss edge cases
  ];
};
```

**Solution:** Use AI/LLM for natural language understanding
- ✅ Let Gemini/Claude extract structured data from unstructured text
- ✅ Use few-shot prompting with examples
- ✅ AI understands context, synonyms, and variations

```typescript
// ✅ GOOD: AI-based extraction (robust, context-aware)
const extractCompanyName = async (notes: string): Promise<string> => {
  const prompt = `Extract the company name from these notes. Return ONLY the company name, nothing else.

Examples:
- "Atlassian case study..." → "Atlassian"
- "How Google improved..." → "Google"
- "Success story at Microsoft" → "Microsoft"

Notes:
${notes}`;

  const response = await ai.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: prompt
  });

  return response.text.trim();
};
```

**When to use each approach:**
- **Regex/Patterns:** Strict, predictable formats only (hex colors: `#[A-F0-9]{6}`, URLs, dates, phone numbers)
- **AI/LLM:** Anything involving natural language, user intent, context, or meaning
- **Hybrid:** Use AI to extract data, then validate format with regex

**Cost-Benefit:**
- Regex: Free but brittle (100+ lines of patterns, still fails)
- AI extraction: ~$0.0001 per call but robust (3 lines of code, works)

**Real-World Complex Example:**
```
User: "I work at Google, presenting to Microsoft executives about cloud migration"

What the LLM extracts:
{
  "myCompany": "Google",            // ← Use Google's brand guidelines (#4285F4)
  "audienceCompany": "Microsoft",   // ← Personalize for Microsoft audience
  "audience": "Microsoft executives"
}

Result:
- Slides use Google's brand colors and typography
- Content tailored for Microsoft executives
- References Microsoft products/challenges
- Professional tone for executive audience
```

**Why regex fails here:**
- ❌ Sees "Google" and "Microsoft" - which one to use for branding?
- ❌ Cannot understand "I work at" (brand) vs "presenting to" (audience)
- ❌ Cannot make contextual decisions about brand vs personalization
- ❌ Would need thousands of patterns for every possible phrasing

**Why LLM succeeds:**
- ✅ Understands context: "work at" = my company, "presenting to" = audience
- ✅ Handles variations: "pitching to", "from X to Y", "X employee presenting"
- ✅ Makes intelligent decisions about brand guidelines vs. content personalization
- ✅ Single prompt handles infinite variations

---

## Development Guidelines

### 🔐 Preserving Existing Functionality
**CRITICAL**: When adding new features or modifying code, existing functionality MUST remain unchanged unless explicitly approved by the user.

**Rules**:
1. **New features must be additive** - Add new code paths without breaking existing ones
2. **Use feature flags/conditional rendering** - New UI should only appear when explicitly enabled
3. **Backwards compatibility first** - Ensure all existing workflows continue to work
4. **Ask before breaking changes** - Always request permission before modifying behavior that users depend on
5. **Test existing features** - Verify that your changes don't affect current functionality

**Good Examples**:
```typescript
// ✅ GOOD: New feature is additive, existing behavior unchanged
if (moveMode.active) {
  // New move mode logic
  return;
}
// Existing click behavior continues as before
handleNormalClick();

// ✅ GOOD: New optional props with defaults
<Component
  onMove={handleMove}  // New optional prop
  // Existing required props work as before
/>
```

**Bad Examples**:
```typescript
// ❌ BAD: Changes existing behavior without permission
// Before: always opens chat
// After: sometimes opens chat, sometimes does something else
handleClick() {
  if (someNewCondition) {
    doNewThing(); // User didn't ask for this!
  } else {
    openChat(); // Original behavior
  }
}

// ❌ BAD: Removes or changes existing UI without permission
// Before: <Button>Save</Button>
// After: <Button>Save to Cloud</Button> // Wording changed!
```

**Before implementing any feature**:
- Identify all code paths that might be affected
- Ensure new code branches OFF existing paths, not through them
- Default states should maintain current behavior
- Document any intentional behavior changes and get approval

## Repository
- GitHub: https://github.com/nabilrehman/deckrai
- Production Branch: `main`
- Current Working Branch: `feature/updates`

## Branching Workflow
```bash
# Check current branch
git branch --show-current

# Switch to main
git checkout main

# Create new feature branch
git checkout -b feature/your-feature-name

# Push feature branch to GitHub
git push -u origin feature/your-feature-name

# Merge feature to main (when ready)
git checkout main
git merge feature/your-feature-name
git push origin main
```

## GCP Project Details
- Project ID: `deckr-477706`
- Region: `us-central1`
- Service Name: `deckr-app`

## Deployment Commands

**IMPORTANT: Always set the project and account first!**

### Deploy to Cloud Run
```bash
# 1. Set the correct account
gcloud config set account anam.nabil1@gmail.com

# 2. Set the correct project
gcloud config set project deckr-477706

# 3. Deploy
gcloud run deploy deckr-app --source . --region us-central1 --allow-unauthenticated
```

### Build Locally (for testing)
```bash
npm run build
```

## Recent Changes
- **Smart AI Generation with Planning Agent pattern**
  - GenerationModeSelector: Toggle between Smart AI and Classic modes
  - SmartDeckGenerator: AI-powered generation with context awareness
  - Planning Agent workflow: AI analyzes → proposes plan → user approves → generates
  - Incremental generation: Start with few slides, build more intelligently
  - Audience-aware generation (8 audience types)
  - Style-aware generation (4 presentation styles)
  - FloatingActionBubble for post-generation actions
- Removed fake notifications from Header component
- Implemented sign-out redirect to landing page
- Firebase authentication with Google and Facebook
- Usage tracking for slides and decks
- Deck library with Firebase Storage support

## Service URL
https://deckr-app-948199894623.us-central1.run.app

## Latest Revision
- Revision: `deckr-app-00038-xp2`
- Deployed: Successfully
- Changes: UI Polish - Modal Design + Icon Improvements
  - **Dark Modal Theme**: Fixed background clash with dark slate gradient modal background
  - **High Contrast Text**: White title, light gray subtitle, excellent readability on any background
  - **Better Icon Contrast**: All text and icons now clearly visible
  - **Save Deck Icon**: Changed from download arrow to cloud upload icon (more distinctive from Download PDF)
  - **Professional Look**: Dark elegant modal with purple accents matches brand
  - **Confetti Celebration**: Full-screen confetti animation when export succeeds

**Configuration Required**:
- OAuth 2.0 Client ID needs to be created in GCP Console
- Enable Google Slides API and Google Drive API
- Add redirect URIs for OAuth callback

## Previous Revisions
- `deckr-app-00035-5j6` - Fixed image privacy (no public sharing) + proper image sizing (was invisible)
- `deckr-app-00034-77v` - Fixed Google Slides export with proper EMU sizing + individual slide processing
- `deckr-app-00033-p5h` - Improved OAuth callback with postMessage communication
- `deckr-app-00032-qpv` - PDF download canvas laundering fix
- `deckr-app-00031-xxx` - PDF download fixes
- `deckr-app-00030-jpr` - Initial Google Slides export implementation
- `deckr-app-00029-wft` - Export to Google Slides OAuth setup
- `deckr-app-00028-5cv` - Redesign Without Style Library + Iterative Editing + Multiple Image Upload
- `deckr-app-00027-jrr` - Inpainting fix with canvas validation
- `deckr-app-00026-r4m` - Redesign without style library requirement
- `deckr-app-00025-8mp` - Image Upload for New Slides + Enhanced Preview Logging
- `deckr-app-00024-vq8` - Added enhanced logging for preview generation debugging
- `deckr-app-00023-xpb` - PDF Support + AI Style Scout Integration (all PDF pages imported, intelligent reference selection)
- `deckr-app-00022-s5k` - Deployed Style Scout integration
- `deckr-app-00021-nnb` - Content-Aware Designer Styles + Reference Slide Cycling Fix
- `deckr-app-00020-gkp` - Enhanced Theme Preview with Content-Aware Designer Styles
- `deckr-app-00019-lg7` - Added Visual Theme Preview Selection - Users now see 3 sample slides in different themes BEFORE full generation
- `deckr-app-00018-gm6` - Added Smart AI Generation with Planning Agent pattern - GenerationModeSelector, SmartDeckGenerator, audience-aware and style-aware generation with incremental build
- `deckr-app-00017-wfk` - Created .gcloudignore file to ensure .env and .env.production files are uploaded to Cloud Build (fixes API key missing error)
- `deckr-app-00015-7qr` - Added .env.production file (first attempt to fix API key)
- `deckr-app-00013-tbs` - Reduced free plan deck limit from 5 to 3 decks per month
- `deckr-app-00012-5nb` - Fixed tooltip disappearing issue by adding padding bridge
- `deckr-app-00011-w75` - Fixed pricing tooltip hover issue (first attempt)
- `deckr-app-00010-58d` - Removed fake notification bell and dropdown from Header component
- `deckr-app-00009-ms2` - Implemented sign-out redirect to landing page

## Plan Limits
- Free: 10 slides/month, 3 decks/month
- Pro: 100 slides/month, 50 decks/month
- Enterprise: 500 slides/month, 200 decks/month

## Environment Configuration
- Gemini API Key is stored in both `.env` and `.env.production` files
- Firebase API Key is hardcoded in `config/firebase.ts`
- Vite picks up environment variables during Docker build
- **CRITICAL FILES - DO NOT DELETE:**
  - `.env` - Used by Vite in all modes
  - `.env.production` - Used specifically for production builds
  - `.gcloudignore` - Ensures env files are uploaded to Cloud Build
- The `.env.local` file is for local development only (gitignored, not deployed)

### ⚠️ .env File Priority (IMPORTANT!)
Vite loads environment files in this order (later files override earlier ones):
1. `.env` - Base config for all environments
2. `.env.local` - **HIGHEST PRIORITY** - Local overrides (gitignored)
3. `.env.[mode]` - Mode-specific (e.g., `.env.production`)
4. `.env.[mode].local` - Mode-specific local overrides

**Common Gotcha**: If you update the API key in `.env` but still get "API key expired" errors:
- Check if `.env.local` exists - it will override `.env`!
- Always update **BOTH** `.env` and `.env.local` with the new API key
- Or delete `.env.local` if you don't need local overrides

```bash
# Quick fix for expired API key errors:
# Update ALL env files with the new key
grep -l "VITE_GEMINI_API_KEY" .env* 2>/dev/null
# Then manually update each file found
```

## Why Two API Keys?
- **Firebase API Key** (`AIzaSyAZ_o...`): Used for Firebase Auth, Firestore, and Storage
- **Gemini API Key** (`AIzaSyDP6j...`): Used for AI slide generation with Google Gemini

## 🔒 API Key Security Best Practices

### Firebase API Key (Public - OK to be in git)
- **Location**: `config/firebase.ts` (hardcoded, public in GitHub)
- **Status**: ✅ Safe to be public
- **Why**: Firebase web API keys are designed to be included in client-side code
- **Security**: Comes from Firebase Security Rules, NOT from hiding the key
- **Protection**: Add HTTP referrer restrictions in GCP Console to limit domains
- **Rules**:
  - Users can only read/write their own data (firestore.rules)
  - Users can only access their own files (storage.rules)

### Gemini API Key (Private - NEVER commit)
- **Location**: `.env` and `.env.production` (local only, gitignored)
- **Status**: ✅ Protected (not in git)
- **Why**: Can incur charges if exposed to public use
- **Security**: Keep in .env files, never commit to git
- **Deployment**: Cloud Run uses local .env files during build
- **Regeneration**: If exposed, regenerate immediately at https://aistudio.google.com/app/apikey

### .env File Protection
- ✅ `.env` files are in `.gitignore`
- ✅ Only `.env.example` is committed (template without real keys)
- ✅ Cloud Run deployment uses local .env files (not from git)
- ⚠️ Never run `git add .env` - gitignore will protect you

### Security Checklist Before Each Commit
```bash
# Always check before pushing:
git status | grep ".env"  # Should only show .env.example (if anything)
git ls-files | grep ".env"  # Should only show .env.example

# If you accidentally staged .env:
git rm --cached .env .env.production
```

### Adding API Key Restrictions (Recommended)

**Firebase Web API Key Restrictions:**
1. Go to: https://console.cloud.google.com/apis/credentials?project=deckr-477706
2. Find the Firebase web key (starts with AIzaSyAZ_o...)
3. Add HTTP referrers:
   - `https://deckrai.com/*`
   - `https://*.deckrai.com/*`
   - `https://deckr-app-948199894623.us-central1.run.app/*`
   - `http://localhost:5173/*`
   - `http://localhost:4173/*`
4. Restrict to APIs:
   - Identity Toolkit API
   - Firebase Authentication API
   - Cloud Firestore API
   - Firebase Storage API

**Gemini API Key Restrictions:**
1. Go to: https://aistudio.google.com/app/apikey
2. Currently no referrer restrictions available for Gemini API
3. Keep the key private in .env files (only protection)
4. Monitor usage regularly: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/metrics?project=deckr-477706

---

## 🎨 Gemini Slide Designer System

A production-ready system for generating designer-level slide deck specifications using Gemini 2.5 Pro.

### Overview

**What it does:** Generates complete, designer-ready slide specifications with:
- Automatic brand research (finds exact colors, typography)
- Visual hierarchy (PRIMARY/SECONDARY/TERTIARY with percentages)
- Exact measurements (all in px/pt, no generic descriptions)
- Complete design systems
- WCAG accessibility compliance

**Architectures:**
- ✅ **V2.0 Parallel** (RECOMMENDED): 100% completion, 3-minute generation
- ⚠️ **V1.0 Single**: Fast but incomplete (only 23% completion - NOT RECOMMENDED)

### Quick Start

**Location:** `prompts/` directory

**Main File to Use:**
```bash
prompts/parallel-orchestrator.py
```

**Requirements:**
```bash
pip install google-genai
export VITE_GEMINI_API_KEY="your-key-here"
```

**Run:**
```bash
cd prompts
python3 parallel-orchestrator.py
```

**Customize:**
Edit these variables in `parallel-orchestrator.py` (lines 455-471):
```python
company = "Your Company Name"
content = "What the presentation is about"
audience = "Who will see it"
goal = "What you want to achieve"
slide_count = 10
```

### Results

**Output Files:**
- `test-results/parallel/[company]_complete_[timestamp].md` - Full specification
- `test-results/parallel/[company]_master_[timestamp].md` - Master planning output
- `test-results/parallel/[company]_metadata_[timestamp].json` - Performance metrics

**Quality:**
- V2.0 Parallel: 50/50 score (100% quality)
- 100% completion guaranteed (no abbreviations)
- 181s average generation time
- 9.01x speedup vs sequential

### Universality

**Works Best For:** (85-100% success rate)
- ✅ Public companies with brand guidelines (Apple, Google, Atlassian, Nike)
- ✅ B2B tech presentations
- ✅ Case studies and success stories
- ✅ Product launches
- ✅ Investor pitch decks
- ✅ Sales presentations

**Works With Adjustments:** (70-85% success rate)
- ⚠️ Startups with limited brand info
- ⚠️ Highly technical content
- ⚠️ Training materials

**Not Ideal For:** (50-70% success rate)
- ❌ Fictional companies (no brand research possible)
- ❌ Real-time data dashboards
- ❌ Fully custom artistic presentations
- ❌ Interactive/animated presentations

**See:** `prompts/UNIVERSALITY-ANALYSIS.md` for detailed analysis

### Key Files

**Core System:**
- `parallel-orchestrator.py` - Main orchestrator (V2.0, RECOMMENDED)
- `parallel-master-prompt.md` - Phase 1: Planning agent
- `parallel-slide-agent-prompt.md` - Phase 2: Slide agent

**V1.0 (Not Recommended):**
- `gemini-slide-designer-prompt.md` - Single agent prompt (abbreviates after 3 slides)
- `test-runner.py` - V1.0 test runner

**Documentation:**
- `USAGE-GUIDE.md` - Complete how-to guide (15+ pages)
- `FINAL-SUMMARY.md` - Project summary and results
- `3-WAY-QUALITY-COMPARISON.md` - Original vs V1.0 vs V2.0 comparison
- `V1-VS-V2-COMPARISON.md` - V1.0 vs V2.0 detailed comparison
- `PARALLEL-ARCHITECTURE.md` - V2.0 architecture explanation
- `UNIVERSALITY-ANALYSIS.md` - Will it work for any company?
- `ADK-CONVERSION-PLAN.md` - Future: Convert to Google ADK agents

**Testing:**
- `evaluation-rubric.md` - 5-dimension scoring system (50 points)
- `test-cases/` - Sample test cases (Atlassian, Nike, CloudSync)
- `test-results/` - Generated outputs and evaluations

### Performance Metrics

**V2.0 Parallel (Production):**
- Time: 181.26s (3 minutes)
- Completion: 100% (10/10 slides)
- Quality: 50/50 (perfect score)
- Output: 102,848 characters, 2,017 lines
- Speedup: 9.01x vs sequential
- Cost: ~$0.25 per deck

**V1.0 Single (Not Production Ready):**
- Time: 86.51s
- Completion: 23% (3/13 slides)
- Quality: 42/50 (good where complete)
- Output: 21,265 characters, 508 lines
- Issue: Abbreviates after slide 3

### Example Output Quality

**Brand Research:**
```markdown
- Primary (Atlassian Blue): #0052CC | RGB: 0, 82, 204
  Usage: Headlines, CTAs, key data points
- Typography: Charlie Sans (proprietary), Inter fallback
- Sources: design.atlassian.com, atlassian.com/brand
```

**Visual Hierarchy:**
```markdown
1. PRIMARY (70%): Headline (72pt, centered, Y: 520px)
2. SECONDARY (20%): Subhead (30pt, 40px below headline)
3. TERTIARY (10%): Logo group (48px height, Y: 960px)

Contrast Ratio: 4.75:1 (meets WCAG AA)
Whitespace: 70%
```

### ROI Analysis

**Time Saved:**
- Manual process: ~5.5 hours per deck
- V2.0 Parallel: ~20 minutes (3min generation + 15min review)
- **Savings: 5+ hours (93% reduction)**

**Cost:**
- Human designer: $412.50 (5.5 hours × $75/hour)
- V2.0 Parallel: $0.25 per deck
- **Savings: $412.25 per deck**

### Next Steps

**Future Enhancements (V3.0):**
- Convert to Google ADK agents (see `ADK-CONVERSION-PLAN.md`)
- Add brand creation fallback for fictional companies
- Implement Phase 3 review loop
- Add industry-specific templates
- Multi-language support

**Current Status:**
- ✅ V1.0: Complete but not production-ready (abbreviation problem)
- ✅ V2.0: Complete, tested, and validated (100% completion)
- 📅 V3.0: ADK conversion planned (when needed)

### Usage Recommendations

**For Production:**
✅ Use V2.0 Parallel Architecture (`parallel-orchestrator.py`)

**For Quick Prototypes (1-3 slides):**
⚠️ V1.0 Single Agent can work, but expect only first 3 slides completed

**For Companies:**
- ✅ Well-known brands: Expect 95-100% quality
- ⚠️ Startups: Expect 85-90% quality
- ❌ Fictional: May need manual brand creation first
