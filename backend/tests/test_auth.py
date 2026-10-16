import time
import jwt
from fastapi.testclient import TestClient
from main import app
from app.core.config import settings
from app.core.security import verify_supabase_token
from app.core.exceptions import AuthenticationException
import pytest

client = TestClient(app)

SECRET_KEY = "test-secret-key-at-least-32-bytes-long!!"


def generate_token(payload: dict, secret: str = SECRET_KEY) -> str:
    """Helper to generate JWT tokens for tests."""
    return jwt.encode(payload, secret, algorithm="HS256")


# ------------------------------------------------------------------------------
# 1. User Profile (/api/v1/auth/me) Tests
# ------------------------------------------------------------------------------

def test_get_my_profile_success():
    """Verify authenticated user can retrieve their profile."""
    token = generate_token({
        "sub": "user-uuid-1234",
        "email": "user@dataraksha.ai",
        "role": "individual",
    })
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "user-uuid-1234"
    assert data["email"] == "user@dataraksha.ai"
    assert data["role"] == "individual"


def test_get_my_profile_from_user_metadata():
    """Verify Supabase user_metadata role extraction."""
    token = generate_token({
        "sub": "user-meta-5678",
        "email": "meta@dataraksha.ai",
        "user_metadata": {"role": "individual"},
    })
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "individual"


def test_get_my_profile_from_app_metadata():
    """Verify Supabase app_metadata role extraction."""
    token = generate_token({
        "sub": "admin-app-9999",
        "email": "superadmin@dataraksha.ai",
        "app_metadata": {"role": "admin"},
    })
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "admin"


def test_get_my_profile_missing_authorization_header():
    """Verify 401 is returned when Authorization header is absent."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Could not validate credentials" in response.json()["detail"]


def test_get_my_profile_invalid_header_scheme():
    """Verify 401 is returned when non-Bearer scheme is passed."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Basic dXNlcjpwYXNz"},
    )
    assert response.status_code == 401
    assert "Authorization header must start with 'Bearer '" in response.json()["detail"]


def test_get_my_profile_malformed_token():
    """Verify 401 is returned when token cannot be decoded."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not-a-valid-jwt-token"},
    )
    assert response.status_code == 401
    assert "Invalid JWT format" in response.json()["detail"]


def test_get_my_profile_expired_token():
    """Verify 401 is returned when JWT exp claim is in the past."""
    token = generate_token({
        "sub": "user-expired",
        "email": "expired@dataraksha.ai",
        "exp": int(time.time()) - 3600,
    })
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 401
    assert "Authentication token has expired" in response.json()["detail"]


# ------------------------------------------------------------------------------
# 2. RBAC & Admin Permissions (/api/v1/admin/metrics) Tests
# ------------------------------------------------------------------------------

def test_admin_metrics_allowed_for_admin():
    """Verify users with 'admin' role can access admin metrics."""
    admin_token = generate_token({
        "sub": "admin-uuid",
        "email": "admin@dataraksha.ai",
        "role": "admin",
    })
    response = client.get(
        "/api/v1/admin/metrics",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["requested_by"] == "admin@dataraksha.ai"


def test_admin_metrics_forbidden_for_individual():
    """Verify individual users are blocked from admin routes with 403 Forbidden."""
    user_token = generate_token({
        "sub": "user-uuid",
        "email": "individual@dataraksha.ai",
        "role": "individual",
    })
    response = client.get(
        "/api/v1/admin/metrics",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Admin privileges required"


def test_admin_metrics_unauthorized_without_token():
    """Verify unauthenticated requests to admin routes return 401 Unauthorized."""
    response = client.get("/api/v1/admin/metrics")
    assert response.status_code == 401


# ------------------------------------------------------------------------------
# 3. Protected History Endpoint Tests
# ------------------------------------------------------------------------------

def test_history_endpoint_requires_auth():
    """Verify /api/v1/history requires authentication."""
    response = client.get("/api/v1/history")
    assert response.status_code == 401

    token = generate_token({
        "sub": "history-user-1",
        "email": "history@dataraksha.ai",
        "role": "individual",
    })
    response = client.get(
        "/api/v1/history",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert isinstance(response.json(), list)


# ------------------------------------------------------------------------------
# 4. verify_supabase_token Unit Tests
# ------------------------------------------------------------------------------

def test_verify_supabase_token_signature_verification(monkeypatch):
    """Verify that when SUPABASE_JWT_SECRET is set, signature is strictly checked."""
    test_secret = "super-secret-at-least-32-chars-long-security-key"
    monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", test_secret)

    valid_token = jwt.encode(
        {"sub": "verified-user", "role": "individual"},
        test_secret,
        algorithm="HS256",
    )
    payload = verify_supabase_token(valid_token)
    assert payload["sub"] == "verified-user"

    wrong_token = jwt.encode(
        {"sub": "tampered-user"},
        "wrong-secret-key-at-least-32-chars-long-12345",
        algorithm="HS256",
    )
    with pytest.raises(AuthenticationException):
        verify_supabase_token(wrong_token)
