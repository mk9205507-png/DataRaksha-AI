import pytest
from app.api.v1.endpoints.scan import _rate_limit_records


@pytest.fixture(autouse=True)
def reset_rate_limiter():
    """Reset the in-memory rate limit records before each test to prevent cross-test throttling."""
    _rate_limit_records.clear()
    yield
    _rate_limit_records.clear()
