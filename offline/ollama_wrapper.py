"""
Ollama wrapper — manages the local Ollama server for offline AI.
Ollama runs open-source LLMs (Llama, Mistral) locally on the user's GPU/CPU.
Download Ollama from: https://ollama.ai
"""
import subprocess
import httpx
import json
import platform
import os


OLLAMA_BASE_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2:3b"  # Small, fast model (~2GB)


def is_ollama_running() -> bool:
    """Check if Ollama server is already running."""
    try:
        resp = httpx.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=2)
        return resp.status_code == 200
    except Exception:
        return False


def start_ollama():
    """Start the Ollama server in background."""
    if is_ollama_running():
        return True
    try:
        if platform.system() == "Windows":
            subprocess.Popen(["ollama", "serve"], creationflags=subprocess.CREATE_NO_WINDOW)
        else:
            subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Wait for it to start
        import time
        for _ in range(10):
            time.sleep(1)
            if is_ollama_running():
                return True
        return False
    except FileNotFoundError:
        print("Ollama not installed. Download from https://ollama.ai")
        return False


def pull_model(model: str = DEFAULT_MODEL):
    """Download a model if not already present."""
    result = subprocess.run(["ollama", "pull", model], capture_output=True, text=True)
    return result.returncode == 0


async def chat_offline(messages: list[dict], model: str = DEFAULT_MODEL) -> str:
    """
    Chat with local Ollama model. Falls back to cloud if unavailable.
    Returns the assistant's reply text.
    """
    if not is_ollama_running():
        if not start_ollama():
            raise RuntimeError("Ollama is not available. Please install from https://ollama.ai")

    payload = {
        "model": model,
        "messages": messages,
        "stream": False
    }

    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.post(f"{OLLAMA_BASE_URL}/api/chat", json=payload)
        response.raise_for_status()
        data = response.json()
        return data["message"]["content"]


async def list_local_models() -> list[str]:
    """List all locally available models."""
    async with httpx.AsyncClient(timeout=5) as client:
        resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
        data = resp.json()
        return [m["name"] for m in data.get("models", [])]
