/**
 * Design Asset Generator using Gemini 2.5 Flash Image
 * Generates custom premium design assets for Series B-quality UI
 */

import { GoogleGenerativeAI } from '@google/genai';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export interface DesignAsset {
  name: string;
  dataUrl: string;
  prompt: string;
}

/**
 * Generate a custom design asset using Gemini 2.5 Flash Image
 */
export async function generateDesignAsset(
  prompt: string,
  aspectRatio: '1:1' | '16:9' | '3:2' = '1:1'
): Promise<string> {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 1.0,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: 'image/jpeg',
    },
  });

  const response = result.response;
  const imageData = response.candidates?.[0]?.content?.parts?.[0];

  if (imageData && 'inlineData' in imageData) {
    return `data:${imageData.inlineData.mimeType};base64,${imageData.inlineData.data}`;
  }

  throw new Error('Failed to generate design asset');
}

/**
 * Generate a set of premium design assets for the landing page
 */
export async function generateLandingPageAssets(): Promise<Record<string, DesignAsset>> {
  const assets: Record<string, DesignAsset> = {};

  // 1. Premium gradient background blob
  const blobPrompt = `Create an abstract, organic blob shape with a smooth gradient from purple (#7C3AED) to blue (#6366F1).
  The blob should have soft, flowing edges and look like a premium design element.
  High quality, modern, professional. Transparent background with smooth anti-aliasing.
  The gradient should be radial and have multiple color stops for depth.`;

  try {
    assets.gradientBlob = {
      name: 'Premium Gradient Blob',
      prompt: blobPrompt,
      dataUrl: await generateDesignAsset(blobPrompt, '1:1'),
    };
  } catch (err) {
    console.error('Failed to generate gradient blob:', err);
  }

  // 2. Hero section abstract graphic
  const heroPrompt = `Create a modern, abstract geometric composition with flowing gradients in purple, blue, and pink tones.
  The design should be minimalist, professional, and suitable for a SaaS landing page hero section.
  Include subtle 3D elements and depth. High quality, clean, Series B startup aesthetic.
  Aspect ratio 16:9, suitable for web hero section.`;

  try {
    assets.heroGraphic = {
      name: 'Hero Section Graphic',
      prompt: heroPrompt,
      dataUrl: await generateDesignAsset(heroPrompt, '16:9'),
    };
  } catch (err) {
    console.error('Failed to generate hero graphic:', err);
  }

  // 3. AI Generation icon
  const aiIconPrompt = `Create a modern, minimalist icon representing AI and automation.
  Use purple and blue gradient colors (#7C3AED to #6366F1).
  The icon should show a lightbulb or brain with circuit patterns or neural network visualization.
  Clean, professional, suitable for a SaaS feature card. Square format. Transparent background.`;

  try {
    assets.aiGenerationIcon = {
      name: 'AI Generation Icon',
      prompt: aiIconPrompt,
      dataUrl: await generateDesignAsset(aiIconPrompt, '1:1'),
    };
  } catch (err) {
    console.error('Failed to generate AI icon:', err);
  }

  // 4. Personalization icon
  const personalizeIconPrompt = `Create a modern, minimalist icon representing personalization and customization.
  Use purple and blue gradient colors (#7C3AED to #6366F1).
  The icon should show a paintbrush or palette with brand/design elements.
  Clean, professional, suitable for a SaaS feature card. Square format. Transparent background.`;

  try {
    assets.personalizationIcon = {
      name: 'Personalization Icon',
      prompt: personalizeIconPrompt,
      dataUrl: await generateDesignAsset(personalizeIconPrompt, '1:1'),
    };
  } catch (err) {
    console.error('Failed to generate personalization icon:', err);
  }

  // 5. Redesign icon
  const redesignIconPrompt = `Create a modern, minimalist icon representing redesign and transformation.
  Use blue and cyan gradient colors (#3B82F6 to #06B6D4).
  The icon should show circular arrows or refresh symbol with design elements.
  Clean, professional, suitable for a SaaS feature card. Square format. Transparent background.`;

  try {
    assets.redesignIcon = {
      name: 'Redesign Icon',
      prompt: redesignIconPrompt,
      dataUrl: await generateDesignAsset(redesignIconPrompt, '1:1'),
    };
  } catch (err) {
    console.error('Failed to generate redesign icon:', err);
  }

  return assets;
}

/**
 * Generate a custom button texture/background
 */
export async function generateButtonTexture(): Promise<string> {
  const prompt = `Create a subtle, premium texture for a button background.
  Use a gradient from purple to blue with a slight grain or noise texture for depth.
  The texture should be very subtle and enhance the premium feel.
  Horizontal format, suitable for a button background.`;

  return await generateDesignAsset(prompt, '3:2');
}

/**
 * Generate decorative geometric elements
 */
export async function generateDecorativeElements(): Promise<DesignAsset[]> {
  const elements: DesignAsset[] = [];

  const prompts = [
    {
      name: 'Geometric Accent 1',
      prompt: `Create a small, decorative geometric shape in gradient purple and blue.
      Modern, minimal, suitable as a decorative accent. Transparent background.`,
    },
    {
      name: 'Geometric Accent 2',
      prompt: `Create a circular gradient ornament in purple, blue, and pink.
      Soft edges, modern design, suitable for page decoration. Transparent background.`,
    },
  ];

  for (const { name, prompt } of prompts) {
    try {
      elements.push({
        name,
        prompt,
        dataUrl: await generateDesignAsset(prompt, '1:1'),
      });
    } catch (err) {
      console.error(`Failed to generate ${name}:`, err);
    }
  }

  return elements;
}
