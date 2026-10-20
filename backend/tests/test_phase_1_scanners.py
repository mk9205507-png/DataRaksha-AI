import pytest
from fastapi.testclient import TestClient
from main import app
from app.models.schemas import MANDATORY_SAFETY_DISCLAIMER

client = TestClient(app)


# ==============================================================================
# Module 1: Message & Email Scanner Tests
# ==============================================================================

def test_scan_message_phishing_detected():
    """Verify that urgent bank impersonation text is correctly flagged as High risk."""
    payload = {
        "content": (
            "URGENT: Your State Bank account has been suspended! "
            "Please click here immediately to verify your account within 24 hours: "
            "http://fake-sbi-login.xyz/verify or call +91-9876543210"
        )
    }
    response = client.post("/api/v1/scan/message", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scan_type"] == "message"
    assert data["risk_level"] == "High"
    assert data["risk_score"] >= 70
    assert len(data["detected_threats"]) > 0
    assert any("Urgent" in t or "impersonation" in t.lower() for t in data["detected_threats"])
    assert any("Phone Number" in p for p in data["exposed_pii"])
    assert data["disclaimer"] == MANDATORY_SAFETY_DISCLAIMER


def test_scan_message_pii_extraction():
    """Verify regex and heuristic extraction of phone, email, credentials, cards, and UPI."""
    payload = {
        "content": (
            "Hello, contact me at support@dataraksha.ai or +91 98765 43210. "
            "My UPI id is payment@okhdfcbank. "
            "Temporary password: SecretKey123! and otp: 482910. "
            "Card number: 4111-2222-3333-4444"
        )
    }
    response = client.post("/api/v1/scan/message", json=payload)
    assert response.status_code == 200
    data = response.json()

    pii = data["exposed_pii"]
    assert any("Email Address" in p for p in pii)
    assert any("Phone Number" in p for p in pii)
    assert any("UPI ID" in p for p in pii)
    assert any("OTP" in p for p in pii)
    assert any("password" in p.lower() or "credential" in p.lower() for p in pii)
    assert any("Card Number" in p for p in pii)


def test_scan_message_safe_content():
    """Verify that innocent greetings or notes evaluate as Low risk."""
    payload = {
        "content": "Hi Team, the project planning meeting is scheduled for tomorrow at 10 AM. See you there!"
    }
    response = client.post("/api/v1/scan/message", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scan_type"] == "message"
    assert data["risk_level"] == "Low"
    assert data["risk_score"] <= 39
    assert data["exposed_pii"] == []
    assert data["disclaimer"] == MANDATORY_SAFETY_DISCLAIMER


# ==============================================================================
# Module 2: Link & URL Safety Scanner Tests
# ==============================================================================

def test_scan_link_safe_domain():
    """Verify that reputable HTTPS domains receive Low risk rating."""
    payload = {"url": "https://wikipedia.org"}
    response = client.post("/api/v1/scan/link", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scan_type"] == "link"
    assert data["risk_level"] == "Low"
    assert data["risk_score"] <= 39
    assert data["disclaimer"] == MANDATORY_SAFETY_DISCLAIMER


def test_scan_link_auto_prepends_https():
    """Verify that URLs without protocol prefix are normalized and analyzed."""
    payload = {"url": "github.com"}
    response = client.post("/api/v1/scan/link", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scan_type"] == "link"
    assert data["risk_level"] == "Low"


def test_scan_link_suspicious_ip_and_subdomains():
    """Verify that raw IP hosts and excessive subdomains trigger threat indicators."""
    payload = {"url": "http://192.168.1.1/admin/login"}
    response = client.post("/api/v1/scan/link", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert any("IP-Address Hostname" in t for t in data["detected_threats"])
    assert data["risk_score"] >= 40


def test_scan_link_malware_test_domain():
    """Verify Google Safe Browsing test malicious URL match."""
    payload = {"url": "http://malware.testing.google.test/testing/malware/"}
    response = client.post("/api/v1/scan/link", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["risk_level"] == "High"
    assert data["risk_score"] >= 90
    assert any("Google Safe Browsing Test Match" in t for t in data["detected_threats"])


# ==============================================================================
# Module 3: Privacy Policy Simplifier Tests
# ==============================================================================

def test_scan_policy_flags_data_selling_and_biometrics():
    """Verify detection of critical tags (Data Selling, Location, Retention, Biometrics)."""
    payload = {
        "policy_text": (
            "We may collect your biometric data including facial recognition geometry. "
            "We reserve the right to sell your personal data to third-party advertisers "
            "and data brokers. We collect continuous background location and retain your "
            "data indefinitely even after account termination."
        )
    }
    response = client.post("/api/v1/scan/policy", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["scan_type"] == "policy"
    assert len(data["detected_threats"]) >= 3
    assert any("Data Selling" in t for t in data["detected_threats"])
    assert any("Location" in t for t in data["detected_threats"])
    assert any("Biometrics" in t for t in data["detected_threats"])
    assert any("Retention" in t for t in data["detected_threats"])
    assert data["risk_score"] >= 70
    assert data["risk_level"] == "High"


def test_scan_policy_privacy_preserving():
    """Verify that clean, non-intrusive policies receive Low or Medium rating."""
    payload = {
        "policy_text": (
            "We strictly do not track your location. We do not sell your personal data to any "
            "third party. All user logs are permanently erased within 30 days."
        )
    }
    response = client.post("/api/v1/scan/policy", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scan_type"] == "policy"
    assert data["risk_score"] <= 39
    assert data["risk_level"] == "Low"


def test_scan_policy_via_url_success():
    """Verify that submitting a website URL fetches and analyzes the policy text."""
    payload = {"url": "https://example.com"}
    response = client.post("/api/v1/scan/policy", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scan_type"] == "policy"
    assert "source_url" in data and data["source_url"] == "https://example.com"
    assert "policy_analysis" in data
    assert "data_collected" in data["policy_analysis"]


def test_scan_policy_via_policy_text_containing_url():
    """Verify that pasting a URL into the policy_text field is recognized and fetched."""
    payload = {"policy_text": "example.com"}
    response = client.post("/api/v1/scan/policy", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scan_type"] == "policy"
    assert "source_url" in data and "example.com" in data["source_url"]


def test_scan_policy_via_unreachable_url_returns_400():
    """Verify that unreachable website returns clear HTTP 400 with guidance to paste manually."""
    payload = {"url": "https://unreachable-domain-xyz-nonexistent-1234.com"}
    response = client.post("/api/v1/scan/policy", json=payload)
    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "Could not connect" in detail or "paste the policy text manually" in detail


def test_scan_policy_ssrf_protection_blocked():
    """Verify that private IP / localhost requests are blocked for security."""
    payload = {"url": "http://127.0.0.1:8000/secret"}
    response = client.post("/api/v1/scan/policy", json=payload)
    assert response.status_code in (400, 422)
    detail = response.json()["detail"]
    assert "prohibited" in detail.lower() or "valid web address" in detail.lower()


# ==============================================================================
# Module 5: Validation Rules & HTTP Error Handling Tests
# ==============================================================================

def test_edge_case_empty_input_returns_400():
    """Verify empty content triggers HTTP 400 Bad Request."""
    response = client.post("/api/v1/scan/message", json={"content": ""})
    assert response.status_code == 400
    assert response.json()["detail"] == "Please enter text or a URL to analyze."

    response_ws = client.post("/api/v1/scan/message", json={"content": "   \n\t  "})
    assert response_ws.status_code == 400
    assert response_ws.json()["detail"] == "Please enter text or a URL to analyze."


def test_edge_case_invalid_url_returns_422():
    """Verify malformed URL triggers HTTP 422 Unprocessable Entity."""
    response = client.post("/api/v1/scan/link", json={"url": "not-a-valid-url-without-domain"})
    assert response.status_code == 422
    assert response.json()["detail"] == "Please enter a valid web address (e.g., https://example.com)."


def test_edge_case_payload_too_large_returns_413():
    """Verify payloads exceeding 20,000 characters trigger HTTP 413 Payload Too Large."""
    oversized_text = "A" * 20005
    response = client.post("/api/v1/scan/message", json={"content": oversized_text})
    assert response.status_code == 413
    assert response.json()["detail"] == "Payload exceeds maximum character limit of 20,000."

    response_policy = client.post("/api/v1/scan/policy", json={"policy_text": oversized_text})
    assert response_policy.status_code == 413
    assert response_policy.json()["detail"] == "Payload exceeds maximum character limit of 20,000."


def test_edge_case_policy_and_link_empty_input_returns_400():
    """Verify empty input for policy and link triggers 400."""
    res_policy = client.post("/api/v1/scan/policy", json={"policy_text": "   "})
    assert res_policy.status_code == 400
    assert res_policy.json()["detail"] == "Please enter text or a URL to analyze."

    res_link = client.post("/api/v1/scan/link", json={"url": ""})
    assert res_link.status_code == 400
    assert res_link.json()["detail"] == "Please enter text or a URL to analyze."

