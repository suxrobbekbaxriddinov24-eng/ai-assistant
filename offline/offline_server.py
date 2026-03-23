"""
Offline mini-server — a stripped-down FastAPI server that runs locally
when there's no internet connection. Uses Ollama + local Whisper + local TTS.

Run with: uvicorn offline.offline_server:app --port 8001
"""
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from typing import List
import httpx

from offline.ollama_wrapper import chat_offline, is_ollama_running, start_ollama
from offline.whisper_local import transcribe_local, is_whisper_available
from offline.tts_local import synthesize_local, is_tts_available

app = FastAPI(title="AI Assistant — Offline Mode", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class OfflineChatRequest(BaseModel):
    message: str
    history: List[dict] = []


@app.get("/health")
def health():
    return {
        "status": "ok",
        "mode": "offline",
        "ollama": is_ollama_running(),
        "whisper": is_whisper_available(),
        "tts": is_tts_available()
    }


@app.post("/offline/chat")
async def offline_chat(request: OfflineChatRequest):
    """Chat using local Ollama model."""
    messages = request.history + [{"role": "user", "content": request.message}]
    reply = await chat_offline(messages)
    return {"reply": reply}


@app.post("/offline/transcribe")
async def offline_transcribe(audio: UploadFile = File(...)):
    """Transcribe audio using local Whisper."""
    audio_bytes = await audio.read()
    result = transcribe_local(audio_bytes)
    return result


@app.post("/offline/synthesize")
async def offline_synthesize(text: str):
    """Synthesize speech using local TTS."""
    audio_bytes = synthesize_local(text)
    return Response(content=audio_bytes, media_type="audio/wav")


if __name__ == "__main__":
    import uvicorn
    # Ensure Ollama is running before starting
    if not is_ollama_running():
        print("Starting Ollama...")
        start_ollama()
    uvicorn.run(app, host="127.0.0.1", port=8001)
