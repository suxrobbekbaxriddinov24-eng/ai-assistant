"""
Tests for the chat endpoint.
Run with: cd backend && pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)


def test_health():
    """Backend health check returns ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root():
    """Root endpoint returns app info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "name" in data
    assert "version" in data
    assert data["status"] == "running"


def test_chat_requires_auth():
    """Chat endpoint returns 422/401 without auth header."""
    response = client.post("/chat/", json={"message": "hello"})
    assert response.status_code in (401, 422)


def test_voice_requires_auth():
    """Voice endpoint requires authentication."""
    response = client.post("/voice/transcribe")
    assert response.status_code in (401, 403, 422)


def test_screen_requires_auth():
    """Screen control requires authentication."""
    response = client.post("/screen/action", json={
        "goal": "test",
        "screenshot_base64": "abc"
    })
    assert response.status_code in (401, 403, 422)


def test_billing_webhook_bad_signature():
    """Stripe webhook rejects invalid signatures."""
    response = client.post(
        "/billing/webhook",
        content=b'{"type": "test"}',
        headers={"stripe-signature": "invalid"}
    )
    assert response.status_code == 400
