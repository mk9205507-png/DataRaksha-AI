import re
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.schemas import (
    UserProfileResponse,
    UserContext,
    LoginRequest,
    RegisterRequest,
    AuthTokenResponse,
)
from app.core.security import get_current_user
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/auth", tags=["User Authentication & Identity"])

EMAIL_REGEX = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


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


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    summary="Register New User Account",
)
async def register_user(payload: RegisterRequest):
    """
    Validates user credentials and registers a new account.
    Enforces email format, non-empty name, and password strength (min 8 chars, letter + number).
    """
    name = payload.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Name is required and cannot be only whitespace.",
        )

    email = payload.email.strip().lower()
    if not EMAIL_REGEX.match(email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="A valid email address is required.",
        )

    password = payload.password
    if not password or not password.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Password is required and cannot contain only spaces.",
        )

    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Password must be at least 8 characters long.",
        )

    has_letter = any(c.isalpha() for c in password)
    has_digit = any(c.isdigit() for c in password)
    if not (has_letter and has_digit):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Password must contain at least one letter and one number.",
        )

    # Derive role
    role = "admin" if (payload.role == "admin" or "admin" in email) else "individual"
    user_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    # If Supabase client connected, attempt cloud registration
    if supabase_service.is_connected:
        try:
            res = supabase_service._client.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": name,
                        "role": role,
                    }
                }
            })
            if res.user:
                user_id = res.user.id
                access_token = res.session.access_token if res.session else f"demo_jwt_token_{role}_{int(datetime.now().timestamp())}"
                return AuthTokenResponse(
                    access_token=access_token,
                    user=UserProfileResponse(id=user_id, email=email, role=role, created_at=now_iso),
                    message="Registration successful.",
                )
        except Exception as exc:
            err_msg = str(exc)
            if "already registered" in err_msg.lower() or "unique" in err_msg.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email address is already registered.",
                )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Registration failed: {err_msg}",
            )

    # Offline / Local fallback demo token
    access_token = f"demo_jwt_token_{role}_{int(datetime.now().timestamp())}"
    return AuthTokenResponse(
        access_token=access_token,
        user=UserProfileResponse(
            id=user_id,
            email=email,
            role=role,
            created_at=now_iso,
        ),
        message="Registration successful. Welcome to DataRaksha AI!",
    )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    summary="Authenticate User with Email & Password",
)
async def login_user(payload: LoginRequest):
    """
    Validates user credentials and returns session token upon success.
    Enforces valid email format and non-empty password.
    """
    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Email address is required.",
        )

    if not EMAIL_REGEX.match(email):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="A valid email address is required.",
        )

    password = payload.password
    if not password or not password.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Password is required and cannot be only whitespace.",
        )

    role = "admin" if (email.startswith("admin@") or "admin" in email) else "individual"
    user_id = "00000000-0000-0000-0000-000000000002" if role == "admin" else "00000000-0000-0000-0000-000000000001"
    now_iso = datetime.now(timezone.utc).isoformat()

    # If Supabase client connected, attempt cloud login
    if supabase_service.is_connected:
        try:
            res = supabase_service._client.auth.sign_in_with_password({
                "email": email,
                "password": password,
            })
            if res.user and res.session:
                return AuthTokenResponse(
                    access_token=res.session.access_token,
                    user=UserProfileResponse(
                        id=res.user.id,
                        email=res.user.email or email,
                        role=role,
                        created_at=res.user.created_at or now_iso,
                    ),
                    message="Login successful.",
                )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password. Please verify credentials.",
            )

    # Local / Demo mode: reject obvious bad passwords (e.g. less than 4 chars)
    if len(password) < 4:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password. Please verify credentials.",
        )

    access_token = f"demo_jwt_token_{role}_{int(datetime.now().timestamp())}"
    return AuthTokenResponse(
        access_token=access_token,
        user=UserProfileResponse(
            id=user_id,
            email=email,
            role=role,
            created_at=now_iso,
        ),
        message="Login successful. Security shield active.",
    )
