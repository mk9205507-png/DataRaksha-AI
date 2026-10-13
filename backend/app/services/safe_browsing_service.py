import logging
from typing import Dict, Any
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

SAFE_BROWSING_V4_URL = "https://safebrowsing.googleapis.com/v4/threatMatches:find"


class SafeBrowsingService:
    """Service client for Google Safe Browsing API v4 URL threat detection."""

    def __init__(self):
        self.api_key = settings.SAFE_BROWSING_API_KEY

    async def check_url(self, url: str) -> Dict[str, Any]:
        """
        Validates target URL against Google Safe Browsing threat databases.
        """
        if not self.api_key or self.api_key == "your_google_safe_browsing_key_here":
            logger.info("Safe Browsing API key not set. Using Phase 0 mock validation.")
            return {
                "risk_level": "Low",
                "risk_score": 5,
                "summary": f"Target link '{url}' evaluated in mock environment. No immediate threats identified.",
                "detected_threats": [],
                "recommendations": ["Never enter account credentials on untrusted domains."],
            }

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
                "threatEntries": [{"url": url}],
            },
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.post(
                    f"{SAFE_BROWSING_V4_URL}?key={self.api_key}",
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                matches = data.get("matches", [])
                if matches:
                    threat_types = [m.get("threatType") for m in matches]
                    return {
                        "risk_level": "High",
                        "risk_score": 90,
                        "summary": f"Known dangerous link detected by Google Safe Browsing: {', '.join(threat_types)}",
                        "detected_threats": [
                            {
                                "category": "Malicious URL",
                                "description": f"Flagged as {m.get('threatType')} on {m.get('platformType')}",
                                "severity": "High",
                            }
                            for m in matches
                        ],
                        "recommendations": ["Do not click this link or download files from it."],
                    }

                return {
                    "risk_level": "Low",
                    "risk_score": 5,
                    "summary": "URL is not listed on Google Safe Browsing threat lists.",
                    "detected_threats": [],
                    "recommendations": ["Always verify SSL certificate before proceeding."],
                }
            except Exception as e:
                logger.error(f"Safe Browsing API lookup error: {e}")
                return {
                    "risk_level": "Medium",
                    "risk_score": 50,
                    "summary": f"Unable to reach Safe Browsing API. Proceed with caution. Error: {str(e)}",
                    "detected_threats": [],
                    "recommendations": ["Exercise extra caution when visiting unverified URLs."],
                }


safe_browsing_service = SafeBrowsingService()
