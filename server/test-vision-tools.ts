/**
 * Test Script for Vision Tools (Phase 2)
 *
 * Tests analyzeSlideTool and analyzeDeckTool independently
 * before integrating with the coordinator agent
 */

import { analyzeSlideTool } from './tools/analyzeSlide';
import { analyzeDeckTool } from './tools/analyzeDeck';

// Test data: sample slide in base64 (you'll need to provide a real slide image)
const sampleSlideBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testAnalyzeSlideTool() {
  console.log('\n🧪 Testing analyzeSlideTool...\n');

  try {
    const result = await analyzeSlideTool.execute({
      slideSrc: sampleSlideBase64,
      slideNumber: 1,
      analysisGoal: 'full'
    });

    if (result.success) {
      console.log('✅ analyzeSlideTool SUCCESS');
      console.log('📊 Analysis data:', JSON.stringify(result.data, null, 2));
      console.log(`⏱️  Execution time: ${result.metadata?.executionTime}ms`);
      console.log(`🤖 Model: ${result.metadata?.model}`);
    } else {
      console.log('❌ analyzeSlideTool FAILED');
      console.log('Error:', result.error);
    }
  } catch (error: any) {
    console.log('❌ analyzeSlideTool EXCEPTION:', error.message);
  }
}

async function testAnalyzeDeckTool() {
  console.log('\n🧪 Testing analyzeDeckTool...\n');

  // Sample deck with 3 slides
  const sampleDeck = [
    { id: 'slide1', name: 'Title Slide', src: sampleSlideBase64 },
    { id: 'slide2', name: 'Problem Slide', src: sampleSlideBase64 },
    { id: 'slide3', name: 'Solution Slide', src: sampleSlideBase64 }
  ];

  try {
    const result = await analyzeDeckTool.execute({
      slides: sampleDeck,
      analysisGoal: 'structure'
    });

    if (result.success) {
      console.log('✅ analyzeDeckTool SUCCESS');
      console.log('📊 Deck analysis:', JSON.stringify(result.data, null, 2));
      console.log(`⏱️  Execution time: ${result.metadata?.executionTime}ms`);
      console.log(`🤖 Model: ${result.metadata?.model}`);
    } else {
      console.log('❌ analyzeDeckTool FAILED');
      console.log('Error:', result.error);
    }
  } catch (error: any) {
    console.log('❌ analyzeDeckTool EXCEPTION:', error.message);
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Phase 2 Vision Tools Test Suite                      ║');
  console.log('╚════════════════════════════════════════════════════════╝');

  // Check for API key
  if (!process.env.VITE_GEMINI_API_KEY) {
    console.log('\n❌ ERROR: VITE_GEMINI_API_KEY environment variable not set');
    console.log('Please set it before running tests:\n');
    console.log('export VITE_GEMINI_API_KEY="your-key-here"\n');
    process.exit(1);
  }

  console.log('✅ API key found');
  console.log(`🔑 Key: ${process.env.VITE_GEMINI_API_KEY.substring(0, 20)}...`);

  // Note about test data
  console.log('\n⚠️  NOTE: Using 1x1 pixel test image');
  console.log('For real testing, replace sampleSlideBase64 with actual slide images\n');

  // Run tests
  await testAnalyzeSlideTool();
  await testAnalyzeDeckTool();

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Tests Complete                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
