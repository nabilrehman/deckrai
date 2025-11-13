# Content Quality Test Suite

## Overview

This test suite uses an **LLM as an evaluator** to assess the quality of generated slide content in Designer Mode. It works with **ANY company, brand, or presentation topic** - not hardcoded to specific test cases.

## Tests

### Test 1: Content Field Exists
- **Purpose:** Verify that all slides have a `content` field populated
- **Pass Criteria:** 100% of slides must have content (>10 characters)
- **What it checks:** Presence and length of content field

### Test 2: Content Quality Assessment (LLM Evaluator) 🤖
- **Purpose:** Use Gemini Flash to evaluate content quality **relative to the user's input**
- **Pass Criteria:** Average score ≥ 6/10 across all slides
- **Evaluation Criteria:**
  - **Company/Topic Specific (0-3 points):** References actual company name and specific details from notes
  - **Detailed & Actionable (0-3 points):** Includes specific examples, numbers, scenarios vs generic advice
  - **Matches Input Notes (0-2 points):** Accurately reflects user's workflow and examples
  - **Not Generic (0-2 points):** Avoids vague placeholders like "our company", "the product"

### Test 3: Relevance to Input Notes
- **Purpose:** Verify presence of key terms extracted from user notes
- **Pass Criteria:** ≥50% of key terms found in generated content
- **How it works:**
  - Automatically extracts important terms from user notes (capitalized words, repeated terms)
  - Checks if those terms appear in slide content
  - Validates relevance to original input

## Running the Tests

### Prerequisites
```bash
npm install tsx --save-dev
```

### Quick Start (Default Test Case)
```bash
npm run test:content
```

Uses a generic "product launch" presentation with 5 slides.

### Custom Test Cases

**Test with SolarWinds:**
```bash
npm run test:content -- --company="solarwinds.com" --slides=5 --notes="solarwinds-notes.txt"
```

**Test with your own notes:**
```bash
npm run test:content -- --company="acme.com" --slides=10 --notes="my-notes.txt"
```

**Options:**
- `--company`: Company name/domain (e.g., "acme.com")
- `--slides`: Number of slides to generate (e.g., 5, 10, 13)
- `--notes`: Path to text file with presentation notes OR inline text

### Environment Variables
Ensure `VITE_GEMINI_API_KEY` is set in your `.env` file.

## Test Output

The test suite provides:
1. **Console Output:** Real-time test progress with detailed feedback
2. **JSON Results:** Saved to `tests/results.json` with full evaluation details
3. **Exit Code:** 0 if all tests pass, 1 if any fail (CI/CD friendly)

### Example Output
```
╔════════════════════════════════════════════════════════════╗
║  CONTENT QUALITY TEST SUITE                                ║
║  Testing slide content generation with LLM evaluation      ║
╚════════════════════════════════════════════════════════════╝

📋 Test Configuration:
   Company: acme.com
   Slide Count: 5
   Notes Length: 456 characters

🧪 TEST 1: Content Field Exists
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Slide 1 "Product Vision": HAS content (234 chars)
✅ Slide 2 "Market Opportunity": HAS content (189 chars)
...

🧪 TEST 2: Content Quality Assessment (LLM Evaluator)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Evaluating Slide 1: Product Vision
   Content preview: Our product addresses the growing enterprise need for...
   Score: 7/10
   Company-Specific: ✅
   Detailed: ✅
   Matches Notes: ✅
   Has Generic Content: ✅ (minor)
   Specific Terms: acme, enterprise, scalability, ROI
   Feedback: Good use of specific terminology. Includes concrete examples...

🧪 TEST 3: Relevance to Input Notes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔑 Key terms from notes: product, market, strategy, enterprise, team
✅ Found: product
✅ Found: market
✅ Found: enterprise
❌ Missing: strategy
✅ Found: team

╔════════════════════════════════════════════════════════════╗
║  TEST SUMMARY                                              ║
╚════════════════════════════════════════════════════════════╝

✅ Test 1: Content Field Exists (10.0/10)
✅ Test 2: Content Quality Assessment (7.2/10)
✅ Test 3: Relevance to Input Notes (8.0/10)

════════════════════════════════════════════════════════════
OVERALL: 3/3 tests passed
════════════════════════════════════════════════════════════
```

## Why This Approach?

### Problem with Hardcoded Tests
❌ Only works for one specific case (e.g., SolarWinds)
❌ Can't validate other companies or topics
❌ Brittle - breaks if content changes slightly

### Solution: LLM-as-a-Judge
✅ Works for **any** company, brand, or presentation topic
✅ Evaluates quality **relative to user input**, not absolute terms
✅ Flexible - adapts to different content styles
✅ Intelligent - understands context and relevance

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run Content Quality Tests
  run: npm run test:content
  env:
    VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

Or test multiple scenarios:
```yaml
- name: Test Generic Presentation
  run: npm run test:content

- name: Test SolarWinds Case
  run: npm run test:content -- --company="solarwinds.com" --notes="test-data/solarwinds.txt"

- name: Test Product Launch Case
  run: npm run test:content -- --company="startup.io" --notes="test-data/product-launch.txt"
```

## Troubleshooting

### "No content provided" errors
- Check that the master prompt includes the `content` field in JSON template (services/designerOrchestrator.ts:336)
- Verify parser extracts `content` from JSON (services/outlineParser.ts:114)
- Ensure `buildPromptFromSpec()` includes content in Imagen prompts (services/outlineParser.ts:589)

### Low quality scores
- Review LLM evaluation feedback in console output
- Check that master agent is generating detailed, specific content
- Verify user notes contain enough detail for generation
- Look at `tests/results.json` for per-slide assessments

### "Key terms missing"
- This is normal if the LLM paraphrases concepts
- Focus on Test 2 (LLM quality score) as the primary metric
- Test 3 is supplementary validation

### API errors
- Confirm `VITE_GEMINI_API_KEY` is set
- Check API quota limits at https://aistudio.google.com
- Verify network connectivity

## Extending the Tests

### Add a New Evaluation Criterion

In `evaluateContentQuality()`, add to the prompt:
```typescript
5. **Your New Criterion (0-2 points):**
   - Description of what you're checking
```

Update the `ContentQualityAssessment` interface:
```typescript
interface ContentQualityAssessment {
  // ... existing fields
  yourNewCheck: boolean;
}
```

### Add a New Test

Create a new test function:
```typescript
async function testYourNewCheck(config: TestConfig): Promise<TestResult> {
  console.log('\n🧪 TEST 4: Your New Check');
  // ... test logic
  return {
    testName: 'Your New Check',
    passed: true/false,
    score: 0-10,
    details: 'Description',
    timestamp: new Date().toISOString()
  };
}
```

Add to `runAllTests()`:
```typescript
results.push(await testYourNewCheck(config));
```

## Test Philosophy

This suite follows the **"LLM as a Judge"** pattern:
- Uses a small, fast model (Gemini Flash) to evaluate output from the main system
- Provides consistent, objective scoring across different inputs
- Captures nuanced quality that regex/keyword matching can't
- Scales to any use case without manual test case creation

The goal is to ensure that the `content` field fix works **universally**, not just for one specific company or presentation style.
