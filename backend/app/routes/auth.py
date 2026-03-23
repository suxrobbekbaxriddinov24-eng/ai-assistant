from fastapi import APIRouter, Depends, HTTPException
from app.dependencies.auth import get_current_user
from app.database.supabase_client import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Get current user profile with tier info."""
    return {
        "id": user["id"],
        "email": user["email"],
        "display_name": user.get("display_name"),
        "tier": user.get("tier", "free"),
        "requests_today": user.get("requests_today", 0),
        "subscription_status": user.get("subscription_status", "active"),
        "tier_limits": user.get("tier_limits", {}),
        "settings": user.get("settings", {})
    }


@router.patch("/me")
async def update_profile(
    display_name: str = None,
    settings: dict = None,
    user: dict = Depends(get_current_user)
):
    """Update user display name or settings."""
    supabase = get_supabase()
    updates = {}
    if display_name is not None:
        updates["display_name"] = display_name
    if settings is not None:
        updates["settings"] = settings
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")

    result = supabase.table("users").update(updates).eq("id", user["id"]).execute()
    return result.data[0] if result.data else {}
