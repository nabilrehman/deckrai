"""
Deckr.ai Demo Agent for ADK Web Testing

This agent demonstrates the streaming capabilities and tool execution
patterns used in the TypeScript implementation.
"""

from google.adk.agents import Agent
import time


def analyze_brand(company_website: str) -> dict:
    """
    Analyze a company's brand guidelines using web research.

    Simulates the real-time streaming discoveries from the TypeScript implementation.

    Args:
        company_website: Company website URL (e.g., "atlassian.com")

    Returns:
        dict: Brand theme with colors, fonts, and visual style
    """
    # Simulate streaming discoveries (in real impl, this would stream to UI)
    discoveries = [
        f"→ Searching for brand guidelines at {company_website}...",
        "→ Found brand page at brand.company.com",
        "→ Extracting primary color: #0052CC (Atlassian Blue)",
        "→ Found typography: Charlie Sans (proprietary)",
        "→ Analyzing visual style: Modern, clean, professional",
    ]

    # In the real implementation, each discovery is streamed in real-time
    # Here we simulate the delay
    print("\n🔍 Brand Research Discoveries:")
    for discovery in discoveries:
        print(f"   {discovery}")
        time.sleep(0.5)  # Simulate processing time

    return {
        "status": "success",
        "result": {
            "primaryColor": "#0052CC",
            "secondaryColor": "#403294",
            "accentColor": "#00C7E6",
            "fontStyle": "Charlie Sans (proprietary), Inter fallback",
            "visualStyle": "Modern, clean, professional with bold colors",
            "sources": [f"{company_website}/brand", f"design.{company_website}"]
        }
    }


def plan_deck(company: str, content: str, slide_count: int = 10) -> dict:
    """
    Plan a presentation deck with slide specifications.

    Args:
        company: Company name for branding
        content: Presentation content description
        slide_count: Number of slides to generate

    Returns:
        dict: Slide specifications for each slide
    """
    print(f"\n📋 Planning {slide_count}-slide deck for {company}...")
    print(f"   Content: {content}")

    # Simulate planning process
    time.sleep(1)

    slides = []
    slide_types = ["title", "content", "content", "data-viz", "content",
                   "image-content", "content", "data-viz", "content", "closing"]

    for i in range(min(slide_count, len(slide_types))):
        slides.append({
            "slideNumber": i + 1,
            "slideType": slide_types[i],
            "headline": f"Slide {i + 1}: {slide_types[i].title().replace('-', ' ')}",
            "content": f"Placeholder content for slide {i + 1}"
        })

    return {
        "status": "success",
        "result": {
            "slides": slides,
            "totalSlides": len(slides)
        }
    }


def fetch_company_logo(company_website: str) -> dict:
    """
    Fetch company logo from website.

    Args:
        company_website: Company website URL

    Returns:
        dict: Logo URL and metadata
    """
    print(f"\n🖼️  Fetching logo from {company_website}...")
    time.sleep(0.5)

    return {
        "status": "success",
        "result": {
            "logoUrl": f"https://{company_website}/logo.svg",
            "dimensions": {"width": 200, "height": 60},
            "format": "SVG"
        }
    }


# Create the root agent
root_agent = Agent(
    name="deckr_demo_agent",
    model="gemini-3-pro-preview",
    description=(
        "Demo agent that simulates Deckr.ai's presentation generation capabilities. "
        "Can analyze brand guidelines, plan decks, and fetch company logos."
    ),
    instruction=(
        "You are a helpful presentation design assistant. You can:\n"
        "1. Analyze company brand guidelines to extract colors, fonts, and styles\n"
        "2. Plan presentation decks with intelligent slide structure\n"
        "3. Fetch company logos for branding\n\n"
        "When analyzing brands, you show real-time discoveries as you find them. "
        "Always provide detailed, designer-quality specifications."
    ),
    tools=[analyze_brand, plan_deck, fetch_company_logo],
)
