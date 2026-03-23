"""
Local Text-to-Speech using Kokoro (high quality, Apache 2.0 license).
Runs entirely offline — no API keys needed.

Install: pip install kokoro>=0.9.2 soundfile
Model downloads automatically on first run (~300MB).
"""
import io


def synthesize_local(text: str, voice: str = "af_heart", speed: float = 1.0) -> bytes:
    """
    Convert text to speech offline using Kokoro TTS.
    Returns WAV audio bytes.
    """
    try:
        from kokoro import KPipeline
        import soundfile as sf
        import numpy as np
    except ImportError:
        raise RuntimeError(
            "Kokoro TTS not installed. Run: pip install kokoro soundfile"
        )

    pipeline = KPipeline(lang_code="a")  # 'a' = American English
    audio_chunks = []

    for _, _, audio in pipeline(text, voice=voice, speed=speed):
        audio_chunks.append(audio)

    if not audio_chunks:
        return b""

    # Combine all chunks
    combined = np.concatenate(audio_chunks)

    # Convert to WAV bytes
    buffer = io.BytesIO()
    sf.write(buffer, combined, 24000, format="WAV")
    return buffer.getvalue()


def is_tts_available() -> bool:
    try:
        import kokoro
        return True
    except ImportError:
        return False
