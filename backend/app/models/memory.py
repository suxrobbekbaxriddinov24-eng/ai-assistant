from pydantic import BaseModel
from typing import Optional, List


class Memory(BaseModel):
    id: str
    content: str
    category: str
    importance: int
    created_at: str


class MemoryCreate(BaseModel):
    content: str
    category: str = "general"
    importance: int = 5


class MemorySearchRequest(BaseModel):
    query: str
    limit: int = 5
    category: Optional[str] = None
