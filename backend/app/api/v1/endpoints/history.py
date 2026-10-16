from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.core.security import get_current_user_id
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/history", tags=["Scan History"])


@router.get("", response_model=Union[dict, List[dict]])
async def get_history(
    page: Optional[int] = Query(None, ge=1, description="Page number for pagination"),
    limit: int = Query(10, ge=1, le=50, description="Items per page"),
    scan_type: Optional[str] = Query(None, description="Filter by scan type: message | link | policy"),
    risk_level: Optional[str] = Query(None, description="Filter by risk severity: Low | Medium | High"),
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """
    Retrieve scan history for authenticated user.
    Supports filtering by scan_type and risk_level, and optional pagination.
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view scan history.",
        )

    res = await supabase_service.get_user_scans(
        user_id=user_id,
        scan_type=scan_type,
        risk_level=risk_level,
        page=page or 1,
        limit=limit,
    )

    if page is not None:
        return res
    return res["records"]


@router.delete("/{record_id}")
async def delete_scan_record(
    record_id: str,
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """Delete a single scan history record for authenticated user."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to delete scan history.",
        )
    success = await supabase_service.delete_user_scan(user_id=user_id, scan_id=record_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scan record {record_id} not found or does not belong to user.",
        )
    return {
        "status": "success",
        "deleted_id": record_id,
        "success": True,
        "message": f"Scan record {record_id} successfully deleted.",
    }


@router.delete("")
async def clear_all_history(
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """Clear all scan history records for the authenticated user."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to clear scan history.",
        )
    deleted_count = await supabase_service.clear_user_scans(user_id=user_id)
    return {
        "status": "success",
        "deleted_count": deleted_count,
        "message": "All scan history records successfully cleared.",
    }
