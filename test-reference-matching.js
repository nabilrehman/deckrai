/**
 * Test script for reference matching
 * Tests the matching engine with mock data to verify name cleaning works
 */

// Mock style library items (simulating your 37 Firebase references)
const mockStyleLibrary = [
  { id: '1', name: 'DA Mentor Led Hackathon _ Q4 2025 - Page 1', src: 'https://example.com/1.png' },
  { id: '2', name: 'DA Mentor Led Hackathon _ Q4 2025 - Page 2', src: 'https://example.com/2.png' },
  { id: '3', name: 'DA Mentor Led Hackathon _ Q4 2025 - Page 3', src: 'https://example.com/3.png' },
  { id: '4', name: 'DA Mentor Led Hackathon _ Q4 2025 - Page 4', src: 'https://example.com/4.png' },
  { id: '5', name: 'DA Mentor Led Hackathon _ Q4 2025 - Page 5', src: 'https://example.com/5.png' },
];

// Mock slide specifications (from Master Planning)
const mockSlideSpecs = [
  {
    slideNumber: 1,
    slideType: 'title',
    headline: 'Building Your Modern Lakehouse on BigQuery',
    content: 'A Technical Deep-Dive for SolarWinds Data Engineering',
  },
  {
    slideNumber: 2,
    slideType: 'content',
    headline: 'The Lakehouse Blueprint',
    content: 'End-to-end architecture overview',
  },
  {
    slideNumber: 3,
    slideType: 'content',
    headline: 'Ingestion Patterns',
    content: 'Salesforce, Pendo, and streaming data',
  },
];

// Mock Gemini response (what Gemini returns)
const mockGeminiResponse = {
  matches: [
    {
      slideNumber: 1,
      referenceName: 'DA Mentor Led Hackathon _ Q4 2025 - Page 1 (title).png',  // Has category + .png
      matchScore: 92,
      matchReason: 'Title slide layout matches perfectly',
      category: 'title',
    },
    {
      slideNumber: 2,
      referenceName: 'DA Mentor Led Hackathon _ Q4 2025 - Page 3.png',  // Just .png, no category
      matchScore: 85,
      matchReason: 'Content layout with good hierarchy',
      category: 'content',
    },
    {
      slideNumber: 3,
      referenceName: 'DA Mentor Led Hackathon _ Q4 2025 - Page 5 (content)',  // Just category, no .png
      matchScore: 78,
      matchReason: 'Technical content layout',
      category: 'content',
    },
  ],
  overallStrategy: 'Test strategy',
};

// Test the name cleaning logic
console.log('\n🧪 Testing Reference Name Cleaning Logic\n');
console.log('=' .repeat(80));

mockGeminiResponse.matches.forEach((match, index) => {
  const originalName = match.referenceName;

  // Apply the same cleaning logic from referenceMatchingEngine.ts
  let cleanReferenceName = match.referenceName
    .replace(/\.png$/i, '')            // Remove .png extension first
    .replace(/\s*\([^)]+\)\s*$/, '')  // Then remove (content), (image-content), etc.
    .trim();

  // Try to find the reference
  const reference = mockStyleLibrary.find(ref => ref.name === cleanReferenceName);

  console.log(`\nTest ${index + 1}:`);
  console.log(`  Original from Gemini: "${originalName}"`);
  console.log(`  After cleaning:       "${cleanReferenceName}"`);
  console.log(`  Match found:          ${reference ? '✅ YES' : '❌ NO'}`);

  if (reference) {
    console.log(`  Matched reference:    "${reference.name}"`);
  } else {
    console.log(`  Expected to match:    "DA Mentor Led Hackathon _ Q4 2025 - Page X"`);
    console.log(`  Available names:`);
    mockStyleLibrary.forEach(ref => {
      console.log(`    - "${ref.name}"`);
    });
  }
});

console.log('\n' + '='.repeat(80));
console.log('\n✅ Test complete!\n');
