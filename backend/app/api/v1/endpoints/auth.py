from fastapi import APIRouter, Depends
from app.models.schemas import UserProfileResponse, UserContext
from app.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["User Authentication & Identity"])


@router.get(
    "/me",
    response_model=UserProfileResponse,
    summary="Get Current User Profile",
)
async def get_my_profile(
    current_user: UserContext = Depends(get_current_user),
):
    """
    Returns the identity, email, and role permissions of the currently authenticated user.
    Requires Bearer JWT token in Authorization header.
    """
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at,
    )
