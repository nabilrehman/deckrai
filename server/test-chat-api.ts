/**
 * Test script for /api/chat endpoint
 *
 * Tests the complete flow: frontend → backend → agent → tools → response
 */

async function testChatAPI() {
  console.log('🧪 Testing Chat API Integration\n');

  const testCases = [
    {
      name: 'Simple message',
      message: 'Hello, can you help me create a slide?',
      conversationHistory: [],
    },
    {
      name: 'Single slide request',
      message: 'Create one slide about data warehousing with Google BigQuery',
      conversationHistory: [],
    },
    {
      name: 'Full deck request',
      message: 'Create a 5-slide presentation for Google Cloud about data analytics',
      conversationHistory: [],
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`${'='.repeat(60)}\n`);

    try {
      const startTime = Date.now();

      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'test-user',
          message: testCase.message,
          conversationHistory: testCase.conversationHistory,
        }),
      });

      const executionTime = Date.now() - startTime;

      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        continue;
      }

      const data = await response.json();

      console.log(`✅ Success! (${executionTime}ms)\n`);
      console.log('Response:', data.response?.substring(0, 200) + '...');
      console.log('\nThinking steps:', data.thinking?.steps?.length || 0);
      if (data.thinking?.steps) {
        data.thinking.steps.forEach((step: any) => {
          console.log(`  ${step.status === 'completed' ? '✓' : step.status === 'active' ? '⏳' : '○'} ${step.title}`);
        });
      }
      console.log('\nTool calls:', data.toolCalls?.length || 0);
      if (data.toolCalls) {
        data.toolCalls.forEach((call: any) => {
          console.log(`  🔧 ${call.tool} → ${call.result?.success ? '✅' : '❌'}`);
        });
      }
      console.log('\nMetadata:', {
        model: data.metadata?.model,
        executionTime: data.metadata?.executionTime + 'ms',
        iterationCount: data.metadata?.iterationCount,
      });
    } catch (error: any) {
      console.error(`❌ Error:`, error.message);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🎉 Test suite complete!');
  console.log(`${'='.repeat(60)}\n`);
}

// Run tests
testChatAPI().catch(console.error);
