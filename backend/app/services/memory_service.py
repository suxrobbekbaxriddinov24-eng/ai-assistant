from app.database.supabase_client import get_supabase
from typing import List, Optional
import uuid


async def get_memories(user_id: str, limit: int = 10, category: Optional[str] = None) -> List[str]:
    """Get user's memories as a list of strings."""
    supabase = get_supabase()
    query = supabase.table("memories").select("content").eq("user_id", user_id).eq("is_active", True)
    if category:
        query = query.eq("category", category)
    result = query.order("importance", desc=True).limit(limit).execute()
    return [row["content"] for row in (result.data or [])]


async def save_memories(user_id: str, memories: List[dict]) -> int:
    """Save a list of extracted memories. Returns count saved."""
    if not memories:
        return 0
    supabase = get_supabase()
    rows = [
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "content": m["content"],
            "category": m.get("category", "general"),
            "importance": m.get("importance", 5),
        }
        for m in memories
    ]
    supabase.table("memories").insert(rows).execute()
    return len(rows)


async def delete_memory(user_id: str, memory_id: str) -> bool:
    """Soft-delete a memory."""
    supabase = get_supabase()
    result = supabase.table("memories").update({"is_active": False}).eq("id", memory_id).eq("user_id", user_id).execute()
    return bool(result.data)


async def clear_all_memories(user_id: str) -> int:
    """Soft-delete all memories for a user."""
    supabase = get_supabase()
    result = supabase.table("memories").update({"is_active": False}).eq("user_id", user_id).execute()
    return len(result.data or [])
