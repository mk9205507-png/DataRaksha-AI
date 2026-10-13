from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user_id
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/history", tags=["Scan History"])


@router.get("", response_model=List[dict])
async def get_history(user_id: Optional[str] = Depends(get_current_user_id)):
    """Retrieve scan history for authenticated user."""
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to view scan history.",
        )
    return await supabase_service.get_user_scans(user_id)
