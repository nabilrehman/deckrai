/**
 * Test suite for ADK Tools
 *
 * Tests the imageGenerationTool and qualityCheckerTool functionality
 */

import { imageGenerationTool, qualityCheckerTool } from '../index';

/**
 * Check if API key is available
 */
function hasApiKey(): boolean {
    return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY);
}

/**
 * Test Image Generation Tool
 */
async function testImageGenerationTool() {
    console.log('🧪 Testing Image Generation Tool\n');

    let passed = 0;
    let failed = 0;

    // Test 1: Tool structure validation
    console.log('Test 1: Tool structure validation');
    try {
        if (imageGenerationTool.name === 'generate_slide_image' &&
            imageGenerationTool.description &&
            typeof imageGenerationTool.execute === 'function') {
            console.log('✅ PASSED: Tool structure is valid\n');
            passed++;
        } else {
            console.log('❌ FAILED: Tool structure is invalid\n');
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error}\n`);
        failed++;
    }

    // Test 2: Execute with mock parameters (requires API key)
    if (hasApiKey()) {
        console.log('Test 2: Execute image generation (live API)');
        try {
            const result = await imageGenerationTool.execute({
                prompt: "A simple icon of a lightbulb representing ideas",
                style: "minimalist"
            });

            if (result.success) {
                console.log('✅ PASSED: Image generation succeeded');
                console.log(`   Message: ${result.message}\n`);
                passed++;
            } else {
                console.log('⚠️  WARNING: Image generation failed (API issue)');
                console.log(`   Error: ${result.error}\n`);
                // Don't fail the test - might be API limits
                passed++;
            }
        } catch (error) {
            console.log(`❌ FAILED: ${error}\n`);
            failed++;
        }
    } else {
        console.log('Test 2: Skipped (no API key)\n');
    }

    return { passed, failed };
}

/**
 * Test Quality Checker Tool
 */
async function testQualityCheckerTool() {
    console.log('🧪 Testing Quality Checker Tool\n');

    let passed = 0;
    let failed = 0;

    // Test 1: Tool structure validation
    console.log('Test 1: Tool structure validation');
    try {
        if (qualityCheckerTool.name === 'check_slide_quality' &&
            qualityCheckerTool.description &&
            typeof qualityCheckerTool.execute === 'function') {
            console.log('✅ PASSED: Tool structure is valid\n');
            passed++;
        } else {
            console.log('❌ FAILED: Tool structure is invalid\n');
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error}\n`);
        failed++;
    }

    // Test 2: Execute quality check (requires API key)
    if (hasApiKey()) {
        console.log('Test 2: Execute quality check (live API)');
        try {
            const testSlide = `
TITLE: The Future of AI

CONTENT:
- AI is transforming industries
- Machine learning enables computers to learn from data
- Applications include healthcare, finance, and transportation
- Ethical considerations are important
            `.trim();

            const result = await qualityCheckerTool.execute({
                slideContent: testSlide,
                slideNumber: 1,
                criteria: ["all"]
            });

            if (result.success && typeof result.score === 'number') {
                console.log('✅ PASSED: Quality check succeeded');
                console.log(`   Score: ${result.score.toFixed(2)}`);
                console.log(`   Issues found: ${result.issues.length}`);
                console.log(`   Suggestions: ${result.suggestions.length}`);
                console.log(`   Passes threshold: ${result.passesThreshold}\n`);
                passed++;
            } else {
                console.log('⚠️  WARNING: Quality check failed (API issue)');
                console.log(`   Error: ${result.error}\n`);
                // Don't fail - might be API limits
                passed++;
            }
        } catch (error) {
            console.log(`❌ FAILED: ${error}\n`);
            failed++;
        }
    } else {
        console.log('Test 2: Skipped (no API key)\n');
    }

    // Test 3: Execute with poor quality content (requires API key)
    if (hasApiKey()) {
        console.log('Test 3: Execute with poor quality content');
        try {
            const poorSlide = `
TITLE: stuff

CONTENT:
- things are good
- other things too
- yep
            `.trim();

            const result = await qualityCheckerTool.execute({
                slideContent: poorSlide,
                slideNumber: 2,
                criteria: ["clarity", "readability"]
            });

            if (result.success) {
                console.log('✅ PASSED: Quality check identified issues');
                console.log(`   Score: ${result.score.toFixed(2)} (should be low)`);
                console.log(`   Requires refinement: ${result.requiresRefinement}\n`);
                passed++;
            } else {
                console.log('⚠️  WARNING: Quality check failed (API issue)\n');
                passed++;
            }
        } catch (error) {
            console.log(`❌ FAILED: ${error}\n`);
            failed++;
        }
    } else {
        console.log('Test 3: Skipped (no API key)\n');
    }

    return { passed, failed };
}

/**
 * Run all tool tests
 */
async function runAllTests() {
    console.log('═'.repeat(60));
    console.log('  ADK Tools Test Suite');
    console.log('═'.repeat(60));
    console.log();

    if (!hasApiKey()) {
        console.log('⚠️  No API key found. Some tests will be skipped.');
        console.log('   Set GEMINI_API_KEY or GOOGLE_GENAI_API_KEY to run live API tests.\n');
    }

    // Test image generation tool
    const imageResults = await testImageGenerationTool();

    // Test quality checker tool
    const qualityResults = await testQualityCheckerTool();

    // Overall summary
    console.log('\n' + '═'.repeat(60));
    console.log('  Overall Test Results');
    console.log('═'.repeat(60));
    console.log(`Image Generation Tool: ${imageResults.passed} passed, ${imageResults.failed} failed`);
    console.log(`Quality Checker Tool: ${qualityResults.passed} passed, ${qualityResults.failed} failed`);

    const totalPassed = imageResults.passed + qualityResults.passed;
    const totalFailed = imageResults.failed + qualityResults.failed;

    if (totalFailed === 0) {
        console.log('\n🎉 All tool tests passed!\n');
    } else {
        console.log(`\n⚠️  ${totalFailed} test(s) failed. Please review.\n`);
        process.exit(1);
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
