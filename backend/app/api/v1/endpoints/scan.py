import time
from collections import defaultdict
from typing import Optional, Dict, List
from fastapi import APIRouter, Depends, BackgroundTasks, Request
from app.models.schemas import (
    ScanType,
    MessageScanRequest,
    LinkScanRequest,
    PolicyScanRequest,
    ScanResultResponse,
)
from app.core.security import get_current_user_id
from app.core.exceptions import (
    InvalidInputException,
    PayloadTooLargeException,
    RateLimitException,
    ServiceUnavailableException,
)
from app.services.gemini_service import gemini_service
from app.services.safe_browsing_service import safe_browsing_service
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/scan", tags=["Threat Scanning"])

MAX_PAYLOAD_LENGTH = 20000
RATE_LIMIT_WINDOW_SECONDS = 60
RATE_LIMIT_MAX_REQUESTS = 30

# In-memory sliding window rate tracker: ip -> list of timestamps
_rate_limit_records: Dict[str, List[float]] = defaultdict(list)


def check_rate_limit(request: Request):
    """
    In-memory rate limiter per client IP.
    Enforces a maximum of 30 requests per 60 seconds.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    timestamps = _rate_limit_records[client_ip]

    # Purge timestamps outside the sliding window
    _rate_limit_records[client_ip] = [t for t in timestamps if now - t < RATE_LIMIT_WINDOW_SECONDS]

    if len(_rate_limit_records[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        raise RateLimitException("Request limit reached. Please wait a moment.")

    _rate_limit_records[client_ip].append(now)


def validate_input_length(text: str):
    """Validates input length boundaries as per Phase 1 requirements."""
    if not text or not text.strip():
        raise InvalidInputException("Please enter text or a URL to analyze.")
    if len(text) > MAX_PAYLOAD_LENGTH:
        raise PayloadTooLargeException("Payload exceeds maximum character limit of 20,000.")


async def _record_scan_if_authenticated(
    user_id: Optional[str],
    scan_type: str,
    preview: str,
    result: dict,
):
    """Background helper to log scan history if a user is authenticated."""
    if user_id:
        record = {
            "user_id": user_id,
            "scan_type": scan_type,
            "input_preview": preview[:200],
            "risk_level": result["risk_level"].value if hasattr(result["risk_level"], "value") else str(result["risk_level"]),
            "risk_score": result["risk_score"],
            "summary": result["summary"],
            "detected_threats": result.get("detected_threats", []),
            "recommendations": result.get("recommendations", []),
        }
        await supabase_service.save_scan_history(record)


# ------------------------------------------------------------------------------
# Module 1: Scan Message / Email
# ------------------------------------------------------------------------------
@router.post(
    "/message",
    response_model=ScanResultResponse,
    summary="Scan Message, Email, or SMS",
    dependencies=[Depends(check_rate_limit)],
)
async def scan_message(
    payload: MessageScanRequest,
    background_tasks: BackgroundTasks,
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """
    Scans incoming message, email, or SMS content for phishing, impersonation,
    urgency tactics, and sensitive PII exposures.
    """
    validate_input_length(payload.content)

    try:
        analysis = await gemini_service.analyze_message(payload.content)
    except Exception as exc:
        raise ServiceUnavailableException("Analysis service is temporarily unavailable. Please try again shortly.")

    background_tasks.add_task(
        _record_scan_if_authenticated,
        user_id,
        "message",
        payload.content,
        analysis,
    )
    return ScanResultResponse(**analysis)


# ------------------------------------------------------------------------------
# Module 2: Scan Link / URL
# ------------------------------------------------------------------------------
@router.post(
    "/link",
    response_model=ScanResultResponse,
    summary="Scan Link or URL",
    dependencies=[Depends(check_rate_limit)],
)
async def scan_link(
    payload: LinkScanRequest,
    background_tasks: BackgroundTasks,
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """
    Scans target web address with Google Safe Browsing API v4
    and pre-lookup heuristic analyzers for malware, phishing, and IP hosts.
    """
    validate_input_length(payload.url)

    try:
        analysis = await safe_browsing_service.check_url(payload.url)
    except (InvalidInputException, PayloadTooLargeException):
        raise
    except Exception as exc:
        if "Invalid" in str(type(exc)):
            raise
        raise ServiceUnavailableException("Analysis service is temporarily unavailable. Please try again shortly.")

    background_tasks.add_task(
        _record_scan_if_authenticated,
        user_id,
        "link",
        payload.url,
        analysis,
    )
    return ScanResultResponse(**analysis)


# ------------------------------------------------------------------------------
# Module 3: Scan Privacy Policy
# ------------------------------------------------------------------------------
@router.post(
    "/policy",
    response_model=ScanResultResponse,
    summary="Scan Terms of Service or Privacy Policy",
    dependencies=[Depends(check_rate_limit)],
)
async def scan_policy(
    payload: PolicyScanRequest,
    background_tasks: BackgroundTasks,
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """
    Simplifies dense privacy policies and terms of service into plain English bullet points,
    flagging critical tags: Data Selling, Telemetry, Retention Limits, Biometrics, and Deletion.
    """
    validate_input_length(payload.policy_text)

    try:
        analysis = await gemini_service.simplify_policy(payload.policy_text)
    except Exception as exc:
        raise ServiceUnavailableException("Analysis service is temporarily unavailable. Please try again shortly.")

    background_tasks.add_task(
        _record_scan_if_authenticated,
        user_id,
        "policy",
        payload.policy_text,
        analysis,
    )
    return ScanResultResponse(**analysis)
