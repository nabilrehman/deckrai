# Deckr.ai Deployment Information

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
