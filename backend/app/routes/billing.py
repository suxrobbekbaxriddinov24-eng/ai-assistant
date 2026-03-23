import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from app.dependencies.auth import get_current_user
from app.config import get_settings
from app.database.supabase_client import get_supabase

router = APIRouter(prefix="/billing", tags=["billing"])
settings = get_settings()
stripe.api_key = settings.stripe_secret_key

PRICE_TO_TIER = {
    settings.stripe_plus_price_id: "plus",
    settings.stripe_pro_price_id: "pro",
    settings.stripe_premium_price_id: "premium",
}

TIER_TO_PRICE = {
    "plus": settings.stripe_plus_price_id,
    "pro": settings.stripe_pro_price_id,
    "premium": settings.stripe_premium_price_id,
}


@router.post("/create-checkout/{tier}")
async def create_checkout(tier: str, user: dict = Depends(get_current_user)):
    """Create a Stripe Checkout session for upgrading."""
    if tier not in TIER_TO_PRICE:
        raise HTTPException(status_code=400, detail=f"Unknown tier: {tier}")

    price_id = TIER_TO_PRICE[tier]
    if not price_id:
        raise HTTPException(status_code=500, detail="Stripe price not configured")

    # Get or create Stripe customer
    customer_id = user.get("stripe_customer_id")
    if not customer_id:
        customer = stripe.Customer.create(
            email=user["email"],
            metadata={"user_id": user["id"]}
        )
        customer_id = customer.id
        get_supabase().table("users").update({
            "stripe_customer_id": customer_id
        }).eq("id", user["id"]).execute()

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.frontend_url}/billing?success=true",
        cancel_url=f"{settings.frontend_url}/billing?cancelled=true",
        subscription_data={"metadata": {"user_id": user["id"]}}
    )
    return {"checkout_url": session.url}


@router.post("/portal")
async def create_portal(user: dict = Depends(get_current_user)):
    """Create a Stripe Customer Portal session for managing subscription."""
    customer_id = user.get("stripe_customer_id")
    if not customer_id:
        raise HTTPException(status_code=400, detail="No active subscription found")

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{settings.frontend_url}/billing"
    )
    return {"portal_url": session.url}


@router.get("/status")
async def billing_status(user: dict = Depends(get_current_user)):
    """Get current subscription status."""
    return {
        "tier": user.get("tier", "free"),
        "subscription_status": user.get("subscription_status", "active"),
        "stripe_customer_id": user.get("stripe_customer_id"),
        "requests_today": user.get("requests_today", 0),
        "daily_limit": user.get("tier_limits", {}).get("daily_request_limit", 10)
    }


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events to sync subscription changes."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    supabase = get_supabase()

    if event["type"] in ("customer.subscription.created", "customer.subscription.updated"):
        sub = event["data"]["object"]
        price_id = sub["items"]["data"][0]["price"]["id"]
        tier = PRICE_TO_TIER.get(price_id, "free")
        supabase.table("users").update({
            "tier": tier,
            "stripe_subscription_id": sub["id"],
            "subscription_status": sub["status"]
        }).eq("stripe_customer_id", sub["customer"]).execute()

    elif event["type"] == "customer.subscription.deleted":
        sub = event["data"]["object"]
        supabase.table("users").update({
            "tier": "free",
            "stripe_subscription_id": None,
            "subscription_status": "cancelled"
        }).eq("stripe_customer_id", sub["customer"]).execute()

    return {"status": "ok"}
