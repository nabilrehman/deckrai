/**
 * Test Phase 4: Research & Brand Tools
 * Tests company research, brand analysis, and logo fetching
 */

import { researchCompanyTool } from './tools/researchCompany';
import { analyzeBrandTool } from './tools/analyzeBrand';
import { fetchCompanyLogoTool } from './tools/fetchLogo';

async function testResearchTools() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Test Phase 4: Research & Brand Tools                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const testCompany = 'atlassian.com';
  const startTime = Date.now();

  // Test 1: Brand Analysis
  console.log('═'.repeat(60));
  console.log('Test 1: Brand Analysis');
  console.log('═'.repeat(60));

  const brandResult = await analyzeBrandTool.execute({
    companyWebsite: testCompany,
  });

  if (brandResult.success && brandResult.data) {
    console.log(`\n✅ Brand analysis successful (${brandResult.metadata?.executionTime}ms)\n`);
    console.log(`🎨 Primary Color: ${brandResult.data.primaryColor}`);
    console.log(`🎨 Secondary Color: ${brandResult.data.secondaryColor}`);
    console.log(`🎨 Accent Color: ${brandResult.data.accentColor}`);
    console.log(`✍️  Font Style: ${brandResult.data.fontStyle}`);
    console.log(`🖼️  Visual Style: ${brandResult.data.visualStyle}`);
    console.log(`📚 Sources: ${brandResult.data.sources.join(', ')}`);
  } else {
    console.log(`\n❌ Brand analysis failed:`, brandResult.error);
  }

  console.log('\n⏳ Waiting 3 seconds before next test...\n');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Test 2: Company Research (use cases)
  console.log('═'.repeat(60));
  console.log('Test 2: Company Research (Use Cases)');
  console.log('═'.repeat(60));

  const researchResult = await researchCompanyTool.execute({
    companyWebsite: testCompany,
    researchGoal: 'usecases',
  });

  if (researchResult.success && researchResult.data) {
    console.log(`\n✅ Research successful (${researchResult.metadata?.executionTime}ms)\n`);
    console.log(`🏢 Company: ${researchResult.data.company.name}`);
    console.log(`🏭 Industry: ${researchResult.data.company.industry}`);
    console.log(`📏 Size: ${researchResult.data.company.size}`);
    console.log(`📝 Description: ${researchResult.data.company.description}\n`);

    if (researchResult.data.relevantUseCases && researchResult.data.relevantUseCases.length > 0) {
      console.log(`💡 Relevant Use Cases (${researchResult.data.relevantUseCases.length}):`);
      researchResult.data.relevantUseCases.slice(0, 5).forEach((uc, i) => {
        console.log(`\n   ${i + 1}. ${uc.useCase} [${uc.priority}]`);
        console.log(`      ${uc.description}`);
        console.log(`      Why: ${uc.applicability}`);
      });
    }
  } else {
    console.log(`\n❌ Research failed:`, researchResult.error);
  }

  console.log('\n⏳ Waiting 3 seconds before next test...\n');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Test 3: Logo Fetching
  console.log('═'.repeat(60));
  console.log('Test 3: Logo Fetching');
  console.log('═'.repeat(60));

  const logoResult = await fetchCompanyLogoTool.execute({
    companyWebsite: testCompany,
    size: 'medium',
  });

  if (logoResult.success && logoResult.data) {
    console.log(`\n✅ Logo fetch successful (${logoResult.metadata?.executionTime}ms)\n`);
    console.log(`🏢 Company: ${logoResult.data.companyName}`);
    console.log(`🔗 Logo URL: ${logoResult.data.logoUrl}`);
    console.log(`📄 Format: ${logoResult.data.format}`);
  } else {
    console.log(`\n❌ Logo fetch failed:`, logoResult.error);
  }

  const totalTime = Date.now() - startTime;

  console.log(`\n\n╔════════════════════════════════════════════════════════╗`);
  console.log(`║  All Tests Complete (${totalTime}ms total)              ║`);
  console.log(`╚════════════════════════════════════════════════════════╝\n`);
}

// Check API key
if (!process.env.VITE_GEMINI_API_KEY) {
  console.log('❌ ERROR: VITE_GEMINI_API_KEY not set');
  process.exit(1);
}

testResearchTools();
