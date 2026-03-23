from pydantic import BaseModel
from typing import Optional


class TranscribeResponse(BaseModel):
    text: str
    language: str
    duration_seconds: float


class SynthesizeRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None  # ElevenLabs voice ID
    speed: float = 1.0
