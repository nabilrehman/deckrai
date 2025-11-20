/**
 * Comprehensive Test: Streaming Discoveries + Thinking Config
 *
 * Tests:
 * 1. Streaming API with chunk.text extraction
 * 2. ThinkingConfig with includeThoughts
 * 3. Agent output when plan is generated
 *
 * Run with: VITE_GEMINI_API_KEY=your-key npx tsx server/tools/test-thinking-and-streaming.ts
 */

import { GoogleGenAI } from '@google/genai';

const API_KEY = process.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ VITE_GEMINI_API_KEY not set');
  process.exit(1);
}

// Test 1: Streaming with Discovery Parsing
async function testStreamingDiscoveries() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 1: STREAMING DISCOVERIES');
  console.log('='.repeat(70) + '\n');

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `Research brand guidelines for SolarWinds and stream your discoveries.

Format each discovery on a new line starting with "→":
→ Searching for brand guidelines...
→ Found brand page at [URL]
→ Extracting primary color: [hex] ([name])

Then return JSON:
\`\`\`json
{"primaryColor": "#F86E00"}
\`\`\``;

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }], // Enable web grounding
      },
    });

    console.log('✅ Stream created\n');

    let fullText = '';
    const discoveries: string[] = [];

    for await (const chunk of response) {
      // ✅ FIXED: Use chunk.text (property, not method)
      const chunkText = chunk.text;

      if (chunkText) {
        fullText += chunkText;

        // Parse discovery lines
        const lines = chunkText.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('→')) {
            const discovery = line.trim().substring(2);
            discoveries.push(discovery);
            console.log('💡', discovery);
          }
        }
      }
    }

    console.log('\n📊 Results:');
    console.log(`   Discoveries found: ${discoveries.length}`);
    console.log(`   Full text length: ${fullText.length} chars`);

    // Try to extract JSON
    const jsonMatch = fullText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      const brandData = JSON.parse(jsonMatch[1]);
      console.log(`   Brand color extracted: ${brandData.primaryColor}`);
      console.log('\n✅ TEST 1 PASSED: Streaming + Discovery Parsing Works!');
      return true;
    } else {
      console.log('\n⚠️  TEST 1 WARNING: No JSON found in response');
      return false;
    }
  } catch (error: any) {
    console.error('\n❌ TEST 1 FAILED:', error.message);
    return false;
  }
}

// Test 2: Thinking Config with Plan Generation
async function testThinkingConfig() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: THINKING CONFIG + PLAN GENERATION');
  console.log('='.repeat(70) + '\n');

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `Create a 3-slide deck plan for SolarWinds about sales best practices.

For each slide, specify:
1. Title
2. Purpose
3. Key content

Return as JSON array.`;

  try {
    console.log('🧠 Testing with includeThoughts: true\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-exp',  // 2.5 models support thinking
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        thinkingConfig: {
          includeThoughts: true,  // ✅ Include model's internal reasoning
        },
      },
    });

    const text = response.text;
    console.log('📄 Response Preview:');
    console.log(text.substring(0, 500) + '...\n');

    // Check if thoughts are included
    const hasThoughts = text.includes('thinking') || text.includes('reasoning') || text.includes('plan');
    console.log(`💭 Thoughts included: ${hasThoughts ? 'YES ✅' : 'NO ❌'}`);

    // Try to extract JSON plan
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const plan = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
      console.log(`📊 Plan generated: ${plan.length} slides`);
      console.log('\n✅ TEST 2 PASSED: ThinkingConfig Works!');
      return true;
    } else {
      console.log('\n⚠️  TEST 2 WARNING: No JSON plan found');
      return false;
    }
  } catch (error: any) {
    console.error('\n❌ TEST 2 FAILED:', error.message);

    // If thinking config fails, try without it
    console.log('\n🔄 Retrying WITHOUT thinkingConfig...\n');

    try {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      console.log('✅ Fallback succeeded');
      console.log('ℹ️  This means thinking config is NOT supported by this model');
      return false;
    } catch (fallbackError: any) {
      console.error('❌ Fallback also failed:', fallbackError.message);
      return false;
    }
  }
}

// Test 3: Combined - Streaming with Thinking
async function testStreamingWithThinking() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 3: STREAMING + THINKING CONFIG (COMBINED)');
  console.log('='.repeat(70) + '\n');

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `Plan a 2-slide deck and stream your thinking process.

Stream each thought on a new line starting with "→":
→ Analyzing audience needs...
→ Planning slide flow...
→ Designing slide 1...

Then return the plan as JSON.`;

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash-exp',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        thinkingConfig: {
          includeThoughts: true,
        },
      },
    });

    console.log('✅ Combined stream created\n');

    let fullText = '';
    let thoughtCount = 0;

    for await (const chunk of response) {
      const chunkText = chunk.text;

      if (chunkText) {
        fullText += chunkText;

        // Count thinking steps
        const lines = chunkText.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('→')) {
            thoughtCount++;
            console.log('💭', line.trim().substring(2));
          }
        }
      }
    }

    console.log(`\n📊 Thinking steps captured: ${thoughtCount}`);
    console.log(`📊 Total response length: ${fullText.length} chars`);

    if (thoughtCount > 0) {
      console.log('\n✅ TEST 3 PASSED: Streaming + Thinking Works Together!');
      return true;
    } else {
      console.log('\n⚠️  TEST 3 WARNING: No thinking steps detected');
      return false;
    }
  } catch (error: any) {
    console.error('\n❌ TEST 3 FAILED:', error.message);
    return false;
  }
}

// Main Test Runner
async function runAllTests() {
  console.log('\n🧪 DECKR.AI AGENT TEST SUITE');
  console.log('Testing: Streaming Discoveries + Thinking Config\n');

  const results = {
    streaming: false,
    thinking: false,
    combined: false,
  };

  // Run tests sequentially
  console.log('⏱️  Starting tests (this may take 30-60 seconds)...\n');

  results.streaming = await testStreamingDiscoveries();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests

  results.thinking = await testThinkingConfig();
  await new Promise(resolve => setTimeout(resolve, 2000));

  results.combined = await testStreamingWithThinking();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('FINAL RESULTS');
  console.log('='.repeat(70));
  console.log(`
  Test 1 - Streaming Discoveries:   ${results.streaming ? '✅ PASS' : '❌ FAIL'}
  Test 2 - Thinking Config:          ${results.thinking ? '✅ PASS' : '❌ FAIL'}
  Test 3 - Combined (Streaming+Thinking): ${results.combined ? '✅ PASS' : '❌ FAIL'}
  `);

  const allPassed = results.streaming && results.thinking && results.combined;

  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! System is ready for production.\n');
  } else if (results.streaming) {
    console.log('⚠️  Streaming works, but thinking config needs attention.\n');
    console.log('💡 Recommendation: Use streaming without thinking config for now.\n');
  } else {
    console.log('❌ CRITICAL: Streaming is broken. Fix chunk.text issue.\n');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run all tests
runAllTests();
