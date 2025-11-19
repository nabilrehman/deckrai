/**
 * Test analyzeSlideTool with a real presentation slide
 */

import { analyzeSlideTool } from './tools/analyzeSlide';
import { readFileSync } from 'fs';

async function testRealSlide(imagePath: string) {
  console.log('\n🧪 Testing analyzeSlideTool with real slide...\n');
  console.log(`📁 Image path: ${imagePath}`);

  try {
    // Read image and convert to base64
    const imageBuffer = readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    console.log(`✅ Image loaded (${imageBuffer.length} bytes)`);
    console.log(`🎨 MIME type: ${mimeType}\n`);

    // Test with different analysis goals
    const goals: Array<'quick' | 'full' | 'content-only' | 'visual-only'> = [
      'full',
      'content-only',
      'visual-only'
    ];

    for (const goal of goals) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing with goal: ${goal.toUpperCase()}`);
      console.log('='.repeat(60));

      const result = await analyzeSlideTool.execute({
        slideSrc: dataUrl,
        slideNumber: 1,
        analysisGoal: goal
      });

      if (result.success) {
        console.log('\n✅ SUCCESS');
        console.log(`⏱️  Execution time: ${result.metadata?.executionTime}ms`);
        console.log('\n📊 ANALYSIS RESULTS:');
        console.log(JSON.stringify(result.data, null, 2));
      } else {
        console.log('\n❌ FAILED');
        console.log('Error:', result.error);
      }
    }

  } catch (error: any) {
    console.log('\n❌ ERROR:', error.message);
    console.log('\nStack trace:', error.stack);
  }
}

// Get image path from command line
const imagePath = process.argv[2];

if (!imagePath) {
  console.log('Usage: npx tsx server/test-real-slide.ts <path-to-image>');
  console.log('\nExample:');
  console.log('  npx tsx server/test-real-slide.ts /path/to/slide.png');
  process.exit(1);
}

// Set API key
if (!process.env.VITE_GEMINI_API_KEY) {
  console.log('❌ ERROR: VITE_GEMINI_API_KEY environment variable not set');
  process.exit(1);
}

testRealSlide(imagePath);
