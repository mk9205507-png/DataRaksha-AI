from fastapi import APIRouter, Depends
from app.models.schemas import UserContext
from app.core.security import require_admin

router = APIRouter(prefix="/admin", tags=["Admin Analytics"])


@router.get(
    "/metrics",
    summary="Get System Threat Metrics (Admin Only)",
)
async def get_metrics(
    admin_user: UserContext = Depends(require_admin),
):
    """
    Retrieve high-level system threat statistics and engine status.
    Strictly restricted to users with the 'admin' role.
    """
    return {
        "status": "operational",
        "total_scans_today": 0,
        "high_risk_flagged": 0,
        "safe_browsing_status": "connected",
        "gemini_engine_status": "connected",
        "requested_by": admin_user.email,
    }
