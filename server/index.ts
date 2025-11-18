/**
 * ADK Backend Server for DeckRAI
 *
 * This Express server runs the ADK coordinator and exposes REST API endpoints
 * for the Vite + React frontend to call.
 *
 * Architecture:
 * - Frontend (Vite + React) → HTTP calls → Backend (Express + ADK) → Gemini API
 * - Backend runs on port 8000
 * - Frontend proxies /api/adk/* to backend during development
 */

import express from 'express';
import cors from 'cors';
import { getDeckRAIAgent } from '../services/adk/deckraiAgent.js';
import { Session, InvocationContext } from '@google/genai/agents';

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'DeckRAI ADK Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/adk/analyze
 *
 * Analyze user prompt and create deck plan
 *
 * Request body:
 * {
 *   userPrompt: string,
 *   mentionedSlideIds?: string[],
 *   slides?: any[]
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   result: any,
 *   sessionId: string
 * }
 */
app.post('/api/adk/analyze', async (req, res) => {
  try {
    const { userPrompt, mentionedSlideIds, slides } = req.body;

    if (!userPrompt) {
      return res.status(400).json({
        success: false,
        error: 'userPrompt is required'
      });
    }

    console.log('🤖 [ADK Backend] Received analyze request');
    console.log('📝 User prompt:', userPrompt.substring(0, 100) + '...');
    if (mentionedSlideIds) {
      console.log('📌 Mentioned slides:', mentionedSlideIds);
    }

    // Create ADK session
    const sessionId = `analyze-${Date.now()}`;
    const session = new Session({ sessionId });

    // Detect mode: EDIT if slides mentioned, CREATE otherwise
    const isEditMode = mentionedSlideIds && mentionedSlideIds.length > 0;

    if (isEditMode && slides) {
      // EDIT MODE - Set session state for editing specific slides
      session.state.set('mode', 'edit');
      session.state.set('target_slide_ids', mentionedSlideIds);
      session.state.set('user_input', userPrompt);

      // Calculate slide numbers (1-indexed) from IDs
      const slideNumbers = mentionedSlideIds.map(id => {
        const index = slides.findIndex(s => s.id === id);
        return index + 1;
      });
      session.state.set('target_slide_numbers', slideNumbers);

      // Determine scope
      const scope = mentionedSlideIds.length === slides.length ? 'all' :
                   mentionedSlideIds.length > 1 ? 'multiple' : 'single';
      session.state.set('scope', scope);

      console.log(`⚡ [ADK Backend] Edit mode: ${scope} - slides ${slideNumbers.join(', ')}`);
    } else {
      // CREATE MODE - Set session state for new deck creation
      session.state.set('mode', 'create');
      session.state.set('user_input', userPrompt);
      console.log('⚡ [ADK Backend] Create mode');
    }

    // Create invocation context
    const ctx = new InvocationContext({
      session,
      userMessage: userPrompt,
      timestamp: new Date()
    });

    // Get coordinator agent and run
    console.log('⚡ [ADK Backend] Calling coordinator...');
    const agent = getDeckRAIAgent();
    const result = await agent.runAsync(ctx);

    console.log('✅ [ADK Backend] Coordinator complete');

    res.json({
      success: true,
      result,
      sessionId,
      isEditMode
    });

  } catch (error: any) {
    console.error('❌ [ADK Backend] Error in /api/adk/analyze:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/adk/generate
 *
 * Generate slides with full context
 *
 * Request body:
 * {
 *   context: GenerationContext
 * }
 */
app.post('/api/adk/generate', async (req, res) => {
  try {
    const { context } = req.body;

    if (!context) {
      return res.status(400).json({
        success: false,
        error: 'context is required'
      });
    }

    console.log('🤖 [ADK Backend] Received generate request');

    // Create ADK session for slide generation
    const sessionId = `generate-${Date.now()}`;
    const session = new Session({ sessionId });

    // Set session state with full context
    session.state.set('mode', 'create');
    session.state.set('user_input', context.notes);
    session.state.set('audience', context.audience);
    session.state.set('slide_count', context.slideCount);
    session.state.set('style', context.style);
    session.state.set('tone', context.tone);

    const ctx = new InvocationContext({
      session,
      userMessage: `Generate ${context.slideCount} slides for ${context.audience} in ${context.style} style: ${context.notes}`,
      timestamp: new Date()
    });

    const agent = getDeckRAIAgent();
    const result = await agent.runAsync(ctx);

    console.log('✅ [ADK Backend] Generation complete');

    res.json({
      success: true,
      result,
      sessionId
    });

  } catch (error: any) {
    console.error('❌ [ADK Backend] Error in /api/adk/generate:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/adk/edit-slide
 *
 * Edit a single slide
 *
 * Request body:
 * {
 *   slideId: string,
 *   task: string,
 *   currentSlideSrc: string,
 *   slides?: any[]
 * }
 */
app.post('/api/adk/edit-slide', async (req, res) => {
  try {
    const { slideId, task, currentSlideSrc, slides } = req.body;

    if (!slideId || !task || !currentSlideSrc) {
      return res.status(400).json({
        success: false,
        error: 'slideId, task, and currentSlideSrc are required'
      });
    }

    console.log('🤖 [ADK Backend] Received edit-slide request');
    console.log('🆔 Slide ID:', slideId);
    console.log('📝 Task:', task);

    // Create ADK session for slide editing
    const sessionId = `edit-slide-${Date.now()}`;
    const session = new Session({ sessionId });

    // Set session state for EDIT mode
    session.state.set('mode', 'edit');
    session.state.set('target_slide_ids', [slideId]);
    session.state.set('user_input', task);
    session.state.set('scope', 'single');

    // Add slide number if slides array provided
    if (slides) {
      const slideIndex = slides.findIndex(s => s.id === slideId);
      if (slideIndex !== -1) {
        session.state.set('target_slide_numbers', [slideIndex + 1]);
      }
    }

    const ctx = new InvocationContext({
      session,
      userMessage: task,
      timestamp: new Date()
    });

    const agent = getDeckRAIAgent();
    const result = await agent.runAsync(ctx);

    console.log('✅ [ADK Backend] Edit complete');

    res.json({
      success: true,
      result,
      sessionId,
      // For now, return the current slide (full implementation pending)
      newSlideSrc: currentSlideSrc
    });

  } catch (error: any) {
    console.error('❌ [ADK Backend] Error in /api/adk/edit-slide:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/adk/analyze',
      'POST /api/adk/generate',
      'POST /api/adk/edit-slide'
    ]
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ [ADK Backend] Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 [ADK Backend] Server started');
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 ADK endpoints available at /api/adk/*`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  POST /api/adk/analyze');
  console.log('  POST /api/adk/generate');
  console.log('  POST /api/adk/edit-slide');
});

export default app;
