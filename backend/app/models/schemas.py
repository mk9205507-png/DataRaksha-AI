from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


# --- Enums ---

class ScanType(str, Enum):
    MESSAGE = "message"
    LINK = "link"
    POLICY = "policy"


class RiskLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class LetterType(str, Enum):
    ACCESS = "access"
    DELETION = "deletion"
    CONSENT_WITHDRAWAL = "consent_withdrawal"


# --- Health Check ---

class HealthResponse(BaseModel):
    status: str = Field(default="ok", examples=["ok"])
    app: str = Field(default="DataRaksha AI", examples=["DataRaksha AI"])
    version: str = Field(default="1.0.0", examples=["1.0.0"])


# --- Threat & Scan Schemas ---

class ThreatItem(BaseModel):
    category: str = Field(..., examples=["Phishing / Credential Harvesting"])
    description: str = Field(..., examples=["Deceptive urgent CTA detected requesting password reset."])
    severity: RiskLevel = Field(default=RiskLevel.MEDIUM)


class MessageScanRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=50000, description="SMS, email, or message body to analyze")


class LinkScanRequest(BaseModel):
    url: str = Field(..., min_length=3, max_length=2048, description="Target URL link to evaluate for threats")


class PolicyScanRequest(BaseModel):
    policy_text: str = Field(..., min_length=1, max_length=200000, description="Raw text of Terms of Service or Privacy Policy")


class ScanResultResponse(BaseModel):
    scan_type: ScanType
    risk_level: RiskLevel
    risk_score: int = Field(..., ge=0, le=100, description="Calculated threat rating between 0 and 100")
    summary: str
    detected_threats: List[ThreatItem] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    disclaimer: str = Field(
        default="No scan can guarantee 100% safety. Always exercise personal caution online.",
    )


# --- Letter Generation Schemas ---

class LetterGenerateRequest(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    letter_type: LetterType
    recipient_email: Optional[str] = None
    user_full_name: str = Field(..., min_length=1, max_length=120)
    user_email: str = Field(..., min_length=3, max_length=120)
    custom_details: Optional[str] = None


class LetterResponse(BaseModel):
    letter_type: LetterType
    company_name: str
    content: str
    recipient_email: Optional[str] = None


# --- History Schemas ---

class ScanHistoryItem(BaseModel):
    id: str
    scan_type: ScanType
    input_preview: str
    risk_level: RiskLevel
    risk_score: int
    summary: str
    created_at: str
