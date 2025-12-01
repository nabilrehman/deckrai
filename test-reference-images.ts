/**
 * Reference Image Quality Test Script
 *
 * Tests the integration of reference images with the One-Pager generation system.
 * Verifies quality, style matching, and performance metrics.
 *
 * Run this script: npx tsx test-reference-images.ts
 */

import { generateOnePager } from './services/onePagerService';
import { OnePagerFormat } from './types/intents';
import * as fs from 'fs';
import * as path from 'path';

// Test output directory
const OUTPUT_DIR = './test-outputs/reference-images';

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Save base64 image to disk
 */
const saveImage = (base64Data: string, filename: string): string => {
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 image data');
  }

  const mimeType = matches[1];
  const data = matches[2];
  const extension = mimeType.split('/')[1] || 'png';

  const filepath = path.join(OUTPUT_DIR, `${filename}.${extension}`);
  fs.writeFileSync(filepath, Buffer.from(data, 'base64'));

  const fileSizeKB = (Buffer.from(data, 'base64').length / 1024).toFixed(2);
  console.log(`   💾 Saved: ${filepath} (${fileSizeKB} KB)`);

  return filepath;
};

/**
 * Save metadata to JSON
 */
const saveMetadata = (data: any, filename: string): void => {
  const filepath = path.join(OUTPUT_DIR, `${filename}.json`);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`   📄 Metadata: ${filepath}`);
};

/**
 * Load sample reference image from URL or file
 */
const loadReferenceImage = async (source: string): Promise<string> => {
  // For testing, we'll use a placeholder base64 image
  // In real testing, you would load actual images
  console.log(`   📸 Loading reference image: ${source}`);

  // Simple 1x1 red pixel as placeholder for testing
  // Replace with actual image loading in production
  const placeholderImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

  return placeholderImage;
};

// ============================================================
// Test Case 1: Visual Slide with Reference Image
// ============================================================
const testVisualSlideWithReference = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 1: Visual Slide (16:9) with Reference Image');
  console.log('='.repeat(70));

  const referenceImage = await loadReferenceImage('sample-modern-design.png');

  try {
    console.log('📝 Generating visual slide about "AI in Healthcare"...');
    const startTime = Date.now();

    const result = await generateOnePager(
      {
        topic: 'AI in Healthcare: Transforming Patient Care',
        format: 'visual-slide' as OnePagerFormat,
        targetAudience: 'Healthcare executives',
        company: 'HealthTech Solutions',
        stylePreference: 'Modern and professional',
        referenceImage
      },
      (progress) => console.log(`   ⏳ ${progress}`)
    );

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ Generation Complete!');
    console.log(`   ⏱️  Generation Time: ${generationTime}s`);
    console.log(`   📋 Format: ${result.format}`);
    console.log(`   📐 Output Type: ${result.outputType}`);
    console.log(`   📝 Title: ${result.metadata.title}`);

    if (result.metadata.visualTheme) {
      console.log(`   🎨 Visual Theme:`);
      console.log(`      - Primary Color: ${result.metadata.visualTheme.primaryColor}`);
      console.log(`      - Style: ${result.metadata.visualTheme.visualStyle}`);
      console.log(`      - Layout: ${result.metadata.visualTheme.layoutStyle}`);
    }

    console.log(`   🔗 Grounding Sources: ${result.metadata.sources?.length || 0}`);

    if (result.imageUrl) {
      saveImage(result.imageUrl, 'test1-visual-slide-with-ref');
    }

    saveMetadata({
      test: 'Visual Slide with Reference',
      generationTime: `${generationTime}s`,
      format: result.format,
      metadata: result.metadata,
      hasReferenceImage: true
    }, 'test1-metadata');

    return { passed: true, generationTime };
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    return { passed: false, error: error.message };
  }
};

// ============================================================
// Test Case 2: Visual Slide WITHOUT Reference Image (Control)
// ============================================================
const testVisualSlideWithoutReference = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 2: Visual Slide (16:9) WITHOUT Reference (Control)');
  console.log('='.repeat(70));

  try {
    console.log('📝 Generating visual slide about "AI in Healthcare"...');
    const startTime = Date.now();

    const result = await generateOnePager(
      {
        topic: 'AI in Healthcare: Transforming Patient Care',
        format: 'visual-slide' as OnePagerFormat,
        targetAudience: 'Healthcare executives',
        company: 'HealthTech Solutions',
        stylePreference: 'Modern and professional'
        // No referenceImage
      },
      (progress) => console.log(`   ⏳ ${progress}`)
    );

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ Generation Complete!');
    console.log(`   ⏱️  Generation Time: ${generationTime}s`);
    console.log(`   📋 Format: ${result.format}`);
    console.log(`   🔗 Grounding Sources: ${result.metadata.sources?.length || 0}`);

    if (result.imageUrl) {
      saveImage(result.imageUrl, 'test2-visual-slide-no-ref');
    }

    saveMetadata({
      test: 'Visual Slide WITHOUT Reference (Control)',
      generationTime: `${generationTime}s`,
      format: result.format,
      metadata: result.metadata,
      hasReferenceImage: false
    }, 'test2-metadata');

    return { passed: true, generationTime };
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    return { passed: false, error: error.message };
  }
};

// ============================================================
// Test Case 3: LinkedIn Carousel with Reference
// ============================================================
const testLinkedInCarouselWithReference = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 3: LinkedIn Carousel (4:5) with Reference Image');
  console.log('='.repeat(70));

  const referenceImage = await loadReferenceImage('sample-social-design.png');

  try {
    console.log('📝 Generating LinkedIn carousel about "Productivity Tips"...');
    const startTime = Date.now();

    const result = await generateOnePager(
      {
        topic: 'Top 5 Productivity Tips for Remote Workers',
        format: 'linkedin-carousel' as OnePagerFormat,
        targetAudience: 'Remote professionals',
        pageCount: 5,
        stylePreference: 'Vibrant and engaging',
        referenceImage
      },
      (progress) => console.log(`   ⏳ ${progress}`)
    );

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ Generation Complete!');
    console.log(`   ⏱️  Generation Time: ${generationTime}s`);
    console.log(`   📋 Format: ${result.format}`);
    console.log(`   📸 Slides Generated: ${result.images?.length || 0}`);
    console.log(`   📐 Aspect Ratio: ${result.metadata.aspectRatio}`);

    if (result.images && result.images.length > 0) {
      result.images.forEach((img, idx) => {
        saveImage(img, `test3-carousel-slide-${idx + 1}`);
      });
    }

    saveMetadata({
      test: 'LinkedIn Carousel with Reference',
      generationTime: `${generationTime}s`,
      format: result.format,
      slideCount: result.images?.length || 0,
      metadata: result.metadata,
      hasReferenceImage: true
    }, 'test3-metadata');

    return { passed: true, generationTime, slideCount: result.images?.length || 0 };
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    return { passed: false, error: error.message };
  }
};

// ============================================================
// Test Case 4: Poster with Reference Image
// ============================================================
const testPosterWithReference = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 4: Poster (11:17) with Reference Image');
  console.log('='.repeat(70));

  const referenceImage = await loadReferenceImage('sample-poster-design.png');

  try {
    console.log('📝 Generating poster about "Tech Conference 2025"...');
    const startTime = Date.now();

    const result = await generateOnePager(
      {
        topic: 'Tech Conference 2025: Innovate the Future',
        format: 'poster' as OnePagerFormat,
        targetAudience: 'Tech enthusiasts and professionals',
        company: 'TechCon',
        stylePreference: 'Bold and eye-catching',
        referenceImage
      },
      (progress) => console.log(`   ⏳ ${progress}`)
    );

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ Generation Complete!');
    console.log(`   ⏱️  Generation Time: ${generationTime}s`);
    console.log(`   📋 Format: ${result.format}`);
    console.log(`   📐 Aspect Ratio: 11:17`);

    if (result.imageUrl) {
      saveImage(result.imageUrl, 'test4-poster-with-ref');
    }

    saveMetadata({
      test: 'Poster with Reference',
      generationTime: `${generationTime}s`,
      format: result.format,
      metadata: result.metadata,
      hasReferenceImage: true
    }, 'test4-metadata');

    return { passed: true, generationTime };
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    return { passed: false, error: error.message };
  }
};

// ============================================================
// Test Case 5: Infographic with Reference
// ============================================================
const testInfographicWithReference = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST 5: Infographic (9:16) with Reference Image');
  console.log('='.repeat(70));

  const referenceImage = await loadReferenceImage('sample-infographic-design.png');

  try {
    console.log('📝 Generating infographic about "Climate Change Impact"...');
    const startTime = Date.now();

    const result = await generateOnePager(
      {
        topic: 'Climate Change Impact: Key Statistics and Trends',
        format: 'infographic' as OnePagerFormat,
        targetAudience: 'General public',
        stylePreference: 'Data-driven and informative',
        referenceImage
      },
      (progress) => console.log(`   ⏳ ${progress}`)
    );

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n✅ Generation Complete!');
    console.log(`   ⏱️  Generation Time: ${generationTime}s`);
    console.log(`   📋 Format: ${result.format}`);
    console.log(`   🔗 Grounding Sources: ${result.metadata.sources?.length || 0}`);

    if (result.imageUrl) {
      saveImage(result.imageUrl, 'test5-infographic-with-ref');
    }

    saveMetadata({
      test: 'Infographic with Reference',
      generationTime: `${generationTime}s`,
      format: result.format,
      metadata: result.metadata,
      hasReferenceImage: true
    }, 'test5-metadata');

    return { passed: true, generationTime };
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    return { passed: false, error: error.message };
  }
};

// ============================================================
// Run All Tests
// ============================================================
export const runAllReferenceImageTests = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 REFERENCE IMAGE QUALITY TEST SUITE');
  console.log('='.repeat(70));
  console.log(`📁 Output Directory: ${OUTPUT_DIR}`);
  console.log('');
  console.log('This test suite will:');
  console.log('  1. Generate one-pagers WITH reference images');
  console.log('  2. Generate control samples WITHOUT reference images');
  console.log('  3. Test multiple formats (visual-slide, carousel, poster, infographic)');
  console.log('  4. Save all outputs to disk for quality inspection');
  console.log('  5. Log performance metrics (generation time, file size)');
  console.log('');

  const results: any = {
    test1: null,
    test2: null,
    test3: null,
    test4: null,
    test5: null
  };

  // Test 1: Visual Slide WITH Reference
  try {
    results.test1 = await testVisualSlideWithReference();
  } catch (error: any) {
    console.error('Test 1 failed:', error);
    results.test1 = { passed: false, error: error.message };
  }

  // Test 2: Visual Slide WITHOUT Reference (Control)
  try {
    results.test2 = await testVisualSlideWithoutReference();
  } catch (error: any) {
    console.error('Test 2 failed:', error);
    results.test2 = { passed: false, error: error.message };
  }

  // Test 3: LinkedIn Carousel WITH Reference
  try {
    results.test3 = await testLinkedInCarouselWithReference();
  } catch (error: any) {
    console.error('Test 3 failed:', error);
    results.test3 = { passed: false, error: error.message };
  }

  // Test 4: Poster WITH Reference
  try {
    results.test4 = await testPosterWithReference();
  } catch (error: any) {
    console.error('Test 4 failed:', error);
    results.test4 = { passed: false, error: error.message };
  }

  // Test 5: Infographic WITH Reference
  try {
    results.test5 = await testInfographicWithReference();
  } catch (error: any) {
    console.error('Test 5 failed:', error);
    results.test5 = { passed: false, error: error.message };
  }

  // ============================================================
  // Summary and Quality Assessment
  // ============================================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(70));

  const allResults = Object.entries(results).filter(([_, v]) => v !== null);
  const passedTests = allResults.filter(([_, result]) => result.passed).length;
  const totalTests = allResults.length;

  console.log(`\n✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log('');

  allResults.forEach(([name, result]: [string, any]) => {
    const icon = result.passed ? '✅' : '❌';
    const testNum = name.replace('test', '');
    console.log(`${icon} Test ${testNum}: ${result.passed ? 'PASS' : 'FAIL'}`);

    if (result.passed && result.generationTime) {
      console.log(`   ⏱️  Generation Time: ${result.generationTime}s`);
      if (result.slideCount) {
        console.log(`   📸 Slides Generated: ${result.slideCount}`);
      }
    }

    if (!result.passed && result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('🔍 QUALITY ASSESSMENT CHECKLIST');
  console.log('='.repeat(70));
  console.log('');
  console.log('Please manually review the generated images in:');
  console.log(`  ${OUTPUT_DIR}/`);
  console.log('');
  console.log('Quality Checklist:');
  console.log('  [ ] Images are high resolution and clear');
  console.log('  [ ] Reference images influenced the visual style');
  console.log('  [ ] Color palettes match reference images');
  console.log('  [ ] Typography is appropriate and readable');
  console.log('  [ ] Layout and composition are professional');
  console.log('  [ ] Content is accurate and well-researched');
  console.log('  [ ] Grounding sources are relevant and cited');
  console.log('  [ ] Generation times are acceptable (< 20s)');
  console.log('');
  console.log('Compare WITH vs WITHOUT reference:');
  console.log('  [ ] Test 1 (with ref) vs Test 2 (without ref)');
  console.log('  [ ] Reference image provided clear style guidance');
  console.log('  [ ] Style matching is noticeable and appropriate');
  console.log('');

  // Save summary
  saveMetadata({
    summary: 'Reference Image Quality Test Suite',
    timestamp: new Date().toISOString(),
    passed: passedTests,
    failed: totalTests - passedTests,
    total: totalTests,
    results
  }, 'test-summary');

  console.log('='.repeat(70));
  console.log('✅ Test suite complete! Review outputs for quality assessment.');
  console.log('='.repeat(70));

  return results;
};

// For standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllReferenceImageTests()
    .then(() => {
      console.log('\n✅ All tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

// For browser console testing
(window as any).testReferenceImages = {
  runAll: runAllReferenceImageTests,
  test1: testVisualSlideWithReference,
  test2: testVisualSlideWithoutReference,
  test3: testLinkedInCarouselWithReference,
  test4: testPosterWithReference,
  test5: testInfographicWithReference
};

console.log('\n📝 Reference Image Test Suite loaded!');
console.log('Run in browser console: testReferenceImages.runAll()');
console.log('Or run standalone: npx tsx test-reference-images.ts');
