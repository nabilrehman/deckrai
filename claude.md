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
- Removed fake notifications from Header component
- Implemented sign-out redirect to landing page
- Firebase authentication with Google and Facebook
- Usage tracking for slides and decks
- Deck library with Firebase Storage support

## Service URL
https://deckr-app-948199894623.us-central1.run.app

## Latest Revision
- Revision: `deckr-app-00017-wfk`
- Deployed: Successfully
- Changes: Created .gcloudignore file to ensure .env and .env.production files are uploaded to Cloud Build (fixes API key missing error)

## Previous Revisions
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

## Why Two API Keys?
- **Firebase API Key** (`AIzaSyAZ_o...`): Used for Firebase Auth, Firestore, and Storage
- **Gemini API Key** (`AIzaSyDP6j...`): Used for AI slide generation with Google Gemini
