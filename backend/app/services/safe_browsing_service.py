import ipaddress
import logging
import re
from typing import Dict, Any, List, Tuple
from urllib.parse import urlparse
import httpx
from app.core.config import settings
from app.core.exceptions import InvalidURLException
from app.models.schemas import ScanType
from app.services.risk_scoring_service import risk_scoring_service

logger = logging.getLogger(__name__)

SAFE_BROWSING_V4_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"

# Google Safe Browsing official test URLs
TEST_MALICIOUS_URLS = {
    "malware.testing.google.test": "MALWARE",
    "testsafebrowsing.appspot.com/s/phishing.html": "SOCIAL_ENGINEERING",
    "testsafebrowsing.appspot.com/s/malware.html": "MALWARE",
}


class SafeBrowsingService:
    """Service client for Google Safe Browsing API v4 URL threat detection."""

    def __init__(self):
        self.api_key = settings.SAFE_BROWSING_API_KEY

    # --------------------------------------------------------------------------
    # Pre-lookup Normalization, Sanitization & Heuristic Checks
    # --------------------------------------------------------------------------
    @staticmethod
    def sanitize_and_validate_url(raw_url: str) -> Tuple[str, List[str], int]:
        """
        Normalizes target URL (auto-prepends https:// if missing), validates
        format, and flags suspicious pre-lookup signals (IP host, deep subdomains, suspicious TLDs).
        Raises InvalidURLException if URL structure is unparseable.
        """
        url = raw_url.strip()
        if not url:
            raise InvalidURLException("Please enter a valid web address (e.g., https://example.com).")

        # Auto-prepend https:// if protocol is omitted
        if not re.match(r"^[a-zA-Z][a-zA-Z0-9+\-.]*://", url):
            url = f"https://{url}"

        try:
            parsed = urlparse(url)
        except Exception:
            raise InvalidURLException("Please enter a valid web address (e.g., https://example.com).")

        if parsed.scheme not in ("http", "https"):
            raise InvalidURLException("Please enter a valid web address (e.g., https://example.com).")

        hostname = (parsed.hostname or "").lower().strip()
        if (
            not hostname
            or "." not in hostname
            or hostname.startswith(".")
            or hostname.endswith(".")
            or any(not label for label in hostname.split("."))
        ):
            raise InvalidURLException("Please enter a valid web address (e.g., https://example.com).")

        threats: List[str] = []
        heuristic_score = 5

        # 1. IP-based URL detection
        try:
            ipaddress.ip_address(hostname)
            threats.append("IP-Address Hostname: Direct IP address used instead of verified domain name")
            heuristic_score += 40
        except ValueError:
            pass

        # 2. Excessive Subdomain Depth (e.g. login.secure.update.bank.com.xyz)
        subdomain_parts = hostname.split(".")
        if len(subdomain_parts) > 4:
            threats.append(f"Excessive Subdomain Depth ({len(subdomain_parts) - 2} levels): Possible domain disguise tactic")
            heuristic_score += 25

        # 3. Suspicious or high-risk TLD patterns
        suspicious_tlds = {".xyz", ".top", ".tk", ".ml", ".ga", ".cf", ".gq", ".click", ".download", ".work"}
        if any(hostname.endswith(tld) for tld in suspicious_tlds):
            threats.append(f"High-Risk TLD: Domain uses a top-level domain frequently associated with spam/phishing")
            heuristic_score += 20

        # 4. Deceptive Brand Keywords in Subdomains
        deceptive_cues = ["secure-login", "bank-update", "verify-account", "paypal-auth", "support-desk"]
        if any(cue in hostname for cue in deceptive_cues):
            threats.append("Deceptive Domain Masking: Suspicious credential-related keywords detected in hostname")
            heuristic_score += 35

        return url, threats, heuristic_score

    # --------------------------------------------------------------------------
    # Module 2: Link / URL Safety Evaluation
    # --------------------------------------------------------------------------
    async def check_url(self, raw_url: str) -> Dict[str, Any]:
        """
        Validates target URL against Google Safe Browsing threat databases
        and pre-lookup heuristic analyzers.
        """
        normalized_url, pre_threats, heuristic_score = self.sanitize_and_validate_url(raw_url)

        detected_threats = list(pre_threats)
        recommendations: List[str] = []
        api_score = heuristic_score
        summary = ""

        # Check for Google Safe Browsing official test strings
        for test_marker, threat_type in TEST_MALICIOUS_URLS.items():
            if test_marker in normalized_url:
                detected_threats.append(f"Google Safe Browsing Test Match: {threat_type}")
                return risk_scoring_service.synthesize_report(
                    scan_type=ScanType.LINK,
                    raw_score=95,
                    summary=f"Critical threat detected: Target URL matched Google Safe Browsing test blacklist for {threat_type}.",
                    detected_threats=detected_threats,
                    exposed_pii=[],
                    recommendations=["Do not visit this URL. The destination is flagged as high-risk."],
                )

        # Check live Google Safe Browsing API v4 if key is provided
        if self.api_key and self.api_key != "your_google_safe_browsing_key_here":
            payload = {
                "client": {"clientId": "dataraksha-ai", "clientVersion": "1.0.0"},
                "threatInfo": {
                    "threatTypes": [
                        "MALWARE",
                        "SOCIAL_ENGINEERING",
                        "UNWANTED_SOFTWARE",
                        "POTENTIALLY_HARMFUL_APPLICATION",
                    ],
                    "platformTypes": ["ANY_PLATFORM"],
                    "threatEntryTypes": ["URL"],
                    "threatEntries": [{"url": normalized_url}],
                },
            }

            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    response = await client.post(
                        f"{SAFE_BROWSING_V4_URL}?key={self.api_key}",
                        json=payload,
                    )
                    if response.status_code == 200:
                        data = response.json()
                        matches = data.get("matches", [])
                        if matches:
                            threat_types = [m.get("threatType") for m in matches]
                            for m in matches:
                                detected_threats.append(
                                    f"Google Safe Browsing: {m.get('threatType')} on {m.get('platformType')}"
                                )
                            api_score = 92
                            summary = f"Flagged as malicious by Google Safe Browsing: {', '.join(threat_types)}."
                            recommendations.append("Do not open this link or download files from this site.")
                        else:
                            if not detected_threats:
                                summary = f"Target link '{normalized_url}' is not listed in Google Safe Browsing threat databases."
                                api_score = 5
                    else:
                        logger.warning(f"Safe Browsing API responded with status {response.status_code}")
            except Exception as e:
                logger.error(f"Error connecting to Google Safe Browsing API: {e}")

        # If live API was not called or gave no match
        if not summary:
            if detected_threats:
                summary = f"Identified {len(detected_threats)} suspicious heuristic indicators for target link '{normalized_url}'."
            else:
                summary = f"Target link '{normalized_url}' passed initial threat checks without matching known malware or phishing databases."
                recommendations.append("Ensure the URL begins with HTTPS and verify the exact domain spelling.")

        return risk_scoring_service.synthesize_report(
            scan_type=ScanType.LINK,
            raw_score=api_score,
            summary=summary,
            detected_threats=detected_threats,
            exposed_pii=[],
            recommendations=recommendations,
        )


safe_browsing_service = SafeBrowsingService()
