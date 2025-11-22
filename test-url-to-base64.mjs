import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDR7uyLYHS-u9عرض7s3xZ8KqXxN3vKrGVYtE",
  authDomain: "deckr-477706.firebaseapp.com",
  projectId: "deckr-477706",
  storageBucket: "deckr-477706.firebasestorage.app",
  messagingSenderId: "404945494823",
  appId: "1:404945494823:web:a7f5e8e3c2b1d9f0e4c5a6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const EMAIL = 'anam.nabil1@gmail.com';

/**
 * Convert URL to base64 data URL (same as in geminiService.ts)
 */
const urlToBase64 = async (url) => {
    // If already base64, return as-is
    if (url.startsWith('data:image/')) {
        return url;
    }

    // Use Node.js fetch and canvas for server-side conversion
    const { default: fetch } = await import('node-fetch');
    const { createCanvas, loadImage } = await import('canvas');

    try {
        console.log(`🔄 Fetching image from URL...`);
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log(`📦 Downloaded ${buffer.length} bytes`);

        // Load image
        const img = await loadImage(buffer);
        console.log(`🖼️  Image dimensions: ${img.width}x${img.height}`);

        // Create canvas and draw image
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Convert to base64
        const dataUrl = canvas.toDataURL('image/png');
        console.log(`✅ Converted to base64, length: ${dataUrl.length}`);
        console.log(`✅ Starts with: ${dataUrl.substring(0, 50)}...`);

        return dataUrl;
    } catch (error) {
        throw new Error(`URL to base64 conversion failed: ${error.message}`);
    }
};

async function testUrlToBase64Conversion() {
    try {
        // Find user
        console.log(`🔍 Looking for user: ${EMAIL}`);
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', EMAIL));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log('❌ No user found');
            process.exit(1);
        }

        const userId = querySnapshot.docs[0].id;
        console.log(`✅ Found user: ${userId}\n`);

        // Get style library
        console.log(`📚 Loading style library...`);
        const styleLibraryRef = collection(db, 'users', userId, 'styleLibrary');
        const styleLibrarySnap = await getDocs(styleLibraryRef);

        if (styleLibrarySnap.empty) {
            console.log('❌ No style library items found');
            process.exit(1);
        }

        console.log(`✅ Found ${styleLibrarySnap.size} items in style library\n`);

        // Test first 3 items
        const itemsToTest = styleLibrarySnap.docs.slice(0, 3);

        for (let i = 0; i < itemsToTest.length; i++) {
            const doc = itemsToTest[i];
            const item = doc.data();

            console.log(`\n${'='.repeat(60)}`);
            console.log(`TEST ${i + 1}/3: ${item.name}`);
            console.log(`${'='.repeat(60)}`);
            console.log(`Original src type: ${item.src.startsWith('data:image/') ? 'base64' : 'URL'}`);
            console.log(`Original src (first 100 chars): ${item.src.substring(0, 100)}...\n`);

            // Test conversion
            try {
                const base64Result = await urlToBase64(item.src);

                // Validate result
                const isValidBase64 = base64Result.startsWith('data:image/');
                const hasBase64Data = base64Result.includes('base64,');

                console.log(`\n✅ CONVERSION SUCCESSFUL!`);
                console.log(`   - Starts with 'data:image/': ${isValidBase64 ? '✅' : '❌'}`);
                console.log(`   - Contains 'base64,': ${hasBase64Data ? '✅' : '❌'}`);
                console.log(`   - Total length: ${base64Result.length} chars`);
                console.log(`   - Would work with Gemini: ${isValidBase64 && hasBase64Data ? '✅ YES' : '❌ NO'}`);

            } catch (error) {
                console.log(`\n❌ CONVERSION FAILED: ${error.message}`);
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log(`TEST COMPLETE`);
        console.log(`${'='.repeat(60)}`);

    } catch (error) {
        console.error('❌ Test error:', error);
    }

    process.exit(0);
}

testUrlToBase64Conversion();
