from typing import Optional
from fastapi import APIRouter, Depends, BackgroundTasks
from app.models.schemas import (
    ScanType,
    MessageScanRequest,
    LinkScanRequest,
    PolicyScanRequest,
    ScanResultResponse,
)
from app.core.security import get_current_user_id
from app.services.gemini_service import gemini_service
from app.services.safe_browsing_service import safe_browsing_service
from app.services.supabase_service import supabase_service

router = APIRouter(prefix="/scan", tags=["Threat Scanning"])


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
            "risk_level": result["risk_level"],
            "risk_score": result["risk_score"],
            "summary": result["summary"],
            "detected_threats": result.get("detected_threats", []),
            "recommendations": result.get("recommendations", []),
        }
        await supabase_service.save_scan_history(record)


@router.post("/message", response_model=ScanResultResponse)
async def scan_message(
    payload: MessageScanRequest,
    background_tasks: BackgroundTasks,
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """Scan SMS, emails, or raw text for phishing and credential leaks."""
    analysis = await gemini_service.analyze_message(payload.content)
    background_tasks.add_task(
        _record_scan_if_authenticated,
        user_id,
        "message",
        payload.content,
        analysis,
    )
    return ScanResultResponse(scan_type=ScanType.MESSAGE, **analysis)


@router.post("/link", response_model=ScanResultResponse)
async def scan_link(
    payload: LinkScanRequest,
    background_tasks: BackgroundTasks,
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """Scan a target URL with Google Safe Browsing threat databases."""
    analysis = await safe_browsing_service.check_url(payload.url)
    background_tasks.add_task(
        _record_scan_if_authenticated,
        user_id,
        "link",
        payload.url,
        analysis,
    )
    return ScanResultResponse(scan_type=ScanType.LINK, **analysis)


@router.post("/policy", response_model=ScanResultResponse)
async def scan_policy(
    payload: PolicyScanRequest,
    background_tasks: BackgroundTasks,
    user_id: Optional[str] = Depends(get_current_user_id),
):
    """Simplify and evaluate legal terms / privacy policies using Gemini AI."""
    analysis = await gemini_service.simplify_policy(payload.policy_text)
    background_tasks.add_task(
        _record_scan_if_authenticated,
        user_id,
        "policy",
        payload.policy_text,
        analysis,
    )
    return ScanResultResponse(scan_type=ScanType.POLICY, **analysis)
