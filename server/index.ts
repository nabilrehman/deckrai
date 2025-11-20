/**
 * Deckr.ai Chat Server
 * Express server that handles chat requests using the master agent
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { processMessage } from './agent';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large limit for base64 images

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'deckr-chat-server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Main chat endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  const { userId, message, conversationHistory, context } = req.body;

  if (!userId || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: userId, message'
    });
  }

  console.log(`[server] Received request from user: ${userId}`);
  console.log(`[server] Message: ${message.substring(0, 100)}...`);

  // Set up SSE streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    await processMessage({
      userId,
      message,
      conversationHistory: conversationHistory || [],
      context: context || {},
      onEvent: (event) => {
        // Stream events to client
        res.write(`event: ${event.type}\n`);
        res.write(`data: ${JSON.stringify(event.data)}\n\n`);
      }
    });

    // End the stream
    res.end();
  } catch (error: any) {
    console.error('[server] Error processing message:', error);
    res.write(`event: error\n`);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// GET handler for browser visits
app.get('/api/chat', (req: Request, res: Response) => {
  res.json({
    message: 'Deckr.ai Chat Endpoint',
    method: 'POST',
    usage: 'Send POST request with JSON body: { "userId": "...", "message": "...", "conversationHistory": [], "context": {} }'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🤖 Deckr Chat Server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`\n✅ Server ready to process chat requests`);
});
