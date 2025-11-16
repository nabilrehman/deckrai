# Quick Testing Guide: PDF Upload & Reference Matching

## Setup
1. Open http://localhost:3003 in Chrome
2. Open DevTools (F12) → Console tab
3. Make sure you're signed in

## Test 1: Upload 37-Page PDF in Smart AI Mode

1. Click **"Smart AI"** tab
2. Scroll down to find the reference/style upload section
3. Upload the PDF: `/Users/nabilrehman/Downloads/DA Mentor Led Hackathon _ Q4 2025.pdf`

**Expected Console Logs:**
```
🔍 DEBUG: handleStyleFileChange called
🔍 DEBUG: File selected - name: ..., type: application/pdf, size: ...
🔍 DEBUG: Processing PDF file...
🔍 DEBUG: PDF loaded. Total pages: 37
🔍 DEBUG: Extracted 37 pages from PDF
🔍 DEBUG: pdfPages.length = 37, onLibraryUpload exists = true
🔍 DEBUG: Calling onLibraryUpload with 37 items
🔍 DEBUG: handleLibraryUpload called with 37 items
🔍 DEBUG: 37 new items after deduplication (existing: 0)
🔍 DEBUG: Updated styleLibrary state - now has 37 items
📤 Uploading 37 reference slides to Firebase Storage...
✅ Uploaded 1/37: DA Mentor Led Hackathon _ Q4 2025 - Page 1
✅ Uploaded 2/37: DA Mentor Led Hackathon _ Q4 2025 - Page 2
... (all 37 pages)
✅ Successfully saved 37 items to Firestore
✅ Successfully uploaded 37 reference slides to Storage + Firestore
```

## Test 2: Verify Designer Mode Sees All 37 Slides

1. Click **"Designer"** tab (🎨 Designer)
2. Look at the console immediately

**Expected Console Logs:**
```
🔍 DEBUG: DesignerMode - styleLibrary has 37 items
🔍 DEBUG: First 3 items: [
  { id: '...', name: 'DA Mentor Led Hackathon _ Q4 2025 - Page 1' },
  { id: '...', name: 'DA Mentor Led Hackathon _ Q4 2025 - Page 2' },
  { id: '...', name: 'DA Mentor Led Hackathon _ Q4 2025 - Page 3' }
]
```

## Test 3: Generate Deck with Reference Matching

1. In Designer Mode, paste some content in the text area
2. Click **"Generate"** button
3. You should see a modal with two options:
   - 🎨 "Use Company Templates" (left card)
   - 🚀 "Let Deckr Go Crazy" (right card)
4. Modal should say: **"You have 37 reference slides uploaded"**
5. Click **"Use Company Templates"**

**Expected Console Logs:**
```
🎯 Matching 37 references to 5 slides...
Categorizing reference: DA Mentor Led Hackathon _ Q4 2025 - Page 1
Category: title
Match for slide 1: DA Mentor Led Hackathon _ Q4 2025 - Page 1 (score: 85/100)
Analyzing reference slide for slide 1...
Blueprint extracted: background type = gradient, complexity = 4
Strategy for slide 1: input-modify
```

## Troubleshooting

### If you see "styleLibrary has 0 items":
- Check if the upload completed successfully (look for ✅ logs)
- Check Firebase Console → Firestore → users/{uid}/styleLibrary
- Try refreshing the page

### If you see "styleLibrary has 1 item" (not 37):
- This means only the first page was saved
- Check for errors during batch upload
- Look for Firebase Storage errors

### If modal doesn't appear:
- Check: `🔍 DEBUG: DesignerMode - styleLibrary has X items`
- If X = 0, the upload failed or wasn't loaded from Firestore
- If X = 37, but modal doesn't show, there's a logic bug

### If matching fails:
- Check console for Gemini API errors (429 = rate limit, 500 = server error)
- Check that all 3 services are using correct API package (`@google/genai`)

## Success Criteria

✅ All 37 pages uploaded to Firebase Storage
✅ All 37 pages saved to Firestore metadata
✅ Designer Mode shows "37 reference slides"
✅ Modal appears with two generation options
✅ Reference matching logs appear in console
✅ Generated slides visually match the Google Cloud style

## If Everything Works

Please share a screenshot showing:
1. The modal with "You have 37 reference slides uploaded"
2. The console logs showing the matching process
