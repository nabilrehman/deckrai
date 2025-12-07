/**
 * fetchCompanyLogoTool
 *
 * Fetches a company's logo using the Logo Extraction API
 * Used by ADK agent when creating customer-facing slides (especially title slides)
 *
 * The agent decides when to use this based on context:
 * - Customer presentations
 * - Partnership slides
 * - Title slides for customer meetings
 *
 * @tool
 */

import type { ToolResult, CompanyLogo } from '../types';

// Logo Extraction API (Cloud Run on bq-demos-469816)
const LOGO_EXTRACTION_API = 'https://logo-extraction-api-549403515075.us-central1.run.app';

// Clearbit as fallback (simple, reliable)
const CLEARBIT_LOGO_URL = 'https://logo.clearbit.com';

/**
 * Extract domain from URL or company name
 */
function extractDomain(input: string): string {
  // If it's already a domain-like string
  if (input.match(/^[a-z0-9-]+\.[a-z]{2,}$/i)) {
    return input.toLowerCase();
  }

  // Try to parse as URL
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    return url.hostname.replace(/^www\./, '');
  } catch {
    // Convert company name to domain guess
    // "Stripe Inc" -> "stripe.com"
    const cleaned = input
      .toLowerCase()
      .replace(/\s*(inc\.?|corp\.?|llc|ltd\.?|co\.?)\s*$/i, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();
    return `${cleaned}.com`;
  }
}

/**
 * Convert image URL to base64 data URL
 */
async function urlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/png';
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error('[fetchCompanyLogo] Error converting URL to base64:', error);
    throw error;
  }
}

/**
 * Fetch logo from Logo Extraction API
 */
async function fetchFromExtractionAPI(domain: string): Promise<{
  success: boolean;
  logoBase64?: string;
  logoUrl?: string;
  metadata?: any;
}> {
  try {
    console.log(`[fetchCompanyLogo] Calling Logo Extraction API for: ${domain}`);

    const response = await fetch(`${LOGO_EXTRACTION_API}/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });

    if (!response.ok) {
      throw new Error(`Logo API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`[fetchCompanyLogo] API response:`, {
      success: data.success,
      method: data.method,
      hasSource: !!data.metadata?.source
    });

    if (data.success && data.metadata?.source && data.metadata.source.startsWith('http')) {
      // API found a direct URL source - convert to base64
      console.log(`[fetchCompanyLogo] Converting source URL to base64: ${data.metadata.source}`);
      const logoBase64 = await urlToBase64(data.metadata.source);
      return {
        success: true,
        logoBase64,
        logoUrl: data.metadata.source,
        metadata: data.metadata,
      };
    }

    return { success: false };
  } catch (error) {
    console.error('[fetchCompanyLogo] Extraction API error:', error);
    return { success: false };
  }
}

/**
 * Fetch logo from Clearbit (fallback)
 */
async function fetchFromClearbit(domain: string): Promise<{
  success: boolean;
  logoBase64?: string;
  logoUrl?: string;
}> {
  try {
    const logoUrl = `${CLEARBIT_LOGO_URL}/${domain}`;
    console.log(`[fetchCompanyLogo] Trying Clearbit fallback: ${logoUrl}`);

    // Check if logo exists
    const headResponse = await fetch(logoUrl, { method: 'HEAD' });
    if (!headResponse.ok) {
      return { success: false };
    }

    // Convert to base64
    const logoBase64 = await urlToBase64(logoUrl);
    return {
      success: true,
      logoBase64,
      logoUrl,
    };
  } catch (error) {
    console.error('[fetchCompanyLogo] Clearbit error:', error);
    return { success: false };
  }
}

/**
 * Main function: Fetch company logo
 */
async function fetchCompanyLogo(
  params: { companyWebsite: string; size?: 'small' | 'medium' | 'large' },
  onProgress?: (update: { content: string }) => void
): Promise<ToolResult<CompanyLogo>> {
  const startTime = Date.now();
  const domain = extractDomain(params.companyWebsite);

  console.log(`[fetchCompanyLogo] Fetching logo for: ${params.companyWebsite} -> ${domain}`);
  onProgress?.({ content: `Fetching logo for ${domain}...` });

  try {
    // 1. Try Logo Extraction API first (more comprehensive)
    const extractionResult = await fetchFromExtractionAPI(domain);
    if (extractionResult.success && extractionResult.logoBase64) {
      console.log(`[fetchCompanyLogo] Success via Logo Extraction API`);
      return {
        success: true,
        data: {
          companyName: domain.split('.')[0],
          logoBase64: extractionResult.logoBase64,
          logoUrl: extractionResult.logoUrl,
          format: 'png',
        },
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    // 2. Fallback to Clearbit
    onProgress?.({ content: `Trying alternative source for ${domain}...` });
    const clearbitResult = await fetchFromClearbit(domain);
    if (clearbitResult.success && clearbitResult.logoBase64) {
      console.log(`[fetchCompanyLogo] Success via Clearbit fallback`);
      return {
        success: true,
        data: {
          companyName: domain.split('.')[0],
          logoBase64: clearbitResult.logoBase64,
          logoUrl: clearbitResult.logoUrl,
          format: 'png',
        },
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    // 3. Both failed
    console.log(`[fetchCompanyLogo] Could not find logo for ${domain}`);
    return {
      success: false,
      error: {
        code: 'LOGO_NOT_FOUND',
        message: `Could not find logo for ${domain}`,
      },
      metadata: {
        executionTime: Date.now() - startTime,
      },
    };

  } catch (error: any) {
    console.error('[fetchCompanyLogo] Error:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: error.message || 'Failed to fetch company logo',
      },
      metadata: {
        executionTime: Date.now() - startTime,
      },
    };
  }
}

/**
 * ADK Tool Schema
 */
export const fetchCompanyLogoTool = {
  name: 'fetchCompanyLogoTool',
  description: `Fetch a company's logo for use in slides. Use this when creating customer-facing presentations, especially title slides where you want to show the target customer's logo alongside the presenter's branding to convey partnership/collaboration. The agent should decide when this is appropriate based on context (e.g., "create slides for meeting with Stripe" -> fetch Stripe logo).`,
  parameters: {
    type: 'object',
    properties: {
      companyWebsite: {
        type: 'string',
        description: 'Company domain or website URL (e.g., "stripe.com", "https://airbnb.com", or just "Airbnb")',
      },
      size: {
        type: 'string',
        enum: ['small', 'medium', 'large'],
        description: 'Preferred logo size (default: medium). Small for thumbnails, large for hero placement.',
      },
    },
    required: ['companyWebsite'],
  },
  execute: fetchCompanyLogo,
};
