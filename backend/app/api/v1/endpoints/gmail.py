import logging
from urllib.parse import quote_plus
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from app.core.config import settings
from app.core.security import get_current_user
from app.models.schemas import (
    UserContext,
    GmailAuthUrlResponse,
    GmailStatusResponse,
    GmailEmailItem,
    GmailAnalyzeRequest,
    ScanResultResponse,
)
from app.services.gmail_service import gmail_service
from app.services.supabase_service import supabase_service
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/gmail", tags=["Gmail Integration"])


@router.get(
    "/auth-url",
    response_model=GmailAuthUrlResponse,
    summary="Get Google OAuth Authorization URL",
)
async def get_google_auth_url(
    current_user: UserContext = Depends(get_current_user),
):
    """
    Generates the Google OAuth 2.0 authorization URL for server-side authorization code flow.
    Embeds the authenticated user ID in a cryptographically signed state token.
    Enforces offline access and consent prompt to ensure refresh token generation.
    """
    auth_url = gmail_service.get_authorization_url(current_user.id)
    return GmailAuthUrlResponse(auth_url=auth_url)


@router.get(
    "/callback",
    summary="Google OAuth 2.0 Callback Endpoint",
    include_in_schema=True,
)
async def google_oauth_callback(
    code: Optional[str] = Query(None, description="Authorization code from Google"),
    state: Optional[str] = Query(None, description="Signed state token binding user session"),
    error: Optional[str] = Query(None, description="Error code if user cancelled or authorization failed"),
):
    """
    Handles Google's OAuth 2.0 authorization callback:
    1. Verifies the signed state parameter and extracts the Supabase user ID.
    2. Exchanges authorization code for refresh & access tokens.
    3. Securely stores refresh token in Supabase database associated with the user ID.
    4. Redirects browser back to frontend Email Safety view with status query parameters.
    """
    frontend_base = settings.FRONTEND_URL.rstrip("/")

    if error:
        logger.warning(f"Google OAuth authorization cancelled or returned error: {error}")
        return RedirectResponse(
            url=f"{frontend_base}/#email?gmail_error={quote_plus(error)}",
            status_code=status.HTTP_302_FOUND,
        )

    if not code or not state:
        return RedirectResponse(
            url=f"{frontend_base}/#email?gmail_error={quote_plus('Missing required code or state parameter.')}",
            status_code=status.HTTP_302_FOUND,
        )

    try:
        user_id = gmail_service.verify_and_extract_state(state)
        result = await gmail_service.exchange_code_for_tokens(code, user_id)
        email = result.get("email", "")
        return RedirectResponse(
            url=f"{frontend_base}/#email?gmail_connected=true&gmail_email={quote_plus(email)}",
            status_code=status.HTTP_302_FOUND,
        )
    except HTTPException as exc:
        logger.error(f"HTTP error during Google OAuth callback: {exc.detail}")
        return RedirectResponse(
            url=f"{frontend_base}/#email?gmail_error={quote_plus(str(exc.detail))}",
            status_code=status.HTTP_302_FOUND,
        )
    except Exception as exc:
        logger.error(f"Unexpected error in Google OAuth callback: {exc}")
        return RedirectResponse(
            url=f"{frontend_base}/#email?gmail_error={quote_plus('Failed to complete Google OAuth authentication.')}",
            status_code=status.HTTP_302_FOUND,
        )


@router.get(
    "/status",
    response_model=GmailStatusResponse,
    summary="Get Gmail Connection Status",
)
async def get_gmail_status(
    current_user: UserContext = Depends(get_current_user),
):
    """
    Checks if the currently authenticated user has an active Gmail integration
    with a stored refresh token in the database.
    """
    conn = await supabase_service.get_gmail_connection(current_user.id)
    if conn and conn.get("refresh_token"):
        return GmailStatusResponse(
            connected=True,
            email=conn.get("email"),
            created_at=conn.get("created_at"),
        )
    return GmailStatusResponse(connected=False, email=None, created_at=None)


@router.get(
    "/emails",
    response_model=List[GmailEmailItem],
    summary="Fetch Recent Inbox Emails via Gmail API",
)
async def fetch_recent_emails(
    max_results: int = Query(5, ge=1, le=20, description="Number of recent emails to retrieve"),
    current_user: UserContext = Depends(get_current_user),
):
    """
    Fetches the user's latest inbox emails using server-side OAuth refresh token renewal.
    Never exposes access or refresh tokens to the client.
    """
    emails = await gmail_service.fetch_recent_emails(current_user.id, max_results=max_results)
    return [GmailEmailItem(**item) for item in emails]


@router.delete(
    "/disconnect",
    summary="Disconnect Gmail Integration",
)
async def disconnect_gmail(
    current_user: UserContext = Depends(get_current_user),
):
    """
    Disconnects Gmail integration for user: revokes OAuth token with Google
    and removes stored credentials from the database.
    """
    success = await gmail_service.disconnect(current_user.id)
    return {
        "status": "success",
        "disconnected": success,
        "message": "Gmail account disconnected successfully.",
    }


@router.post(
    "/analyze",
    response_model=ScanResultResponse,
    summary="Analyze Selected Gmail Email and Record to User History",
)
async def analyze_gmail_email(
    payload: GmailAnalyzeRequest,
    current_user: UserContext = Depends(get_current_user),
):
    """
    Analyzes email body for cyber risks, phishing cues, sender reputation, and PII exposures using Gemini AI.
    Saves scan result to the authenticated user's private scan_history table.
    """
    content = payload.content.strip()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email content cannot be empty.",
        )

    # Prepend sender context if available for richer Gemini threat assessment
    analysis_input = content
    if payload.sender:
        analysis_input = f"Sender: {payload.sender}\nSubject: {payload.subject or '(No Subject)'}\n\n{content}"

    analysis = await gemini_service.analyze_message(analysis_input)

    # Persist directly into authenticated user's scan_history
    preview_text = f"Subject: {payload.subject} | From: {payload.sender}" if payload.subject else content
    record = {
        "user_id": current_user.id,
        "scan_type": "message",
        "input_preview": preview_text[:200],
        "risk_level": analysis["risk_level"].value if hasattr(analysis["risk_level"], "value") else str(analysis["risk_level"]),
        "risk_score": analysis["risk_score"],
        "summary": analysis["summary"],
        "detected_threats": analysis.get("detected_threats", []),
        "recommendations": analysis.get("recommendations", []),
    }
    await supabase_service.save_scan_history(record)

    return ScanResultResponse(**analysis)
