#!/usr/bin/env python3
"""
Gemini 2.5 Pro Slide Deck Design Prompt - Test Runner
Runs test cases and evaluates output quality against rubric.
"""

import os
import json
import time
from datetime import datetime
from pathlib import Path

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
    print("Make sure .env file is loaded or export the variable")
    exit(1)

# Test cases
TEST_CASES = {
    "atlassian": {
        "company": "Atlassian",
        "content": """Agile transformation success story presentation showing how a mid-sized enterprise (TechCorp Inc.) implemented Atlassian's suite (Jira, Confluence, Trello) and achieved:
- 40% faster sprint velocity
- 85% reduction in meeting time
- 95% team adoption rate within 3 months
- Improved cross-team collaboration

The presentation should cover:
1. The problem: Scattered tools, poor collaboration, slow delivery
2. The solution: Atlassian suite implementation strategy
3. The process: Phased rollout, training approach, adoption tactics
4. The results: Metrics, team feedback, business impact
5. The lessons learned: What worked, what didn't, recommendations""",
        "audience": "Enterprise IT leaders, CTOs, Engineering managers",
        "goal": "Demonstrate Atlassian's value through real customer success story, inspire similar transformations, position Atlassian as essential for modern agile teams",
        "slides": "12-14 slides"
    },
    "nike": {
        "company": "Nike",
        "content": """Athlete endorsement campaign presentation for the launch of a new Nike running shoe line featuring professional marathon runner Sarah Chen. The deck should showcase:
- Sarah's journey from amateur to Olympic qualifier
- The role of Nike in her training and success
- Technical innovations in the new shoe line
- Campaign creative concepts (photos, videos, social media)
- Launch timeline and expected market impact

The presentation should cover:
1. Athlete spotlight: Sarah Chen's inspiring story
2. The innovation: New shoe technology and features
3. The campaign: Creative concepts across channels
4. The reach: Target demographics and market strategy
5. The launch: Timeline, events, partnerships
6. Expected outcomes: Sales projections, brand lift""",
        "audience": "Nike marketing executives, brand managers, campaign stakeholders",
        "goal": "Get buy-in for the athlete endorsement campaign, showcase the compelling athlete story, demonstrate strategic thinking, inspire confidence in launch success",
        "slides": "10-12 slides"
    },
    "cloudsync": {
        "company": "CloudSync (fictional SaaS startup - does not exist)",
        "content": """Series A investor pitch deck for CloudSync, a B2B SaaS platform that syncs data across multiple cloud storage providers (Dropbox, Google Drive, OneDrive, Box) in real-time. The deck should present:
- The problem: Enterprises use average 4.2 cloud storage providers, data is scattered and out of sync
- The market opportunity: $8.5B total addressable market, growing 23% annually
- The solution: CloudSync's real-time bi-directional sync with conflict resolution
- The traction: 450 beta customers, $250K ARR, 15% month-over-month growth
- The product: Demo screenshots, architecture diagram, key features
- The business model: Pricing tiers, unit economics, CAC/LTV ratios
- The team: Founders (2x ex-Dropbox engineers, 1x enterprise sales leader)
- The ask: $8M Series A at $32M post-money valuation""",
        "audience": "Venture capital investors (Series A stage)",
        "goal": "Secure $8M Series A funding, demonstrate market opportunity, prove product-market fit, showcase team competence, justify valuation",
        "slides": "15 slides (standard VC pitch deck length)"
    }
}


def load_prompt_template():
    """Load the enhanced prompt template"""
    prompt_file = Path(__file__).parent / "gemini-slide-designer-prompt.md"
    with open(prompt_file, 'r') as f:
        return f.read()


def build_test_prompt(test_case_name):
    """Build complete prompt for a test case"""
    template = load_prompt_template()
    test = TEST_CASES[test_case_name]

    # Find the "NOW EXECUTE" section and replace with actual test case
    filled_prompt = template + f"""

---

## NOW EXECUTING TEST CASE: {test_case_name.upper()}

**Company Name:** {test['company']}

**Content/Narrative:**
{test['content']}

**Target Audience:** {test['audience']}

**Presentation Goal:** {test['goal']}

**Desired Slide Count:** {test['slides']}

---

Please create the complete slide deck specification following the enhanced methodology above.
Remember to:
1. Research the brand thoroughly (Phase 1)
2. Plan the deck architecture (Phase 2)
3. Specify every slide in complete detail (Phase 3)
4. Document the design system (Phase 4)
5. Provide production notes

Your output should be so detailed that a graphic designer can execute the entire deck without asking a single clarifying question.
"""

    return filled_prompt


def run_test(test_case_name, thinking_budget=16384, save_thoughts=True):
    """Run a single test case"""
    print(f"\n{'='*80}")
    print(f"Running Test Case: {test_case_name.upper()}")
    print(f"{'='*80}\n")

    # Build prompt
    print("Building prompt...")
    prompt = build_test_prompt(test_case_name)

    # Initialize client
    print("Initializing Gemini 2.5 Pro client...")
    client = genai.Client(api_key=API_KEY)

    # Run inference
    print(f"Running inference with thinking_budget={thinking_budget}...")
    print("This may take 1-3 minutes for complex design specs...")
    start_time = time.time()

    try:
        response = client.models.generate_content(
            model="gemini-3-pro-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(
                    thinking_budget=thinking_budget,
                    include_thoughts=save_thoughts
                )
            )
        )

        elapsed_time = time.time() - start_time
        print(f"\nGeneration completed in {elapsed_time:.2f} seconds")

        # Extract thoughts and answer
        thoughts = []
        answer = []

        for part in response.candidates[0].content.parts:
            if part.thought:
                thoughts.append(part.text)
            else:
                answer.append(part.text)

        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_dir = Path(__file__).parent / "test-results"
        results_dir.mkdir(exist_ok=True)

        result_file = results_dir / f"{test_case_name}_{timestamp}.json"

        result_data = {
            "test_case": test_case_name,
            "timestamp": timestamp,
            "thinking_budget": thinking_budget,
            "elapsed_time": elapsed_time,
            "thoughts": "\n\n".join(thoughts) if thoughts else None,
            "output": "\n\n".join(answer),
            "usage_metadata": {
                "prompt_tokens": response.usage_metadata.prompt_token_count if hasattr(response.usage_metadata, 'prompt_token_count') else None,
                "candidates_tokens": response.usage_metadata.candidates_token_count if hasattr(response.usage_metadata, 'candidates_token_count') else None,
                "total_tokens": response.usage_metadata.total_token_count if hasattr(response.usage_metadata, 'total_token_count') else None,
                "thoughts_tokens": getattr(response.usage_metadata, 'thoughts_token_count', None)
            }
        }

        with open(result_file, 'w') as f:
            json.dump(result_data, f, indent=2)

        # Also save markdown version
        md_file = results_dir / f"{test_case_name}_{timestamp}.md"
        with open(md_file, 'w') as f:
            f.write(f"# Test Case: {test_case_name}\n\n")
            f.write(f"**Timestamp:** {timestamp}\n")
            f.write(f"**Thinking Budget:** {thinking_budget}\n")
            f.write(f"**Generation Time:** {elapsed_time:.2f}s\n\n")

            if thoughts:
                f.write("---\n\n## THINKING OUTPUT\n\n")
                f.write("\n\n".join(thoughts))
                f.write("\n\n---\n\n")

            f.write("## SPECIFICATION OUTPUT\n\n")
            f.write("\n\n".join(answer))

        print(f"\n✓ Results saved to:")
        print(f"  JSON: {result_file}")
        print(f"  MD:   {md_file}")

        # Print summary
        print(f"\n{'='*80}")
        print("SUMMARY")
        print(f"{'='*80}")
        print(f"Output length: {len(''.join(answer))} characters")
        print(f"Thoughts length: {len(''.join(thoughts))} characters" if thoughts else "Thoughts: Not captured")
        if result_data['usage_metadata']['total_tokens']:
            print(f"Total tokens: {result_data['usage_metadata']['total_tokens']}")
            if result_data['usage_metadata']['thoughts_tokens']:
                print(f"Thinking tokens: {result_data['usage_metadata']['thoughts_tokens']}")

        return result_data

    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
        return None


def evaluate_output(test_case_name, result_data):
    """Interactive evaluation helper"""
    print(f"\n{'='*80}")
    print(f"EVALUATION: {test_case_name.upper()}")
    print(f"{'='*80}\n")

    print("Please review the output and score against the rubric:")
    print("(See: prompts/evaluation-rubric.md)\n")

    dimensions = [
        ("Brand Research Quality", 10),
        ("Visual Hierarchy Clarity", 10),
        ("Architecture Detail", 10),
        ("Specifications Completeness", 10),
        ("Design System Quality", 10)
    ]

    scores = {}
    total = 0

    for dimension, max_score in dimensions:
        while True:
            try:
                score = int(input(f"{dimension} (0-{max_score}): "))
                if 0 <= score <= max_score:
                    scores[dimension] = score
                    total += score
                    break
                else:
                    print(f"Please enter a score between 0 and {max_score}")
            except ValueError:
                print("Please enter a valid number")

    print(f"\n{'='*80}")
    print(f"TOTAL SCORE: {total}/50")
    print(f"RESULT: {'PASS ✓' if total >= 45 else 'FAIL ✗'}")
    print(f"{'='*80}\n")

    # Save evaluation
    timestamp = result_data['timestamp']
    eval_file = Path(__file__).parent / "test-results" / f"{test_case_name}_{timestamp}_evaluation.json"

    eval_data = {
        "test_case": test_case_name,
        "timestamp": timestamp,
        "scores": scores,
        "total": total,
        "passed": total >= 45
    }

    notes = input("Evaluation notes (optional, press Enter to skip): ")
    if notes:
        eval_data["notes"] = notes

    with open(eval_file, 'w') as f:
        json.dump(eval_data, f, indent=2)

    print(f"\n✓ Evaluation saved to: {eval_file}")

    return eval_data


def main():
    """Main test runner"""
    print("""
╔═══════════════════════════════════════════════════════════════════════════╗
║                                                                           ║
║      GEMINI 2.5 PRO SLIDE DECK DESIGN PROMPT - TEST RUNNER               ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
    """)

    print("Available test cases:")
    for i, (key, test) in enumerate(TEST_CASES.items(), 1):
        print(f"  {i}. {key.capitalize():15} - {test['company']}")
    print("  4. all            - Run all test cases")
    print("  q. quit           - Exit\n")

    choice = input("Select test case (1-4 or q): ").strip().lower()

    if choice == 'q':
        print("Exiting...")
        return

    # Determine which tests to run
    if choice == '4' or choice == 'all':
        test_cases_to_run = list(TEST_CASES.keys())
    elif choice in ['1', '2', '3']:
        test_cases_to_run = [list(TEST_CASES.keys())[int(choice) - 1]]
    elif choice in TEST_CASES.keys():
        test_cases_to_run = [choice]
    else:
        print("Invalid choice")
        return

    # Run tests
    results = []
    for test_case in test_cases_to_run:
        result = run_test(test_case, thinking_budget=16384, save_thoughts=True)
        if result:
            results.append(result)

            # Ask if user wants to evaluate now
            evaluate_now = input(f"\nEvaluate {test_case} output now? (y/n): ").strip().lower()
            if evaluate_now == 'y':
                eval_data = evaluate_output(test_case, result)
        else:
            print(f"✗ Test case {test_case} failed")

    # Summary
    print(f"\n{'='*80}")
    print("ALL TESTS COMPLETED")
    print(f"{'='*80}\n")
    print(f"Tests run: {len(results)}")
    print(f"Results saved to: prompts/test-results/")
    print("\nNext steps:")
    print("1. Review output files (*.md)")
    print("2. Score against rubric (evaluation-rubric.md)")
    print("3. Compare to SolarWinds baseline")
    print("4. Identify gaps and refine prompt if needed")


if __name__ == "__main__":
    main()
