/**
 * Test: Single Slide Creation with Style Library
 *
 * This test verifies that Use Case 11 works correctly when:
 * - User requests a SINGLE slide
 * - Style library has references available
 */

import fetch from 'node-fetch';

async function testSingleSlideCreation() {
  console.log('\n=== Testing Single Slide Creation with Style Library ===\n');

  const requestBody = {
    userId: 'test-user',
    message: 'create a single slide please on this architecture for google cloud ..cloudrun->bigquery->postgres',
    conversationHistory: [],
    context: {
      styleLibrary: [
        { name: 'Page 1', src: 'https://example.com/page1.png', type: 'image' },
        { name: 'Page 2', src: 'https://example.com/page2.png', type: 'image' },
        { name: 'Page 3', src: 'https://example.com/page3.png', type: 'image' },
        // Simulating 37 references
        ...Array.from({ length: 34 }, (_, i) => ({
          name: `Page ${i + 4}`,
          src: `https://example.com/page${i + 4}.png`,
          type: 'image'
        }))
      ],
      mode: 'designer'
    }
  };

  console.log('📨 Sending request to http://localhost:3001/api/chat');
  console.log(`📝 Message: "${requestBody.message}"`);
  console.log(`📚 Style Library: ${requestBody.context.styleLibrary.length} references`);
  console.log('\n⏳ Waiting for response...\n');

  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      process.exit(1);
    }

    // Read SSE stream
    const reader = response.body;
    let buffer = '';
    let events: any[] = [];
    let completed = false;

    reader.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();

      // Process complete events
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete event in buffer

      for (const line of lines) {
        if (line.trim()) {
          const eventMatch = line.match(/event: (\w+)\ndata: (.+)/s);
          if (eventMatch) {
            const [, eventType, eventData] = eventMatch;
            try {
              const data = JSON.parse(eventData);
              events.push({ type: eventType, data });

              // Log events as they arrive
              if (eventType === 'thinking') {
                console.log(`💭 Thinking: ${data.title} (${data.status})`);
              } else if (eventType === 'complete') {
                console.log(`✅ Complete!`);
                completed = true;
              } else if (eventType === 'error') {
                console.log(`❌ Error: ${data.error}`);
              }
            } catch (e) {
              console.error('Failed to parse event data:', eventData);
            }
          }
        }
      }
    });

    reader.on('end', () => {
      const executionTime = Date.now() - startTime;

      console.log(`\n⏱️  Total execution time: ${executionTime}ms`);
      console.log(`📊 Total events received: ${events.length}`);

      // Analyze results
      const thinkingEvents = events.filter(e => e.type === 'thinking');
      const completeEvent = events.find(e => e.type === 'complete');
      const errorEvent = events.find(e => e.type === 'error');

      console.log(`\n=== Results ===`);
      console.log(`Thinking steps: ${thinkingEvents.length}`);

      if (thinkingEvents.length > 0) {
        console.log('\nThinking Steps:');
        thinkingEvents.forEach((event, i) => {
          console.log(`  ${i + 1}. ${event.data.title} (${event.data.status})`);
        });
      }

      if (errorEvent) {
        console.log(`\n❌ TEST FAILED`);
        console.log(`Error: ${errorEvent.data.error}`);
        process.exit(1);
      }

      if (completed && completeEvent?.data?.success) {
        console.log(`\n✅ TEST PASSED`);
        console.log(`\nResponse: ${completeEvent.data.response?.substring(0, 200)}...`);

        // Check if it used the expected workflow
        const usedMatchTool = thinkingEvents.some(e =>
          e.data.title?.includes('matchSlidesToReferencesTool')
        );
        const usedCreateTool = thinkingEvents.some(e =>
          e.data.title?.includes('createSlideTool')
        );

        console.log(`\nWorkflow verification:`);
        console.log(`  - Used matchSlidesToReferencesTool: ${usedMatchTool ? '✅' : '❌'}`);
        console.log(`  - Used createSlideTool: ${usedCreateTool ? '✅' : '❌'}`);

        if (usedMatchTool && usedCreateTool) {
          console.log(`\n🎉 Use Case 11 workflow executed correctly!`);
        } else {
          console.log(`\n⚠️  Expected workflow not followed`);
        }
      } else {
        console.log(`\n❌ TEST FAILED - Did not complete successfully`);
        process.exit(1);
      }
    });

    reader.on('error', (err: Error) => {
      console.error('\n❌ Stream error:', err);
      process.exit(1);
    });

  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`\n❌ TEST FAILED after ${executionTime}ms`);
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the test
testSingleSlideCreation();
