from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, model_validator


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


MANDATORY_SAFETY_DISCLAIMER = (
    "No obvious risks were detected; however, this does not guarantee the content "
    "is completely safe. Always exercise caution when sharing sensitive information online."
)


# --- Threat & Scan Schemas ---

class ThreatItem(BaseModel):
    category: str = Field(..., examples=["Phishing / Credential Harvesting"])
    description: str = Field(..., examples=["Deceptive urgent CTA detected requesting password reset."])
    severity: RiskLevel = Field(default=RiskLevel.MEDIUM)


class MessageScanRequest(BaseModel):
    content: str = Field(..., description="SMS, email, or message body to analyze")

    model_config = {
        "json_schema_extra": {
            "example": {
                "content": "URGENT: Your account has been temporarily restricted. Verify your login credentials immediately at: https://secure-account-update.xyz to prevent permanent suspension."
            }
        }
    }


class LinkScanRequest(BaseModel):
    url: str = Field(..., description="Target URL link to evaluate for threats")

    model_config = {
        "json_schema_extra": {
            "example": {
                "url": "https://testsafebrowsing.appspot.com/s/phishing.html"
            }
        }
    }


class PolicyScanRequest(BaseModel):
    policy_text: Optional[str] = Field(None, description="Raw text of Terms of Service or Privacy Policy")
    url: Optional[str] = Field(None, description="Website URL to fetch and evaluate privacy policy from")

    model_config = {
        "json_schema_extra": {
            "example": {
                "policy_text": "We reserve the right to collect continuous background telemetry, device sensors, and sell personal identifiers to third-party data brokers indefinitely.",
                "url": "https://example.com/privacy",
            }
        }
    }


class PolicyAnalysisDetails(BaseModel):
    data_collected: List[str] = Field(default_factory=list, description="Categories of personal or device data collected")
    data_usage: List[str] = Field(default_factory=list, description="How collected information is utilized")
    third_party_sharing: List[str] = Field(default_factory=list, description="Third-party sharing and advertising monetization")
    data_retention: Optional[str] = Field(None, description="Retention periods and data purging guidelines")
    user_rights: List[str] = Field(default_factory=list, description="Statutory user rights and opt-out mechanisms")


class ScanResultResponse(BaseModel):
    scan_type: ScanType
    risk_level: RiskLevel
    risk_score: int = Field(..., ge=0, le=100, description="Calculated threat rating between 0 and 100")
    summary: str
    detected_threats: List[str] = Field(default_factory=list)
    exposed_pii: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    disclaimer: str = Field(default=MANDATORY_SAFETY_DISCLAIMER)
    # Extended fields for rich privacy policy breakdown:
    policy_analysis: Optional[PolicyAnalysisDetails] = None
    source_url: Optional[str] = None
    extracted_preview: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "scan_type": "message",
                "risk_level": "High",
                "risk_score": 85,
                "summary": "This message exhibits strong indicators of a malicious phishing scam attempting to harvest credentials.",
                "detected_threats": [
                    "Urgent pressure tactic designed to prompt immediate action",
                    "Financial or official institution impersonation pattern detected",
                    "Deceptive call-to-action attempting credential harvesting"
                ],
                "exposed_pii": [],
                "recommendations": [
                    "Do not click on links, download attachments, or call numbers from this message.",
                    "Report this message or URL to your IT security administrator or cybercrime helpline."
                ],
                "disclaimer": MANDATORY_SAFETY_DISCLAIMER
            }
        }
    }


# --- Letter Generation Schemas ---

class LetterGenerateRequest(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    letter_type: LetterType
    recipient_email: Optional[str] = None
    user_full_name: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = ""
    account_identifier: Optional[str] = None
    account_id: Optional[str] = None
    framework: Optional[str] = "DPDP"
    custom_notes: Optional[str] = None
    custom_details: Optional[str] = None

    @model_validator(mode="after")
    def populate_fields(self):
        if not self.user_full_name and self.user_name:
            self.user_full_name = self.user_name
        if not self.user_full_name:
            self.user_full_name = "User"
        if not self.account_identifier and self.account_id:
            self.account_identifier = self.account_id
        if not self.account_id and self.account_identifier:
            self.account_id = self.account_identifier
        if not self.custom_notes and self.custom_details:
            self.custom_notes = self.custom_details
        if not self.custom_details and self.custom_notes:
            self.custom_details = self.custom_notes
        return self


class LetterResponse(BaseModel):
    id: Optional[str] = None
    letter_type: LetterType
    framework: Optional[str] = "DPDP"
    company_name: str
    subject: Optional[str] = None
    body: Optional[str] = None
    content: str
    recipient_email: Optional[str] = None
    created_at: Optional[str] = None


# --- History Schemas ---

class ScanHistoryItem(BaseModel):
    id: str
    scan_type: ScanType
    input_preview: str
    risk_level: RiskLevel
    risk_score: int
    summary: str
    created_at: str


class ScanHistoryListResponse(BaseModel):
    total_records: int
    page: int
    limit: int
    records: List[ScanHistoryItem]


# --- User & Auth Schemas (Phase 2) ---

class UserRole(str, Enum):
    INDIVIDUAL = "individual"
    ADMIN = "admin"


class UserContext(BaseModel):
    id: str
    email: str
    role: str = "individual"
    created_at: Optional[str] = None

    @property
    def user_id(self) -> str:
        return self.id


class UserProfileResponse(BaseModel):
    id: str
    email: str
    role: str = "individual"
    created_at: Optional[str] = None
    display_name: Optional[str] = None
    last_sign_in_at: Optional[str] = None
    status: Optional[str] = "active"


class UserSessionRecordRequest(BaseModel):
    user_id: Optional[str] = Field(None, description="User ID from auth provider")
    email: str = Field(..., description="User email address")
    display_name: Optional[str] = Field(None, description="User display name or full name")
    role: Optional[str] = Field(None, description="User role: admin or individual")
    last_sign_in_at: Optional[str] = Field(None, description="Timestamp when user signed in")



class LoginRequest(BaseModel):
    email: str = Field(..., description="User registered email address")
    password: str = Field(..., min_length=1, description="Account password")


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="User full legal name")
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=8, description="Password with minimum 8 characters")
    role: Optional[str] = Field(default="individual", description="User role: individual or admin")


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfileResponse
    message: Optional[str] = "Authentication successful"


# --- Gmail OAuth & Integration Schemas ---

class GmailAuthUrlResponse(BaseModel):
    auth_url: str = Field(..., description="Google OAuth 2.0 authorization URL for consent flow")


class GmailStatusResponse(BaseModel):
    connected: bool = Field(..., description="True if user has an active Gmail integration")
    email: Optional[str] = Field(None, description="Connected Gmail address")
    created_at: Optional[str] = Field(None, description="Timestamp when Gmail was connected")


class GmailEmailItem(BaseModel):
    id: str
    thread_id: Optional[str] = None
    subject: str
    sender: str
    date: str
    snippet: str
    content: str


class GmailAnalyzeRequest(BaseModel):
    content: str = Field(..., description="Email body to scan for phishing/threats")
    sender: Optional[str] = Field(None, description="Sender address")
    subject: Optional[str] = Field(None, description="Email subject line")


