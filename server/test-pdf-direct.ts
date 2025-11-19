/**
 * Test analyzeDeckTool with PDF sent directly to Gemini 3.0
 * No extraction needed - Gemini has native PDF vision support!
 */

import { GoogleGenAI } from '@google/genai';
import { readFileSync } from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || '' });

async function analyzePDFDirectly(pdfPath: string) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  PDF Direct Analysis with Gemini 3.0 Vision           ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`📁 PDF: ${pdfPath}\n`);

  const startTime = Date.now();

  try {
    // Read PDF as base64
    const pdfBuffer = readFileSync(pdfPath);
    const base64Pdf = pdfBuffer.toString('base64');

    console.log(`✅ PDF loaded: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📊 Sending to Gemini 3.0 with vision...\n`);

    // Send PDF directly to Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{
        role: 'user',
        parts: [
          {
            inlineData: {
              data: base64Pdf,
              mimeType: 'application/pdf'
            }
          },
          {
            text: `Analyze this presentation deck and return a JSON object with:

{
  "slideCount": <total number of slides>,
  "slides": [
    {
      "slideNumber": 1,
      "category": "<title|problem|solution|features|benefits|usecases|pricing|cta|other>",
      "textDensity": "<low|medium|high>",
      "visualElements": ["<list of visual elements>"],
      "colorScheme": ["<hex colors>"],
      "layout": "<centered|left-aligned|grid|two-column|image-heavy>",
      "mainMessage": "<what this slide is about>",
      "suggestions": ["<improvement suggestions>"]
    }
    // ... for each slide
  ],
  "overallTheme": "<visual theme description>",
  "deckFlow": "<narrative flow>",
  "missingSlides": ["<suggested additions>"],
  "recommendations": ["<deck-level improvements>"]
}

Provide comprehensive analysis of ALL slides.`
          }
        ]
      }],
      config: {
        thinkingConfig: {
          thinkingBudget: 32768 // Max thinking for full deck
        }
      }
    });

    const executionTime = Date.now() - startTime;

    console.log(`✅ Analysis complete in ${(executionTime / 1000).toFixed(1)}s\n`);

    // Parse response
    const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');

    try {
      const analysis = JSON.parse(jsonText);

      console.log('📊 DECK ANALYSIS:\n');
      console.log(`Total Slides: ${analysis.slideCount}`);
      console.log(`Overall Theme: ${analysis.overallTheme}`);
      console.log(`\nDeck Flow: ${analysis.deckFlow}`);

      console.log('\n' + '='.repeat(60));
      console.log('PER-SLIDE BREAKDOWN:');
      console.log('='.repeat(60) + '\n');

      analysis.slides.forEach((slide: any) => {
        console.log(`\n📄 Slide ${slide.slideNumber}: ${slide.category.toUpperCase()}`);
        console.log(`   Main Message: ${slide.mainMessage || 'N/A'}`);
        console.log(`   Text Density: ${slide.textDensity}`);
        console.log(`   Layout: ${slide.layout}`);
        console.log(`   Colors: ${slide.colorScheme.join(', ')}`);
        console.log(`   Visual Elements: ${slide.visualElements.join(', ')}`);

        // Quality Assessment
        if (slide.qualityScore !== undefined) {
          const scoreEmoji = slide.qualityScore >= 8 ? '🌟' : slide.qualityScore >= 6 ? '✅' : slide.qualityScore >= 4 ? '⚠️' : '❌';
          console.log(`\n   ${scoreEmoji} Quality Score: ${slide.qualityScore}/10 (${slide.status})`);
        }

        // Issues
        if (slide.issues && slide.issues.length > 0) {
          console.log(`\n   🚨 ISSUES:`);
          slide.issues.forEach((issue: any) => {
            const severityIcon = issue.severity === 'critical' ? '🔴' : issue.severity === 'important' ? '🟡' : '🟢';
            console.log(`      ${severityIcon} ${issue.type.toUpperCase()}: ${issue.description}`);
            console.log(`         → Fix: ${issue.recommendation}`);
          });
        }

        // Strengths
        if (slide.strengths && slide.strengths.length > 0) {
          console.log(`\n   ✨ STRENGTHS:`);
          slide.strengths.forEach((s: string) => console.log(`      + ${s}`));
        }

        // Improvements
        if (slide.improvements && slide.improvements.length > 0) {
          console.log(`\n   🔧 ACTIONABLE IMPROVEMENTS:`);
          slide.improvements.forEach((imp: string) => console.log(`      → ${imp}`));
        }

        // Suggestions
        if (slide.suggestions && slide.suggestions.length > 0) {
          console.log(`\n   💡 SUGGESTIONS:`);
          slide.suggestions.forEach((s: string) => console.log(`      - ${s}`));
        }
      });

      console.log('\n' + '='.repeat(60));
      console.log('RECOMMENDATIONS:');
      console.log('='.repeat(60) + '\n');

      analysis.recommendations.forEach((rec: string, i: number) => {
        console.log(`${i + 1}. ${rec}`);
      });

      if (analysis.missingSlides && analysis.missingSlides.length > 0) {
        console.log('\n' + '='.repeat(60));
        console.log('MISSING SLIDES (Suggested):');
        console.log('='.repeat(60) + '\n');
        analysis.missingSlides.forEach((slide: string, i: number) => {
          console.log(`${i + 1}. ${slide}`);
        });
      }

      console.log('\n✅ Full JSON response saved to analysis object');

    } catch (parseError: any) {
      console.log('⚠️  Could not parse JSON, raw response:');
      console.log(jsonText);
    }

  } catch (error: any) {
    console.log('\n❌ ERROR:', error.message);
    console.log('\nDetails:', error);
  }

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  Test Complete                                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

// Check API key
if (!process.env.VITE_GEMINI_API_KEY) {
  console.log('❌ ERROR: VITE_GEMINI_API_KEY not set');
  process.exit(1);
}

// Get PDF path
const pdfPath = process.argv[2] || '/Users/nabilrehman/Downloads/deckr-ai-presentation (24).pdf';

analyzePDFDirectly(pdfPath);
