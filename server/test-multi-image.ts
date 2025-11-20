/**
 * Test minorEditSlideTool with multi-image support
 * Tests adding a logo using additionalImages parameter
 */

import { minorEditSlideTool } from './tools/minorEditSlide';
import type { MinorEditSlideParams } from './types';
import { readFileSync } from 'fs';

async function testMultiImageEdit() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Test Multi-Image Support (minorEditSlideTool)        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // Load the slide
  console.log('Loading slide image...');
  let slideBuffer: Buffer;
  try {
    slideBuffer = readFileSync('/tmp/title_slide.png');
  } catch (error) {
    console.log('❌ ERROR: /tmp/title_slide.png not found');
    console.log('Please run: sips -s format png /Users/nabilrehman/Desktop/title_slide.pdf --out /tmp/title_slide.png\n');
    process.exit(1);
  }

  const slideDataUrl = `data:image/png;base64,${slideBuffer.toString('base64')}`;
  console.log(`✅ Loaded slide (${(slideBuffer.length / 1024).toFixed(1)} KB)\n`);

  // Load a logo (let's create a simple one or use an existing one)
  // For testing, we'll use the Google Cloud logo from the slide itself
  // In a real scenario, this would be a separate logo file
  console.log('Loading logo image...');
  const logoBuffer = slideBuffer; // Using same image for testing
  const logoDataUrl = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  console.log(`✅ Loaded logo (${(logoBuffer.length / 1024).toFixed(1)} KB)\n`);

  // Test: Add logo and change title using multi-image support
  console.log('Test: Add logo to top right and change title\n');
  console.log('This test demonstrates:');
  console.log('- Using additionalImages parameter');
  console.log('- Gemini 2.5 Flash processing multiple images');
  console.log('- Adding specific visual elements from provided images\n');

  const params: MinorEditSlideParams = {
    prompt: 'Add a Google Cloud logo (from the provided logo image) to the top right corner and change the main headline to "BigQuery Workshop for Klick"',
    base64Image: slideDataUrl,
    // NEW: Using additionalImages parameter
    additionalImages: [
      {
        image: logoDataUrl,
        label: 'Google Cloud logo to add to slide',
      },
    ],
    deepMode: false,
  };

  console.log('Parameters:');
  console.log(`- Prompt: ${params.prompt}`);
  console.log(`- Additional Images: ${params.additionalImages?.length || 0}`);
  console.log(`- Deep Mode: ${params.deepMode}\n`);

  console.log('Calling minorEditSlideTool...\n');

  const result = await minorEditSlideTool.execute(params);

  const executionTime = Date.now() - startTime;

  if (result.success) {
    console.log('✅ SUCCESS\n');
    console.log(`⏱️  Execution time: ${executionTime}ms`);
    console.log(`🎨 Generated ${result.data?.images.length} edited image(s)`);
    console.log(`📊 Model: ${result.metadata?.model}`);

    if (result.data?.images[0]) {
      console.log('✅ Edited image generated successfully');
      console.log(`   Data URL length: ${result.data.images[0].length} characters\n`);

      // Save the edited image for inspection
      const editedBase64 = result.data.images[0].split(',')[1];
      const editedBuffer = Buffer.from(editedBase64, 'base64');
      const fs = await import('fs');
      fs.writeFileSync('/tmp/title_slide_multi_image_test.png', editedBuffer);
      console.log('💾 Saved edited image to: /tmp/title_slide_multi_image_test.png\n');

      console.log('🔍 Please inspect the output image to verify:');
      console.log('   1. Title changed to "BigQuery Workshop for Klick"');
      console.log('   2. Logo was added to top right corner');
      console.log('   3. Original design preserved\n');
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

testMultiImageEdit();
