/**
 * Content Quality Test Suite
 * Uses LLM as an evaluator to assess the quality of generated slide content
 * Works with ANY company, brand, or presentation topic
 *
 * Run with: npm run test:content
 * Or with custom input: npm run test:content -- --company="acme.com" --slides=5 --notes="file.txt"
 */

import { GoogleGenAI } from '@google/genai';
import { generateDesignerOutline } from '../services/designerOrchestrator';
import type { DesignerGenerationInput } from '../types/designerMode';
import * as fs from 'fs';

interface TestResult {
  testName: string;
  passed: boolean;
  score?: number;
  details: string;
  timestamp: string;
}

interface ContentQualityAssessment {
  score: number; // 0-10
  isCompanySpecific: boolean;
  isDetailed: boolean;
  matchesInputNotes: boolean;
  hasGenericContent: boolean;
  specificTermsFound: string[];
  feedback: string;
}

interface TestConfig {
  company: string;
  slideCount: number;
  notes: string;
}

/**
 * Get test configuration from command line or use defaults
 */
function getTestConfig(): TestConfig {
  const args = process.argv.slice(2);

  // Check for custom input
  let company = 'test-company.com';
  let slideCount = 5;
  let notes = `Default test presentation about our product launch.

Key points:
1. Market opportunity and competitive advantage
2. Product features and benefits
3. Go-to-market strategy
4. Financial projections
5. Team and execution plan

We're targeting enterprise customers with a focus on scalability and ROI.`;

  args.forEach(arg => {
    if (arg.startsWith('--company=')) {
      company = arg.split('=')[1];
    } else if (arg.startsWith('--slides=')) {
      slideCount = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--notes=')) {
      const notesPath = arg.split('=')[1];
      if (fs.existsSync(notesPath)) {
        notes = fs.readFileSync(notesPath, 'utf-8');
      }
    }
  });

  return { company, slideCount, notes };
}

/**
 * Use LLM to evaluate content quality (generic for any presentation)
 */
async function evaluateContentQuality(
  slideContent: string,
  slideTitle: string,
  userNotes: string,
  companyName: string
): Promise<ContentQualityAssessment> {
  const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || '' });

  const evaluationPrompt = `You are a content quality evaluator for presentation slides. Assess the following slide content based on these criteria:

**CONTEXT:**
- Company: ${companyName}
- User's Original Notes: ${userNotes}

**SLIDE TO EVALUATE:**
- Title: ${slideTitle}
- Content: ${slideContent || 'NO CONTENT PROVIDED'}

**EVALUATION CRITERIA:**

1. **Company/Topic Specific (0-3 points):**
   - Does the content reference the actual company name or specific details from the notes?
   - Is it tailored to this specific presentation, or could it apply to any company?
   - Are there concrete examples, not just abstract concepts?

2. **Detailed & Actionable (0-3 points):**
   - Does it include specific details, examples, numbers, or scenarios?
   - Is it actionable with clear takeaways?
   - Or is it vague and high-level?

3. **Matches Input Notes (0-2 points):**
   - Does the content accurately reflect what the user wrote in their notes?
   - Are the user's specific points and examples preserved?

4. **Not Generic (0-2 points):**
   - Does it avoid generic placeholders like "our company", "the product", "customers"?
   - Is the language specific and concrete?

**SCORING:**
- 8-10: Excellent - Highly specific, detailed, matches notes perfectly
- 6-7: Good - Some specificity, but room for improvement
- 4-5: Fair - Mix of specific and generic content
- 0-3: Poor - Mostly generic, doesn't match notes well

**OUTPUT FORMAT (JSON only, no other text):**
{
  "score": 0-10,
  "isCompanySpecific": true/false,
  "isDetailed": true/false,
  "matchesInputNotes": true/false,
  "hasGenericContent": true/false,
  "specificTermsFound": ["list", "of", "specific", "terms"],
  "feedback": "Brief explanation of the score (2-3 sentences)"
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ text: evaluationPrompt }]
    });

    const jsonText = response.text.trim().replace(/^```json\s*|\s*```$/g, '');
    const assessment = JSON.parse(jsonText) as ContentQualityAssessment;
    return assessment;
  } catch (error) {
    console.error('Failed to evaluate content quality:', error);
    return {
      score: 0,
      isCompanySpecific: false,
      isDetailed: false,
      matchesInputNotes: false,
      hasGenericContent: true,
      specificTermsFound: [],
      feedback: 'Evaluation failed due to error'
    };
  }
}

/**
 * Extract key terms from user notes for validation
 */
function extractKeyTermsFromNotes(notes: string): string[] {
  // Extract words that appear multiple times or are capitalized (likely important)
  const words = notes.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b|\b\w{4,}\b/g) || [];
  const wordCounts = new Map<string, number>();

  words.forEach(word => {
    const lower = word.toLowerCase();
    // Skip common words
    if (['this', 'that', 'with', 'from', 'have', 'been', 'more', 'will', 'they'].includes(lower)) return;
    wordCounts.set(lower, (wordCounts.get(lower) || 0) + 1);
  });

  // Get terms that appear 2+ times or are capitalized
  const keyTerms = Array.from(wordCounts.entries())
    .filter(([_, count]) => count >= 2)
    .map(([term]) => term)
    .slice(0, 10);

  return keyTerms;
}

/**
 * Test 1: Content Field Exists
 */
async function testContentFieldExists(config: TestConfig): Promise<TestResult> {
  console.log('\n🧪 TEST 1: Content Field Exists');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const input: DesignerGenerationInput = {
      notes: config.notes,
      company: config.company,
      slideCount: config.slideCount
    };

    console.log('⏳ Generating slides...');
    const result = await generateDesignerOutline(input);

    if (!result.success || !result.outline) {
      throw new Error('Failed to generate slides');
    }

    const outline = result.outline;

    let hasContent = 0;
    let noContent = 0;

    outline.slideSpecifications.forEach(slide => {
      if (slide.content && slide.content.length > 10) {
        hasContent++;
        console.log(`✅ Slide ${slide.slideNumber} "${slide.title}": HAS content (${slide.content.length} chars)`);
      } else {
        noContent++;
        console.log(`❌ Slide ${slide.slideNumber} "${slide.title}": NO content`);
      }
    });

    const passed = hasContent > 0 && noContent === 0;

    return {
      testName: 'Content Field Exists',
      passed,
      score: (hasContent / outline.slideSpecifications.length) * 10,
      details: `${hasContent}/${outline.slideSpecifications.length} slides have content`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      testName: 'Content Field Exists',
      passed: false,
      details: `Error: ${error}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test 2: Content Quality Assessment (LLM Evaluator)
 */
async function testContentQuality(config: TestConfig): Promise<TestResult> {
  console.log('\n🧪 TEST 2: Content Quality Assessment (LLM Evaluator)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const input: DesignerGenerationInput = {
      notes: config.notes,
      company: config.company,
      slideCount: config.slideCount
    };

    console.log('⏳ Generating slides...');
    const result = await generateDesignerOutline(input);

    if (!result.success || !result.outline) {
      throw new Error('Failed to generate slides');
    }

    const outline = result.outline;

    const assessments: ContentQualityAssessment[] = [];
    let totalScore = 0;

    for (const slide of outline.slideSpecifications) {
      if (!slide.content || slide.content.length < 10) {
        console.log(`\n⚠️ Slide ${slide.slideNumber} (${slide.title}): NO CONTENT - Skipping evaluation`);
        continue;
      }

      console.log(`\n📊 Evaluating Slide ${slide.slideNumber}: ${slide.title}`);
      console.log(`   Content preview: ${slide.content.substring(0, 80)}...`);

      const assessment = await evaluateContentQuality(
        slide.content,
        slide.title,
        config.notes,
        config.company
      );

      assessments.push(assessment);
      totalScore += assessment.score;

      console.log(`   Score: ${assessment.score}/10`);
      console.log(`   Company-Specific: ${assessment.isCompanySpecific ? '✅' : '❌'}`);
      console.log(`   Detailed: ${assessment.isDetailed ? '✅' : '❌'}`);
      console.log(`   Matches Notes: ${assessment.matchesInputNotes ? '✅' : '❌'}`);
      console.log(`   Has Generic Content: ${assessment.hasGenericContent ? '❌' : '✅'}`);
      console.log(`   Specific Terms: ${assessment.specificTermsFound.join(', ')}`);
      console.log(`   Feedback: ${assessment.feedback}`);
    }

    const avgScore = assessments.length > 0 ? totalScore / assessments.length : 0;
    const passed = avgScore >= 6; // Pass if average score is 6/10 or higher

    return {
      testName: 'Content Quality Assessment',
      passed,
      score: avgScore,
      details: `Average quality score: ${avgScore.toFixed(2)}/10 across ${assessments.length} slides. ${passed ? 'Content is sufficiently specific and detailed.' : 'Content needs improvement - too generic.'}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      testName: 'Content Quality Assessment',
      passed: false,
      details: `Error: ${error}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Test 3: Relevance to Input Notes
 */
async function testRelevanceToNotes(config: TestConfig): Promise<TestResult> {
  console.log('\n🧪 TEST 3: Relevance to Input Notes');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const input: DesignerGenerationInput = {
      notes: config.notes,
      company: config.company,
      slideCount: config.slideCount
    };

    console.log('⏳ Generating slides...');
    const result = await generateDesignerOutline(input);

    if (!result.success || !result.outline) {
      throw new Error('Failed to generate slides');
    }

    const outline = result.outline;

    // Extract key terms from user notes
    const keyTerms = extractKeyTermsFromNotes(config.notes);
    console.log(`\n🔑 Key terms from notes: ${keyTerms.join(', ')}`);

    const allContent = outline.slideSpecifications
      .map(s => s.content || '')
      .join(' ')
      .toLowerCase();

    const foundTerms: string[] = [];
    const missingTerms: string[] = [];

    keyTerms.forEach(term => {
      if (allContent.includes(term.toLowerCase())) {
        foundTerms.push(term);
        console.log(`✅ Found: ${term}`);
      } else {
        missingTerms.push(term);
        console.log(`❌ Missing: ${term}`);
      }
    });

    const relevanceScore = keyTerms.length > 0
      ? (foundTerms.length / keyTerms.length) * 10
      : 10;

    const passed = relevanceScore >= 5; // Pass if 50%+ key terms found

    return {
      testName: 'Relevance to Input Notes',
      passed,
      score: relevanceScore,
      details: `Found ${foundTerms.length}/${keyTerms.length} key terms from notes. ${passed ? 'Content is relevant.' : 'Content lacks relevance to input.'}`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      testName: 'Relevance to Input Notes',
      passed: false,
      details: `Error: ${error}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  const config = getTestConfig();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  CONTENT QUALITY TEST SUITE                                ║');
  console.log('║  Testing slide content generation with LLM evaluation      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n📋 Test Configuration:`);
  console.log(`   Company: ${config.company}`);
  console.log(`   Slide Count: ${config.slideCount}`);
  console.log(`   Notes Length: ${config.notes.length} characters`);

  const results: TestResult[] = [];

  // Run tests
  results.push(await testContentFieldExists(config));
  results.push(await testContentQuality(config));
  results.push(await testRelevanceToNotes(config));

  // Summary
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  TEST SUMMARY                                              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach((result, index) => {
    const icon = result.passed ? '✅' : '❌';
    const scoreText = result.score !== undefined ? ` (${result.score.toFixed(1)}/10)` : '';
    console.log(`${icon} Test ${index + 1}: ${result.testName}${scoreText}`);
    console.log(`   ${result.details}`);
  });

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`OVERALL: ${passed}/${total} tests passed`);
  console.log(`${'═'.repeat(60)}\n`);

  // Save results
  const resultsPath = '/Users/nabilrehman/Downloads/deckr.ai-fina/tests/results.json';
  fs.writeFileSync(resultsPath, JSON.stringify({
    config,
    results,
    summary: { passed, total, timestamp: new Date().toISOString() }
  }, null, 2));
  console.log(`📁 Results saved to: ${resultsPath}`);

  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
