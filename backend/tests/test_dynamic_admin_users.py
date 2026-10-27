import time
import uuid
import pytest
import jwt
from fastapi.testclient import TestClient
from main import app
from app.core.config import settings
from app.services.supabase_service import supabase_service

client = TestClient(app)


def generate_admin_token() -> str:
    """Generates valid JWT for designated administrator."""
    payload = {
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
        "sub": "mk9205507-admin-uuid",
        "email": "mk9205507@gmail.com",
        "role": "admin",
    }
    secret = settings.SUPABASE_JWT_SECRET or "test-secret-key-at-least-32-bytes-long!!"
    return jwt.encode(payload, secret, algorithm="HS256")


def test_dynamic_real_users_display_in_admin_portal():
    """
    Verifies that when real users sign in or authenticate on the platform,
    the Admin Portal dynamically shows them in the user management table
    with their email, role, last sign-in timestamp, and scan telemetry.
    """
    admin_token = generate_admin_token()
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Admin verifies /admin/me
    res_me = client.get("/api/v1/admin/me", headers=admin_headers)
    assert res_me.status_code == 200
    assert res_me.json()["email"] == "mk9205507@gmail.com"
    assert res_me.json()["is_admin"] is True

    # 2. Simulate User A signing in: kalyani@example.com
    res_session_a = client.post("/api/v1/auth/record-session", json={
        "user_id": "real-user-kalyani-001",
        "email": "kalyani@example.com",
        "display_name": "Kalyani More",
        "role": "individual",
        "last_sign_in_at": "2026-10-27T10:00:00Z",
    })
    assert res_session_a.status_code == 200
    assert res_session_a.json()["email"] == "kalyani@example.com"
    assert res_session_a.json()["display_name"] == "Kalyani More"

    # 3. Simulate User B signing in: vaishnavi@example.com
    res_session_b = client.post("/api/v1/auth/record-session", json={
        "user_id": "real-user-vaishnavi-002",
        "email": "vaishnavi@example.com",
        "display_name": "Vaishnavi Argade",
        "role": "individual",
        "last_sign_in_at": "2026-10-27T11:30:00Z",
    })
    assert res_session_b.status_code == 200

    # 4. Admin queries user management endpoint: /api/v1/admin/users
    res_users = client.get("/api/v1/admin/users", headers=admin_headers)
    assert res_users.status_code == 200
    users_data = res_users.json()
    assert "users" in users_data
    emails = [u["email"].lower() for u in users_data["users"]]

    # Admin and both real users who signed in MUST be visible
    assert "mk9205507@gmail.com" in emails
    assert "kalyani@example.com" in emails
    assert "vaishnavi@example.com" in emails

    # 5. Verify dynamic fields: display_name, last_sign_in_at, role, scan_count
    kalyani_record = next(u for u in users_data["users"] if u["email"] == "kalyani@example.com")
    assert kalyani_record["display_name"] == "Kalyani More"
    assert kalyani_record["role"] == "individual"
    assert "last_sign_in_at" in kalyani_record
    assert kalyani_record["status"] == "active"

    # 6. Admin overview reflects real registered user count
    res_overview = client.get("/api/v1/admin/overview?live=true", headers=admin_headers)
    assert res_overview.status_code == 200
    overview_data = res_overview.json()
    assert overview_data["registered_users"] >= 3

    # Activity stream includes real user sign-in events
    activity_previews = [a.get("preview", "") for a in overview_data.get("recent_activity", [])]
    assert any("kalyani@example.com" in prev or "vaishnavi@example.com" in prev for prev in activity_previews)

    # 7. Search filter by real user name or email
    res_search = client.get("/api/v1/admin/users?search=kalyani", headers=admin_headers)
    assert res_search.status_code == 200
    search_users = res_search.json()["users"]
    assert any("kalyani" in u["email"].lower() or "kalyani" in u.get("display_name", "").lower() for u in search_users)

    # 8. User details endpoint returns the real user's details
    res_details = client.get("/api/v1/admin/users/real-user-kalyani-001", headers=admin_headers)
    assert res_details.status_code == 200
    details = res_details.json()
    assert details["email"] == "kalyani@example.com"
    assert details["display_name"] == "Kalyani More"
    assert "recent_scans" in details


@pytest.mark.anyio
async def test_dynamic_scan_count_updates_in_admin_portal():
    """
    Verifies that when a real user performs scans, their scan count dynamically
    increments and displays accurately in the admin portal user list.
    """
    admin_token = generate_admin_token()
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    uid_suffix = uuid.uuid4().hex[:8]
    user_id = f"real-user-scanner-{uid_suffix}"
    email = f"scanner.{uid_suffix}@example.com"

    # Register user session
    await supabase_service.record_user_session(
        user_id=user_id,
        email=email,
        display_name="Scanner Test User",
        role="individual",
    )

    # Save 2 scans for this user
    await supabase_service.save_scan_history({
        "user_id": user_id,
        "user_email": email,
        "scan_type": "message",
        "input_preview": "Test scam message",
        "risk_level": "High",
        "risk_score": 88,
        "summary": "Urgent credential harvesting warning",
    })
    await supabase_service.save_scan_history({
        "user_id": user_id,
        "user_email": email,
        "scan_type": "link",
        "input_preview": "https://malicious-test-link.xyz",
        "risk_level": "Medium",
        "risk_score": 50,
        "summary": "Potential malicious redirection",
    })

    # Query admin users with search to test targeted search and scan count aggregation
    res_users = client.get(f"/api/v1/admin/users?search={email}", headers=admin_headers)
    assert res_users.status_code == 200
    users = res_users.json()["users"]
    target_user = next((u for u in users if u["email"] == email), None)
    assert target_user is not None
    assert target_user["scan_count"] == 2
