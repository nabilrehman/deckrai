/**
 * Chat API Service
 *
 * Handles communication with the backend master agent via /api/chat endpoint.
 * This service acts as a bridge between the frontend chat interface and the
 * backend ADK agent system with 10 specialized tools.
 *
 * @file services/chatApi.ts
 */

import type { ThinkingStep } from '../components/ThinkingSection';

/**
 * Message format for conversation history
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Request payload for /api/chat endpoint
 */
export interface ChatApiRequest {
  userId?: string;
  message: string;
  conversationHistory: ConversationMessage[];
  context?: {
    uploadedFiles?: Array<{ name: string; src: string }>;
    styleLibrary?: Array<{ id: string; name: string; src: string }>;
    mentionedSlides?: string[];
  };
}

/**
 * Response from /api/chat endpoint
 */
export interface ChatApiResponse {
  success: boolean;
  response: string;
  thinking?: {
    steps: ThinkingStep[];
    duration: string;
  };
  toolCalls?: Array<{
    tool: string;
    args: any;
    result: any;
  }>;
  metadata?: {
    executionTime: number;
    iterationCount?: number;
    model?: string;
  };
  error?: string;
}

/**
 * Chat API error class
 */
export class ChatApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ChatApiError';
  }
}

/**
 * Callback for streaming events
 */
export type StreamingCallback = (event: {
  type: 'thinking' | 'tool_call' | 'progress';
  data: any;
}) => void;

/**
 * Call the backend chat API with a user message (with streaming support)
 *
 * @param message - User's message
 * @param conversationHistory - Previous messages in the conversation
 * @param userId - Optional user ID for tracking
 * @param context - Optional context (uploaded files, style library, etc.)
 * @param onStream - Optional callback for streaming events
 * @returns Response from the master agent
 *
 * @example
 * const response = await callChatAPI(
 *   "Create a 5-slide deck for Google",
 *   messages.map(m => ({ role: m.role, content: m.content })),
 *   user?.uid,
 *   { uploadedFiles, styleLibrary },
 *   (event) => console.log('Stream event:', event)
 * );
 */
export async function callChatAPI(
  message: string,
  conversationHistory: ConversationMessage[] = [],
  userId?: string,
  context?: ChatApiRequest['context'],
  onStream?: StreamingCallback
): Promise<ChatApiResponse> {
  const startTime = Date.now();

  try {
    console.log('[chatApi] Sending message to backend agent...');
    console.log('[chatApi] Message:', message.substring(0, 100) + '...');
    console.log('[chatApi] History length:', conversationHistory.length);
    console.log('[chatApi] Context:', context);

    // Prepare request payload
    const requestBody: ChatApiRequest = {
      userId,
      message,
      conversationHistory,
      context,
    };

    // Backend URL (defaults to localhost:3001 in development)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const apiUrl = `${backendUrl}/api/chat`;

    console.log('[chatApi] Backend URL:', apiUrl);

    // Call backend API with streaming
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Check for HTTP errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails;

      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = errorText;
      }

      throw new ChatApiError(
        `Backend API error: ${response.status} ${response.statusText}`,
        response.status,
        errorDetails
      );
    }

    // Handle SSE streaming
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResponse: ChatApiResponse | null = null;

    if (!reader) {
      throw new ChatApiError('No response body available');
    }

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('event:')) {
          const eventType = line.substring(6).trim();
          continue; // Event type line
        }

        if (line.startsWith('data:')) {
          const dataStr = line.substring(5).trim();

          try {
            const data = JSON.parse(dataStr);

            // Handle different event types
            if (data.success !== undefined) {
              // This is the complete event
              finalResponse = data;
            } else if (onStream) {
              // This is a streaming event (thinking, tool_call, progress)
              onStream({ type: 'thinking', data });
            }
          } catch (e) {
            console.warn('[chatApi] Failed to parse SSE data:', dataStr);
          }
        }
      }
    }

    const executionTime = Date.now() - startTime;
    console.log(`[chatApi] ✅ Response received in ${executionTime}ms`);

    if (!finalResponse) {
      throw new ChatApiError('No final response received from stream');
    }

    console.log('[chatApi] Success:', finalResponse.success);
    console.log('[chatApi] Thinking steps:', finalResponse.thinking?.steps?.length || 0);
    console.log('[chatApi] Tool calls:', finalResponse.toolCalls?.length || 0);

    if (!finalResponse.success) {
      throw new ChatApiError(
        finalResponse.error || 'Backend agent failed to process message',
        500,
        finalResponse
      );
    }

    return finalResponse;
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[chatApi] ❌ Error after ${executionTime}ms:`, error);

    // If it's already a ChatApiError, rethrow it
    if (error instanceof ChatApiError) {
      throw error;
    }

    // Network error or other unexpected error
    throw new ChatApiError(
      `Failed to communicate with backend: ${error.message}`,
      undefined,
      error
    );
  }
}

/**
 * Format thinking steps from backend response for display
 *
 * @param thinking - Thinking object from backend
 * @returns Formatted thinking steps
 */
export function formatThinkingSteps(thinking?: ChatApiResponse['thinking']): ThinkingStep[] {
  if (!thinking || !thinking.steps) {
    return [];
  }

  return thinking.steps.map(step => ({
    id: step.id,
    title: step.title,
    content: step.content,
    status: step.status,
    type: step.type,
    timestamp: step.timestamp,
  }));
}

/**
 * Format tool calls from backend response for action summary
 *
 * @param toolCalls - Tool calls from backend
 * @returns Formatted action items
 */
export function formatToolCalls(toolCalls?: ChatApiResponse['toolCalls']) {
  if (!toolCalls || toolCalls.length === 0) {
    return [];
  }

  return toolCalls.map((call, index) => {
    const toolName = call.tool.replace('Tool', ''); // Remove 'Tool' suffix
    const isSuccess = call.result?.success !== false;

    return {
      id: `tool-${index}`,
      label: toolName,
      status: isSuccess ? 'completed' : 'failed',
      diff: call.result?.data ? '+1' : '',
    };
  });
}

/**
 * Check if backend API is available
 *
 * @returns True if backend is healthy
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch('/health', {
      method: 'GET',
    });

    return response.ok;
  } catch (error) {
    console.error('[chatApi] Backend health check failed:', error);
    return false;
  }
}

/**
 * Get backend API status
 *
 * @returns Backend status information
 */
export async function getBackendStatus(): Promise<{
  healthy: boolean;
  version?: string;
  availableTools?: string[];
}> {
  try {
    const response = await fetch('/health', {
      method: 'GET',
    });

    if (!response.ok) {
      return { healthy: false };
    }

    const data = await response.json();
    return {
      healthy: true,
      version: data.version,
      availableTools: data.tools,
    };
  } catch (error) {
    console.error('[chatApi] Failed to get backend status:', error);
    return { healthy: false };
  }
}
