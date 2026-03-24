from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from app.dependencies.auth import require_feature
from app.services.agent_service import run_agent_task
from app.database.supabase_client import get_supabase
import uuid

router = APIRouter(prefix="/agent", tags=["agent"])


@router.get("/tasks")
async def list_tasks(user: dict = Depends(require_feature("has_agent"))):
    """List all agent tasks for current user (Premium only)."""
    supabase = get_supabase()
    result = supabase.table("agent_tasks").select(
        "id, title, description, status, trigger_type, created_at, completed_at, result"
    ).eq("user_id", user["id"]).order("created_at", desc=True).limit(50).execute()
    return result.data or []


@router.post("/tasks")
async def create_task(
    title: str,
    description: str = "",
    trigger_type: str = "manual",
    trigger_config: dict = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    user: dict = Depends(require_feature("has_agent"))
):
    """Create and immediately execute an agent task (Premium only)."""
    supabase = get_supabase()
    task_id = str(uuid.uuid4())
    supabase.table("agent_tasks").insert({
        "id": task_id,
        "user_id": user["id"],
        "title": title,
        "description": description,
        "trigger_type": trigger_type,
        "trigger_config": trigger_config or {},
        "status": "pending"
    }).execute()

    # Run task in background so response returns immediately
    background_tasks.add_task(run_agent_task, task_id, user["id"])

    return {"task_id": task_id, "message": "Task created and running"}


@router.get("/tasks/{task_id}")
async def get_task(task_id: str, user: dict = Depends(require_feature("has_agent"))):
    """Poll a specific task for status and result."""
    supabase = get_supabase()
    result = supabase.table("agent_tasks").select("*").eq(
        "id", task_id
    ).eq("user_id", user["id"]).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return result.data


@router.post("/tasks/{task_id}/cancel")
async def cancel_task(task_id: str, user: dict = Depends(require_feature("has_agent"))):
    """Cancel a running task."""
    supabase = get_supabase()
    supabase.table("agent_tasks").update({"status": "cancelled"}).eq(
        "id", task_id
    ).eq("user_id", user["id"]).execute()
    return {"message": "Task cancelled"}
