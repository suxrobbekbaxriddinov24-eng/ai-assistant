from pydantic import BaseModel
from typing import Optional


class AgentTaskCreate(BaseModel):
    title: str
    description: str = ""
    trigger_type: str = "manual"
    trigger_config: dict = {}


class AgentTaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    status: str
    trigger_type: str
    created_at: str
    completed_at: Optional[str]
    result: Optional[dict]
    error_message: Optional[str]
