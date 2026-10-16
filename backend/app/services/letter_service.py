import uuid
from datetime import datetime, timezone
from typing import Dict, Any
from app.models.schemas import LetterType, LetterGenerateRequest


class LetterService:
    """Service to format legal data access, deletion, and consent withdrawal letters under DPDP / GDPR."""

    @staticmethod
    def generate_letter(req: LetterGenerateRequest) -> Dict[str, Any]:
        letter_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()
        today_str = datetime.now(timezone.utc).strftime("%B %d, %Y")
        framework_name = (req.framework or "DPDP").upper()

        if framework_name == "GDPR":
            legal_framework_text = "General Data Protection Regulation (GDPR Article 17)"
            sar_framework_text = "General Data Protection Regulation (GDPR Article 15)"
            consent_framework_text = "General Data Protection Regulation (GDPR Article 7(3))"
            law_title = "GDPR"
        else:
            legal_framework_text = "Digital Personal Data Protection Act (DPDP Act 2023 Section 12)"
            sar_framework_text = "Digital Personal Data Protection Act (DPDP Act 2023 Section 11)"
            consent_framework_text = "Digital Personal Data Protection Act (DPDP Act 2023 Section 6)"
            law_title = "DPDP Act 2023"

        user_name = req.user_full_name or req.user_name or "User"
        user_email = req.user_email or ""
        account_id = req.account_identifier or req.account_id
        custom_notes = req.custom_notes or req.custom_details

        if req.letter_type == LetterType.DELETION:
            subject = f"Formal Request for Permanent Erasure of Personal Data under {law_title} - {user_name}"
            body = f"""Date: {today_str}
To: Data Protection Officer / Privacy Team, {req.company_name}
Subject: {subject}

Dear Data Protection Officer,

I am writing to formally exercise my statutory right to erasure (data deletion) under {legal_framework_text}.

I hereby request the permanent deletion and erasure of all personal data, behavioral telemetry, cookies, and account records concerning me held by {req.company_name} and any third-party processors acting on your behalf.

Associated Identifiers:
- Full Name: {user_name}
- Registered Email: {user_email}
{f"- Account Identifier / Customer ID: {account_id}" if account_id else ""}
{f"- Specific Categories / Scope: {custom_notes}" if custom_notes else ""}

Please confirm in writing once this deletion has been completed within the legally mandated time period.

Sincerely,
{user_name}
{user_email}
"""
        elif req.letter_type == LetterType.ACCESS:
            subject = f"Subject Access Request (SAR) under {law_title} - {user_name}"
            body = f"""Date: {today_str}
To: Data Protection Officer / Privacy Team, {req.company_name}
Subject: {subject}

Dear Privacy Officer,

Please consider this a formal Subject Access Request under {sar_framework_text}.

I request a complete copy of all personal data held by {req.company_name} concerning me, including:
1. Categories of personal data processed.
2. The specific purposes for data processing.
3. Third-party entities or data brokers with whom my data has been shared.

Applicant Details:
- Full Name: {user_name}
- Email: {user_email}
{f"- Account Identifier / Customer ID: {account_id}" if account_id else ""}
{f"- Specific Request Notes: {custom_notes}" if custom_notes else ""}

Kindly provide this disclosure in a structured, commonly used electronic format.

Sincerely,
{user_name}
{user_email}
"""
        else:  # CONSENT_WITHDRAWAL
            subject = f"Formal Notice of Withdrawal of Consent under {law_title} - {user_name}"
            body = f"""Date: {today_str}
To: Privacy Team, {req.company_name}
Subject: {subject}

Dear Privacy Team,

I hereby withdraw all previously granted consent for the collection, tracking, profiling, and marketing use of my personal data under {consent_framework_text} with immediate effect.

Please cease any further commercial processing of my data immediately.

Details:
- Full Name: {user_name}
- Email: {user_email}
{f"- Account Identifier / Customer ID: {account_id}" if account_id else ""}

Sincerely,
{user_name}
"""

        clean_body = body.strip()
        return {
            "id": letter_id,
            "letter_type": req.letter_type,
            "framework": framework_name,
            "company_name": req.company_name,
            "subject": subject,
            "body": clean_body,
            "content": clean_body,
            "recipient_email": req.recipient_email,
            "created_at": created_at,
        }


letter_service = LetterService()
