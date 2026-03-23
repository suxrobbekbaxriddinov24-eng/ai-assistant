from fastapi import Depends, HTTPException, Header
from app.database.supabase_client import get_supabase
from datetime import datetime, timezone


async def get_current_user(authorization: str = Header(...)):
    """Validate Supabase JWT and return user with tier info."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.replace("Bearer ", "")
    supabase = get_supabase()

    try:
        auth_response = supabase.auth.get_user(token)
        if not auth_response or not auth_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        user_id = auth_response.user.id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    # Fetch user + tier limits in one query
    result = supabase.table("users").select(
        "*, tier_limits(*)"
    ).eq("id", user_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User profile not found")

    return result.data


async def check_rate_limit(user: dict = Depends(get_current_user)):
    """Check daily request limit. Increment counter on success."""
    supabase = get_supabase()
    now = datetime.now(timezone.utc)
    limits = user.get("tier_limits", {})
    daily_limit = limits.get("daily_request_limit", 10)

    # Reset counter if it's a new day
    reset_at_str = user.get("requests_reset_at", "")
    try:
        reset_at = datetime.fromisoformat(reset_at_str.replace("Z", "+00:00"))
        if reset_at.date() < now.date():
            supabase.table("users").update({
                "requests_today": 0,
                "requests_reset_at": now.isoformat()
            }).eq("id", user["id"]).execute()
            user["requests_today"] = 0
    except Exception:
        pass

    # -1 means unlimited (Premium)
    requests_today = user.get("requests_today", 0)
    if daily_limit != -1 and requests_today >= daily_limit:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "message": f"Daily limit of {daily_limit} requests reached. Upgrade for more.",
                "limit": daily_limit,
                "used": requests_today,
                "upgrade_url": "/billing"
            }
        )

    # Increment counter
    supabase.table("users").update({
        "requests_today": requests_today + 1,
        "total_requests_all_time": user.get("total_requests_all_time", 0) + 1,
        "last_active_at": now.isoformat()
    }).eq("id", user["id"]).execute()

    return user


def require_feature(feature: str):
    """
    Returns a FastAPI dependency that checks if the user's tier has a specific feature.

    Usage:
        @router.post("/voice")
        async def voice_endpoint(user = Depends(require_feature("has_voice"))):
            ...
    """
    FEATURE_TIER_MAP = {
        "has_voice": "Plus ($9/mo)",
        "has_web_search": "Plus ($9/mo)",
        "has_file_management": "Plus ($9/mo)",
        "has_screen_control": "Pro ($29/mo)",
        "has_agent": "Premium ($79/mo)",
        "has_offline_mode": "Plus ($9/mo)",
        "has_priority_speed": "Pro ($29/mo)",
    }

    async def check_feature(user: dict = Depends(get_current_user)):
        limits = user.get("tier_limits", {})
        if not limits.get(feature, False):
            required_tier = FEATURE_TIER_MAP.get(feature, "a higher tier")
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "feature_not_available",
                    "message": f"This feature requires {required_tier} subscription.",
                    "feature": feature,
                    "current_tier": user.get("tier", "free"),
                    "upgrade_url": "/billing"
                }
            )
        return user

    return check_feature
