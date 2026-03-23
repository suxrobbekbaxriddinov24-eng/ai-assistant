"""
Tests for billing / subscription gating.
Run with: cd backend && pytest tests/ -v
"""
import pytest
from unittest.mock import patch, MagicMock


def make_user(tier: str) -> dict:
    limits = {
        "free":    {"daily_request_limit": 10,  "has_voice": False, "has_screen_control": False, "has_agent": False},
        "plus":    {"daily_request_limit": 100, "has_voice": True,  "has_screen_control": False, "has_agent": False},
        "pro":     {"daily_request_limit": 500, "has_voice": True,  "has_screen_control": True,  "has_agent": False},
        "premium": {"daily_request_limit": -1,  "has_voice": True,  "has_screen_control": True,  "has_agent": True},
    }
    return {
        "id": "user-test",
        "email": "test@example.com",
        "tier": tier,
        "requests_today": 0,
        "requests_reset_at": "2024-01-01T00:00:00+00:00",
        "total_requests_all_time": 0,
        "tier_limits": limits[tier]
    }


@pytest.mark.asyncio
async def test_free_user_blocked_from_voice():
    """Free user cannot access voice features."""
    from fastapi import HTTPException
    from app.dependencies.auth import require_feature

    free_user = make_user("free")
    check = require_feature("has_voice")

    with pytest.raises(HTTPException) as exc_info:
        with patch("app.dependencies.auth.get_current_user", return_value=free_user):
            await check(user=free_user)

    assert exc_info.value.status_code == 403


@pytest.mark.asyncio
async def test_pro_user_can_access_screen_control():
    """Pro user can access screen control."""
    from app.dependencies.auth import require_feature

    pro_user = make_user("pro")
    check = require_feature("has_screen_control")
    result = await check(user=pro_user)
    assert result == pro_user


@pytest.mark.asyncio
async def test_rate_limit_exceeded():
    """User hitting daily limit gets 429 error."""
    from fastapi import HTTPException
    from app.dependencies.auth import check_rate_limit

    user = make_user("free")
    user["requests_today"] = 10  # At limit

    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = user
    mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

    with patch("app.dependencies.auth.get_current_user", return_value=user):
        with pytest.raises(HTTPException) as exc_info:
            await check_rate_limit(user=user)

    assert exc_info.value.status_code == 429


@pytest.mark.asyncio
async def test_premium_user_unlimited():
    """Premium user (-1 limit) never gets rate limited."""
    from app.dependencies.auth import check_rate_limit

    user = make_user("premium")
    user["requests_today"] = 9999  # Very high, should still pass

    mock_supabase = MagicMock()
    with patch("app.dependencies.auth.get_supabase", return_value=mock_supabase):
        result = await check_rate_limit(user=user)
    assert result is not None
