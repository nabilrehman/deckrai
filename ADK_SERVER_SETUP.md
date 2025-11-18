# ADK Backend Server Setup

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Frontend (Vite + React)                   │
│                      Port 3000                               │
│                                                              │
│  Components → deckraiService (HTTP client) → /api/adk/*    │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP
                       │
┌──────────────────────▼───────────────────────────────────────┐
│                 Backend (Express + ADK)                      │
│                      Port 8000                               │
│                                                              │
│  Express API → getDeckRAIAgent() → Gemini API              │
└──────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

This installs:
- **Backend**: `express`, `cors`, `@google/adk`, `@google/genai`
- **Frontend**: `react`, `vite`
- **Dev Tools**: `tsx`, `concurrently`

### 2. Set Environment Variables

Create a `.env` file:

```bash
# Required: Gemini API Key for ADK
GOOGLE_GENAI_API_KEY=your_gemini_api_key_here

# Optional: Custom backend URL (defaults to http://localhost:8000)
VITE_ADK_API_URL=http://localhost:8000

# Optional: Allowed CORS origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. Run Full Stack (Recommended)

```bash
npm run dev:full
```

This starts:
- **Backend** on http://localhost:8000
- **Frontend** on http://localhost:3000

### 4. Run Separately (Advanced)

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## How It Works

### Backend (server/index.ts)

The Express server runs the ADK coordinator and exposes REST API endpoints:

**Endpoints:**

1. **GET /health** - Health check
   ```bash
   curl http://localhost:8000/health
   ```

2. **POST /api/adk/analyze** - Analyze user prompt
   ```bash
   curl -X POST http://localhost:8000/api/adk/analyze \
     -H "Content-Type: application/json" \
     -d '{"userPrompt": "Create a 7-slide pitch deck about AI"}'
   ```

3. **POST /api/adk/generate** - Generate slides
   ```bash
   curl -X POST http://localhost:8000/api/adk/generate \
     -H "Content-Type: application/json" \
     -d '{"context": {"notes": "...", "slideCount": 7}}'
   ```

4. **POST /api/adk/edit-slide** - Edit a slide
   ```bash
   curl -X POST http://localhost:8000/api/adk/edit-slide \
     -H "Content-Type: application/json" \
     -d '{"slideId": "slide-1", "task": "Update title"}'
   ```

### Frontend (services/deckraiService.ts)

The frontend makes HTTP calls to the backend:

```typescript
// Browser calls deckraiService
const analysis = await analyzeNotesAndAskQuestions(userPrompt);

// deckraiService calls backend
fetch('http://localhost:8000/api/adk/analyze', {
  method: 'POST',
  body: JSON.stringify({ userPrompt })
});

// Backend runs ADK coordinator
const agent = getDeckRAIAgent();
const result = await agent.runAsync(ctx);

// Returns result to frontend
```

### Vite Proxy (vite.config.ts)

The Vite dev server proxies `/api/adk/*` requests to the backend:

```typescript
server: {
  proxy: {
    '/api/adk': {
      target: 'http://localhost:8000',
      changeOrigin: true,
    }
  }
}
```

This allows the frontend to call `/api/adk/analyze` and Vite forwards it to the backend.

## Testing

### Test Backend Directly

```bash
# Health check
curl http://localhost:8000/health

# Analyze request
curl -X POST http://localhost:8000/api/adk/analyze \
  -H "Content-Type: application/json" \
  -d '{"userPrompt": "Create a pitch deck"}'
```

### Test Frontend

1. Start full stack: `npm run dev:full`
2. Open browser: http://localhost:3000
3. Open DevTools Console
4. Type a prompt in the chat
5. Watch console for:
   ```
   🌐 [ADK Client] Calling backend API
   🤖 [ADK Backend] Received analyze request
   ✅ [ADK Backend] Coordinator complete
   ✅ [ADK Client] Backend response received
   ```

## Project Structure

```
deckrai/
├── server/
│   └── index.ts              # Express + ADK backend server
├── services/
│   ├── adk/
│   │   ├── deckraiAgent.ts   # ADK coordinator
│   │   ├── coordinator.ts     # Routing logic
│   │   └── agents/           # Specialized agents
│   └── deckraiService.ts     # HTTP client (frontend)
├── components/
│   ├── ChatController.tsx    # Uses deckraiService
│   ├── ChatLandingView.tsx   # Uses deckraiService
│   └── Editor.tsx            # Uses deckraiService
├── vite.config.ts            # Proxy config
└── package.json              # Scripts & dependencies
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_GENAI_API_KEY` | ✅ Yes | None | Gemini API key for ADK |
| `VITE_ADK_API_URL` | No | `http://localhost:8000` | Backend API URL |
| `ALLOWED_ORIGINS` | No | `http://localhost:3000,http://localhost:5173` | CORS origins |
| `PORT` | No | `8000` | Backend port |

## Troubleshooting

### Backend Won't Start

**Error**: `Cannot find module '@google/adk'`

**Fix**:
```bash
npm install
```

### Frontend Can't Connect to Backend

**Error**: `Failed to fetch`

**Fix**:
1. Check backend is running: `curl http://localhost:8000/health`
2. Check Vite proxy config in `vite.config.ts`
3. Check CORS settings in `server/index.ts`

### ADK Errors

**Error**: `API key must be provided`

**Fix**: Set `GOOGLE_GENAI_API_KEY` in `.env`

**Error**: `Agent not found`

**Fix**: Ensure `services/adk/` directory exists with agent code

## Deployment

### Option 1: Separate Deployments (Recommended)

**Backend** (Railway, Render, Cloud Run):
```bash
npm run build:server
# Deploy dist-server/
```

**Frontend** (Vercel, Netlify):
```bash
npm run build
# Deploy dist/
# Set VITE_ADK_API_URL to backend URL
```

### Option 2: Monorepo (Heroku, Render)

Deploy both together with Procfile:
```
web: npm run dev:full
```

## Performance

- **Cold start**: ~2s (backend initialization)
- **Request latency**: ~1-3s (depends on Gemini API)
- **Concurrent requests**: Limited by Node.js event loop (~1000/s)

## Security

⚠️ **Important**:
- Never expose `GOOGLE_GENAI_API_KEY` in frontend code
- Use environment variables for secrets
- Restrict CORS origins in production
- Add authentication/authorization for production use

## Next Steps

1. ✅ Backend server created
2. ✅ Frontend HTTP client updated
3. ✅ Vite proxy configured
4. ⏳ Test end-to-end flow
5. ⏳ Deploy to production
6. ⏳ Add authentication
7. ⏳ Implement remaining 12 specialized agents

## Support

**Documentation**:
- ADK_BACKEND_INTEGRATION_PLAN.md - Detailed architecture plan
- ADK_WEB_INTEGRATION_COMPLETE.md - Component integration guide
- services/adk/README.md - ADK architecture overview

**Logs**:
- Backend logs: Terminal running `npm run dev:server`
- Frontend logs: Browser DevTools Console
- Network: Browser DevTools Network tab

**Common Issues**:
- Port 8000 in use: Change `PORT` in `.env`
- Port 3000 in use: Change port in `vite.config.ts`
- CORS errors: Add origin to `ALLOWED_ORIGINS`
