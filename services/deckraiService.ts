/**
 * DeckRAI ADK Service - HTTP Client for ADK Backend
 *
 * This service makes HTTP calls to the Node.js backend server running ADK.
 * The backend server exposes REST API endpoints that run the ADK coordinator.
 *
 * Architecture:
 * Frontend (Browser) → HTTP → Backend (Node.js + ADK) → Gemini API
 */

// API base URL - defaults to localhost for development
const API_URL = import.meta.env.VITE_ADK_API_URL || 'http://localhost:8000';

export interface ADKAnalysisResult {
  questions: Array<{
    question: string;
    options: string[];
    reasoning: string;
  }>;
  suggestions: {
    recommendedSlideCount: number;
    recommendedStyle: string;
    reasoning: string;
  };
}

export interface GenerationContext {
  notes: string;
  audience: string;
  slideCount: number;
  style: string;
  tone: string;
}

/**
 * Analyze notes and ask questions using ADK coordinator (via backend API)
 *
 * @param userPrompt - User's input text
 * @param mentionedSlideIds - Optional array of slide IDs mentioned with @ (e.g., @slide2)
 * @param slides - Optional array of current slides (for edit mode)
 */
export async function analyzeNotesAndAskQuestions(
  userPrompt: string,
  mentionedSlideIds?: string[],
  slides?: any[]
): Promise<ADKAnalysisResult> {
  console.log('🌐 [ADK Client] Calling backend API');
  console.log('📝 [ADK Client] User prompt:', userPrompt.substring(0, 100) + '...');
  if (mentionedSlideIds && mentionedSlideIds.length > 0) {
    console.log('📌 [ADK Client] Mentioned slides:', mentionedSlideIds);
  }

  try {
    const response = await fetch(`${API_URL}/api/adk/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userPrompt,
        mentionedSlideIds,
        slides
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [ADK Client] Backend response received:', data);

    // Parse the coordinator result
    const analysis = parseCoordinatorResult(data.result, userPrompt, data.isEditMode);

    console.log('✅ [ADK Client] Analysis result:', analysis);
    return analysis;

  } catch (error: any) {
    console.error('❌ [ADK Client] API call failed:', error);

    // Fallback to sensible defaults
    return {
      questions: [
        {
          question: "Who is your audience?",
          options: ["Internal Team", "Executives", "Customers", "Investors"],
          reasoning: "Understanding your audience helps tailor the content and tone"
        },
        {
          question: "How many slides do you need?",
          options: ["3-5 (Quick overview)", "7-10 (Standard deck)", "15+ (Comprehensive)"],
          reasoning: "Based on your content, I can adjust the depth and detail"
        }
      ],
      suggestions: {
        recommendedSlideCount: 7,
        recommendedStyle: "executive",
        reasoning: "Standard deck with professional style (backend unavailable - using fallback)"
      }
    };
  }
}

/**
 * Generate slides with full context using ADK coordinator (via backend API)
 */
export async function generateSlidesWithContext(
  context: GenerationContext
): Promise<string[]> {
  console.log('🌐 [ADK Client] Calling backend API for slide generation');
  console.log('📝 [ADK Client] Context:', context);

  try {
    const response = await fetch(`${API_URL}/api/adk/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [ADK Client] Backend response received');

    // Parse slide prompts from result
    const slidePrompts = parseSlidePromptsFromResult(data.result, context);

    console.log(`✅ [ADK Client] Generated ${slidePrompts.length} slide prompts`);
    return slidePrompts;

  } catch (error: any) {
    console.error('❌ [ADK Client] API call failed:', error);
    throw new Error(`ADK slide generation failed: ${error.message}`);
  }
}

/**
 * Execute slide editing task using ADK coordinator (via backend API)
 */
export async function executeSlideTask(
  slideId: string,
  task: string,
  currentSlideSrc: string,
  slides?: any[]
): Promise<string> {
  console.log('🌐 [ADK Client] Calling backend API for slide edit');
  console.log('🆔 [ADK Client] Slide ID:', slideId);
  console.log('📝 [ADK Client] Task:', task);

  try {
    const response = await fetch(`${API_URL}/api/adk/edit-slide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        slideId,
        task,
        currentSlideSrc,
        slides
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ [ADK Client] Backend response received');

    // Return the new slide src
    return data.newSlideSrc;

  } catch (error: any) {
    console.error('❌ [ADK Client] API call failed:', error);
    throw new Error(`ADK slide edit failed: ${error.message}`);
  }
}

/**
 * Parse coordinator result into analysis format
 * @param result - Result from ADK coordinator
 * @param userPrompt - Original user prompt
 * @param isEditMode - Whether this is edit mode (true) or create mode (false)
 */
function parseCoordinatorResult(result: any, userPrompt: string, isEditMode: boolean = false): ADKAnalysisResult {
  // Try to extract structured data from coordinator response
  // For now, use intelligent defaults based on prompt analysis

  const promptLower = userPrompt.toLowerCase();

  // EDIT MODE - Different analysis for slide editing
  if (isEditMode) {
    return {
      questions: [
        {
          question: "How should I apply this change?",
          options: ["Subtle refinement", "Moderate update", "Complete redesign"],
          reasoning: "Understanding the extent of changes helps maintain visual consistency"
        }
      ],
      suggestions: {
        recommendedSlideCount: 1, // Editing doesn't change count
        recommendedStyle: "maintain_existing",
        reasoning: "ADK Coordinator will edit the selected slide(s) while maintaining the existing deck style and tone."
      }
    };
  }

  // CREATE MODE - Analyze for new deck creation
  // Detect slide count from prompt
  let slideCount = 7; // default
  const countMatch = userPrompt.match(/(\d+)[- ]?slide/i);
  if (countMatch) {
    slideCount = parseInt(countMatch[1], 10);
  } else if (promptLower.includes('quick') || promptLower.includes('brief')) {
    slideCount = 5;
  } else if (promptLower.includes('comprehensive') || promptLower.includes('detailed')) {
    slideCount = 12;
  }

  // Detect style from prompt
  let style = 'executive';
  if (promptLower.includes('visual') || promptLower.includes('creative')) {
    style = 'visual';
  } else if (promptLower.includes('data') || promptLower.includes('analytics')) {
    style = 'data';
  } else if (promptLower.includes('technical') || promptLower.includes('architecture')) {
    style = 'technical';
  }

  // Detect audience from prompt
  let audienceQuestion = "Who is your audience?";
  let audienceOptions = ["Internal Team", "Executives", "Customers", "Investors", "Conference Audience"];

  if (promptLower.includes('pitch') || promptLower.includes('investor')) {
    audienceQuestion = "This looks like an investor pitch. Confirm your audience?";
    audienceOptions = ["Investors", "Venture Capitalists", "Angel Investors", "Board Members"];
  } else if (promptLower.includes('customer') || promptLower.includes('sales')) {
    audienceQuestion = "This looks like a customer presentation. Confirm your audience?";
    audienceOptions = ["Customers", "Prospects", "Partners", "Clients"];
  }

  return {
    questions: [
      {
        question: audienceQuestion,
        options: audienceOptions,
        reasoning: "Understanding your audience helps tailor the content and tone appropriately"
      },
      {
        question: `I'm planning ${slideCount} slides. Adjust the count?`,
        options: [
          "3-5 (Quick overview)",
          `${slideCount} (Keep recommendation)`,
          "15+ (Comprehensive)"
        ],
        reasoning: "Based on your content depth, this count balances detail with engagement"
      }
    ],
    suggestions: {
      recommendedSlideCount: slideCount,
      recommendedStyle: style,
      reasoning: `ADK Coordinator analyzed your request and recommends a ${slideCount}-slide ${style} presentation. This format will effectively communicate your key messages while maintaining audience engagement.`
    }
  };
}

/**
 * Parse slide prompts from coordinator result
 */
function parseSlidePromptsFromResult(result: any, context: GenerationContext): string[] {
  const slideCount = context.slideCount || 7;
  const style = context.style || 'executive';
  const audience = context.audience || 'professional';

  // Generate slide prompts based on context
  // In full implementation, this would come from the coordinator's specialized agents
  const prompts: string[] = [];

  for (let i = 0; i < slideCount; i++) {
    if (i === 0) {
      prompts.push(`Title slide: Create a compelling opening slide with the presentation title, tagline, and presenter info. Style: ${style}, Audience: ${audience}. Use bold typography and professional imagery.`);
    } else if (i === slideCount - 1) {
      prompts.push(`Closing slide: Create a strong call-to-action slide with contact information and next steps. Style: ${style}. Include clear CTA and contact details with professional design.`);
    } else {
      prompts.push(`Content slide ${i}: Create slide covering key point ${i} from the notes. Style: ${style}, Audience: ${audience}. Use ${style === 'visual' ? 'large imagery with minimal text' : style === 'data' ? 'charts and visualizations' : 'clear bullet points and supporting visuals'}. Keep text concise (30-50 words max).`);
    }
  }

  return prompts;
}
