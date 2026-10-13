from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field


class ProfileDB(BaseModel):
    id: str
    email: str
    role: str = "individual"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ScanHistoryDB(BaseModel):
    id: Optional[str] = None
    user_id: str
    scan_type: str
    input_preview: str
    risk_level: str
    risk_score: int
    summary: str
    detected_threats: List[Any] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    created_at: Optional[datetime] = None


class DataRequestLetterDB(BaseModel):
    id: Optional[str] = None
    user_id: str
    company_name: str
    letter_type: str
    recipient_email: Optional[str] = None
    content: str
    created_at: Optional[datetime] = None
