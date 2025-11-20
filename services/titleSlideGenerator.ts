/**
 * Title Slide Generator Service
 *
 * Uses edit-based approach to generate title slides:
 * 1. Takes a template image
 * 2. Asks AI to edit the headline text only
 * 3. Overlays customer logo via canvas compositing
 *
 * This approach ensures perfect text quality and logo placement.
 */

import { GoogleGenAI, Modality } from '@google/genai';

// Handle both Node.js (backend) and browser (frontend) environments
const apiKey = (typeof import.meta !== 'undefined' && import.meta.env)
  ? import.meta.env.VITE_GEMINI_API_KEY
  : process.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey });

/**
 * Creates a title slide by editing a template image
 *
 * @param templateImage - Base64 data URL of the template slide
 * @param titleText - New headline text to replace in template
 * @param logoImage - Optional base64 data URL of customer logo
 * @returns Base64 data URL of the final composited slide
 */
export async function createTitleSlideFromTemplate(
  templateImage: string,
  titleText: string,
  logoImage: string | null = null
): Promise<string> {
  console.log('🎨 [Title Slide Generator] Starting edit-based generation');
  console.log(`   📝 Title text: "${titleText}"`);
  console.log(`   🖼️ Template image: ${templateImage.substring(0, 50)}...`);
  console.log(`   🏢 Logo: ${logoImage ? 'YES' : 'NO'}`);

  // Step 1: Prepare template image for AI
  const imagePart = {
    inlineData: {
      data: templateImage.split(',')[1],
      mimeType: templateImage.match(/:(.*?);/)?.[1] || 'image/png',
    }
  };

  // Step 2: Create edit-based prompt
  const prompt = `Please edit this presentation slide. Replace the main headline with the text: "${titleText}". Maintain the original style, font, color, and positioning of the headline as closely as possible. Do not alter any other part of the image.`;

  console.log('🤖 [Title Slide Generator] Calling Gemini 2.5 Flash Image...');

  // Step 3: Call Gemini AI to edit the slide
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  });

  // Step 4: Extract edited slide from response
  const editedSlideData = response.candidates[0].content.parts[0].inlineData?.data;

  if (!editedSlideData) {
    throw new Error('No image data returned from Gemini API');
  }

  const editedSlideBase64 = `data:image/png;base64,${editedSlideData}`;
  console.log('✅ [Title Slide Generator] AI editing complete');

  // Step 5: If no logo, return edited slide as-is
  if (!logoImage) {
    console.log('✅ [Title Slide Generator] No logo, returning edited slide');
    return editedSlideBase64;
  }

  // Step 6: Composite logo onto edited slide using canvas
  console.log('🖼️ [Title Slide Generator] Compositing logo...');
  const compositedSlide = await compositeLogo(editedSlideBase64, logoImage);

  console.log('✅ [Title Slide Generator] Logo composited successfully');
  return compositedSlide;
}

/**
 * Overlays a logo onto a slide using canvas
 *
 * @param slideImage - Base64 data URL of the slide
 * @param logoImage - Base64 data URL of the logo
 * @returns Base64 data URL of the composited image
 */
async function compositeLogo(
  slideImage: string,
  logoImage: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Load slide image
    const slideImg = new Image();
    slideImg.crossOrigin = 'anonymous';

    slideImg.onload = () => {
      // Load logo image
      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';

      logoImg.onload = () => {
        // Create canvas matching slide dimensions
        const canvas = document.createElement('canvas');
        canvas.width = slideImg.width;
        canvas.height = slideImg.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw slide as background
        ctx.drawImage(slideImg, 0, 0);

        // Calculate logo position and size
        // Logo in top-right: 5% padding from edges, max 15% of slide width
        const maxLogoWidth = slideImg.width * 0.15;
        const padding = slideImg.width * 0.05;

        // Scale logo to fit max width while maintaining aspect ratio
        let logoWidth = logoImg.width;
        let logoHeight = logoImg.height;

        if (logoWidth > maxLogoWidth) {
          const scale = maxLogoWidth / logoWidth;
          logoWidth = maxLogoWidth;
          logoHeight = logoImg.height * scale;
        }

        // Position: top-right corner with padding
        const logoX = slideImg.width - logoWidth - padding;
        const logoY = padding;

        // Draw logo
        ctx.drawImage(logoImg, logoX, logoY, logoWidth, logoHeight);

        // Convert canvas to base64
        const compositedImage = canvas.toDataURL('image/png');
        resolve(compositedImage);
      };

      logoImg.onerror = () => reject(new Error('Failed to load logo image'));
      logoImg.src = logoImage;
    };

    slideImg.onerror = () => reject(new Error('Failed to load slide image'));
    slideImg.src = slideImage;
  });
}
