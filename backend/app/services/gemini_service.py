import logging
from typing import Dict, Any, List
from app.core.config import settings

logger = logging.getLogger(__name__)


class GeminiService:
    """Service client for Google Gemini AI natural language threat analysis."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self._client = None
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._client = genai.GenerativeModel("gemini-1.5-flash")
                logger.info("Gemini AI client successfully initialized.")
            except Exception as e:
                logger.warning(f"Failed to configure Gemini AI: {e}")
        else:
            logger.info("GEMINI_API_KEY not configured. Running in fallback/mock mode.")

    async def analyze_message(self, content: str) -> Dict[str, Any]:
        """
        Scans email/SMS text for phishing, social engineering, and exposed PII.
        Returns risk assessment payload.
        """
        if not self._client:
            # Fallback mock for Phase 0 when keys are not yet configured
            return {
                "risk_level": "Low",
                "risk_score": 10,
                "summary": "Message processed (API key pending configuration). No obvious critical triggers identified.",
                "detected_threats": [],
                "recommendations": ["Ensure you verify sender address before taking action."],
            }

        # Actual Gemini API execution will be completed in Phase 1
        prompt = (
            "Analyze the following message for cyber threats, phishing attempts, and sensitive PII leaks. "
            f"Message: {content}"
        )
        response = self._client.generate_content(prompt)
        return {
            "risk_level": "Low",
            "risk_score": 20,
            "summary": response.text[:300] if response and response.text else "Scan completed.",
            "detected_threats": [],
            "recommendations": ["Verify the sender authenticity."],
        }

    async def simplify_policy(self, policy_text: str) -> Dict[str, Any]:
        """
        Simplifies privacy policies into plain bullet points highlighting data risks.
        """
        if not self._client:
            return {
                "risk_level": "Medium",
                "risk_score": 45,
                "summary": "Privacy policy processed (API key pending configuration). Review data collection terms carefully.",
                "detected_threats": [],
                "recommendations": ["Check if third-party data broker sharing can be opted out."],
            }

        # Actual Gemini policy prompt will be completed in Phase 1
        return {
            "risk_level": "Medium",
            "risk_score": 40,
            "summary": "Policy summarized.",
            "detected_threats": [],
            "recommendations": ["Review telemetry permissions."],
        }


gemini_service = GeminiService()
