import { default as fetch } from 'node-fetch';
import { createCanvas, loadImage } from 'canvas';

/**
 * Convert URL to base64 data URL (same logic as geminiService.ts)
 */
const urlToBase64 = async (url) => {
    console.log(`🔄 Converting URL to base64...`);
    console.log(`   URL: ${url.substring(0, 80)}...`);

    // If already base64, return as-is
    if (url.startsWith('data:image/')) {
        console.log(`   ✅ Already base64, returning as-is`);
        return url;
    }

    try {
        console.log(`   📥 Fetching image from URL...`);
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`   📦 Downloaded ${buffer.length} bytes`);

        // Load image
        const img = await loadImage(buffer);
        console.log(`   🖼️  Image dimensions: ${img.width}x${img.height}`);

        // Create canvas and draw image
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Convert to base64
        const dataUrl = canvas.toDataURL('image/png');
        console.log(`   ✅ Converted to base64, length: ${dataUrl.length}`);

        return dataUrl;
    } catch (error) {
        throw new Error(`URL to base64 conversion failed: ${error.message}`);
    }
};

/**
 * Simulate fileToGenerativePart validation (same as geminiService.ts)
 */
const validateBase64ForGemini = (base64String) => {
    console.log(`\n🔍 Validating base64 for Gemini API...`);

    const base64Pattern = /^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/;
    const match = base64String.match(base64Pattern);

    if (!match) {
        console.log(`   ❌ FAILED: Does not match pattern`);
        console.log(`   Starts with: ${base64String.substring(0, 50)}...`);
        return false;
    }

    const mimeType = `image/${match[1]}`;
    const base64Data = match[2];

    console.log(`   ✅ Pattern matched!`);
    console.log(`   Mime type: ${mimeType}`);
    console.log(`   Base64 data length: ${base64Data.length}`);
    console.log(`   ✅ Would work with Gemini API: YES`);

    return true;
};

async function runTest() {
    console.log(`${'='.repeat(70)}`);
    console.log(`TEST: URL → Base64 Conversion (Firebase Storage Simulation)`);
    console.log(`${'='.repeat(70)}\n`);

    // Simulate a Firebase Storage URL (use a real Firebase Storage URL from your project)
    // For this test, I'll use a public image URL that's similar
    const testUrl = 'https://storage.googleapis.com/deckr-477706.firebasestorage.app/test.png';

    console.log(`Testing with a publicly accessible image URL...`);
    console.log(`(In production, this would be your Firebase Storage URL)\n`);

    // Use a simpler public URL for testing
    const publicTestUrl = 'https://via.placeholder.com/1280x720.png';

    try {
        const base64Result = await urlToBase64(publicTestUrl);

        console.log(`\n${'='.repeat(70)}`);
        const isValid = validateBase64ForGemini(base64Result);
        console.log(`${'='.repeat(70)}`);

        if (isValid) {
            console.log(`\n✅ SUCCESS: Conversion works correctly!`);
            console.log(`   The fix in geminiService.ts will handle Firebase Storage URLs properly.`);
        } else {
            console.log(`\n❌ FAILURE: Conversion produced invalid base64`);
        }

    } catch (error) {
        console.log(`\n❌ ERROR: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`TEST COMPLETE`);
    console.log(`${'='.repeat(70)}`);
}

runTest().then(() => process.exit(0));
