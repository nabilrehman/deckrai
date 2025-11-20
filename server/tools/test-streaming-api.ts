/**
 * Standalone test to discover Gemini streaming API structure
 * Run with: npx tsx server/tools/test-streaming-api.ts
 */

import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ VITE_GEMINI_API_KEY not set');
  process.exit(1);
}

async function testStreamingAPI() {
  console.log('\n🧪 Testing Gemini Streaming API\n');
  console.log('=' .repeat(60));

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const testPrompt = `Say exactly this and nothing else:
→ Test discovery 1
→ Test discovery 2
→ Test discovery 3

\`\`\`json
{"test": "success"}
\`\`\``;

  try {
    console.log('\n📡 Calling generateContentStream...\n');

    const response = await ai.models.generateContentStream({
      model: 'gemini-2.0-flash-exp',
      contents: [
        {
          role: 'user',
          parts: [{ text: testPrompt }],
        },
      ],
    });

    console.log('✅ Stream created');
    console.log('📊 Response type:', typeof response);
    console.log('📊 Response constructor:', response?.constructor?.name);
    console.log('📊 Response keys:', Object.keys(response || {}));
    console.log('\n' + '='.repeat(60));

    let chunkCount = 0;
    let fullText = '';
    let successfulMethod: string | null = null;

    for await (const chunk of response) {
      chunkCount++;
      console.log(`\n--- CHUNK ${chunkCount} ---`);

      // Inspect chunk structure
      console.log('Type:', typeof chunk);
      console.log('Keys:', Object.keys(chunk));
      console.log('Constructor:', chunk?.constructor?.name);

      let extractedText = '';

      // Try Method 1: chunk.text()
      try {
        if (typeof chunk.text === 'function') {
          extractedText = chunk.text();
          console.log('✅ Method 1 SUCCESS: chunk.text()');
          console.log('   Returns:', typeof extractedText);
          console.log('   Value:', extractedText);
          successfulMethod = 'chunk.text()';
        } else {
          console.log('❌ Method 1 FAIL: chunk.text is not a function');
          console.log('   Type:', typeof chunk.text);
        }
      } catch (e: any) {
        console.log('❌ Method 1 ERROR:', e.message);
      }

      // Try Method 2: chunk.text (property)
      if (!extractedText) {
        try {
          if (typeof chunk.text === 'string') {
            extractedText = chunk.text;
            console.log('✅ Method 2 SUCCESS: chunk.text (property)');
            console.log('   Value:', extractedText);
            successfulMethod = 'chunk.text';
          } else {
            console.log('❌ Method 2 FAIL: chunk.text is not a string');
          }
        } catch (e: any) {
          console.log('❌ Method 2 ERROR:', e.message);
        }
      }

      // Try Method 3: chunk.candidates[0].content.parts[0].text
      if (!extractedText) {
        try {
          const candidate = chunk.candidates?.[0];
          const content = candidate?.content;
          const part = content?.parts?.[0];
          const text = part?.text;

          if (text) {
            extractedText = text;
            console.log('✅ Method 3 SUCCESS: chunk.candidates[0].content.parts[0].text');
            console.log('   Value:', extractedText);
            successfulMethod = 'chunk.candidates[0].content.parts[0].text';
          } else {
            console.log('❌ Method 3 FAIL: Path not found');
            if (chunk.candidates) {
              console.log('   candidates:', JSON.stringify(chunk.candidates, null, 2).substring(0, 200));
            }
          }
        } catch (e: any) {
          console.log('❌ Method 3 ERROR:', e.message);
        }
      }

      // Check for metadata-only chunks
      if (!extractedText && chunk.usageMetadata) {
        console.log('ℹ️  Chunk contains usageMetadata (likely final metadata chunk)');
        console.log('   Metadata:', JSON.stringify(chunk.usageMetadata, null, 2));
      }

      // Show full chunk for first one (debugging)
      if (chunkCount === 1) {
        console.log('\n📋 Full chunk structure (first chunk):');
        console.log(JSON.stringify(chunk, null, 2).substring(0, 500));
      }

      fullText += extractedText;

      // Parse discovery lines
      if (extractedText) {
        const lines = extractedText.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('→')) {
            console.log('💡 DISCOVERY:', line.trim().substring(2));
          }
        }
      }

      console.log('─'.repeat(60));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ STREAMING TEST COMPLETE');
    console.log('─'.repeat(60));
    console.log(`📊 Total chunks: ${chunkCount}`);
    console.log(`📊 Full text length: ${fullText.length} chars`);
    console.log(`📊 Successful method: ${successfulMethod || 'NONE - ALL FAILED'}`);
    console.log('\n📄 Full text received:');
    console.log(fullText);
    console.log('='.repeat(60));

    if (!successfulMethod) {
      console.error('\n❌ ERROR: Could not extract text from any chunk!');
      console.error('   This means the API structure is different than expected.');
      console.error('   Check the chunk structure logged above.');
      process.exit(1);
    }

    console.log('\n✅ SUCCESS: Use this method in analyzeBrand.ts:');
    console.log(`   const chunkText = ${successfulMethod};`);

  } catch (error: any) {
    console.error('\n❌ STREAMING FAILED:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testStreamingAPI();
