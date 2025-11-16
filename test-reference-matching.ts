/**
 * Test script for Reference Matching System
 *
 * Tests the three core services:
 * 1. Deep Reference Analyzer
 * 2. Reference Matching Engine
 * 3. Strategy Decider
 */

import { analyzeReferenceSlide } from './services/deepReferenceAnalyzer';
import { matchReferencesToSlides } from './services/referenceMatchingEngine';
import { decideGenerationStrategy } from './services/referenceStrategyDecider';
import type { SlideSpecification } from './services/referenceMatchingEngine';
import type { StyleLibraryItem } from './services/referenceMatchingEngine';

// Test data: Simulating a Google Cloud presentation
const testSlideSpecs: SlideSpecification[] = [
  {
    slideNumber: 1,
    slideType: 'title',
    headline: 'AI-Powered Development Hackathon',
    content: 'Building the Future with Gemini and Vertex AI',
    visualDescription: 'Modern tech-focused title slide with clean layout',
    brandContext: 'Google Cloud branding - professional and innovative',
  },
  {
    slideNumber: 2,
    slideType: 'content',
    headline: 'Agenda',
    content: 'Overview, BigQuery ML, Vertex AI, Conversational Analytics, Gemini CLI, Resources',
    visualDescription: 'Clean agenda layout with numbered list',
  },
  {
    slideNumber: 3,
    slideType: 'content',
    headline: 'BigQuery ML Overview',
    content: 'Train and deploy ML models directly in BigQuery. No data movement required. SQL-based workflow.',
    visualDescription: 'Content slide with technical architecture diagram',
    dataVisualization: 'Architecture diagram showing BigQuery ML pipeline',
  },
];

// Test reference (using placeholder - in real test, use actual Google Cloud PDF page)
const testReferences: StyleLibraryItem[] = [
  {
    name: 'google-cloud-title.png',
    src: '/test-reference-1.png', // Placeholder - replace with actual PDF page export
    type: 'image',
  },
  {
    name: 'google-cloud-agenda.png',
    src: '/test-reference-2.png', // Placeholder
    type: 'image',
  },
  {
    name: 'google-cloud-content.png',
    src: '/test-reference-3.png', // Placeholder
    type: 'image',
  },
];

async function testReferenceMatchingSystem() {
  console.log('🧪 Testing Reference Matching System\n');
  console.log('═'.repeat(80));

  try {
    // Test 1: Deep Reference Analysis
    console.log('\n📊 TEST 1: Deep Reference Analysis');
    console.log('─'.repeat(80));
    console.log('Analyzing first reference slide...\n');

    const blueprint = await analyzeReferenceSlide(
      testReferences[0].src,
      'This will be used for a title slide about an AI hackathon'
    );

    console.log('✅ Blueprint extracted successfully!');
    console.log('Background type:', blueprint.background.type);
    console.log('Background complexity:', blueprint.background.complexity);
    console.log('Generation strategy:', blueprint.generationStrategy.approach);
    console.log('Strategy confidence:', blueprint.generationStrategy.confidence);
    console.log('\nTypography:');
    console.log('- Headline font:', blueprint.typography.headline.font);
    console.log('- Headline size:', blueprint.typography.headline.size);
    console.log('- Headline color:', blueprint.typography.headline.color);
    console.log('\nLayout structure:', blueprint.contentLayout.structure);
    console.log('Whitespace percentage:', blueprint.contentLayout.whitespacePercentage, '%');

    // Test 2: Reference Matching
    console.log('\n\n🎯 TEST 2: Reference Matching Engine');
    console.log('─'.repeat(80));
    console.log(`Matching ${testSlideSpecs.length} slides to ${testReferences.length} references...\n`);

    const matchMap = await matchReferencesToSlides(testSlideSpecs, testReferences);

    console.log('✅ Matching completed successfully!');
    console.log(`Total matches: ${matchMap.size}\n`);

    matchMap.forEach((matchData, slideNumber) => {
      console.log(`Slide ${slideNumber}:`);
      console.log(`- Reference: ${matchData.match.referenceName}`);
      console.log(`- Match score: ${matchData.match.matchScore}/100`);
      console.log(`- Category: ${matchData.match.category}`);
      console.log(`- Reason: ${matchData.match.matchReason}`);
      console.log('');
    });

    // Test 3: Strategy Decision
    console.log('\n⚡ TEST 3: Strategy Decider');
    console.log('─'.repeat(80));
    console.log('Deciding generation strategy for first slide...\n');

    const firstMatch = matchMap.get(1);
    if (firstMatch) {
      const strategy = await decideGenerationStrategy(
        testSlideSpecs[0],
        firstMatch.blueprint,
        firstMatch.match.referenceSrc
      );

      console.log('✅ Strategy decision made!');
      console.log('Strategy:', strategy.strategy.toUpperCase());
      console.log('Confidence:', strategy.confidence, '%');
      console.log('Reasoning:', strategy.reasoning);
      console.log('\nMetrics:');
      console.log('- Visual complexity:', strategy.visualComplexity);
      console.log('- Layout compatibility:', strategy.layoutCompatibility);
      console.log('- Content divergence:', strategy.contentDivergence);

      if (strategy.strategy === 'input-modify') {
        console.log('\nModification Details:');
        console.log('- Complexity:', strategy.modificationComplexity);
        console.log('- Mask regions:', strategy.maskRegions?.length || 0);
        console.log('- Preserved elements:', strategy.preservedElements?.length || 0);
        console.log('- Changed elements:', strategy.changedElements?.length || 0);

        if (strategy.maskRegions && strategy.maskRegions.length > 0) {
          console.log('\nMask Regions:');
          strategy.maskRegions.forEach((mask, idx) => {
            console.log(`  ${idx + 1}. ${mask.type} (priority: ${mask.priority})`);
            console.log(`     Change: ${mask.changeDescription}`);
            console.log(`     Bounds: x=${mask.bounds.x}, y=${mask.bounds.y}, w=${mask.bounds.width}, h=${mask.bounds.height}`);
          });
        }
      }
    }

    console.log('\n═'.repeat(80));
    console.log('✅ ALL TESTS PASSED!');
    console.log('═'.repeat(80));

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    console.error(error);
    console.log('\n═'.repeat(80));
    process.exit(1);
  }
}

// Run tests
testReferenceMatchingSystem();
