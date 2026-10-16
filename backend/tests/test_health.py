import jwt
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

SECRET = "test-secret-key-at-least-32-bytes-long!!"
ADMIN_TOKEN = jwt.encode(
    {"sub": "admin-test-id", "email": "admin@dataraksha.ai", "role": "admin"},
    SECRET,
    algorithm="HS256",
)


def test_health_check_returns_200():
    """Verify that /health responds with HTTP 200 and expected payload."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "DataRaksha AI"
    assert data["version"] == "1.0.0"


def test_admin_metrics_endpoint_authorized():
    """Verify that /api/v1/admin/metrics responds properly with admin token."""
    response = client.get(
        "/api/v1/admin/metrics",
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
    assert data["requested_by"] == "admin@dataraksha.ai"


def test_admin_metrics_endpoint_unauthorized():
    """Verify that /api/v1/admin/metrics rejects unauthenticated requests with 401."""
    response = client.get("/api/v1/admin/metrics")
    assert response.status_code == 401

