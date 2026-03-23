from celery import Celery
from app.config import get_settings

settings = get_settings()

celery = Celery(
    "ai_assistant",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.tasks.agent_tasks", "app.tasks.memory_tasks"]
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
