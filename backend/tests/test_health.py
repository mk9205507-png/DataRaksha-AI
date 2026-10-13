from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check_returns_200():
    """Verify that /health responds with HTTP 200 and expected payload."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "DataRaksha AI"
    assert data["version"] == "1.0.0"


def test_admin_metrics_endpoint():
    """Verify that /api/v1/admin/metrics responds properly."""
    response = client.get("/api/v1/admin/metrics")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "operational"
