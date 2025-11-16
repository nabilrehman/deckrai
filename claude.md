# Deckr.ai Development & Deployment Guide

## 🎯 Core Development Principles

### Git Workflow & Commit Strategy

**CRITICAL: Commit after EVERY logical unit of work.**

#### When to Commit (Commit Checklist)
Before making a commit, verify ALL of these conditions:
- ✅ **Code compiles successfully** - No TypeScript/build errors
- ✅ **Tests pass** - All existing functionality still works
- ✅ **Feature is complete** - Change makes sense on its own
- ✅ **Can describe in one sentence** - Clear, focused change
- ✅ **Would revert independently** - This change can stand alone
- ✅ **Leaves code in working state** - App runs without errors

#### Commit Granularity Rules

**✅ GOOD - Atomic Commits (One Logical Unit):**
```bash
# Each commit is focused and complete
git add components/CreditBadge.tsx
git commit -m "feat: Add credit balance display component with real-time updates"

git add services/creditService.ts
git commit -m "feat: Implement credit transaction service with atomic operations"

git add components/ChatLandingView.tsx
git commit -m "feat: Integrate credit checks into chat interface"
```

**❌ BAD - Micro-commits (Too Small):**
```bash
# Don't do this - too granular
git commit -m "Add import statement"
git commit -m "Add function"
git commit -m "Fix typo"
```

**❌ BAD - Mega-commits (Too Large):**
```bash
# Don't do this - too many unrelated changes
git commit -m "Add credit system, fix bugs, update docs, refactor CSS"
# (47 files changed, 12,453 insertions) ← TOO BIG!
```

#### Conventional Commit Format (REQUIRED)
```bash
<type>: <short description>

[optional body with details]
[optional footer with references]
```

**Commit Types:**
- `feat:` - New feature (user-facing functionality)
- `fix:` - Bug fix (corrects broken behavior)
- `docs:` - Documentation only (README, comments, guides)
- `style:` - Code formatting, whitespace (no logic change)
- `refactor:` - Code restructuring (same behavior, better structure)
- `test:` - Adding/updating tests
- `chore:` - Build/tooling changes, dependencies
- `perf:` - Performance improvements

**Examples:**
```bash
feat: Add user authentication with Firebase
fix: Resolve credit check type mismatch in ChatLandingView
docs: Document credit system architecture and incident report
refactor: Extract slide generation logic into separate service
perf: Optimize image loading with lazy loading
```

#### Commit Workflow (Step-by-Step)

**After making changes:**
```bash
# 1. Check what changed
git status

# 2. Review your changes
git diff

# 3. Stage related files (only files for THIS logical unit)
git add path/to/file1.tsx path/to/file2.ts

# 4. Commit with descriptive message
git commit -m "feat: Add credit purchase modal with Stripe integration

- Implement modal UI with plan selection
- Add Stripe payment flow
- Handle success/error states
- Update credit balance on successful purchase"

# 5. Verify commit
git log -1 --stat
```

#### When to Push to GitHub

**Push after:**
- ✅ Each complete feature (1-3 related commits)
- ✅ Each bug fix (verified working)
- ✅ End of work session (to backup progress)
- ✅ Before switching branches
- ✅ Before major refactoring

**Command:**
```bash
git push origin <branch-name>
```

---

## 🚀 Deployment Strategy

### ⚠️ IMPORTANT: Ask Before Deploying

**NEVER deploy to Cloud Run automatically.**

After completing a **major feature or fix**, Claude should:

1. **✅ Commit all changes** (following rules above)
2. **✅ Push to GitHub** (`git push origin main`)
3. **🤔 ASK THE USER:**

> "I've completed [feature name] and pushed to GitHub. Would you like me to deploy this to Cloud Run now? This will update the production site at deckrai.com."

**Only deploy if user responds with explicit approval:**
- "yes, deploy"
- "push to production"
- "deploy to cloud run"
- "update the site"

### What Qualifies as "Major Change" (Ask to Deploy)

**Major Changes (Ask to Deploy):**
- ✅ New user-facing features (chat interface, artifacts panel, credit system)
- ✅ Bug fixes affecting production users (API key errors, broken workflows)
- ✅ Performance improvements (loading speed, API optimization)
- ✅ UI/UX updates (design changes, new components)
- ✅ Security fixes (authentication, data validation)

**Minor Changes (Don't Ask):**
- ⏸️ Documentation updates (README, comments)
- ⏸️ Internal refactoring (no behavior change)
- ⏸️ Dev-only changes (test files, build config)
- ⏸️ Typo fixes in code comments

### Deployment Workflow

**When user approves deployment:**

```bash
# 1. Set correct GCP account and project
gcloud config set account anam.nabil1@gmail.com
gcloud config set project deckr-477706

# 2. Deploy to Cloud Run
gcloud run deploy deckr-app --source . --region us-central1 --allow-unauthenticated

# 3. Report deployment status to user
# ✅ Service URL: https://deckr-app-948199894623.us-central1.run.app
# ✅ Custom Domain: https://deckrai.com
# ✅ Revision: deckr-app-00XXX-xxx
```

**After deployment, inform user:**
> "✅ Deployed successfully!
> - Revision: `deckr-app-00047-j89`
> - Production URL: https://deckrai.com
> - Changes are live (may need hard refresh: Cmd+Shift+R)"

---

## 🛡️ Safety Rules (NEVER Break These)

### 1. Local Testing Only
- All development and testing should be done locally
- Use `npm run dev` for local testing
- Deploy ONLY when user explicitly approves

### 2. Additive Changes Only
**CRITICAL:** New features must NOT break existing functionality
- Add new code paths without modifying existing ones
- Use feature flags/conditional rendering for new UI
- Test ALL existing workflows after changes
- If something breaks, revert immediately

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

## 🗄️ Data Storage Architecture

### Firebase Storage vs Firestore
Deckr.ai uses a hybrid storage approach optimized for different data types:

#### **Firebase Storage** (for large binary data)
- **Slide images**: All generated slides stored as images
- **Reference templates**: User-uploaded reference slides/PDFs
- **Location**: `gs://deckr-477706.appspot.com/users/{userId}/`
- **No size limits**: Can store large images and PDFs
- **Cost**: $0.026 per GB/month

#### **Firestore** (for metadata only)
- **User profiles**: Plan, usage, preferences
- **Deck metadata**: Title, slide count, created date
- **Style library metadata**: References to Storage URLs only
- **Limits**: 11MB per batch write, 1MB per document
- **Cost**: $0.18 per 100K operations

### Style Library Storage Pattern

**Current Implementation (Storage + Firestore):**
```typescript
// 1. User uploads PDF → Extracted to base64 images in-memory
// 2. Upload images to Firebase Storage (no size limit)
// 3. Store metadata in Firestore with Storage URLs

interface StyleLibraryItem {
  id: string;
  name: string;
  src: string;  // Storage URL: https://firebasestorage.googleapis.com/...
  createdAt: number;
}

// Implementation (services/firestoreService.ts:452)
export const batchAddToStyleLibrary = async (userId: string, items: StyleLibraryItem[]) => {
  // Step 1: Upload all images to Storage in parallel
  const uploadPromises = items.map(async (item) => {
    const blob = base64ToBlob(item.src);
    const storagePath = `users/${userId}/styleLibrary/${item.id}.png`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);

    return { id: item.id, name: item.name, src: downloadURL, createdAt: now };
  });

  const uploadedItems = await Promise.all(uploadPromises);

  // Step 2: Save metadata to Firestore (tiny URLs, no size issues)
  const batch = writeBatch(db);
  uploadedItems.forEach(item => {
    const itemRef = doc(db, 'users', userId, 'styleLibrary', item.id);
    batch.set(itemRef, item);
  });

  await batch.commit();
};
```

**Why Storage + Firestore (not just Firestore)?**
1. ✅ **No size limits**: Storage handles any image size (no 11MB limit)
2. ✅ **Efficient queries**: Firestore metadata enables fast listing/searching
3. ✅ **Scalable**: Works for 5 slides or 500 slides
4. ✅ **Best practice**: Separate concerns (binary in Storage, metadata in Firestore)
5. ✅ **Cost-effective**: Storage is cheaper than Firestore for large files

**Storage Structure:**
```
gs://deckr-477706.appspot.com/
  users/
    {userId}/
      styleLibrary/
        {itemId1}.png  ← Actual image file
        {itemId2}.png
        ...
```

**Firestore Structure:**
```
/users/{userId}/styleLibrary/{itemId}
  {
    id: "abc123",
    name: "google-cloud-page-1.png",
    src: "https://firebasestorage.googleapis.com/...",
    createdAt: 1699999999999
  }
```

**Retrieval:**
```typescript
// Fast query via Firestore (no need to list Storage)
const getUserStyleLibrary = async (userId: string) => {
  const libraryRef = collection(db, 'users', userId, 'styleLibrary');
  const q = query(libraryRef, orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => doc.data() as StyleLibraryItem);
  // Returns items with Storage URLs in 'src' field
};
```

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
- **Enterprise Reference Matching System** (Nov 2025)
  - AI-powered reference matching: Upload company slide deck, AI matches each slide to best reference
  - Firebase Storage integration: Batch upload 37-page PDFs with parallel processing
  - Intelligent matching engine: Gemini 2.5 Pro analyzes content type, visual hierarchy, brand context
  - Deep reference analysis: Extracts design blueprints (background, layout, typography, spacing)
  - Generation strategies: `full-recreate` vs `input-modify` based on complexity
  - Mode selector modal: "Use Company Templates" vs "Let Deckr Go Crazy"
  - Browser logging system: Real-time monitoring with localStorage persistence + downloadable logs
  - Production validated: 8/8 slides matched with 95-98% quality scores
  - See: ARCHITECTURE.md, ENTERPRISE-REFERENCE-MATCHING.md, LOGGING.md
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
- Revision: `deckr-app-00040-4sp`
- Deployed: Successfully (Nov 13, 2025)
- Branch: `feature/enterprise-reference-matching`
- Changes: Browser Logging System + Enterprise Reference Matching
  - **Browser Logger**: Real-time logs in DevTools console, localStorage persistence, downloadable .log files
  - **Reference Matching**: AI matches slides to uploaded references with 95-98% accuracy
  - **Name Cleaning Fix**: Strips `.png` and category suffixes from Gemini responses
  - **Async State Fix**: Fixed modal button passing mode directly to generation handler
  - **Production Tested**: 37-page PDF upload, 8/8 slides matched successfully
  - **Logging API**: `window.deckrLogs.printAll()`, `download()`, `clear()`, `getAll()`

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

---

## 🎨 Agentic Chat System Design

Deckr.ai uses a conversational, agentic UX inspired by Claude.ai, Google Gemini, and modern AI interfaces. This section documents the complete chat system architecture, design tokens, and implementation patterns.

### Design Philosophy

**Core Principles:**
1. **Conversational First** - Every interaction feels like chatting with a professional designer
2. **Progressive Disclosure** - Reveal complexity gradually, don't overwhelm
3. **Real-time Feedback** - Show what's happening with context-aware loaders
4. **Contextual Clarity** - Use appropriate UI for each task (thinking vs. generating)
5. **Professional Polish** - Designer-grade aesthetics with subtle micro-interactions

### Component Architecture

**Location:** `components/` directory

```
ChatLandingView.tsx      → Hero landing page with Gemini-style input
ChatInterface.tsx         → Main chat container with message stream
ThinkingSection.tsx       → Collapsible AI reasoning ("Thought for 7s")
ActionSummary.tsx         → File/slide change indicators with diffs
BrandedLoader.tsx         → Sparkle + arc for general AI tasks
SlideGenerationLoader.tsx → Stacked slides for slide generation
```

### ChatLandingView - Hero Input

**Purpose:** First-touch landing page with conversational input

**Key Features:**
- Auto-expanding textarea (grows to 240px max, then scrolls)
- Magic Patterns gradient background (4 orbs with 60-80px blur)
- Circular submit button (40px) with +2% brightness hover
- Upward-opening upload menu (prevents covering input)
- Model selector (right-aligned with submit button)
- Suggested prompts below input

**Design Decisions:**
- **Input expansion:** Uses `scrollHeight` for smooth auto-resize
- **Scrollbar timing:** Appears at ~6-7 lines (240px) for optimal UX
- **Submit button:** Circular (not rounded square) for action-oriented feel
- **Hover brightness:** Exactly +2% (user-validated through 4 iterations)
- **Menu direction:** Opens upward to avoid covering text (Gemini pattern)

**Critical CSS:**
```css
/* Input Container */
background: #FFFFFF;
border-radius: 32px;
border: 1px solid rgba(0, 0, 0, 0.06);
padding: 20px 24px;
minHeight: 96px;
/* NO maxHeight or overflow on container - allows menu to escape */

/* Submit Button */
width: 40px;
height: 40px;
border-radius: 50%; /* Circular */
background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
box-shadow: 0 2px 8px rgba(99, 102, 241, 0.28);

/* Hover: +2% brightness */
background: linear-gradient(135deg, #686BF2 0%, #5349E6 100%);
transform: scale(1.08);
```

**Magic Patterns Gradient:**
```css
/* 4 orbs with blur filters for depth */
Orb 1 (top-left):    20s animation, indigo, blur(60px), opacity: 0.8
Orb 2 (bottom-right): 25s animation, purple, blur(60px), opacity: 0.7
Orb 3 (center-right): 30s animation, violet, blur(70px), opacity: 0.9
Orb 4 (center-left):  35s animation, dark indigo, blur(80px), opacity: 0.6
```

**Upload Menu Pattern:**
```tsx
/* Opens UPWARD from button */
position: 'absolute';
bottom: '48px'; /* Above button, not below */
animation: 'slideUp 150ms ease-out';

/* Container must NOT have overflow:auto or menu gets clipped */
```

### ThinkingSection - AI Reasoning Display

**Purpose:** Show AI's thought process with real-time progress

**Visual Pattern:**
```
🤖 Thought for 7s ▾                    ← Collapsed by default
  ✓ Analyzing presentation goals       ← Completed (green check)
  ✓ Planning slide structure           ← Completed
  ⏳ Generating slide 3/10...           ← Active (loader spinning)
  ○ Adding final polish                ← Pending (gray circle)
```

**Loader Decision Matrix:**

| Task Type | Loader Used | Why |
|-----------|------------|-----|
| Analyzing input | BrandedLoader | General AI thinking |
| Planning structure | BrandedLoader | Not slide-specific |
| Generating slide | SlideGenerationLoader | Contextual feedback |
| Processing files | BrandedLoader | Generic task |

**Implementation:**
```tsx
<ThinkingSection
  steps={[
    { id: '1', title: 'Analyzing goals', status: 'completed', type: 'thinking' },
    { id: '2', title: 'Generating slide 3/10', status: 'active', type: 'generating' }
  ]}
  duration="7s"
  defaultExpanded={false}
/>
```

**Type System:**
```typescript
interface ThinkingStep {
  id: string;
  title: string;
  content?: string; // Optional detailed explanation
  status: 'pending' | 'active' | 'completed';
  type?: 'thinking' | 'generating' | 'processing'; // Determines loader
  timestamp?: number;
}
```

### ActionSummary - Change Indicators

**Purpose:** Show what files/slides were created or modified

**Visual Pattern:**
```
✨ Generated Slides
  ✓ Title Slide              +- 142
  ✓ Problem Statement        +- 98
  ✓ Solution Overview        +- 156
```

**Icon Options:**
- `sparkles` - AI-generated content (default)
- `check` - Successful operations
- `edit` - Modifications
- `file` - File operations

**Diff Format:**
- `+- 142` - Both additions and deletions
- `+98` - Only additions
- `-23` - Only deletions

### Loader Animations

**BrandedLoader (Sparkle + Arc):**
- **Use for:** General AI processing, analysis, planning
- **Animation:** Rotating arc (1.2s) + pulsing sparkle (1.2s)
- **Colors:** Indigo/purple gradient (#6366F1 → #8B5CF6)
- **Sizes:** 16px (inline), 20-24px (standard), 32px (large)

**Visual:**
```
  ╱ ✦ ╲    ← Sparkle icon (4-point star)
 │     │   ← Rotating gradient arc
  ╲   ╱
```

**SlideGenerationLoader (Stacked Slides):**
- **Use for:** Slide generation, deck building, batch operations
- **Animation:** 3 slides layering + golden sparkle
- **Colors:** Indigo gradient for slides, gold for sparkle
- **Progress:** Can show "Creating slide 3/10..."

**Visual:**
```
    ✨       ← Golden sparkle (top-right)
  ┌─────┐
  │ ─── │   ← Front slide (bright, animated)
 ┌│─────│┐
 ││     ││  ← Middle slide (medium opacity)
┌││─────││┐
│││     │││ ← Back slide (faint)
└┴┴─────┴┴┘
```

**Sparkle Design Evolution:**
- **Original:** Multi-star (looked immature)
- **Refined:** Single 4-point star with stroke (#6366F1 → #7C3AED → #8B5CF6)
- **Size:** 70% of container (was 65%)
- **Professional:** Clean, elegant, not childish

### Design Tokens

**Location:** `styles/design-tokens.css`

**Color Palette:**
```css
/* Brand Colors */
--color-brand-500: #6366F1;  /* Primary indigo */
--color-brand-600: #4F46E5;  /* Hover state */
--color-purple-600: #9333EA; /* Accent */

/* Loader Gradients */
BrandedLoader:          #6366F1 → #A855F7 (indigo to purple)
SlideGenerationLoader:  #6366F1 → #8B5CF6 (indigo to violet)
Sparkle accent:         #F59E0B → #F97316 (golden)

/* Semantic Colors */
--color-success: #10B981;  /* Green for checkmarks */
--color-info: #3B82F6;     /* Blue for info */
--color-neutral-400: #A1A1AA; /* Gray for pending */
```

**Typography:**
```css
/* Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes (Chat Components) */
--text-xs: 0.75rem;    /* 12px - Captions */
--text-sm: 0.875rem;   /* 14px - Body text */
--text-base: 1rem;     /* 16px - Input text */
--text-lg: 1.125rem;   /* 18px - Headers */

/* Font Weights */
--font-regular: 400;   /* Body text */
--font-medium: 500;    /* Labels */
--font-semibold: 600;  /* Headers */
```

**Spacing (4px base unit):**
```css
--space-2: 0.5rem;   /* 8px - Tight gaps */
--space-3: 0.75rem;  /* 12px - Standard gaps */
--space-4: 1rem;     /* 16px - Section spacing */
--space-6: 1.5rem;   /* 24px - Large sections */
```

**Shadows:**
```css
/* Input boxes */
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1);

/* Cards and menus */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

/* Submit button */
--shadow-brand: 0 10px 30px -5px rgba(99, 102, 241, 0.2);
```

**Border Radius:**
```css
--radius-md: 0.5rem;    /* 8px - Small cards */
--radius-lg: 0.75rem;   /* 12px - Medium cards */
--radius-xl: 1rem;      /* 16px - Large cards */
--radius-2xl: 1.5rem;   /* 24px - Input box */
--radius-full: 9999px;  /* Circular - Submit button */
```

**Transitions:**
```css
/* Standard timing */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Micro-interactions */
Hover effects:  150-200ms
Loaders:        1.2s (arc), 1.5s (slides)
Expand/collapse: 150ms
```

### Animation Principles

**1. Micro-interactions:**
- Button hover: `scale(1.08)` + brightness +2%
- Card hover: `translateY(-0.5px)`
- Menu open: `slideUp` from below (not slideDown)

**2. Loader animations:**
- Arc rotation: `1.2s linear infinite`
- Sparkle pulse: `1.2s ease-in-out infinite`
- Slide stack: `1.5s ease-in-out infinite` (staggered)

**3. State transitions:**
- Collapse/expand: `150ms ease`
- Message appear: `200ms fade-in`
- Scroll: Native `smooth` behavior

**4. User-validated details:**
- Submit button hover: Exactly +2% brightness (tested through 4 iterations)
- Menu gap: 48px above button (not 52px - too far)
- Scrollbar timing: 240px height (~6-7 lines of text)

### UX Patterns from Research

**Sources:** Claude.ai, Google Gemini, Cursor AI, Magic Patterns

**Key Learnings:**

1. **"Thought for Xs" pattern** (from Cursor/Claude)
   - Shows AI thinking time (builds trust)
   - Collapsible by default (progressive disclosure)
   - Real-time step updates (transparency)

2. **Upward-opening menus** (from Gemini)
   - Prevents covering input text
   - Feels more natural when typing
   - Requires `overflow: visible` on container

3. **Context-aware loaders** (from production testing)
   - Different loaders for different tasks
   - Sparkle for thinking, slides for generating
   - Visual clarity > consistency

4. **Action summaries** (from Cursor)
   - File change indicators with diffs
   - Checkmarks for completed items
   - Grouped by action type

### Best Practices

**DO:**
- ✅ Use BrandedLoader for general AI tasks
- ✅ Use SlideGenerationLoader when creating slides
- ✅ Collapse ThinkingSection by default
- ✅ Show real-time progress updates
- ✅ Use +2% brightness for hover (user-validated)
- ✅ Open menus upward to avoid covering input
- ✅ Remove overflow constraints from menu containers

**DON'T:**
- ❌ Use generic spinners (too boring)
- ❌ Show all reasoning expanded (overwhelming)
- ❌ Use static "Loading..." text (no context)
- ❌ Open menus downward over input
- ❌ Guess hover brightness (test with user)
- ❌ Add overflow:auto to containers with menus

### Performance Notes

- **Bundle size:** ~8KB for all chat components
- **Animations:** All CSS-based (no JS loops)
- **Re-renders:** Loaders are self-contained components
- **Scroll:** Native smooth scroll (no custom implementation)
- **Images:** Lazy-loaded in chat messages

### Accessibility

- **Color contrast:** All text meets WCAG AA (4.5:1 minimum)
- **Focus states:** Clear outlines on all interactive elements
- **Keyboard navigation:** Tab through all buttons/inputs
- **Screen readers:** Descriptive labels on loaders
- **Reduced motion:** Respects `prefers-reduced-motion`

### Integration with Existing Systems

**Chat components work alongside:**
- Editor (modal-based editing)
- StyleLibraryPanel (reference uploads)
- PresentationView (full-screen slideshow)
- DeckLibrary (saved decks)

**Data flow:**
```
ChatLandingView → User enters prompt
      ↓
ChatInterface → Calls AI services
      ↓
ThinkingSection → Shows reasoning
      ↓
ActionSummary → Shows results
      ↓
Editor → User refines slides
```

### File Organization

```
components/
  ChatLandingView.tsx       (Hero input)
  ChatInterface.tsx         (Main chat)
  ThinkingSection.tsx       (AI reasoning)
  ActionSummary.tsx         (Change indicators)
  BrandedLoader.tsx         (General loader)
  SlideGenerationLoader.tsx (Slide loader)

styles/
  design-tokens.css         (Design system)

docs/
  CHAT-COMPONENTS-GUIDE.md  (Detailed component docs)
  CHAT-INTEGRATION-PLAN.md  (Service integration plan)
```

### Testing Checklist

**ChatLandingView:**
- [ ] Textarea expands smoothly
- [ ] Scrollbar appears at 240px
- [ ] Submit button shows on input
- [ ] Hover: +2% brightness (exact)
- [ ] Upload menu opens upward
- [ ] Menu doesn't get clipped
- [ ] Gradient animates smoothly

**ThinkingSection:**
- [ ] Collapses/expands smoothly
- [ ] Shows correct loader for step type
- [ ] Checkmarks for completed steps
- [ ] Real-time updates work

**Loaders:**
- [ ] BrandedLoader rotates smoothly
- [ ] SlideGenerationLoader slides animate
- [ ] No janky animations
- [ ] Sparkle looks professional (not childish)

### Future Enhancements

**Planned:**
- Token-by-token streaming responses
- Inline message editing
- Conversation branching
- Voice input support
- Dark mode

**Under Consideration:**
- Message reactions (👍 👎)
- Export conversation as PDF
- Collaborative chat (multi-user)
- Custom theme selector

### Documentation References

- **Component Details:** `CHAT-COMPONENTS-GUIDE.md`
- **Service Integration:** `CHAT-INTEGRATION-PLAN.md`
- **Design Tokens:** `styles/design-tokens.css`
- **Loader Comparison:** `/loader-comparison.html` (demo page)

---
