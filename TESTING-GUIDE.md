# Testing Guide: Enterprise Reference Matching System

## Prerequisites
- Dev server running at http://localhost:3003
- Google Cloud PDF: `/Users/nabilrehman/Downloads/DA Mentor Led Hackathon _ Q4 2025.pdf`
- Chrome DevTools open (F12) to monitor console logs

## Step-by-Step Testing

### Phase 1: Upload Reference Slides (5 minutes)

1. **Navigate to the app**
   - Open http://localhost:3003 in your browser
   - Sign in if needed

2. **Access Style Library**
   - Click on "Style Library" or "Upload References" section
   - You should see the upload interface

3. **Extract PDF pages as images** (one-time setup)
   - Open the PDF in Preview (Mac) or Adobe Reader
   - Export pages 1-5 as individual PNG/JPG files:
     - Page 1: Cover slide (Google Cloud logo)
     - Page 2: Agenda slide
     - Page 3: Content slide
     - Page 4: Timeline slide
     - Page 5: Evaluation criteria slide

4. **Upload to Style Library**
   - Upload all 5 extracted images
   - Wait for uploads to complete
   - Verify they appear in the style library

### Phase 2: Test Reference Matching (10 minutes)

1. **Navigate to Designer Mode**
   - Click "Designer Mode" or "Create New Deck" button
   - Enter generation mode

2. **Fill in generation form**
   - **Topic**: "AI Development Hackathon Q1 2026"
   - **Company**: "Google Cloud"
   - **Audience**: "Developers and ML Engineers"
   - **Goal**: "Educate developers on Gemini API and Vertex AI"
   - **Slide Count**: 5 slides

3. **Watch for Mode Selector Modal**
   - After clicking "Generate", you should see a beautiful modal with two options:
     - 🎨 "Use Company Templates" (left card - purple gradient)
     - 🚀 "Let Deckr Go Crazy" (right card - orange gradient)

4. **Select "Use Company Templates"**
   - Click the left card
   - Modal should close
   - Generation should start

5. **Monitor Console Logs** (Chrome DevTools → Console tab)

   Expected logs in order:
   ```
   📊 Matching 5 slides to 5 references...

   // Reference categorization (for each reference)
   Categorizing reference: <reference-name>
   Category: title | content | data-viz | image-content | closing

   // Matching results
   Matching strategy: <AI's overall strategy explanation>
   Match for slide 1: <reference-name> (score: 85/100)
   Match for slide 2: <reference-name> (score: 78/100)
   ...

   // Blueprint extraction (for each matched reference)
   Analyzing reference slide for slide 1...
   Blueprint extracted: background type = gradient, complexity = 4

   // Strategy decisions (for each slide)
   Strategy for slide 1: input-modify
   Confidence: 85%
   Visual complexity: 75, Layout compatibility: 80, Content divergence: 35
   Mask regions: 3
   ```

6. **Verify Matching Quality**
   - Check that title slides matched to title references
   - Check that content slides matched to content references
   - Check that match scores are reasonable (60-100)
   - Check that strategy decisions make sense

### Phase 3: Generation Quality Check (5 minutes)

1. **Wait for generation to complete**
   - Progress bar should show each slide generating
   - Should see "✅ Slide 1 generated", etc.

2. **Inspect generated slides**
   - Do they visually resemble the reference slides?
   - Are colors/fonts/layouts consistent with Google Cloud branding?
   - Is the content updated correctly?

3. **Compare Template Mode vs Crazy Mode**
   - Generate the same deck again, but select "Let Deckr Go Crazy"
   - Compare the results:
     - Template mode → should look very similar to uploaded references
     - Crazy mode → should be more creative/varied

### Phase 4: Edge Case Testing (5 minutes)

**Test 1: No References Uploaded**
- Clear style library (or test with new user)
- Try to generate a deck
- Expected: Should NOT show mode selector modal
- Expected: Should generate directly (no matching)

**Test 2: Only 1 Reference Uploaded**
- Upload only 1 reference slide
- Generate a 5-slide deck
- Expected: Should show mode selector
- Expected: All slides matched to the same reference (best effort)

**Test 3: Mismatched References**
- Upload only title slides (no content slides)
- Generate a deck with mostly content slides
- Expected: System should still match (lower scores)
- Check console for match scores < 70

### Phase 5: Performance Testing (2 minutes)

**Measure timing:**
1. Note the timestamp when you click "Generate"
2. Note when matching completes (check console)
3. Note when first slide is generated
4. Note when last slide is generated

**Expected timings:**
- Matching: ~30-60 seconds (5 slides × ~10s per match)
- Blueprint extraction: ~15-30 seconds (included in matching)
- Strategy decisions: ~15-30 seconds (5 slides × ~5s)
- Total overhead: ~60-120 seconds before first slide generates

## What to Look For

### ✅ Success Indicators
- Modal appears with two beautiful gradient cards
- Console shows detailed matching logs
- Match scores are between 60-100
- Strategy decisions include reasoning
- Generated slides visually match references
- No errors in console

### ❌ Failure Indicators
- Modal doesn't appear
- Console shows errors (red text)
- Match scores are very low (< 50)
- Generated slides don't resemble references
- API errors (429 rate limit, 500 server error)

### ⚠️ Edge Cases to Watch
- What if matching takes too long? (> 2 minutes)
- What if a reference fails to analyze?
- What if API rate limits are hit?

## Debugging Tips

If something goes wrong:

1. **Check Console for Errors**
   - Look for red error messages
   - Check the full error stack trace

2. **Check Network Tab**
   - Filter by "generativelanguage.googleapis.com"
   - Check for failed API calls (red)
   - Check response codes (200 = good, 429 = rate limit, 500 = error)

3. **Check Service Logs**
   - Open `services/referenceMatchingEngine.ts`
   - Add more console.log() statements if needed

4. **Test Individual Services**
   - Use the test script: `test-reference-matching.ts`
   - Run directly in browser console

## Expected Results

**Good Test Results:**
- Matching completes in 30-60 seconds
- Match scores average 75-85
- Blueprint extraction succeeds for all references
- Strategy decisions are mostly INPUT-MODIFY (Gemini excels at modifications)
- Generated slides look professional and consistent with Google Cloud brand

**Acceptable Test Results:**
- Matching completes in 60-120 seconds (acceptable for first version)
- Match scores average 60-75 (lower but still usable)
- 1-2 references fail to analyze (fallback logic should handle)
- Strategy decisions are mixed (50% INPUT-MODIFY, 50% FULL-RECREATE)

**Concerning Test Results:**
- Matching takes > 2 minutes
- Match scores average < 60
- Multiple references fail to analyze
- All strategy decisions are FULL-RECREATE (bias not working)
- Generated slides don't match references at all

## Next Steps After Testing

1. **If successful**: Merge feature branch to main
2. **If issues found**: Document them and we'll fix together
3. **Performance optimization**: If too slow, we can parallelize or cache
4. **Quality tuning**: Adjust matching criteria or strategy thresholds

---

Happy testing! 🚀
