from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from app.models.chat import ChatRequest
from app.dependencies.auth import get_current_user, check_rate_limit
from app.services import ai_service, memory_service
from app.database.supabase_client import get_supabase
import uuid
import json

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/")
async def chat(
    request: ChatRequest,
    user: dict = Depends(check_rate_limit)
):
    """
    Main chat endpoint. Streams Claude's response.
    Works for all tiers (rate limited by tier).
    """
    supabase = get_supabase()
    user_id = user["id"]
    tier = user.get("tier", "free")
    limits = user.get("tier_limits", {})

    # Get or create conversation
    if request.conversation_id:
        conv_id = request.conversation_id
    else:
        conv_id = str(uuid.uuid4())
        supabase.table("conversations").insert({
            "id": conv_id,
            "user_id": user_id,
            "title": request.message[:60] + ("..." if len(request.message) > 60 else "")
        }).execute()

    # Load conversation history
    max_history = limits.get("max_conversation_history", 20)
    history_result = supabase.table("messages").select("role, content").eq(
        "conversation_id", conv_id
    ).order("created_at", desc=False).limit(max_history).execute()

    history = [{"role": m["role"], "content": m["content"]} for m in (history_result.data or [])]

    # Add new user message
    user_msg_id = str(uuid.uuid4())
    supabase.table("messages").insert({
        "id": user_msg_id,
        "conversation_id": conv_id,
        "user_id": user_id,
        "role": "user",
        "content": request.message,
        "model_used": ai_service.get_model_for_tier(tier)
    }).execute()

    history.append({"role": "user", "content": request.message})

    # Load memories (Plus and above)
    memories = []
    if request.use_memory and tier != "free":
        max_mem = limits.get("max_memory_entries", 50)
        memories = await memory_service.get_memories(user_id, limit=10)

    # Build system prompt
    system_prompt = ai_service.build_system_prompt(user, memories)
    model = ai_service.get_model_for_tier(tier)

    # Stream response
    assistant_msg_id = str(uuid.uuid4())
    full_reply = []

    async def generate():
        nonlocal full_reply
        # Send conversation_id first so client knows it
        yield f"data: {json.dumps({'type': 'meta', 'conversation_id': conv_id, 'message_id': assistant_msg_id})}\n\n"

        async for chunk in ai_service.stream_chat(history, system_prompt, model):
            full_reply.append(chunk)
            yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"

        reply_text = "".join(full_reply)

        # Save assistant message
        supabase.table("messages").insert({
            "id": assistant_msg_id,
            "conversation_id": conv_id,
            "user_id": user_id,
            "role": "assistant",
            "content": reply_text,
            "model_used": model
        }).execute()

        # Update conversation title if first message
        if len(history) == 1:
            supabase.table("conversations").update({
                "title": request.message[:60],
                "updated_at": "now()"
            }).eq("id", conv_id).execute()

        # Extract memories in background (Plus and above)
        if tier != "free":
            try:
                new_memories = await ai_service.extract_memories(
                    history + [{"role": "assistant", "content": reply_text}],
                    memories
                )
                if new_memories:
                    await memory_service.save_memories(user_id, new_memories)
            except Exception:
                pass  # Memory extraction failure is non-critical

        yield f"data: {json.dumps({'type': 'done', 'model': model})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/conversations")
async def list_conversations(user: dict = Depends(get_current_user)):
    """List all conversations for the current user."""
    supabase = get_supabase()
    result = supabase.table("conversations").select(
        "id, title, created_at, updated_at"
    ).eq("user_id", user["id"]).eq("is_archived", False).order(
        "updated_at", desc=True
    ).limit(50).execute()
    return result.data or []


@router.get("/conversations/{conversation_id}/messages")
async def get_messages(conversation_id: str, user: dict = Depends(get_current_user)):
    """Get all messages in a conversation."""
    supabase = get_supabase()
    # Verify ownership
    conv = supabase.table("conversations").select("id").eq(
        "id", conversation_id
    ).eq("user_id", user["id"]).single().execute()
    if not conv.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = supabase.table("messages").select(
        "id, role, content, created_at, model_used"
    ).eq("conversation_id", conversation_id).order("created_at").execute()
    return result.data or []


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    """Delete a conversation and all its messages."""
    supabase = get_supabase()
    supabase.table("conversations").update({"is_archived": True}).eq(
        "id", conversation_id
    ).eq("user_id", user["id"]).execute()
    return {"message": "Conversation deleted"}
