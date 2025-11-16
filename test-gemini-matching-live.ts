/**
 * Live Gemini API test for reference matching
 * This will actually call Gemini to test the matching flow
 */

import { GoogleGenAI } from '@google/genai';

// Initialize Gemini
const apiKey = process.env.VITE_GEMINI_API_KEY || '';
if (!apiKey) {
  console.error('❌ VITE_GEMINI_API_KEY not found in environment');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

// Simulate your 37 Firebase references (names only, no actual images needed for matching)
const mockStyleLibrary = [];
for (let i = 1; i <= 37; i++) {
  mockStyleLibrary.push({
    id: `page-${i}`,
    name: `DA Mentor Led Hackathon _ Q4 2025 - Page ${i}`,
    src: `https://firebasestorage.googleapis.com/...page-${i}.png`
  });
}

// Actual slide specs from your Master Agent output
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
    content: 'Salesforce, Pendo, streaming data',
  },
];

const MATCHING_PROMPT = `You are an expert at matching presentation slides to reference templates.

TASK: Match each slide specification to the BEST reference slide from the library.

MATCHING CRITERIA:

1. **Content Type Match** (40% weight)
   - Title slides → title references
   - Diagram/architecture slides → data-viz or image-content references
   - Text content slides → content references
   - Data/chart slides → data-viz references

2. **Visual Hierarchy Match** (30% weight)
   - Centered content → centered references
   - Left-aligned content → left-aligned references
   - Split content → split-layout references

3. **Brand Context Match** (20% weight)
   - Technical/engineering content → technical-styled references
   - Executive/strategic content → clean professional references

4. **Layout Compatibility** (10% weight)
   - Number of elements
   - Whitespace requirements

REFERENCE SLIDE INFORMATION:
{{REFERENCES}}

SLIDE SPECIFICATIONS TO MATCH:
{{SLIDE_SPECS}}

OUTPUT FORMAT (JSON only, no markdown):
{
  "matches": [
    {
      "slideNumber": 1,
      "referenceName": "reference-name.png",
      "matchScore": 85,
      "matchReason": "Detailed explanation",
      "category": "title | content | data-viz | image-content | closing"
    }
  ],
  "overallStrategy": "Brief summary of matching strategy"
}

IMPORTANT: Each slide MUST be matched to exactly ONE reference. Return ONLY valid JSON.`;

async function testGeminiMatching() {
  console.log('\n🧪 Testing Live Gemini API Reference Matching\n');
  console.log('=' .repeat(80));
  console.log(`\n📚 References: ${mockStyleLibrary.length}`);
  console.log(`📄 Slides: ${slideSpecs.length}\n`);

  // Prepare references text (without categorization to avoid 503 errors)
  const referencesText = mockStyleLibrary
    .map((ref, index) => `Reference ${index + 1}: ${ref.name} (content)`)
    .join('\n');

  // Prepare slide specs text
  const slideSpecsText = slideSpecs
    .map(
      spec => `
Slide ${spec.slideNumber}:
- Type: ${spec.slideType}
- Headline: ${spec.headline}
- Content: ${spec.content}
`
    )
    .join('\n');

  const prompt = MATCHING_PROMPT
    .replace('{{REFERENCES}}', referencesText)
    .replace('{{SLIDE_SPECS}}', slideSpecsText);

  console.log('📡 Calling Gemini 2.5 Pro for matching...\n');

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
    });

    const responseText = result.text;
    console.log('✅ Gemini response received\n');

    // Parse JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const matchingResult = JSON.parse(jsonMatch[0]);

    console.log('🎯 Matching Strategy:');
    console.log(`   ${matchingResult.overallStrategy}\n`);

    console.log('📊 Match Results:\n');

    let successCount = 0;
    let failCount = 0;

    for (const match of matchingResult.matches) {
      const originalName = match.referenceName;

      // Apply the cleaning logic from referenceMatchingEngine.ts
      let cleanReferenceName = match.referenceName
        .replace(/\.png$/i, '')            // Remove .png extension first
        .replace(/\s*\([^)]+\)\s*$/, '')  // Then remove (content), (image-content), etc.
        .trim();

      // Find the reference
      const reference = mockStyleLibrary.find(ref => ref.name === cleanReferenceName);

      const slide = slideSpecs.find(s => s.slideNumber === match.slideNumber);

      console.log(`Slide ${match.slideNumber}: "${slide?.headline}"`);
      console.log(`  Gemini returned:  "${originalName}"`);
      console.log(`  Cleaned to:       "${cleanReferenceName}"`);

      if (reference) {
        console.log(`  ✅ MATCHED:       "${reference.name}"`);
        console.log(`  📊 Score:         ${match.matchScore}/100`);
        console.log(`  💡 Reason:        ${match.matchReason}`);
        successCount++;
      } else {
        console.log(`  ❌ NO MATCH!`);
        failCount++;
      }
      console.log('');
    }

    console.log('=' .repeat(80));
    console.log('\n📊 Final Results:');
    console.log(`  ✅ Successful matches: ${successCount}/${slideSpecs.length}`);
    console.log(`  ❌ Failed matches:     ${failCount}/${slideSpecs.length}`);
    console.log(`  📈 Success rate:       ${Math.round(successCount / slideSpecs.length * 100)}%\n`);

    if (successCount === slideSpecs.length) {
      console.log('🎉 All slides matched successfully! Name cleaning fix works!\n');
    } else {
      console.log('⚠️  Some matches failed. Check the cleaning logic.\n');
    }

  } catch (error: any) {
    console.error('❌ Error during test:', error.message);
    if (error.message?.includes('503')) {
      console.log('\n💡 Tip: Gemini API is overloaded. Wait a few minutes and try again.\n');
    }
  }
}

// Run the test
testGeminiMatching();
