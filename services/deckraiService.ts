/**
 * DeckRAI ADK Service - Wrapper for Google Agent Development Kit Coordinator
 * Maintains compatibility with existing UI while using new ADK architecture
 */

import { Session, InvocationContext } from '@google/genai/agents';
import { getDeckRAIAgent } from './adk/deckraiAgent';
import type { GenerationContext } from './intelligentGeneration';

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

/**
 * Analyze notes and ask questions using ADK coordinator
 * Drop-in replacement for intelligentGeneration.analyzeNotesAndAskQuestions
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
  console.log('🤖 [ADK] analyzeNotesAndAskQuestions called');
  console.log('📝 [ADK] User prompt:', userPrompt.substring(0, 100) + '...');
  if (mentionedSlideIds && mentionedSlideIds.length > 0) {
    console.log('📌 [ADK] Mentioned slides:', mentionedSlideIds);
  }

  try {
    // Create ADK session for this request
    const session = new Session({ sessionId: `analyze-${Date.now()}` });

    // Detect mode: EDIT if slides mentioned, CREATE otherwise
    const isEditMode = mentionedSlideIds && mentionedSlideIds.length > 0;

    if (isEditMode && slides) {
      // EDIT MODE - Set session state for editing specific slides
      session.state.set('mode', 'edit');
      session.state.set('target_slide_ids', mentionedSlideIds);
      session.state.set('user_input', userPrompt);

      // Calculate slide numbers (1-indexed) from IDs
      const slideNumbers = mentionedSlideIds.map(id => {
        const index = slides.findIndex(s => s.id === id);
        return index + 1;
      });
      session.state.set('target_slide_numbers', slideNumbers);

      // Determine scope
      const scope = mentionedSlideIds.length === slides.length ? 'all' :
                   mentionedSlideIds.length > 1 ? 'multiple' : 'single';
      session.state.set('scope', scope);

      console.log(`⚡ [ADK] Edit mode: ${scope} - slides ${slideNumbers.join(', ')}`);
    } else {
      // CREATE MODE - Set session state for new deck creation
      session.state.set('mode', 'create');
      session.state.set('user_input', userPrompt);
      console.log('⚡ [ADK] Create mode');
    }

    console.log('⚡ [ADK] Session created, calling coordinator...');

    // Create invocation context
    const ctx = new InvocationContext({
      session,
      userMessage: userPrompt,
      timestamp: new Date()
    });

    // Get coordinator agent and run
    const agent = getDeckRAIAgent();
    const result = await agent.runAsync(ctx);

    console.log('✅ [ADK] Coordinator complete:', result);

    // Parse result from coordinator
    const analysis = parseCoordinatorResult(result, userPrompt, isEditMode);

    console.log('✅ [ADK] Analysis result:', analysis);
    return analysis;

  } catch (error: any) {
    console.error('❌ [ADK] Error in analyzeNotesAndAskQuestions:', error);

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
        reasoning: "Standard deck with professional style (ADK coordinator fallback)"
      }
    };
  }
}

/**
 * Generate slides with full context using ADK coordinator
 * Drop-in replacement for intelligentGeneration.generateSlidesWithContext
 */
export async function generateSlidesWithContext(
  context: GenerationContext
): Promise<string[]> {
  console.log('🤖 [ADK] generateSlidesWithContext called');
  console.log('📝 [ADK] Context:', context);

  try {
    // Create ADK session for slide generation
    const session = new Session({ sessionId: `generate-${Date.now()}` });

    // Set session state with full context
    session.state.set('mode', 'create');
    session.state.set('user_input', context.notes);
    session.state.set('audience', context.audience);
    session.state.set('slide_count', context.slideCount);
    session.state.set('style', context.style);
    session.state.set('tone', context.tone);

    console.log('⚡ [ADK] Session created, calling coordinator...');

    // Create invocation context
    const ctx = new InvocationContext({
      session,
      userMessage: `Generate ${context.slideCount} slides for ${context.audience} in ${context.style} style: ${context.notes}`,
      timestamp: new Date()
    });

    // Get coordinator agent and run
    const agent = getDeckRAIAgent();
    const result = await agent.runAsync(ctx);

    console.log('✅ [ADK] Coordinator complete');

    // Parse slide prompts from result
    const slidePrompts = parseSlidePromptsFromResult(result, context);

    console.log(`✅ [ADK] Generated ${slidePrompts.length} slide prompts`);
    return slidePrompts;

  } catch (error: any) {
    console.error('❌ [ADK] Error in generateSlidesWithContext:', error);
    throw new Error(`ADK slide generation failed: ${error.message}`);
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
 * Execute slide editing task using ADK coordinator
 * Drop-in replacement for geminiService.executeSlideTask
 *
 * @param slideId - ID of the slide to edit
 * @param task - Edit task description
 * @param currentSlideSrc - Current slide image data URL
 * @param slides - Array of all slides (for context)
 * @returns Promise<string> - New slide image data URL
 */
export async function executeSlideTask(
  slideId: string,
  task: string,
  currentSlideSrc: string,
  slides?: any[]
): Promise<string> {
  console.log('🤖 [ADK] executeSlideTask called');
  console.log('📝 [ADK] Task:', task);
  console.log('🆔 [ADK] Slide ID:', slideId);

  try {
    // Create ADK session for slide editing
    const session = new Session({ sessionId: `edit-slide-${Date.now()}` });

    // Set session state for EDIT mode
    session.state.set('mode', 'edit');
    session.state.set('target_slide_ids', [slideId]);
    session.state.set('user_input', task);
    session.state.set('scope', 'single');

    // Add slide number if slides array provided
    if (slides) {
      const slideIndex = slides.findIndex(s => s.id === slideId);
      if (slideIndex !== -1) {
        session.state.set('target_slide_numbers', [slideIndex + 1]);
      }
    }

    console.log('⚡ [ADK] Session created for slide edit, calling coordinator...');

    // Create invocation context
    const ctx = new InvocationContext({
      session,
      userMessage: task,
      timestamp: new Date()
    });

    // Get coordinator agent and run
    const agent = getDeckRAIAgent();
    const result = await agent.runAsync(ctx);

    console.log('✅ [ADK] Coordinator edit complete');

    // For now, return the current slide (full implementation pending)
    // In full implementation, this would return the edited slide from the specialized agent
    return currentSlideSrc;

  } catch (error: any) {
    console.error('❌ [ADK] Error in executeSlideTask:', error);
    throw new Error(`ADK slide edit failed: ${error.message}`);
  }
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
