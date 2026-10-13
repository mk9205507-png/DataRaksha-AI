from datetime import date
from typing import Dict, Any
from app.models.schemas import LetterType, LetterGenerateRequest


class LetterService:
    """Service to format legal data access, deletion, and consent withdrawal letters."""

    @staticmethod
    def generate_letter(req: LetterGenerateRequest) -> Dict[str, Any]:
        today_str = date.today().strftime("%B %d, %Y")

        if req.letter_type == LetterType.DELETION:
            subject = f"REQUEST FOR PERMANENT ERASURE / DELETION OF PERSONAL DATA - {req.user_full_name}"
            body = f"""Date: {today_str}
To: Data Protection Officer / Privacy Team, {req.company_name}
Subject: {subject}

Dear Data Protection Officer,

I am writing to formally exercise my statutory right to erasure (data deletion) under applicable data protection laws (such as the Digital Personal Data Protection Act / GDPR Article 17).

I hereby request the permanent deletion and erasure of all personal data, behavioral telemetry, cookies, and account records concerning me held by {req.company_name} and any third-party processors acting on your behalf.

Associated Identifiers:
- Full Name: {req.user_full_name}
- Registered Email: {req.user_email}
{f"- Additional Context: {req.custom_details}" if req.custom_details else ""}

Please confirm in writing once this deletion has been completed within the legally mandated time period.

Sincerely,
{req.user_full_name}
{req.user_email}
"""
        elif req.letter_type == LetterType.ACCESS:
            subject = f"SUBJECT ACCESS REQUEST (SAR) - {req.user_full_name}"
            body = f"""Date: {today_str}
To: Data Protection Officer / Privacy Team, {req.company_name}
Subject: {subject}

Dear Privacy Officer,

Please consider this a formal Subject Access Request under applicable data protection legislation.

I request a complete copy of all personal data held by {req.company_name} concerning me, including:
1. Categories of personal data processed.
2. The specific purposes for data processing.
3. Third-party entities or data brokers with whom my data has been shared.

Applicant Details:
- Full Name: {req.user_full_name}
- Email: {req.user_email}
{f"- Specific Request Notes: {req.custom_details}" if req.custom_details else ""}

Kindly provide this disclosure in a structured, commonly used electronic format.

Sincerely,
{req.user_full_name}
{req.user_email}
"""
        else:  # CONSENT_WITHDRAWAL
            subject = f"FORMAL NOTICE OF WITHDRAWAL OF CONSENT - {req.user_full_name}"
            body = f"""Date: {today_str}
To: Privacy Team, {req.company_name}
Subject: {subject}

Dear Privacy Team,

I hereby withdraw all previously granted consent for the collection, tracking, profiling, and marketing use of my personal data with immediate effect.

Please cease any further commercial processing of my data immediately.

Details:
- Full Name: {req.user_full_name}
- Email: {req.user_email}

Sincerely,
{req.user_full_name}
"""

        return {
            "letter_type": req.letter_type,
            "company_name": req.company_name,
            "recipient_email": req.recipient_email,
            "content": body.strip(),
        }


letter_service = LetterService()
