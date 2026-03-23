import hmac
import hashlib
import json
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from app.dependencies.auth import get_current_user
from app.config import get_settings
from app.database.supabase_client import get_supabase

router = APIRouter(prefix="/billing", tags=["billing"])
settings = get_settings()


def _base_url():
    return "https://sandbox-api.paddle.com" if settings.debug else "https://api.paddle.com"


def _headers():
    return {
        "Authorization": f"Bearer {settings.paddle_api_key}",
        "Content-Type": "application/json",
    }


def _price_to_tier():
    return {
        settings.paddle_plus_price_id: "plus",
        settings.paddle_pro_price_id: "pro",
        settings.paddle_premium_price_id: "premium",
    }


def _tier_to_price():
    return {
        "plus": settings.paddle_plus_price_id,
        "pro": settings.paddle_pro_price_id,
        "premium": settings.paddle_premium_price_id,
    }


def _verify_webhook(raw_body: bytes, signature_header: str) -> bool:
    try:
        parts = dict(item.split("=", 1) for item in signature_header.split(";"))
        ts = parts.get("ts", "")
        h1 = parts.get("h1", "")
        signed = f"{ts}:{raw_body.decode()}"
        expected = hmac.new(
            settings.paddle_webhook_secret.encode(),
            signed.encode(),
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, h1)
    except Exception:
        return False


@router.post("/create-checkout/{tier}")
async def create_checkout(tier: str, user: dict = Depends(get_current_user)):
    tier_map = _tier_to_price()
    if tier not in tier_map:
        raise HTTPException(status_code=400, detail=f"Unknown tier: {tier}")

    price_id = tier_map[tier]
    if not price_id:
        raise HTTPException(status_code=500, detail="Paddle price not configured")

    payload = {
        "items": [{"price_id": price_id, "quantity": 1}],
        "checkout": {"url": f"{settings.frontend_url}/billing?success=true"},
        "custom_data": {"user_id": user["id"]},
    }

    # Attach existing Paddle customer if we have one
    customer_id = user.get("stripe_customer_id")  # column reused for Paddle customer ID
    if customer_id and customer_id.startswith("ctm_"):
        payload["customer_id"] = customer_id

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_base_url()}/transactions",
            json=payload,
            headers=_headers(),
        )

    if resp.status_code != 201:
        raise HTTPException(status_code=500, detail="Failed to create Paddle checkout")

    data = resp.json()["data"]
    return {"checkout_url": data["checkout"]["url"]}


@router.post("/portal")
async def create_portal(user: dict = Depends(get_current_user)):
    customer_id = user.get("stripe_customer_id")
    if not customer_id or not customer_id.startswith("ctm_"):
        raise HTTPException(status_code=400, detail="No active subscription found")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{_base_url()}/customers/{customer_id}/auth-token",
            headers=_headers(),
        )

    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to create portal session")

    token = resp.json()["data"]["customer_auth_token"]
    subdomain = "sandbox." if settings.debug else ""
    return {"portal_url": f"https://{subdomain}customer.paddle.com/?ptau={token}"}


@router.get("/status")
async def billing_status(user: dict = Depends(get_current_user)):
    return {
        "tier": user.get("tier", "free"),
        "subscription_status": user.get("subscription_status", "active"),
        "requests_today": user.get("requests_today", 0),
        "daily_limit": user.get("tier_limits", {}).get("daily_request_limit", 10),
    }


@router.post("/webhook")
async def paddle_webhook(request: Request):
    raw_body = await request.body()
    signature = request.headers.get("paddle-signature", "")

    if settings.paddle_webhook_secret and not _verify_webhook(raw_body, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event = json.loads(raw_body)
    event_type = event.get("event_type", "")
    data = event.get("data", {})
    supabase = get_supabase()

    if event_type == "transaction.completed":
        custom_data = data.get("custom_data") or {}
        user_id = custom_data.get("user_id") if isinstance(custom_data, dict) else None
        customer_id = data.get("customer_id")
        subscription_id = data.get("subscription_id")

        if user_id and customer_id:
            update = {"stripe_customer_id": customer_id}
            items = data.get("items", [])
            if items and subscription_id:
                price_id = items[0].get("price", {}).get("id", "")
                tier = _price_to_tier().get(price_id, "plus")
                update["tier"] = tier
                update["stripe_subscription_id"] = subscription_id
                update["subscription_status"] = "active"
            supabase.table("users").update(update).eq("id", user_id).execute()

    elif event_type in ("subscription.updated", "subscription.activated"):
        customer_id = data.get("customer_id")
        items = data.get("items", [])
        if customer_id and items:
            price_id = items[0].get("price", {}).get("id", "")
            tier = _price_to_tier().get(price_id, "free")
            supabase.table("users").update({
                "tier": tier,
                "subscription_status": data.get("status", "active"),
            }).eq("stripe_customer_id", customer_id).execute()

    elif event_type == "subscription.canceled":
        customer_id = data.get("customer_id")
        if customer_id:
            supabase.table("users").update({
                "tier": "free",
                "stripe_subscription_id": None,
                "subscription_status": "cancelled",
            }).eq("stripe_customer_id", customer_id).execute()

    return {"status": "ok"}
