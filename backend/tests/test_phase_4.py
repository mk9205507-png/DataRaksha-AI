import pytest
from fastapi.testclient import TestClient
from main import app
from app.api.v1.endpoints.scan import _rate_limit_records, RATE_LIMIT_MAX_REQUESTS

client = TestClient(app)

MANDATORY_DISCLAIMER = (
    "No obvious risks were detected; however, this does not guarantee the content "
    "is completely safe. Always exercise caution when sharing sensitive information online."
)


# ==============================================================================
# Module 1: Response Schema Harmonization for ResultCard Contract
# ==============================================================================

def test_message_scan_schema_harmonization():
    """Verify /scan/message returns the standardized schema contract for ResultCard."""
    response = client.post(
        "/api/v1/scan/message",
        json={"content": "Your bank account has been locked. Verify immediately at https://fake-bank.xyz"},
    )
    assert response.status_code == 200
    data = response.json()

    # Schema key assertions
    assert data["scan_type"] == "message"
    assert data["risk_level"] in ["Low", "Medium", "High"]
    assert isinstance(data["risk_score"], int)
    assert 0 <= data["risk_score"] <= 100
    assert isinstance(data["summary"], str) and len(data["summary"]) > 0
    assert isinstance(data["detected_threats"], list)
    assert isinstance(data["exposed_pii"], list)
    assert isinstance(data["recommendations"], list)
    assert data["disclaimer"] == MANDATORY_DISCLAIMER


def test_link_scan_schema_harmonization():
    """Verify /scan/link returns the standardized schema contract for ResultCard."""
    response = client.post(
        "/api/v1/scan/link",
        json={"url": "https://testsafebrowsing.appspot.com/s/phishing.html"},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["scan_type"] == "link"
    assert data["risk_level"] in ["Low", "Medium", "High"]
    assert isinstance(data["risk_score"], int)
    assert 0 <= data["risk_score"] <= 100
    assert isinstance(data["summary"], str) and len(data["summary"]) > 0
    assert isinstance(data["detected_threats"], list)
    assert isinstance(data["exposed_pii"], list)
    assert isinstance(data["recommendations"], list)
    assert data["disclaimer"] == MANDATORY_DISCLAIMER


def test_policy_scan_schema_harmonization():
    """Verify /scan/policy returns the standardized schema contract for ResultCard."""
    response = client.post(
        "/api/v1/scan/policy",
        json={"policy_text": "We collect user emails and retain your data as long as necessary. We may sell data to advertisers."},
    )
    assert response.status_code == 200
    data = response.json()

    assert data["scan_type"] == "policy"
    assert data["risk_level"] in ["Low", "Medium", "High"]
    assert isinstance(data["risk_score"], int)
    assert 0 <= data["risk_score"] <= 100
    assert isinstance(data["summary"], str) and len(data["summary"]) > 0
    assert isinstance(data["detected_threats"], list)
    assert isinstance(data["exposed_pii"], list)
    assert isinstance(data["recommendations"], list)
    assert data["disclaimer"] == MANDATORY_DISCLAIMER


# ==============================================================================
# Module 2: Request Sanitization & Size Limit Enforcement (413 & 422)
# ==============================================================================

def test_payload_exceeding_20000_chars_returns_413():
    """Payloads exceeding 20,000 characters must return HTTP 413 across all endpoints."""
    large_payload = "A" * 20001

    # Test /message
    res_msg = client.post("/api/v1/scan/message", json={"content": large_payload})
    assert res_msg.status_code == 413
    assert "20,000" in res_msg.json()["detail"]

    # Test /link
    res_link = client.post("/api/v1/scan/link", json={"url": f"https://example.com/{large_payload}"})
    assert res_link.status_code == 413
    assert "20,000" in res_link.json()["detail"]

    # Test /policy
    res_policy = client.post("/api/v1/scan/policy", json={"policy_text": large_payload})
    assert res_policy.status_code == 413
    assert "20,000" in res_policy.json()["detail"]


def test_url_normalization_whitespace_and_auto_prepend():
    """URLs with whitespace or missing protocol should normalize and succeed."""
    # Whitespace stripping
    res1 = client.post("/api/v1/scan/link", json={"url": "   https://example.com   "})
    assert res1.status_code == 200
    assert res1.json()["scan_type"] == "link"

    # Auto-prepend https://
    res2 = client.post("/api/v1/scan/link", json={"url": "example.org/path?query=1"})
    assert res2.status_code == 200
    assert res2.json()["scan_type"] == "link"


@pytest.mark.parametrize(
    "invalid_url",
    [
        "not_a_valid_url",
        "https://",
        "ftp://files.example.com",
        "javascript:alert(1)",
        "https://.com",
        "https://example..com",
        "https://invalid",
    ],
)
def test_malformed_url_syntax_returns_422(invalid_url):
    """Malformed or non-HTTP/HTTPS URLs must return HTTP 422 before external API calls."""
    response = client.post("/api/v1/scan/link", json={"url": invalid_url})
    assert response.status_code == 422
    assert "valid web address" in response.json()["detail"].lower()


# ==============================================================================
# Module 3: Sliding-Window Rate Limiting & Retry-After Header (429)
# ==============================================================================

from unittest.mock import patch, AsyncMock

DUMMY_ANALYSIS = {
    "scan_type": "message",
    "risk_level": "Low",
    "risk_score": 10,
    "summary": "Mock analysis summary for rate limit testing.",
    "detected_threats": [],
    "exposed_pii": [],
    "recommendations": ["No risks detected."],
    "disclaimer": MANDATORY_DISCLAIMER,
}


def test_rate_limiter_exceeding_threshold_returns_429_with_retry_after():
    """Verify that exceeding RATE_LIMIT_MAX_REQUESTS returns HTTP 429 and Retry-After header."""
    _rate_limit_records.clear()

    with patch("app.api.v1.endpoints.scan.gemini_service.analyze_message", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.return_value = DUMMY_ANALYSIS

        # Exhaust the quota
        for i in range(RATE_LIMIT_MAX_REQUESTS):
            res = client.post("/api/v1/scan/message", json={"content": f"Test message {i}"})
            assert res.status_code == 200

        # 31st request should be throttled
        throttled = client.post("/api/v1/scan/message", json={"content": "Should be throttled"})
        assert throttled.status_code == 429
        assert "Retry-After" in throttled.headers
        retry_after = int(throttled.headers["Retry-After"])
        assert 1 <= retry_after <= 60
        assert "Request limit reached" in throttled.json()["detail"]


def test_rate_limiter_isolated_by_authorization_token():
    """Verify that clients with distinct auth tokens have independent rate limit buckets."""
    _rate_limit_records.clear()

    user_token_a = "Bearer demo_jwt_token_user_a"
    user_token_b = "Bearer demo_jwt_token_user_b"

    with patch("app.api.v1.endpoints.scan.gemini_service.analyze_message", new_callable=AsyncMock) as mock_analyze:
        mock_analyze.return_value = DUMMY_ANALYSIS

        # Exhaust user A's quota
        for i in range(RATE_LIMIT_MAX_REQUESTS):
            res = client.post(
                "/api/v1/scan/message",
                json={"content": f"User A test message {i}"},
                headers={"Authorization": user_token_a},
            )
            assert res.status_code == 200

        # User A should be throttled
        res_a_blocked = client.post(
            "/api/v1/scan/message",
            json={"content": "User A throttled message"},
            headers={"Authorization": user_token_a},
        )
        assert res_a_blocked.status_code == 429

        # User B should still be allowed under their own token bucket
        res_b_ok = client.post(
            "/api/v1/scan/message",
            json={"content": "User B independent message"},
            headers={"Authorization": user_token_b},
        )
        assert res_b_ok.status_code == 200


# ==============================================================================
# Module 4: CORS Configuration & OpenAPI Documentation Compliance
# ==============================================================================

def test_cors_preflight_for_frontend_dev_origins():
    """Ensure OPTIONS preflight allows localhost:5173 and localhost:3000."""
    headers_vite = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
    }
    response_vite = client.options("/api/v1/scan/message", headers=headers_vite)
    assert response_vite.status_code == 200
    assert response_vite.headers["access-control-allow-origin"] == "http://localhost:5173"
    assert response_vite.headers["access-control-allow-credentials"] == "true"

    headers_cra = {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type, Authorization",
    }
    response_cra = client.options("/api/v1/scan/message", headers=headers_cra)
    assert response_cra.status_code == 200
    assert response_cra.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_swagger_and_openapi_schemas_contain_phase4_examples():
    """Verify /docs returns 200 and /openapi.json contains documentation and examples."""
    docs_res = client.get("/docs")
    assert docs_res.status_code == 200

    openapi_res = client.get("/openapi.json")
    assert openapi_res.status_code == 200
    openapi = openapi_res.json()

    # Verify paths exist
    assert "/api/v1/scan/message" in openapi["paths"]
    assert "/api/v1/scan/link" in openapi["paths"]
    assert "/api/v1/scan/policy" in openapi["paths"]

    # Verify ScanResultResponse schema definition
    schemas = openapi["components"]["schemas"]
    assert "ScanResultResponse" in schemas
    scan_schema = schemas["ScanResultResponse"]
    assert "properties" in scan_schema
    for prop in ["scan_type", "risk_level", "risk_score", "summary", "detected_threats", "exposed_pii", "recommendations", "disclaimer"]:
        assert prop in scan_schema["properties"]
