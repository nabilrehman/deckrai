/**
 * Test script for Demo Shots video analysis
 *
 * Run with: VITE_GEMINI_API_KEY=your_key npx tsx test-video-analysis.ts
 * Or: source .env && npx tsx test-video-analysis.ts
 *
 * This tests the analyzeDemoVideoTool with a YouTube URL
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env manually
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

console.log('API Key loaded:', process.env.VITE_GEMINI_API_KEY ? 'Yes (length: ' + process.env.VITE_GEMINI_API_KEY.length + ')' : 'No');

import { analyzeDemoVideo } from './server/tools/analyzeDemoVideo';

async function testVideoAnalysis() {
  console.log('=== Demo Shots Video Analysis Test ===\n');

  // Test with user-provided YouTube video
  const testYouTubeUrl = 'https://www.youtube.com/watch?v=c6tcw9uQNes';

  console.log('Testing with YouTube URL:', testYouTubeUrl);
  console.log('Analyzing video...\n');

  try {
    const result = await analyzeDemoVideo({
      videoSource: testYouTubeUrl,
      userContext: 'This is a product demo for enterprise customers',
    });

    if (result.success && result.data) {
      console.log('✅ Analysis successful!\n');
      console.log('Summary:', result.data.summary);
      console.log('Duration:', result.data.totalDuration);
      console.log('\nFeatures found:', result.data.features.length);

      result.data.features.forEach((feature, i) => {
        console.log(`\n${i + 1}. ${feature.featureName}`);
        console.log(`   Timestamp: ${feature.timestamp} (${feature.timestampSeconds}s)`);
        console.log(`   Description: ${feature.description}`);
        console.log(`   Problem Solved: ${feature.problemSolved}`);
      });

      console.log('\n✅ Recommended features for follow-up:');
      result.data.recommendedFeatures.forEach((f, i) => {
        console.log(`   ${i + 1}. ${f}`);
      });

    } else {
      console.log('❌ Analysis failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testVideoAnalysis();
