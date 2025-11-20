/**
 * Test analyzeSlideTool with Gemini 3.0
 * Tests slide review and quality assessment
 */

import { analyzeSlideTool } from './tools/analyzeSlide';
import { readFileSync } from 'fs';

async function testAnalyzer() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Test Slide Analyzer (Gemini 3.0)                     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const startTime = Date.now();

  // Load the multi-image test result
  console.log('Loading slide to analyze...');
  let slideBuffer: Buffer;
  try {
    slideBuffer = readFileSync('/tmp/title_slide_multi_image_test.png');
  } catch (error) {
    console.log('❌ ERROR: /tmp/title_slide_multi_image_test.png not found');
    console.log('Using original slide instead...');
    try {
      slideBuffer = readFileSync('/tmp/title_slide.png');
    } catch (error2) {
      console.log('❌ ERROR: No slides found to analyze');
      process.exit(1);
    }
  }

  const slideDataUrl = `data:image/png;base64,${slideBuffer.toString('base64')}`;
  console.log(`✅ Loaded slide (${(slideBuffer.length / 1024).toFixed(1)} KB)\n`);

  // Test different analysis modes
  const modes: Array<'quick' | 'full' | 'content-only' | 'visual-only'> = [
    'quick',
    'full',
  ];

  for (const mode of modes) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing ${mode.toUpperCase()} analysis`);
    console.log('='.repeat(60));

    const result = await analyzeSlideTool.execute({
      slideSrc: slideDataUrl,
      slideNumber: 1,
      analysisGoal: mode,
    });

    if (result.success && result.data) {
      const analysis = result.data;

      console.log(`\n✅ Analysis successful (${result.metadata?.executionTime}ms)\n`);
      console.log(`📊 Quality Score: ${analysis.qualityScore}/10`);
      console.log(`📈 Status: ${analysis.status}`);
      console.log(`📁 Category: ${analysis.category}`);
      console.log(`📝 Text Density: ${analysis.textDensity}`);
      console.log(`🎨 Layout: ${analysis.layout}`);

      if (analysis.colorScheme && analysis.colorScheme.length > 0) {
        console.log(`🎨 Colors: ${analysis.colorScheme.join(', ')}`);
      }

      if (analysis.visualElements && analysis.visualElements.length > 0) {
        console.log(`👁️  Visual Elements: ${analysis.visualElements.join(', ')}`);
      }

      if (analysis.strengths && analysis.strengths.length > 0) {
        console.log(`\n✨ Strengths:`);
        analysis.strengths.forEach((s, i) => console.log(`   ${i + 1}. ${s}`));
      }

      if (analysis.issues && analysis.issues.length > 0) {
        console.log(`\n⚠️  Issues:`);
        analysis.issues.forEach((issue, i) => {
          console.log(`   ${i + 1}. [${issue.severity}] ${issue.type}`);
          console.log(`      Problem: ${issue.description}`);
          console.log(`      Fix: ${issue.recommendation}`);
        });
      }

      if (analysis.improvements && analysis.improvements.length > 0) {
        console.log(`\n🔧 Improvements:`);
        analysis.improvements.forEach((imp, i) => console.log(`   ${i + 1}. ${imp}`));
      }

      if (analysis.suggestions && analysis.suggestions.length > 0) {
        console.log(`\n💡 Suggestions:`);
        analysis.suggestions.forEach((sug, i) => console.log(`   ${i + 1}. ${sug}`));
      }
    } else {
      console.log(`\n❌ Analysis failed:`, result.error);
    }

    // Wait a bit between requests
    if (mode !== modes[modes.length - 1]) {
      console.log('\n⏳ Waiting 2 seconds before next analysis...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  const totalTime = Date.now() - startTime;

  console.log(`\n\n╔════════════════════════════════════════════════════════╗`);
  console.log(`║  All Tests Complete (${totalTime}ms total)             ║`);
  console.log(`╚════════════════════════════════════════════════════════╝\n`);
}

// Check API key
if (!process.env.VITE_GEMINI_API_KEY) {
  console.log('❌ ERROR: VITE_GEMINI_API_KEY not set');
  process.exit(1);
}

testAnalyzer();
