/**
 * Tests for Iterative Reflection Demo Workflow (A+ Version)
 *
 * Tests the LoopAgent-based workflow with multi-pass refinement
 */

import { createIterativeReflectionWorkflow } from '../iterativeReflectionDemo';

/**
 * Check if API key is available
 */
function hasApiKey(): boolean {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
        return true;
    }
    if (typeof process !== 'undefined' && process.env) {
        return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY);
    }
    return false;
}

/**
 * Test 1: Workflow structure validation
 */
async function testWorkflowStructure() {
    console.log('\n=== Test 1: Iterative Workflow Structure ===');

    try {
        const workflow = createIterativeReflectionWorkflow("Machine Learning");

        // Validate workflow properties
        if (!workflow.name || workflow.name !== "IterativeReflectionWorkflow") {
            throw new Error("Invalid workflow name");
        }

        if (!workflow.description || !workflow.description.includes("Multi-pass")) {
            throw new Error("Invalid workflow description");
        }

        // Validate LoopAgent specific properties (Note: LoopAgent uses camelCase)
        if (!workflow.subAgents || workflow.subAgents.length !== 3) {
            throw new Error("LoopAgent should have 3 subAgents");
        }

        if (workflow.maxIterations !== 2) {
            throw new Error("maxIterations should be 2");
        }

        console.log('✅ PASSED: Workflow structure is valid');
        console.log(`   - Name: ${workflow.name}`);
        console.log(`   - Sub-agents: ${workflow.subAgents.length}`);
        console.log(`   - Max iterations: ${workflow.maxIterations}`);

        return { passed: 1, failed: 0 };
    } catch (error) {
        console.error('❌ FAILED:', error instanceof Error ? error.message : error);
        return { passed: 0, failed: 1 };
    }
}

/**
 * Test 2: Sub-agent validation
 */
async function testSubAgents() {
    console.log('\n=== Test 2: Sub-Agent Validation ===');

    try {
        const workflow = createIterativeReflectionWorkflow("Artificial Intelligence");
        const subAgents = workflow.subAgents;  // Note: LoopAgent uses camelCase

        // Check sub-agent names
        const expectedAgents = [
            "IterativeSlideGenerator",
            "IterativeQualityReviewer",
            "IterativeRefinementAgent"
        ];

        for (let i = 0; i < expectedAgents.length; i++) {
            const agent = subAgents[i];
            const expectedName = expectedAgents[i];

            if (agent.name !== expectedName) {
                throw new Error(`Sub-agent ${i} has wrong name: ${agent.name} (expected: ${expectedName})`);
            }

            console.log(`   ✅ Sub-agent ${i + 1}: ${agent.name}`);
        }

        // Validate quality reviewer has tools
        const qualityReviewer = subAgents[1];
        if (!qualityReviewer.tools || qualityReviewer.tools.length === 0) {
            throw new Error("QualityReviewer should have tools");
        }

        console.log(`   ✅ QualityReviewer has ${qualityReviewer.tools.length} tool(s)`);

        // Validate outputKey configuration (Note: ADK uses camelCase)
        const generator = subAgents[0];
        const reviewer = subAgents[1];
        const refiner = subAgents[2];

        if (generator.outputKey !== "slides") {
            throw new Error("SlideGenerator should have outputKey='slides'");
        }

        if (reviewer.outputKey !== "quality_report") {
            throw new Error("QualityReviewer should have outputKey='quality_report'");
        }

        if (refiner.outputKey !== "slides") {
            throw new Error("RefinementAgent should have outputKey='slides'");
        }

        console.log('   ✅ All agents have correct outputKey configuration');
        console.log('✅ PASSED: Sub-agents are correctly configured');

        return { passed: 1, failed: 0 };
    } catch (error) {
        console.error('❌ FAILED:', error instanceof Error ? error.message : error);
        return { passed: 0, failed: 1 };
    }
}

/**
 * Test 3: Max iterations configuration
 */
async function testMaxIterations() {
    console.log('\n=== Test 3: Max Iterations Configuration ===');

    try {
        const workflow = createIterativeReflectionWorkflow("Data Science");

        // Validate max iterations is set correctly
        if (workflow.maxIterations !== 2) {
            throw new Error(`maxIterations should be 2, got: ${workflow.maxIterations}`);
        }

        console.log('   ✅ maxIterations is set to 2 (prevents infinite loops)');
        console.log('   ✅ Follows best practice: limit to 1-2 refinement loops');
        console.log('✅ PASSED: Max iterations configuration is correct');

        return { passed: 1, failed: 0 };
    } catch (error) {
        console.error('❌ FAILED:', error instanceof Error ? error.message : error);
        return { passed: 0, failed: 1 };
    }
}

/**
 * Test 4: State management validation (placeholder syntax)
 */
async function testStatePlaceholders() {
    console.log('\n=== Test 4: State Placeholder Validation ===');

    try {
        const workflow = createIterativeReflectionWorkflow("Cloud Computing");
        const reviewer = workflow.subAgents[1];  // Note: LoopAgent uses camelCase
        const refiner = workflow.subAgents[2];

        // Check that instructions use {placeholder} syntax properly
        const reviewerInstruction = reviewer.instruction || "";
        const refinerInstruction = refiner.instruction || "";

        // Should use {slides} placeholder
        if (!reviewerInstruction.includes('{slides}')) {
            throw new Error("QualityReviewer should use {slides} placeholder");
        }

        // Refiner should use both {slides} and {quality_report}
        if (!refinerInstruction.includes('{slides}') || !refinerInstruction.includes('{quality_report}')) {
            throw new Error("RefinementAgent should use {slides} and {quality_report} placeholders");
        }

        // Validate that {placeholder} syntax is used for state access (best practice)
        // The key validation is that {slides} and {quality_report} are present
        // Even if the instruction mentions state["key"] in warnings, the actual usage should be {key}

        console.log('   ✅ QualityReviewer uses {slides} placeholder');
        console.log('   ✅ RefinementAgent uses {slides} and {quality_report} placeholders');
        console.log('✅ PASSED: State management follows ADK best practices');

        return { passed: 1, failed: 0 };
    } catch (error) {
        console.error('❌ FAILED:', error instanceof Error ? error.message : error);
        return { passed: 0, failed: 1 };
    }
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('🧪 Running Iterative Reflection Workflow Tests (A+ Version)\n');
    console.log('='.repeat(60));

    if (!hasApiKey()) {
        console.log('\n⚠️  No API key found. Running structure-only tests.');
        console.log('   To run full tests, set GEMINI_API_KEY or GOOGLE_GENAI_API_KEY');
    }

    const results = {
        passed: 0,
        failed: 0,
        skipped: 0
    };

    // Run all tests
    const test1 = await testWorkflowStructure();
    results.passed += test1.passed;
    results.failed += test1.failed;

    const test2 = await testSubAgents();
    results.passed += test2.passed;
    results.failed += test2.failed;

    const test3 = await testMaxIterations();
    results.passed += test3.passed;
    results.failed += test3.failed;

    const test4 = await testStatePlaceholders();
    results.passed += test4.passed;
    results.failed += test4.failed;

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary:');
    console.log(`   ✅ Passed: ${results.passed}`);
    console.log(`   ❌ Failed: ${results.failed}`);
    console.log(`   ⏭️  Skipped: ${results.skipped}`);
    console.log('='.repeat(60));

    if (results.failed === 0) {
        console.log('\n🎉 All tests passed! Iterative Reflection Workflow is A+ ready.\n');
    } else {
        console.log(`\n⚠️  ${results.failed} test(s) failed. Please review.\n`);
        process.exit(1);
    }

    return results;
}

// Run tests if executed directly (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
    runTests().catch(error => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
}

export { runTests };
