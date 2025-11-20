"""
Deckr.ai ADK Wrapper Agent

This agent wraps the production TypeScript backend, allowing you to test
the full system with all production tools through ADK Web's UI.

The TypeScript backend at localhost:3001 handles all the actual work:
- Brand research with streaming discoveries
- Deck planning
- Slide generation with Gemini 2.5 Flash Image
- Reference matching
- And all other production tools

This wrapper just forwards requests and displays results in ADK Web.
"""

from google.adk.agents import Agent
import requests
import json
import time


def create_presentation(user_request: str) -> dict:
    """
    Create a presentation by calling the production Deckr.ai backend.

    This tool forwards your request to the TypeScript backend which has all
    the production tools: brand research, deck planning, slide generation,
    reference matching, and more.

    Args:
        user_request: Your presentation request (e.g., "Create a 10-slide deck
                     about SolarWinds sales workflow for executives")

    Returns:
        dict: Complete presentation with slides, thinking process, and metadata
    """
    backend_url = "http://localhost:3001/api/chat"

    print(f"\n🚀 Calling Deckr.ai production backend...")
    print(f"📝 Request: {user_request[:100]}...")

    try:
        # Call the TypeScript backend with SSE streaming
        response = requests.post(
            backend_url,
            json={
                "message": user_request,
                "userId": "adk-web-user",
                "conversationHistory": [],
                "context": {}
            },
            stream=True,
            timeout=300  # 5 minute timeout for slide generation
        )

        if response.status_code != 200:
            return {
                "status": "error",
                "error": f"Backend returned status {response.status_code}",
                "details": response.text[:500]
            }

        # Parse SSE events
        events = []
        thinking_steps = []
        tool_calls = []
        final_response = None

        print("📡 Streaming events from backend...")

        for line in response.iter_lines():
            if not line:
                continue

            line = line.decode('utf-8')

            # Parse SSE format: "event: type\ndata: {...}"
            if line.startswith('event:'):
                event_type = line.split(':', 1)[1].strip()
            elif line.startswith('data:'):
                data_str = line.split(':', 1)[1].strip()
                try:
                    data = json.loads(data_str)
                    events.append({"type": event_type, "data": data})

                    # Log interesting events
                    if event_type == 'thinking':
                        thinking_steps.append(data)
                        print(f"💭 Thinking: {data.get('title', 'Processing...')}")
                    elif event_type == 'tool_call':
                        tool_calls.append(data)
                        print(f"🔧 Tool: {data.get('tool', 'Unknown')}")
                    elif event_type == 'complete':
                        final_response = data
                        print("✅ Generation complete!")

                except json.JSONDecodeError:
                    continue

        # Build comprehensive result
        if final_response:
            result = {
                "status": "success",
                "response": final_response.get("response", "Presentation generated successfully!"),
                "thinking": final_response.get("thinking", {}),
                "toolCalls": final_response.get("toolCalls", []),
                "metadata": final_response.get("metadata", {}),
                "summary": {
                    "totalEvents": len(events),
                    "thinkingSteps": len(thinking_steps),
                    "toolsCalled": len(tool_calls),
                    "executionTime": final_response.get("metadata", {}).get("totalExecutionTime", 0)
                }
            }

            print(f"\n📊 Summary:")
            print(f"   Events: {len(events)}")
            print(f"   Thinking steps: {len(thinking_steps)}")
            print(f"   Tools called: {len(tool_calls)}")
            print(f"   Execution time: {result['summary']['executionTime']}ms")

            return result
        else:
            return {
                "status": "error",
                "error": "No final response received from backend",
                "events": events[:10]  # First 10 events for debugging
            }

    except requests.exceptions.ConnectionError:
        return {
            "status": "error",
            "error": "Cannot connect to Deckr.ai backend",
            "details": "Is the TypeScript backend running at localhost:3001?",
            "hint": "Run: npx tsx server/index.ts"
        }
    except requests.exceptions.Timeout:
        return {
            "status": "error",
            "error": "Backend request timed out (5 minutes)",
            "details": "Slide generation takes time. The backend is still processing."
        }
    except Exception as e:
        return {
            "status": "error",
            "error": f"Unexpected error: {str(e)}",
            "type": type(e).__name__
        }


# Create the ADK agent
root_agent = Agent(
    name="deckr_production_agent",
    model="gemini-3-pro-preview",
    description=(
        "Production Deckr.ai agent with full access to all backend tools. "
        "Can research brands, plan decks, generate slides, match references, "
        "and create complete on-brand presentations."
    ),
    instruction=(
        "You are a professional presentation design assistant powered by Deckr.ai's "
        "production backend.\n\n"

        "**Capabilities:**\n"
        "- Analyze company brand guidelines (colors, fonts, visual style)\n"
        "- Research companies and their products\n"
        "- Plan presentation structures with intelligent slide layouts\n"
        "- Generate actual slide images using AI\n"
        "- Match slides to uploaded reference templates\n"
        "- Create complete, on-brand presentations\n\n"

        "**How to use:**\n"
        "When a user requests a presentation, use the `create_presentation` tool "
        "with their full request. The backend will handle all the orchestration, "
        "tool calling, and slide generation.\n\n"

        "**Example requests:**\n"
        "- 'Create a 10-slide deck for SolarWinds about sales best practices'\n"
        "- 'Generate a case study presentation for Atlassian'\n"
        "- 'Make a pitch deck for a startup about AI workflow automation'\n\n"

        "**Note:** The backend uses streaming, so you'll see real-time progress "
        "including brand research discoveries, planning steps, and slide generation."
    ),
    tools=[create_presentation],
)
