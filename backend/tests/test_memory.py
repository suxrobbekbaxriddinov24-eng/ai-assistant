"""
Tests for the memory service.
Run with: cd backend && pytest tests/ -v
"""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


@pytest.mark.asyncio
async def test_save_and_get_memories():
    """Memories can be saved and retrieved."""
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.order.return_value.limit.return_value.execute.return_value.data = [
        {"content": "User's name is Alex"},
        {"content": "User prefers Python"},
    ]
    mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()

    with patch("app.services.memory_service.get_supabase", return_value=mock_supabase):
        from app.services.memory_service import get_memories, save_memories

        # Save
        count = await save_memories("user-123", [
            {"content": "User's name is Alex", "category": "personal", "importance": 9},
        ])
        assert count == 1

        # Get
        memories = await get_memories("user-123", limit=10)
        assert len(memories) == 2
        assert "User's name is Alex" in memories


@pytest.mark.asyncio
async def test_delete_memory():
    """Memories can be soft-deleted."""
    mock_supabase = MagicMock()
    mock_supabase.table.return_value.update.return_value.eq.return_value.eq.return_value.execute.return_value.data = [{"id": "mem-1"}]

    with patch("app.services.memory_service.get_supabase", return_value=mock_supabase):
        from app.services.memory_service import delete_memory
        result = await delete_memory("user-123", "mem-1")
        assert result is True
