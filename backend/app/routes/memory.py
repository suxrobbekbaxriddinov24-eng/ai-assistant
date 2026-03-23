from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user
from app.services.memory_service import get_memories, save_memories, delete_memory, clear_all_memories
from app.models.memory import MemoryCreate

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("/")
async def list_memories(user: dict = Depends(get_current_user)):
    """Get all memories for current user."""
    from app.database.supabase_client import get_supabase
    supabase = get_supabase()
    result = supabase.table("memories").select(
        "id, content, category, importance, created_at"
    ).eq("user_id", user["id"]).eq("is_active", True).order(
        "importance", desc=True
    ).limit(100).execute()
    return result.data or []


@router.post("/")
async def add_memory(
    memory: MemoryCreate,
    user: dict = Depends(get_current_user)
):
    """Manually add a memory."""
    await save_memories(user["id"], [memory.dict()])
    return {"message": "Memory saved"}


@router.delete("/{memory_id}")
async def remove_memory(memory_id: str, user: dict = Depends(get_current_user)):
    """Delete a specific memory."""
    deleted = await delete_memory(user["id"], memory_id)
    if not deleted:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Memory not found")
    return {"message": "Memory deleted"}


@router.delete("/")
async def clear_memories(user: dict = Depends(get_current_user)):
    """Clear all memories."""
    count = await clear_all_memories(user["id"])
    return {"message": f"Cleared {count} memories"}
