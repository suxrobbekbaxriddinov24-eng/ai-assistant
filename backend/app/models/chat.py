from pydantic import BaseModel
from typing import Optional
import uuid


class Message(BaseModel):
    role: str  # user | assistant | system
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None  # None = new conversation
    use_memory: bool = True
    stream: bool = True


class ChatResponse(BaseModel):
    reply: str
    conversation_id: str
    message_id: str
    model_used: str
    tokens_used: int


class ConversationSummary(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int
