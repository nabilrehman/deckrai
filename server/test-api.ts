import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

async function testGeminiAPI() {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  console.log('[Test] API Key present:', !!apiKey);
  console.log('[Test] API Key prefix:', apiKey?.substring(0, 10) + '...');

  const ai = new GoogleGenAI({ apiKey });
  console.log('[Test] Calling Gemini 2.5 Pro...');
  const start = Date.now();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: [{ role: 'user', parts: [{ text: 'Say "Hi"' }] }]
    });
    console.log(`[Test] ✅ Success in ${Date.now() - start}ms`);
    console.log('[Test] Response:', response.text);
  } catch (error: any) {
    console.error(`[Test] ❌ Failed in ${Date.now() - start}ms`);
    console.error('[Test] Error details:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      stack: error?.stack
    });
  }
}

testGeminiAPI();
