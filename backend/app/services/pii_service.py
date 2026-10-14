import re
from typing import List, Dict, Any


class PIIService:
    """Service for extracting and detecting Personally Identifiable Information (PII)."""

    # 1. Phone number patterns (Indian + international)
    PHONE_REGEX = re.compile(
        r"(?:(?:\+91|91|0)[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}\b|"
        r"\b\+?[1-9]\d{0,2}[\s\-]?(?:\(\d{1,4}\)|\d{1,4})[\s\-]?\d{3,4}[\s\-]?\d{3,4}\b"
    )

    # 2. Email pattern
    EMAIL_REGEX = re.compile(
        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    )

    # 3. OTP & PIN patterns
    OTP_REGEX = re.compile(
        r"(?i)\b(?:otp|one[\s\-_]?time[\s\-_]?password|verification[\s\-_]?code|security[\s\-_]?code)[\s:=#\-]*([0-9]{4,8})\b"
    )

    # 4. Plaintext password patterns
    PASSWORD_REGEX = re.compile(
        r"(?i)\b(?:password|passwd|pwd|passcode|secret[\s\-_]?key)[\s:=#\-]*([^\s,;]{3,32})\b"
    )

    # 5. Financial: UPI IDs (e.g., user@okhdfcbank, name@upi, etc.)
    # Exclude common email provider domains
    EMAIL_DOMAINS = {
        "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
        "proton.me", "protonmail.com", "mail.com", "zoho.com", "aol.com"
    }
    UPI_REGEX = re.compile(
        r"\b[a-zA-Z0-9.\-_]{2,256}@([a-zA-Z]{2,64})\b"
    )

    # 6. Financial: Credit/Debit card numbers (13-19 digits, commonly 16)
    CARD_REGEX = re.compile(
        r"\b(?:\d{4}[-\s]?){3}\d{4}\b|\b\d{15,16}\b"
    )

    # 7. Financial: Bank Account sequences preceded by account keyword
    BANK_ACC_REGEX = re.compile(
        r"(?i)\b(?:a/c|acct|acc(?:ount)?(?:\s+(?:no|num|number))?)[\s:=#\-]*([0-9]{9,18})\b"
    )

    @classmethod
    def mask_credit_card(cls, card_str: str) -> str:
        """Masks middle digits of a card number for safe reporting."""
        digits = re.sub(r"\D", "", card_str)
        if len(digits) >= 12:
            return f"{digits[:4]}-XXXX-XXXX-{digits[-4:]}"
        return "****-****-****"

    @classmethod
    def mask_phone(cls, phone_str: str) -> str:
        """Masks middle digits of phone number."""
        clean = re.sub(r"[\s\-]", "", phone_str)
        if len(clean) >= 10:
            return f"{clean[:3]}****{clean[-3:]}"
        return phone_str

    @classmethod
    def detect_pii(cls, text: str) -> List[str]:
        """
        Scans text for sensitive PII and returns descriptive tags for each match.
        Example output:
        ['Phone Number: +91-987****210', 'Email Address: victim@example.com', ...]
        """
        detected: List[str] = []
        if not text:
            return detected

        # Detect Emails first to differentiate from UPI
        found_emails = cls.EMAIL_REGEX.findall(text)
        for email in set(found_emails):
            detected.append(f"Email Address: {email}")

        # Detect UPI IDs (matching user@handle where handle is not an email domain)
        upi_matches = cls.UPI_REGEX.finditer(text)
        for match in upi_matches:
            full_match = match.group(0)
            handle = match.group(1).lower()
            if full_match not in found_emails and not any(handle in d for d in cls.EMAIL_DOMAINS):
                detected.append(f"Financial (UPI ID): {full_match}")

        # Detect Phones
        phone_matches = cls.PHONE_REGEX.findall(text)
        for phone in set(phone_matches):
            digits_only = re.sub(r"\D", "", phone)
            # Filter out short or spurious numbers
            if 10 <= len(digits_only) <= 13:
                masked = cls.mask_phone(phone)
                detected.append(f"Phone Number: {masked}")

        # Detect OTPs
        otp_matches = cls.OTP_REGEX.findall(text)
        for otp in set(otp_matches):
            detected.append(f"Authentication Token (OTP): {otp[:2]}**")

        # Detect Passwords
        pwd_matches = cls.PASSWORD_REGEX.findall(text)
        for pwd in set(pwd_matches):
            # Avoid matching words like "is", "required"
            if len(pwd) >= 4 and not pwd.lower() in {"is", "was", "will", "required", "protected"}:
                detected.append("Authentication Credential: Plain-text password/PIN detected")

        # Detect Credit/Debit Cards
        card_matches = cls.CARD_REGEX.findall(text)
        for card in set(card_matches):
            clean_digits = re.sub(r"\D", "", card)
            if 15 <= len(clean_digits) <= 16:
                masked = cls.mask_credit_card(clean_digits)
                detected.append(f"Financial (Card Number): {masked}")

        # Detect Bank Account Numbers
        bank_matches = cls.BANK_ACC_REGEX.findall(text)
        for acc in set(bank_matches):
            detected.append(f"Financial (Bank Account): Ending in ...{acc[-4:]}")

        return list(dict.fromkeys(detected))  # Deduplicate while preserving order


pii_service = PIIService()
