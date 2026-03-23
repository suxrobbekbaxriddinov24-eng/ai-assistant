import openai
import httpx
from app.config import get_settings

settings = get_settings()


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> dict:
    """Convert speech to text using OpenAI Whisper."""
    client = openai.OpenAI(api_key=settings.openai_api_key)

    # Write bytes to a temp-like buffer with a name
    import io
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename

    response = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        response_format="verbose_json"
    )
    return {
        "text": response.text,
        "language": getattr(response, "language", "en"),
        "duration_seconds": getattr(response, "duration", 0.0)
    }


async def synthesize_speech(text: str, voice_id: str = None) -> bytes:
    """Convert text to speech using ElevenLabs. Returns MP3 bytes."""
    vid = voice_id or settings.elevenlabs_voice_id
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{vid}"
    headers = {
        "xi-api-key": settings.elevenlabs_api_key,
        "Content-Type": "application/json"
    }
    payload = {
        "text": text,
        "model_id": "eleven_turbo_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.content
