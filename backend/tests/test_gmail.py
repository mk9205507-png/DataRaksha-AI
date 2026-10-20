import time
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from main import app
from app.services.gmail_service import gmail_service
from app.services.supabase_service import supabase_service

client = TestClient(app)

DEMO_USER_TOKEN = "demo_jwt_token_individual_12345"
DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"


@pytest.fixture(autouse=True)
def cleanup_connections():
    """Ensure mock Gmail connections are clean before each test."""
    supabase_service._mock_gmail_connections.clear()
    yield
    supabase_service._mock_gmail_connections.clear()


def test_gmail_auth_url_requires_auth():
    """Verify /api/v1/gmail/auth-url rejects unauthenticated requests with 401."""
    res = client.get("/api/v1/gmail/auth-url")
    assert res.status_code == 401


def test_gmail_auth_url_success():
    """Verify authenticated user receives valid Google OAuth authorization URL."""
    res = client.get(
        "/api/v1/gmail/auth-url",
        headers={"Authorization": f"Bearer {DEMO_USER_TOKEN}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert "auth_url" in data
    url = data["auth_url"]
    assert "accounts.google.com/o/oauth2/v2/auth" in url
    assert "access_type=offline" in url
    assert "prompt=consent" in url
    assert "gmail.readonly" in url
    assert "state=" in url


def test_state_generation_and_verification():
    """Verify HMAC tamper-proofing of OAuth state token."""
    state = gmail_service.generate_state(DEMO_USER_ID)
    extracted_user_id = gmail_service.verify_and_extract_state(state)
    assert extracted_user_id == DEMO_USER_ID

    # Tampered state should fail
    tampered = state[:-4] + "xxxx"
    with pytest.raises(Exception):
        gmail_service.verify_and_extract_state(tampered)


def test_gmail_status_disconnected_by_default():
    """Verify status reports disconnected when user has no stored Gmail tokens."""
    res = client.get(
        "/api/v1/gmail/status",
        headers={"Authorization": f"Bearer {DEMO_USER_TOKEN}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["connected"] is False
    assert data["email"] is None


@pytest.mark.anyio
async def test_gmail_status_connected_when_saved():
    """Verify status reports connected after credentials are saved in database."""
    await supabase_service.save_gmail_connection(
        user_id=DEMO_USER_ID,
        email="user@gmail.com",
        refresh_token="mock_refresh_token_123",
        access_token="mock_access_token_123",
    )

    res = client.get(
        "/api/v1/gmail/status",
        headers={"Authorization": f"Bearer {DEMO_USER_TOKEN}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["connected"] is True
    assert data["email"] == "user@gmail.com"


def test_oauth_callback_error_redirect():
    """Verify Google OAuth callback redirects with error if user denied consent."""
    res = client.get(
        "/api/v1/gmail/callback?error=access_denied",
        follow_redirects=False,
    )
    assert res.status_code == 302
    assert "gmail_error=access_denied" in res.headers["location"]


@patch.object(gmail_service, "exchange_code_for_tokens", new_callable=AsyncMock)
def test_oauth_callback_success_redirect(mock_exchange):
    """Verify callback exchanges code and redirects to frontend with success params."""
    state = gmail_service.generate_state(DEMO_USER_ID)
    mock_exchange.return_value = {
        "user_id": DEMO_USER_ID,
        "email": "testuser@gmail.com",
    }

    res = client.get(
        f"/api/v1/gmail/callback?code=mock_google_auth_code&state={state}",
        follow_redirects=False,
    )
    assert res.status_code == 302
    location = res.headers["location"]
    assert "gmail_connected=true" in location
    assert "testuser%40gmail.com" in location or "testuser@gmail.com" in location


@patch.object(gmail_service, "fetch_recent_emails", new_callable=AsyncMock)
def test_fetch_recent_emails_endpoint(mock_fetch):
    """Verify /api/v1/gmail/emails returns email stubs for authenticated user."""
    mock_fetch.return_value = [
        {
            "id": "msg-1",
            "thread_id": "thread-1",
            "subject": "Important Account Update",
            "sender": "alerts@bank-notifications.com",
            "date": "2026-10-20T10:00:00Z",
            "snippet": "Please review your statement.",
            "content": "Please review your statement immediately.",
        }
    ]

    res = client.get(
        "/api/v1/gmail/emails?max_results=5",
        headers={"Authorization": f"Bearer {DEMO_USER_TOKEN}"},
    )
    assert res.status_code == 200
    emails = res.json()
    assert len(emails) == 1
    assert emails[0]["id"] == "msg-1"
    assert emails[0]["subject"] == "Important Account Update"


def test_analyze_email_endpoint():
    """Verify /api/v1/gmail/analyze scores threats and persists to user history."""
    res = client.post(
        "/api/v1/gmail/analyze",
        headers={"Authorization": f"Bearer {DEMO_USER_TOKEN}"},
        json={
            "content": "URGENT: Your bank account is locked. Verify your credentials at http://suspicious-login.xyz now.",
            "sender": "security@fake-bank.xyz",
            "subject": "Account Suspension Warning",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] in ("Medium", "High")
    assert data["risk_score"] > 50
    assert len(data["detected_threats"]) > 0

    # Verify saved in user history
    history_res = client.get(
        "/api/v1/history",
        headers={"Authorization": f"Bearer {DEMO_USER_TOKEN}"},
    )
    assert history_res.status_code == 200
    records = history_res.json()
    assert len(records) > 0


@pytest.mark.anyio
async def test_disconnect_gmail_endpoint():
    """Verify disconnecting removes tokens from database."""
    await supabase_service.save_gmail_connection(
        user_id=DEMO_USER_ID,
        email="user@gmail.com",
        refresh_token="mock_refresh_token_123",
    )

    res = client.delete(
        "/api/v1/gmail/disconnect",
        headers={"Authorization": f"Bearer {DEMO_USER_TOKEN}"},
    )
    assert res.status_code == 200
    assert res.json()["status"] == "success"

    # Status should now be disconnected
    status_res = client.get(
        "/api/v1/gmail/status",
        headers={"Authorization": f"Bearer {DEMO_USER_TOKEN}"},
    )
    assert status_res.json()["connected"] is False
