/**
 * researchCompanyTool
 *
 * Research a company using Gemini's web grounding capabilities
 *
 * Use cases:
 * - Understand company industry and challenges
 * - Find relevant use cases for personalization
 * - Identify decision makers and their concerns
 * - Get context for tailored presentations
 *
 * @tool
 */

import { GoogleGenAI } from '@google/genai';
import type { ToolResult, ResearchCompanyParams, CompanyResearch } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || '' });

/**
 * Research company information using web grounding
 */
export async function researchCompany(params: ResearchCompanyParams): Promise<ToolResult<CompanyResearch>> {
  const startTime = Date.now();

  try {
    console.log(`[researchCompanyTool] Researching: ${params.companyWebsite}`);
    console.log(`[researchCompanyTool] Goal: ${params.researchGoal}`);

    // Build research prompt based on goal
    let researchPrompt = '';

    const baseContext = `Research the company at ${params.companyWebsite} and provide comprehensive information.`;

    if (params.researchGoal === 'usecases') {
      researchPrompt = `${baseContext}

Focus on finding RELEVANT USE CASES for this company. Return a JSON object:

{
  "company": {
    "name": "Company Name",
    "industry": "Industry",
    "size": "Enterprise|Mid-Market|SMB",
    "description": "Brief description"
  },
  "relevantUseCases": [
    {
      "useCase": "Use case name",
      "description": "What this use case is",
      "applicability": "Why this is relevant for this company",
      "priority": "high|medium|low"
    }
  ]
}

Find 5-10 specific use cases that would be highly relevant for this company based on their industry, size, and business model.`;
    } else if (params.researchGoal === 'challenges') {
      researchPrompt = `${baseContext}

Focus on identifying BUSINESS CHALLENGES this company likely faces. Return a JSON object:

{
  "company": {
    "name": "Company Name",
    "industry": "Industry",
    "size": "Enterprise|Mid-Market|SMB",
    "description": "Brief description"
  },
  "challenges": [
    {
      "challenge": "Challenge name",
      "description": "Detailed description of the challenge",
      "relevance": "Why this challenge matters for this company"
    }
  ]
}

Identify 5-10 specific challenges based on their industry trends, company size, and business model.`;
    } else if (params.researchGoal === 'industry') {
      researchPrompt = `${baseContext}

Focus on INDUSTRY CONTEXT and competitive landscape. Return a JSON object:

{
  "company": {
    "name": "Company Name",
    "industry": "Industry",
    "size": "Enterprise|Mid-Market|SMB",
    "description": "Brief description"
  },
  "industryContext": {
    "sector": "Industry sector",
    "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"],
    "trends": ["Trend 1", "Trend 2", "Trend 3"]
  }
}

Provide competitive landscape and key industry trends affecting this company.`;
    } else {
      // Full research
      researchPrompt = `${baseContext}

Provide COMPREHENSIVE company research. Return a JSON object:

{
  "company": {
    "name": "Company Name",
    "industry": "Industry",
    "size": "Enterprise|Mid-Market|SMB",
    "description": "Brief description"
  },
  "industryContext": {
    "sector": "Industry sector",
    "competitors": ["Competitor 1", "Competitor 2", "Competitor 3"],
    "trends": ["Industry trend 1", "Industry trend 2", "Industry trend 3"]
  },
  "challenges": [
    {
      "challenge": "Challenge name",
      "description": "Detailed description",
      "relevance": "Why this matters"
    }
  ],
  "relevantUseCases": [
    {
      "useCase": "Use case name",
      "description": "What this use case is",
      "applicability": "Why relevant for this company",
      "priority": "high|medium|low"
    }
  ],
  "decisionMakers": {
    "primaryAudience": "C-Suite|VPs|Directors|Managers",
    "concerns": ["Concern 1", "Concern 2", "Concern 3"]
  },
  "customizationRecommendations": [
    "Recommendation 1 for personalizing presentations",
    "Recommendation 2",
    "Recommendation 3"
  ]
}

Provide comprehensive research for creating a highly personalized presentation.`;
    }

    // Call Gemini 3.0 with web grounding
    console.log(`[researchCompanyTool] Calling Gemini 3.0 with web grounding...`);

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        {
          role: 'user',
          parts: [{ text: researchPrompt }],
        },
      ],
      config: {
        tools: [{ googleSearch: {} }], // Enable web grounding
      },
    });

    const resultText = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON from markdown code blocks if present
    let jsonText = resultText;
    const jsonMatch = resultText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    // Parse the research results
    const research: CompanyResearch = JSON.parse(jsonText);

    const executionTime = Date.now() - startTime;
    console.log(`[researchCompanyTool] ✅ Research complete in ${executionTime}ms`);
    console.log(`[researchCompanyTool] Company: ${research.company.name}`);
    console.log(`[researchCompanyTool] Industry: ${research.company.industry}`);

    return {
      success: true,
      data: research,
      metadata: {
        executionTime,
        model: 'gemini-3-pro-preview',
      },
    };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`[researchCompanyTool] ❌ Error:`, error);

    return {
      success: false,
      error: {
        code: 'RESEARCH_FAILED',
        message: 'Failed to research company',
        details: error.message,
      },
      metadata: {
        executionTime,
      },
    };
  }
}

/**
 * ADK Tool Schema (to be exported by tools/index.ts)
 */
export const researchCompanyTool = {
  name: 'researchCompanyTool',
  description: 'Research a company using web grounding to gather information about their industry, challenges, use cases, and decision makers. Helps personalize presentations with relevant context.',
  parameters: {
    type: 'object',
    properties: {
      companyWebsite: {
        type: 'string',
        description: 'Company website URL (e.g., "atlassian.com", "https://www.google.com")',
      },
      researchGoal: {
        type: 'string',
        enum: ['usecases', 'challenges', 'industry', 'full'],
        description: 'What to research: "usecases" (find relevant use cases), "challenges" (identify business challenges), "industry" (competitive landscape), "full" (comprehensive research)',
      },
    },
    required: ['companyWebsite', 'researchGoal'],
  },
  execute: researchCompany,
};
