"""
Agent service — handles background task orchestration for Premium users.
Tasks are queued via Celery and executed asynchronously.
"""
from app.database.supabase_client import get_supabase
from app.services.ai_service import chat_complete
from app.services.search_service import web_search, format_search_results
import uuid


async def run_agent_task(task_id: str, user_id: str):
    """
    Execute an agent task. This runs the AI to figure out what to do,
    then executes the appropriate tools.
    """
    supabase = get_supabase()

    # Get task details
    task = supabase.table("agent_tasks").select("*").eq("id", task_id).single().execute()
    if not task.data:
        return

    task_data = task.data
    goal = f"{task_data['title']}: {task_data.get('description', '')}"

    # Update status to running
    supabase.table("agent_tasks").update({
        "status": "running",
        "started_at": "now()"
    }).eq("id", task_id).execute()

    try:
        # Ask Claude what to do for this task
        system = """You are an autonomous agent completing tasks for the user.
        Given a task goal, execute it step by step using available tools.
        Available tools: web_search, save_note, send_notification.
        Return a JSON result with: {"success": bool, "message": "what you did", "data": {}}"""

        messages = [{"role": "user", "content": f"Complete this task: {goal}"}]

        # For MVP, use web search as main tool
        search_needed = any(word in goal.lower() for word in ["search", "find", "look up", "what is", "price", "news"])

        result_data = {}
        if search_needed:
            search_results = await web_search(goal, num_results=3)
            context = format_search_results(search_results)
            messages[0]["content"] += f"\n\nSearch results:\n{context}"
            result_data["search_results"] = search_results

        reply, _ = await chat_complete(messages, system, "llama-3.1-8b-instant", max_tokens=512)
        result_data["summary"] = reply

        # Mark complete
        supabase.table("agent_tasks").update({
            "status": "completed",
            "completed_at": "now()",
            "result": {"message": reply[:200], "data": result_data}
        }).eq("id", task_id).execute()

    except Exception as e:
        supabase.table("agent_tasks").update({
            "status": "failed",
            "error_message": str(e)
        }).eq("id", task_id).execute()
