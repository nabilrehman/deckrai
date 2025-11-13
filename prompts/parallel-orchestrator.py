#!/usr/bin/env python3
"""
Parallel Slide Deck Generator - Orchestrator
Runs master planning + parallel slide agents for complete deck generation
"""

import os
import json
import time
from datetime import datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("ERROR: google-genai package not installed.")
    print("Install with: pip install google-genai")
    exit(1)

# Configuration
API_KEY = os.getenv("VITE_GEMINI_API_KEY")
if not API_KEY:
    print("ERROR: VITE_GEMINI_API_KEY not found in environment")
    exit(1)

# Prompts directory
PROMPTS_DIR = Path(__file__).parent


def load_prompt(filename):
    """Load a prompt template"""
    with open(PROMPTS_DIR / filename, 'r') as f:
        return f.read()


def run_master_planning(company, content, audience, goal, slide_count):
    """Phase 1: Run master planning agent"""
    print("\n" + "="*80)
    print("PHASE 1: MASTER PLANNING AGENT")
    print("="*80 + "\n")

    # Load master prompt template
    master_template = load_prompt('parallel-master-prompt.md')

    # Fill in the template
    master_prompt = master_template.replace('[COMPANY_NAME]', company)
    master_prompt = master_prompt.replace('[CONTENT_DESCRIPTION]', content)
    master_prompt = master_prompt.replace('[AUDIENCE_TYPE]', audience)
    master_prompt = master_prompt.replace('[GOAL]', goal)
    master_prompt = master_prompt.replace('[NUMBER]', str(slide_count))

    print("Running master planning agent...")
    print(f"- Company: {company}")
    print(f"- Slides: {slide_count}")

    client = genai.Client(api_key=API_KEY)

    start_time = time.time()

    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=master_prompt,
        config=types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(
                thinking_budget=16384,
                include_thoughts=True
            )
        )
    )

    elapsed = time.time() - start_time

    # Extract output
    thoughts = []
    output = []

    for part in response.candidates[0].content.parts:
        if part.thought:
            thoughts.append(part.text)
        else:
            output.append(part.text)

    master_output = '\n\n'.join(output)

    print(f"\n✓ Master planning complete in {elapsed:.2f}s")
    print(f"  Output length: {len(master_output)} characters")

    return {
        'output': master_output,
        'thoughts': '\n\n'.join(thoughts) if thoughts else None,
        'elapsed_time': elapsed
    }


def parse_slide_briefs(master_output):
    """Extract individual slide briefs from master output"""
    print("\n" + "="*80)
    print("EXTRACTING SLIDE BRIEFS")
    print("="*80 + "\n")

    # Find all slide briefs (look for "## SLIDE X BRIEF:")
    import re

    # Split by slide brief headers
    slide_pattern = r'(## SLIDE \d+ BRIEF:.*?)(?=## SLIDE \d+ BRIEF:|## NEXT STEPS|$)'
    matches = re.findall(slide_pattern, master_output, re.DOTALL)

    briefs = []
    for match in matches:
        # Extract slide number
        slide_num_match = re.search(r'## SLIDE (\d+) BRIEF:', match)
        if slide_num_match:
            slide_num = int(slide_num_match.group(1))
            briefs.append({
                'slide_number': slide_num,
                'brief': match.strip()
            })

    print(f"✓ Extracted {len(briefs)} slide briefs")
    for brief in briefs:
        print(f"  - Slide {brief['slide_number']}")

    return briefs


def extract_brand_and_design_system(master_output):
    """Extract brand guidelines and design system from master output"""
    # Find the sections
    import re

    # Extract BRAND RESEARCH section
    brand_match = re.search(r'## BRAND RESEARCH(.*?)(?=## DECK ARCHITECTURE|$)', master_output, re.DOTALL)
    brand_section = brand_match.group(1).strip() if brand_match else ""

    # Extract DESIGN SYSTEM section
    design_match = re.search(r'## DESIGN SYSTEM(.*?)(?=## SLIDE BRIEFS|$)', master_output, re.DOTALL)
    design_section = design_match.group(1).strip() if design_match else ""

    combined = f"""## BRAND GUIDELINES

{brand_section}

---

## DESIGN SYSTEM

{design_section}
"""

    return combined


def run_slide_agent(slide_number, slide_brief, brand_and_design):
    """Phase 2: Run a single slide agent"""
    # Load slide agent template
    slide_template = load_prompt('parallel-slide-agent-prompt.md')

    # Build the complete prompt
    slide_prompt = f"""# SLIDE SPECIFICATION TASK

You are generating the specification for SLIDE {slide_number}.

---

{brand_and_design}

---

{slide_brief}

---

{slide_template}
"""

    client = genai.Client(api_key=API_KEY)

    start_time = time.time()

    try:
        response = client.models.generate_content(
            model="gemini-2.5-pro",
            contents=slide_prompt,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(
                    thinking_budget=8192,  # Lower budget for individual slides
                    include_thoughts=False  # Don't need thinking for individual slides
                )
            )
        )

        elapsed = time.time() - start_time

        # Extract output
        output = []
        for part in response.candidates[0].content.parts:
            if not part.thought:
                output.append(part.text)

        slide_output = '\n\n'.join(output)

        return {
            'slide_number': slide_number,
            'output': slide_output,
            'elapsed_time': elapsed,
            'success': True
        }

    except Exception as e:
        elapsed = time.time() - start_time
        return {
            'slide_number': slide_number,
            'output': None,
            'elapsed_time': elapsed,
            'success': False,
            'error': str(e)
        }


def run_parallel_slide_agents(slide_briefs, brand_and_design, max_workers=5):
    """Phase 2: Run all slide agents in parallel"""
    print("\n" + "="*80)
    print("PHASE 2: PARALLEL SLIDE AGENTS")
    print("="*80 + "\n")

    print(f"Spawning {len(slide_briefs)} parallel agents...")
    print(f"Max concurrent workers: {max_workers}\n")

    results = []
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_slide = {
            executor.submit(
                run_slide_agent,
                brief['slide_number'],
                brief['brief'],
                brand_and_design
            ): brief['slide_number']
            for brief in slide_briefs
        }

        # Process as they complete
        for future in as_completed(future_to_slide):
            slide_num = future_to_slide[future]
            try:
                result = future.result()
                if result['success']:
                    print(f"✓ Slide {slide_num} complete ({result['elapsed_time']:.2f}s)")
                else:
                    print(f"✗ Slide {slide_num} failed: {result.get('error', 'Unknown error')}")
                results.append(result)
            except Exception as e:
                print(f"✗ Slide {slide_num} exception: {str(e)}")
                results.append({
                    'slide_number': slide_num,
                    'success': False,
                    'error': str(e)
                })

    total_time = time.time() - start_time

    # Sort by slide number
    results.sort(key=lambda x: x['slide_number'])

    print(f"\n✓ All slide agents complete in {total_time:.2f}s")
    print(f"  Success: {sum(1 for r in results if r['success'])}/{len(results)}")

    return results


def assemble_final_document(master_output, slide_results):
    """Assemble the final complete specification document"""
    print("\n" + "="*80)
    print("ASSEMBLING FINAL DOCUMENT")
    print("="*80 + "\n")

    import re

    # Extract sections from master output
    exec_summary_match = re.search(r'## EXECUTIVE SUMMARY(.*?)(?=##|\Z)', master_output, re.DOTALL)
    exec_summary = exec_summary_match.group(1).strip() if exec_summary_match else ""

    brand_match = re.search(r'## BRAND RESEARCH(.*?)(?=## DECK ARCHITECTURE|\Z)', master_output, re.DOTALL)
    brand_research = brand_match.group(1).strip() if brand_match else ""

    arch_match = re.search(r'## DECK ARCHITECTURE(.*?)(?=## DESIGN SYSTEM|\Z)', master_output, re.DOTALL)
    architecture = arch_match.group(1).strip() if arch_match else ""

    design_match = re.search(r'## DESIGN SYSTEM(.*?)(?=## SLIDE BRIEFS|\Z)', master_output, re.DOTALL)
    design_system = design_match.group(1).strip() if design_match else ""

    # Build final document
    final_doc = f"""# COMPLETE SLIDE DECK SPECIFICATION
## Generated with Parallel Agent Architecture

---

## EXECUTIVE SUMMARY

{exec_summary}

---

## BRAND RESEARCH

{brand_research}

---

## DECK ARCHITECTURE

{architecture}

---

## DESIGN SYSTEM

{design_system}

---

## DETAILED SLIDE SPECIFICATIONS

"""

    # Add all slide specifications
    for result in slide_results:
        if result['success']:
            final_doc += f"\n{result['output']}\n\n"
        else:
            final_doc += f"\n### SLIDE {result['slide_number']}: ERROR\n\n"
            final_doc += f"**Error:** {result.get('error', 'Failed to generate')}\n\n"
            final_doc += "---\n\n"

    # Add production notes
    final_doc += """
---

## PRODUCTION NOTES

This specification was generated using a parallel agent architecture:
- **Phase 1:** Master planning agent created brand research, architecture, and design system
- **Phase 2:** Individual slide agents generated detailed specifications in parallel
- **Result:** Complete, consistent, designer-ready specifications

### File Setup
- Dimensions: 1920 x 1080 (16:9)
- Resolution: 72 DPI (screen) or 300 DPI (print)
- Safe Zone: 100px from all edges

### Software Recommendations
- PowerPoint, Keynote, or Google Slides
- Figma/Sketch for design mockups

### Export Specifications
- Format: PDF (high quality) or PPTX (editable)
- Fonts: Embed fonts
- File naming: [CompanyName]_[PresentationType]_[Date]_v[Version]

---

**Generated with Gemini 2.5 Pro Parallel Architecture**
"""

    print(f"✓ Final document assembled")
    print(f"  Total length: {len(final_doc)} characters")

    return final_doc


def save_results(company, master_result, slide_results, final_document):
    """Save all results to files"""
    print("\n" + "="*80)
    print("SAVING RESULTS")
    print("="*80 + "\n")

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_dir = PROMPTS_DIR / "test-results" / "parallel"
    results_dir.mkdir(exist_ok=True, parents=True)

    company_safe = company.lower().replace(' ', '-').replace('(', '').replace(')', '')

    # Save master output
    master_file = results_dir / f"{company_safe}_master_{timestamp}.md"
    with open(master_file, 'w') as f:
        f.write(f"# Master Planning Output\n\n")
        f.write(f"**Company:** {company}\n")
        f.write(f"**Timestamp:** {timestamp}\n")
        f.write(f"**Generation Time:** {master_result['elapsed_time']:.2f}s\n\n")
        f.write("---\n\n")
        if master_result['thoughts']:
            f.write("## THINKING OUTPUT\n\n")
            f.write(master_result['thoughts'])
            f.write("\n\n---\n\n")
        f.write("## MASTER OUTPUT\n\n")
        f.write(master_result['output'])

    print(f"✓ Master output: {master_file}")

    # Save final complete document
    final_file = results_dir / f"{company_safe}_complete_{timestamp}.md"
    with open(final_file, 'w') as f:
        f.write(final_document)

    print(f"✓ Final document: {final_file}")

    # Save metadata
    metadata = {
        'company': company,
        'timestamp': timestamp,
        'master_planning_time': master_result['elapsed_time'],
        'total_slides': len(slide_results),
        'successful_slides': sum(1 for r in slide_results if r['success']),
        'failed_slides': sum(1 for r in slide_results if not r['success']),
        'slide_times': [
            {
                'slide': r['slide_number'],
                'time': r['elapsed_time'],
                'success': r['success']
            }
            for r in slide_results
        ],
        'total_generation_time': master_result['elapsed_time'] + max(r['elapsed_time'] for r in slide_results),
        'parallel_speedup': f"{sum(r['elapsed_time'] for r in slide_results) / max(r['elapsed_time'] for r in slide_results):.2f}x"
    }

    metadata_file = results_dir / f"{company_safe}_metadata_{timestamp}.json"
    with open(metadata_file, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"✓ Metadata: {metadata_file}")

    return {
        'master_file': master_file,
        'final_file': final_file,
        'metadata_file': metadata_file
    }


def main():
    """Main orchestrator"""
    print("""
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║         PARALLEL SLIDE DECK GENERATOR - ORCHESTRATOR                     ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
    """)

    # For testing, use Atlassian case
    company = "Atlassian"
    content = """Agile transformation success story presentation showing how a mid-sized enterprise (TechCorp Inc.) implemented Atlassian's suite (Jira, Confluence, Trello) and achieved:
- 40% faster sprint velocity
- 85% reduction in meeting time
- 95% team adoption rate within 3 months
- Improved cross-team collaboration

The presentation should cover:
1. The problem: Scattered tools, poor collaboration, slow delivery
2. The solution: Atlassian suite implementation strategy
3. The process: Phased rollout, training approach, adoption tactics
4. The results: Metrics, team feedback, business impact
5. The lessons learned: What worked, what didn't, recommendations"""

    audience = "Enterprise IT leaders, CTOs, Engineering managers"
    goal = "Demonstrate Atlassian's value through real customer success story, inspire similar transformations"
    slide_count = 10  # Reduced from 13 for faster testing

    print(f"Company: {company}")
    print(f"Slides: {slide_count}")
    print(f"Audience: {audience}\n")

    total_start = time.time()

    # Phase 1: Master Planning
    master_result = run_master_planning(company, content, audience, goal, slide_count)

    # Extract slide briefs
    slide_briefs = parse_slide_briefs(master_result['output'])

    if not slide_briefs:
        print("\n✗ ERROR: No slide briefs found in master output")
        print("Master output may not have followed expected format")
        return

    # Extract brand and design system
    brand_and_design = extract_brand_and_design_system(master_result['output'])

    # Phase 2: Parallel Slide Generation
    slide_results = run_parallel_slide_agents(slide_briefs, brand_and_design, max_workers=5)

    # Assemble final document
    final_document = assemble_final_document(master_result['output'], slide_results)

    # Save results
    files = save_results(company, master_result, slide_results, final_document)

    # Summary
    total_time = time.time() - total_start

    print("\n" + "="*80)
    print("GENERATION COMPLETE")
    print("="*80 + "\n")

    print(f"Total time: {total_time:.2f}s")
    print(f"Master planning: {master_result['elapsed_time']:.2f}s")
    print(f"Parallel generation: {max(r['elapsed_time'] for r in slide_results):.2f}s")
    print(f"Speedup vs sequential: {sum(r['elapsed_time'] for r in slide_results) / max(r['elapsed_time'] for r in slide_results):.2f}x\n")

    print(f"Results saved to:")
    print(f"  {files['final_file']}\n")

    print("Next steps:")
    print("1. Review the complete specification")
    print("2. Score against evaluation rubric")
    print("3. Compare to single-agent version")


if __name__ == "__main__":
    main()
