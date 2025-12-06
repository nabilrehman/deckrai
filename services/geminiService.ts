

import { GoogleGenAI, Modality, Type, Schema } from "@google/genai";
import { DeckAiExecutionPlan, StyleLibraryItem, Slide, DebugLog, DebugSession, CompanyTheme, PersonalizationAction, TextReplacementAction, ImageReplacementAction, DeckAiTask, EditSlideTask, AddSlideTask, BrandProfile, SlideContent } from '../types';
import { searchSlidesByText, isRAGServiceAvailable } from './ragService';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

/**
 * Agentic Intent Detection - Parses user's natural language to determine editing intent
 * Follows 2025 agentic AI patterns: AI determines action type, not regex
 */
export interface EditIntent {
  isEditing: boolean;
  slideNumbers: number[];  // 1-indexed slide numbers
  action: string;  // The actual edit request
  scope: 'single' | 'multiple' | 'all';
}

/**
 * Parse plan modification intent - AI determines changes to generation plan
 * Replaces regex patterns with AI understanding
 */
export interface PlanModification {
  slideCount?: number;
  style?: 'executive' | 'visual' | 'technical' | 'minimal';
  audience?: string;
  hasChanges: boolean;
}

export const parsePlanModification = async (
  userPrompt: string,
  currentPlan: { slideCount: number; style: string; audience: string }
): Promise<PlanModification> => {
  const prompt = `You are analyzing a user's request to modify a presentation generation plan.

**Current Plan:**
- Slide count: ${currentPlan.slideCount}
- Style: ${currentPlan.style}
- Audience: ${currentPlan.audience}

**User Request:** "${userPrompt}"

Determine what changes the user wants to make. Extract:
1. New slide count (if mentioned)
2. New style (executive/professional/formal, visual/creative/modern, technical/detailed, minimal/simple)
3. New audience (if mentioned)

**Examples:**
User: "make it 10 slides"
Response: {"slideCount": 10, "hasChanges": true}

User: "make it more formal and professional"
Response: {"style": "executive", "hasChanges": true}

User: "change to 8 slides for executives"
Response: {"slideCount": 8, "audience": "executives", "hasChanges": true}

User: "looks good"
Response: {"hasChanges": false}

Respond with ONLY valid JSON. Omit fields that aren't being changed.`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });
    const responseText = result.text.trim();

    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                     responseText.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      console.error('Failed to parse plan modification:', responseText);
      return { hasChanges: false };
    }

    const modification: PlanModification = JSON.parse(jsonMatch[1]);
    console.log('🤖 Parsed plan modification:', modification);
    return modification;
  } catch (error) {
    console.error('Error parsing plan modification:', error);
    return { hasChanges: false };
  }
};

export const parseEditIntent = async (
  userPrompt: string,
  totalSlides: number
): Promise<EditIntent> => {
  const prompt = `You are an intent parser for a slide deck editing system. Analyze the user's request and determine:

1. Is this an EDIT request (modifying existing slides) or a CREATE request (making a new deck)?
2. If editing, which slide(s) should be edited?
3. What is the actual edit action?

**Rules:**
- "slide 2", "slide2", "@slide2" all mean slide number 2
- "whole deck", "all slides", "entire presentation" means ALL slides (${totalSlides} total)
- "slides 2 and 3" or "slide 2, 3, 4" means multiple specific slides
- If no slide number is mentioned AND it's an edit request, assume ALL slides

**Examples:**
User: "regenerate slide 2 with better design"
Response: {"isEditing": true, "slideNumbers": [2], "action": "regenerate with better design", "scope": "single"}

User: "fix spelling in my whole deck"
Response: {"isEditing": true, "slideNumbers": [1,2,3,4,5,6,7,8], "action": "fix spelling", "scope": "all"}

User: "@slide3 make it more colorful"
Response: {"isEditing": true, "slideNumbers": [3], "action": "make it more colorful", "scope": "single"}

User: "update slides 2, 4, and 7 with new branding"
Response: {"isEditing": true, "slideNumbers": [2,4,7], "action": "update with new branding", "scope": "multiple"}

User: "create a presentation about AI"
Response: {"isEditing": false, "slideNumbers": [], "action": "", "scope": "single"}

**User Request:** "${userPrompt}"

**Current deck has ${totalSlides} slides.**

Respond with ONLY valid JSON matching the EditIntent format. No explanation.`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt
    });
    const responseText = result.text.trim();

    // Extract JSON from markdown code blocks if present
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                     responseText.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      console.error('Failed to parse intent, no JSON found:', responseText);
      return { isEditing: false, slideNumbers: [], action: '', scope: 'single' };
    }

    const intent: EditIntent = JSON.parse(jsonMatch[1]);
    console.log('🤖 Parsed edit intent:', intent);
    return intent;
  } catch (error) {
    console.error('Error parsing edit intent:', error);
    return { isEditing: false, slideNumbers: [], action: '', scope: 'single' };
  }
};

/**
 * Deck Customization Intent - Analyzes uploaded deck + user request
 * Creates a customization plan with specific actions (modify, add, remove slides)
 */
export interface DeckCustomizationPlan {
  isCustomization: boolean;
  companyName?: string;
  customizations: Array<{
    action: 'modify' | 'add' | 'remove' | 'recreate';
    slideIndex?: number;  // For modify/remove (0-indexed)
    description: string;
    position?: 'before' | 'after' | 'end';  // For add
    positionIndex?: number;  // Which slide to add before/after
    useAssetAsSlide?: boolean;  // If true, treat uploaded image as the slide itself
    assetName?: string;  // Name of asset to use
  }>;
  assetUsage?: {
    [assetName: string]: 'logo' | 'image_asset' | 'slide_to_recreate' | 'reference_style';
  };
  reasoning: string;
}

export const analyzeDeckCustomization = async (
  userPrompt: string,
  uploadedSlideCount: number,
  uploadedAssets?: Array<{ id: string; name: string; type: 'image' | 'logo'; src: string }>
): Promise<DeckCustomizationPlan> => {
  // Build asset context for AI
  const assetContext = uploadedAssets && uploadedAssets.length > 0
    ? `\n\n**Uploaded Images:**\nThe user has uploaded ${uploadedAssets.length} image(s):\n${uploadedAssets.map(a => `- ${a.name}`).join('\n')}\n\n**IMPORTANT:** Images can be used in different ways based on user intent:\n- **Logo/Asset**: "use this logo in the title" → use as brand asset in slides\n- **Slide to Recreate**: "recreate this slide" → treat image as existing slide to redesign\n- **Style Reference**: "make slides like this" → use as visual style inspiration\n\nDetermine from the user's prompt how each image should be used.`
    : '';

  const deckContext = uploadedSlideCount > 0
    ? `A user has uploaded an existing deck (${uploadedSlideCount} slides) and wants to customize it.`
    : `A user has uploaded files and wants to work with them.`;

  const prompt = `You are an expert presentation customization agent. ${deckContext}${assetContext}

**User Request:** "${userPrompt}"

**Your Task:**
Analyze the request and create a detailed customization plan that specifies:
1. Which slides to MODIFY (with specific changes)
2. Which slides to ADD (with descriptions and positions)
3. Which slides to REMOVE (if any)
4. Which slides to RECREATE (if user says "recreate this slide")
5. Extract the company/customer name if mentioned
6. Determine how uploaded images should be used (logo, asset, slide to recreate, or style reference)

**Example Requests and Responses:**

Request: "customize this deck for Atlassian.com and add their pain point slide and architecture diagram of solution, add customer references from similar industry"
Response:
{
  "isCustomization": true,
  "companyName": "Atlassian",
  "customizations": [
    {
      "action": "modify",
      "slideIndex": 0,
      "description": "Update title slide with Atlassian branding and logo"
    },
    {
      "action": "add",
      "description": "Pain Points Slide - Research and showcase Atlassian's key challenges in their domain (project management, team collaboration)",
      "position": "after",
      "positionIndex": 2
    },
    {
      "action": "add",
      "description": "Solution Architecture Diagram - Technical architecture showing how our solution integrates with Atlassian's infrastructure",
      "position": "after",
      "positionIndex": 3
    },
    {
      "action": "add",
      "description": "Customer References - Similar companies in software/SaaS industry (e.g., GitHub, GitLab, Jira competitors) who use our solution",
      "position": "end"
    }
  ],
  "reasoning": "The user wants to personalize an existing deck for Atlassian. This requires: (1) updating branding on title, (2) adding a pain points slide that addresses Atlassian-specific challenges, (3) adding technical architecture, and (4) adding relevant customer proof points."
}

Request: "update this deck for Microsoft, add competitive analysis"
Response:
{
  "isCustomization": true,
  "companyName": "Microsoft",
  "customizations": [
    {
      "action": "modify",
      "slideIndex": 0,
      "description": "Update title slide with Microsoft branding"
    },
    {
      "action": "add",
      "description": "Competitive Analysis - Compare our solution vs Microsoft's current tools, highlighting unique advantages",
      "position": "end"
    }
  ],
  "reasoning": "User wants to tailor the deck for Microsoft and include competitive positioning."
}

Request: "recreate this slide" (with image "old-title.png" uploaded)
Response:
{
  "isCustomization": true,
  "customizations": [
    {
      "action": "recreate",
      "description": "Recreate the slide with modern design and improved visual hierarchy",
      "useAssetAsSlide": true,
      "assetName": "old-title.png",
      "position": "end"
    }
  ],
  "assetUsage": {
    "old-title.png": "slide_to_recreate"
  },
  "reasoning": "User wants to recreate an uploaded slide image with better design."
}

Request: "use this logo in the first slide" (with "company-logo.png" uploaded)
Response:
{
  "isCustomization": true,
  "customizations": [
    {
      "action": "modify",
      "slideIndex": 0,
      "description": "Add company-logo.png to the title slide",
      "assetName": "company-logo.png"
    }
  ],
  "assetUsage": {
    "company-logo.png": "logo"
  },
  "reasoning": "User wants to use the uploaded logo as a brand asset in the first slide."
}

Request: "update [company].com's logo in first slide" (with "1.png" and "deck.pdf" uploaded)
Response:
{
  "isCustomization": true,
  "companyName": "[extracted company name from prompt]",
  "customizations": [
    {
      "action": "modify",
      "slideIndex": 0,
      "description": "Update first slide with [company] branding using 1.png logo",
      "assetName": "1.png"
    }
  ],
  "assetUsage": {
    "1.png": "logo"
  },
  "reasoning": "User wants to customize the deck for [company] and replace the logo on the first slide with the uploaded 1.png file. Extract company name dynamically from user's prompt."
}

Request: "make 5 slides like this" (with "reference.png" uploaded)
Response:
{
  "isCustomization": true,
  "customizations": [
    {
      "action": "add",
      "description": "New slide following the visual style of reference.png",
      "position": "end"
    }
  ],
  "assetUsage": {
    "reference.png": "reference_style"
  },
  "reasoning": "User wants to create new slides using the uploaded image as a style reference."
}

Request: "just fixing some typos"
Response:
{
  "isCustomization": false,
  "customizations": [],
  "reasoning": "This is a simple edit request, not a strategic customization with company targeting."
}

**Important:**
- If the request involves targeting a specific company/customer AND adding/modifying strategic content, set isCustomization: true
- Extract company names DYNAMICALLY from ANY mention in the prompt (e.g., "acme.com" → "Acme", "update for XYZ Corp" → "XYZ Corp", "klick.com's logo" → "Klick")
- Company can be ANYTHING - don't assume specific names, extract from user's actual prompt
- For "add" actions, suggest smart positions (after intro, before conclusion, etc.)
- Be specific in descriptions so designers know exactly what to create
- For "recreate" actions, set useAssetAsSlide: true and specify assetName
- Always include assetUsage map to clarify how each uploaded image should be used
- Match generic filenames (1.png, image.jpg) to their purpose based on context from the prompt

Respond with ONLY valid JSON. No explanation.`;

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      config: {
        thinkingConfig: {
          thinkingBudget: 16384  // Good thinking for strategic planning
        }
      },
      contents: prompt
    });
    const responseText = result.text.trim();

    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                     responseText.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      console.error('Failed to parse customization plan:', responseText);
      return { isCustomization: false, customizations: [], reasoning: 'Failed to parse' };
    }

    const plan: DeckCustomizationPlan = JSON.parse(jsonMatch[1]);
    console.log('🎯 Deck Customization Plan:', plan);
    return plan;
  } catch (error) {
    console.error('Error analyzing deck customization:', error);
    return { isCustomization: false, customizations: [], reasoning: 'Error occurred' };
  }
};

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextReplacement {
    originalText: string;
    newText: string;
}


const fileToGenerativePart = (base64Data: string) => {
    console.log('[fileToGenerativePart] Received data, length:', base64Data.length, 'starts with:', base64Data.substring(0, 100));
    const match = base64Data.match(/^data:(image\/\w+);base64,(.*)$/);
    if (!match) {
        console.error('[fileToGenerativePart] Failed to match base64 pattern. Data:', base64Data.substring(0, 200));
        throw new Error("Invalid base64 image data string.");
    }
    const mimeType = match[1];
    const data = match[2];
    console.log('[fileToGenerativePart] Successfully parsed, mimeType:', mimeType, 'data length:', data.length);

    return {
        inlineData: {
            data,
            mimeType,
        },
    };
};

const verifyImage = async (originalImage: any, generatedImage: any, prompt: string, logs?: DebugLog[], maskImage?: any): Promise<string | null> => {
    const systemPrompt = `You are a meticulous "Quality Assurance Inspector" AI. Your task is to check a newly generated image for errors by comparing it to the original image and the prompt that was used to create it.

**Your Goal:** Identify any flaws in the generated image, specifically focusing on text accuracy and style consistency.

**Your Process:**
1.  **Analyze the original image** to understand the base style, fonts, and content.
2.  **Analyze the generation prompt** to understand what changes were requested.
3.  **Critically inspect the generated image** for any of the following errors:
    *   **Text Errors:** Are there any typos, misspellings, or garbled text? (e.g., "PostPEGGUL" instead of "PostgreSQL").
    *   **Style Inconsistencies:** Does the new text's font, color, or size fail to match the original slide's style?
    *   **Failed Instructions:** Did the AI fail to follow a specific instruction from the prompt?
4.  **Your Output:**
    *   If you find **ANY** errors, provide a concise, actionable list of corrections for the artist AI. For example: "The text 'PostPEGGUL' is misspelled; it should be 'PostgreSQL'."
    *   If the generated image is a perfect execution of the prompt, respond with the single word: "OK".`;
    
    logs?.push({ title: "QA Inspector: Starting Verification", content: "Comparing generated image against original and prompt." });

    const verificationParts = [
        { text: "Original Image:" },
        originalImage,
        { text: "Generated Image to Verify:" },
        generatedImage,
        { text: `Instructions it was supposed to follow:\n${prompt}` }
    ];

    if (maskImage) {
        verificationParts.push({ text: "Mask (area of change):" });
        verificationParts.push(maskImage);
    }
    verificationParts.push({ text: systemPrompt });


    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: { parts: verificationParts},
    });

    const verificationResult = response.text.trim();
    logs?.push({ title: "QA Inspector: Feedback", content: verificationResult });

    if (verificationResult.toUpperCase() === 'OK') {
        return null; // No corrections needed
    }
    return verificationResult; // Return the correction prompt
};


const generateSingleImage = async (
    model: string,
    imageParts: any[], // Now accepts an array of image parts (original, reference, mask)
    prompt: string,
    deepMode: boolean,
    logs?: DebugLog[],
    onProgress?: (message: string) => void,
): Promise<{ image: string, finalPrompt: string }> => {
    console.log(`[generateSingleImage] 🎬 Starting generation with model: ${model}`);
    console.log(`[generateSingleImage] Image parts count: ${imageParts.length}`);
    console.log(`[generateSingleImage] Prompt length: ${prompt.length} chars`);
    console.log(`[generateSingleImage] Deep mode: ${deepMode}`);

    onProgress?.("AI is generating variation...");
    logs?.push({ title: `Artist (${model}): Initial Generation`, content: prompt });

    // --- IMAGEN 4 WORKFLOW ---
    if (model === 'imagen-4.0-generate-001') {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
                aspectRatio: '16:9',
            },
        });
        const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
        if (!base64ImageBytes) {
            // FIX: The 'error' property does not exist on the GenerateImagesResponse type.
            // The response for a successful call that generates no image (e.g., due to safety filters)
            // does not include a specific reason in this property.
             throw new Error(`No image was generated by Imagen. (Reason: NO_IMAGE)`);
        }
        return { image: `data:image/png;base64,${base64ImageBytes}`, finalPrompt: prompt };
    }


    // --- GEMINI FLASH WORKFLOW ---
    console.log(`[generateSingleImage] 📡 Calling Gemini API with 2K resolution...`);
    const parts = [...imageParts, { text: prompt }];
    const config = {
        responseModalities: [Modality.IMAGE],
        image_size: "2K"  // Generate 2K resolution (2048x1152 for 16:9) - same cost as 1K
    };
    console.log(`[generateSingleImage] Config:`, JSON.stringify(config, null, 2));

    try {
        let response = await ai.models.generateContent({ model, contents: { parts }, config });
        console.log(`[generateSingleImage] 📥 Received API response`);

        let candidate = response.candidates?.[0];
        console.log(`[generateSingleImage] Finish Reason: ${candidate?.finishReason || 'UNKNOWN'}`);

        if (!candidate || !candidate.content?.parts || candidate.content.parts.length === 0) {
            console.error(`[generateSingleImage] ❌ No candidate or content in response`);
            console.error(`[generateSingleImage] Finish Reason: ${candidate?.finishReason}`);
            console.error(`[generateSingleImage] Full response:`, JSON.stringify(response, null, 2));
            throw new Error(`No image was generated by the AI. (Reason: ${candidate?.finishReason || 'NO_IMAGE'})`);
        }

        let generatedImagePart = candidate.content.parts.find(p => p.inlineData);
        if (!generatedImagePart) {
            console.error(`[generateSingleImage] ❌ No inline data in response parts`);
            console.error(`[generateSingleImage] Parts received:`, candidate.content.parts);
            throw new Error("No image data found in the AI's response.");
        }

        console.log(`[generateSingleImage] ✅ Image data found in response`);
    
    // Self-Correction Step (only in Deep Mode and for Gemini)
    if (deepMode && imageParts.length > 0) { // Self-correction needs an original image to compare against
        onProgress?.("Verifying AI work for accuracy...");
        const correction = await verifyImage(imageParts[0], generatedImagePart, prompt, logs, imageParts.find(p => p.isMask));

        if (correction) {
            onProgress?.("AI is correcting a mistake...");
            const correctedPrompt = `${prompt}\n\n**CRITICAL CORRECTION FROM QA:** You made a mistake on the first attempt. Please regenerate the image, applying this feedback: "${correction}"`;
            
            logs?.push({ title: "Artist: Applying Correction", content: correctedPrompt });
            
            const correctedParts = [...imageParts, { text: correctedPrompt }];
            
            response = await ai.models.generateContent({ model, contents: { parts: correctedParts }, config });
            
            candidate = response.candidates?.[0];
            if (!candidate || !candidate.content?.parts || candidate.content.parts.length === 0) {
                throw new Error(`No image was generated on the correction attempt. (Reason: ${candidate?.finishReason || 'NO_IMAGE'})`);
            }
            
            generatedImagePart = candidate.content.parts.find(p => p.inlineData);
            if (!generatedImagePart) throw new Error("No image data found in the AI's corrected response.");

            const mimeType = generatedImagePart.inlineData!.mimeType;
            const base64ImageBytes = generatedImagePart.inlineData!.data;
            return { image: `data:${mimeType};base64,${base64ImageBytes}`, finalPrompt: correctedPrompt };
        }
    }

        const mimeType = generatedImagePart.inlineData!.mimeType;
        const base64ImageBytes = generatedImagePart.inlineData!.data;
        console.log(`[generateSingleImage] ✅ Returning successful image`);
        return { image: `data:${mimeType};base64,${base64ImageBytes}`, finalPrompt: prompt };
    } catch (apiError: any) {
        console.error(`[generateSingleImage] 🚨 API ERROR CAUGHT:`, apiError);
        console.error(`[generateSingleImage] Error name: ${apiError?.name}`);
        console.error(`[generateSingleImage] Error message: ${apiError?.message}`);
        console.error(`[generateSingleImage] Error code: ${apiError?.code}`);
        console.error(`[generateSingleImage] Error status: ${apiError?.status}`);

        // Re-throw with more context
        if (apiError?.message) {
            throw apiError;
        } else {
            throw new Error(`API call failed: ${apiError?.toString() || 'Unknown error'}`);
        }
    }
};

export const getPersonalizationPlan = async (companyWebsite: string, base64Image: string): Promise<PersonalizationAction[]> => {
    const originalImagePart = fileToGenerativePart(base64Image);

    const systemPrompt = `You are a "Personalization Strategist" AI. Your goal is to create a JSON object outlining specific actions to personalize a slide for a target company, including the location of each change.

**Your Inputs:**
1.  A slide image.
2.  A company website URL: ${companyWebsite}

**Your Task:**
1.  **Analyze the Slide:** Scrutinize the provided slide image to identify its content, key messages, and visual elements (like logos, screenshots, or placeholder text).
2.  **Research the Company:** Use your search tool to analyze the provided company website (${companyWebsite}) to find their branding, products, services, and key terminology.
3.  **Identify Personalization Opportunities:** Find generic content on the slide and formulate precise actions to replace it with specific information from the company's website.
4.  **Determine Bounding Boxes:** For each action, you MUST identify the location and size of the content to be replaced. Provide this as a \`bounding_box\` object with normalized coordinates (from 0.0 to 1.0 for x, y, width, and height relative to the image dimensions).
5.  **Construct the JSON Output:** Your final output MUST be a valid JSON object. Do not add any other explanation or text outside of the JSON object. The object must contain two keys: \`text_replacements\` and \`image_replacements\`.
    *   Each object in \`text_replacements\` must have: \`originalText\`, \`newText\`, and \`bounding_box\`.
    *   Each object in \`image_replacements\` must have: \`areaToReplace\`, \`replacementPrompt\`, and \`bounding_box\`.

**CRITICAL:** If no personalization is possible, return an empty JSON object like \`{"text_replacements": [], "image_replacements": []}\`.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: { parts: [originalImagePart, {text: systemPrompt}] },
        config: { 
          tools: [{ googleSearch: {} }],
        }
    });
    
    const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
    
    try {
        const parsedJson = JSON.parse(jsonText);
        const textActions: TextReplacementAction[] = (parsedJson.text_replacements || []).map((a: any) => ({ type: 'TEXT_REPLACEMENT', originalText: a.originalText, newText: a.newText, boundingBox: a.bounding_box }));
        const imageActions: ImageReplacementAction[] = (parsedJson.image_replacements || []).map((a: any) => ({ type: 'IMAGE_REPLACEMENT', areaToReplace: a.areaToReplace, replacementPrompt: a.replacementPrompt, boundingBox: a.bounding_box }));
        return [...textActions, ...imageActions].filter(a => a.boundingBox); // Only return actions that have a valid bounding box
    } catch (e) {
        console.error("Failed to parse personalization plan from AI:", e, jsonText);
        throw new Error("The AI strategist failed to generate a valid personalization plan.");
    }
};

export const getPersonalizedVariationsFromPlan = async (plan: PersonalizationAction[], base64Image: string, deepMode: boolean, onProgress: (message: string) => void): Promise<{ images: string[], logs: DebugLog[], variationPrompts: string[] }> => {
    const logs: DebugLog[] = [{ title: "Workflow Started", content: "Personalize Slide From Plan" }];
    const originalImagePart = fileToGenerativePart(base64Image);
    
    logs.push({ title: "Strategist Plan", content: JSON.stringify(plan, null, 2) });
    
    const textActions = plan.filter(a => a.type === 'TEXT_REPLACEMENT') as TextReplacementAction[];
    const imageActions = plan.filter(a => a.type === 'IMAGE_REPLACEMENT') as ImageReplacementAction[];

    onProgress(`Executing content plan. Found ${textActions.length} text and ${imageActions.length} image replacement(s).`);

    let artistPrompt = `You are a "High-Fidelity Artist". Your task is to edit the provided slide image by performing the following actions:\n`;
    if (textActions.length > 0) artistPrompt += `\n**Text Replacements:**\n${textActions.map(r => `- Replace the text "${r.originalText}" with "${r.newText}"`).join('\n')}\n`;
    if (imageActions.length > 0) artistPrompt += `\n**Image Replacements:**\n${imageActions.map(r => `- In the area described as '${r.areaToReplace}', replace it with '${r.replacementPrompt}'`).join('\n')}\n`;
    artistPrompt += `\n**CRITICAL RULES:**\n1. For text changes, the new text must perfectly match the font, color, size, position, and style of the text it is replacing.\n2. For image changes, the new image should fit seamlessly into the slide's design.\n3. **DO NOT** change any other part of the slide.`;

    // Generate only 1 variation to save budget
    const basePrompts = [artistPrompt];

    onProgress('Generating personalized variation...');
    const promises = basePrompts.map(p =>
        generateSingleImage('gemini-3-pro-image-preview', [originalImagePart], p, deepMode, logs)
    );
    const settledResults = await Promise.allSettled(promises);

    const images: string[] = [];
    const variationPrompts: string[] = [];
    settledResults.forEach(result => {
        if (result.status === 'fulfilled') {
            images.push(result.value.image);
            variationPrompts.push(result.value.finalPrompt);
        } else {
            console.error("A personalization variation failed:", result.reason);
        }
    });

    if (images.length === 0) {
        const firstError = settledResults.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
        throw new Error(firstError?.reason?.message || 'All personalization attempts failed.');
    }
    
    return { images, logs, variationPrompts };
};


export const getGenerativeVariations = async (model: string, prompt: string, base64Image: string, deepMode: boolean, onProgress: (message: string) => void, bypassAnalyst: boolean = false): Promise<{ images: string[], logs: DebugLog[], variationPrompts: string[] }> => {
    const logs: DebugLog[] = [{ title: "Workflow Started", content: "Generate with AI" }];
    const originalImagePart = fileToGenerativePart(base64Image);

    // If using Imagen or bypassing analyst, the prompt is used directly
    let refinedPrompt = prompt;
    if (model !== 'imagen-4.0-generate-001' && !bypassAnalyst) {
        onProgress('Briefing AI Design Analyst with your request...');
        const systemPrompt = `You are a world-class AI agent acting as a "Design Analyst". Your job is to analyze a slide image and a user's request to create a perfect, actionable prompt for a generative image model. Your prompt must describe the **FINAL DESIRED STATE** and include these critical rules:
1.  **"It is absolutely critical to preserve all original branding (logos), text, fonts, colors, and specific numbering with 100% accuracy. The final image must be a perfect match in style to the original, with only the requested change applied."**
2.  **"The final image's dimensions must be in a 16:9 aspect ratio, suitable for a presentation slide."**

**User's Request:** "${prompt}"`;
            
        logs.push({ title: "Agent 1: Design Analyst (Input)", content: systemPrompt });

        onProgress('Analyst is creating a high-fidelity visual plan...');
        const response = await ai.models.generateContent({
            model: "gemini-3-pro-preview",
            contents: { parts: [originalImagePart, {text: systemPrompt}] },
        });
        
        const analystOutput = response.text.trim();
        if (!analystOutput) throw new Error("The AI Analyst failed to generate a refined prompt.");

        refinedPrompt = analystOutput;
        logs.push({ title: "Agent 1: Design Analyst (Raw Output)", content: refinedPrompt });
        console.log('[DEBUG] Design Analyst Refined Prompt:', refinedPrompt);
        onProgress('Plan received. Briefing AI Artist...');
    }

     // Generate only 1 variation to save budget
    const basePrompts = [refinedPrompt];

    onProgress('Generating variation...');
    const promises = basePrompts.map(p =>
        generateSingleImage(model, [originalImagePart], p, deepMode, logs)
    );
    const settledResults = await Promise.allSettled(promises);

    const images: string[] = [];
    const variationPrompts: string[] = [];
    settledResults.forEach(result => {
        if (result.status === 'fulfilled') {
            images.push(result.value.image);
            variationPrompts.push(result.value.finalPrompt);
        } else {
            console.error("A generative variation failed:", result.reason);
        }
    });

    if (images.length === 0) {
        const firstError = settledResults.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
        throw new Error(firstError?.reason?.message || 'All generation attempts failed.');
    }
    
    return { images, logs, variationPrompts };
};


export const getInpaintingVariations = async (
    prompt: string,
    base64Image: string,
    base64Mask: string,
    deepMode: boolean,
    onProgress: (message: string) => void
): Promise<{ images: string[], logs: DebugLog[], variationPrompts: string[] }> => {
    const logs: DebugLog[] = [{ title: "Workflow Started", content: "Inpainting with AI" }];
    const originalImagePart = fileToGenerativePart(base64Image);
    const maskImagePart = fileToGenerativePart(base64Mask);

    const inpaintingPrompt = `**Task: Inpainting**\nPerform the following instruction ONLY within the masked area of the image. DO NOT change any pixels outside the masked area.\n\n**Instruction:** "${prompt}"`;
    logs.push({ title: "Agent: Inpainting Artist (Input)", content: inpaintingPrompt });
    onProgress('Briefing AI Artist with your inpainting request...');

    // Generate only 1 variation to save budget
    const basePrompts = [inpaintingPrompt];

    onProgress('Generating inpainting result...');
    const promises = basePrompts.map(p =>
        generateSingleImage(
            'gemini-3-pro-image-preview',
            [originalImagePart, maskImagePart],
            p,
            deepMode,
            logs
        )
    );
    const settledResults = await Promise.allSettled(promises);

    const images: string[] = [];
    const variationPrompts: string[] = [];
    settledResults.forEach(result => {
        if (result.status === 'fulfilled') {
            images.push(result.value.image);
            variationPrompts.push(result.value.finalPrompt);
        } else {
            console.error("An inpainting variation failed:", result.reason);
        }
    });

    if (images.length === 0) {
        const firstError = settledResults.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
        throw new Error(firstError?.reason?.message || 'All inpainting attempts failed.');
    }
    
    return { images, logs, variationPrompts };
};


// ==================================================================
// "ART DIRECTOR" WORKFLOW with STYLE REFERENCE
// ==================================================================
const extractContentAsJson = async (base64Image: string, onProgress: (message: string) => void, logs: DebugLog[]): Promise<any> => {
    onProgress('Analyzing slide structure and content...');
    const originalImagePart = fileToGenerativePart(base64Image);
    const systemPrompt = `You are a "Content Extraction Bot" specializing in presentation slides. Your task is to analyze an image of a slide and extract its content into a structured JSON object.

**Your Goal:** Create a JSON "blueprint" of the slide's content, preserving its structure (titles, lists, tables) but ignoring its visual style (colors, fonts, exact positions).

**JSON Structure Rules:**
1.  The root object should have a \`layout_type\` key (e.g., "title_and_body", "table", "image_with_caption").
2.  Use a \`title\` key for the main slide title.
3.  Use a \`body\` key for main text blocks or bulleted lists. For lists, use an array of strings.
4.  For tables, use a \`table\` key. The value should be an object with \`headers\` (an array of strings) and \`rows\` (an array of arrays of strings).
5.  Extract any other distinct text elements into descriptive keys (e.g., \`footer_text\`, \`presenter_name\`).

**Example for a Table Slide:**
\`\`\`json
{
  "layout_type": "table",
  "title": "All your modeling needs with structured data covered...",
  "table": {
    "headers": ["Use Case", "BQML Model type", "Example use cases"],
    "rows": [
      ["Forecasting", "ARIMA PLUS X-REG (multivariate)", "Forecasting demand for thousands of SKUs simultaneously..."],
      ["Anomaly Detection", "Time series data: Arima plus Xreg...", "Anomaly detection on a time series of sensor data..."]
    ]
  },
  "footer_text": "Google Cloud"
}
\`\`\`

**CRITICAL:** Your output MUST be a single, valid JSON object and nothing else.`;

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: { parts: [originalImagePart, { text: systemPrompt }] },
        config: { responseMimeType: "application/json" },
    });

    const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
    
    try {
        const parsedJson = JSON.parse(jsonText);
        logs.push({ title: "Art Director: Extracted Content Blueprint (JSON)", content: JSON.stringify(parsedJson, null, 2) });
        return parsedJson;
    } catch(e: any) {
        logs.push({ title: "Art Director: FAILED to Extract Content", content: `Error parsing JSON: ${e.message}\n\nRaw AI Output:\n${jsonText}` });
        console.error("Failed to parse structured content from slide:", e, jsonText);
        throw new Error("The AI failed to understand the structure of the original slide.");
    }
};

export const findBestStyleReference = async (
    base64TargetImage: string,
    styleLibrary: StyleLibraryItem[],
    logs: DebugLog[]
): Promise<StyleLibraryItem> => {
    logs.push({ title: "Style Scout: Starting Analysis", content: "Analyzing target slide and style library to find the best match." });
    
    const targetImagePart = fileToGenerativePart(base64TargetImage);
    const referenceImageParts = styleLibrary.map(item => ({...fileToGenerativePart(item.src), itemName: item.name }));

    const systemPrompt = `You are a "Style Scout" AI agent, an expert in presentation design and visual analysis. Your task is to find the single best style reference for a target slide from a provided library of options.

**Your Goal:**
Analyze the target slide to understand its fundamental layout and content structure (e.g., "a 4-box horizontal flow diagram", "a title slide with a large background image", "a two-column text layout"). Then, examine each reference slide in the library and select the ONE whose layout is the closest structural and stylistic match.

**Your Process:**
1.  You will be given one "Target Slide".
2.  You will be given a "Reference Library" containing multiple slides with their names.
3.  Compare the Target Slide's structure to each slide in the Reference Library.
4.  Return a single line of text containing ONLY the name of the best matching reference slide. For example: "Page 3". Do not add any other explanation.`;

    const allRefParts = referenceImageParts.flatMap(part => {
        const { itemName, ...imagePart } = part; // Separate name from valid image part
        return [
            { text: `Reference Name: "${itemName}"` },
            imagePart
        ];
    });

    const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: "--- TARGET SLIDE ---" }, targetImagePart] },
        { role: 'user', parts: [{ text: "--- REFERENCE LIBRARY ---" }, ...allRefParts] },
    ];

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents,
    });

    const bestMatchName = response.text.trim();
    const bestMatch = styleLibrary.find(item => item.name === bestMatchName);

    // Log the selection for debugging
    console.log(`[Style Scout Image] 📋 Library size: ${styleLibrary.length} slides`);
    console.log(`[Style Scout Image] 🎯 Selected reference: "${bestMatchName}"`);

    if (bestMatch) {
        logs.push({ title: "Style Scout: Match Found", content: `The best matching style reference is: "${bestMatch.name}"` });
        console.log(`[Style Scout Image] ✅ Match found: ${bestMatch.name}`);
        return bestMatch;
    }

    logs.push({ title: "Style Scout: Match Failed", content: `Could not find a library item named "${bestMatchName}". Falling back to the first item.` });
    console.log(`[Style Scout Image] ⚠️ No match for "${bestMatchName}", falling back to: ${styleLibrary[0]?.name}`);
    // Fallback if the model hallucinates a name
    return styleLibrary[0];
};

/**
 * Helper: Convert URL to base64 data URL (for Firebase Storage URLs)
 */
const urlToBase64 = async (url: string): Promise<string> => {
    // If already base64, return as-is
    if (url.startsWith('data:image/')) {
        return url;
    }

    // Fetch and convert to base64
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
            } catch (err: any) {
                reject(new Error(`Canvas processing failed: ${err.message}`));
            }
        };
        img.onerror = () => reject(new Error(`Failed to load image from URL: ${url}`));
        img.src = url;
    });
};

export const findBestStyleReferenceFromPrompt = async (
    prompt: string,
    styleLibrary: StyleLibraryItem[],
): Promise<StyleLibraryItem | null> => { // Can return null if library is empty
    const logs: DebugLog[] = []; // Internal logs for this specific function
    if (styleLibrary.length === 0) {
        logs.push({ title: "Style Scout (Text-to-Style): Skipped", content: "Style library is empty. No reference will be used." });
        return null;
    }

    logs.push({ title: "Style Scout (Text-to-Style): Starting Analysis", content: "Analyzing user prompt to find the best style match from the library." });

    // RAG Pre-filtering: If library is large, use RAG to narrow down candidates
    // Note: For smaller libraries (< 50), visual layout matching is better done by Gemini seeing all options
    // RAG is text-based and may filter out visually diverse slides from single-topic decks
    let filteredLibrary = styleLibrary;
    const RAG_THRESHOLD = 50; // Only use RAG if more than 50 references

    if (styleLibrary.length > RAG_THRESHOLD) {
        try {
            const ragAvailable = await isRAGServiceAvailable();
            if (ragAvailable) {
                console.log(`[RAG] Pre-filtering ${styleLibrary.length} references for prompt: "${prompt.substring(0, 50)}..."`);
                const searchResult = await searchSlidesByText(prompt.substring(0, 200), { topK: 10 });

                if (searchResult.success && searchResult.results && searchResult.results.length > 0) {
                    const matchedUrls = new Set(searchResult.results.map(r => r.imageUrl));
                    const ragFiltered = styleLibrary.filter(item => matchedUrls.has(item.src));

                    if (ragFiltered.length >= 3) {
                        filteredLibrary = ragFiltered;
                        console.log(`[RAG] ✅ Filtered from ${styleLibrary.length} to ${filteredLibrary.length} relevant references`);
                        logs.push({
                            title: "RAG Pre-filter Applied",
                            content: `Narrowed ${styleLibrary.length} references to ${filteredLibrary.length} most relevant using semantic search.`
                        });
                    } else {
                        console.log(`[RAG] Too few matches (${ragFiltered.length}), using full library`);
                    }
                }
            }
        } catch (ragError) {
            console.warn('[RAG] Pre-filter failed, using full library:', ragError);
        }
    }

    // Convert Firebase Storage URLs to base64 data URLs (using filtered library)
    const referenceImageParts = await Promise.all(
        filteredLibrary.map(async (item) => {
            const base64Src = await urlToBase64(item.src);
            return { ...fileToGenerativePart(base64Src), itemName: item.name };
        })
    );

    const systemPrompt = `You are a "Style Scout" AI agent, an expert in presentation design and visual analysis. Your task is to find the single best style reference for a new slide based on a user's text prompt.

**Your Goal:**
Match the user's prompt to the BEST reference slide by considering BOTH the slide type AND the content structure.

**SLIDE TYPE MATCHING (CRITICAL - Match Type First!):**
1. **Title Slides**: If the prompt starts with "Title:" or describes an opening/cover slide → ONLY match to title slides (large centered text, minimal content, hero images)
2. **Diagram/Architecture Slides**: If the prompt mentions "diagram", "architecture", "flow", "process", "pipeline" → match to slides with visual diagrams, flowcharts, or technical illustrations
3. **Comparison Slides**: If the prompt mentions "vs", "comparison", "before/after", "challenge vs solution" → match to slides with side-by-side layouts, NOT tables
4. **Table/Data Slides**: If the prompt explicitly mentions "table", "data grid", "matrix" → match to table layouts
5. **Bullet Point Slides**: If the prompt describes features, benefits, or lists → match to bullet/list layouts
6. **Case Study Slides**: If the prompt mentions "customer", "case study", "use case" → match to case study layouts

**CRITICAL RULES:**
- Title slides should ONLY be matched with title slides
- Never use a table layout for a diagram or comparison (unless explicitly requested)
- Content slides with visual diagrams are different from content slides with text tables

**Your Process:**
1. First, identify the SLIDE TYPE from the user's prompt
2. Filter references to only those matching the slide type
3. Among matching types, select the one with the best structural layout match
4. Return a single line of text containing ONLY the name of the best matching reference slide. For example: "Page 3". Do not add any other explanation.`;

    const allRefParts = referenceImageParts.flatMap(part => {
        const { itemName, ...imagePart } = part;
        return [
            { text: `Reference Name: "${itemName}"` },
            imagePart
        ];
    });

    const contents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'user', parts: [{ text: `--- USER PROMPT --- \n"${prompt}"` }] },
        { role: 'user', parts: [{ text: "--- REFERENCE LIBRARY ---" }, ...allRefParts] },
    ];

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents,
    });

    const bestMatchName = response.text.trim();
    const bestMatch = filteredLibrary.find(item => item.name === bestMatchName);

    // Log the selection for debugging
    console.log(`[Style Scout] 🔍 Prompt: "${prompt.substring(0, 60)}..."`);
    console.log(`[Style Scout] 📋 Library size: ${filteredLibrary.length} slides`);
    console.log(`[Style Scout] 🎯 Selected reference: "${bestMatchName}"`);

    if (bestMatch) {
        logs.push({ title: "Style Scout (Text-to-Style): Match Found", content: `The best matching style reference is: "${bestMatch.name}"` });
        console.log(`[Style Scout] ✅ Match found: ${bestMatch.name}`);
        return bestMatch;
    }

    logs.push({ title: "Style Scout (Text-to-Style): Match Failed", content: `Could not find a library item named "${bestMatchName}". Falling back to the first item.` });
    console.log(`[Style Scout] ⚠️ No exact match for "${bestMatchName}", falling back to: ${filteredLibrary[0]?.name}`);
    return filteredLibrary[0];
};

export const remakeSlideWithStyleReference = async (
    prompt: string,
    base64Image: string,
    styleLibrary: StyleLibraryItem[],
    deepMode: boolean,
    onProgress: (message: string) => void,
): Promise<{ images: string[], logs: DebugLog[], variationPrompts: string[], bestReferenceSrc: string }> => {
    const logs: DebugLog[] = [{ title: "Workflow Started", content: "Remake Slide with Style Reference" }];
    
    const extractedContentJson = await extractContentAsJson(base64Image, onProgress, logs);
    
    if (styleLibrary.length === 0) {
        throw new Error("No style references found in your library. Add some high-quality slides to your library to use this feature.");
    }
    
    onProgress('AI Style Scout is analyzing your library for the best match...');
    const bestReference = await findBestStyleReference(base64Image, styleLibrary, logs);

    if (!bestReference) {
        throw new Error("The AI Style Scout failed to select a reference slide.");
    }

    const referenceImagePart = fileToGenerativePart(bestReference.src);

    const basePromptForArtist = `You are a "High-Fidelity Slide Designer". Your task is to create a new slide by rendering a structured JSON "blueprint" of content in the visual style of a provided reference slide.

**1. Reference Slide (For Style):**
(An image of the reference slide will be provided)

**2. Content Blueprint (JSON):**
\`\`\`json
${JSON.stringify(extractedContentJson, null, 2)}
\`\`\`

**3. User's High-Level Goal:**
"${prompt}"

**CRITICAL STYLE RULES:**
1. The new slide you create MUST perfectly match the visual style, aesthetics, color palette, font choices (typography), and layout principles of the reference slide.
2. **Handling Nested Content:** When a table cell in the JSON contains an array of strings, render them as a bulleted list or on separate lines, matching the style of the original slide. **DO NOT** render the JSON brackets \`[]\` or quotation marks \`""\`.
3. **Negative Constraint:** Do not invent any new text, headers, or data that is not explicitly present in the JSON blueprint. Your only job is to render the provided content in the new style.
4.  **Aspect Ratio:** Render the new slide in a 16:9 aspect ratio, suitable for a presentation.

**Your Task:**
Render the content from the JSON BLUEPRINT according to the user's GOAL, ensuring the final output is in the exact STYLE of the reference slide and adheres to all CRITICAL STYLE RULES.
`;

    // Generate 3 variations for edit mode (gives user choice)
    const basePrompts = [
        basePromptForArtist,
        `${basePromptForArtist}\n\n(For this version, interpret the layout with a slightly more creative or visually distinct style, while staying true to the reference.)`,
        `${basePromptForArtist}\n\n(For this version, offer another alternative that is clean and professional, using the reference as your guide.)`,
    ];

    onProgress(`Briefing AI artists with 3 design directions based on "${bestReference.name}"...`);
    const promises = basePrompts.map(p => {
        return generateSingleImage(
            'gemini-3-pro-image-preview',
            [referenceImagePart], 
            p,
            deepMode,
            logs
        );
    });
    const settledResults = await Promise.allSettled(promises);
    
    const images: string[] = [];
    const variationPrompts: string[] = [];
    settledResults.forEach(result => {
        if (result.status === 'fulfilled') {
            images.push(result.value.image);
            variationPrompts.push(result.value.finalPrompt);
        } else {
            console.error("A remake variation failed:", result.reason);
        }
    });

    if (images.length === 0) {
        const firstError = settledResults.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
        throw new Error(firstError?.reason?.message || 'All remake attempts failed.');
    }
    
    return { images, logs, variationPrompts, bestReferenceSrc: bestReference.src };
};



// ==================================================================
// "PLAN AND EXECUTE" DECK PERSONALIZATION WORKFLOW
// ==================================================================
export const generateDeckExecutionPlan = async (
  userPrompt: string,
  slidesInfo: { id: string, name: string, src?: string }[]
): Promise<DeckAiExecutionPlan> => {
    // Check if we have slide images for vision-based analysis
    const hasSlideImages = slidesInfo.length > 0 && slidesInfo[0].src;

    const systemPrompt = hasSlideImages
      ? `You are a "Master Presentation Strategist" AI with vision capabilities. Your goal is to create a JSON execution plan to modify a slide deck based on a user's high-level request.

**Your Inputs:**
1.  A user's request (e.g., "Customize this deck for dhl.com, make it more visual...").
2.  The ACTUAL SLIDE IMAGES - you can see exactly what's on each slide.
3.  Each slide's ID and name for reference.

**Your Task:**
1.  **Analyze the Request:** Understand what the user wants to achieve.
2.  **LOOK AT EACH SLIDE:** Visually analyze the content, layout, text density, visuals, data, etc.
3.  **Create Slide-Specific Prompts:** For each slide that needs changes, create a detailed \`detailed_prompt\` that:
    - Describes what you SEE on the slide currently
    - Specifies exactly what to change based on the user's request
    - Provides specific visual recommendations (e.g., "Convert the 5 bullet points into an icon grid", "Transform the data table into a bar chart")
    - References the target customer/company where relevant

**CRITICAL RULES:**
1.  **Be Specific:** Don't say "make it more visual" - say "Convert the 5 text bullet points about features into a 5-icon grid with minimal text"
2.  **Reference What You See:** "The slide currently has 3 paragraphs of text and a small logo. Transform this into..."
3.  **Tailor to Content:** A slide with data tables needs different treatment than a slide with bullet points
4.  **Skip Unchanged Slides:** If a slide doesn't need changes based on the user's request, don't include it

**Output Format:** Valid JSON object with two keys: \`thought_process\` and \`tasks\`.
    *   \`thought_process\`: Your analysis of the deck and strategy.
    *   \`tasks\`: Array of task objects. Each task must have a \`type\`.

**Task Object Schemas:**
*   **If \`type\` is \`'EDIT_SLIDE'\`:** The object MUST contain:
    *   \`slideId\`: string (The ID of the slide to edit, from the provided list)
    *   \`detailed_prompt\`: string (Your instructions for the worker AI)
*   **If \`type\` is \`'ADD_SLIDE'\`:** The object MUST contain:
    *   \`newSlideName\`: string (A concise name for the new slide)
    *   \`insertAfterSlideId\`: string (The ID of the slide that should come *before* the new one. Use "START" to add to the beginning.)
    *   \`detailed_prompt\`: string (Your instructions for creating the new slide)

**CRITICAL RULES:**
1. If a slide does not need to be changed, DO NOT include it in the plan.
2. **VERSIONS/VARIATIONS HANDLING:** If the user requests "N versions", "N variations", or "N different designs" of a slide:
   - Create ONLY ONE 'EDIT_SLIDE' task for that slide
   - In the detailed_prompt, explicitly state: "Generate N variations with different themes: [list the N distinct design directions]"
   - The system will automatically generate multiple variations from a single EDIT_SLIDE task
   - Example: "Give me 3 versions of slide 2" → ONE EDIT_SLIDE task with prompt: "Generate 3 variations: 1) Professional theme with corporate colors, 2) Creative theme with bold graphics, 3) Minimalist theme with elegant spacing"
3. DO NOT create multiple EDIT_SLIDE tasks for the same slideId - this will cause overwrites.
4. Only use 'ADD_SLIDE' when the user wants to INSERT a completely new slide into the deck.
5. **UPLOADED IMAGE FILES:** If the user mentions uploaded image files:
   - These are separate assets (not part of the slide deck)
   - Interpret the user's intent - they could say anything: "add logo", "add these 5 logos in customer slides", "use this icon", "recreate this sketch", "add these to reference slides"
   - In your detailed_prompt, describe how to use the uploaded files based on what the user asked for
   - Be flexible and context-aware - let the user's request guide how you use the uploaded images`
      : `You are a "Master Presentation Strategist" AI. Your goal is to create a JSON execution plan to modify a slide deck based on a user's high-level request.

**Your Inputs:**
1.  A user's request (e.g., "Customize this deck for dhl.com, add a POC slide...").
2.  A list of all slides in the deck, with their ID and original name.

**Your Task:**
1.  **Analyze the Request:** Deconstruct the user's prompt into specific, actionable tasks. This can include editing existing slides OR adding new slides.
2.  **Map Tasks to Slides:** Use the provided slide list to identify the correct slide for each task.
3.  **Formulate Detailed Prompts:** For each task, create a concise but comprehensive \`detailed_prompt\` for a "Worker" AI.
4.  **Construct the Plan:** Your final output MUST be a valid JSON object. Do not add any other explanation. The object must have two keys: \`thought_process\` and \`tasks\`.
    *   \`thought_process\`: A string summarizing your plan.
    *   \`tasks\`: An array of task objects. Each task object must have a \`type\`.

**Task Object Schemas:**
*   **If \`type\` is \`'EDIT_SLIDE'\`:** The object MUST contain:
    *   \`slideId\`: string (The ID of the slide to edit, from the provided list)
    *   \`detailed_prompt\`: string (Your instructions for the worker AI)
*   **If \`type\` is \`'ADD_SLIDE'\`:** The object MUST contain:
    *   \`newSlideName\`: string (A concise name for the new slide)
    *   \`insertAfterSlideId\`: string (The ID of the slide that should come *before* the new one. Use "START" to add to the beginning.)
    *   \`detailed_prompt\`: string (Your instructions for creating the new slide)

**CRITICAL RULES:**
1. If a slide does not need to be changed, DO NOT include it in the plan.
2. **VERSIONS/VARIATIONS HANDLING:** If the user requests "N versions", "N variations", or "N different designs" of a slide:
   - Create ONLY ONE 'EDIT_SLIDE' task for that slide
   - In the detailed_prompt, explicitly state: "Generate N variations with different themes: [list the N distinct design directions]"
   - The system will automatically generate multiple variations from a single EDIT_SLIDE task
   - Example: "Give me 3 versions of slide 2" → ONE EDIT_SLIDE task with prompt: "Generate 3 variations: 1) Professional theme with corporate colors, 2) Creative theme with bold graphics, 3) Minimalist theme with elegant spacing"
3. DO NOT create multiple EDIT_SLIDE tasks for the same slideId - this will cause overwrites.
4. Only use 'ADD_SLIDE' when the user wants to INSERT a completely new slide into the deck.
5. **UPLOADED IMAGE FILES:** If the user mentions uploaded image files:
   - These are separate assets (not part of the slide deck)
   - Interpret the user's intent - they could say anything: "add logo", "add these 5 logos in customer slides", "use this icon", "recreate this sketch", "add these to reference slides"
   - In your detailed_prompt, describe how to use the uploaded files based on what the user asked for
   - Be flexible and context-aware - let the user's request guide how you use the uploaded images`;

    // Build the prompt with slide references
    const slideListForPrompt = slidesInfo.map((s, idx) =>
      `- Slide ${idx + 1}: ID="${s.id}", Name="${s.name}"`
    ).join('\n');

    const fullPrompt = hasSlideImages
      ? `User Request: "${userPrompt}"\n\nSlide Deck Structure:\n${slideListForPrompt}\n\nI'm now showing you each slide image in order. Analyze them visually and create specific prompts for the changes needed.`
      : `User Request: "${userPrompt}"\n\nSlide Deck Structure:\n${slideListForPrompt}`;

    // Build content parts: system prompt + user prompt + slide images (if available)
    const contentParts: any[] = [
      { text: systemPrompt },
      { text: fullPrompt }
    ];

    // Add slide images for vision-based analysis (if available)
    if (hasSlideImages) {
      console.log(`[Master Agent] 👁️ Using VISION mode: Analyzing ${slidesInfo.length} slides visually...`);

      // Convert all URLs to base64 first
      const slideImageParts = await Promise.all(
        slidesInfo.map(async (slide, idx) => {
          if (slide.src) {
            const base64Src = await urlToBase64(slide.src);
            return [
              { text: `\n--- SLIDE ${idx + 1} (ID: ${slide.id}) ---` },
              fileToGenerativePart(base64Src)
            ];
          }
          return [];
        })
      );

      // Flatten and add to content parts
      slideImageParts.forEach(parts => {
        parts.forEach(part => contentParts.push(part));
      });

      console.log(`[Master Agent] Sending ${contentParts.length} content parts (system + prompt + ${slidesInfo.length * 2} slide parts) to Gemini 3 Pro...`);
    } else {
      console.log(`[Master Agent] 📝 Using TEXT mode: Planning based on slide names only (no images provided)...`);
    }

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [{ role: 'user', parts: contentParts }],
        config: {
          thinkingConfig: {
            thinkingBudget: 32768 // Max thinking budget for strategic planning
          },
          tools: [{ googleSearch: {} }],
        }
    });

    const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
    console.log(`[Master Agent] Received response. Parsing execution plan...`);

    try {
        const parsedPlan = JSON.parse(jsonText);
        console.log(`[Master Agent] ✅ Successfully created ${parsedPlan.tasks?.length || 0} tasks based on visual analysis`);

        // Create a map for quick slide name lookups
        const slideInfoMap = new Map(slidesInfo.map(s => [s.id, s.name]));

        const validatedTasks: DeckAiTask[] = (parsedPlan.tasks || []).map((rawTask: any) => {
            if (rawTask.type === 'EDIT_SLIDE') {
                const slideId = rawTask.slideId || rawTask.slide_id; // Handle both camelCase and snake_case
                if (!slideId) return null; // Invalid task
                
                const editTask: EditSlideTask = {
                    type: 'EDIT_SLIDE',
                    slideId: slideId,
                    slideName: slideInfoMap.get(slideId) || 'Unknown Slide', // Add the slideName
                    detailed_prompt: rawTask.detailed_prompt,
                };
                return editTask;
            }
            if (rawTask.type === 'ADD_SLIDE') {
                // Assuming ADD_SLIDE task is well-formed as per prompt
                return rawTask as AddSlideTask;
            }
            return null; // Invalid task type
        }).filter((task: DeckAiTask | null): task is DeckAiTask => task !== null);

        const finalPlan: DeckAiExecutionPlan = {
            thought_process: parsedPlan.thought_process,
            tasks: validatedTasks,
        };

        return finalPlan;
    } catch (e) {
        console.error("Failed to parse execution plan from AI:", e, jsonText);
        throw new Error("The AI strategist failed to generate a valid execution plan. Please try rephrasing your request.");
    }
};

export const executeSlideTask = async (base64Image: string, detailedPrompt: string, deepMode: boolean): Promise<{ images: string[], prompts: string[] }> => {
    const artistSystemPrompt = `You are a world-class "High-Fidelity Artist" AI. Your task is to edit the provided slide image based on a specific set of instructions.\n\n**CRITICAL RULES:**\n1.  **Preserve Original Content:** You MUST preserve all original branding, text, fonts, colors, and layout that you are not explicitly told to change.\n2.  **Match the Style:** Any new content (text or images) must perfectly match the visual style of the original slide.\n3.  **Follow Instructions Exactly:** Execute the detailed prompt precisely.\n4.  **Aspect Ratio:** Ensure the final slide maintains a standard 16:9 presentation aspect ratio.\n---\n**Detailed Prompt:** "${detailedPrompt}"`;
    const originalImagePart = fileToGenerativePart(base64Image);
    
    // Generate 3 variations for edit mode (gives user choice)
    const basePrompts = [
        artistSystemPrompt,
        `${artistSystemPrompt}\n(For this version, interpret the request with a slightly more creative or visually distinct style.)`,
        `${artistSystemPrompt}\n(For this version, offer another clean and professional alternative.)`,
    ];

    const promises = basePrompts.map(p => generateSingleImage('gemini-3-pro-image-preview', [originalImagePart], p, deepMode));
    const settledResults = await Promise.allSettled(promises);
    
    const images: string[] = [];
    const prompts: string[] = [];
    settledResults.forEach(result => {
        if (result.status === 'fulfilled') {
            images.push(result.value.image);
            prompts.push(result.value.finalPrompt);
        }
    });

    if (images.length === 0) {
        const firstError = settledResults.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
        throw new Error(firstError?.reason?.message || 'All image generation attempts failed.');
    }
    return { images, prompts };
};

export const createSlideFromPrompt = async (
    referenceSlideImage: string | null, // Now optional
    detailedPrompt: string,
    deepMode: boolean,
    logs: DebugLog[],
    onProgress?: (message: string) => void,
    theme?: CompanyTheme | null,
    logoImage?: string | null,
    customImage?: string | null,
    brandGuidelinesPrompt?: string | null  // Brand guidelines from style library for deck consistency
): Promise<{ images: string[], prompts: string[], logs: DebugLog[] }> => {
    console.log(`\n[createSlideFromPrompt] 📝 FUNCTION CALLED`);
    console.log(`[createSlideFromPrompt] Reference Image: ${referenceSlideImage ? 'YES' : 'NO'}`);
    console.log(`[createSlideFromPrompt] Prompt Length: ${detailedPrompt.length} chars`);
    console.log(`[createSlideFromPrompt] Deep Mode: ${deepMode}`);
    console.log(`[createSlideFromPrompt] Theme: ${theme ? 'YES' : 'NO'}`);
    console.log(`[createSlideFromPrompt] Logo: ${logoImage ? 'YES' : 'NO'}`);
    console.log(`[createSlideFromPrompt] Brand Guidelines: ${brandGuidelinesPrompt ? 'YES (' + brandGuidelinesPrompt.length + ' chars)' : 'NO'}`);

    // Convert Firebase Storage URL to base64 if needed
    if (referenceSlideImage && !referenceSlideImage.startsWith('data:image/')) {
        console.log(`[createSlideFromPrompt] Converting reference image URL to base64...`);
        referenceSlideImage = await urlToBase64(referenceSlideImage);
        console.log(`[createSlideFromPrompt] ✅ Conversion complete`);
    }

    onProgress?.('Briefing AI Creative Slide Designer...');
    logs.push({ title: "Designer Input", content: detailedPrompt });
    
    let themeInstructions = '';
    if (theme) {
        themeInstructions = `\n\n**THEME INSTRUCTIONS:**\n- Primary Color: ${theme.primaryColor}\n- Secondary Color: ${theme.secondaryColor}\n- Accent Color: ${theme.accentColor}\n- Font Style: ${theme.fontStyle}\n- Visual Style: ${theme.visualStyle}`;
    }

    // Brand guidelines extracted from style library (for deck-wide consistency)
    let brandGuidelinesSection = '';
    if (brandGuidelinesPrompt) {
        brandGuidelinesSection = `\n\n${brandGuidelinesPrompt}`;
        logs.push({ title: "Brand Guidelines (Deck Consistency)", content: brandGuidelinesPrompt });
    }

    let logoInstructions = '';
    let customImageInstructions = '';
    const imageParts = [];
    if (referenceSlideImage) {
        imageParts.push({ text: "--- REFERENCE SLIDE (FOR STYLE) ---" });
        imageParts.push(fileToGenerativePart(referenceSlideImage));
    }
     if (logoImage) {
        logoInstructions = `\n\n**LOGO PLACEMENT INSTRUCTION:** A company logo has been provided as a reference image.

**CRITICAL: PRESERVE EXISTING LOGOS**
- If the original slide already contains logos (e.g., Google Cloud, AWS, Microsoft, etc.), you MUST keep them exactly as they are
- The new logo should be ADDED to the slide, not replace existing logos
- If there's already a logo in the top-right corner, place the new logo in a different position (top-left, bottom-right, or bottom-left)
- If the top-right is empty, place the new logo there

**Logo Specifications:**
- Position: Top-right corner preferred (if available), otherwise top-left or bottom corner
- Size: Approximately 120-180px width (scale proportionally to match existing logos)
- Padding: 40-60px from edges
- Style: Recreate the logo's colors, shapes, and design elements as faithfully as possible
- Background: Ensure the logo has proper contrast against the slide background
- Quality: Make the logo clear, sharp, and professional

**Layout Guidance:**
- If multiple logos exist, arrange them in a clean, balanced way
- Maintain visual hierarchy - don't let logos compete for attention
- The new logo should establish brand identity without overwhelming the slide content or removing existing branding`;
        imageParts.push({ text: "--- COMPANY LOGO (ADD this while preserving existing logos) ---" });
        imageParts.push(fileToGenerativePart(logoImage));
    }
    if (customImage) {
        customImageInstructions = `\n\n**CUSTOM IMAGE INSTRUCTION:** You have been provided with a custom image. Incorporate this image into the slide design in a visually appealing and professional manner that complements the overall layout.`;
        imageParts.push({ text: "--- CUSTOM IMAGE (TO INCLUDE) ---" });
        imageParts.push(fileToGenerativePart(customImage));
    }


    const designerSystemPrompt = referenceSlideImage
        ? `You are a "Creative Slide Designer" AI. Your task is to create a brand new slide from scratch based on a detailed prompt.\n\n**CRITICAL RULES:**\n1.  **Reference Style:** You are provided with a reference slide image. The new slide you create MUST perfectly match the visual style, aesthetics, color palette, font choices, and general layout principles of this reference slide.\n2.  **Follow Prompt:** Create the content of the new slide based *only* on the detailed prompt.\n3.  **Aspect Ratio:** The new slide you create MUST be in a 16:9 aspect ratio.\n---\n**Detailed Prompt:** "${detailedPrompt}"${themeInstructions}${logoInstructions}${customImageInstructions}${brandGuidelinesSection}`
        : `You are a "Creative Slide Designer" AI. Your task is to create a brand new slide from scratch based on a detailed prompt.\n\n**CRITICAL RULES:**\n1. **Design Style:** Since no reference image is provided, create a clean, professional, and visually appealing design. Use a modern, minimalist aesthetic with good typography and layout principles.\n2.  **Follow Prompt:** Create the content of the new slide based *only* on the detailed prompt.\n3.  **Aspect Ratio:** The new slide you create MUST be in a 16:9 aspect ratio.\n---\n**Detailed Prompt:** "${detailedPrompt}"${themeInstructions}${logoInstructions}${customImageInstructions}${brandGuidelinesSection}`;
    
    
    // Generate only 1 variation to save time and cost
    const basePrompts = [
        designerSystemPrompt,
    ];

    console.log(`[createSlideFromPrompt] 🎨 Generating ${basePrompts.length} variation...`);
    console.log(`[createSlideFromPrompt] 📋 FULL PROMPT SENT TO GEMINI 2.5 FLASH IMAGE:`);
    console.log(basePrompts[0]); // Log the actual prompt being sent
    onProgress?.('Generating new slide...');
    const promises = basePrompts.map((p, idx) => {
        console.log(`[createSlideFromPrompt] Variation ${idx + 1}/${basePrompts.length} prompt length: ${p.length} chars`);
        return generateSingleImage('gemini-3-pro-image-preview', imageParts, p, deepMode, logs, onProgress);
    });
    const settledResults = await Promise.allSettled(promises);

    const images: string[] = [];
    const prompts: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    settledResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
            images.push(result.value.image);
            prompts.push(result.value.finalPrompt);
            successCount++;
            console.log(`[createSlideFromPrompt] ✅ Variation ${idx + 1} succeeded`);
        } else {
            failureCount++;
            const errorMsg = result.reason?.message || result.reason?.toString() || 'Unknown error';
            console.error(`[createSlideFromPrompt] ❌ Variation ${idx + 1} FAILED: ${errorMsg}`);
            logs.push({ title: `Generation Failed (Variation ${idx + 1})`, content: errorMsg });
        }
    });

    console.log(`[createSlideFromPrompt] 📊 Results: ${successCount} succeeded, ${failureCount} failed`);

    if (images.length === 0) {
        const firstError = settledResults.find(r => r.status === 'rejected') as PromiseRejectedResult | undefined;
        const errorMsg = firstError?.reason?.message || 'All image generation attempts failed.';
        console.error(`[createSlideFromPrompt] 🚨 ALL VARIATIONS FAILED: ${errorMsg}`);
        throw new Error(errorMsg);
    }
    console.log(`[createSlideFromPrompt] ✅ Returning ${images.length} image(s)\n`);
    return { images, prompts, logs };
};


export const analyzeDebugSession = async (session: DebugSession): Promise<string> => {
    const systemPrompt = `You are a "Debug Analyst" AI. Your task is to analyze a JSON object representing a failed AI generation session and provide a root cause analysis.

**Your Goal:** Explain clearly and concisely what went wrong.

**Your Process:**
1.  **Review the entire session JSON.** Pay close attention to the \`workflow\`, \`logs\`, and the final \`error\` message.
2.  **Summarize the Goal:** Briefly state what the user was trying to do (e.g., "The user was trying to remake a slide using a style reference.").
3.  **Pinpoint the Failure:** Identify the exact step in the \`logs\` where the process failed. Look for logs with titles like "FAILED..." or examine the final log before the error occurred.
4.  **Provide Root Cause Analysis:** Based on the logs and the error message, explain *why* it failed. Be specific.
    *   *Example 1:* "The process failed during the 'Content Extraction' step. The logs show the AI's output was not valid JSON, which caused a parsing error. This usually means the original slide was too complex or visually ambiguous for the AI to understand its structure."
    *   *Example 2:* "The process failed during the final 'Artist' generation. The error 'NO_IMAGE' indicates the AI refused to generate an image, likely due to a safety policy violation in the prompt or a prompt that was too abstract."
5.  **Suggest a Solution:** Recommend a specific action the user can take. (e.g., "Try rephrasing the prompt to be more direct," or "This slide may be too complex for the 'remake' feature; try using the inpainting tool for a more targeted edit.").

**Your Output:** A clear, well-structured analysis in Markdown format.`;

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [{ text: systemPrompt }, { text: `\n\n--- SESSION LOG TO ANALYZE ---\n\`\`\`json\n${JSON.stringify(session, null, 2)}\n\`\`\``}],
    });
    
    return response.text.trim();
};


// ==================================================================
// "CONTENT STRATEGIST" & "PROMPT ENHANCER" WORKFLOWS
// ==================================================================
export const generateOutlineFromNotes = async (rawNotes: string): Promise<string[]> => {
    const systemPrompt = `You are an expert "Presentation Content Strategist" for a leading tech company. Your specialty is transforming raw, unstructured information (like meeting notes, technical documents, or brainstorms) into a clear, concise, and compelling slide deck outline for a customer presentation.

**Your Task:**
1.  **Read and Deeply Understand** the entire context of the provided text.
2.  **Identify the Key Themes** and narrative pillars: What is the customer's problem? What is our proposed solution? What are the key technical details? What are the benefits? What is the call to action?
3.  **Structure a Logical Narrative Flow** suitable for a professional presentation. Start with a title, an agenda, build up the solution, and end with next steps.
4.  **Break Down the Narrative into Individual Slides.** Be selective. Not every detail needs its own slide. Group related concepts.
5.  For each slide, write a **clear and descriptive prompt** that includes a title and a summary of the key content or bullet points that should be on it. This prompt should be detailed enough for another AI to design the slide.

**CRITICAL CONSTRAINT:** The total number of slides in the outline should be reasonable for a standard business presentation and **MUST NOT exceed 30 slides**. Be concise and combine related topics onto single slides where appropriate.

**Your Output:**
Your final output MUST be a JSON array of strings, where each string is the complete, detailed prompt for one slide. Do not add any other explanation or text outside of the JSON array.`;

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [{ text: systemPrompt }, { text: `\n\n--- RAW NOTES TO ANALYZE ---\n${rawNotes}` }],
    });

    const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
    try {
        const parsedJson = JSON.parse(jsonText);
        if (Array.isArray(parsedJson) && parsedJson.every(item => typeof item === 'string')) {
            // Add a hard-coded safety net to prevent excessively long decks.
            if (parsedJson.length > 30) {
                return parsedJson.slice(0, 30);
            }
            return parsedJson;
        } else {
            throw new Error("AI output was valid JSON but not an array of strings.");
        }
    } catch (e) {
        console.error("Failed to parse presentation plan from AI:", e, jsonText);
        throw new Error("The AI strategist failed to generate a valid presentation plan. Please try again or refine your notes.");
    }
};


export const enhanceOutlinePrompts = async (originalPrompts: string[]): Promise<string[]> => {
    const systemPrompt = `You are a "Presentation Prompt Enhancer" AI. Your task is to take a user's basic, manually-written slide outline and enrich it to create high-quality, "slide-worthy" prompts for a designer AI.

**Your Goal:**
Transform a simple list of slide titles into a set of detailed, descriptive prompts. The new prompts should guide a designer AI to create visually appealing and content-rich slides.

**Your Process:**
1.  **Analyze the User's Outline:** Read the entire list of prompts to understand the overall topic and flow of the presentation.
2.  **Enrich Each Prompt:** For each prompt in the user's outline, expand upon it.
    *   If it's just a title (e.g., "Agenda"), add some placeholder content (e.g., "Agenda slide with 5 key topics: Introduction, Problem, Solution, Demo, Next Steps.").
    *   If it's a concept (e.g., "Our Solution"), add a descriptive title and break the concept down into a few key bullet points.
    *   Maintain the user's original intent, but make the prompt more descriptive and actionable for a designer.
3.  **Maintain Structure:** The number of prompts in your output MUST match the number of prompts in the input.

**Your Output:**
Your final output MUST be a JSON array of strings, with each string being the new, enhanced prompt. Do not add any other explanation or text outside of the JSON array.`;

    const fullPrompt = `--- USER'S OUTLINE ---\n${originalPrompts.join('\n')}`;
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [{ text: systemPrompt }, { text: fullPrompt }],
    });
    
     const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
    try {
        const parsedJson = JSON.parse(jsonText);
        if (Array.isArray(parsedJson) && parsedJson.length === originalPrompts.length && parsedJson.every(item => typeof item === 'string')) {
            return parsedJson;
        } else {
            console.warn("Prompt Enhancer output was malformed, falling back to original prompts.");
            return originalPrompts; // Fallback to original prompts if AI fails
        }
    } catch (e) {
        console.error("Failed to parse enhanced prompts from AI, falling back:", e, jsonText);
        return originalPrompts; // Fallback to original prompts on error
    }
};



// Dummy functions for older, unused features to prevent compilation errors if they are still referenced somewhere.
export const editImage = async (base64Image: string, prompt: string, deepMode: boolean = false): Promise<string> => {
    const originalImagePart = fileToGenerativePart(base64Image);
    const { image } = await generateSingleImage('gemini-3-pro-image-preview', [originalImagePart], prompt, deepMode);
    return image;
};
export const compositeImage = async (baseImage: string, overlayImage: string, prompt: string): Promise<string> => { throw new Error("Composite feature is not supported in this version.") };

export const generateThemeFromWebsite = async (companyWebsite: string): Promise<CompanyTheme> => {
    const systemPrompt = `You are an expert "Brand Analyst" AI. Your task is to analyze the provided company website to extract its core visual branding elements and synthesize them into a structured JSON theme.

**Your Process:**
1.  **Analyze the Website:** Use your search tool to thoroughly browse the provided URL: ${companyWebsite}. Pay close attention to the company's logo, button colors, background colors, heading fonts, and overall aesthetic (e.g., minimalist, corporate, playful).
2.  **Extract Core Elements:** Identify the primary, secondary, and accent colors (as hex codes). Determine the style of typography used (e.g., "a modern, clean sans-serif font"). Describe the overall visual style in a few keywords.
3.  **Return a Structured JSON Object:** Your final output MUST be a valid JSON object. Do not add any other explanation or text outside of the JSON object. The object must have the following keys: \`primaryColor\`, \`secondaryColor\`, \`accentColor\`, \`fontStyle\`, \`visualStyle\`.`;

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [{ text: systemPrompt }],
        config: {
            tools: [{ googleSearch: {} }],
        },
    });

    const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
    try {
        const parsedJson = JSON.parse(jsonText);
        // Basic validation
        if (parsedJson.primaryColor && parsedJson.fontStyle && parsedJson.visualStyle) {
            return parsedJson as CompanyTheme;
        } else {
            throw new Error("AI output was valid JSON but was missing required theme properties.");
        }
    } catch (e) {
        console.error("Failed to parse theme from AI:", e, jsonText);
        throw new Error("The AI brand analyst failed to generate a valid theme. The website might be inaccessible or too complex.");
    }
};

export interface TextRegion {
    text: string;
    boundingBox: {
        xPercent: number;
        yPercent: number;
        widthPercent: number;
        heightPercent: number;
    };
}

/**
 * Detect which text was clicked on a slide image with bounding box
 * Returns the text content and its bounding box for precise inpainting
 */
/**
 * Detect ALL text regions on a slide image at once (batch detection)
 * This is more efficient than detecting per-click
 * Returns an array of all text regions with their bounding boxes
 */
export const detectAllTextRegions = async (
    base64Image: string
): Promise<TextRegion[]> => {
    const imagePart = fileToGenerativePart(base64Image);

    const prompt = `Analyze this presentation slide image and identify ALL text elements visible on the slide.

**Your task:**
1. Find every text element in the image (headings, subheadings, body text, labels, etc.)
2. For each text element, return its content and bounding box
3. Return an array of all text regions in JSON format

**Return format (JSON array only, no markdown):**
[
  {
    "text": "Main Heading",
    "boundingBox": {
      "xPercent": 10,
      "yPercent": 15,
      "widthPercent": 80,
      "heightPercent": 10
    }
  },
  {
    "text": "Subtitle text here",
    "boundingBox": {
      "xPercent": 10,
      "yPercent": 30,
      "widthPercent": 70,
      "heightPercent": 5
    }
  }
]

**Important:**
- xPercent: left edge position (0-100)
- yPercent: top edge position (0-100)
- widthPercent: width of the text region (0-100)
- heightPercent: height of the text region (0-100)
- Include ALL visible text, even small labels
- If no text is found, return: []`;

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: { parts: [imagePart, { text: prompt }] },
    });

    const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');

    try {
        const parsed = JSON.parse(jsonText);

        if (!Array.isArray(parsed)) {
            console.error("Batch detection did not return an array:", jsonText);
            return [];
        }

        // Filter out invalid entries
        return parsed.filter((region: any) =>
            region.text &&
            region.text !== "NO_TEXT_FOUND" &&
            region.boundingBox
        ) as TextRegion[];
    } catch (e) {
        console.error("Failed to parse batch text detection response:", e, jsonText);
        return [];
    }
};

export const detectClickedText = async (
    base64Image: string,
    clickX: number,
    clickY: number,
    imageWidth: number,
    imageHeight: number
): Promise<TextRegion | null> => {
    const imagePart = fileToGenerativePart(base64Image);

    // Convert pixel coordinates to percentage (0-100)
    const xPercent = (clickX / imageWidth) * 100;
    const yPercent = (clickY / imageHeight) * 100;

    const prompt = `Analyze this presentation slide image and identify which text element is located at approximately ${xPercent.toFixed(0)}% from the left and ${yPercent.toFixed(0)}% from the top.

**Your task:**
1. Examine all text elements in the image
2. Determine which text is closest to the specified coordinates
3. Return the text content AND its bounding box in JSON format

**Return format (JSON only, no markdown):**
{
  "text": "the exact text content",
  "boundingBox": {
    "xPercent": 10,
    "yPercent": 15,
    "widthPercent": 50,
    "heightPercent": 10
  }
}

**Important:**
- xPercent: left edge position (0-100)
- yPercent: top edge position (0-100)
- widthPercent: width of the text region (0-100)
- heightPercent: height of the text region (0-100)
- If no text is near those coordinates, return: {"text": "NO_TEXT_FOUND"}`;

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: { parts: [imagePart, { text: prompt }] },
    });

    // Extract JSON from response (may be wrapped in ```json blocks or have explanatory text)
    let jsonText = response.text.trim();

    // Look for ```json block
    const jsonBlockMatch = jsonText.match(/```json\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
        jsonText = jsonBlockMatch[1].trim();
    } else {
        // No markdown block, try to find raw JSON object
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }
    }

    try {
        const parsed = JSON.parse(jsonText);

        if (parsed.text === "NO_TEXT_FOUND" || !parsed.text) {
            return null;
        }

        return parsed as TextRegion;
    } catch (e) {
        console.error("Failed to parse text detection response:", e, jsonText);
        return null;
    }
};

// ============================================================================
// LANDING PAGE DEMO FUNCTIONS
// ============================================================================

/**
 * Analyze brand identity for landing page demo
 * Used by DemoPlayer component on the landing page
 */
export const analyzeBrand = async (companyName: string): Promise<BrandProfile> => {
  const model = "gemini-2.5-flash";

  // Note: For the demo visualizer, we want to ensure we get the Atlassian colors
  // exactly right for the video effect, but we still use the AI to demonstrate the capability.
  const prompt = `
    Analyze the brand identity for "Atlassian".
    Return a JSON object with:
    - primaryColor: "#0052CC" (Atlassian Blue)
    - secondaryColor: "#172B4D" (Neutral Dark)
    - fontFamily: "Inter" or "sans-serif"
    - logoStyle: "modern"
    - keywords: ["Agile", "Teamwork", "Open", "Cloud"]

    Adhere strictly to this schema.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          primaryColor: { type: Type.STRING },
          secondaryColor: { type: Type.STRING },
          fontFamily: { type: Type.STRING },
          logoStyle: { type: Type.STRING, enum: ["modern", "classic", "tech"] },
          keywords: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["name", "primaryColor", "secondaryColor", "keywords"]
      } as Schema
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text) as BrandProfile;
};

/**
 * Generate deck structure for landing page demo
 * Used by DemoPlayer component on the landing page
 */
export const generateDeckStructure = async (
  topic: string,
  audience: string,
  brandContext: BrandProfile
): Promise<SlideContent[]> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    Create a 4-slide technical deck content for "Enterprise Security".
    Brand: Atlassian.

    Slides:
    1. Title: "Enterprise Trust & Security" (Type: title)
    2. Architecture: "Security Layer" (Type: architecture)
    3. Compliance: "SOC2 & ISO" (Type: security)
    4. Impact: "Risk Reduction" (Type: impact)

    Ensure content is high-quality and technical.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["title", "architecture", "code", "bullet_points", "pricing", "impact", "security"] },
            content: { type: Type.ARRAY, items: { type: Type.STRING } },
            codeSnippet: { type: Type.STRING },
            diagramNodes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "type", "content"]
        }
      } as Schema
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  return JSON.parse(text) as SlideContent[];
};
