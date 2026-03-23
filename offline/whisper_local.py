"""
Local Whisper STT using whisper.cpp or the openai-whisper Python package.
Runs entirely offline — no API keys needed.

Install: pip install openai-whisper
Model sizes: tiny(39M) base(74M) small(244M) medium(769M) large(1.5GB)
"""
import os
import tempfile


def transcribe_local(audio_bytes: bytes, model_size: str = "base") -> dict:
    """
    Transcribe audio bytes to text using local Whisper model.
    Downloads model on first run (~74MB for base).
    """
    try:
        import whisper
    except ImportError:
        raise RuntimeError("whisper not installed. Run: pip install openai-whisper")

    # Write audio to temp file
    with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        model = whisper.load_model(model_size)
        result = model.transcribe(tmp_path)
        return {
            "text": result["text"].strip(),
            "language": result.get("language", "en"),
            "duration_seconds": 0.0
        }
    finally:
        os.unlink(tmp_path)


def is_whisper_available() -> bool:
    try:
        import whisper
        return True
    except ImportError:
        return False
