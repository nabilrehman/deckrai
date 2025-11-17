/**
 * Test suite for Master Agent intent classification
 *
 * This tests the master agent's ability to correctly classify
 * user intents and extract relevant data.
 */

import { Runner, InMemorySessionService, isFinalResponse, Event } from '@google/adk';
import { getMasterAgent, prepareInputForMasterAgent, parseMasterAgentResponse } from '../masterAgent';

// Create session service once for all tests
const sessionService = new InMemorySessionService();

/**
 * Helper function to run agent and get final response
 */
async function runMasterAgent(userInput: string, context: any = {}): Promise<string> {
    // Create runner with session service
    const runner = new Runner({
        agent: getMasterAgent(),
        appName: 'DeckRAI-Test',
        sessionService: sessionService
    });

    const inputMessage = prepareInputForMasterAgent(userInput, context);

    // Create a unique session for this test
    const userId = 'test-user';
    const sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create session before running
    await sessionService.createSession({
        userId,
        sessionId,
        appName: 'DeckRAI-Test'
    });

    let finalResponse = '';

    try {
        for await (const event of runner.runAsync({
            userId,
            sessionId,
            newMessage: {
                role: 'user',
                parts: [{ text: inputMessage }]
            }
        })) {
            if (isFinalResponse(event)) {
                // Extract text from event content
                const content = event.content;
                if (content?.parts) {
                    for (const part of content.parts) {
                        if (part.text) {
                            finalResponse += part.text;
                        }
                    }
                }
            }
        }
    } finally {
        // Clean up session
        try {
            await sessionService.deleteSession({ userId, sessionId });
        } catch (e) {
            // Ignore cleanup errors
        }
    }

    return finalResponse;
}

/**
 * Check if API key is available
 */
function hasApiKey(): boolean {
    return !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY);
}

/**
 * Test parsing logic with mock responses (doesn't require API key)
 */
async function testParsingLogic() {
    console.log('🧪 Testing Master Agent Response Parsing Logic\n');

    let passed = 0;
    let failed = 0;

    // Test 1: Parse valid JSON response
    console.log('Test 1: Parse valid JSON response');
    try {
        const mockResponse = `{
            "intent": "CREATE_DECK",
            "confidence": 0.95,
            "reasoning": "User wants to create a new deck",
            "extracted_data": {
                "topic": "AI product",
                "requirements": {
                    "slide_count": 10,
                    "audience": "investors"
                }
            },
            "next_agent": "CreateDeckAgent"
        }`;

        const classification = parseMasterAgentResponse(mockResponse);

        if (classification.intent === 'CREATE_DECK' && classification.confidence === 0.95) {
            console.log('✅ PASSED: Successfully parsed valid JSON\n');
            passed++;
        } else {
            console.log('❌ FAILED: Parsing returned incorrect values\n');
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error}\n`);
        failed++;
    }

    // Test 2: Parse JSON with markdown code blocks
    console.log('Test 2: Parse JSON wrapped in markdown');
    try {
        const mockResponse = '```json\n{"intent": "EDIT_SLIDES", "confidence": 0.98, "reasoning": "test", "extracted_data": {}, "next_agent": "EditSlidesAgent"}\n```';

        const classification = parseMasterAgentResponse(mockResponse);

        if (classification.intent === 'EDIT_SLIDES') {
            console.log('✅ PASSED: Successfully parsed markdown-wrapped JSON\n');
            passed++;
        } else {
            console.log('❌ FAILED: Failed to parse markdown-wrapped JSON\n');
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAILED: ${error}\n`);
        failed++;
    }

    console.log('━'.repeat(60));
    console.log(`\n📊 Parsing Test Summary: ${passed} passed, ${failed} failed out of 2 tests\n`);

    return { passed, failed };
}

/**
 * Test cases for intent classification (requires API key)
 */
async function testMasterAgent() {
    console.log('🧪 Testing Master Agent Intent Classification with Live API\n');

    if (!hasApiKey()) {
        console.log('⚠️  No API key found. Skipping live API tests.');
        console.log('   Set GEMINI_API_KEY or GOOGLE_GENAI_API_KEY environment variable to run live tests.\n');
        return { passed: 0, failed: 0, skipped: 6 };
    }

    let passed = 0;
    let failed = 0;

    // Test 1: CREATE_DECK intent
    console.log('Test 1: CREATE_DECK intent');
    try {
        const response1 = await runMasterAgent(
            'Create a 10-slide pitch deck about our AI product for investors',
            { hasExistingDeck: false }
        );

        const classification1 = parseMasterAgentResponse(response1);

        if (classification1.intent === 'CREATE_DECK' && classification1.confidence > 0.9) {
            console.log('✅ PASSED: Correctly identified CREATE_DECK intent');
            console.log(`   Confidence: ${classification1.confidence}`);
            console.log(`   Extracted topic: ${classification1.extracted_data.topic}`);
            console.log(`   Slide count: ${classification1.extracted_data.requirements?.slide_count}`);
            console.log(`   Audience: ${classification1.extracted_data.requirements?.audience}\n`);
            passed++;
        } else {
            console.log(`❌ FAILED: Expected CREATE_DECK with >0.9 confidence, got ${classification1.intent} with ${classification1.confidence}\n`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAILED: Error in test 1: ${error}\n`);
        failed++;
    }

    // Test 2: EDIT_SLIDES intent with @slide mention
    console.log('Test 2: EDIT_SLIDES intent with @slide2');
    try {
        const response2 = await runMasterAgent(
            '@slide2 make it more professional and add bullet points',
            {
                hasExistingDeck: true,
                slideCount: 10,
                slideNames: ['Slide 1: Title', 'Slide 2: Problem Statement', 'Slide 3: Solution']
            }
        );

        const classification2 = parseMasterAgentResponse(response2);

        if (
            classification2.intent === 'EDIT_SLIDES' &&
            classification2.confidence > 0.9 &&
            classification2.extracted_data.target_slides?.includes('slide_2')
        ) {
            console.log('✅ PASSED: Correctly identified EDIT_SLIDES intent');
            console.log(`   Confidence: ${classification2.confidence}`);
            console.log(`   Target slides: ${classification2.extracted_data.target_slides?.join(', ')}`);
            console.log(`   Style: ${classification2.extracted_data.requirements?.style}\n`);
            passed++;
        } else {
            console.log(`❌ FAILED: Expected EDIT_SLIDES for slide_2, got ${classification2.intent}\n`);
            console.log(`   Full response: ${JSON.stringify(classification2, null, 2)}\n`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAILED: Error in test 2: ${error}\n`);
        failed++;
    }

    // Test 3: EDIT_SLIDES with @all mention
    console.log('Test 3: EDIT_SLIDES intent with @all');
    try {
        const response3 = await runMasterAgent(
            '@all make them follow our brand guidelines - use blue color scheme',
            { hasExistingDeck: true, slideCount: 8 }
        );

        const classification3 = parseMasterAgentResponse(response3);

        if (
            classification3.intent === 'EDIT_SLIDES' &&
            classification3.confidence > 0.9 &&
            classification3.extracted_data.target_slides?.includes('all')
        ) {
            console.log('✅ PASSED: Correctly identified @all as EDIT_SLIDES');
            console.log(`   Confidence: ${classification3.confidence}`);
            console.log(`   Target: ${classification3.extracted_data.target_slides?.join(', ')}\n`);
            passed++;
        } else {
            console.log(`❌ FAILED: Expected EDIT_SLIDES with target 'all', got ${classification3.intent}\n`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAILED: Error in test 3: ${error}\n`);
        failed++;
    }

    // Test 4: ANALYZE_CONTENT intent
    console.log('Test 4: ANALYZE_CONTENT intent');
    try {
        const response4 = await runMasterAgent(
            'I have some notes about our product. What questions should I answer to make a good presentation?',
            { hasExistingDeck: false }
        );

        const classification4 = parseMasterAgentResponse(response4);

        if (classification4.intent === 'ANALYZE_CONTENT' && classification4.confidence > 0.8) {
            console.log('✅ PASSED: Correctly identified ANALYZE_CONTENT intent');
            console.log(`   Confidence: ${classification4.confidence}`);
            console.log(`   Topic: ${classification4.extracted_data.topic}\n`);
            passed++;
        } else {
            console.log(`❌ FAILED: Expected ANALYZE_CONTENT, got ${classification4.intent}\n`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAILED: Error in test 4: ${error}\n`);
        failed++;
    }

    // Test 5: PLAN_STRATEGY intent
    console.log('Test 5: PLAN_STRATEGY intent');
    try {
        const response5 = await runMasterAgent(
            'How should I structure a presentation for C-level executives about digital transformation?',
            { hasExistingDeck: false }
        );

        const classification5 = parseMasterAgentResponse(response5);

        if (classification5.intent === 'PLAN_STRATEGY' && classification5.confidence > 0.8) {
            console.log('✅ PASSED: Correctly identified PLAN_STRATEGY intent');
            console.log(`   Confidence: ${classification5.confidence}`);
            console.log(`   Topic: ${classification5.extracted_data.topic}`);
            console.log(`   Audience: ${classification5.extracted_data.requirements?.audience}\n`);
            passed++;
        } else {
            console.log(`❌ FAILED: Expected PLAN_STRATEGY, got ${classification5.intent}\n`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAILED: Error in test 5: ${error}\n`);
        failed++;
    }

    // Test 6: QUICK_QUESTION intent
    console.log('Test 6: QUICK_QUESTION intent');
    try {
        const response6 = await runMasterAgent(
            'What is DeckRAI and how does it work?',
            {}
        );

        const classification6 = parseMasterAgentResponse(response6);

        if (classification6.intent === 'QUICK_QUESTION') {
            console.log('✅ PASSED: Correctly identified QUICK_QUESTION intent');
            console.log(`   Confidence: ${classification6.confidence}\n`);
            passed++;
        } else {
            console.log(`❌ FAILED: Expected QUICK_QUESTION, got ${classification6.intent}\n`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ FAILED: Error in test 6: ${error}\n`);
        failed++;
    }

    // Summary
    console.log('━'.repeat(60));
    console.log(`\n📊 Live API Test Summary: ${passed} passed, ${failed} failed out of 6 tests`);

    return { passed, failed, skipped: 0 };
}

// Run all tests
async function runAllTests() {
    console.log('═'.repeat(60));
    console.log('  Master Agent Test Suite');
    console.log('═'.repeat(60));
    console.log();

    // Always run parsing tests
    const parsingResults = await testParsingLogic();

    // Run live API tests if API key available
    const liveResults = await testMasterAgent();

    // Overall summary
    console.log('\n' + '═'.repeat(60));
    console.log('  Overall Test Results');
    console.log('═'.repeat(60));
    console.log(`Parsing Tests: ${parsingResults.passed} passed, ${parsingResults.failed} failed`);
    console.log(`Live API Tests: ${liveResults.passed} passed, ${liveResults.failed} failed, ${liveResults.skipped || 0} skipped`);

    const totalPassed = parsingResults.passed + liveResults.passed;
    const totalFailed = parsingResults.failed + liveResults.failed;

    if (totalFailed === 0) {
        console.log('\n🎉 All tests passed!\n');
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
