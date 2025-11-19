/**
 * Deckr ADK Server
 * Express server running the DeckrCoordinatorAgent
 */

import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large limit for base64 images

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'deckr-adk-server',
    agent: 'DeckrCoordinatorAgent',
    version: '1.0.0-alpha',
    timestamp: new Date().toISOString()
  });
});

// Main chat endpoint (to be implemented)
app.post('/api/chat', async (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Chat endpoint not yet implemented. Phase 2-6 in progress.'
  });
});

// GET handler for browser visits
app.get('/api/chat', (req, res) => {
  res.json({
    message: 'Deckr ADK Chat Endpoint',
    method: 'POST',
    status: 'Phase 1 Complete ✓',
    usage: 'Send POST request with JSON body: { "userId": "...", "message": "..." }',
    implementation: 'Phase 2-6 in progress',
    nextPhase: 'Implement vision tools (analyzeSlideTool, analyzeDeckTool)'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🤖 Deckr ADK Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`\n   Status: Phase 1 Complete ✓`);
  console.log(`   Next: Implement tools (Phase 2-5)`);
});
