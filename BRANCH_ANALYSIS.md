# Git Branch Analysis - deckr.ai Repository

## Branch Structure Overview

Total commits by branch:
- origin/main: 50 commits (baseline)
- origin/feature/unified-designer-ux: 48 commits
- origin/feature/smart-ai-quality-improvements: 37 commits
- origin/claude/credit-pricing-system-01SPDPYHzoaWtFcmYFS8VLwB: +10 commits vs main
- origin/claude/review-unified-designer-ux-01SPDPYHzoaWtFcmYFS8VLwB: +6 commits vs main
- claude/analyze-branches-017L9g9QD5tyuX4Tb4r727dm: Same as main
- origin/feature/unified-editor-chat-design: Same as main

---

## 1. origin/main (Baseline - Current Production)
**Branch Head:** f6759b4
**Total Commits:** 50

### Features (One-line Descriptions):
1. Chat storage and persistence with Firebase Firestore integration
2. Artifacts panel with grid/filmstrip/presenter view modes
3. Resizable split-view interface for chat and slides
4. Chat continuity system that preserves conversation state
5. Gemini-style conversational chat interface
6. Complete agentic chat system with Magic Patterns gradient design
7. File upload and AI personalization in Designer Mode
8. Browser-based logging system for debugging
9. Firebase Storage integration for style library uploads
10. Enterprise reference matching with AI-powered slide matching
11. Dynamic LLM-driven goal and intent extraction
12. Designer Mode with parallel AI agents architecture
13. Smart AI slide generation with Planning Agent pattern
14. Intelligent text detection for precise editing
15. Canva-style AI chat interface with magic text editing
16. Auto-apply single variations without variant selector
17. Box selector for inpainting with delete key support
18. Visual theme preview selection before generation
19. AI Style Scout for intelligent reference selection
20. Full PDF support with all pages in SmartDeckGenerator
21. Parallelized preview generation optimization
22. Image upload for new slides with enhanced logging
23. Iterative editing without style library dependency
24. Export to Google Slides functionality
25. Anchored AI Chat for intuitive slide editing
26. Canva-style floating to right panel transition
27. Clean white/grey design system (Option A UX)

### Key Files:
- /home/user/deckrai/components/ChatLandingView.tsx (2127 lines)
- /home/user/deckrai/components/ArtifactsPanel.tsx (962 lines)
- /home/user/deckrai/components/ChatWithArtifacts.tsx (379 lines)
- /home/user/deckrai/services/firestoreService.ts (extended for chat storage)
- /home/user/deckrai/services/geminiService.ts (updated API calls)

---

## 2. origin/claude/credit-pricing-system-01SPDPYHzoaWtFcmYFS8VLwB
**Branch Point:** 2695d85 (Gemini-style conversational chat)
**Unique Commits:** 10 (7028d62 to f597084)

### Features (One-line Descriptions):
1. Credit-based pricing system backend with Firestore transactions
2. Real-time credit balance tracking with useCredits hook
3. Atomic credit consumption with race condition prevention
4. Credit transaction history and audit logging
5. Frontend UI components (CreditBadge, LowCreditsWarning, OutOfCreditsModal)
6. Credit purchase flow with one-time packs and subscriptions
7. Subscription plans with rollover credit system
8. Playwright E2E testing framework setup
9. MCP server configuration for testing automation
10. Credit system integration into main UI and header
11. Auto-launch chat interface on homepage (bypasses landing page)
12. Indigo/lavender brand theme alignment for credit system
13. Comprehensive documentation (master README, integration guide)

### Key Files Changed:
- /home/user/deckrai/services/creditService.ts (373 lines) - NEW
- /home/user/deckrai/hooks/useCredits.ts (86 lines) - NEW
- /home/user/deckrai/config/pricing.ts (260 lines) - NEW
- /home/user/deckrai/components/CreditBadge.tsx - NEW
- /home/user/deckrai/components/CreditPurchasePage.tsx - NEW
- /home/user/deckrai/components/LowCreditsWarning.tsx - NEW
- /home/user/deckrai/components/OutOfCreditsModal.tsx - NEW
- /home/user/deckrai/playwright.config.ts - NEW
- /home/user/deckrai/tests/e2e/credit-system.spec.ts - NEW

### Pricing Structure Implemented:
- Free: $0/month → 10 credits (10 slides)
- Startup: $35/month → 100 credits (rollover 50)
- Business: $90/month → 300 credits (rollover 150)
- Enterprise: $250/month → 1000 credits (rollover 500)

---

## 3. origin/claude/review-unified-designer-ux-01SPDPYHzoaWtFcmYFS8VLwB
**Branch Point:** 2695d85 (Gemini-style conversational chat)
**Unique Commits:** 6 (33bb7cf to 5dcbbdb)

### Features (One-line Descriptions):
1. Critical UX audit fixes addressing false advertising issues
2. Homepage pricing alignment with credit-based system
3. Removed fake security badges (SOC 2, ISO 27001, GDPR)
4. Replaced with honest trust signals (AES-256, Google Cloud, Gemini AI)
5. Fixed misleading "10 decks per month" to "10 slides/month"
6. Removed broken demo video section from homepage
7. Centralized pricing configuration as single source of truth
8. Comprehensive pricing page component with TypeScript types
9. Updated all components to use $35 Startup pricing
10. Logo design package with 14 professional concepts (9 V1 + 5 V2)
11. Interactive HTML viewers for logo preview
12. AI generation prompts for Midjourney/DALL-E/Stable Diffusion
13. Pricing page navigation wired up in header
14. Simple preview HTML for viewing all V2 logo concepts
15. Comprehensive UX audit documentation
16. Competitor research on agentic UX patterns

### Key Files Changed:
- /home/user/deckrai/index.html (90 lines removed of false advertising)
- /home/user/deckrai/docs/UX_AUDIT_2025.md (571 lines) - NEW
- /home/user/deckrai/docs/COMPETITOR_RESEARCH_AGENTIC_UX.md (561 lines) - NEW
- /home/user/deckrai/config/pricing.ts (173 lines) - NEW
- /home/user/deckrai/src/components/PricingPage.tsx (404 lines) - NEW
- /home/user/deckrai/logo-concepts/ (14 SVG files + 3 HTML viewers) - NEW
- /home/user/deckrai/components/PricingBadge.tsx (updated to $35)
- /home/user/deckrai/components/AnalyticsDashboard.tsx (ROI calc updated)
- /home/user/deckrai/components/EnhancedModal.tsx (upgrade button updated)

### Logo Concepts Created:
- V1: 9 concepts (stacked decks, neural network, lightning, monogram, etc.)
- V2: 5 refined concepts (clean deck, geometric D, app icon, flowing slides, card fan)

---

## 4. origin/feature/unified-designer-ux
**Branch Head:** 2695d85
**Commits:** 48 total (11 commits behind main)

### Features (One-line Descriptions):
1. Gemini-style conversational chat interface
2. Complete agentic chat system with design documentation
3. Agentic chat interface with Magic Patterns gradient
4. File upload and AI personalization (Phase 1)
5. Browser-based logging system for Designer Mode
6. Firebase Storage for style library uploads
7. Firebase Storage vs Firestore architecture documentation
8. Chunked style library batch uploads (avoiding 11MB limit)
9. Reference matching services with @google/genai package
10. Enterprise Reference Matching System with AI-powered matching
11. Dynamic LLM-driven goal and intent extraction
12. Designer Mode with parallel AI agents
13. Smart AI quality improvements with higher thinking budget
14. Conversational text handling before JSON in AI responses
15. Minimal text constraints for Smart AI generation
16. Infinite loop fix in theme preview
17. Canva-style AI chat interface
18. Auto-apply variations (removed variant selector)
19. Simplified text editing (bypassing Design Analyst)
20. Intelligent text detection for precise editing
21. Single variation output (reduced from 3 to save API budget)
22. Box selector for inpainting with delete key support
23. Canva-style floating to right panel transition
24. Option A UX with clean white/grey design

### Key Components Added:
- ChatLandingView.tsx (2075 lines)
- ChatInterface.tsx (482 lines)
- ChatController.tsx (408 lines)
- ModeSelectionCards.tsx (174 lines)
- BrandedLoader.tsx (128 lines)
- SlideGenerationLoader.tsx (200 lines)
- ThinkingSection.tsx (191 lines)
- PlanDisplay.tsx (110 lines)
- ActionSummary.tsx (155 lines)

### Services Added:
- browserLogger.ts (143 lines)
- deepReferenceAnalyzer.ts (343 lines)
- referenceMatchingEngine.ts (380 lines)
- referenceStrategyDecider.ts (361 lines)
- titleSlideGenerator.ts (150 lines)
- fileLogger.ts (83 lines)

---

## 5. origin/feature/smart-ai-quality-improvements
**Branch Head:** e49af00
**Commits:** 37 total (13 commits behind main)

### Features (One-line Descriptions):
1. Designer Mode with parallel AI agents and LLM-based context extraction
2. Parallel slide generation with Gemini 2.5 Pro (master + slide agents)
3. Brand research automation with color/typography extraction
4. Session logging and debug inspector
5. LLM-based context extraction (no regex)
6. Complete parallel agent system (master, slide, review agents)
7. Content quality tests for slide generation
8. Evaluation rubric with 5-dimension scoring (50 points)
9. Test cases from real case studies (Informatica, Microsoft, Salesforce)
10. Enhanced chat panel with move mode and context suggestions
11. Improved slide editor with better edit/delete workflows
12. Generation mode selector (Smart AI vs Designer Mode)
13. Floating action bubble for post-generation actions
14. Conversational text handling before JSON responses
15. Max thinking budget set to 32768 for highest quality
16. Invalid thinkingConfig parameter removal
17. Minimal text constraints for Smart AI generation
18. Infinite loop fix in theme preview
19. Canva-style AI chat interface with magic text editing
20. Auto-apply single variations
21. Simplified text editing (bypassing Design Analyst)
22. Intelligent text detection for precise editing
23. Single variation output (reduced from 3)
24. Box selector for inpainting with delete key support
25. Canva-style floating to right panel transition
26. Option A UX with clean white/grey design
27. Planning Agent pattern for intelligent slide generation
28. Smart AI generation with Planning Agent
29. Visual theme preview selection
30. Content-aware designer styles
31. AI Style Scout for intelligent reference selection
32. Full PDF support with all pages
33. Parallelized preview generation
34. Image upload for new slides
35. Redesign without style library dependency
36. Iterative editing with multiple image upload
37. Export to Google Slides functionality

### Key Files Added:
- components/DesignerModeGenerator.tsx (733 lines)
- services/designerOrchestrator.ts (638 lines)
- services/outlineParser.ts (622 lines)
- services/sessionLogger.ts (191 lines)
- types/designerMode.ts (159 lines)
- prompts/ directory (15+ documentation files)
- tests/content-quality-test.ts (435 lines)

---

## 6. claude/analyze-branches-017L9g9QD5tyuX4Tb4r727dm (Current Branch)
**Status:** Identical to origin/main
**No unique features** - This is the current working branch

---

## 7. origin/feature/unified-editor-chat-design
**Status:** Identical to origin/main
**No unique features** - Fully merged into main

---

## Summary of Active Development Branches

### Branches with Unique Features:

1. **origin/claude/credit-pricing-system-01SPDPYHzoaWtFcmYFS8VLwB** (10 commits ahead)
   - Complete monetization system ready for production

2. **origin/claude/review-unified-designer-ux-01SPDPYHzoaWtFcmYFS8VLwB** (6 commits ahead)
   - Critical UX fixes and branding work

3. **origin/feature/unified-designer-ux** (11 commits behind main)
   - Foundation for chat interface (mostly merged to main)

4. **origin/feature/smart-ai-quality-improvements** (13 commits behind main)
   - Foundation for Designer Mode and AI improvements (mostly merged to main)

### Recommended Merge Strategy:

1. **Merge to main first:** credit-pricing-system (monetization ready)
2. **Merge to main second:** review-unified-designer-ux (UX fixes + branding)
3. **Archive:** unified-designer-ux and smart-ai-quality-improvements (already in main)
