/**
 * Test vision tools with real PDF deck
 * Extracts first 3 slides and runs both analyzeSlideTool and analyzeDeckTool
 */

import { analyzeSlideTool } from './tools/analyzeSlide';
import { analyzeDeckTool } from './tools/analyzeDeck';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';

const execAsync = promisify(exec);

async function extractPDFSlide(pdfPath: string, pageNumber: number, outputPath: string): Promise<void> {
  console.log(`📄 Extracting page ${pageNumber} from PDF...`);

  // Use ImageMagick to convert PDF page to PNG
  const cmd = `convert -density 150 "${pdfPath}[${pageNumber - 1}]" -quality 90 "${outputPath}"`;

  try {
    await execAsync(cmd);
    console.log(`✅ Extracted to ${outputPath}`);
  } catch (error: any) {
    throw new Error(`Failed to extract PDF page: ${error.message}`);
  }
}

async function testPDFVision(pdfPath: string) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  PDF Vision Test Suite                                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`📁 PDF: ${pdfPath}\n`);

  // Extract first 3 slides
  const slideCount = 3;
  const slides: Array<{ id: string; name: string; src: string }> = [];

  for (let i = 1; i <= slideCount; i++) {
    const outputPath = `/tmp/test-slide-${i}.png`;

    try {
      await extractPDFSlide(pdfPath, i, outputPath);

      // Read as base64
      const imageBuffer = readFileSync(outputPath);
      const base64Image = imageBuffer.toString('base64');
      const dataUrl = `data:image/png;base64,${base64Image}`;

      slides.push({
        id: `slide${i}`,
        name: `Slide ${i}`,
        src: dataUrl
      });

      console.log(`✅ Slide ${i} loaded (${(imageBuffer.length / 1024).toFixed(1)} KB)\n`);
    } catch (error: any) {
      console.log(`❌ Failed to extract slide ${i}: ${error.message}\n`);
      break;
    }
  }

  if (slides.length === 0) {
    console.log('❌ No slides extracted. Exiting.');
    return;
  }

  // Test 1: Analyze first slide
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Analyze First Slide (FULL analysis)');
  console.log('='.repeat(60) + '\n');

  const slideResult = await analyzeSlideTool.execute({
    slideSrc: slides[0].src,
    slideNumber: 1,
    analysisGoal: 'full'
  });

  if (slideResult.success) {
    console.log('✅ SUCCESS');
    console.log(`⏱️  Execution time: ${slideResult.metadata?.executionTime}ms`);
    console.log('\n📊 SLIDE ANALYSIS:');
    console.log(JSON.stringify(slideResult.data, null, 2));
  } else {
    console.log('❌ FAILED');
    console.log('Error:', slideResult.error);
  }

  // Test 2: Analyze entire deck (if we have multiple slides)
  if (slides.length > 1) {
    console.log('\n' + '='.repeat(60));
    console.log(`TEST 2: Analyze Entire Deck (${slides.length} slides)`);
    console.log('='.repeat(60) + '\n');

    const deckResult = await analyzeDeckTool.execute({
      slides: slides,
      analysisGoal: 'full'
    });

    if (deckResult.success) {
      console.log('✅ SUCCESS');
      console.log(`⏱️  Execution time: ${deckResult.metadata?.executionTime}ms`);
      console.log('\n📊 DECK ANALYSIS:');
      console.log(JSON.stringify(deckResult.data, null, 2));
    } else {
      console.log('❌ FAILED');
      console.log('Error:', deckResult.error);
    }
  }

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Tests Complete                                        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

// Check for ImageMagick
exec('which convert', (error) => {
  if (error) {
    console.log('❌ ERROR: ImageMagick not found');
    console.log('Please install it: brew install imagemagick');
    process.exit(1);
  }

  // Check API key
  if (!process.env.VITE_GEMINI_API_KEY) {
    console.log('❌ ERROR: VITE_GEMINI_API_KEY not set');
    process.exit(1);
  }

  // Get PDF path
  const pdfPath = process.argv[2] || '/Users/nabilrehman/Downloads/deckr-ai-presentation (24).pdf';

  if (!existsSync(pdfPath)) {
    console.log(`❌ ERROR: PDF not found at ${pdfPath}`);
    process.exit(1);
  }

  // Run tests
  testPDFVision(pdfPath);
});
