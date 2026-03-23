"""
Screen control service.
NOTE: PyAutoGUI runs on the CLIENT (Electron), not the server.
The server analyzes screenshots and returns action instructions.
The Electron app executes the actual mouse/keyboard actions.
"""
import base64
from app.services.ai_service import analyze_screen
from app.database.supabase_client import get_supabase
import uuid
import json


DANGEROUS_ACTIONS_REQUIRE_CONFIRM = {
    "delete", "remove", "uninstall", "format", "clear",
    "send", "submit", "purchase", "buy", "pay", "transfer"
}


async def process_screen_action(
    user_id: str,
    goal: str,
    screenshot_base64: str,
    session_id: str = None,
    previous_actions: list = None
) -> dict:
    """
    Analyze screenshot and return the next action to take.
    Creates/updates a screen session in the database.
    """
    supabase = get_supabase()

    # Create session if new
    if not session_id:
        session_id = str(uuid.uuid4())
        supabase.table("screen_sessions").insert({
            "id": session_id,
            "user_id": user_id,
            "goal": goal,
            "status": "active"
        }).execute()

    # Ask Claude Vision what to do next
    action = await analyze_screen(
        screenshot_base64=screenshot_base64,
        goal=goal,
        previous_actions=previous_actions or []
    )

    # Safety check: flag dangerous actions
    action_desc = action.get("description", "").lower()
    needs_confirm = any(word in action_desc for word in DANGEROUS_ACTIONS_REQUIRE_CONFIRM)

    # Log action to session
    current = supabase.table("screen_sessions").select("actions, steps_taken").eq("id", session_id).single().execute()
    if current.data:
        existing_actions = current.data.get("actions", [])
        if not isinstance(existing_actions, list):
            existing_actions = []
        existing_actions.append(action)
        supabase.table("screen_sessions").update({
            "actions": existing_actions,
            "steps_taken": current.data.get("steps_taken", 0) + 1,
            "status": "completed" if action.get("is_complete") else "active"
        }).eq("id", session_id).execute()

    return {
        "session_id": session_id,
        "action": action,
        "needs_confirmation": needs_confirm,
        "is_complete": action.get("is_complete", False),
        "message": action.get("message", "Working on it...")
    }
