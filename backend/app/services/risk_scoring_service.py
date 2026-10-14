from typing import List, Dict, Any, Optional
from app.models.schemas import RiskLevel, ScanType

MANDATORY_DISCLAIMER = (
    "No obvious risks were detected; however, this does not guarantee the content "
    "is completely safe. Always exercise caution when sharing sensitive information online."
)


class RiskScoringService:
    """
    Unified Risk Scoring and Recommendation Engine for DataRaksha AI.
    Translates threat indicators, PII leaks, and AI telemetry into standardized
    risk scores (0–100), risk levels (Low, Medium, High), and tailored recommendations.
    """

    @staticmethod
    def calculate_risk_level(score: int) -> RiskLevel:
        """Determines categorical risk level according to Phase 1 boundaries."""
        if score >= 70:
            return RiskLevel.HIGH
        elif score >= 40:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW

    @staticmethod
    def generate_recommendations(
        scan_type: ScanType,
        risk_level: RiskLevel,
        threats: List[str],
        exposed_pii: List[str],
        custom_recs: Optional[List[str]] = None,
    ) -> List[str]:
        """Synthesizes actionable, non-technical recommendations."""
        recommendations: List[str] = list(custom_recs or [])

        # High Risk Guidance
        if risk_level == RiskLevel.HIGH:
            if scan_type in (ScanType.MESSAGE, ScanType.LINK):
                if not any("Do not click" in r for r in recommendations):
                    recommendations.insert(0, "Do not click on links, download attachments, or call numbers from this message.")
            if exposed_pii:
                recommendations.append("If passwords or payment credentials were submitted, change them immediately and contact your bank.")
            recommendations.append("Report this message or URL to your IT security administrator or cybercrime helpline.")

        # Medium Risk Guidance
        elif risk_level == RiskLevel.MEDIUM:
            recommendations.append("Verify the sender's identity through an official website or verified phone line before proceeding.")
            if exposed_pii:
                recommendations.append("Avoid disclosing personal identifiers (phone, email, identity documents) over unverified channels.")
            if scan_type == ScanType.POLICY:
                recommendations.append("Review third-party data sharing and opt out of advertising telemetry in account settings.")

        # Low Risk Guidance
        else:
            if not recommendations:
                recommendations.append("Content appears safe, but maintain standard digital vigilance.")
                recommendations.append("Never share one-time passwords (OTPs) or PINs with anyone.")

        # Deduplicate and return top actionable items
        unique_recs = []
        for r in recommendations:
            if r and r not in unique_recs:
                unique_recs.append(r)
        return unique_recs[:5]

    @classmethod
    def synthesize_report(
        cls,
        scan_type: ScanType,
        raw_score: int,
        summary: str,
        detected_threats: List[str],
        exposed_pii: List[str],
        recommendations: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Builds the unified Phase 1 scan report adhering strictly to the contract.
        """
        # Adjust score upwards if critical vulnerabilities or credentials are exposed
        adjusted_score = raw_score
        has_credentials = any("Credential" in p or "Financial (Card" in p for p in exposed_pii)
        has_severe_threats = any(
            any(w in t.lower() for w in ["phishing", "malware", "impersonation", "social engineering", "trojan"])
            for t in detected_threats
        )

        if has_severe_threats and adjusted_score < 75:
            adjusted_score = 85
        elif has_credentials and adjusted_score < 75:
            adjusted_score = 80
        elif exposed_pii and adjusted_score < 40:
            adjusted_score = 45

        # Clamp between 0 and 100
        final_score = max(0, min(100, adjusted_score))
        risk_level = cls.calculate_risk_level(final_score)

        final_recommendations = cls.generate_recommendations(
            scan_type=scan_type,
            risk_level=risk_level,
            threats=detected_threats,
            exposed_pii=exposed_pii,
            custom_recs=recommendations,
        )

        return {
            "scan_type": scan_type,
            "risk_level": risk_level,
            "risk_score": final_score,
            "summary": summary,
            "detected_threats": detected_threats,
            "exposed_pii": exposed_pii,
            "recommendations": final_recommendations,
            "disclaimer": MANDATORY_DISCLAIMER,
        }


risk_scoring_service = RiskScoringService()
