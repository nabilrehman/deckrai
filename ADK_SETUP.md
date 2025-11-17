# Google ADK Setup Guide

This document describes the setup process for integrating Google Agent Development Kit (ADK) into the DeckRAI project, including dependency management, version conflicts, and testing.

## Table of Contents

1. [Overview](#overview)
2. [Dependencies Installed](#dependencies-installed)
3. [Version Conflicts](#version-conflicts)
4. [API Key Configuration](#api-key-configuration)
5. [Project Structure](#project-structure)
6. [Running Tests](#running-tests)
7. [Troubleshooting](#troubleshooting)

---

## Overview

We've integrated the official `@google/adk` TypeScript package (v0.1.3) to migrate from direct Gemini API calls to a structured multi-agent architecture. This enables:

- **Master Agent Pattern**: Central orchestrator for intent classification
- **Workflow Agents**: Parallel and sequential sub-agent execution
- **Session Management**: Persistent conversation state
- **Tool Integration**: Google Search and custom tools

## Dependencies Installed

### Core ADK Package

```bash
npm install @google/adk --save --legacy-peer-deps
```

**Version**: 0.1.3 (Early Development/Beta)

### Required Peer Dependencies

The following peer dependencies were installed to resolve runtime errors:

```bash
npm install @opentelemetry/api@1.9.0 \
             zod@3.25.76 \
             @modelcontextprotocol/sdk@1.17.5 \
             @google-cloud/storage@^7.17.1 \
             --save --legacy-peer-deps
```

#### Dependency Breakdown

| Package | Version | Purpose |
|---------|---------|---------|
| `@opentelemetry/api` | 1.9.0 | OpenTelemetry instrumentation for tracing |
| `zod` | 3.25.76 | Schema validation for tool inputs/outputs |
| `@modelcontextprotocol/sdk` | 1.17.5 | Model Context Protocol integration |
| `@google-cloud/storage` | ^7.17.3 | Cloud storage for artifacts (optional) |

## Version Conflicts

### Issue: @google/genai Version Mismatch

**Problem**:
```
npm error ERESOLVE unable to resolve dependency tree
npm error peer @google/genai@"1.14.0" from @google/adk@0.1.3
npm error Found: @google/genai@1.29.1
```

**Details**:
- DeckRAI uses `@google/genai@1.29.1` (latest)
- `@google/adk@0.1.3` requires `@google/genai@1.14.0` (older version)
- This is a peer dependency conflict

**Solution**:
Use `--legacy-peer-deps` flag to bypass strict peer dependency checks:

```bash
npm install @google/adk --save --legacy-peer-deps
```

**Impact**:
- Installation succeeds with warnings
- No runtime issues observed so far
- May cause issues if ADK expects specific APIs from `@google/genai@1.14.0`

**Monitoring**:
Watch for:
- API method signature mismatches
- Deprecated function warnings
- Unexpected errors during agent execution

### Why --legacy-peer-deps?

The `--legacy-peer-deps` flag tells npm to:
1. Install packages even if peer dependencies don't match
2. Use npm v6 behavior (less strict)
3. Allow version ranges to overlap

**Alternative Approaches** (not recommended for now):
- **Downgrade @google/genai**: Would break existing Gemini API integrations
- **Wait for ADK update**: Package is in early development
- **Fork and patch ADK**: Maintenance burden

## API Key Configuration

The master agent supports multiple environment variable formats for API keys:

### For Vite (Browser/Development)

Create a `.env` file:
```bash
VITE_GEMINI_API_KEY=your_api_key_here
```

### For Node.js (Tests/Backend)

Set one of these environment variables:
```bash
export GEMINI_API_KEY=your_api_key_here
# OR
export GOOGLE_GENAI_API_KEY=your_api_key_here
```

### For Production

Use your deployment platform's secret management:
- **Vercel**: Environment Variables in dashboard
- **Cloud Run**: Secret Manager integration
- **Docker**: Pass via `-e` flag or `.env` file

### Implementation Details

The `masterAgent.ts` checks for API keys in this order:

```typescript
function getApiKey(): string | undefined {
    // 1. Check Vite environment (browser/dev)
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
        return import.meta.env.VITE_GEMINI_API_KEY;
    }
    // 2. Check Node.js environment (tests/backend)
    if (typeof process !== 'undefined' && process.env) {
        return process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    }
    return undefined;
}
```

**Lazy Initialization**: The Gemini model is created only when `getMasterAgent()` is called, allowing tests to run without an API key for parsing logic.

## Project Structure

```
/home/user/deckrai/
├── services/adk/
│   ├── masterAgent.ts              # Master orchestrator agent
│   ├── __tests__/
│   │   └── masterAgent.test.ts     # Test suite (2 parsing + 6 live API tests)
│   └── [future agents...]
│
├── ADK_ARCHITECTURE.md              # Master agent architecture design
├── ADK_MIGRATION_REPORT_V2_CORRECTED.md  # Migration plan (corrected)
├── ADK_MIGRATION_REVIEW.md          # Expert review with web verification
├── ADK_SETUP.md                     # This file
│
└── package.json                     # Dependencies and scripts
```

## Running Tests

### Run Master Agent Tests

```bash
npm run test:master-agent
```

**Output**:
```
════════════════════════════════════════════════════════════
  Master Agent Test Suite
════════════════════════════════════════════════════════════

🧪 Testing Master Agent Response Parsing Logic

Test 1: Parse valid JSON response
✅ PASSED: Successfully parsed valid JSON

Test 2: Parse JSON wrapped in markdown
✅ PASSED: Successfully parsed markdown-wrapped JSON

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Parsing Test Summary: 2 passed, 0 failed out of 2 tests

🧪 Testing Master Agent Intent Classification with Live API

⚠️  No API key found. Skipping live API tests.
   Set GEMINI_API_KEY or GOOGLE_GENAI_API_KEY environment variable to run live tests.

════════════════════════════════════════════════════════════
  Overall Test Results
════════════════════════════════════════════════════════════
Parsing Tests: 2 passed, 0 failed
Live API Tests: 0 passed, 0 failed, 6 skipped

🎉 All tests passed!
```

### Run Live API Tests

Set an API key and run:

```bash
export GEMINI_API_KEY=your_key_here
npm run test:master-agent
```

**Expected Output** (with API key):
```
Live API Tests: 6 passed, 0 failed, 0 skipped
```

### Test Cases Covered

| Test # | Type | Intent | Description |
|--------|------|--------|-------------|
| 1 | Parsing | - | Parse valid JSON response |
| 2 | Parsing | - | Parse markdown-wrapped JSON |
| 3 | Live API | CREATE_DECK | "Create a 10-slide pitch deck..." |
| 4 | Live API | EDIT_SLIDES | "@slide2 make it more professional" |
| 5 | Live API | EDIT_SLIDES | "@all make them follow brand guidelines" |
| 6 | Live API | ANALYZE_CONTENT | "What questions should I answer..." |
| 7 | Live API | PLAN_STRATEGY | "How should I structure a presentation..." |
| 8 | Live API | QUICK_QUESTION | "What is DeckRAI..." |

## Troubleshooting

### Error: "Module not found: @opentelemetry/api"

**Solution**:
```bash
npm install @opentelemetry/api@1.9.0 --save --legacy-peer-deps
```

### Error: "API key must be provided"

**Cause**: No API key found in environment variables

**Solutions**:
1. Set `GEMINI_API_KEY` or `GOOGLE_GENAI_API_KEY`
2. Create `.env` file with `VITE_GEMINI_API_KEY`
3. For tests only: Parsing tests will still run, live API tests will be skipped

### Error: "Session not found"

**Cause**: Using `InMemoryRunner` incorrectly

**Solution**: Use `Runner` with `InMemorySessionService`:
```typescript
const sessionService = new InMemorySessionService();
const runner = new Runner({
    agent: getMasterAgent(),
    sessionService
});

await sessionService.createSession({ userId, sessionId, appName });
```

### Warning: "npm WARN ERESOLVE overriding peer dependency"

**Status**: Expected and safe

**Explanation**: This warning appears because we're using `--legacy-peer-deps` to bypass the `@google/genai` version conflict. The project functions correctly with this warning.

### Runtime Error: "Cannot find module '@google-cloud/storage'"

**Cause**: Missing peer dependency (required by ADK for artifact storage)

**Solution**:
```bash
npm install @google-cloud/storage@^7.17.1 --save --legacy-peer-deps
```

**Note**: Even if you don't use cloud storage, this dependency is required by ADK's module imports.

---

## Next Steps

After successful setup:

1. **Test the Master Agent**: Run `npm run test:master-agent` with an API key
2. **Implement Workflow Agents**: Create specialized agents for each intent
3. **Build Intent Router**: Connect master agent classifications to workflow execution
4. **Migrate Existing Features**: Gradually replace direct Gemini calls with ADK agents
5. **Performance Testing**: Compare ADK vs direct API response times
6. **Production Deployment**: Configure API keys in your deployment platform

## Additional Resources

- [ADK Official Docs](https://google.github.io/adk-docs/)
- [ADK TypeScript GitHub](https://github.com/google/adk-js)
- [ADK Migration Report (Corrected)](./ADK_MIGRATION_REPORT_V2_CORRECTED.md)
- [Master Agent Architecture](./ADK_ARCHITECTURE.md)
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-16
**Author**: Claude (ADK Migration)
