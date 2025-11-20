/**
 * Deckr.ai ADK Backend Server
 *
 * This Express server hosts the Google Agent Development Kit (ADK) agents.
 * It provides a simple API for the frontend to interact with the ADK.
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { deckrAgent } from '../services/adk/deckraiAgent';

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large JSON bodies for image data

// --- API Routes ---

/**
 * Health check endpoint to confirm the server is running.
 */
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * Main ADK processing endpoint.
 * Receives a user prompt and optional state, then runs the ADK coordinator agent.
 */
app.post('/api/adk/process', async (req: Request, res: Response) => {
  const { userPrompt, state } = req.body;

  if (!userPrompt) {
    return res.status(400).json({ error: 'userPrompt is required' });
  }

  console.log('🚀 [server] Received ADK request:', { userPrompt, state: Object.keys(state || {}) });

  try {
    // Run the main ADK agent with the provided prompt and state
    const result = await deckrAgent.runAsync({
      userPrompt,
      ...state,
    });

    console.log('✅ [server] ADK processing complete. Sending result to client.');
    // The 'result' object contains the final state of the agent session.
    // The frontend service will parse this to get the generated slides, plan, etc.
    res.status(200).json({
      success: true,
      data: result,
    });

  } catch (error: any) {
    console.error('❌ [server] Error during ADK processing:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unknown error occurred during ADK processing.',
    });
  }
});

// --- Server Initialization ---

app.listen(port, () => {
  console.log(`\n🤖 Deckr.ai ADK Backend Server is running on port ${port}`);
  console.log(`   Health check: http://localhost:${port}/health`);
  console.log(`   ADK endpoint: http://localhost:${port}/api/adk/process`);
  console.log(`\n✅ Server is ready to receive requests.`);
});