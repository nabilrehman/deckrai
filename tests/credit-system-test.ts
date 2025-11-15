/**
 * Credit System Integration Tests
 *
 * Tests the credit-based pricing system end-to-end
 * Run with: tsx tests/credit-system-test.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import {
  getCreditBalance,
  consumeCredits,
  addCredits,
  checkCreditAvailability,
  getCreditHistory,
  initializeUserCredits
} from '../services/creditService';
import {
  createOrUpdateUserProfile,
  getUserProfile
} from '../services/firestoreService';
import { FREE_STARTER_CREDITS } from '../config/pricing';

// Test configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZ_o-Jyi7ZQnsXPY8-l3TWgoHU_5dKOhQ",
  authDomain: "deckr-477706.firebaseapp.com",
  projectId: "deckr-477706",
  storageBucket: "deckr-477706.firebasestorage.app",
  messagingSenderId: "948199894623",
  appId: "1:948199894623:web:5211c1c6467b7f7e3635ea",
  measurementId: "G-6M0668ZXVJ"
};

// Initialize Firebase for testing
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Test utilities
let testUserId: string = '';

const log = (emoji: string, message: string) => {
  console.log(`${emoji} ${message}`);
};

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
};

// Test suite
async function runTests() {
  console.log('\n🧪 =============================================');
  console.log('🧪 CREDIT SYSTEM INTEGRATION TESTS');
  console.log('🧪 =============================================\n');

  try {
    // Test 1: Setup - Create test user
    log('📝', 'Test 1: Creating test user...');
    const userCred = await signInAnonymously(auth);
    testUserId = userCred.user.uid;

    await createOrUpdateUserProfile(
      testUserId,
      `test-${Date.now()}@deckrai.test`,
      'Test User',
      undefined
    );
    log('✅', `Test user created: ${testUserId}`);

    // Test 2: Check initial credit balance
    log('\n📝', 'Test 2: Checking initial credit balance...');
    const initialBalance = await getCreditBalance(testUserId);
    assert(
      initialBalance.totalCredits === FREE_STARTER_CREDITS,
      `Initial balance should be ${FREE_STARTER_CREDITS} credits`
    );
    assert(
      initialBalance.usedCreditsLifetime === 0,
      'Used credits lifetime should be 0'
    );
    log('✅', `Initial balance correct: ${initialBalance.totalCredits} credits`);

    // Test 3: Check credit availability (sufficient)
    log('\n📝', 'Test 3: Checking credit availability (sufficient)...');
    const availCheck1 = await checkCreditAvailability(testUserId, 5);
    assert(availCheck1.hasEnough, 'Should have enough credits for 5');
    assert(
      availCheck1.currentBalance === FREE_STARTER_CREDITS,
      `Balance should be ${FREE_STARTER_CREDITS}`
    );
    assert(availCheck1.shortfall === 0, 'Shortfall should be 0');
    log('✅', 'Credit availability check passed (sufficient)');

    // Test 4: Check credit availability (insufficient)
    log('\n📝', 'Test 4: Checking credit availability (insufficient)...');
    const availCheck2 = await checkCreditAvailability(testUserId, 100);
    assert(!availCheck2.hasEnough, 'Should NOT have enough credits for 100');
    assert(availCheck2.shortfall === 90, 'Shortfall should be 90');
    log('✅', 'Credit availability check passed (insufficient)');

    // Test 5: Consume credits (successful)
    log('\n📝', 'Test 5: Consuming credits (successful)...');
    const consumeResult1 = await consumeCredits(
      testUserId,
      3,
      'Created slide "Introduction"',
      { slideId: 'slide-123', action: 'create' }
    );
    assert(consumeResult1.success, 'Credit consumption should succeed');
    assert(
      consumeResult1.newBalance === FREE_STARTER_CREDITS - 3,
      `New balance should be ${FREE_STARTER_CREDITS - 3}`
    );
    log('✅', `Credits consumed successfully. New balance: ${consumeResult1.newBalance}`);

    // Test 6: Verify balance after consumption
    log('\n📝', 'Test 6: Verifying balance after consumption...');
    const balanceAfter1 = await getCreditBalance(testUserId);
    assert(
      balanceAfter1.totalCredits === FREE_STARTER_CREDITS - 3,
      'Balance should reflect consumption'
    );
    assert(
      balanceAfter1.usedCreditsLifetime === 3,
      'Used credits lifetime should be 3'
    );
    assert(
      balanceAfter1.usedCreditsThisMonth === 3,
      'Used credits this month should be 3'
    );
    log('✅', 'Balance correctly updated after consumption');

    // Test 7: Consume credits (insufficient - should fail)
    log('\n📝', 'Test 7: Attempting to consume more credits than available...');
    const consumeResult2 = await consumeCredits(
      testUserId,
      100,
      'Attempt to create expensive slide',
      { slideId: 'slide-456', action: 'create' }
    );
    assert(!consumeResult2.success, 'Should fail due to insufficient credits');
    assert(
      consumeResult2.error === 'Insufficient credits',
      'Error message should be correct'
    );
    log('✅', 'Correctly prevented over-consumption');

    // Test 8: Add credits (purchase)
    log('\n📝', 'Test 8: Adding credits via purchase...');
    const addResult1 = await addCredits(
      testUserId,
      50,
      'Purchased Pro Pack (100 credits)',
      'purchase',
      { packageId: 'pro' }
    );
    assert(addResult1.success, 'Adding credits should succeed');
    assert(
      addResult1.newBalance === FREE_STARTER_CREDITS - 3 + 50,
      'Balance should include purchased credits'
    );
    log('✅', `Credits added successfully. New balance: ${addResult1.newBalance}`);

    // Test 9: Add credits (bonus)
    log('\n📝', 'Test 9: Adding bonus credits...');
    const addResult2 = await addCredits(
      testUserId,
      10,
      'Promotional bonus',
      'bonus'
    );
    assert(addResult2.success, 'Adding bonus credits should succeed');
    log('✅', `Bonus credits added. New balance: ${addResult2.newBalance}`);

    // Test 10: Get credit history
    log('\n📝', 'Test 10: Retrieving credit transaction history...');
    const history = await getCreditHistory(testUserId, 10);
    assert(history.length >= 4, 'Should have at least 4 transactions');

    // Verify transaction types
    const consumptionTxs = history.filter(t => t.type === 'consumption');
    const purchaseTxs = history.filter(t => t.type === 'purchase');
    const bonusTxs = history.filter(t => t.type === 'bonus');

    assert(consumptionTxs.length >= 1, 'Should have consumption transactions');
    assert(purchaseTxs.length >= 1, 'Should have purchase transactions');
    assert(bonusTxs.length >= 2, 'Should have bonus transactions');

    log('✅', `Transaction history retrieved: ${history.length} transactions`);
    console.log('\n   Transaction Summary:');
    console.log(`   - Consumption: ${consumptionTxs.length}`);
    console.log(`   - Purchases: ${purchaseTxs.length}`);
    console.log(`   - Bonuses: ${bonusTxs.length}`);

    // Test 11: Multiple rapid consumptions (race condition test)
    log('\n📝', 'Test 11: Testing race condition prevention...');
    const rapidConsumptions = await Promise.allSettled([
      consumeCredits(testUserId, 5, 'Rapid test 1'),
      consumeCredits(testUserId, 5, 'Rapid test 2'),
      consumeCredits(testUserId, 5, 'Rapid test 3')
    ]);

    const succeeded = rapidConsumptions.filter(r =>
      r.status === 'fulfilled' && r.value.success
    ).length;

    log('✅', `Race condition test complete. ${succeeded}/3 succeeded`);

    // Test 12: Final balance verification
    log('\n📝', 'Test 12: Final balance verification...');
    const finalBalance = await getCreditBalance(testUserId);
    const expectedBalance = FREE_STARTER_CREDITS - 3 + 50 + 10 - (succeeded * 5);
    assert(
      finalBalance.totalCredits === expectedBalance,
      `Final balance should be ${expectedBalance}`
    );
    log('✅', `Final balance correct: ${finalBalance.totalCredits} credits`);

    // Test 13: User profile integration
    log('\n📝', 'Test 13: Verifying user profile integration...');
    const userProfile = await getUserProfile(testUserId);
    assert(userProfile !== null, 'User profile should exist');
    assert(userProfile?.credits !== undefined, 'User should have credits object');
    assert(
      userProfile?.credits.totalCredits === finalBalance.totalCredits,
      'Profile credits should match getCreditBalance'
    );
    log('✅', 'User profile correctly integrated with credit system');

    // ✅ All tests passed!
    console.log('\n🎉 =============================================');
    console.log('🎉 ALL TESTS PASSED! ');
    console.log('🎉 =============================================\n');

    // Print summary
    console.log('📊 Test Summary:');
    console.log(`   ✅ 13/13 tests passed`);
    console.log(`   👤 Test user: ${testUserId}`);
    console.log(`   💰 Final balance: ${finalBalance.totalCredits} credits`);
    console.log(`   📈 Lifetime usage: ${finalBalance.usedCreditsLifetime} credits`);
    console.log(`   📝 Transactions logged: ${history.length}`);
    console.log('');

    return true;
  } catch (error: any) {
    console.error('\n💥 =============================================');
    console.error('💥 TEST FAILED!');
    console.error('💥 =============================================\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    return false;
  }
}

// Run tests
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
