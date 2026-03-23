from fastapi import APIRouter, Depends, HTTPException
from app.dependencies.auth import require_feature, check_rate_limit
from app.services.screen_service import process_screen_action
from app.models.screen import ScreenActionRequest
from app.database.supabase_client import get_supabase

router = APIRouter(prefix="/screen", tags=["screen"])


@router.post("/action")
async def screen_action(
    request: ScreenActionRequest,
    user: dict = Depends(require_feature("has_screen_control")),
    _rate: dict = Depends(check_rate_limit)
):
    """
    Analyze current screenshot and return next action to execute (Pro+).
    The Electron client executes the actual mouse/keyboard action.
    """
    result = await process_screen_action(
        user_id=user["id"],
        goal=request.goal,
        screenshot_base64=request.screenshot_base64,
        session_id=request.session_id,
        previous_actions=[a.dict() for a in request.previous_actions]
    )
    return result


@router.get("/sessions")
async def list_screen_sessions(user: dict = Depends(require_feature("has_screen_control"))):
    """List recent screen control sessions."""
    supabase = get_supabase()
    result = supabase.table("screen_sessions").select(
        "id, goal, status, steps_taken, created_at, completed_at"
    ).eq("user_id", user["id"]).order("created_at", desc=True).limit(20).execute()
    return result.data or []


@router.post("/sessions/{session_id}/cancel")
async def cancel_session(
    session_id: str,
    user: dict = Depends(require_feature("has_screen_control"))
):
    """Cancel an active screen control session."""
    supabase = get_supabase()
    supabase.table("screen_sessions").update({"status": "cancelled"}).eq(
        "id", session_id
    ).eq("user_id", user["id"]).execute()
    return {"message": "Session cancelled"}
