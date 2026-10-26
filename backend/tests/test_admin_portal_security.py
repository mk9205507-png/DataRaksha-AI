import time
import pytest
import jwt
from fastapi.testclient import TestClient
from main import app
from app.core.config import settings
from app.services.supabase_service import supabase_service

client = TestClient(app)


def generate_test_token(user_id: str, email: str, role: str = "individual", user_metadata: dict = None) -> str:
    """Helper to generate signed JWT tokens for testing authorization rules."""
    payload = {
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
        "sub": user_id,
        "email": email,
        "role": role,
    }
    if user_metadata:
        payload["user_metadata"] = user_metadata

    secret = settings.SUPABASE_JWT_SECRET or "test-secret-key-at-least-32-bytes-long!!"
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture(autouse=True)
def setup_mock_db():
    """Setup clean mock database state before each test."""
    admin_id = "test-admin-uuid-001"
    user_id = "test-user-uuid-002"
    user2_id = "test-user-uuid-003"

    supabase_service._mock_profiles[admin_id] = {
        "id": admin_id,
        "email": "admin@dataraksha.ai",
        "role": "admin",
        "created_at": "2026-01-01T00:00:00Z",
    }
    supabase_service._mock_profiles[user_id] = {
        "id": user_id,
        "email": "regular.user@example.com",
        "role": "individual",
        "created_at": "2026-02-01T00:00:00Z",
    }
    supabase_service._mock_profiles[user2_id] = {
        "id": user2_id,
        "email": "another.user@example.com",
        "role": "individual",
        "created_at": "2026-03-01T00:00:00Z",
    }


def test_unauthenticated_request_blocked():
    """
    Test 1: Unauthenticated requests to all admin endpoints must return 401 Unauthorized.
    """
    endpoints = [
        "/admin/me",
        "/api/admin/me",
        "/api/v1/admin/me",
        "/api/v1/admin/stats",
        "/api/v1/admin/overview",
        "/api/v1/admin/users",
        "/api/v1/admin/scans",
        "/api/v1/admin/activity",
        "/api/admin/stats",
        "/api/admin/users",
        "/api/admin/scans",
    ]
    for ep in endpoints:
        res = client.get(ep)
        assert res.status_code == 401, f"Expected 401 for unauthenticated {ep}, got {res.status_code}"


def test_regular_user_forbidden_from_admin_endpoints():
    """
    Test 2: Authenticated normal users (role='individual') must receive 403 Forbidden on all admin endpoints.
    """
    user_token = generate_test_token("test-user-uuid-002", "regular.user@example.com", role="individual")
    headers = {"Authorization": f"Bearer {user_token}"}

    endpoints = [
        "/admin/me",
        "/api/admin/me",
        "/api/v1/admin/me",
        "/api/v1/admin/stats",
        "/api/v1/admin/overview",
        "/api/v1/admin/users",
        "/api/v1/admin/scans",
        "/api/v1/admin/activity",
        "/api/admin/stats",
        "/api/admin/users",
        "/api/admin/scans",
    ]
    for ep in endpoints:
        res = client.get(ep, headers=headers)
        assert res.status_code == 403, f"Expected 403 for non-admin on {ep}, got {res.status_code}"
        assert "Admin privileges required" in res.json().get("detail", "")


def test_admin_access_allowed():
    """
    Test 3: Authorized administrator account receives 200 OK with real telemetry and user data.
    """
    admin_token = generate_test_token("test-admin-uuid-001", "admin@dataraksha.ai", role="admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Test /admin/me on root, /api, and /api/v1 prefixes
    for me_path in ["/admin/me", "/api/admin/me", "/api/v1/admin/me"]:
        res_me = client.get(me_path, headers=headers)
        assert res_me.status_code == 200, f"Expected 200 on {me_path}, got {res_me.status_code}"
        me_data = res_me.json()
        assert me_data["is_admin"] is True
        assert me_data["role"] == "admin"
        assert me_data["email"] == "admin@dataraksha.ai"

    # Test stats
    res_stats = client.get("/api/v1/admin/stats", headers=headers)
    assert res_stats.status_code == 200
    stats_data = res_stats.json()
    assert "total_scans" in stats_data
    assert "registered_users" in stats_data
    assert "risk_breakdown" in stats_data

    # Test users list
    res_users = client.get("/api/v1/admin/users", headers=headers)
    assert res_users.status_code == 200
    users_data = res_users.json()
    assert "users" in users_data
    assert users_data["total"] >= 2
    # Ensure sensitive credentials are never exposed
    for u in users_data["users"]:
        assert "password" not in u
        assert "access_token" not in u
        assert "token" not in u

    # Test scans list
    res_scans = client.get("/api/v1/admin/scans", headers=headers)
    assert res_scans.status_code == 200
    assert "scans" in res_scans.json()

    # Test activity audit logs
    res_activity = client.get("/api/v1/admin/activity", headers=headers)
    assert res_activity.status_code == 200
    assert "logs" in res_activity.json()


def test_tampered_user_metadata_cannot_elevate_privileges():
    """
    Test 4: Attack vector where client injects user_metadata: {"role": "admin"} in JWT
    must NOT grant admin access when the user's authoritative database profile is 'individual'.
    """
    tampered_token = generate_test_token(
        user_id="test-user-uuid-002",
        email="regular.user@example.com",
        role="individual",
        user_metadata={"role": "admin", "is_superadmin": True},
    )
    headers = {"Authorization": f"Bearer {tampered_token}"}

    res = client.get("/api/v1/admin/stats", headers=headers)
    assert res.status_code == 403, "Tampered user_metadata must not grant administrative access!"


def test_role_update_and_self_demotion_lockout():
    """
    Test 5: Administrator can promote/demote other users, but cannot demote themselves (lockout prevention).
    """
    admin_token = generate_test_token("test-admin-uuid-001", "admin@dataraksha.ai", role="admin")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Promote regular user to admin
    res_promote = client.post(
        "/api/v1/admin/users/test-user-uuid-002/role",
        json={"role": "admin"},
        headers=admin_headers,
    )
    assert res_promote.status_code == 200
    assert res_promote.json().get("new_role") == "admin"
    assert supabase_service._mock_profiles["test-user-uuid-002"]["role"] == "admin"

    # 2. Demote back to individual
    res_demote = client.post(
        "/api/v1/admin/users/test-user-uuid-002/role",
        json={"role": "individual"},
        headers=admin_headers,
    )
    assert res_demote.status_code == 200
    assert res_demote.json().get("new_role") == "individual"
    assert supabase_service._mock_profiles["test-user-uuid-002"]["role"] == "individual"

    # 3. Administrator attempts to demote their OWN account -> MUST BE REJECTED (lockout guard)
    res_self_demote = client.post(
        "/api/v1/admin/users/test-admin-uuid-001/role",
        json={"role": "individual"},
        headers=admin_headers,
    )
    assert res_self_demote.status_code == 400
    assert "lockout" in res_self_demote.json().get("detail", "").lower()
    assert supabase_service._mock_profiles["test-admin-uuid-001"]["role"] == "admin"


def test_non_admin_cannot_update_roles():
    """
    Test 6: A regular user cannot invoke the role update endpoint to promote anyone.
    """
    user_token = generate_test_token("test-user-uuid-002", "regular.user@example.com", role="individual")
    user_headers = {"Authorization": f"Bearer {user_token}"}

    res = client.post(
        "/api/v1/admin/users/test-user-uuid-002/role",
        json={"role": "admin"},
        headers=user_headers,
    )
    assert res.status_code == 403
    assert supabase_service._mock_profiles["test-user-uuid-002"]["role"] == "individual"


@pytest.mark.anyio
async def test_user_scan_history_isolation_preserved():
    """
    Test 7: Regular users continue to see only their own scan history on /api/v1/history,
    preserving full data isolation.
    """
    user1_id = "test-user-uuid-002"
    user2_id = "test-user-uuid-003"

    user1_token = generate_test_token(user1_id, "regular.user@example.com")
    user2_token = generate_test_token(user2_id, "another.user@example.com")

    # Add a scan for user1
    await supabase_service.save_scan_history({
        "user_id": user1_id,
        "scan_type": "message",
        "input_preview": "Sensitive message for user 1 only",
        "risk_level": "Low",
        "risk_score": 15,
        "summary": "User 1 clean message",
        "detected_threats": [],
        "recommendations": [],
    })

    # User 1 queries history -> sees 1 scan
    res1 = client.get("/api/v1/history", headers={"Authorization": f"Bearer {user1_token}"})
    assert res1.status_code == 200
    u1_scans = res1.json()
    assert len(u1_scans) >= 1
    assert any(s.get("input_preview") == "Sensitive message for user 1 only" for s in u1_scans)

    # User 2 queries history -> does NOT see User 1's scan
    res2 = client.get("/api/v1/history", headers={"Authorization": f"Bearer {user2_token}"})
    assert res2.status_code == 200
    u2_scans = res2.json()
    assert not any(s.get("input_preview") == "Sensitive message for user 1 only" for s in u2_scans)


def test_admin_uuid_allowlist_authorization(monkeypatch):
    """
    Test 8: User whose UUID is in settings.ADMIN_USER_IDS is authorized as admin on /admin/me.
    """
    special_uuid = "allowlisted-admin-uuid-999"
    monkeypatch.setattr(settings, "ADMIN_USER_IDS", f"other-uuid,{special_uuid}")

    token = generate_test_token(special_uuid, "allowlisted@example.com", role="individual")
    headers = {"Authorization": f"Bearer {token}"}

    for me_path in ["/admin/me", "/api/v1/admin/me"]:
        res = client.get(me_path, headers=headers)
        assert res.status_code == 200, f"Expected 200 on {me_path}, got {res.status_code}"
        assert res.json()["is_admin"] is True
        assert res.json()["role"] == "admin"

