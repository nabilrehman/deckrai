/**
 * Test minorEditSlideTool (instruction mode - no mask)
 * Changes the title on the slide
 */

import { minorEditSlideTool } from './tools/minorEditSlide';
import type { MinorEditSlideParams } from './types';
import { readFileSync } from 'fs';

async function testMinorEdit() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Test minorEditSlideTool (Instruction Mode)           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // Read the PDF and convert first page to base64 image
  // Note: This requires the PDF to be converted to PNG first
  // Run: sips -s format png /Users/nabilrehman/Desktop/title_slide.pdf --out /tmp/title_slide.png

  console.log('⚠️  SETUP REQUIRED:');
  console.log('Run this command first to convert PDF to PNG:');
  console.log('sips -s format png /Users/nabilrehman/Desktop/title_slide.pdf --out /tmp/title_slide.png\n');

  // Check if converted image exists
  let imageBuffer: Buffer;
  try {
    imageBuffer = readFileSync('/tmp/title_slide.png');
  } catch (error) {
    console.log('❌ ERROR: /tmp/title_slide.png not found');
    console.log('Please run the setup command above first.\n');
    process.exit(1);
  }

  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:image/png;base64,${base64Image}`;

  console.log(`✅ Loaded slide image (${(imageBuffer.length / 1024).toFixed(1)} KB)\n`);

  // Test: Change title to "BigQuery Workshop for Klick"
  console.log('Test: Changing title to "BigQuery Workshop for Klick"\n');

  const params: MinorEditSlideParams = {
    prompt: 'Change the main headline to say "BigQuery Workshop for Klick" and update the date to "November 2025"',
    base64Image: dataUrl,
    // No mask - using instruction mode
    deepMode: false,
  };

  const result = await minorEditSlideTool.execute(params);

  const executionTime = Date.now() - startTime;

  if (result.success) {
    console.log('✅ SUCCESS\n');
    console.log(`⏱️  Execution time: ${executionTime}ms`);
    console.log(`🎨 Generated ${result.data?.images.length} edited image(s)`);

    if (result.data?.images[0]) {
      console.log('✅ Edited image generated successfully');
      console.log(`   Data URL length: ${result.data.images[0].length} characters\n`);

      // Save the edited image for inspection
      const editedBase64 = result.data.images[0].split(',')[1];
      const editedBuffer = Buffer.from(editedBase64, 'base64');
      const fs = await import('fs');
      fs.writeFileSync('/tmp/title_slide_edited.png', editedBuffer);
      console.log('💾 Saved edited image to: /tmp/title_slide_edited.png\n');
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

testMinorEdit();
