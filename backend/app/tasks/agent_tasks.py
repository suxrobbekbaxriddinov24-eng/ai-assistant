import asyncio
from app.tasks.celery_app import celery
from app.services.agent_service import run_agent_task


@celery.task(name="run_agent_task", bind=True, max_retries=3)
def execute_agent_task(self, task_id: str, user_id: str):
    """Celery task wrapper for running an agent task asynchronously."""
    try:
        asyncio.run(run_agent_task(task_id, user_id))
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
