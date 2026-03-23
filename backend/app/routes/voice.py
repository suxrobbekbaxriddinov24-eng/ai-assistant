from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import Response
from app.dependencies.auth import require_feature, check_rate_limit
from app.services import voice_service, ai_service, memory_service
from app.models.voice import SynthesizeRequest

router = APIRouter(prefix="/voice", tags=["voice"])


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    user: dict = Depends(require_feature("has_voice"))
):
    """Convert speech to text (Plus+)."""
    audio_bytes = await audio.read()
    if len(audio_bytes) > 25 * 1024 * 1024:  # 25MB limit
        raise HTTPException(status_code=413, detail="Audio file too large (max 25MB)")

    result = await voice_service.transcribe_audio(audio_bytes, audio.filename or "audio.webm")
    return result


@router.post("/synthesize")
async def synthesize(
    request: SynthesizeRequest,
    user: dict = Depends(require_feature("has_voice"))
):
    """Convert text to speech (Plus+). Returns MP3 audio."""
    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 chars)")

    audio_bytes = await voice_service.synthesize_speech(request.text, request.voice_id)
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=speech.mp3"}
    )


@router.post("/chat")
async def voice_chat(
    audio: UploadFile = File(...),
    conversation_id: str = None,
    user: dict = Depends(require_feature("has_voice")),
    _rate: dict = Depends(check_rate_limit)
):
    """
    Full voice round-trip: audio in → transcribe → Claude → speech out.
    Returns JSON with text transcript + base64 audio response.
    """
    import base64

    # 1. Transcribe
    audio_bytes = await audio.read()
    transcript = await voice_service.transcribe_audio(audio_bytes, audio.filename or "audio.webm")
    user_text = transcript["text"]

    # 2. Get memories
    memories = await memory_service.get_memories(user["id"], limit=8)

    # 3. Build and call Claude
    from app.database.supabase_client import get_supabase
    supabase = get_supabase()

    history = []
    if conversation_id:
        history_result = supabase.table("messages").select("role, content").eq(
            "conversation_id", conversation_id
        ).order("created_at", desc=False).limit(20).execute()
        history = [{"role": m["role"], "content": m["content"]} for m in (history_result.data or [])]

    history.append({"role": "user", "content": user_text})
    system_prompt = ai_service.build_system_prompt(user, memories)
    model = ai_service.get_model_for_tier(user.get("tier", "free"))

    reply_text, _ = await ai_service.chat_complete(history, system_prompt, model, max_tokens=1024)

    # 4. Synthesize speech
    audio_response = await voice_service.synthesize_speech(reply_text)
    audio_b64 = base64.b64encode(audio_response).decode()

    return {
        "transcript": user_text,
        "reply": reply_text,
        "audio_base64": audio_b64,
        "language": transcript.get("language", "en")
    }
