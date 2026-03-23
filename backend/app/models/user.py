from pydantic import BaseModel
from typing import Optional


class UserProfile(BaseModel):
    id: str
    email: str
    display_name: Optional[str]
    tier: str
    requests_today: int
    requests_reset_at: str
    subscription_status: str
    tier_limits: dict


class UserSettings(BaseModel):
    theme: str = "dark"
    language: str = "en"
    voice_enabled: bool = True
    always_listening: bool = False
    notification_sound: bool = True
    memory_enabled: bool = True
    startup_with_windows: bool = False
