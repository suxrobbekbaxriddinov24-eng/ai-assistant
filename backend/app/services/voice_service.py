import httpx
from groq import Groq
from app.config import get_settings

settings = get_settings()


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> dict:
    """
    Convert speech to text using Groq's Whisper API.
    Model: whisper-large-v3 — FREE on Groq's free tier.
    """
    client = Groq(api_key=settings.groq_api_key)

    transcription = client.audio.transcriptions.create(
        file=(filename, audio_bytes),
        model="whisper-large-v3",
        response_format="verbose_json"
    )
    return {
        "text": transcription.text,
        "language": getattr(transcription, "language", "en"),
        "duration_seconds": getattr(transcription, "duration", 0.0)
    }


async def synthesize_speech(text: str, voice_id: str = None) -> bytes:
    """
    Convert text to speech using ElevenLabs.
    Free tier: 10,000 characters/month — enough for early users.
    Returns MP3 bytes.
    """
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
