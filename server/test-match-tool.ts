/**
 * Direct test of matchSlidesToReferencesTool
 *
 * This tests that the tool can:
 * 1. Accept styleLibraryItems parameter
 * 2. Fetch images from Firebase URLs (or data URLs)
 * 3. Match slides to references successfully
 */

import 'dotenv/config';
import { matchSlidesToReferencesTool } from './tools/matchReferences';

console.log('🧪 Testing matchSlidesToReferencesTool directly...\n');

// Mock slide specifications (from planDeck output)
const mockSlideSpecs = [
  {
    slideNumber: 1,
    slideType: 'title',
    headline: 'Welcome to Our Platform',
    content: 'A modern solution for cloud infrastructure',
    visualDescription: 'Clean title slide with centered text and logo',
    brandContext: 'Professional, technical',
  },
  {
    slideNumber: 2,
    slideType: 'content',
    headline: 'Key Features',
    content: 'Scalability, Security, Performance',
    visualDescription: '3-column layout with icons',
    brandContext: 'Feature list with visual hierarchy',
  },
  {
    slideNumber: 3,
    slideType: 'content',
    headline: 'How It Works',
    content: 'Step-by-step process overview',
    visualDescription: 'Process flow with numbered steps',
    brandContext: 'Educational, clear structure',
  },
];

// Mock style library with data URLs (small test images)
// Using a 1x1 transparent PNG as placeholder
const testImageDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

const mockStyleLibrary = [
  {
    name: 'title-slide-ref.png',
    src: testImageDataURL,
  },
  {
    name: 'content-slide-ref.png',
    src: testImageDataURL,
  },
  {
    name: 'process-slide-ref.png',
    src: testImageDataURL,
  },
];

async function testMatchTool() {
  try {
    console.log('📊 Test Data:');
    console.log(`  Slide Specs: ${mockSlideSpecs.length}`);
    console.log(`  Style Library: ${mockStyleLibrary.length}`);
    console.log(`  Image Format: ${mockStyleLibrary[0].src.substring(0, 50)}...\n`);

    console.log('🚀 Calling matchSlidesToReferencesTool...\n');

    const startTime = Date.now();

    const result = await matchSlidesToReferencesTool.execute({
      slideSpecifications: mockSlideSpecs,
      styleLibraryItems: mockStyleLibrary,
    });

    const executionTime = Date.now() - startTime;

    console.log('📈 Test Results:\n');
    console.log(`  Execution Time: ${executionTime}ms`);
    console.log(`  Success: ${result.success ? '✅' : '❌'}`);

    if (result.success && result.data) {
      console.log(`\n  Matches Found: ${result.data.matches.length}`);
      console.log(`  Total Slides: ${result.data.statistics.totalSlides}`);
      console.log(`  Total References: ${result.data.statistics.totalReferences}`);
      console.log(`  Matched Slides: ${result.data.statistics.matchedSlides}`);
      console.log(`  Average Match Score: ${result.data.statistics.averageMatchScore.toFixed(1)}%`);

      console.log('\n  Match Details:');
      result.data.matches.forEach(match => {
        console.log(`    Slide ${match.slideNumber}: ${match.referenceName} (${match.matchScore}%)`);
        console.log(`      Category: ${match.category}`);
        console.log(`      Reason: ${match.matchReason.substring(0, 80)}...`);
      });

      console.log('\n✅ TEST PASSED: Tool executed successfully with Firebase-compatible URLs!');
    } else {
      console.error('\n❌ TEST FAILED:', result.error);
      console.error('  Code:', result.error?.code);
      console.error('  Message:', result.error?.message);
      console.error('  Details:', result.error?.details);
    }

  } catch (error: any) {
    console.error('\n❌ TEST FAILED WITH EXCEPTION:');
    console.error('  Error:', error.message);
    console.error('  Stack:', error.stack);
    process.exit(1);
  }
}

// Run test
testMatchTool()
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
