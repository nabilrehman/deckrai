/**
 * Full integration test for reference matching
 * Tests with actual Master Agent output and simulated Gemini matching response
 */

// Simulate your 37 Firebase references
const mockStyleLibrary = [];
for (let i = 1; i <= 37; i++) {
  mockStyleLibrary.push({
    id: `page-${i}`,
    name: `DA Mentor Led Hackathon _ Q4 2025 - Page ${i}`,
    src: `https://firebasestorage.googleapis.com/...page-${i}.png`
  });
}

// Actual slide specs from your Master Agent output (7 slides that parsed successfully)
const slideSpecs = [
  {
    slideNumber: 1,
    slideType: 'title',
    headline: 'Building Your Modern Data Lakehouse on BigQuery',
    content: 'A Technical Blueprint for the SolarWinds Data Engineering Team',
  },
  {
    slideNumber: 2,
    slideType: 'diagram',
    headline: 'The Lakehouse Blueprint on Google Cloud',
    content: 'A high-level, end-to-end architectural overview',
  },
  {
    slideNumber: 3,
    slideType: 'content',
    headline: 'Ingestion Patterns for Your Key Sources',
    content: 'Salesforce, Pendo, streaming data - practical ingestion methods',
  },
  {
    slideNumber: 4,
    slideType: 'content',
    headline: 'Enforcing Governance & Security at Scale',
    content: 'RBAC and PII protection with centralized model',
  },
  {
    slideNumber: 5,
    slideType: 'content',
    headline: 'Mastering Transformations with Dataform & SQL',
    content: 'Building robust transformation pipelines',
  },
  {
    slideNumber: 6,
    slideType: 'diagram',
    headline: 'Reference Architecture: The Complete Picture',
    content: 'Consolidated architecture diagram',
  },
  {
    slideNumber: 7,
    slideType: 'content',
    headline: 'Your Path Forward: Resources & Next Steps',
    content: 'Actionable next steps and learning resources',
  },
];

console.log('\n📊 Testing Full Reference Matching Flow\n');
console.log('=' .repeat(80));
console.log(`\n📚 Style Library: ${mockStyleLibrary.length} references`);
console.log(`📄 Slides to match: ${slideSpecs.length} slides\n`);

// Simulate what Gemini WOULD return for matching
// (Based on the actual matching strategy from your logs)
const simulatedGeminiMatchingResponse = {
  matches: [
    {
      slideNumber: 1,
      referenceName: 'DA Mentor Led Hackathon _ Q4 2025 - Page 26 (content).png',
      matchScore: 88,
      matchReason: 'Title slide with clean layout and strong visual hierarchy',
      category: 'title',
    },
    {
      slideNumber: 2,
      referenceName: 'DA Mentor Led Hackathon _ Q4 2025 - Page 17 (image-content).png',
      matchScore: 92,
      matchReason: 'Architecture diagram layout with clear visual flow',
      category: 'data-viz',
    },
    {
      slideNumber: 3,
      referenceName: 'DA Mentor Led Hackathon _ Q4 2025 - Page 13 (content).png',
      matchScore: 85,
      matchReason: 'Multi-column layout for comparing different patterns',
      category: 'content',
    },
    {
      slideNumber: 4,
      referenceName: 'DA Mentor Led Hackathon _ Q4 2025 - Page 4.png',
      matchScore: 80,
      matchReason: 'Content slide with structured information layout',
      category: 'content',
    },
    {
      slideNumber: 5,
      referenceName: 'DA Mentor Led Hackathon _ Q4 2025 - Page 31 (content)',
      matchScore: 83,
      matchReason: 'Code-focused layout suitable for technical content',
      category: 'content',
    },
    {
      slideNumber: 6,
      referenceName: 'DA Mentor Led Hackathon _ Q4 2025 - Page 18 (image-content).png',
      matchScore: 90,
      matchReason: 'Complex diagram layout for complete architecture',
      category: 'data-viz',
    },
    {
      slideNumber: 7,
      referenceName: 'DA Mentor Led Hackathon _ Q4 2025 - Page 3 (content).png',
      matchScore: 78,
      matchReason: 'List-based layout for action items',
      category: 'closing',
    },
  ],
  overallStrategy: 'Matched technical Google Cloud presentation slides to appropriate reference layouts, prioritizing diagram references for architecture slides and content references for text-heavy slides.',
};

console.log('🤖 Processing Matches...\n');

let successCount = 0;
let failCount = 0;

simulatedGeminiMatchingResponse.matches.forEach((match) => {
  const originalName = match.referenceName;

  // Apply the cleaning logic (same as in referenceMatchingEngine.ts)
  let cleanReferenceName = match.referenceName
    .replace(/\.png$/i, '')            // Remove .png extension first
    .replace(/\s*\([^)]+\)\s*$/, '')  // Then remove (content), (image-content), etc.
    .trim();

  // Find the reference
  const reference = mockStyleLibrary.find(ref => ref.name === cleanReferenceName);

  console.log(`Slide ${match.slideNumber}: "${slideSpecs[match.slideNumber - 1].headline}"`);
  console.log(`  Gemini returned:  "${originalName}"`);
  console.log(`  Cleaned to:       "${cleanReferenceName}"`);

  if (reference) {
    console.log(`  ✅ Match found:   "${reference.name}"`);
    console.log(`  📊 Score:         ${match.matchScore}/100`);
    console.log(`  💡 Reason:        ${match.matchReason}`);
    successCount++;
  } else {
    console.log(`  ❌ No match found!`);
    console.log(`  Expected one of:`);
    const nearMatches = mockStyleLibrary.filter(ref =>
      ref.name.includes(cleanReferenceName.split(' - Page ')[0])
    );
    nearMatches.slice(0, 3).forEach(ref => {
      console.log(`    - "${ref.name}"`);
    });
    failCount++;
  }
  console.log('');
});

console.log('=' .repeat(80));
console.log('\n📊 Results:');
console.log(`  ✅ Successful matches: ${successCount}/${slideSpecs.length}`);
console.log(`  ❌ Failed matches:     ${failCount}/${slideSpecs.length}`);
console.log(`  📈 Success rate:       ${Math.round(successCount / slideSpecs.length * 100)}%\n`);

if (successCount === slideSpecs.length) {
  console.log('🎉 All slides matched successfully! The fix is working!\n');
} else {
  console.log('⚠️  Some matches failed. Name cleaning logic may need adjustment.\n');
}
