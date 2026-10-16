import time
import pytest
import jwt
from fastapi.testclient import TestClient
from main import app
from app.core.config import settings
from app.services.supabase_service import supabase_service

client = TestClient(app)


def generate_token(payload: dict) -> str:
    """Helper to generate mock Supabase JWT token."""
    base_payload = {
        "aud": "authenticated",
        "exp": int(time.time()) + 3600,
        "sub": "test-user-id",
        "email": "user@dataraksha.ai",
        "role": "individual",
    }
    base_payload.update(payload)
    return jwt.encode(base_payload, settings.SUPABASE_JWT_SECRET, algorithm="HS256")


# ==============================================================================
# Module 1: Data Request Letter Generator Tests
# ==============================================================================

def test_generate_deletion_letter_dpdp():
    """Verify deletion letter generation under DPDP framework with custom parameters."""
    payload = {
        "letter_type": "deletion",
        "company_name": "Acme Social Inc.",
        "user_name": "Aarav Sharma",
        "user_email": "aarav@example.com",
        "account_identifier": "usr_994821",
        "framework": "DPDP",
        "custom_notes": "Please also remove all telemetry and biometric records.",
    }
    response = client.post("/api/v1/letters/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "subject" in data
    assert "body" in data
    assert "Acme Social Inc." in data["body"]
    assert "Aarav Sharma" in data["body"]
    assert "usr_994821" in data["body"]
    assert "DPDP" in data["subject"]
    assert "telemetry and biometric records" in data["body"]
    assert data["created_at"] is not None


def test_generate_access_letter_gdpr():
    """Verify Subject Access Request (SAR) letter generation under GDPR framework."""
    payload = {
        "letter_type": "access",
        "company_name": "Global Cloud Corp",
        "user_name": "Kalyani More",
        "user_email": "kalyani@example.com",
        "account_id": "ACC-54321",
        "framework": "GDPR",
        "custom_details": "Include third-party advertiser data brokers.",
    }
    response = client.post("/api/v1/letters/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "GDPR" in data["subject"]
    assert "Subject Access Request" in data["body"]
    assert "Global Cloud Corp" in data["body"]
    assert "ACC-54321" in data["body"]
    assert "advertiser data brokers" in data["body"]


def test_generate_consent_withdrawal_letter():
    """Verify consent withdrawal letter generation."""
    payload = {
        "letter_type": "consent_withdrawal",
        "company_name": "Marketing Pro Ltd",
        "user_name": "Vaishnavi Argade",
        "user_email": "vaishnavi@example.com",
    }
    response = client.post("/api/v1/letters/generate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "Withdrawal of Consent" in data["subject"]
    assert "Marketing Pro Ltd" in data["body"]
    assert "Vaishnavi Argade" in data["body"]


# ==============================================================================
# Module 2: Analysis History & User Audit Trail Tests
# ==============================================================================

@pytest.mark.anyio
async def test_user_history_flow_and_filtering():
    """Verify listing history with filters, pagination, and deletion."""
    user_id = "test-history-user-99"
    token = generate_token({"sub": user_id, "email": "history99@dataraksha.ai"})
    headers = {"Authorization": f"Bearer {token}"}

    # Reset mock scans for this user
    supabase_service._mock_scans[user_id] = []

    # Insert 3 test scan records
    await supabase_service.save_scan_history({
        "id": "scan-1",
        "user_id": user_id,
        "scan_type": "message",
        "input_preview": "Urgent: Your bank account will be blocked...",
        "risk_level": "High",
        "risk_score": 92,
        "summary": "Phishing scam attempting bank impersonation.",
    })
    await supabase_service.save_scan_history({
        "id": "scan-2",
        "user_id": user_id,
        "scan_type": "link",
        "input_preview": "https://suspicious-domain.xyz",
        "risk_level": "High",
        "risk_score": 85,
        "summary": "High risk malicious domain.",
    })
    await supabase_service.save_scan_history({
        "id": "scan-3",
        "user_id": user_id,
        "scan_type": "message",
        "input_preview": "Hello, how are you doing today?",
        "risk_level": "Low",
        "risk_score": 10,
        "summary": "Benign message.",
    })

    # 1. Fetch unpaginated list
    res_all = client.get("/api/v1/history", headers=headers)
    assert res_all.status_code == 200
    records = res_all.json()
    assert isinstance(records, list)
    assert len(records) == 3

    # 2. Fetch paginated with filtering: scan_type=message
    res_filter_msg = client.get("/api/v1/history?page=1&limit=10&scan_type=message", headers=headers)
    assert res_filter_msg.status_code == 200
    paginated_data = res_filter_msg.json()
    assert paginated_data["total_records"] == 2
    assert len(paginated_data["records"]) == 2
    assert all(r["scan_type"] == "message" for r in paginated_data["records"])

    # 3. Fetch with filtering: risk_level=High
    res_filter_high = client.get("/api/v1/history?page=1&limit=10&risk_level=High", headers=headers)
    assert res_filter_high.status_code == 200
    assert res_filter_high.json()["total_records"] == 2

    # 4. Delete single scan record
    res_del_single = client.delete("/api/v1/history/scan-1", headers=headers)
    assert res_del_single.status_code == 200
    assert res_del_single.json()["status"] == "success"

    # Verify scan-1 is deleted
    res_after_del = client.get("/api/v1/history", headers=headers)
    ids_remaining = [r["id"] for r in res_after_del.json()]
    assert "scan-1" not in ids_remaining
    assert len(ids_remaining) == 2

    # 5. Clear all history
    res_clear = client.delete("/api/v1/history", headers=headers)
    assert res_clear.status_code == 200
    assert res_clear.json()["status"] == "success"

    # Verify empty
    res_empty = client.get("/api/v1/history", headers=headers)
    assert len(res_empty.json()) == 0


def test_history_unauthorized_access():
    """Verify history endpoints require authentication."""
    res_list = client.get("/api/v1/history")
    assert res_list.status_code == 401

    res_del = client.delete("/api/v1/history/any-id")
    assert res_del.status_code == 401

    res_clear = client.delete("/api/v1/history")
    assert res_clear.status_code == 401


# ==============================================================================
# Module 3: Administrator Dashboard & Metrics Tests
# ==============================================================================

def test_admin_overview_authorized_admin():
    """Verify administrator can retrieve aggregated system overview."""
    admin_token = generate_token({
        "sub": "admin-super-id",
        "email": "superadmin@dataraksha.ai",
        "role": "admin",
    })
    response = client.get(
        "/api/v1/admin/overview",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_scans"] >= 1000
    assert data["scans_today"] > 0
    assert "risk_breakdown" in data
    assert "low" in data["risk_breakdown"]
    assert "high" in data["risk_breakdown"]
    assert "scans_by_type" in data
    assert "message" in data["scans_by_type"]
    assert "system_status" in data
    assert data["system_status"]["gemini_api"] == "Operational (Latency 340ms)"
    assert data["requested_by"] == "superadmin@dataraksha.ai"


def test_admin_overview_forbidden_individual():
    """Verify individual user cannot access admin overview."""
    user_token = generate_token({
        "sub": "individual-user-id",
        "email": "regular@dataraksha.ai",
        "role": "individual",
    })
    response = client.get(
        "/api/v1/admin/overview",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403
    assert "Admin privileges required" in response.json()["detail"]


def test_admin_overview_unauthorized():
    """Verify unauthenticated request to /admin/overview is rejected."""
    response = client.get("/api/v1/admin/overview")
    assert response.status_code == 401
