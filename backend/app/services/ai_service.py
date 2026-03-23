import anthropic
from typing import AsyncGenerator, List
from app.config import get_settings

settings = get_settings()

# System prompt — the AI's personality and capabilities
BASE_SYSTEM_PROMPT = """You are an advanced AI personal assistant running on the user's computer. You are helpful, intelligent, proactive, and personable. You remember things about the user across conversations.

Your capabilities (depending on user's subscription):
- Answering questions and having conversations
- Helping with writing, coding, research, and analysis
- Searching the web for current information
- Managing files and folders
- Controlling the screen (clicking, typing, navigating apps)
- Running background tasks and automations

Guidelines:
- Be concise but thorough
- Use markdown formatting when helpful
- If you're not sure about something, say so
- Always protect user privacy and security
- Never take destructive actions without explicit confirmation
- Be proactive — suggest useful things the user might not have thought of

Today's date: {date}
User's name: {user_name}
User's subscription tier: {tier}
"""

MEMORY_CONTEXT_TEMPLATE = """
--- What I remember about you ---
{memories}
--- End of memory ---

"""


def build_system_prompt(user: dict, memories: List[str] = None) -> str:
    from datetime import date
    prompt = BASE_SYSTEM_PROMPT.format(
        date=date.today().isoformat(),
        user_name=user.get("display_name") or user.get("email", "there").split("@")[0],
        tier=user.get("tier", "free").title()
    )
    if memories:
        memory_text = "\n".join(f"- {m}" for m in memories)
        prompt += MEMORY_CONTEXT_TEMPLATE.format(memories=memory_text)
    return prompt


def get_model_for_tier(tier: str) -> str:
    models = {
        "free": "claude-haiku-4-5-20251001",
        "plus": "claude-sonnet-4-6",
        "pro": "claude-sonnet-4-6",
        "premium": "claude-opus-4-6"
    }
    return models.get(tier, "claude-haiku-4-5-20251001")


async def stream_chat(
    messages: List[dict],
    system_prompt: str,
    model: str,
) -> AsyncGenerator[str, None]:
    """Stream Claude response token by token."""
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    with client.messages.stream(
        model=model,
        max_tokens=4096,
        system=system_prompt,
        messages=messages
    ) as stream:
        for text in stream.text_stream:
            yield text


async def chat_complete(
    messages: List[dict],
    system_prompt: str,
    model: str,
    max_tokens: int = 4096
) -> tuple[str, int]:
    """Non-streaming Claude call. Returns (text, total_tokens)."""
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system_prompt,
        messages=messages
    )
    text = response.content[0].text
    tokens = response.usage.input_tokens + response.usage.output_tokens
    return text, tokens


async def analyze_screen(screenshot_base64: str, goal: str, previous_actions: list) -> dict:
    """
    Send screenshot to Claude Vision and get the next action to take.
    Returns a dict with action details.
    """
    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    previous_str = ""
    if previous_actions:
        steps = [f"{i+1}. {a.get('description', str(a))}" for i, a in enumerate(previous_actions)]
        previous_str = f"\n\nPrevious actions taken:\n" + "\n".join(steps)

    prompt = f"""You are controlling a computer to accomplish a goal.

Goal: {goal}{previous_str}

Look at the current screenshot and decide the SINGLE NEXT action to take.

Respond with ONLY valid JSON in this format:
{{
  "action": "click" | "type" | "scroll" | "key" | "screenshot" | "done",
  "x": <pixel x for click, null otherwise>,
  "y": <pixel y for click, null otherwise>,
  "text": <text to type, null otherwise>,
  "key": <key to press e.g. "enter", "tab", "ctrl+c", null otherwise>,
  "scroll_direction": "up" | "down" | null,
  "scroll_amount": <number of scrolls, default 3>,
  "description": "<human-readable description of what you're doing>",
  "reasoning": "<brief explanation of why this action>",
  "is_complete": <true if goal is fully accomplished, false otherwise>,
  "message": "<message to show the user about progress>"
}}

Safety rules:
- NEVER delete files without asking
- NEVER send emails/messages without confirmation
- NEVER enter passwords or payment info
- If unsure, use action "screenshot" to look again"""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/png",
                        "data": screenshot_base64
                    }
                },
                {"type": "text", "text": prompt}
            ]
        }]
    )

    import json
    text = response.content[0].text.strip()
    # Extract JSON even if wrapped in markdown code blocks
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text.strip())


async def extract_memories(conversation: List[dict], existing_memories: List[str]) -> List[dict]:
    """
    Analyze a conversation and extract facts worth remembering about the user.
    Returns list of {content, category, importance} dicts.
    """
    if not conversation:
        return []

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    conv_text = "\n".join(
        f"{m['role'].upper()}: {m['content'][:500]}" for m in conversation[-10:]
    )
    existing_text = "\n".join(f"- {m}" for m in existing_memories[:20]) if existing_memories else "None yet"

    prompt = f"""Analyze this conversation and extract NEW facts worth remembering about the user.

Conversation:
{conv_text}

Already known about user:
{existing_text}

Extract ONLY new, specific facts that would be useful in future conversations.
Good examples: name, job, location, preferences, ongoing projects, family, goals.
Bad examples: general chat, questions the AI asked, things already known.

Respond with JSON array (empty array if nothing new):
[
  {{"content": "User's name is Alex", "category": "personal", "importance": 9}},
  {{"content": "User prefers Python over JavaScript", "category": "preferences", "importance": 7}}
]

Categories: personal, work, preferences, projects, family, health, finance, other
Importance: 1-10 (10 = very important to remember)"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )

    import json
    text = response.content[0].text.strip()
    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    try:
        return json.loads(text.strip())
    except Exception:
        return []
