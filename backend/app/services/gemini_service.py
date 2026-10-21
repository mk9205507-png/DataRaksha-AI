import json
import logging
import re
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.models.schemas import ScanType
from app.services.pii_service import pii_service
from app.services.risk_scoring_service import risk_scoring_service

logger = logging.getLogger(__name__)


class GeminiService:
    """Service client for Google Gemini AI natural language threat analysis and policy simplification."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self._client = None
        if self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                for model_name in ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]:
                    try:
                        self._client = genai.GenerativeModel(model_name)
                        logger.info(f"Gemini AI client successfully initialized with {model_name}.")
                        break
                    except Exception:
                        continue
            except Exception as e:
                logger.warning(f"Failed to configure Gemini AI: {e}")
        else:
            logger.info("GEMINI_API_KEY not configured. Running with advanced heuristic engine.")

    # --------------------------------------------------------------------------
    # Helper: Clean JSON string from Gemini markdown wrapping
    # --------------------------------------------------------------------------
    @staticmethod
    def _parse_gemini_json(raw_text: str) -> Optional[Dict[str, Any]]:
        """Extracts JSON object from model response, stripping any markdown backticks."""
        if not raw_text:
            return None
        cleaned = raw_text.strip()
        # Remove ```json ... ``` or ``` ... ```
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```[a-zA-Z]*\n?", "", cleaned)
            cleaned = re.sub(r"\n?```$", "", cleaned)
            cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # Try to find { ... } block inside text
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except Exception:
                    pass
        return None

    # --------------------------------------------------------------------------
    # Heuristic Threat Analyzer (Fallback when Gemini API is unconfigured/offline)
    # --------------------------------------------------------------------------
    @staticmethod
    def _heuristic_analyze_message(content: str, exposed_pii: List[str]) -> Dict[str, Any]:
        """Evaluates message content for phishing cues, social engineering, and scams."""
        lower_content = content.lower()
        threats: List[str] = []
        score = 15

        # Check for Urgency & Coercion
        urgency_patterns = [
            "urgent", "immediately", "suspended", "account blocked", "blocked within",
            "action required", "act now", "limited time", "expire in", "24 hours", "last warning"
        ]
        if any(p in lower_content for p in urgency_patterns):
            threats.append("Urgent pressure tactic designed to prompt immediate action")
            score += 30

        # Check for Impersonation & Financial Scam keywords
        scam_patterns = [
            "lottery", "crypto", "won a prize", "reward points", "claim refund",
            "income tax refund", "kyc update", "pan card", "electricity bill",
            "power cut tonight", "bank alert", "dear customer"
        ]
        if any(p in lower_content for p in scam_patterns):
            threats.append("Financial or official institution impersonation pattern detected")
            score += 35

        # Check for Credential Harvesting / Action Triggers
        action_patterns = [
            "click here", "tap here", "verify your account", "confirm identity",
            "login at", "update password", "share otp", "submit pin"
        ]
        if any(p in lower_content for p in action_patterns):
            threats.append("Deceptive call-to-action attempting credential harvesting")
            score += 25

        # Check for URLs embedded in message
        if "http://" in lower_content or "https://" in lower_content or ".com/" in lower_content:
            threats.append("Suspicious external web link embedded in message")
            score += 15

        # Factor in exposed PII
        if any("Credential" in p or "Financial (Card" in p for p in exposed_pii):
            threats.append("Critical credentials (password, OTP, or credit card) present in raw text")
            score += 40
        elif exposed_pii:
            threats.append(f"Contains sensitive personal identifiers ({len(exposed_pii)} item(s))")
            score += 15

        # Determine Summary
        if score >= 70:
            summary = (
                "This message exhibits strong indicators of a malicious phishing or social engineering scam. "
                "The sender appears to be attempting to extract sensitive personal or financial information."
            )
        elif score >= 40:
            summary = (
                "This message contains suspicious language or personal data that warrants caution. "
                "Verify the sender's identity through official channels before responding."
            )
        else:
            summary = (
                "No critical phishing triggers or malicious patterns were identified in this message. "
                "Continue to exercise standard digital vigilance."
            )

        return {
            "risk_score": min(100, score),
            "summary": summary,
            "detected_threats": threats,
            "recommendations": [],
        }

    # --------------------------------------------------------------------------
    # Heuristic Policy Analyzer (Fallback when Gemini API is unconfigured/offline)
    # --------------------------------------------------------------------------
    @staticmethod
    def _heuristic_simplify_policy(policy_text: str) -> Dict[str, Any]:
        """Scans policy text for data selling, telemetry, biometrics, retention, and deletion."""
        lower_text = policy_text.lower()
        threats: List[str] = []
        recommendations: List[str] = []
        score = 15

        # 1. Data Selling (check for negation such as 'do not sell', 'never sell')
        selling_keywords = [
            "sell your personal data", "sell data", "third-party advertisers", "data brokers",
            "monetize personal information", "share data for advertising", "commercial partners",
        ]
        has_selling = any(k in lower_text for k in selling_keywords)
        negated_selling = bool(re.search(r"(?:do\s+not|never|will\s+not|does\s+not|not|prohibit)\s+(?:sell|share|monetize)", lower_text))
        if has_selling and not negated_selling:
            threats.append("Data Selling: Shares or sells personal data to third-party data brokers/advertisers.")
            recommendations.append("Opt out of third-party advertising and personalized data brokering in account privacy settings.")
            score += 25

        # 2. Location & Telemetry (check for negation such as 'do not track', 'never track')
        loc_keywords = ["precise location", "background location", "continuous tracking", "gps telemetry", "device sensors"]
        has_loc = any(k in lower_text for k in loc_keywords)
        negated_loc = bool(re.search(r"(?:do\s+not|never|will\s+not|does\s+not|not)\s+(?:track|collect|use)\s+(?:your\s+)?location", lower_text))
        if has_loc and not negated_loc:
            threats.append("Location & Telemetry: Collects precise background location and continuous telemetry.")
            recommendations.append("Revoke continuous background location permissions in your device settings.")
            score += 20

        # 3. Retention Limits
        retention_keywords = [
            "indefinitely", "retain your data as long as", "perpetual retention",
            "no specific retention period", "as long as necessary", "indefinite period"
        ]
        has_retention = any(k in lower_text for k in retention_keywords)
        if has_retention:
            threats.append("Retention Limits: Indefinite or ambiguous data retention schedules.")
            recommendations.append("Submit a formal request to enforce deletion of inactive account records.")
            score += 15

        # 4. Biometrics
        biometric_keywords = ["biometric", "facial recognition", "fingerprint", "voiceprint", "geometry of face"]
        has_biometrics = any(k in lower_text for k in biometric_keywords)
        negated_biometrics = bool(re.search(r"(?:do\s+not|never|will\s+not|does\s+not|not)\s+(?:collect|process)\s+(?:biometric)", lower_text))
        if has_biometrics and not negated_biometrics:
            threats.append("Biometrics: Collects or processes sensitive biometric markers.")
            recommendations.append("Review whether biometric data collection is mandatory or optional.")
            score += 20

        # 5. Account Deletion Complexity
        deletion_keywords = ["unable to delete", "may retain certain information even after", "written request by mail to delete", "account deletion is irreversible"]
        has_deletion = any(k in lower_text for k in deletion_keywords)
        if has_deletion:
            threats.append("Account Deletion: Difficult, manual, or restricted account and data deletion procedures.")
            recommendations.append("Request a complete copy of your personal data before closing your account.")
            score += 15

        # Extract structured Policy Categories for detailed breakdown
        data_collected: List[str] = []
        if any(w in lower_text for w in ["gps", "location", "geolocation"]):
            data_collected.append("Precise Real-Time GPS & Location Data")
        if any(w in lower_text for w in ["device", "hardware", "imei", "ip address", "operating system"]):
            data_collected.append("Device Identifiers, IP Address & Telemetry")
        if any(w in lower_text for w in ["contact", "email", "phone", "address"]):
            data_collected.append("Contact Information (Email, Phone, Name)")
        if any(w in lower_text for w in ["biometric", "facial", "face scan", "fingerprint"]):
            data_collected.append("Biometric Facial Geometry & Sensor Scans")
        if any(w in lower_text for w in ["browsing", "cookies", "history", "analytics", "clicks"]):
            data_collected.append("Web Browsing History & Behavioral Footprints")
        if not data_collected:
            data_collected = ["Account Credentials & Operational Service Identifiers"]

        data_usage: List[str] = []
        if any(w in lower_text for w in ["advertising", "personalized ads", "marketing", "profiling"]):
            data_usage.append("Targeted advertising, marketing analytics, and consumer profiling")
        if any(w in lower_text for w in ["operate", "deliver", "provide our", "core functionality"]):
            data_usage.append("Delivering and maintaining core platform functionality")
        if any(w in lower_text for w in ["fraud", "security", "legal", "compliance"]):
            data_usage.append("Fraud detection, abuse prevention, and legal compliance")
        if not data_usage:
            data_usage = ["Service delivery and platform functionality optimization"]

        third_party_sharing: List[str] = []
        if has_selling and not negated_selling:
            third_party_sharing.append("Third-party data brokers, advertising networks, and commercial affiliates")
        if any(w in lower_text for w in ["vendor", "service provider", "contractor", "hosting", "cloud"]):
            third_party_sharing.append("Essential infrastructure cloud providers and technical vendors")
        if any(w in lower_text for w in ["law enforcement", "court", "subpoena", "regulator"]):
            third_party_sharing.append("Law enforcement authorities pursuant to valid legal requests")
        if not third_party_sharing:
            third_party_sharing = ["No aggressive third-party data brokering identified; shared with operational cloud vendors"]

        data_retention = (
            "Data is retained indefinitely or until manually requested for deletion by the data subject."
            if has_retention
            else "Retained for the duration of an active account and as required by statutory law."
        )

        user_rights = [
            "Right to request access and an export copy of personal records",
            "Right to request erasure and complete deletion under Indian DPDP Act 2023 / GDPR",
            "Right to opt out of third-party marketing and behavioral ad tracking",
        ]

        if not threats:
            summary = (
                "Executive Summary: This policy contains standard operational clauses without obvious aggressive "
                "data selling, continuous background telemetry, or biometric harvesting."
            )
            recommendations.append("Review privacy settings periodically to keep permissions restricted.")
        else:
            summary = (
                f"Executive Summary: Identified {len(threats)} notable privacy concerns in this policy, "
                "including terms that may impact user privacy and data ownership."
            )

        return {
            "risk_score": min(100, score),
            "summary": summary,
            "detected_threats": threats,
            "data_collected": data_collected,
            "data_usage": data_usage,
            "third_party_sharing": third_party_sharing,
            "data_retention": data_retention,
            "user_rights": user_rights,
            "recommendations": recommendations,
        }

    # --------------------------------------------------------------------------
    # Module 1: Scan Message / Email
    # --------------------------------------------------------------------------
    async def analyze_message(self, content: str) -> Dict[str, Any]:
        """
        Scans SMS, email, or message body for phishing, social engineering, and exposed PII.
        Synthesizes AI and heuristic insights into a unified report.
        """
        # Step 1: Extract sensitive PII
        exposed_pii = pii_service.detect_pii(content)

        raw_analysis = None
        # Step 2: Query Gemini if available
        if self._client:
            prompt = (
                "System: You are an expert cybersecurity and privacy analyst for DataRaksha AI. "
                "Analyze the user-submitted text/email and return a strict JSON response. "
                "Do NOT store or retain any personal information.\n"
                "Identify:\n"
                "1. Threat indicators (phishing, impersonation, scam, urgency, credential harvesting).\n"
                "2. Risk score (integer between 0 and 100).\n"
                "3. Concise explanation in plain language (no technical jargon).\n"
                "4. Specific, actionable safety recommendations.\n\n"
                f"Message Content to Analyze:\n\"\"\"{content}\"\"\"\n\n"
                "Return strictly valid JSON matching this schema:\n"
                "{\n"
                '  "risk_score": <int 0-100>,\n'
                '  "summary": "<plain text summary>",\n'
                '  "detected_threats": ["<threat 1>", "<threat 2>"],\n'
                '  "recommendations": ["<recommendation 1>", "<recommendation 2>"]\n'
                "}"
            )
            try:
                response = self._client.generate_content(prompt, request_options={"timeout": 8.0})
                if response and response.text:
                    parsed = self._parse_gemini_json(response.text)
                    if parsed and "risk_score" in parsed:
                        raw_analysis = parsed
            except Exception as e:
                logger.warning(f"Gemini API request failed: {e}. Falling back to heuristic analysis.")

        # Step 3: Use Heuristics if Gemini didn't return a valid structure
        if not raw_analysis:
            raw_analysis = self._heuristic_analyze_message(content, exposed_pii)

        # Step 4: Synthesize through Risk Scoring Engine
        return risk_scoring_service.synthesize_report(
            scan_type=ScanType.MESSAGE,
            raw_score=raw_analysis.get("risk_score", 20),
            summary=raw_analysis.get("summary", "Analysis completed."),
            detected_threats=raw_analysis.get("detected_threats", []),
            exposed_pii=exposed_pii,
            recommendations=raw_analysis.get("recommendations", []),
        )

    # --------------------------------------------------------------------------
    # Module 3: Scan Privacy Policy
    # --------------------------------------------------------------------------
    async def simplify_policy(self, policy_text: str) -> Dict[str, Any]:
        """
        Simplifies dense legal terms / privacy policies into plain language summaries
        and extracts critical risk tags: Data Selling, Location Telemetry, Retention, Biometrics, Deletion,
        as well as data collected, data usage, third-party sharing, data retention, and user rights.
        """
        raw_analysis = None
        heuristic_backup = self._heuristic_simplify_policy(policy_text)

        if self._client:
            prompt = (
                "System: You are an expert privacy attorney and cybersecurity analyst for DataRaksha AI.\n"
                "Analyze the provided Privacy Policy / Terms text and return a strict JSON response.\n"
                "Do NOT store or retain any personal information.\n"
                "Extract comprehensive analysis covering:\n"
                "1. Risk Score: integer between 0 and 100 based on user privacy risk.\n"
                "2. Plain-language executive summary.\n"
                "3. Detected threats / risk tags (e.g. Data Selling, Location Telemetry, Retention Limits, Biometrics, Deletion Obstacles).\n"
                "4. Data Collected: list specific types of data collected (e.g., GPS location, contacts, device identifiers, email).\n"
                "5. Data Usage: list how collected data is utilized (e.g., targeted advertising, service delivery, profiling).\n"
                "6. Third-Party Sharing: list who data is shared with or sold to (e.g., data brokers, advertising networks, vendors).\n"
                "7. Data Retention: concise summary of retention terms, duration, or purging commitments.\n"
                "8. User Rights: list statutory rights available (e.g., erasure, access, opt-out, consent withdrawal).\n"
                "9. Actionable Recommendations: specific advice to protect user privacy.\n\n"
                f"Policy Text:\n\"\"\"{policy_text[:12000]}\"\"\"\n\n"
                "Return strictly valid JSON matching this schema:\n"
                "{\n"
                '  "risk_score": <int 0-100>,\n'
                '  "summary": "<plain language executive summary>",\n'
                '  "detected_threats": ["<threat tag 1>", "<threat tag 2>"],\n'
                '  "data_collected": ["<collected item 1>", "<collected item 2>"],\n'
                '  "data_usage": ["<usage item 1>", "<usage item 2>"],\n'
                '  "third_party_sharing": ["<sharing item 1>", "<sharing item 2>"],\n'
                '  "data_retention": "<retention description>",\n'
                '  "user_rights": ["<right 1>", "<right 2>"],\n'
                '  "recommendations": ["<recommendation 1>", "<recommendation 2>"]\n'
                "}"
            )
            try:
                response = self._client.generate_content(prompt, request_options={"timeout": 8.0})
                if response and response.text:
                    parsed = self._parse_gemini_json(response.text)
                    if parsed and "risk_score" in parsed:
                        raw_analysis = parsed
            except Exception as e:
                logger.warning(f"Gemini API policy simplification failed: {e}. Falling back to heuristic analysis.")

        if not raw_analysis:
            raw_analysis = heuristic_backup

        # Build structured policy analysis details
        policy_analysis = {
            "data_collected": (
                raw_analysis.get("data_collected")
                or heuristic_backup.get("data_collected")
                or ["Personal and device data necessary for service operation"]
            ),
            "data_usage": (
                raw_analysis.get("data_usage")
                or heuristic_backup.get("data_usage")
                or ["Core service functionality and user account management"]
            ),
            "third_party_sharing": (
                raw_analysis.get("third_party_sharing")
                or heuristic_backup.get("third_party_sharing")
                or ["Operational vendors and cloud infrastructure partners"]
            ),
            "data_retention": (
                raw_analysis.get("data_retention")
                or heuristic_backup.get("data_retention")
                or "Retained as long as necessary for business purposes and statutory requirements."
            ),
            "user_rights": (
                raw_analysis.get("user_rights")
                or heuristic_backup.get("user_rights")
                or ["Right to access personal records", "Right to request data erasure", "Right to withdraw consent"]
            ),
        }

        # Synthesize base report
        report = risk_scoring_service.synthesize_report(
            scan_type=ScanType.POLICY,
            raw_score=raw_analysis.get("risk_score", heuristic_backup["risk_score"]),
            summary=raw_analysis.get("summary", heuristic_backup["summary"]),
            detected_threats=raw_analysis.get("detected_threats", heuristic_backup["detected_threats"]),
            exposed_pii=[],
            recommendations=raw_analysis.get("recommendations", heuristic_backup["recommendations"]),
        )

        # Attach policy analysis
        report["policy_analysis"] = policy_analysis
        return report



gemini_service = GeminiService()
