/**
 * Test suite for Reflection Pattern Demo
 *
 * This demonstrates the complete Reflection pattern:
 * Generate → Review → Refine
 */

import { Runner, InMemorySessionService } from '@google/adk';
import { createReflectionDemoWorkflow } from '../simpleReflectionDemo';

/**
 * Check if API key is available
 */
function hasApiKey(): boolean {
    return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY);
}

/**
 * Test the reflection pattern workflow
 */
async function testReflectionPattern() {
    console.log('🧪 Testing Reflection Pattern Workflow\n');

    if (!hasApiKey()) {
        console.log('⚠️  No API key found. Skipping reflection pattern test.');
        console.log('   Set GEMINI_API_KEY or GOOGLE_GENAI_API_KEY to run this test.\n');
        return { passed: 0, failed: 0, skipped: 1 };
    }

    let passed = 0;
    let failed = 0;

    console.log('Test: Complete Reflection Workflow (Generate → Review → Refine)');
    console.log('━'.repeat(60));

    try {
        // Create workflow
        const workflow = createReflectionDemoWorkflow("Quantum Computing");

        // Create session service
        const sessionService = new InMemorySessionService();

        // Create runner
        const runner = new Runner({
            appName: "ReflectionDemo",
            agent: workflow,
            sessionService
        });

        // Create session
        const userId = 'test-user';
        const sessionId = `reflection-test-${Date.now()}`;

        await sessionService.createSession({
            userId,
            sessionId,
            appName: "ReflectionDemo"
        });

        console.log('\n📝 Step 1: Generating slides...');

        let eventCount = 0;
        let finalState: any = null;

        // Run workflow
        for await (const event of runner.runAsync({
            userId,
            sessionId,
            newMessage: {
                role: 'user',
                parts: [{ text: 'Generate slides about Quantum Computing' }]
            }
        })) {
            eventCount++;

            // Log progress
            if (event.author === 'SimpleSlideGenerator') {
                console.log('   ✓ Slides generated');
            } else if (event.author === 'QualityReviewerAgent') {
                console.log('\n🔍 Step 2: Reviewing quality...');
                console.log('   ✓ Quality review complete');
            } else if (event.author === 'RefinementAgent') {
                console.log('\n✨ Step 3: Refining slides...');
                console.log('   ✓ Refinement complete');
            }

            // Capture final state
            if (event.actions?.stateDelta) {
                finalState = { ...finalState, ...event.actions.stateDelta };
            }
        }

        // Clean up
        await sessionService.deleteSession({ userId, sessionId });

        console.log('\n' + '━'.repeat(60));
        console.log('📊 Workflow Results:\n');

        // Check if we got the expected state keys
        console.log(`   Events processed: ${eventCount}`);

        if (finalState) {
            if (finalState.slides) {
                console.log(`   ✓ Slides generated: ${finalState.slides?.length || 'unknown'} slides`);
            }
            if (finalState.quality_report) {
                console.log(`   ✓ Quality report created`);
                console.log(`     - Overall score: ${finalState.quality_report.overall_score?.toFixed(2) || 'N/A'}`);
                console.log(`     - Issues found: ${finalState.quality_report.critical_issues?.length || 0}`);
                console.log(`     - Requires refinement: ${finalState.quality_report.requires_refinement}`);
            }
            if (finalState.refined_slides) {
                console.log(`   ✓ Refined slides: ${finalState.refined_slides?.length || 'unknown'} slides improved`);
            }
        }

        console.log('\n✅ PASSED: Reflection pattern workflow completed successfully\n');
        passed++;

    } catch (error) {
        console.log(`\n❌ FAILED: ${error}\n`);
        if (error instanceof Error && error.stack) {
            console.log('Stack trace:', error.stack.substring(0, 500));
        }
        failed++;
    }

    return { passed, failed, skipped: 0 };
}

/**
 * Run all tests
 */
async function runAllTests() {
    console.log('═'.repeat(60));
    console.log('  Reflection Pattern Demo Test Suite');
    console.log('═'.repeat(60));
    console.log();

    const results = await testReflectionPattern();

    console.log('═'.repeat(60));
    console.log('  Test Results');
    console.log('═'.repeat(60));
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);

    if (results.failed === 0) {
        console.log('\n🎉 All tests passed!\n');
    } else {
        console.log(`\n⚠️  ${results.failed} test(s) failed.\n`);
        process.exit(1);
    }
}

// Run tests
runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
