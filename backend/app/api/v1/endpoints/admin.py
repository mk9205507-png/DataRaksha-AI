from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["Admin Analytics"])


@router.get("/metrics")
async def get_metrics():
    """Retrieve high-level system threat statistics and engine status."""
    return {
        "status": "operational",
        "total_scans_today": 0,
        "high_risk_flagged": 0,
        "safe_browsing_status": "connected",
        "gemini_engine_status": "connected",
    }
