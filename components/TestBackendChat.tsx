/**
 * Simple Test Page for Backend ADK Agent Integration
 *
 * This component provides a minimal chat interface to test the backend
 * without modifying the complex ChatLandingView.
 *
 * Usage: Add this to your routes for testing
 */

import React, { useState } from 'react';
import { callChatAPI } from '../services/chatApi';
import type { ThinkingStep } from './ThinkingSection';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinking?: {
    steps: ThinkingStep[];
    duration: string;
  };
  toolCalls?: Array<{
    tool: string;
    args: any;
    result: any;
  }>;
}

export default function TestBackendChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'healthy' | 'error'>('unknown');

  // Check backend health on mount
  React.useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        setBackendStatus('healthy');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('error');
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    setInput('');

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsProcessing(true);

    try {
      // Call backend API
      const response = await callChatAPI(
        userMessage,
        messages.map(m => ({ role: m.role, content: m.content }))
      );

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response || 'No response',
        thinking: response.thinking,
        toolCalls: response.toolCalls
      }]);

    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${error.message}`
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '40px auto',
      padding: '20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '600' }}>
          Backend ADK Agent Test
        </h1>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '8px',
          fontSize: '14px'
        }}>
          <span>Backend Status:</span>
          <span style={{
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: '500',
            background: backendStatus === 'healthy' ? '#D1FAE5' : backendStatus === 'error' ? '#FEE2E2' : '#F3F4F6',
            color: backendStatus === 'healthy' ? '#065F46' : backendStatus === 'error' ? '#991B1B' : '#6B7280'
          }}>
            {backendStatus === 'healthy' ? '✅ Online' : backendStatus === 'error' ? '❌ Offline' : '⏳ Checking...'}
          </span>
          {backendStatus === 'error' && (
            <button
              onClick={checkBackend}
              style={{
                padding: '4px 12px',
                fontSize: '13px',
                background: '#6366F1',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        background: '#F9FAFB',
        borderRadius: '12px',
        padding: '20px',
        minHeight: '400px',
        maxHeight: '600px',
        overflowY: 'auto',
        marginBottom: '20px'
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px 0' }}>
            <p style={{ margin: 0, fontSize: '15px' }}>Try these test cases:</p>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              marginTop: '12px',
              fontSize: '14px',
              lineHeight: '1.8'
            }}>
              <li>• "Hello" (simple chat)</li>
              <li>• "Create one slide about data warehousing" (single slide)</li>
              <li>• "Create a 5-slide deck for Google" (full deck)</li>
            </ul>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} style={{
            marginBottom: '16px',
            padding: '16px',
            background: msg.role === 'user' ? 'white' : '#F3F4F6',
            borderRadius: '8px'
          }}>
            <div style={{
              fontWeight: '600',
              fontSize: '14px',
              marginBottom: '8px',
              color: msg.role === 'user' ? '#6366F1' : '#8B5CF6'
            }}>
              {msg.role === 'user' ? '👤 You' : '🤖 Agent'}
            </div>

            <div style={{ fontSize: '15px', color: '#1F2937', whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </div>

            {/* Thinking Steps */}
            {msg.thinking && msg.thinking.steps.length > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: '#EEF2FF',
                borderRadius: '6px',
                fontSize: '13px'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#4F46E5' }}>
                  🤔 Thought for {msg.thinking.duration}
                </div>
                {msg.thinking.steps.map((step, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                    color: '#6366F1'
                  }}>
                    <span>{step.status === 'completed' ? '✓' : step.status === 'active' ? '⏳' : '○'}</span>
                    <span>{step.title}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tool Calls */}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: '#F0FDF4',
                borderRadius: '6px',
                fontSize: '13px'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#065F46' }}>
                  🔧 Tools Used ({msg.toolCalls.length})
                </div>
                {msg.toolCalls.map((call, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '4px',
                    color: '#059669'
                  }}>
                    <span>{call.result?.success ? '✓' : '❌'}</span>
                    <span style={{ fontWeight: '500' }}>{call.tool}</span>
                    <span style={{ color: '#6B7280', fontSize: '12px' }}>
                      ({Object.keys(call.args || {}).length} args)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div style={{
            padding: '16px',
            background: '#F3F4F6',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#6B7280',
            fontSize: '14px'
          }}>
            <div style={{
              display: 'inline-block',
              width: '16px',
              height: '16px',
              border: '3px solid #E5E7EB',
              borderTopColor: '#6366F1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
            <div style={{ marginTop: '8px' }}>Agent is thinking...</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{
        display: 'flex',
        gap: '12px'
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message... (e.g., 'Create one slide about AI')"
          disabled={isProcessing || backendStatus !== 'healthy'}
          style={{
            flex: 1,
            padding: '14px 20px',
            fontSize: '15px',
            border: '1px solid #E5E7EB',
            borderRadius: '24px',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#6366F1'}
          onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
        />
        <button
          onClick={handleSend}
          disabled={isProcessing || backendStatus !== 'healthy' || !input.trim()}
          style={{
            padding: '14px 32px',
            fontSize: '15px',
            fontWeight: '500',
            background: isProcessing || backendStatus !== 'healthy' || !input.trim() ? '#D1D5DB' : '#6366F1',
            color: 'white',
            border: 'none',
            borderRadius: '24px',
            cursor: isProcessing || backendStatus !== 'healthy' || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!isProcessing && backendStatus === 'healthy' && input.trim()) {
              e.currentTarget.style.background = '#4F46E5';
            }
          }}
          onMouseLeave={(e) => {
            if (!isProcessing && backendStatus === 'healthy' && input.trim()) {
              e.currentTarget.style.background = '#6366F1';
            }
          }}
        >
          {isProcessing ? 'Sending...' : 'Send'}
        </button>
      </div>

      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: '#EFF6FF',
        borderRadius: '8px',
        fontSize: '13px',
        color: '#1E40AF'
      }}>
        <strong>💡 Testing Tips:</strong>
        <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
          <li>Make sure backend server is running: <code style={{ background: '#DBEAFE', padding: '2px 6px', borderRadius: '4px' }}>npx tsx server/index.ts</code></li>
          <li>Watch the terminal for backend logs showing tool execution</li>
          <li>Thinking steps show what the agent is doing</li>
          <li>Tool calls show which ADK tools were used</li>
        </ul>
      </div>
    </div>
  );
}
