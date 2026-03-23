import asyncio
from app.tasks.celery_app import celery
from app.services.ai_service import extract_memories
from app.services.memory_service import get_memories, save_memories


@celery.task(name="extract_and_save_memories")
def extract_and_save_memories(user_id: str, conversation: list):
    """
    Async memory extraction run as a background Celery task.
    Extracts facts from a conversation and saves them to the database.
    """
    async def _run():
        existing = await get_memories(user_id, limit=20)
        new_memories = await extract_memories(conversation, existing)
        if new_memories:
            await save_memories(user_id, new_memories)
        return len(new_memories)

    return asyncio.run(_run())
