/**
 * Unit test for analyzeBrand streaming functionality
 * Tests the Gemini streaming API integration
 */

import { GoogleGenAI } from '@google/genai';

// Mock response chunks to test different API structures
const mockStreamingChunks = [
  {
    // Structure 1: chunk.text() method
    text: () => '→ Searching for brand guidelines...\n',
    candidates: [{ content: { parts: [{ text: '→ Searching for brand guidelines...\n' }] } }]
  },
  {
    // Structure 2: chunk.text property
    text: '→ Found brand page at solarwinds.com/brand\n',
    candidates: [{ content: { parts: [{ text: '→ Found brand page at solarwinds.com/brand\n' }] } }]
  },
  {
    // Structure 3: nested in candidates
    candidates: [
      {
        content: {
          parts: [
            { text: '→ Extracting primary color: #F86E00 (SolarWinds Orange)\n' }
          ]
        }
      }
    ]
  }
];

describe('analyzeBrand streaming API', () => {
  let ai: any;

  beforeEach(() => {
    // Load API key from environment
    const apiKey = process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_GEMINI_API_KEY not set');
    }
    ai = new GoogleGenAI({ apiKey });
  });

  it('should discover the correct chunk structure from real API', async () => {
    console.log('\n🧪 Testing Gemini streaming API with minimal prompt...\n');

    const testPrompt = `Say exactly this and nothing else:
→ Test discovery 1
→ Test discovery 2

{"test": "data"}`;

    try {
      const response = await ai.models.generateContentStream({
        model: 'gemini-2.0-flash-exp',
        contents: [
          {
            role: 'user',
            parts: [{ text: testPrompt }],
          },
        ],
      });

      console.log('✅ Stream created successfully');
      console.log('📊 Response type:', typeof response);
      console.log('📊 Response constructor:', response?.constructor?.name);

      let chunkCount = 0;
      let fullText = '';

      for await (const chunk of response) {
        chunkCount++;
        console.log(`\n--- Chunk ${chunkCount} ---`);
        console.log('📊 Chunk type:', typeof chunk);
        console.log('📊 Chunk keys:', Object.keys(chunk));

        // Test different ways to extract text
        let extractedText = '';

        // Method 1: chunk.text() as function
        try {
          if (typeof chunk.text === 'function') {
            extractedText = chunk.text();
            console.log('✅ Method 1 (chunk.text()): WORKS');
            console.log('   Text:', extractedText.substring(0, 50));
          } else {
            console.log('❌ Method 1 (chunk.text()): text is not a function');
          }
        } catch (e: any) {
          console.log('❌ Method 1 (chunk.text()): ERROR -', e.message);
        }

        // Method 2: chunk.text as property
        try {
          if (typeof chunk.text === 'string') {
            extractedText = chunk.text;
            console.log('✅ Method 2 (chunk.text): WORKS');
            console.log('   Text:', extractedText.substring(0, 50));
          } else {
            console.log('❌ Method 2 (chunk.text): text is not a string');
          }
        } catch (e: any) {
          console.log('❌ Method 2 (chunk.text): ERROR -', e.message);
        }

        // Method 3: chunk.candidates[0].content.parts[0].text
        try {
          if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
            extractedText = chunk.candidates[0].content.parts[0].text;
            console.log('✅ Method 3 (chunk.candidates[0]...): WORKS');
            console.log('   Text:', extractedText.substring(0, 50));
          } else {
            console.log('❌ Method 3 (chunk.candidates[0]...): Path not found');
          }
        } catch (e: any) {
          console.log('❌ Method 3 (chunk.candidates[0]...): ERROR -', e.message);
        }

        // Method 4: Check for usageMetadata (some chunks might be metadata only)
        if (chunk.usageMetadata) {
          console.log('ℹ️  Chunk contains usageMetadata (likely empty content chunk)');
        }

        fullText += extractedText;

        // Show discovery lines
        if (extractedText) {
          const lines = extractedText.split('\n');
          for (const line of lines) {
            if (line.trim().startsWith('→')) {
              console.log('💡 Discovery:', line.trim().substring(2));
            }
          }
        }
      }

      console.log('\n✅ Test completed');
      console.log(`📊 Total chunks: ${chunkCount}`);
      console.log(`📊 Full text length: ${fullText.length} chars`);
      console.log(`📊 Full text preview:`, fullText.substring(0, 100));

      expect(chunkCount).toBeGreaterThan(0);
      expect(fullText.length).toBeGreaterThan(0);

    } catch (error: any) {
      console.error('\n❌ Stream failed:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  });

  it('should handle discovery line parsing', () => {
    const testText = `→ Searching for brand guidelines...
→ Found brand page at solarwinds.com/brand
→ Extracting primary color: #F86E00 (SolarWinds Orange)

Here is some other text

{"test": "data"}`;

    const discoveries: string[] = [];
    const lines = testText.split('\n');

    for (const line of lines) {
      if (line.trim().startsWith('→')) {
        const discovery = line.trim().substring(2);
        discoveries.push(discovery);
      }
    }

    expect(discoveries).toHaveLength(3);
    expect(discoveries[0]).toBe('Searching for brand guidelines...');
    expect(discoveries[1]).toBe('Found brand page at solarwinds.com/brand');
    expect(discoveries[2]).toBe('Extracting primary color: #F86E00 (SolarWinds Orange)');
  });

  it('should extract JSON from mixed content', () => {
    const testText = `→ Discovery 1
→ Discovery 2

\`\`\`json
{
  "primaryColor": "#F86E00",
  "secondaryColor": "#2D2D2D"
}
\`\`\``;

    // Extract JSON from markdown code blocks
    const jsonMatch = testText.match(/```json\s*([\s\S]*?)\s*```/);
    expect(jsonMatch).not.toBeNull();

    const jsonText = jsonMatch![1];
    const parsed = JSON.parse(jsonText);

    expect(parsed.primaryColor).toBe('#F86E00');
    expect(parsed.secondaryColor).toBe('#2D2D2D');
  });
});

/**
 * Run this test with:
 *
 * npx tsx --test server/tools/__tests__/analyzeBrand.streaming.test.ts
 *
 * Or with jest:
 * npm test -- analyzeBrand.streaming
 *
 * This will show you the exact chunk structure from Gemini's API
 * and which method successfully extracts text.
 */
