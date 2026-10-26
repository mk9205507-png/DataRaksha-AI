import time
import pytest
import jwt
from fastapi.testclient import TestClient
from main import app
from app.core.config import settings
from app.services.supabase_service import supabase_service

client = TestClient(app)


def generate_token_for(user_id: str, email: str, role: str = "individual") -> str:
    """Helper to generate JWT tokens for testing user isolation."""
    payload = {
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
        "sub": user_id,
        "email": email,
        "role": role,
    }
    secret = settings.SUPABASE_JWT_SECRET or "test-secret-key-at-least-32-bytes-long!!"
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.mark.anyio
async def test_two_accounts_data_isolation():
    """
    Verifies that two distinct user accounts (Nisha and Account Two)
    have complete, verified data isolation in scan history and ownership.
    """
    nisha_id = "test-nisha-uuid-001"
    account_two_id = "test-account-two-uuid-002"

    nisha_token = generate_token_for(nisha_id, "nisha@example.com")
    account_two_token = generate_token_for(account_two_id, "accounttwo@example.com")

    nisha_headers = {"Authorization": f"Bearer {nisha_token}"}
    account_two_headers = {"Authorization": f"Bearer {account_two_token}"}

    # 1. Clean slate for test accounts
    await supabase_service.clear_user_scans(nisha_id)
    await supabase_service.clear_user_scans(account_two_id)

    # 2. Account Nisha initially has 0 scans
    res_nisha_init = client.get("/api/v1/history", headers=nisha_headers)
    assert res_nisha_init.status_code == 200
    nisha_records = res_nisha_init.json()
    assert isinstance(nisha_records, list)
    assert len(nisha_records) == 0, f"Expected 0 scans for new user Nisha, found: {len(nisha_records)}"

    # 3. Account Two initially has 0 scans
    res_two_init = client.get("/api/v1/history", headers=account_two_headers)
    assert res_two_init.status_code == 200
    assert len(res_two_init.json()) == 0, "Expected 0 scans for Account Two"

    # 4. Perform a real scan for Nisha
    scan_payload_nisha = {
        "content": "Urgent: Your account has been suspended. Please confirm your password immediately."
    }
    res_scan_nisha = client.post("/api/v1/scan/message", json=scan_payload_nisha, headers=nisha_headers)
    assert res_scan_nisha.status_code == 200
    nisha_scan_data = res_scan_nisha.json()
    assert "risk_score" in nisha_scan_data
    assert "risk_level" in nisha_scan_data

    # 5. Verify scan automatically appears in Nisha's history via background task
    res_nisha_after = client.get("/api/v1/history", headers=nisha_headers)
    assert res_nisha_after.status_code == 200
    nisha_history = res_nisha_after.json()
    assert len(nisha_history) == 1
    assert nisha_history[0]["user_id"] == nisha_id
    assert "suspended" in nisha_history[0]["input_preview"]
    nisha_scan_id = nisha_history[0]["id"]

    # 6. Verify Account Two STILL has 0 scans and CANNOT see Nisha's scan
    res_two_check = client.get("/api/v1/history", headers=account_two_headers)
    assert res_two_check.status_code == 200
    assert len(res_two_check.json()) == 0, "Account Two must not see Nisha's scan records"

    # 7. Perform a scan for Account Two
    scan_payload_two = {
        "url": "https://suspicious-malware-download-portal.xyz"
    }
    res_scan_two = client.post("/api/v1/scan/link", json=scan_payload_two, headers=account_two_headers)
    assert res_scan_two.status_code == 200

    # 8. Verify Account Two sees ONLY Account Two's scan
    res_two_after = client.get("/api/v1/history", headers=account_two_headers)
    assert res_two_after.status_code == 200
    two_history = res_two_after.json()
    assert len(two_history) == 1
    assert two_history[0]["user_id"] == account_two_id
    assert "suspicious-malware" in two_history[0]["input_preview"]

    # 9. Verify Nisha still sees ONLY her own scan
    res_nisha_recheck = client.get("/api/v1/history", headers=nisha_headers)
    assert res_nisha_recheck.status_code == 200
    assert len(res_nisha_recheck.json()) == 1
    assert res_nisha_recheck.json()[0]["id"] == nisha_scan_id

    # 10. Security check: Account Two attempts to delete Nisha's scan record
    res_hack_delete = client.delete(f"/api/v1/history/{nisha_scan_id}", headers=account_two_headers)
    assert res_hack_delete.status_code in (403, 404), "Unauthorized delete attempt must be rejected"

    # Verify Nisha's scan is completely intact
    res_nisha_final = client.get("/api/v1/history", headers=nisha_headers)
    assert len(res_nisha_final.json()) == 1
    assert res_nisha_final.json()[0]["id"] == nisha_scan_id
