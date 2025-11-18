# ADK Web Integration Plan for Vite + React

## Problem
ADK (@google/genai/agents) is a **Node.js library** that cannot run directly in browsers. It needs to run on a backend server.

## Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Vite + React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ChatController│  │ChatLanding  │  │  Editor      │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                │
│                    HTTP/WebSocket                          │
│                           │                                │
└───────────────────────────┼────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backend API Server (Node.js)                   │
│                    Port 8000                                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Endpoints                                       │  │
│  │  POST /api/adk/analyze                              │  │
│  │  POST /api/adk/generate                             │  │
│  │  POST /api/adk/edit-slide                           │  │
│  └──────────────────┬───────────────────────────────────┘  │
│                     │                                       │
│                     ▼                                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ADK Coordinator                                     │  │
│  │  - deckraiAgent                                      │  │
│  │  - Session Management                                │  │
│  │  - Specialized Agents                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create Backend API Server
Create a new Node.js Express server that runs ADK:

**File**: `server/index.ts`
```typescript
import express from 'express';
import cors from 'cors';
import { getDeckRAIAgent } from '../services/adk/deckraiAgent';
import { Session, InvocationContext } from '@google/genai/agents';

const app = express();
app.use(cors());
app.use(express.json());

// POST /api/adk/analyze - Analyze notes and create deck plan
app.post('/api/adk/analyze', async (req, res) => {
  const { userPrompt, mentionedSlideIds, slides } = req.body;

  const session = new Session({ sessionId: `analyze-${Date.now()}` });

  // Set session state based on mentions
  if (mentionedSlideIds && mentionedSlideIds.length > 0) {
    session.state.set('mode', 'edit');
    session.state.set('target_slide_ids', mentionedSlideIds);
    // ... set other state
  } else {
    session.state.set('mode', 'create');
  }

  session.state.set('user_input', userPrompt);

  const ctx = new InvocationContext({
    session,
    userMessage: userPrompt,
    timestamp: new Date()
  });

  const agent = getDeckRAIAgent();
  const result = await agent.runAsync(ctx);

  res.json({ result });
});

// POST /api/adk/generate - Generate slides
app.post('/api/adk/generate', async (req, res) => {
  // Similar implementation
});

// POST /api/adk/edit-slide - Edit a single slide
app.post('/api/adk/edit-slide', async (req, res) => {
  // Similar implementation
});

app.listen(8000, () => {
  console.log('ADK API server running on http://localhost:8000');
});
```

### Step 2: Update deckraiService to Call Backend API

**File**: `services/deckraiService.ts`
```typescript
const API_URL = import.meta.env.VITE_ADK_API_URL || 'http://localhost:8000';

export async function analyzeNotesAndAskQuestions(
  userPrompt: string,
  mentionedSlideIds?: string[],
  slides?: any[]
): Promise<ADKAnalysisResult> {
  console.log('🤖 [ADK] Calling backend API...');

  try {
    const response = await fetch(`${API_URL}/api/adk/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userPrompt,
        mentionedSlideIds,
        slides
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return parseCoordinatorResult(data.result, userPrompt, !!mentionedSlideIds);
  } catch (error) {
    console.error('❌ [ADK] API call failed:', error);
    // Fallback to defaults
    return { /* ... */ };
  }
}

export async function executeSlideTask(
  slideId: string,
  task: string,
  currentSlideSrc: string,
  slides?: any[]
): Promise<string> {
  const response = await fetch(`${API_URL}/api/adk/edit-slide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slideId, task, currentSlideSrc, slides })
  });

  const data = await response.json();
  return data.newSlideSrc;
}
```

### Step 3: Configure Vite Proxy

**File**: `vite.config.ts`
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/adk': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
});
```

### Step 4: Add Backend Scripts

**File**: `package.json`
```json
{
  "scripts": {
    "dev": "vite",
    "dev:full": "concurrently \"npm run dev\" \"npm run server\"",
    "server": "tsx server/index.ts",
    "build": "vite build",
    "build:server": "tsc server/index.ts --outDir dist-server"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "concurrently": "^8.2.2",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17"
  }
}
```

### Step 5: Environment Variables

**File**: `.env`
```bash
# Backend API URL (for production)
VITE_ADK_API_URL=https://your-api.example.com

# Gemini API Key (backend only)
GOOGLE_GENAI_API_KEY=your_api_key_here
```

## Development Workflow

1. **Start Both Servers**:
   ```bash
   npm run dev:full
   ```
   - Frontend: http://localhost:5173 (Vite)
   - Backend: http://localhost:8000 (ADK API)

2. **Frontend Makes API Calls**:
   - User types in chat
   - Frontend calls `/api/adk/analyze`
   - Backend runs ADK coordinator
   - Returns result to frontend
   - Frontend displays results

## Deployment

### Option 1: Separate Deployments
- **Frontend**: Deploy to Vercel/Netlify (static files)
- **Backend**: Deploy to Railway/Render/GCP Cloud Run
- Set `VITE_ADK_API_URL` to backend URL

### Option 2: Monorepo Deployment
- Deploy both frontend and backend together
- Use services like Railway or Render that support monorepos

## Benefits of This Architecture

✅ ADK runs in Node.js environment (as designed)
✅ Frontend stays lightweight (React/Vite)
✅ Clear separation of concerns
✅ Easy to scale backend independently
✅ Can add WebSocket support for streaming
✅ Backend can be reused for mobile apps, other frontends

## Current Status

- ✅ ADK coordinator implemented (services/adk/)
- ✅ Specialized agents (3/15 complete)
- ⚠️ Need to create backend API server
- ⚠️ Need to update deckraiService to call API
- ⚠️ Need to configure Vite proxy

## Next Steps

1. Create `server/` directory
2. Implement Express API server with ADK endpoints
3. Update `deckraiService.ts` to make HTTP calls
4. Add Vite proxy configuration
5. Update package.json scripts
6. Test end-to-end flow
7. Deploy backend and frontend separately

---

**Summary**: ADK cannot run in browsers. We need a backend API server that runs ADK, and the frontend makes HTTP calls to it. This is the standard pattern used by all ADK + React applications.
