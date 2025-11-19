/**
 * Test createSlideTool
 * Creates a new slide from a text prompt
 */

import { createSlideTool } from './tools/createSlide';
import type { CreateSlideParams } from './types';

async function testCreateSlide() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Test createSlideTool                                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // Test 1: Simple slide without reference
  console.log('Test 1: Creating slide WITHOUT reference...\n');

  const params: CreateSlideParams = {
    detailedPrompt: `Create a title slide for "Deckr.ai - AI-Powered Presentations"

Title: "Deckr.ai"
Subtitle: "Transform Ideas into Beautiful Presentations"
Background: Modern gradient (indigo to purple)
Style: Clean, professional, minimalist
Include: Subtle geometric shapes or patterns`,
    deepMode: false,
  };

  const result = await createSlideTool.execute(params);

  const executionTime = Date.now() - startTime;

  if (result.success) {
    console.log('✅ SUCCESS\n');
    console.log(`⏱️  Execution time: ${executionTime}ms`);
    console.log(`🎨 Generated ${result.data?.images.length} image(s)`);
    console.log(`📋 Prompt used (first 200 chars):`);
    console.log(result.data?.prompts[0]?.substring(0, 200) + '...\n');

    if (result.data?.images[0]) {
      console.log('✅ Image generated successfully');
      console.log(`   Data URL length: ${result.data.images[0].length} characters`);
      console.log(`   Starts with: ${result.data.images[0].substring(0, 50)}...\n`);
    }
  } else {
    console.log('❌ FAILED\n');
    console.log('Error:', result.error);
  }

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Test Complete                                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

// Check API key
if (!process.env.VITE_GEMINI_API_KEY) {
  console.log('❌ ERROR: VITE_GEMINI_API_KEY not set');
  process.exit(1);
}

testCreateSlide();
