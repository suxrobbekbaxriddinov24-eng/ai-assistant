from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # App
    app_name: str = "AI Personal Assistant"
    debug: bool = False
    version: str = "0.1.0"

    # Groq (free AI — chat + voice transcription + vision)
    groq_api_key: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""  # server-side only

    # Paddle (payments — supports Uzbekistan)
    paddle_api_key: str = ""
    paddle_webhook_secret: str = ""
    paddle_plus_price_id: str = ""
    paddle_pro_price_id: str = ""
    paddle_premium_price_id: str = ""

    # ElevenLabs (TTS — 10k chars/month free)
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = "21m00Tcm4TlvDq8ikWAM"  # default voice

    # Web Search (Serper — free tier: 2500 searches/month)
    serper_api_key: str = ""

    # Redis (Celery)
    redis_url: str = "redis://localhost:6379/0"

    # Frontend URL (used for Stripe redirect URLs)
    frontend_url: str = "http://localhost:5173"

    # CORS — add your Vercel URL here after deploying
    allowed_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "app://.*",
        "https://ai-assistant-sooty-theta.vercel.app",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
