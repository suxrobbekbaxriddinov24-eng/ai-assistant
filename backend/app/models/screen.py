from pydantic import BaseModel
from typing import Optional, List


class ScreenAction(BaseModel):
    action: str       # click | type | scroll | key | screenshot | done
    x: Optional[int] = None
    y: Optional[int] = None
    text: Optional[str] = None
    key: Optional[str] = None
    scroll_direction: Optional[str] = None
    scroll_amount: int = 3
    description: str = ""  # human-readable explanation


class ScreenActionRequest(BaseModel):
    goal: str
    screenshot_base64: str  # current screen as base64 PNG
    session_id: Optional[str] = None
    previous_actions: List[ScreenAction] = []


class ScreenActionResponse(BaseModel):
    session_id: str
    action: ScreenAction
    reasoning: str
    is_complete: bool
    message: str  # message to show user
